"""Lossless stage46 SVG extraction with all native clips/symbol instances.
Diagnostic group separation only: exterior groups also contain original ledges
and ornaments, so these exports are NOT an automatic semantic BODY/PROPS split.
"""
from pathlib import Path
import json, hashlib, argparse
from lxml import etree as E
from PIL import Image
import numpy as np
R=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,default=R/'_local/stage46/source.json');p.add_argument('--out',type=Path,default=R/'_local/stage46/source-export');a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
original=a.source.read_bytes();v=json.loads(original)['vector'];S='http://www.w3.org/2000/svg';X='http://www.w3.org/1999/xlink'
def emit(parent,n):
 attrs={}
 for k,val in n.items():
  if k in ('tag','children'):continue
  if k in ('sourcePath','d'):attrs['d']=val
  elif k=='dParts':attrs['d']=' '.join(val)
  elif k=='transform':attrs[k]='matrix('+','.join(map(str,val))+')'
  elif k=='clipPath':attrs['clip-path']='url(#'+val+')'
  elif k=='symbol':attrs['{'+X+'}href']='#'+val
  elif k=='fillRule':attrs['fill-rule']=val
  else:attrs[k]=str(val)
 el=E.SubElement(parent,'{'+S+'}'+n['tag'],**attrs)
 for c in n.get('children',[]):emit(el,c)
 return el
sets={'source':list(range(6)),'exterior-body-mixed':[0,1],'west-mixed':[0],'east-basin-mixed':[1],'interior-protected':[2,3,4,5]}
for name,indices in sets.items():
 root=E.Element('{'+S+'}svg',nsmap={None:S,'xlink':X},viewBox=' '.join(map(str,v['viewBox'])))
 defs=E.SubElement(root,'{'+S+'}defs')
 for key,paths in v.get('clips',{}).items():
  cp=E.SubElement(defs,'{'+S+'}clipPath',id=key,clipPathUnits='userSpaceOnUse');E.SubElement(cp,'{'+S+'}path',d=' '.join(paths))
 for key,node in v.get('symbols',{}).items():emit(defs,node).set('id',key)
 group=E.SubElement(root,'{'+S+'}g',**({'transform':'matrix('+','.join(map(str,v['root']['transform']))+')'} if v['root'].get('transform') else {}))
 for i in indices:emit(group,v['root']['children'][i])
 E.ElementTree(root).write(str(a.out/(name+'.svg')),encoding='utf-8',xml_declaration=True)
 # Every reference must resolve, including symbols nested inside symbols.
 ids={e.get('id') for e in root.iter() if e.get('id')}
 for el in root.iter():
  href=el.get('{'+X+'}href');clip=el.get('clip-path')
  if href:assert href[1:] in ids
  if clip:assert clip[5:-1] in ids
report={'sourceSha256':hashlib.sha256(original).hexdigest(),'viewBox':v['viewBox'],'worldScale':4,'exports':sets,'clips':list(v['clips']),'symbols':list(v['symbols']),'semanticWarning':'No clean props-only group exists. Children0/1 contain the original exterior geology, gold contact faces, and props. Keep them unchanged; protect children2..5 entirely.','safeOverlapROI':{'west':[0,0,30,1536],'east':[994,0,1024,1536],'bottom':[0,1500,1024,1536]},'maskRequirement':'Intersect seam ROI with original clips a/b; never rectangular-fill the lower gap between west wall and basin. Final seam must follow registered generated/native color contours, not these ROI rectangle boundaries.'}
img=a.source.parent/'source.png'
if img.exists():
 ar=np.asarray(Image.open(img).convert('RGBA'))
 def runs(vec):
  ids=np.flatnonzero(vec);return [[int(g[0]),int(g[-1])] for g in np.split(ids,np.where(np.diff(ids)>1)[0]+1) if len(g)]
 report['sourceRasterSize']=[ar.shape[1],ar.shape[0]]
 report['bottomOpaqueRuns']={str(y):runs(ar[y,:,3]>128) for y in [1500,1510,1520,1535]}
 report['outerEdgeSampleColors']={side:{str(y):ar[y,x].tolist() for y in [0,200,400,600,800,1000,1200,1400,1535]} for side,x in [('west',0),('east',1023)]}
assert a.source.read_bytes()==original
(a.out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
