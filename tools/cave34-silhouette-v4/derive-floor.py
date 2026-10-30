"""Fit the stage34-specific native trace to protected uphill traversal anchors."""
from pathlib import Path
import xml.etree.ElementTree as E,json
import numpy as np
from svgpathtools import parse_path
from shapely.geometry import Polygon,LineString
D=Path('art/stage34-floor-silhouette-v4');r=E.parse(D/'final.svg').getroot();e=next(n for n in r.iter() if n.tag.endswith('path'));p=parse_path(e.attrib['d']);s=max(p.continuous_subpaths(),key=lambda s:abs(s.area()));coords=[]
def flat(c,a=0,b=1,d=0):
 aa=c.point(a);bb=c.point(b);er=max(abs(c.point(a+(b-a)*q)-(aa+(bb-aa)*q)) for q in [.25,.5,.75])
 if er>.04 and d<16:
  m=(a+b)/2;return flat(c,a,m,d+1)[:-1]+flat(c,m,b,d+1)
 return [(aa.real,aa.imag),(bb.real,bb.imag)]
for c in s:coords+=flat(c)[:-1]
poly=Polygon(coords)
# Native trace has a zero-area seam crossing at x=0, outside sampled x>=2.
# Repair only scanline topology; original SVG artwork remains untouched.
if not poly.is_valid:
 repaired=poly.buffer(0);assert repaired.geom_type=='Polygon' and abs(repaired.area-poly.area)<.01;poly=repaired
W,H=map(float,r.attrib['viewBox'].split()[2:]);sx=(W-4)/7600;sy=4400/H
old=json.load(open('_local/reports/cave34-silhouette-v4/baseline.json'))['stages'][0]['terrains'][0]['points'];anchors=[[p['x'],p['y']] for p in old[:18]];anchors.extend([[2350,4424],[2520,4328.8],[3910,3718]]);anchors.sort();segments=[];pts=[]
def upper(x):return poly.intersection(LineString([(x,0),(x,H)])).bounds[1]
for i in range(1,len(anchors)):
 a,b=anchors[i-1],anchors[i];u,v=2+a[0]*sx,2+b[0]*sx;uy,vy=upper(u),upper(v);ms=(vy-uy)/(v-u);mw=(b[1]-a[1])/(b[0]-a[0]);tx=1/sx;tr=[tx,mw*tx-sy*ms,0,sy,a[0]-tx*u,a[1]-mw*tx*u-sy*uy+sy*ms*u];segments.append({'worldRange':[a[0],b[0]],'sourceRange':[u,v],'transform':tr})
 for x in np.linspace(a[0],b[0],int((b[0]-a[0])/2)+1):
  xx=2+x*sx;y=tr[1]*xx+sy*upper(xx)+tr[5]
  if x<=700:y=5100
  if x>=7200:y=2200
  if not pts or x!=pts[-1][0]:pts.append([float(x),float(y)])
def rdp(ps,e):
 if len(ps)<3:return ps
 a,b=np.array(ps[0]),np.array(ps[-1]);v=b-a;n=np.linalg.norm(v);ds=[abs(v[0]*(q[1]-a[1])-v[1]*(q[0]-a[0]))/n if n else np.linalg.norm(np.array(q)-a) for q in ps];i=int(np.argmax(ds));return rdp(ps[:i+1],e)[:-1]+rdp(ps[i:],e) if ds[i]>e else [ps[0],ps[-1]]
# Pin each gameplayanchor rather than simplifying it away.
points=[]
for a,b in zip(anchors,anchors[1:]):
 part=[p for p in pts if a[0]<=p[0]<=b[0]];part[0]=a;part[-1]=b;points+=rdp(part,.5)[:-1]
points.append(anchors[-1]);new=[{'x':x,'y':y} for x,y in points]+old[18:];assert Polygon([(q['x'],q['y']) for q in new]).is_valid
slopes=[abs((b[1]-a[1])/(b[0]-a[0])) for a,b in zip(points,points[1:])];assert max(slopes)<=1.35, max(slopes)
(D/'contour.json').write_text(json.dumps({'source':'final.svg','sourceOutline':e.attrib.get('id'),'segments':segments,'originalPoints':old,'changedPoints':new,'surface':points,'anchors':anchors,'maxSlope':max(slopes),'preservedShore':[0,700,5100],'preservedSummit':[7200,7600,2200],'optionalEntry':[2520,4328.8],'status':'candidate-not-approved'},indent=2));print(len(points),max(slopes))
