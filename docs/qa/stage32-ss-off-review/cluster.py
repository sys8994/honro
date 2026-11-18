import json,math
from pathlib import Path
from PIL import Image
from collections import Counter
R=Path('stage32-ss-off-review'); reports=json.load(open(R/'results.json'))['reports'];e=json.load(open('stage32-gray-diagnostic/review/source-evidence.json'));edges=[]
for t in e['stage']['terrains']:
 p=t['points']
 for i in t.get('properties',{}).get('honroWalkEdges',[]):edges.append((p[i],p[(i+1)%len(p)]))
def dist(x,y,a,b):
 dx=b['x']-a['x'];dy=b['y']-a['y'];u=max(0,min(1,((x-a['x'])*dx+(y-a['y'])*dy)/(dx*dx+dy*dy))) if dx*dx+dy*dy else 0
 return math.hypot(x-a['x']-u*dx,y-a['y']-u*dy)
out=[]
for r in reports:
 p=r['pose'];z=p['z'];a=Image.open(R/(p['name']+'-ss-on.png'));b=Image.open(R/(p['name']+'-ss-off.png'));pts=[]
 for y in range(p['h']):
  for x in range(p['w']):
   av=a.getpixel((x,y));bv=b.getpixel((x,y))
   if av[:3]==bv[:3]:continue
   sx=(p['cx']+(x+.5-p['w']/2)/z)/2.2;sy=(p['cy']+(y+.5-p['h']/2)/z)/2.2
   pts.append({'x':x,'y':y,'sx':sx,'sy':sy,'walkDistanceWorld':min(dist(sx*2.2,sy*2.2,*seg) for seg in edges),'maxDelta':max(abs(av[i]-bv[i]) for i in range(3))})
 # Fixed source-space linkage12, plus pixel footprint diameter at minimum zoom, not an allowed region.
 radius=max(12,1.5/(z*2.2));parent=list(range(len(pts)))
 def root(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 for i,p1 in enumerate(pts):
  for j in range(i):
   p2=pts[j]
   if math.hypot(p1['sx']-p2['sx'],p1['sy']-p2['sy'])<=radius:parent[root(i)]=root(j)
 groups={}
 for i,v in enumerate(pts):groups.setdefault(root(i),[]).append(v)
 clusters=sorted(groups.values(),key=len,reverse=True)
 for i,c in enumerate(clusters):
  for v in c:v['cluster']=i
 out.append({'pose':p,'linkRadiusSource':radius,'points':pts})
(R/'all-difference-points.json').write_text(json.dumps(out))
