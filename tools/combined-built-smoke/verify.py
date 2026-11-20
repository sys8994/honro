import json,os
from pathlib import Path
from PIL import Image,ImageChops
p=Path('_local/reports/combined-built-smoke')
a=json.loads((p/'stock/report.json').read_text());b=json.loads((p/'integrated/report.json').read_text())
rows=[];removed=[]
for u,v in zip(a['rows'],b['rows'],strict=True):
 for key in ['camera','canvas','tide','gameplaySha256','stage','label','projectStage']:
  assert u[key]==v[key],(key,u[key],v[key])
 if u['stage']!=33:assert u['stageSourceSha256']==v['stageSourceSha256'],u['stage']
 label=u['label'];x=Image.open(p/'stock'/f'{label}.png').convert('RGB');y=Image.open(p/'integrated'/f'{label}.png').convert('RGB');bounds=ImageChops.difference(x,y).getbbox()
 if u['stage']==42:assert bounds is None
 else:assert bounds is not None,('Expected visible correction',label)
 if u['stage']==41:
  for old,new in zip(u['readability'],v['readability'],strict=True):
   assert old['id']==new['id']
   assert [s for s in old['segments'] if s['walkable']]==[s for s in new['segments'] if s['walkable']]
   assert all(s in old['segments'] for s in new['segments'])
   removed.extend([{'id':old['id'],**s} for s in old['segments'] if s not in new['segments']])
  assert removed==[{'id':'a5-lower-road','a':{'x':250,'y':2785},'z':{'x':250,'y':2343.75},'walkable':False}],removed
 else:assert u['readability']==v['readability'],u['stage']
 rows.append({'stage':u['stage'],'samePhysics':True,'sameCamera':True,'sameTide':True,'sameCanvas':True,'sameStageSource':u['stageSourceSha256']==v['stageSourceSha256'],'pixelDiffBounds':bounds})
(p/'verification.json').write_text(json.dumps({'rows':rows,'stage41RemovedInkOnly':removed,'scope':'Targeted combined normal HTTP built launch only. Diagnostic cameras, not full gameplay or performance. No deployment.'},indent=2))
print('Combined normal HTTP pairs passed; Stage42 pixels unchanged; Stage41 exact ink omission only')
