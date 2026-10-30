"""Extract the new stage34-specific Inkscape source; preserve upper support and thin tip."""
from pathlib import Path
import json,xml.etree.ElementTree as E
import numpy as np
from svgpathtools import parse_path
from shapely.geometry import Polygon,LineString
D=Path('art/stage34-silhouette-v4');r=E.parse(D/'final.svg').getroot();e=next(n for n in r.iter() if n.tag.endswith('path'));p=parse_path(e.attrib['d']);s=max(p.continuous_subpaths(),key=lambda s:abs(s.area()));coords=[]
def flat(c,a=0,b=1,d=0):
 aa=c.point(a);bb=c.point(b);er=max(abs(c.point(a+(b-a)*q)-(aa+(bb-aa)*q)) for q in [.25,.5,.75])
 if er>.06 and d<16:
  m=(a+b)/2;return flat(c,a,m,d+1)[:-1]+flat(c,m,b,d+1)
 return [(aa.real,aa.imag),(bb.real,bb.imag)]
for c in s:coords+=flat(c)[:-1]
poly=Polygon(coords);assert poly.is_valid
xmin,ymin,xmax,ymax=poly.bounds;left=xmin+1;right=xmax-1

def lower(x):return poly.intersection(LineString([(x,0),(x,2000)])).bounds[3]
ly,ry=lower(left),lower(right);sx=3400/(right-left);sy=500/(ly-ry);transform=[sx,0,0,sy,-sx*left,4000-sy*ly]
old=json.load(open('_local/reports/cave34-silhouette-v4/baseline.json'))['stages'][0]['terrains'][1]['points'];profile=[[0,4000],[2250,3700],[3150,3600],[3400,3500]]
def base(x):return float(np.interp(x,*zip(*profile)))
pts=[]
for x in np.linspace(0,3150,1576):
 y=min(base(x),sy*lower(left+x/sx)+transform[5]);pts.append([float(x),float(y)])
pts[0]=profile[0];pts[-1]=profile[2]
def rdp(ps,e):
 if len(ps)<3:return ps
 a,b=np.array(ps[0]),np.array(ps[-1]);v=b-a;n=np.linalg.norm(v);ds=[abs(v[0]*(q[1]-a[1])-v[1]*(q[0]-a[0]))/n if n else np.linalg.norm(np.array(q)-a) for q in ps];i=int(np.argmax(ds));return rdp(ps[:i+1],e)[:-1]+rdp(ps[i:],e) if ds[i]>e else [ps[0],ps[-1]]
pts=rdp(pts,.6);new=old[:5]+[{'x':x,'y':y}for x,y in reversed(pts)]+old[8:];assert Polygon([(q['x'],q['y'])for q in new]).is_valid
(D/'authored-roof-contour.json').write_text(json.dumps({'source':'final.svg','sourceOutline':e.attrib.get('id'),'transform':transform,'sourceExtent':[left,right,ly,ry],'originalPoints':old,'changedPoints':new,'surface':pts,'maxCarve':max(base(x)-y for x,y in pts),'preserve':'Upper support chain and entire3150..3400 thin tip unchanged; carve only.','status':'candidate-not-approved'},indent=2));print(len(new),max(base(x)-y for x,y in pts))
