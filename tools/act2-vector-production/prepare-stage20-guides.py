import json
from pathlib import Path
from PIL import Image,ImageDraw
b=Path('/workspace/scratch/fff510b4df37/honro-act2-vector-rollout/stage20');s=json.loads((b/'source/raw-stage.json').read_text());hosts=['act2-floor','exit-overhang'];print(hosts)
parts=[('outer-v1',-6000,-1900,21000,31700,hosts),('west-v2',-800,1700,6000,5000,hosts),('east-v2',4000,1600,6000,5000,['act2-floor'])]
for n,x,y,w,h,ids in parts:
 d=b/n;d.mkdir(exist_ok=True);pw,ph=(1024,1536) if n=='outer-v1' else (1536,1200);im=Image.new('RGB',(pw,ph),'#e1d7c2');dr=ImageDraw.Draw(im)
 for t in s['terrains']:
  if t['id'] in ids:dr.polygon([((p['x']-x)*pw/w,(p['y']-y)*ph/h)for p in t['points']],fill='#283b46')
 im.save(d/'guide.png');(d/'placement.json').write_text(json.dumps(dict(x=x,y=y,width=w,height=h,bodyTerrainIds=ids),indent=2))
