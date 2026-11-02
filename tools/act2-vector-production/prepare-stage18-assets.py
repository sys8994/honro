import json,gzip,subprocess,sys,hashlib,xml.etree.ElementTree as E
from pathlib import Path
from PIL import Image
base=Path('/workspace/scratch/fff510b4df37/honro-act2-vector-rollout/stage18');stage=json.loads((base/'source/raw-stage.json').read_text())
for name in (sys.argv[1:] or ['domain-v1','floor-local-v2','west-v2','east-v2']):
 p=base/name;place=json.loads((p/'placement.json').read_text());w,h=Image.open(p/'source.png').size;raw=(p/'trace/raw.svg').read_bytes();(p/'original-trace.svg.gz').write_bytes(gzip.compress(raw,mtime=0));(p/'authored-raw.svg').write_bytes(raw);(p/'authored-raw.svg.gz').write_bytes(gzip.compress(raw,mtime=0))
 cfg={'id':'act2-traced:stage18-'+name,'name':'Stage18 '+name,'bounds':{'x':place['x'],'y':place['y'],'w':place['width'],'h':place['height']},'anchor':{'x':0,'y':0},'foot':{'x':place['x'],'y':place['y']+place['height']},'semanticLayer':'BODY','preserveCompounds':True,'transform':[place['width']/w,0,0,place['height']/h,place['x'],place['y']],'params':{'bodyTerrainIds':place['bodyTerrainIds'],'bodyBaseColor':'#283b46'}}
 (p/'config.json').write_text(json.dumps(cfg,indent=2));subprocess.run([sys.executable,'tools/vector-production/import-svg.py',str(p/'authored-raw.svg'),'--config',str(p/'config.json'),'--output',str(p/'native-raw.json')],check=True)
 lines=[]
 for t in stage['terrains']:
  if t['id']not in place['bodyTerrainIds']:continue
  assert not any(t.get('properties',{}).get(k)for k in ['honroBellMoving','honroBellBody','honroBellRelease','honroMeleeTarget'])
  pts=t['points'];ids=t.get('properties',{}).get('honroWalkEdges',[])
  for i in ids:
   a,b=pts[i],pts[(i+1)%len(pts)];lines.append({'points':[[(v['x']-place['x'])*w/place['width'],(v['y']-place['y'])*h/place['height']]for v in [a,b]],'width':12})
 (p/'pixel-config.json').write_text(json.dumps({'width':w,'scales':[1,2],'limits':{'rgbMAE255':.8,'silhouettePx':1.5,'protectedRgbMAE255':1,'protectedPx':.5,'protectedChangedPixelFraction':.05},'protectedPolylines':lines,'protectedRgbQuantizationTolerance255':1},indent=2))
