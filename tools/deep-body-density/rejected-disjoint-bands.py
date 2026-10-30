#!/usr/bin/env python3
"""Native Inkscape union/intersection of existing optimized geology, by contact depth."""
import copy,json,os,subprocess,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
env={**os.environ,'INKSCAPE_PROFILE_DIR':'/tmp/honro-depthfade-profile','XDG_CACHE_HOME':'/tmp/honro-depthfade-cache'}
def ink(src,dst,actions):
 subprocess.run(['inkscape',str(src),'--export-plain-svg','--export-type=svg',f'--export-filename={dst}',f'--actions={actions}'],env=env,check=True,stdout=subprocess.DEVNULL)
def color(e):return e.get('style','').split('fill:')[1].split(';')[0] if 'fill:' in e.get('style','') else e.get('fill','#000000')
def mix(a,b,f):return '#'+''.join(f'{round(int(a[i:i+2],16)*f+int(b[i:i+2],16)*(1-f)):02x}' for i in [1,3,5])
records=[]
for n,base,source,protected in [(31,'#475760','body-unioned.svg',['path15']),(32,'#283344','body-unioned.svg',['path11','path10','path9','path8','path7']),(33,'#2d4350','body-final.svg',['path11','path10'])]:
 old=Path(f'art/stage{n}-density-v2');out=Path(f'art/stage{n}-density-depthfade');out.mkdir(exist_ok=True)
 cfg=json.loads((old/'body-config.json').read_text());cfg['id']=f's{n}-density:body-depthfade';cfg['params']['artEdit']='Source-derived Inkscape union full silhouette plus original contact-protected forms fading with depth. Intentional art recomposition, not fidelity optimization.'
 (out/'body-config.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2));root=E.parse(old/source).getroot();ps=[e for e in root.iter() if e.tag.endswith('path')];ids=[e.get('id')for e in ps]
 unionin=copy.deepcopy(root)
 for e in unionin.iter():
  if e.tag.endswith('path'):e.set('style',f'fill:{base}');e.attrib.pop('fill',None)
 E.ElementTree(unionin).write(out/'silhouette-input.svg');ink(out/'silhouette-input.svg',out/'silhouette-union.svg','select-by-id:'+','.join(ids)+';path-union')
 # Derive top chain from existing physics clip. No authored silhouette change.
 pts=[]
 for seg in parse_path(cfg['bodyClip'][0]):
  for z in [seg.start,seg.end]:
   if z.imag<10000 and (not pts or pts[-1]!=(z.real,z.imag)):pts.append((z.real,z.imag))
 # Retain minimum y at duplicate x; these stages have slopes, not vertical stairs.
 q={}
 for x,y in pts:q[x]=min(q.get(x,y),y)
 pts=sorted(q.items());a,_,_,d,tx,ty=cfg['transform'];bandroot=E.Element(root.tag,root.attrib);actions=[];palette=[]
 bands=[(0,120,1),(120,240,.55),(240,380,.27),(380,550,.09)]
 for bi,(lo,hi,f) in enumerate(bands):
  world= [(x,y+lo)for x,y in pts]+[(x,y+hi)for x,y in pts[::-1]]
  polygon='M'+' L'.join(f'{(x-tx)/a:.8f} {(y-ty)/d:.8f}'for x,y in world)+' Z'
  for pi,p in enumerate(ps):
   # Preserve full original paint stack: broad topsoil masks are occluded by later rock masks.
   x=copy.deepcopy(p);pid=f'b{bi}p{pi}';bid=f'b{bi}c{pi}';x.set('id',pid);new=mix(color(p),base,f);x.set('style',f'fill:{new}');x.attrib.pop('fill',None);bandroot.append(x);E.SubElement(bandroot,'{'+NS+'}path',{'id':bid,'d':polygon,'style':f'fill:{new}'})
   actions.append(f'select-clear;select-by-id:{pid},{bid};path-intersection');palette.append({'source':p.get('id'),'range':[lo,hi],'fill':new})
 E.ElementTree(bandroot).write(out/'bands-boolean-input.svg');ink(out/'bands-boolean-input.svg',out/'bands-boolean.svg',';'.join(actions))
 final=E.Element(root.tag,root.attrib)
 for e in E.parse(out/'silhouette-union.svg').getroot():
  if e.tag.endswith('path') or e.tag.endswith('g'):final.append(copy.deepcopy(e))
 for e in E.parse(out/'bands-boolean.svg').getroot():
  if e.tag.endswith('path') or e.tag.endswith('g'):final.append(copy.deepcopy(e))
 # No source mask may be moved above its occluders.
 E.ElementTree(final).write(out/'body-final.svg')
 subprocess.run(['python3','tools/vector-production/import-svg.py',str(out/'body-final.svg'),'--config',str(out/'body-config.json'),'--output',str(out/'body-asset.json')],check=True)
 asset=json.loads((out/'body-asset.json').read_text());rec={'stage':n,'asset':str(out/'body-asset.json'),'baseColor':base,'source':str(old/source),'nativeOperations':['path-union','path-intersection'],'bandsWorld':[0,120,240,380,550],'protectedContactDepthWorld':120,'originalPaintOrderPreserved':True,'palette':palette,'runtimeBytes':(out/'body-asset.json').stat().st_size,'nodes':asset['params']['nodeCount'],'visualApproval':False,'scope':'Intentional art recomposition. Physical clip, transform, bounds, anchors unchanged. Not a bounded-fidelity claim to prior art.'};(out/'report.json').write_text(json.dumps(rec,indent=2));records.append(rec);print(n,rec['runtimeBytes'],rec['nodes'],flush=True)
Path('tools/deep-body-density/manifest.json').write_text(json.dumps(records,indent=2))
