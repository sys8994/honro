"""Continuous source-scale geological apron, expanding only away from gameplay."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as P,Line,CubicBezier,QuadraticBezier
import os,sys,subprocess
root=Path(__file__).resolve().parents[2];out=Path(sys.argv[1]);ns='{http://www.w3.org/2000/svg}'
def f(z):
 v=z.imag;t=max(0,min(1,(v-400)/450));w=2172+3200*t
 y=695+(v-400)*2 if v<=850 else 1595+(v-850)*4405/404
 return complex(1086+(z.real/1254-.5)*w,y)
def mapped(d):
 r=[]
 for s in parse_path(d):
  if isinstance(s,Line):r.append(Line(f(s.start),f(s.end)))
  elif isinstance(s,CubicBezier):r.append(CubicBezier(f(s.start),f(s.control1),f(s.control2),f(s.end)))
  elif isinstance(s,QuadraticBezier):r.append(QuadraticBezier(f(s.start),f(s.control),f(s.end)))
 return P(*r).d()
mask='M-1600 697L118 700L230 696L380 701L520 697L680 700L840 695L1010 699L1170 697L1330 700L1510 697L1690 701L1860 696L2020 700L3772 697V6000H-1600Z'
for kind in ['color','alpha']:
 t=E.parse(str(out/f'{kind}-raw.svg'));t.getroot().set('viewBox','-1600 0 5372 6000');t.getroot().set('width','5372');t.getroot().set('height','6000');acts=[]
 for i,p in enumerate(t.findall('.//'+ns+'path')):
  p.set('d',mapped(p.get('d')));mid=f'seam-{i}';E.SubElement(p.getparent(),ns+'path',id=mid,d=mask,style='fill:#000');acts+=['select-clear',f'select-by-id:{p.get("id")},{mid}','path-intersection']
 src=out/f'{kind}-input.svg';dest=out/f'{kind}-exterior.svg';t.write(str(src));acts+=['select-clear','export-plain-svg',f'export-filename:{dest}','export-do'];r=subprocess.run(['/usr/bin/inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'profile')},capture_output=True,text=True);(out/f'{kind}-boolean.log').write_text(r.stdout+r.stderr);r.check_returncode()
import json
c={'id':'act5:stage43:seam','semanticLayer':'BODY','bounds':{'x':-1600,'y':0,'w':5372,'h':6000},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':6000},'preserveCompounds':True};(root/'art/stage43-edge/seam-config.json').write_text(json.dumps(c,indent=2))
