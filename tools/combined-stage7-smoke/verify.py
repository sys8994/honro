import json
from pathlib import Path
from PIL import Image,ImageChops
def compare(path, tags, exact):
 p=Path('_local/reports')/path
 a,b=[json.loads((p/tag/'report.json').read_text())['rows'] for tag in tags]
 out=[]
 for u,v in zip(a,b,strict=True):
  n=u['label']
  for k in ('stage','label','camera','canvas','gameplaySha256','projectStage'):
   assert u[k]==v[k],(n,k)
  for k in ('support','units','taperPresent','stageSourceSha256','readability'):
   assert u.get(k)==v.get(k),(n,k)
  if u['stage']==3: assert u['taperPresent'] is True
  if u['stage']==41:
   assert not any(not s['walkable'] and s['a']=={'x':250,'y':2785} and s['z']=={'x':250,'y':2343.75}
      for g in v['readability'] if g['id']=='a5-lower-road' for s in g['segments'])
  x,y=[Image.open(p/tag/f'{n}.png').convert('RGB') for tag in tags]
  diff=ImageChops.difference(x,y)
  maxdelta=max(hi for lo,hi in diff.getextrema());assert maxdelta<=int(not exact),(n,maxdelta)
  out.append({'stage':u['stage'],'view':n,'matchedCameraPhysicsAndReadability':True,'pixelDiffBounds':diff.getbbox(),'maxDelta':maxdelta})
 return out
out=compare('stage3-source',('baseline','candidate'),False)+compare('stage41-closure-built',('stock','integrated'),True)
Path('_local/reports/stage7-closure/regressions.json').write_text(json.dumps(out,indent=2));print(out)
