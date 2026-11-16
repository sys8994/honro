from pathlib import Path
import random, math, hashlib
import numpy as np
from scipy.spatial import Voronoi
R=random.Random(431619)
out=Path(__file__).parent
X0,Y0,X1,Y1=-2000,200,3900,3650
# Bounded irregular interlocking fractures. No raster imports, tile, clone, pattern, or reused path.
# Work in stretched geological coordinates: subtly curved, locally reversing cleavage.
pts=[]
for k in range(28000):
 x=R.uniform(X0-420,X1+420);y=R.uniform(Y0-420,Y1+420)
 spacing=(R.uniform(43,62) if -1050<x<3250 and y<1780 else R.uniform(72,135))*(1+.13*math.sin(x/420+y/580))
 if all((x-a)**2+((y-b)*.78)**2>spacing**2 for a,b in pts):pts.append((x,y))
# Spatially varying shear creates cleavage directions that reverse by region,
# rather than upright equal-sided honeycomb cells. Geometry is newly computed.
def shear(y):return .26*y+63*math.sin(y/390)
a=np.array(pts)
a[:,0]-=np.array([shear(y) for y in a[:,1]])
a[:,1]*=.78
v=Voronoi(a)
vertices=v.vertices.copy();vertices[:,1]/=.78
vertices[:,0]+=np.array([shear(y) for y in vertices[:,1]])
svg=['<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="5900" height="3450" viewBox="-2000 200 5900 3450">','<title>Stage 43 whole native BODY field, non-walkable</title>','<desc>Independent editable native rock facets and connected fractures. No source content copied. Bottom and side extent backed by solid rock.</desc>']
n=0
def path(points,color,role):
 global n
 n+=1
 svg.append('<path id="whole-%s-%04d" fill="%s" d="M%sZ"/>'%(role,n,color,' L'.join(f'{x:.1f},{y:.1f}' for x,y in points)))
svg.append('<defs><clipPath id="whole-native-extent"><path d="M-2000 200H3900V3650H-2000Z"/></clipPath></defs><g clip-path="url(#whole-native-extent)">')
path([(X0,Y0),(X1,Y0),(X1,Y1),(X0,Y1)],'#25364a','continuous-foundation')
svg.append('<g id="irregular-rock-faces">')
# Neighbour-aware near-field face colors prevent adjoining identical fills from
# merging into huge blank apparent slabs at the source's sides.
neighbours={i:set() for i in range(len(pts))}
for a,b in v.ridge_points:neighbours[a].add(b);neighbours[b].add(a)
facecolors={}

for i,reg in enumerate(v.point_region):
 ids=v.regions[reg]
 if not ids or -1 in ids:continue
 p=vertices[ids];cx,cy=pts[i]
 if cx<X0-220 or cx>X1+220 or cy<Y0-250 or cy>Y1+250:continue
 if max(p[:,0])-min(p[:,0])>550 or max(p[:,1])-min(p[:,1])>800:continue
 # Shared edge notches are identical on both adjacent faces: fitted rock, not separate tiles.
 poly=[]
 for j,a in enumerate(p):
  b=p[(j+1)%len(p)];lo,hi=sorted([tuple(a),tuple(b)])
  seed=hashlib.sha1(repr((lo,hi)).encode()).hexdigest();q=random.Random(seed)
  t=q.uniform(.32,.69);dx=hi[0]-lo[0];dy=hi[1]-lo[1];ln=math.hypot(dx,dy);off=q.uniform(-.055,.055)*ln
  mid=(lo[0]+dx*t-dy/ln*off,lo[1]+dy*t+dx/ln*off)
  poly.extend([tuple(a),mid])
 flow=math.sin(cx/340+cy/510)+.44*math.sin(cx/103-cy/250)
 col=R.choices(['#25364a','#37475c','#4f5d71','#162332'],[26 if flow>0 else 53,59 if flow>0 else 36,12 if cy<1700 else 8,3])[0]
 near=-1000<cx<3200 and 100<cy<1750
 if near:
  used=[facecolors[j] for j in neighbours[i] if j in facecolors]
  options=['#25364a','#37475c','#4f5d71']
  weights=[1/(1+used.count(c)*7) for c in options]
  col=R.choices(options,weights)[0]
 facecolors[i]=col
 path(poly,col,'rock')
 # Uneven planar fracture face, confined to a single side, not identical inset stones.
 if col!='#162332' and (near or R.random()<.84):
  j=min(range(len(p)),key=lambda j:p[j][0]*.55+p[j][1]);a=p[j];b=p[(j+1)%len(p)];c=p[(j+2)%len(p)];center=np.mean(p,axis=0)
  t=R.uniform(.18,.51);inner=a*(1-t)+center*t;tip=b*.47+center*.53
  facet=[tuple(a),tuple(b),tuple(c*.28+b*.72),tuple(tip),tuple(inner)]
  path(facet, '#4f5d71' if col=='#37475c' else '#37475c' if col=='#25364a' else '#687588' if cy<1250 else '#657184','fracture-plane')
 # Short secondary planes: broad irregular chips, never micro noise.
 if near:
  center=np.mean(p,axis=0);j=R.randrange(len(p));a=p[j];b=p[(j+1)%len(p)];c=p[(j+2)%len(p)]
  q1=a*.62+center*.38;q2=b*.66+center*.34;q3=c*.22+center*.78
  q4=center*.80+a*.20
  secondary=[tuple(q1),tuple(q2),tuple(q2*.48+q3*.52),tuple(q3),tuple(q4)]
  dark={'#25364a':'#162332','#37475c':'#25364a','#4f5d71':'#37475c'}[col]
  path(secondary,dark,'secondary-plane')
 # Narrow internal angular cleft on selected broad masses.
 if len(p)>4 and R.random()<.28:
  j=R.randrange(len(p));a=p[j];center=np.mean(p,axis=0);b=a*.34+center*.66;c=p[(j+2)%len(p)]*.33+center*.67
  path([tuple(a),tuple(b),tuple(c),tuple(b+[3,5])],'#162332','small-cleft')
svg.append('</g><g id="directed-connected-major-faults">')
faults=[
[(-1450,1320),(-1335,1580),(-1410,1780),(-1270,2020),(-1310,2250),(-1150,2485),(-1195,2810),(-1015,3150),(-1110,3690)],
[(-760,1320),(-890,1620),(-815,1850),(-950,2130),(-820,2370),(-850,2660),(-670,2870)],
[(-250,1380),(-330,1670),(-175,1950),(-215,2140),(-80,2490),(-155,2760),(15,3100),(-65,3690)],
[(440,1310),(335,1610),(415,1850),(280,2080),(355,2350),(245,2560),(290,2900),(170,3175),(255,3690)],
[(1010,1320),(850,1560),(940,1775),(775,2070),(825,2300),(670,2630),(750,2910),(630,3270),(710,3700)],
[(1530,1320),(1660,1590),(1590,1810),(1760,2125),(1700,2430),(1840,2710),(1790,3040),(1930,3310),(1860,3690)],
[(2320,1310),(2150,1620),(2240,1880),(2075,2140),(2140,2440),(2010,2760),(2115,3090),(2000,3690)],
[(2770,1320),(2875,1610),(2780,1930),(2915,2190),(2835,2490),(2960,2750),(2860,3000),(2995,3340),(2910,3680)],
[(3550,1310),(3410,1650),(3500,1950),(3360,2210),(3450,2570),(3300,2880),(3370,3130),(3220,3470),(3300,3690)],
[(-1700,2460),(-1520,2335),(-1310,2250),(-1130,2080),(-950,2130)],
[(-850,2660),(-620,2550),(-430,2605),(-80,2490)],
[(290,2900),(460,2730),(670,2630)],
[(775,2070),(1040,1940),(1240,1990),(1450,1885),(1590,1810)],
[(710,3700),(920,3450),(1120,3390),(1300,3125),(1510,3060),(1790,3040)],
[(2140,2440),(2390,2330),(2530,2390),(2680,2280),(2915,2190)],
[(2860,3000),(3090,2930),(3300,2880)],
[(3450,2570),(3680,2410),(3920,2460)]]
# Individually planned upper continuations, not affine enlargement of lower slab.
upper=[
[(-1640,160),(-1515,420),(-1600,615),(-1430,845),(-1510,1080)],
[(-635,170),(-760,390),(-660,610),(-815,820),(-700,1060)],
[(-420,170),(-310,450),(-410,680),(-275,910),(-350,1110)],
[(285,160),(420,390),(310,655),(480,855),(380,1085)],
[(1170,160),(1050,440),(1120,650),(970,865),(1105,1090)],
[(1390,160),(1500,410),(1420,630),(1560,880),(1470,1110)],
[(2450,160),(2300,420),(2410,670),(2250,910),(2395,1120)],
[(2620,160),(2780,450),(2690,655),(2850,890),(2730,1130)],
[(3700,160),(3540,380),(3635,635),(3480,875),(3620,1100)]]
for k in range(9):faults[k]=upper[k]+faults[k]
faults.extend([
[(-2040,1570),(-1850,1420),(-1910,1190),(-1790,940),(-1850,675),(-1730,440),(-1775,160)],
[(-2040,2850),(-1870,2700),(-1930,2450),(-1790,2190),(-1840,1910),(-1700,1710)],
[(-1515,420),(-1260,555),(-1100,510),(-920,690),(-815,820)],
[(-700,1060),(-510,1190),(-350,1110)],
[(310,655),(100,780),(-80,730),(-275,910)],
[(970,865),(750,990),(630,950),(380,1085)],
[(1560,880),(1770,1010),(1960,945),(2250,910)],
[(2410,670),(2560,735),(2690,655)],
[(2850,890),(3050,765),(3240,850),(3480,875)],
[(3620,1100),(3810,990),(3940,1040)]])
for k,line in enumerate(faults):
 # Interrupted-width tapered darkness, slanted rather than ledges.
 left=[];right=[]
 for j,(x,y) in enumerate(line):
  w=[7,15,4,22,11,6,18][(j+k)%7]
  if -1000<x<3200 and y<1750:w*=.32
  left.append((x-w,y-3));right.append((x+w*.55,y+5))
 path(left+right[::-1],'#25364a' if min(y for x,y in line)<1750 else '#162332','connected-fault')
 # Small occasional cleavage glints alongside major fractures, never full-length rails.
 for j in range(1,len(line)-1,3):
  if line[j][1]<1750:continue
  a=np.array(line[j-1]);b=np.array(line[j]);mid=a*.3+b*.7
  path([tuple(a+[-15,0]),tuple(mid+[-18,-2]),tuple(b+[-5,1]),tuple(mid+[-8,2])],'#4f5d71','fault-face')
svg.extend(['</g>','</g></svg>'])
(out/'whole-native-field.svg').write_text('\n'.join(svg))
print('native paths',n,'seeds',len(pts))
