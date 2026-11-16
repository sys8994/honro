"""Register upper-right exterior to authored mouth anchor; no gameplay coordinates change."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as P,Line,CubicBezier,QuadraticBezier
import re,json,numpy as np
R=Path(__file__).resolve().parents[2];O=R/'art/stage47-continuity/source';ns='{http://www.w3.org/2000/svg}'
def f(z):
 y=z.imag;x=z.real
 a=float(np.interp(y,[650,810,847,875],[0,43,31.4,0]));b=max(0,min((x-450)/30,(810-x)/280,1))
 return complex(x+a*b,y)
for kind in ['color','alpha']:
 t=E.parse(str(O/f'trace/{kind}-raw.svg'))
 for e in t.findall('.//'+ns+'path'):
  parts=[]
  for p in parse_path(e.get('d')).continuous_subpaths():
   segs=[]
   for s in p:
    assert isinstance(s,(Line,CubicBezier,QuadraticBezier));segs.append(type(s)(*[f(q)for q in s.bpoints()]))
   parts.append(P(*segs).d()+('Z'if p.isclosed() else''))
  d=' '.join(parts);e.set('d',re.sub(r'-?\d+\.\d+(?:e[+-]?\d+)?',lambda m:format(float(m[0]),'.3f').rstrip('0').rstrip('.'),d))
 t.write(str(O/f'{kind}-registered.svg'))
(O/'neck-registration.json').write_text(json.dumps({'landmark':'right upper mouth edge at source1024,150','changed':'generated exterior only; original silhouette restored afterwards','displacementMaxPixels':43,'generatedRows':[650,810,847,875],'sourceCoordinatesUntouched':True},indent=2))
