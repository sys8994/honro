from pathlib import Path
import xml.etree.ElementTree as E,json
from svgpathtools import parse_path,Line,CubicBezier,QuadraticBezier,Path as SP
D=Path(__file__).parent;l={e.get('id'):parse_path(e.get('d')) for e in E.parse(D/'ground-master.svg').getroot().iter() if e.tag.endswith('path')};t=E.parse(D/'ground-right-master.svg');rr={e.get('id'):parse_path(e.get('d')) for e in t.getroot().iter() if e.tag.endswith('path')}
def top(p,x):
 ys=[]
 for seg in p:
  try:
   for u,v in seg.intersect(Line(complex(x,0),complex(x,800))):ys.append(seg.point(u).imag)
  except ValueError:pass
 return min(ys)
ld=top(l['path7'],2171.9);rd=top(rr['path7'],.1);report={}
for e in t.getroot().iter():
 if not e.tag.endswith('path'):continue
 k=e.get('id');delta=(top(l[k],2171.9)-ld)-(top(rr[k],.1)-rd);report[k]=delta
 def f(p):
  u=max(0,min(1,1-p.real/250));return complex(p.real,p.imag+delta*u*u*(3-2*u)*max(0,min(1,(724-p.imag)/100)))
 segs=[]
 for s in rr[k]:
  if isinstance(s,CubicBezier):segs.append(CubicBezier(f(s.start),f(s.control1),f(s.control2),f(s.end)))
  elif isinstance(s,QuadraticBezier):segs.append(QuadraticBezier(f(s.start),f(s.control),f(s.end)))
  elif isinstance(s,Line):segs.append(Line(f(s.start),f(s.end)))
  else:raise Exception(type(s))
 e.set('d',SP(*segs).d())
t.write(D/'ground-right-joined.svg');(D/'join-report.json').write_text(json.dumps({'layerDepthCorrectionsSourcePx':report,'fadeSourceWidth':250,'reason':'Align actual traced strata at shared edge, retain silhouettes; no opacity seam overlay'},indent=2));print(report)
