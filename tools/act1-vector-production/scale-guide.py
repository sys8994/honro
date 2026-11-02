"""Export world-aspect guides and camera scale metadata. No geometry/art mutation."""
import argparse, hashlib, json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('inputs',type=Path);p.add_argument('output',type=Path);args=p.parse_args();args.output.mkdir(parents=True,exist_ok=True)
rows=[]
for source in sorted(args.inputs.glob('stage[0-9][0-9].json')):
 d=json.loads(source.read_text());w,h=d['width'],d['height'];n=d['stage']['metadata']['stageId'];scale=min(2700/w,1800/h)
 polygons=[]
 for c in d['collision']:
  if not c.get('indestructible') or c['id']=='waterfall-veil':continue
  pts=' '.join(f"{v['x']},{v['y']}" for v in c['vertices'])
  polygons.append(f'<polygon points="{pts}"/>')
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w*scale}" height="{h*scale}" viewBox="0 0 {w} {h}"><rect width="{w}" height="{h}" fill="#c4cdd1"/><g fill="#435f50" stroke="#dcbf80" stroke-width="6">'+''.join(polygons)+'</g></svg>'
 (args.output/f'stage{n:02}-world-guide.svg').write_text(svg)
 rows.append({'stage':n,'sourceDigest':d['geometryDigest'],'world':[w,h],'aspect':w/h,'guideScale':scale,'guideOffset':[0,0],'characterColliderHeight':92,'characterColliderWidth':44,'characterUnitsAcross':w/92,'desktop1440WorldWidth':1440/.94,'desktopScreensAcross':w/(1440/.94),'portrait390WorldWidth':390/.82,'portraitScreensAcross':w/(390/.82),'cameraEvidence':'shared/runtime/main.js initial framing; calculated, not browser measured','registrationStatus':'UNVERIFIED','artStatus':'UNVERIFIED','cameraChangesAllowed':False,'characterScaleChangesAllowed':False})
(args.output/'scale-contract.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(f'Exported {len(rows)} world-aspect guides; registration remains UNVERIFIED.')
