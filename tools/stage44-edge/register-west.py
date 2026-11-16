"""Artist registration correction: lower the generated west silhouette 16 source units,
blending to zero at original x=700. No new paths, collisions or walk surfaces.
The center/top original art is preserved independently by its native alpha.
"""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as SvgPath,Line,CubicBezier,QuadraticBezier
import re
r=Path(__file__).resolve().parents[2]/'_local/stage44/trace'
def point(z):
 x=(z.real-263)/.75;t=max(0,min(1,x/700));w=1-3*t*t+2*t*t*t
 return z+complex(0,12*w)
for name in ['native-color','native-alpha']:
 original=r/(name+'-original.svg')
 if not original.exists():original.write_bytes((r/(name+'.svg')).read_bytes())
 t=E.parse(str(original))
 for el in t.findall('.//{*}path'):
  chunks=[]
  for path in parse_path(el.get('d')).continuous_subpaths():
   segs=[]
   for s in path:
    if isinstance(s,(Line,CubicBezier,QuadraticBezier)):segs.append(type(s)(*[point(p) for p in s.bpoints()]))
    else:raise ValueError('Unsupported segment')
   d=SvgPath(*segs).d()
   if path.isclosed():d+='z'
   chunks.append(d)
  data=' '.join(chunks)
  data=re.sub(r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',lambda m:format(float(m[0]),'.3f').rstrip('0').rstrip('.') if '.' in format(float(m[0]),'.3f') else m[0],data)
  el.set('d',data)
 t.write(str(r/(name+'.svg')))
