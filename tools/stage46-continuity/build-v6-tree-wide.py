"""Native left tree completion only; original tree and contacts remain on top."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
from svgpathtools.path import transform
from svgpathtools.parser import parse_transform
import json,numpy as np,subprocess,os
R=Path(__file__).resolve().parents[2];T=R/'_local/stage46/trace-v6-tree';O=R/'art/stage46-continuity/v6/tree-wide';O.mkdir(exist_ok=True);env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'}
w,h=json.loads((T/'trace.json').read_text())['sourceSize'];M=np.array([[310/w,0,-130],[0,175/h,220],[0,0,1.]])
for kind in ['color','alpha']:
 t=E.parse(str(T/(kind+'-raw.svg')));r=t.getroot()
 for p in t.findall('.//{*}path'):
  a=np.eye(3)
  for e in reversed([p,*p.iterancestors()]):
   if e.get('transform'):a=a@parse_transform(e.get('transform'))
  p.set('d',transform(parse_path(p.get('d')),M@a).d());p.set('id','native-alpha' if kind=='alpha' else p.get('id','color'))
 for e in r.iter():e.attrib.pop('transform',None)
 r.set('viewBox','-130 220 310 175');r.set('width','310');r.set('height','175')
 if kind=='alpha':
  E.SubElement(r,'{http://www.w3.org/2000/svg}path',id='left-only',d='M-130 220H25V370H-130Z');t.write(str(O/'alpha-input.svg'))
  subprocess.run(['/usr/bin/inkscape',str(O/'alpha-input.svg'),'--batch-process','--actions=select-by-id:native-alpha,left-only;path-intersection;select-clear;export-plain-svg;export-filename:'+str(O/'alpha-final.svg')+';export-do'],env=env,check=True,capture_output=True)
 else:t.write(str(O/'color-registered.svg'))
subprocess.run(['python','tools/terrain-node-optimizer/optimize_svg.py',str(O/'color-registered.svg'),str(O/'color-optimized.svg'),'--epsilon','.35','--render-widths','1280'],cwd=R,env=env,check=True)
subprocess.run(['python','tools/vector-production/quantize-svg.py',str(O/'color-optimized.svg'),'--output',str(O/'color-final.svg'),'--grid','.01'],cwd=R,check=True)
cfg={'id':'act5:stage46:tree-completion','name':'서쪽 나무 왼쪽 자연 마감','semanticLayer':'PROP','category':'tree','anchor':{'x':0,'y':0},'foot':{'x':0,'y':375},'bounds':{'x':-130,'y':220,'w':155,'h':150},'scaleRange':[1,8],'backgroundRange':[1,8],'preserveCompounds':True};(O/'config.json').write_text(json.dumps(cfg))
subprocess.run(['python','tools/vector-production/import-native-clip.py',str(O/'color-final.svg'),str(O/'alpha-final.svg'),'--config',str(O/'config.json'),'--output',str(O/'candidate.json')],cwd=R,check=True)
