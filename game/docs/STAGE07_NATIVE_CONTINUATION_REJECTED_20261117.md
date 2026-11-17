# Stage 7 native continuation study: rejected

This is a negative art experiment, NOT a production fix or final acceptance. No runtime, asset, physics, save, master, or Pages changes.

Source: `shared/assets/environment/act1-sites/stage07.json`, body SHA256 acbffaafb8a346e3c28d039a17f8d1dd1f2f525b1563860727e45d3bf4651193. The source BODY SVG is an exact path/clip/transform export. Cubic/line intersections at source y1065 yield 58 overlaid color intervals. Original BODY above y1065 remains unchanged. The old artificial closing edge y1065..1074 is cropped for this display-only study.

Native Inkscape previews directly inspected at close-up and desktop-minimum approximation. V1 extends boundary regions and was rejected because it still reads as long stretched columns, despite being newly constructed vector paths. V2 ends every boundary region within 7..230 source pixels and supplies finite irregular facets below; it was rejected because the sharp triangular pattern is inconsistent with the original organic curved stone, and transition remains visible. Neither should be traced, optimized, integrated or described as fixed. White in previews is transparent background, not actual game sky. No actual Chrome/public UI/device/performance/gameplay validation was run.

Protection check: same Inkscape backend, source window [0,965,1448,100], 144800 pixels, RGBA changed=0, max difference=0. This is a bounded top-edge proof, not every original-body pixel or full game proof. No generated raster image edited. Source-only vector composition experiment.

## Reproduction prerequisites

Python numpy/scipy, Inkscape, and exact BODY SVG at `stage7-exterior-study/body-original.svg`. Run from workspace root after creating `stage7-native-study`. The algorithms are deterministic with seed704; source geometry and original paints remain in the output verbatim above the display crop.


## build-v1.py
```python
import re,math,json,random,copy,subprocess
import numpy as np
import xml.etree.ElementTree as E
from pathlib import Path
O=Path('stage7-native-study');NS='{http://www.w3.org/2000/svg}'
r=E.parse('stage7-exterior-study/body-original.svg').getroot();sx=1.666283084004603;sy=1.665644171779141;Y=1065.; y0=Y/sy
# Exact cubic/line intersection, not raster colour sampling.
def crossings(d,y):
 t=re.findall('[MLCZ]|[-+]?(?:\\d*\\.\\d+|\\d+)(?:[eE][-+]?\\d+)?',d); i=0; p=(0.,0.);start=p;out=[]
 def edge(a,b):
  if (a[1]<=y<b[1]) or (b[1]<=y<a[1]):out.append((a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]),1 if b[1]>a[1] else -1))
 while i<len(t):
  c=t[i];i+=1
  if c in ('M','L'):
   q=(float(t[i]),float(t[i+1]));i+=2
   if c=='L':edge(p,q)
   else:start=q
   p=q
  elif c=='C':
   q=[p]+[(float(t[i+j]),float(t[i+j+1])) for j in (0,2,4)];i+=6
   yy=[a[1] for a in q];pol=[-yy[0]+3*yy[1]-3*yy[2]+yy[3],3*yy[0]-6*yy[1]+3*yy[2],-3*yy[0]+3*yy[1],yy[0]-y]
   roots=np.roots(np.trim_zeros(pol,'f'))
   for v in roots:
    if abs(v.imag)<1e-7 and 0<=v.real<1:
     u=v.real;xx=sum(q[k][0]*math.comb(3,k)*u**k*(1-u)**(3-k) for k in range(4));dy=3*pol[0]*u*u+2*pol[1]*u+pol[2]
     if abs(dy)>1e-8:out.append((xx,1 if dy>0 else -1))
   p=q[-1]
  elif c=='Z':edge(p,start);p=start
  else:raise ValueError(c)
 return sorted(out)
paths=list(r.iter(NS+'path'));alpha=crossings(paths[0].get('d'),y0);lo=alpha[0][0]*sx;hi=alpha[-1][0]*sx
layers=[(p.get('fill'),crossings(p.get('d'),y0)) for p in paths[1:]]
breaks=sorted(set([lo,hi]+[x*sx for _,cs in layers for x,w in cs if lo<x*sx<hi]))
intervals=[]
for a,b in zip(breaks,breaks[1:]):
 x=(a+b)/2/sx; col='#251d25'
 for fill,cs in layers:
  if sum(w for xx,w in cs if xx<x):col=fill
 if intervals and intervals[-1][2]==col:intervals[-1][1]=b
 else:intervals.append([a,b,col])
(O/'intervals.json').write_text(json.dumps(intervals,indent=2));print('intervals',len(intervals),'bounds',lo,hi)
# Native vector continuation. Keep exact original top cut. Fan each colour region into nonuniform rock planes; no scaling old rows.
random.seed(704); svg=E.Element('svg',xmlns='http://www.w3.org/2000/svg',width='3848',height='3600',viewBox='-1200 0 3848 3600');defs=copy.deepcopy(r.find(NS+'defs'));svg.append(defs)
cl=E.SubElement(defs,'clipPath',id='original-upper');E.SubElement(cl,'rect',x='0',y='0',width='1448',height='1065')
# Each frontier is continuous, with varied length and direction rather than a repeated parallel column.
ys=[1065,1120,1240,1430,1710,2110,2600,3100,3600]
bounds=[intervals[0][0]]+[i[1] for i in intervals]
front=[]
for j,x in enumerate(bounds):
 arr=[]
 for k,y in enumerate(ys):
  depth=(y-1065)/2535
  # Widen only downward, natural sloped silhouette rather than top shelf.
  xx=724+(x-724)*(1+2.4*depth)+math.sin(j*1.13+k*.63)*min(55,(y-1065)*.17)
  arr.append((xx,y))
 front.append(arr)
for j,(a,b,col) in enumerate(intervals):
 pts=front[j]+list(reversed(front[j+1]));E.SubElement(svg,'path',fill=col,d='M '+' L '.join(f'{x:.4f},{y:.4f}' for x,y in pts)+' Z')
# Add bounded angular fractures farther below; colors from original palette, no new structures.
for k in range(90):
 y=random.uniform(1160,3550);depth=(y-1065)/2535;left=724+(lo-724)*(1+2.4*depth);right=724+(hi-724)*(1+2.4*depth);x=random.uniform(left+40,right-40);w=random.uniform(25,155);h=random.uniform(40,170)
 pts=[(x,y),(x+w*.65,y-h*.12),(x+w,y+h*.2),(x+w*.35,y+h),(x-w*.2,y+h*.73)]
 E.SubElement(svg,'path',fill=random.choice(['#43333a','#342832','#251d25','#4b3844']),opacity='.42',d='M '+' L '.join(f'{x:.3f},{yy:.3f}' for x,yy in pts)+' Z')
g=E.SubElement(svg,'g',{'clip-path':'url(#original-upper)'})
for e in list(r)[1:]:g.append(copy.deepcopy(e))
E.ElementTree(svg).write(O/'full.svg')
for name,box,width in [('full',[-1200,0,3848,3600],1000),('join',[-40,940,1530,360],1530),('desktop-min',[-40,940,1530,360],936),('portrait-min',[-40,800,1530,1000],275),('upper',[0,965,1448,100],1448)]:
 s=copy.deepcopy(svg);s.set('viewBox',' '.join(map(str,box)));s.set('width',str(width));s.set('height',str(round(width*box[3]/box[2])));E.ElementTree(s).write(O/(name+'.svg'));subprocess.run(['inkscape',str(O/(name+'.svg')),'--export-filename='+str(O/(name+'.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

```

## build.py
```python
import re,math,json,random,copy,subprocess
import numpy as np
import xml.etree.ElementTree as E
from pathlib import Path
O=Path('stage7-native-study');NS='{http://www.w3.org/2000/svg}'
r=E.parse('stage7-exterior-study/body-original.svg').getroot();sx=1.666283084004603;sy=1.665644171779141;Y=1065.; y0=Y/sy
# Exact cubic/line intersection, not raster colour sampling.
def crossings(d,y):
 t=re.findall('[MLCZ]|[-+]?(?:\\d*\\.\\d+|\\d+)(?:[eE][-+]?\\d+)?',d); i=0; p=(0.,0.);start=p;out=[]
 def edge(a,b):
  if (a[1]<=y<b[1]) or (b[1]<=y<a[1]):out.append((a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]),1 if b[1]>a[1] else -1))
 while i<len(t):
  c=t[i];i+=1
  if c in ('M','L'):
   q=(float(t[i]),float(t[i+1]));i+=2
   if c=='L':edge(p,q)
   else:start=q
   p=q
  elif c=='C':
   q=[p]+[(float(t[i+j]),float(t[i+j+1])) for j in (0,2,4)];i+=6
   yy=[a[1] for a in q];pol=[-yy[0]+3*yy[1]-3*yy[2]+yy[3],3*yy[0]-6*yy[1]+3*yy[2],-3*yy[0]+3*yy[1],yy[0]-y]
   roots=np.roots(np.trim_zeros(pol,'f'))
   for v in roots:
    if abs(v.imag)<1e-7 and 0<=v.real<1:
     u=v.real;xx=sum(q[k][0]*math.comb(3,k)*u**k*(1-u)**(3-k) for k in range(4));dy=3*pol[0]*u*u+2*pol[1]*u+pol[2]
     if abs(dy)>1e-8:out.append((xx,1 if dy>0 else -1))
   p=q[-1]
  elif c=='Z':edge(p,start);p=start
  else:raise ValueError(c)
 return sorted(out)
paths=list(r.iter(NS+'path'));alpha=crossings(paths[0].get('d'),y0);lo=alpha[0][0]*sx;hi=alpha[-1][0]*sx
layers=[(p.get('fill'),crossings(p.get('d'),y0)) for p in paths[1:]]
breaks=sorted(set([lo,hi]+[x*sx for _,cs in layers for x,w in cs if lo<x*sx<hi]))
intervals=[]
for a,b in zip(breaks,breaks[1:]):
 x=(a+b)/2/sx; col='#251d25'
 for fill,cs in layers:
  if sum(w for xx,w in cs if xx<x):col=fill
 if intervals and intervals[-1][2]==col:intervals[-1][1]=b
 else:intervals.append([a,b,col])
(O/'intervals.json').write_text(json.dumps(intervals,indent=2));print('intervals',len(intervals),'bounds',lo,hi)
# Native vector continuation. Keep exact original top cut. Fan each colour region into nonuniform rock planes; no scaling old rows.
random.seed(704); svg=E.Element('svg',xmlns='http://www.w3.org/2000/svg',width='3848',height='3600',viewBox='-1200 0 3848 3600');defs=copy.deepcopy(r.find(NS+'defs'));svg.append(defs)
cl=E.SubElement(defs,'clipPath',id='original-upper');E.SubElement(cl,'rect',x='0',y='0',width='1448',height='1065')
# Finite interlocking facets, not vertically extruded boundary stripes.
from scipy.spatial import Delaunay
clip=E.SubElement(defs,'clipPath',id='outer-rock')
outer=[(lo,1065),(lo-55,1210),(lo-210,1450),(lo-365,1780),(lo-570,2190),(lo-900,2780),(-1400,3600),(2850,3600),(hi+850,2780),(hi+535,2190),(hi+330,1780),(hi+180,1450),(hi+50,1210),(hi,1065)]
E.SubElement(clip,'path',d='M '+' L '.join(f'{x},{y}' for x,y in outer)+' Z')
field=E.SubElement(svg,'g',{'clip-path':'url(#outer-rock)'})
E.SubElement(field,'rect',x='-1500',y='1065',width='4500',height='2600',fill='#342832')
pts=[(-1600,1000),(3100,1000),(-1600,3800),(3100,3800)]
for y in range(1090,3801,145):
 for x in range(-1500,3101,150):pts.append((x+random.uniform(-65,65),y+random.uniform(-55,55)))
tri=Delaunay(np.array(pts));palette=['#342832','#342832','#43333a','#4b3844','#43333a','#251d25','#614b56']
for ids in tri.simplices:
 ps=[pts[i] for i in ids];col=random.choice(palette)
 E.SubElement(field,'path',fill=col,d='M '+' L '.join(f'{x:.3f},{y:.3f}' for x,y in ps)+' Z')
# Source crossing regions become short, individually terminated curved facets.
# Their original contour colours are analytically continued at y1065 exactly.
for j,(a,b,col) in enumerate(intervals):
 w=b-a;h=random.uniform(70,230);drift=random.uniform(-70,70)
 if col in ('#fdfdfd','#aca8a8','#c59b5c','#ae9056','#9c842f','#8b772b','#665823'):h=min(25,max(7,w*1.5))
 mid=(a+b)/2+drift;end=1065+h
 d=f'M {a:.6f},1065 L {b:.6f},1065 C {b+drift*.25:.6f},{1065+h*.36:.6f} {mid+w*.3:.6f},{1065+h*.72:.6f} {mid:.6f},{end:.6f} C {mid-w*.15:.6f},{1065+h*.9:.6f} {a+drift*.2:.6f},{1065+h*.38:.6f} {a:.6f},1065 Z'
 E.SubElement(field,'path',fill=col,d=d)
g=E.SubElement(svg,'g',{'clip-path':'url(#original-upper)'})
for e in list(r)[1:]:g.append(copy.deepcopy(e))
E.ElementTree(svg).write(O/'full.svg')
for name,box,width in [('full',[-1200,0,3848,3600],1000),('join',[-40,940,1530,360],1530),('desktop-min',[-40,940,1530,360],936),('portrait-min',[-40,800,1530,1000],275),('upper',[0,965,1448,100],1448)]:
 s=copy.deepcopy(svg);s.set('viewBox',' '.join(map(str,box)));s.set('width',str(width));s.set('height',str(round(width*box[3]/box[2])));E.ElementTree(s).write(O/(name+'.svg'));subprocess.run(['inkscape',str(O/(name+'.svg')),'--export-filename='+str(O/(name+'.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

```

## Final local evidence SHA256
- full.svg: 2c6bbe32c6a0c219a06d8cd70f9daf2cdae1fbd94dd452915d32f1a7f8999199
- full.png: e0ac76e971136ca8131468a03463a08292edcc04f6335f607a1af36b7fc89211
- join.png: a1dc4a467218939cb84bcb452c870538f7557ae2facc4d2683827bb2e601c4d5
- desktop-min.png: 5f78799393461325b7c6adf521c6f097cb13ddc907681d3a8e211f1c596de436
- portrait-min.png: 8181dbd8431f656a6d29550b935f7cd4a13021ff9cc2169ecd52cd8fc56bbdc0
- upper.png: bc460413c1b44059452d1a9f33e0e2eb8441f1eeab36ce4c49aaf7b97eb7017f
- original-upper.png: bc460413c1b44059452d1a9f33e0e2eb8441f1eeab36ce4c49aaf7b97eb7017f
- intervals.json: 783d2b9a2a1b9c1057938bd1d4fc6be6a7c2de987ac75a6db9898d9784f8752a

## Design blocker and next artwork requirements

At source y1065 the opaque silhouette spans x15.204795..1420.163998. The 58 visible color intervals are differently sized slices of original curved rock faces, shadows, and a few narrow pale/ochre paint remnants. At source y1074.34 the original alpha ends in an artificial flat close. The permitted replacement band is only 9.34 source pixels, about29.2 world pixels. The lowest actual walking surface is source1021 (world3195.73), so replacement is below the walk surface; however preserving y<=1065 means the original faces cannot be reshaped to provide longer organic transitions.

An exterior must continue the tangent direction, local curvature, area, darkness, and relative scale of each principal rock face at the cut, then terminate each face naturally within a varied depth. Merely matching every color at a row proves color continuity but not shape continuity. Carrying every interval to the bottom creates columns; independent tessellation creates a different style. Ochre/gray residual intervals must not become long moss strips or pale outlines. No new walkable-looking ledges/arches should be added. The new outer silhouette should widen only below the join with irregular, nonhorizontal edges. Max zoom-out coverage must ultimately include the existing target extent x[-1200,2648], y3600 (source), not just a small decorative join. A hand-art-directed continuation of the actual original curved rock forms is needed before committing new exterior geometry; the rejected procedural outputs are not an acceptable substitute.

Native visual evidence: desktop-min.png shows the broad left/right face continuations and thin spikes beneath x~200..1000 at y1065..1295; full.png shows incompatible regular triangular facet texture across y~1300..3600. These are study screenshots, not screenshots of public gameplay.

Visible source color intervals for reproducibility (x start, x end, fill):
```json
[
  [
    15.204794783275874,
    15.811700645619712,
    "#aca8a8"
  ],
  [
    15.811700645619712,
    16.180752263088447,
    "#ae9056"
  ],
  [
    16.180752263088447,
    17.6248289851422,
    "#614b56"
  ],
  [
    17.6248289851422,
    18.02299615960392,
    "#4b3844"
  ],
  [
    18.02299615960392,
    19.082053287429584,
    "#43333a"
  ],
  [
    19.082053287429584,
    19.56669845277496,
    "#342832"
  ],
  [
    19.56669845277496,
    56.596163334768846,
    "#251d25"
  ],
  [
    56.596163334768846,
    69.86167523668577,
    "#342832"
  ],
  [
    69.86167523668577,
    74.4784574953649,
    "#251d25"
  ],
  [
    74.4784574953649,
    139.73483676820763,
    "#342832"
  ],
  [
    139.73483676820763,
    182.00516557984903,
    "#251d25"
  ],
  [
    182.00516557984903,
    188.44376615207324,
    "#342832"
  ],
  [
    188.44376615207324,
    191.84589179344076,
    "#43333a"
  ],
  [
    191.84589179344076,
    321.2213137132796,
    "#342832"
  ],
  [
    321.2213137132796,
    328.573416660066,
    "#43333a"
  ],
  [
    328.573416660066,
    346.16571635816956,
    "#4b3844"
  ],
  [
    346.16571635816956,
    361.84894974123176,
    "#43333a"
  ],
  [
    361.84894974123176,
    371.73428997163575,
    "#342832"
  ],
  [
    371.73428997163575,
    453.8970254097568,
    "#43333a"
  ],
  [
    453.8970254097568,
    458.38985459557733,
    "#665823"
  ],
  [
    458.38985459557733,
    460.9510593040182,
    "#43333a"
  ],
  [
    460.9510593040182,
    466.8302674181943,
    "#342832"
  ],
  [
    466.8302674181943,
    480.24434179338704,
    "#251d25"
  ],
  [
    480.24434179338704,
    491.46886808571395,
    "#342832"
  ],
  [
    491.46886808571395,
    542.6244727516907,
    "#251d25"
  ],
  [
    542.6244727516907,
    550.6379088123158,
    "#342832"
  ],
  [
    550.6379088123158,
    564.4552464312143,
    "#251d25"
  ],
  [
    564.4552464312143,
    569.6299675714039,
    "#342832"
  ],
  [
    569.6299675714039,
    583.2203665301541,
    "#43333a"
  ],
  [
    583.2203665301541,
    597.0572458308218,
    "#342832"
  ],
  [
    597.0572458308218,
    655.2162133265127,
    "#251d25"
  ],
  [
    655.2162133265127,
    665.708152706721,
    "#342832"
  ],
  [
    665.708152706721,
    668.9985157368507,
    "#43333a"
  ],
  [
    668.9985157368507,
    697.9784413481365,
    "#4b3844"
  ],
  [
    697.9784413481365,
    703.4347493182888,
    "#43333a"
  ],
  [
    703.4347493182888,
    720.175784497546,
    "#342832"
  ],
  [
    720.175784497546,
    850.7273827040585,
    "#251d25"
  ],
  [
    850.7273827040585,
    855.8978251638968,
    "#342832"
  ],
  [
    855.8978251638968,
    858.3162636947284,
    "#43333a"
  ],
  [
    858.3162636947284,
    869.4471352045383,
    "#4b3844"
  ],
  [
    869.4471352045383,
    949.5431820277662,
    "#43333a"
  ],
  [
    949.5431820277662,
    955.5092157801531,
    "#342832"
  ],
  [
    955.5092157801531,
    970.3374911436869,
    "#251d25"
  ],
  [
    970.3374911436869,
    986.1643311121022,
    "#342832"
  ],
  [
    986.1643311121022,
    1024.3098964326812,
    "#251d25"
  ],
  [
    1024.3098964326812,
    1043.8516849902348,
    "#342832"
  ],
  [
    1043.8516849902348,
    1137.068778682288,
    "#43333a"
  ],
  [
    1137.068778682288,
    1150.0229922912795,
    "#342832"
  ],
  [
    1150.0229922912795,
    1204.336404707148,
    "#251d25"
  ],
  [
    1204.336404707148,
    1225.3082713844738,
    "#342832"
  ],
  [
    1225.3082713844738,
    1328.626893352859,
    "#251d25"
  ],
  [
    1328.626893352859,
    1332.819178770271,
    "#342832"
  ],
  [
    1332.819178770271,
    1413.1377869827597,
    "#251d25"
  ],
  [
    1413.1377869827597,
    1415.6930712006488,
    "#342832"
  ],
  [
    1415.6930712006488,
    1415.7967908302019,
    "#43333a"
  ],
  [
    1415.7967908302019,
    1416.5933914187078,
    "#4b3844"
  ],
  [
    1416.5933914187078,
    1418.152866753325,
    "#614b56"
  ],
  [
    1418.152866753325,
    1420.163998027289,
    "#aca8a8"
  ]
]
```
