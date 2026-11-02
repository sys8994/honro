#!/usr/bin/env python3
"""Same canonical clip and underpaint as native preview, in source coordinates."""
from pathlib import Path
import json,xml.etree.ElementTree as E,copy
import sys
r=Path(sys.argv[1]);s=json.loads((r/('effective-source.json' if (r/'effective-source.json').exists() else 'original-effective-source.json')).read_text());ns='{http://www.w3.org/2000/svg}';E.register_namespace('','http://www.w3.org/2000/svg')
for name in ['floor-west','floor-under','floor-east','roof']:
 p=r/name;c=json.loads((p/'config.json').read_text());a,_,_,d,x,y=c['transform'];paths=[];insets=[]
 for host in c['params']['bodyTerrainIds']:
  ps=next(t['vertices']for t in s['world']if t['id']==host);physical=next(t for t in s['terrain']if t['id']==host);base=physical['vertices'];edges=physical.get('honroWalkEdges')or[i for i,q in enumerate(base)if base[(i+1)%len(base)]['x']>q['x']+1e-7];walk=[v for i in edges for v in [base[i],base[(i+1)%len(base)]]]
  def path(inset=False):
   vals=[]
   for q in ps:
    yy=q['y']+(4 if inset and any(abs(v['x']-q['x'])<.01 and abs(v['y']-q['y'])<.01 for v in walk)else 0);vals.append(f"{(q['x']-x)/a:.12g},{(yy-y)/d:.12g}")
   return'M'+'L'.join(vals)+'Z'
  paths.append(path());insets.append(path(True))
 for f in ['world.svg','candidate-final.svg']:
  if not(p/f).exists():continue
  tree=E.parse(p/f);root=tree.getroot();children=list(root);root[:]=[];defs=E.SubElement(root,ns+'defs');cl=E.SubElement(defs,ns+'clipPath',{'id':'canonicalSolid'});E.SubElement(cl,ns+'path',{'d':' '.join(paths)});ci=E.SubElement(defs,ns+'clipPath',{'id':'contactInset'});E.SubElement(ci,ns+'path',{'d':' '.join(insets)});g=E.SubElement(root,ns+'g',{'clip-path':'url(#canonicalSolid)'});g=E.SubElement(g,ns+'g',{'clip-path':'url(#contactInset)'})
  if not c['params']['localMaterial']:E.SubElement(g,ns+'path',{'d':' '.join(paths),'fill':c['params']['bodyBaseColor']})
  g.extend(children);tree.write(p/('composed-'+f),encoding='utf-8',xml_declaration=True)
 cfg=json.loads((p/'pixel-config.json').read_text());cfg['protectedRgbQuantizationTolerance255']=1;cfg['composition']='Identical canonicalSolid/contactInset and underpaint as native renderer; original source SVG remains immutable. Quantization allowance only RGB <=1 and identical alpha per pixel.';(p/'pixel-composed.json').write_text(json.dumps(cfg,indent=2))
