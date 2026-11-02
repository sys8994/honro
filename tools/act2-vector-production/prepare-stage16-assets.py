from pathlib import Path
import json,xml.etree.ElementTree as E,subprocess,gzip,hashlib,re
from PIL import Image
root=Path('../honro-act2-vector-rollout/stage16');stage=json.load(open('_local/reports/stage16-original/source.json'))['stage'];ns='{http://www.w3.org/2000/svg}';E.register_namespace('',ns[1:-1])
for name in ['floor-west','floor-under','floor-east','roof']:
 p=root/name;c=json.load(open(p/'contract.json'));tree=E.parse(p/'trace/raw.svg');rt=tree.getroot();local=c['localMaterial'];
 if local:rt.remove(list(rt)[0])
 tree.write(p/'authored-raw.svg',encoding='utf8',xml_declaration=True);(p/'world.svg').write_bytes((p/'authored-raw.svg').read_bytes());W,H=Image.open(p/'source.png').size;x,y,w,h=c['worldRect'];cfg={'id':'act2-traced:stage16-'+name,'name':'Stage16 '+name,'bounds':{'x':x,'y':y,'w':w,'h':h},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':0},'semanticLayer':'BODY','preserveCompounds':True,'transform':[w/W,0,0,h/H,x,y],'params':{'bodyTerrainIds':c['bodyTerrainIds'],'bodyBaseColor':'#283e49','localMaterial':local}}
 (p/'config.json').write_text(json.dumps(cfg,indent=2));subprocess.run(['python','tools/vector-production/import-svg.py',str(p/'authored-raw.svg'),'--config',str(p/'config.json'),'--output',str(p/'native-raw.json')],check=True)
 lines=[]
 for t in stage['terrains']:
  if t['id']not in c['bodyTerrainIds']:continue
  ps=t['points']
  for a,b in zip(ps,ps[1:]+ps[:1]):
   if max(a['x'],b['x'])<x or min(a['x'],b['x'])>x+w:continue
   lines.append({'points':[[(v['x']-x)*2048/w,(v['y']-y)*H/h*2048/W] for v in [a,b]],'width':16})
 (p/'pixel-config.json').write_text(json.dumps({'width':2048,'scales':[1,2],'limits':{'rgbMAE255':.8,'silhouettePx':1.5,'protectedRgbMAE255':1,'protectedPx':.5,'protectedChangedPixelFraction':.05},'protectedPolylines':lines,'protectedRgbQuantizationTolerance255':1},indent=2))
 print(name,(p/'trace/raw.svg').stat().st_size,(p/'authored-raw.svg').stat().st_size)
