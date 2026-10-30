"""Extract reviewed Inkscape lower outline; no procedural decorative geometry.
The source endpoints and existing roof support profile anchor this affine mapping.
"""
import json,xml.etree.ElementTree as ET
from pathlib import Path
from svgpathtools import parse_path
from shapely.geometry import Polygon,LineString
import numpy as np
D=Path('art/stage38-silhouette-v4'); source=D/'roof-shallow-final.svg'
r=ET.parse(source).getroot(); outline=next(e for e in r.iter() if e.attrib.get('id')=='path8')
p=parse_path(outline.attrib['d']); coords=[]
def flat(s,a=0,b=1,depth=0):
 aa=s.point(a);bb=s.point(b);mid=(a+b)/2;mm=s.point(mid)
 # Controlpoint multi-sample flatness bound approximated conservatively.
 error=max(abs(s.point(a+(b-a)*q)-(aa+(bb-aa)*q)) for q in [.25,.5,.75])
 if error>.08 and depth<16:return flat(s,a,mid,depth+1)[:-1]+flat(s,mid,b,depth+1)
 return [(aa.real,aa.imag),(bb.real,bb.imag)]
for seg in p:coords+=flat(seg)[:-1]
poly=Polygon(coords);assert poly.is_valid
W=float(r.attrib['viewBox'].split()[2]); worldW=3300;sourceStart=2;sourceEnd=W-2;sx=worldW/(sourceEnd-sourceStart);sy=sx
# Endpoint source bottom evaluated just inside clipped page avoids rounding outside.
def lower(x):
 q=poly.intersection(LineString([(x,-1),(x,2000)]));return q.bounds[3]
left,right=lower(sourceStart),lower(sourceEnd)
old=json.load(open('_local/reports/cave-silhouette-v4/baseline.json'))['stages'][0]['terrains'][2]['points']
profile=[(0,2100),(900,2280),(2000,2180),(3020,2340),(3300,2200)]
def oldy(x):return float(np.interp(x,*zip(*profile)))
def point(x):
 ss=x/sx+sourceStart; yy=lower(ss); baseline=left+(right-left)*(ss-sourceStart)/(sourceEnd-sourceStart)
 return [x,oldy(x)+min(0,(yy-baseline)*sy)]
pts=[point(float(x)) for x in np.linspace(0,3300,1651)]
pts[0]=[0,2100];pts[-1]=[3300,2200]
# Simplify bounded sampled contour, keeping source-world anchors and profile knots.
def rdp(points,eps):
 if len(points)<3:return points
 a,b=np.array(points[0]),np.array(points[-1]);v=b-a;n=np.linalg.norm(v)
 d=[abs(v[0]*(x[1]-a[1])-v[1]*(x[0]-a[0]))/n if n else np.linalg.norm(np.array(x)-a) for x in points]
 i=int(np.argmax(d))
 return rdp(points[:i+1],eps)[:-1]+rdp(points[i:],eps) if d[i]>eps else [points[0],points[-1]]
pts=rdp(pts,.65)
# Polygon follows unchanged upper cap then exactnew right-to-left underside and outerdomain.
new=old[:3]+[{'x':x,'y':y} for x,y in reversed(pts)]+old[8:]
assert Polygon([(q['x'],q['y']) for q in new]).is_valid
assert all(y<=oldy(x)+1e-6 for x,y in pts)
out={'sourceSvg':str(source),'sourceSilhouettePath':'path8','sourceWidth':W,'sourceXStart':sourceStart,'sourceXEnd':sourceEnd,'sourceEndpointY':[left,right],'scaleX':sx,'scaleY':sy,'originalProfile':profile,'originalTerrainPoints':old,'terrainPoints':new,'derivedLowerContour':pts,'maxCarveWorld':max(oldy(x)-y for x,y in pts),'physicalChange':'Remove ceiling material only. Original outer-domain and both play-boundary anchors retained. Physics must be revalidated, old clearance receipts do not apply.','contourApproximationWorld':.65,'artApproval':False}
(D/'roof-contour.json').write_text(json.dumps(out,indent=2));print(len(old),len(new),out['maxCarveWorld'])
