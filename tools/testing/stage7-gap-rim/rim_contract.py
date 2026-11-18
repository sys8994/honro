import math

def verify(a,b):
 assert a['worldWidth']==b['worldWidth']; width=a['worldWidth']
 expected=[];removed=0
 for group in a['rimGroups']:
  segs=[]
  for s in group['segments']:
   if group['id']!='root-floor' or not s['walkable']:segs.append(s);continue
   p,q=s['a'],s['z'];dx=q['x']-p['x'];lo,hi=0,1
   if abs(dx)<1e-8:
    if p['x']<0 or p['x']>width:removed+=1;continue
   else:
    t0,t1=sorted([(0-p['x'])/dx,(width-p['x'])/dx]);lo=max(0,t0);hi=min(1,t1)
    if lo>=hi:removed+=1;continue
   if lo==0 and hi==1:segs.append(s);continue
   removed+=1
   def point(t):return {k:p[k]+(q[k]-p[k])*t for k in ['x','y']}
   segs.append(dict(a=point(lo),z=point(hi),walkable=s['walkable']))
  if segs:expected.append(dict(id=group['id'],segments=segs))
 def same(x,y):
  if isinstance(x,dict):return x.keys()==y.keys() and all(same(x[k],y[k]) for k in x)
  if isinstance(x,list):return len(x)==len(y) and all(same(u,v) for u,v in zip(x,y))
  if isinstance(x,(int,float)) and not isinstance(x,bool):return abs(x-y)<=1e-7
  return x==y
 assert same(expected,b['rimGroups']),'Actual compiler rim differs beyond exact off-play root-floor segment clipping'
 assert removed>0,'Expected off-play contribution absent'
 return removed
