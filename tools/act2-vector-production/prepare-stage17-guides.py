import json
from pathlib import Path
from PIL import Image,ImageDraw
b=Path('/workspace/scratch/fff510b4df37/honro-act2-vector-rollout/stage17');s=json.loads((b/'source/raw-stage.json').read_text());hosts=[t['id'] for t in s['terrains'] if t.get('properties',{}).get('surfaceKind')=='cave' and t['id']!='gate-repair'];print(hosts)
parts=[('outer-v1',-6000,-24000,23200,54000,hosts),('west-v1',-500,2800,6000,4700,['act2-floor','cave-roof','ws-west-work-buttress','ws-west-machine-plinth','ws-service-vault-tooth']),('east-v1',5500,2800,6000,4700,['act2-floor','cave-roof','ws-east-hoist-buttress','ws-axle-footing','ws-service-reflection-pier'])]
parts += [(n.replace('-v1','-v2'),x,y,w,h,ids+[('ws-west-upper-rock' if n.startswith('west') else 'ws-east-upper-rock')]) for n,x,y,w,h,ids in parts if n!='outer-v1']
for n,x,y,w,h,ids in parts:
 d=b/n;d.mkdir(exist_ok=True);pw,ph=(1024,1536) if n=='outer-v1' else (1536,1200);im=Image.new('RGB',(pw,ph),'#e1d7c2');dr=ImageDraw.Draw(im)
 for t in s['terrains']:
  if t['id'] in ids:dr.polygon([((p['x']-x)*pw/w,(p['y']-y)*ph/h)for p in t['points']],fill='#283b46')
 im.save(d/'guide.png');(d/'placement.json').write_text(json.dumps(dict(x=x,y=y,width=w,height=h,bodyTerrainIds=ids),indent=2))
