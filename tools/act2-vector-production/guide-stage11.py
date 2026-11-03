import json
from pathlib import Path
import subprocess
s=json.load(open('_local/reports/stage11-original/source.json'))
out=Path('/workspace/scratch/fff510b4df37/honro-act2-vector-rollout/stage11')
parts=[('west-v1',[1200,4300,5600,4200],['rv-west-shoulder','rv-west-stone-arch','rv-west-rock-crown']),('central-v1',[5300,6300,4300,2200],['rv-ritual-buttress','rv-ritual-reflection-ledge','rv-ritual-reflection-wall']),('lower-v1',[3800,8200,7700,3400],['rv-lower-west-shelf','rv-lower-refuge-rock','rv-refuge-mouth-ceiling']),('east-v1',[9400,4700,6800,6600],['rv-east-tower','rv-north-trace','rv-east-upper-fire-bay'])]
parts += [('entry-rock-v1',[660,6040,660,520],['v4.11.firing-rock']),('east-v2',[9400,4700,12600,6600],['rv-east-tower','rv-north-trace','rv-east-upper-fire-bay']),('floor-entry-v1',[-1600,6000,5400,5000],['act2-floor']),('floor-valley-v1',[3000,9000,11000,5000],['act2-floor']),('floor-domain-v1',[-6000,6000,28000,30000],['act2-floor'])]
for name,box,ids in parts:
 p=out/name;p.mkdir(parents=True,exist_ok=True)
 svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s">'%(' '.join(map(str,box)))+'<rect x="%s" y="%s" width="%s" height="%s" fill="white"/>'%tuple(box)
 for t in s['world']:
  if t['id'] not in ids:continue
  svg+='<path d="M'+'L'.join(str(v['x'])+','+str(v['y']) for v in t['vertices'])+'Z" fill="#4c5a57"/>'
 svg+='</svg>'; (p/'guide.svg').write_text(svg);subprocess.run(['inkscape',str(p/'guide.svg'),'--export-width=1600','--export-filename='+str(p/'guide.png')],check=True);(p/'placement.json').write_text(json.dumps({'viewBox':box,'terrainIds':ids},indent=2))
