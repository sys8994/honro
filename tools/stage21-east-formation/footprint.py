"""Independently derive potential area coverage and positive sampling weights; not an image mask."""
from pathlib import Path
import json,math,re
D=Path(__file__).resolve().parent
S=(D/'candidate.js').read_text()
# Exact outer native pigment from the already pinned candidate, not from a difference image.
section=json.loads(re.search(r'^const EAST21_SECTION=(.+);$',S,re.M)[1])
pmax=[]
for fill,path in section['nativeBase']:
 for d in path.split('Z'):
  if not d:continue
  if not re.fullmatch(r'M[\d .L-]+',d):raise AssertionError('unexpected native polygon grammar')
  points=[list(map(float,t.split()))for t in d[1:].split('L')]
  if max(x for x,y in points)>7408:pmax.append(points)
assert len(pmax)==1 and max(x for x,y in pmax[0])==7414
OUTERMOST=pmax[0]
def clip(poly,key,lim,greater):
 if not poly:return []
 def d(p):return (p[key]-lim)*(1 if greater else -1)
 r=[]
 for p,q in zip(poly[-1:]+poly[:-1],poly):
  a,b=d(p),d(q)
  if (a>=0)!=(b>=0):
   t=a/(a-b);r.append([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t])
  if b>=0:r.append(q)
 return r
def coverage(cx,cy,px):
 L=cx-px/2;T=cy-px/2
 poly=OUTERMOST
 for k,u,g in [(0,L,True),(0,L+px,False),(1,T,True),(1,T+px,False)]:poly=clip(poly,k,u,g)
 if len(poly)<3:return 0.0
 # Translate before the area calculation so thin intersections do not cancel at world coordinates.
 xy=[(x-L,y-T)for x,y in poly]
 return abs(sum(a*d-b*c for (a,b),(c,d)in zip(xy[-1:]+xy[:-1],xy)))/2
def possible_east_taps(x,y,zoom,rs):
 # _drawTerrainDomainTiles: 512 integer texels per tile, 2 gutters, uniform world lattice.
 # This mobile min pose and original transform are required, not an adjustable global pad.
 if rs!=.0625 or abs(zoom-.057352941176470586)>1e-12 or not x>7425:return []
 u,v=x*rs-.5,y*rs-.5
 ans=[]
 for i in range(math.floor(u),math.floor(u)+2):
  for j in range(math.floor(v),math.floor(v)+2):
   w=(1-abs(u-i))*(1-abs(v-j))
   X,Y=(i+.5)/rs,(j+.5)/rs
   a=coverage(X,Y,1/rs)
   if w>0 and a>1e-6:ans.append({'center':[X,Y],'areaWU2':round(a,6),'weight':round(w,8)})
 return ans
