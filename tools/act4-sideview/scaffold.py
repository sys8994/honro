"""Render the existing authoring geometry as image-generation structure inputs.

No game geometry or imagery is invented here. The output is a labeled diagnostic
plate and a clean solid-color silhouette, not final artwork.
"""
from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/reports/act4-sideview-p1-20261116'
OUT.mkdir(parents=True,exist_ok=True)
parts=ROOT/'shared/data/act4/world.parts'
manifest=json.loads((parts/'manifest.json').read_bytes())
world=json.loads(b''.join((parts/p['file']).read_bytes() for p in manifest['parts']))
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22)
contracts=[]
for n in [33,40]:
 stage=next(s for s in world['stages'] if s['metadata']['stageId']==n)
 (OUT/f'original{n}.json').write_text(json.dumps(next(a for a in world['library'] if a['id']==f'approved{n}:body')),encoding='utf-8')
 (OUT/f'stage{n}-canonical.json').write_text(json.dumps(stage,ensure_ascii=False,indent=2),encoding='utf-8')
 # Full map structure is proportional. The source has 4.5 world units per
 # source pixel in stage 33; stage 40 uses its authored width / 1536.
 z=1536/stage['width']; w=1536;h=1024
 mapping={'x':0,'y':0,'worldWidth':stage['width'],'worldHeight':stage['height'],
          'pixelWidth':w,'pixelHeight':h,'canvasWorldHeight':h/z,'worldPerPixel':1/z}
 for role in ['structure','body','surface']:
  im=Image.new('RGB',(w,h),'#eff1ef');draw=ImageDraw.Draw(im)
  for t in stage['terrains']:
   pts=[(p['x']*z,p['y']*z) for p in t['points']]
   if role=='body' and (t.get('oneWay') or t.get('baseMaterial')!='rock'):continue
   if role=='surface' and not t.get('oneWay'):continue
   draw.polygon(pts,fill='#667982' if not t.get('oneWay') else '#b29d78')
   if role=='structure':
    for edge in t.get('properties',{}).get('honroWalkEdges',[]):
     a,b=pts[edge],pts[(edge+1)%len(pts)];draw.line([a,b],fill='#b44e3a',width=3)
  if role=='structure':
   for u in stage['units']:
    if u.get('side')==0:
     x,y=u['x']*z,u['y']*z;draw.rectangle((x-4,y-92*z,x+4,y),fill='#242f31')
   draw.text((18,16),f'{n} | Existing collision structure only | red: authored walk edges',font=font,fill='#1c3239')
  im.save(OUT/f'stage{n}-{role}-skeleton.png')
 contracts.append({'stage':n,'mapping':mapping,'canonicalStageSha256':hashlib.sha256(json.dumps(stage,sort_keys=True,separators=(',',':')).encode()).hexdigest(),
 'preserve':['terrains','units','events','encounters','objectives','markers','initialState','playBounds','terrainBounds','anchors'],
 'terrainIds':[t['id'] for t in stage['terrains']], 'bodyTerrainIds':[t['id'] for t in stage['terrains'] if not t.get('oneWay') and t.get('baseMaterial')=='rock'],
 'surfaceTerrainIds':[t['id'] for t in stage['terrains'] if t.get('oneWay')]})
(OUT/'source-contracts.json').write_text(json.dumps(contracts,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(contracts,ensure_ascii=True))
