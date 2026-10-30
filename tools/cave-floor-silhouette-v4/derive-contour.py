"""Derive playable contour from the actual traced floor source; no invented decorative points."""
from pathlib import Path
import json,xml.etree.ElementTree as ET
import numpy as np
from svgpathtools import parse_path
from shapely.geometry import Polygon,LineString
D=Path('art/stage38-floor-silhouette-v4')
r=ET.parse(D/'final.svg').getroot()
# Stack-trace base shape is the first painted path and owns the complete alpha outline.
e=next(x for x in r.iter() if x.tag.endswith('path'));p=parse_path(e.attrib['d']);coords=[]
def flat(s,a=0,b=1,depth=0):
 aa=s.point(a);bb=s.point(b);error=max(abs(s.point(a+(b-a)*q)-(aa+(bb-aa)*q)) for q in [.25,.5,.75])
 if error>.06 and depth<16:
  m=(a+b)/2;return flat(s,a,m,depth+1)[:-1]+flat(s,m,b,depth+1)
 return [(aa.real,aa.imag),(bb.real,bb.imag)]
# Largest connected subpath is the floor mass, not decorative speckles.
sp=max(p.continuous_subpaths(),key=lambda s:abs(s.area()))
for seg in sp:coords+=flat(seg)[:-1]
poly=Polygon(coords);assert poly.is_valid

def upper(x):return poly.intersection(LineString([(x,0),(x,2000)])).bounds[1]
# Source-author ramp onset and end, chosen from observed concept. World recoveryplateau is protected.
src=[30.,1100.,1700.];world=[0.,1800.,2350.];height=[2800.,2800.,3050.];srcY=[upper(x) for x in src];sy=250/(srcY[2]-srcY[1]);segments=[];points=[]
for i in range(2):
 sx=(world[i+1]-world[i])/(src[i+1]-src[i]);ss=(srcY[i+1]-srcY[i])/(src[i+1]-src[i]);ws=(height[i+1]-height[i])/(world[i+1]-world[i]);
 # Exact affine transform fits this authored source span to preserved macro anchors.
 tr=[sx,ws*sx-sy*ss,0,sy,world[i]-sx*src[i],height[i]-ws*sx*src[i]-sy*srcY[i]+sy*ss*src[i]]
 segments.append({'sourceRange':src[i:i+2],'worldRange':world[i:i+2],'transform':tr})
 for xx in np.linspace(world[i],world[i+1],int((world[i+1]-world[i])/2)+1):
  ssx=src[i]+(xx-world[i])/sx;yy=tr[1]*ssx+sy*upper(ssx)+tr[5];points.append([float(xx),float(yy)])
# RDP controls collision count/error without adding procedural noise.
def rdp(ps,e):
 if len(ps)<3:return ps
 a,b=np.array(ps[0]),np.array(ps[-1]);v=b-a;n=np.linalg.norm(v);ds=[abs(v[0]*(q[1]-a[1])-v[1]*(q[0]-a[0]))/n if n else np.linalg.norm(np.array(q)-a) for q in ps];i=int(np.argmax(ds));return rdp(ps[:i+1],e)[:-1]+rdp(ps[i:],e) if ds[i]>e else [ps[0],ps[-1]]
points=rdp(points,.4);points[0]=[0.,2800.];points[-1]=[2350.,3050.];points.append([3300.,3050.])
old=json.load(open('_local/reports/cave-silhouette-v4/baseline.json'))['stages'][0]['terrains'][0]['points'];new=[dict(x=x,y=y) for x,y in points]+old[4:]
assert Polygon([(p['x'],p['y']) for p in new]).is_valid
slopes=[abs((b[1]-a[1])/(b[0]-a[0])) for a,b in zip(points,points[1:]) if b[0]>a[0]];assert max(slopes)<=1.35
(D/'contour.json').write_text(json.dumps({'source':'final.svg','sourceOutline':e.attrib.get('id'),'sourceY':srcY,'scaleY':sy,'segments':segments,'originalPoints':old,'changedPoints':new,'surface':points,'maxSlope':max(slopes),'collisionApproximationWorld':.4,'protectedPlateau':[2350,3300,3050],'status':'candidate, not movement approved'},indent=2));print(len(points),max(slopes))
