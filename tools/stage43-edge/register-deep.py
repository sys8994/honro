"""Dense source-reference rock material, mapped only onto existing exterior BODY."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as P,Line,CubicBezier,QuadraticBezier
import os,sys,subprocess,numpy as np
out=Path(sys.argv[1]);ns='{http://www.w3.org/2000/svg}'
def y(v):return (v-400)*4.5 if v<=800 else 1800+(v-800)*4200/454
def f(z):return complex(-1600+z.real*5372/1254,y(z.imag))
def mapped(d):
 r=[]
 for s in parse_path(d):
  if isinstance(s,Line):r.append(Line(f(s.start),f(s.end)))
  elif isinstance(s,CubicBezier):r.append(CubicBezier(f(s.start),f(s.control1),f(s.control2),f(s.end)))
  elif isinstance(s,QuadraticBezier):r.append(QuadraticBezier(f(s.start),f(s.control),f(s.end)))
 return P(*r).d()
a=E.parse(str(out.parent/'stage43-trace-continuous-v5/alpha-exterior.svg'));mask=a.find('.//'+ns+'path').get('d');a.write(str(out/'alpha-exterior.svg'))
t=E.parse(str(out/'color-raw.svg'));t.getroot().set('viewBox','-1600 0 5372 6000');t.getroot().set('width','5372');t.getroot().set('height','6000');acts=[]
for i,p in enumerate(t.findall('.//'+ns+'path')):
 p.set('d',mapped(p.get('d')));mid=f'geology-{i}';E.SubElement(p.getparent(),ns+'path',id=mid,d=mask,style='fill:#000');acts+=['select-clear',f'select-by-id:{p.get("id")},{mid}','path-intersection']
src=out/'registered.svg';dest=out/'color-exterior.svg';t.write(str(src));acts+=['select-clear','export-plain-svg',f'export-filename:{dest}','export-do'];r=subprocess.run(['/usr/bin/inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'profile')},capture_output=True,text=True);(out/'boolean.log').write_text(r.stdout+r.stderr);r.check_returncode()
