import json,re,math
from pathlib import Path
import numpy as np
from PIL import Image
cfg=json.load(open('stage7-combined-final-ci/config.json'));data=Path('stage7-combined-final-chrome/evidence');groups=[]
for node in cfg['allowedEditPlanes']:
 tok=re.findall(r'[MLQZ]|-?\d+(?:\.\d+)?',node['d']);i=0;p0=start=None;segs=[]
 while i<len(tok):
  cmd=tok[i];i+=1
  if cmd=='M':p0=start=np.array([float(tok[i]),float(tok[i+1])]);i+=2
  elif cmd=='L':end=np.array([float(tok[i]),float(tok[i+1])]);i+=2;segs.append((np.zeros(2),end-p0,p0.copy()));p0=end
  elif cmd=='Q':ctrl=np.array([float(tok[i]),float(tok[i+1])]);end=np.array([float(tok[i+2]),float(tok[i+3])]);i+=4;segs.append((p0-2*ctrl+end,2*(ctrl-p0),p0.copy()));p0=end
  elif cmd=='Z':segs.append((np.zeros(2),start-p0,p0.copy()));p0=start
 groups.append(segs)
def roots(coeff):
 a=np.trim_zeros(np.array(coeff,dtype=float),'f')
 if len(a)<2:return []
 return [float(x.real) for x in np.roots(a) if abs(x.imag)<1e-8 and -1e-10<=x.real<=1+1e-10]
def point(a,b,c,t):return a*t*t+b*t+c
def inside(p,segs):
 wind=0
 for a,b,c in segs:
  for t in roots([a[1],b[1],c[1]-p[1]]):
   if t>=1-1e-10:continue
   q=point(a,b,c,t);dy=2*a[1]*t+b[1]
   if q[0]>p[0] and abs(dy)>1e-9:wind+=1 if dy>0 else -1
 return wind!=0
def intersects(box,segs):
 lo=np.array(box[:2]);hi=np.array(box[2:]);corners=[(x,y) for x in [lo[0],hi[0]] for y in [lo[1],hi[1]]]
 if any(inside(p,segs) for p in corners):return True
 for a,b,c in segs:
  if np.all(c>=lo)&np.all(c<=hi):return True
  for axis in [0,1]:
   for edge in [lo[axis],hi[axis]]:
    for t in roots([a[axis],b[axis],c[axis]-edge]):
     q=point(a,b,c,t)
     if lo[1-axis]-1e-9<=q[1-axis]<=hi[1-axis]+1e-9:return True
 return False
def distance(center,segs):
 best=math.inf
 for a,b,c in segs:
  c1=c-center;ts=[0,1]+roots([2*np.dot(a,a),3*np.dot(a,b),np.dot(b,b)+2*np.dot(a,c1),np.dot(b,c1)])
  best=min(best,*[float(np.linalg.norm(point(a,b,c,t)-center)) for t in ts])
 return best
terrain=json.load(open('stage7-final-edge-study/stage.json'))['terrains'][0]
terrain=next(t for t in json.load(open('stage7-final-edge-study/stage.json'))['terrains'] if t['id']=='root-floor')
def ground(x):
 for a,b in zip(terrain['control'],terrain['control'][1:]):
  if a['x']<=x<=b['x']:return a['y']+(b['y']-a['y'])*(x-a['x'])/(b['x']-a['x'])
 raise AssertionError(x)
rows=[]
for view in cfg['views']:
 n=view['name'];j=json.load(open(data/f'candidate-{n}.json'));cam=j['camera'];d=j['officialDPR'];factor=d*cam['scale']*3.13
 def im(v,k):return np.array(Image.open(data/f'{v}-{n}-{k}-mask.png').convert('RGBA'))
 a,b=im('baseline','body'),im('candidate','body');mask=im('candidate','allowedEdit');caps=im('candidate','caps');diff=np.max(abs(a.astype(int)-b.astype(int)),2);ys,xs=np.where((diff>0)&(mask[:,:,3]==0))
 for x,y in zip(xs,ys):
  x0=(cam['x']+(x-d*view['w']/2)/(d*cam['scale']))/3.13;y0=(cam['y']+(y-d*view['h']/2)/(d*cam['scale']))/3.13;box=[x0,y0,x0+1/factor,y0+1/factor];hit=[i for i,s in enumerate(groups) if intersects(box,s)];dist=min(distance(np.array([(box[0]+box[2])/2,(box[1]+box[3])/2]),s) for s in groups)*factor;below=min(sy*3.13-ground(sx*3.13) for sx in [box[0],box[2]] for sy in [box[1],box[3]])
  assert a[y,x,3]==b[y,x,3]==255 and caps[y,x,3]==0 and below>0
  rows.append(dict(view=n,x=int(x),y=int(y),rgbMaxDifference=int(diff[y,x]),whiteMaskAlpha=int(mask[y,x,3]),sourceFootprint=box,intersectingApprovedPlanes=hit,centerDistanceToClosestCurvePhysicalPixels=dist,footprintDistanceToApprovedPlane=0 if hit else None,minWorldUnitsBelowWalkFloor=below,bodyAlphaBeforeAfter=[255,255],capAlpha=0))
result=dict(method='Analytic line/quadratic Bézier crossings with each exact physical-pixel source-space square; polynomial roots and nonzero winding. No raster-mask dilation or RGB tolerance establishes acceptance.',count=len(rows),allFootprintsIntersectApprovedNonwalkPlanes=all(r["intersectingApprovedPlanes"] for r in rows),maxRGBDifference=max(r['rgbMaxDifference'] for r in rows),rows=rows);Path('stage7-p-failure-analysis/geometric-footprints-diagnostic.json').write_text(json.dumps(result,indent=2));print({k:v for k,v in result.items() if k!='rows'});print('max center distance',max(r['centerDistanceToClosestCurvePhysicalPixels'] for r in rows),'min walking clearance',min(r['minWorldUnitsBelowWalkFloor'] for r in rows))
