import json,math,re
from svgpathtools import parse_path,Path,Line,CubicBezier,QuadraticBezier
p='/tmp/stage34-source/'
a=json.load(open(p+'asset.json'))
def prof(x,ps):
 if x<=ps[0][0]:return ps[0][1]
 for (u,v),(U,V) in zip(ps,ps[1:]):
  if x<=U:return v+(V-v)*(x-u)/(U-u)
 return ps[-1][1]
def warp(z):
 x,y=z.real,z.imag
 east=max(0,min(1,(x-1280)/256));down=max(0,min(1,(y-730)/294))
 dx=east**2*prof(y,[(0,0),(520,120),(620,260),(730,390),(810,350),(900,470),(1024,400)])
 dy=down**2*prof(x,[(0,150),(300,220),(600,170),(900,260),(1130,190),(1290,310),(1410,260),(1536,360)])
 return complex(x+dx,y+dy)
def path(d):
 groups=[]
 for sub in parse_path(d).continuous_subpaths():
  out=[]
  for seg in sub:
   n=max(1,math.ceil(abs(seg.end-seg.start)/32))
   for k in range(n):
    v=seg.cropped(k/n,(k+1)/n);start=out[-1].end if out else warp(v.start);end=warp(v.end)
    if isinstance(v,Line):out.append(Line(start,end))
    elif isinstance(v,CubicBezier):out.append(CubicBezier(start,warp(v.control1),warp(v.control2),end))
    elif isinstance(v,QuadraticBezier):out.append(QuadraticBezier(start,warp(v.control),end))
    else:raise Exception(type(v))
  groups.append(Path(*out).d()+(' Z' if sub.isclosed() else ''))
 return re.sub(r'[-+]?(?:[0-9]*\.[0-9]+|[0-9]+)(?:[eE][-+]?[0-9]+)?',lambda m:format(float(m.group()),'.2f').rstrip('0').rstrip('.'),' '.join(groups))
def walk(n):
 if 'd'in n:
  d=path(n.pop('d'))
  if len(d)<=60000:n['d']=d
  else:
   parts=[];cur=''
   for bit in re.findall(r'M[^M]+',d):
    if cur and len(cur+bit)>59000:parts.append(cur);cur=''
    cur+=bit
   if cur:parts.append(cur)
   n['dParts']=parts
 for c in n.get('children',[]):walk(c)
walk(a['vector']['root'])
for k,ds in a['vector']['clips'].items():a['vector']['clips'][k]=[path(d)for d in ds]
a['bounds']['w']=12000;a['bounds']['h']=8400;a['reference']['bounds']=a['bounds'].copy();a['vector']['viewBox']=[0,0,12000,8400]
json.dump(a,open(p+'asset-candidate.json','w'))
