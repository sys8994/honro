"""RAW/final comparison in identical actual canonical BODY clip/contact/base context.
Local skins have their two darkest underpaint layers omitted exactly as native preview; their
background is the immutable domain trace, transformed into local source pixels.
"""
from pathlib import Path
import json,sys,copy,xml.etree.ElementTree as E
base=Path(sys.argv[1]);part=sys.argv[2];candidate=sys.argv[3];p=base/part;rootrepo=Path(__file__).resolve().parents[2];s=json.load(open(rootrepo/'_local/reports/stage14-original/source.json'));c=json.load(open(p/'config.json'));a,_,_,d,x,y=c['transform'];ns='{http://www.w3.org/2000/svg}';E.register_namespace('',ns[1:-1]);paths=[];insets=[]
for host in c['params']['bodyTerrainIds']:
 ps=next(t['vertices']for t in s['world']if t['id']==host);physical=next(t for t in s['terrain']if t['id']==host);bp=physical['vertices'];walk=[v for i in physical.get('honroWalkEdges',[])for v in[bp[i],bp[(i+1)%len(bp)]]]
 if sum(q['x']*ps[(i+1)%len(ps)]['y']-ps[(i+1)%len(ps)]['x']*q['y']for i,q in enumerate(ps))<0:ps=list(reversed(ps))
 def path(inset=False):
  return 'M'+'L'.join(f"{(q['x']-x)/a:.15g},{(q['y']+(4 if inset and any(abs(v['x']-q['x'])<.01 and abs(v['y']-q['y'])<.01 for v in walk)else 0)-y)/d:.15g}"for q in ps)+'Z'
 paths.append(path());insets.append(path(True))
skin=part.startswith(('upper-','refuge-','vault-'));domain=base/'domain-v3';dc=json.load(open(domain/'config.json'));da,_,_,dd,dx,dy=dc['transform']
for label,file in [('raw',p/'trace/raw.svg'),('candidate',p/candidate)]:
 r=E.parse(file).getroot();children=copy.deepcopy(list(r));r[:]=[];defs=E.SubElement(r,ns+'defs')
 for key,ds in [('solid',paths),('contact',insets)]:cl=E.SubElement(defs,ns+'clipPath',{'id':key});E.SubElement(cl,ns+'path',{'d':' '.join(ds)})
 g=E.SubElement(r,ns+'g',{'clip-path':'url(#solid)'});g=E.SubElement(g,ns+'g',{'clip-path':'url(#contact)'});E.SubElement(g,ns+'path',{'d':' '.join(paths),'fill':'#293a3e'})
 if skin:
  bg=E.SubElement(g,ns+'g',{'transform':f'matrix({da/a:.15g} 0 0 {dd/d:.15g} {(dx-x)/a:.15g} {(dy-y)/d:.15g})'});bg.extend(copy.deepcopy(list(E.parse(domain/'trace/raw.svg').getroot())));children=children[2:]
 g.extend(children);E.ElementTree(r).write(p/f'composed-{label}.svg',encoding='utf-8',xml_declaration=True)
cfg=json.load(open(p/'pixel-config.json'));cfg['composition']='Exact native canonicalSolid/contactInset; actual underpaint and immutable domain context; two darkest complete local skin base colors omitted identically to native. Original free SVG remains immutable and separately reported.';(p/'pixel-composed.json').write_text(json.dumps(cfg,indent=2)+'\n')
