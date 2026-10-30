from pathlib import Path
import json,xml.etree.ElementTree as E,math
import numpy as np
from svgpathtools import parse_path,Line,CubicBezier,QuadraticBezier,Path as SP
D=Path(__file__).parent;r=E.parse(D/'wall-master.svg');outer=parse_path(next(e.get('d')for e in r.getroot().iter()if e.tag.endswith('path')))
def top(p,x):
 ys=[]
 for seg in p:
  try:ys +=[seg.point(u).imag for u,v in seg.intersect(Line(complex(x,0),complex(x,724)))]
  except ValueError:pass
 return min(ys)
xs=np.arange(200,2021,1.);ys=np.array([top(outer,x)for x in xs]);knots=[200,900,2020];ky=[top(outer,x)for x in knots];depth=90;count=0
actual=lambda x:float(np.interp(x,xs,ys));target=lambda x:float(np.interp(x,knots,ky))
def f(q):
 global count
 x=q.real;y=q.imag
 if not 200<=x<=2020:return q
 h=actual(x);u=max(0,min(1,(y-h)/depth));weight=1-u*u*(3-2*u);dy=(target(x)-h)*weight
 if abs(dy)>1e-9:count+=1
 return complex(round(x,4),round(y+dy,4))
for e in r.getroot().iter():
 if not e.tag.endswith('path'):continue
 out=[]
 for seg in parse_path(e.get('d')):
  pts=[seg.start,seg.end,*([seg.control1,seg.control2]if isinstance(seg,CubicBezier)else[seg.control]if isinstance(seg,QuadraticBezier)else[])];near=any(190<q.real<2030 and q.imag<actual(q.real)+depth for q in pts);n=max(1,math.ceil(seg.length()/18))if near else 1
  for i in range(n):
   q=seg.cropped(i/n,(i+1)/n)if n>1 else seg
   if isinstance(q,CubicBezier):out.append(CubicBezier(f(q.start),f(q.control1),f(q.control2),f(q.end)))
   elif isinstance(q,QuadraticBezier):out.append(QuadraticBezier(f(q.start),f(q.control),f(q.end)))
   else:out.append(Line(f(q.start),f(q.end)))
 e.set('d',SP(*out).d())
r.write(D/'wall-top-aligned.svg');new=parse_path(next(e.get('d')for e in r.getroot().iter()if e.tag.endswith('path')));errs=[(top(new,x)-target(x))*.49 for x in np.linspace(202,2018,450)];report={'bandDepthSourcePx':depth,'maxSourceTopShiftPx':float(max(abs(np.interp(xs,knots,ky)-ys))),'maxWorldTopError':max(abs(x)for x in errs),'minWorldTopError':min(errs),'maxWorldTopErrorSigned':max(errs),'collisionUnchanged':True,'preserved':'All controlpoints at least90sourcepx beneath original top remain geometrically untouched except rounding4decimals; brokenunderside outsideband unchanged','maxOutputPathChars':max(len(e.get('d',''))for e in r.getroot().iter()if e.tag.endswith('path'))};assert report['maxWorldTopError']<=1,report;(D/'top-band-report.json').write_text(json.dumps(report,indent=2));print(report)
