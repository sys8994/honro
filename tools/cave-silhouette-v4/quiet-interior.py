"""Deliberate art cleanup of reviewed decorative scan speckles, not lossless optimization.
Outer silhouette path8 and all large stone planes remain unchanged.
"""
from pathlib import Path
import xml.etree.ElementTree as E,json,hashlib
from svgpathtools import parse_path
D=Path('art/stage38-silhouette-v4');src=D/'shallow-optimization/simplify-0.0003.svg';r=E.parse(src).getroot();changes=[]
for e in r.iter():
 if not e.tag.endswith('path') or e.attrib.get('id')=='path8':continue
 p=parse_path(e.attrib['d']);sub=p.continuous_subpaths();keep=[];removed=[]
 for i,s in enumerate(sub):
  area=abs(s.area())
  if i>0 and area<1000:removed.append({'subpath':i,'area':area})
  else:keep.append(s)
 if removed:
  e.set('d',' '.join(s.d(use_closed_attrib=True) for s in keep));changes.append({'id':e.attrib['id'],'removed':removed})
for par in r.iter():
 for e in list(par):
  if e.attrib.get('id')=='path3':
   par.remove(e);changes.append({'id':'path3','removed':[],'reason':'Remove entire cosmetic intermediate shade layer after normal/mobile review: connected mottling survives small-contour cleanup; outer silhouette and broad primary shadow path2 stay unchanged.'})
for e in r.iter():
 if e.attrib.get('id')=='path2':
  e.set('style','fill:#1c3141');changes.append({'id':'path2','removed':[],'reason':'Root visual review: reduce broad interior shadow contrast approximately25% without changing boundary geometry.','from':'#172b3a','to':'#1c3141'})
E.ElementTree(r).write(D/'roof-shallow-final.svg')
(D/'interior-art-edit.json').write_text(json.dumps({'source':str(src),'kind':'Intentional semantic reauthoring; removes small decorative rock flecks after direct close/normal view. No structural/sign/face features in this isolated roofasset. Not claimed errorbounded to raw.','protectedUnchanged':'path8 entire lower/outer silhouette','changes':changes,'removedCount':sum(len(c['removed']) for c in changes)},indent=2))
