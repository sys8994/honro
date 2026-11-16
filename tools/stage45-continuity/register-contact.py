"""Local registration of the generated root aperture to the unmodified walking surface.
Warp native trace colour and alpha identically, preserving topology and source raw.
"""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as SvgPath,Line,CubicBezier,QuadraticBezier
import re
R=Path(__file__).resolve().parents[2];o=R/'_local/stage45/body-trace'
def ramp(t):
 t=max(0,min(1,t));return t*t*(3-2*t)
def win(t,a,b,c,d):return ramp((t-a)/(b-a))*ramp((d-t)/(d-c))
def point(z):
 x,y=z.real,z.imag;w=win(x,450,495,615,660)*win(y,420,462,550,600)
 central=win(x,620,650,780,820)*win(y,425,440,540,600)
 east=win(x,1440,1473,1500,1530)*win(y,590,620,670,720)
 return z+complex(-13*w,-18*max(0,min(1.2,(y-469)/74))*w-12*max(0,min(1,(y-440)/95))*central-8*east)
for name in ['native-color','native-alpha']:
 original=o/(name+'-unregistered.svg')
 if not original.exists():original.write_bytes((o/(name+'.svg')).read_bytes())
 t=E.parse(str(original))
 for el in t.findall('.//{*}path'):
  chunks=[]
  for p in parse_path(el.get('d')).continuous_subpaths():
   q=[]
   for s in p:
    if not isinstance(s,(Line,CubicBezier,QuadraticBezier)):raise ValueError('Unexpected segment')
    q.append(type(s)(*[point(v)for v in s.bpoints()]))
   chunks.append(SvgPath(*q).d()+('z' if p.isclosed()else''))
  data=' '.join(chunks);data=re.sub(r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',lambda m:format(float(m[0]),'.3f').rstrip('0').rstrip('.') if '.'in format(float(m[0]),'.3f')else m[0],data);el.set('d',data)
 t.write(str(o/(name+'.svg')))
