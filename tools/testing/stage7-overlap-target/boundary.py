import json,re,math
from pathlib import Path
import numpy as np
from PIL import Image
cfg=json.load(open(Path(__file__).with_name('config.json')));groups=[]
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

def classify(view,meta,x,y,before,after,cap):
 assert meta['bodyPose']=={'x':0,'y':0,'scale':3.13}
 cam=meta['camera'];d=meta['officialDPR'];f=d*cam['scale']*3.13
 x0=(cam['x']+(x-d*view['w']/2)/(d*cam['scale']))/3.13;y0=(cam['y']+(y-d*view['h']/2)/(d*cam['scale']))/3.13;box=[x0,y0,x0+1/f,y0+1/f];hits=[i for i,g in enumerate(groups) if intersects(box,g)];dist=min(distance(np.array([(box[0]+box[2])/2,(box[1]+box[3])/2]),g) for g in groups)*f
 def ground(x):
  for a,b in zip(cfg['rootFloorControl'],cfg['rootFloorControl'][1:]):
   if a['x']<=x<=b['x']:return a['y']+(b['y']-a['y'])*(x-a['x'])/(b['x']-a['x'])
  raise AssertionError('Outside root floor controls')
 floorXs=[box[0]*3.13,box[2]*3.13]+[q['x'] for q in cfg['rootFloorControl'] if box[0]*3.13<q['x']<box[2]*3.13];below=min(box[1]*3.13-ground(wx) for wx in floorXs)
 delta=int(np.max(abs(before.astype(int)-after.astype(int))))
 assert before[3]==after[3]==255 and cap[3]==0 and below>0 and delta==1 and dist<=1,(view['name'],x,y,'Not approved opaque internal 1-level boundary diagnostic',delta,dist,below)
 return dict(x=int(x),y=int(y),rgbMaxDifference=delta,sourceFootprint=box,intersectingPlanes=hits,centerDistancePhysicalPixels=dist,minWorldBelowFloor=below,classification='Opaque nonwalk 1-level difference within1physical pixel of approved face boundary; no renderer-cause assertion; actual Scene protection independently required')
