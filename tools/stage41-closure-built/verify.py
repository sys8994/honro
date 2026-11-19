import json
from pathlib import Path
from PIL import Image,ImageChops
p=Path('_local/reports/stage41-closure-built');a=json.loads((p/'stock/report.json').read_text());b=json.loads((p/'integrated/report.json').read_text());rows=[]
for u,v in zip(a['rows'],b['rows'],strict=True):
 for key in ['camera','canvas','tide','gameplaySha256','stageSourceSha256','stage','label','projectStage']:assert u[key]==v[key],(key,u[key],v[key])
 label=u['label'];x=Image.open(p/'stock'/f'{label}.png').convert('RGB');y=Image.open(p/'integrated'/f'{label}.png').convert('RGB');bounds=ImageChops.difference(x,y).getbbox()
 if u['stage']==42:assert bounds is None and u['readability']==v['readability']
 else:
  assert bounds is not None
  removed=[]
  for old,new in zip(u['readability'],v['readability'],strict=True):
   assert old['id']==new['id']
   assert [s for s in old['segments'] if s['walkable']]==[s for s in new['segments'] if s['walkable']]
   assert all(s in old['segments'] for s in new['segments'])
   removed.extend([{'id':old['id'],**s} for s in old['segments'] if s not in new['segments']])
  assert removed==[{'id':'a5-lower-road','a':{'x':250,'y':2785},'z':{'x':250,'y':2343.75},'walkable':False}],removed
 rows.append({'stage':u['stage'],'sameSource':True,'samePhysics':True,'sameCamera':True,'pixelDiffBounds':bounds})
(p/'verification.json').write_text(json.dumps({'rows':rows,'removedInkOnly':removed,'allWalkableSegmentsEqual':True,'scope':'Built normal launch and localized buried closure ink only. No broader art or full-play claim. No deployment.'},indent=2));print('Stage41 built source/collision/walkable parity passed; only exact buried ink removed')
