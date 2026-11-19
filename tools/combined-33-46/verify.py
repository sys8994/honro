import json
from pathlib import Path
from PIL import Image,ImageChops
p=Path('_local/reports/stage33-stage46-combined')
a=json.loads((p/'stock/report.json').read_text());b=json.loads((p/'integrated/report.json').read_text())
rows=[]
for before,after in zip(a['rows'],b['rows'],strict=True):
 for key in ['camera','canvas','tide','gameplaySha256','stage','label','projectStage']:
  assert before[key]==after[key],(key,before,after)
 name=before['label'];x=Image.open(p/'stock'/f'{name}.png').convert('RGB');y=Image.open(p/'integrated'/f'{name}.png').convert('RGB');bounds=ImageChops.difference(x,y).getbbox()
 if before['stage']==42:assert bounds is None,('control pixels',bounds)
 else:assert bounds is not None,('expected local paint correction',name)
 rows.append({'stage':before['stage'],'samePhysics':True,'sameCamera':True,'sameTide':True,'sameCanvas':True,'pixelDiffBounds':bounds})
(p/'paired-verification.json').write_text(json.dumps({'rows':rows,'scope':'Three normal built HTTP launch pairs; no performance or full-play claim. Stage33 native v3 parity remains verified in run44637393297. No deployment.'},indent=2))
print('Combined normal launch: three physics/camera pairs; Stage42 pixels unchanged')
