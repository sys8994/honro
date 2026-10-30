from pathlib import Path
import xml.etree.ElementTree as E,json
from svgpathtools import parse_path,Line,CubicBezier,QuadraticBezier,Path as SP
import sys
n=int(sys.argv[1]);D=Path(__file__).parent/f'bank{n}';lm=json.load(open(D/'play-left/mapping.json'));rm=json.load(open(D/'play-right/mapping.json'));ratio=lm['h']/rm['h'];l={e.get('id'):parse_path(e.get('d')) for e in E.parse(D/'play-left/ground-master.svg').getroot().iter() if e.tag.endswith('path')};t=E.parse(D/'play-right/ground-master.svg');rr={e.get('id'):parse_path(e.get('d')) for e in t.getroot().iter() if e.tag.endswith('path')}
def top(p,x):
 ys=[]
 for seg in p:
  try:
   for u,v in seg.intersect(Line(complex(x,0),complex(x,800))):ys.append(seg.point(u).imag)
  except ValueError:pass
 return min(ys)
ld=top(l['path7'],2169.9);rd=top(rr['path7'],2.1);report={}
for e in t.getroot().iter():
 if not e.tag.endswith('path'):continue
 k=e.get('id');delta=(top(l[k],2169.9)-ld)*ratio-(top(rr[k],2.1)-rd);report[k]=delta
 def f(p):
  u=max(0,min(1,1-max(0,p.real-2)/180));return complex(round(p.real,3),round(p.imag+delta*u*u*(3-2*u)*max(0,min(1,(724-p.imag)/100)),3))
 segs=[]
 for s in rr[k]:
  if isinstance(s,CubicBezier):segs.append(CubicBezier(f(s.start),f(s.control1),f(s.control2),f(s.end)))
  elif isinstance(s,QuadraticBezier):segs.append(QuadraticBezier(f(s.start),f(s.control),f(s.end)))
  elif isinstance(s,Line):segs.append(Line(f(s.start),f(s.end)))
  else:raise Exception(type(s))
 e.set('d',SP(*segs).d())
t.write(D/'play-right/ground-joined.svg');(D/'play-right/join-report.json').write_text(json.dumps({'layerDepthCorrectionsSourcePx':report,'fadeSourceWidth':180,'reason':'Align actual traced strata at shared edge, retain silhouettes; no opacity seam overlay'},indent=2));print(report)
