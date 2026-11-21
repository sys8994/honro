"""Strict actual-PC/M two-image screen signed and old-line/new-fringe checks."""
import json,math
from pathlib import Path
from PIL import ImageChops
P=json.loads((Path(__file__).resolve().parent/'POSES.json').read_text())
S=P['scope']
def pixels(A,B,pose,north):
 assert A.size==B.size
 w,h=A.size;cw,ch=pose['backing']
 assert (w,h)in ((cw,ch),(cw,ch+1))
 ac,bc=map(lambda x:x.convert('RGBA'),(A,B))
 cs=ImageChops.difference(ac,bc).split()
 ds=ImageChops.lighter(ImageChops.lighter(cs[0],cs[1]),ImageChops.lighter(cs[2],cs[3]))
 s=pose['actual']['scale'];origin=pose['viewport'];x,y=origin['left'],origin['top']
 cnt=alpha=above=leftOrRight=underside=unsigned=0; examples=[]
 for i,n in enumerate(ds.getdata()):
  if not n:continue
  px=i%w;py=i//w; xl=x+px/s;xr=xl+1/s;yt=y+py/s;yb=yt+1/s
  permitted=not north and py<ch and S['minX']<=xl<=xr<=S['maxX'] and S['minY']<=yt<=yb<=S['maxY']
  cnt+=1;m=cs[3].getpixel((px,py))
  alpha+=m>0;above+=yt<S['minY'];underside+=yb>S['maxY'];leftOrRight+=xl<S['minX']or xr>S['maxX'];unsigned+=not permitted
  if len(examples)<12 and (not permitted or m):examples.append({'raw':[px,py],'world':[xl,yt,xr,yb],'A':ac.getpixel((px,py)),'B':bc.getpixel((px,py))})
 return {'changed':cnt,'alpha':alpha,'yBefore4800':above,'xOutsideSigned':leftOrRight,'yAfter5950':underside,'unsigned':unsigned,
         'offenders':examples,'strict':not(alpha or unsigned) and (cnt==0 if north else cnt>0)}
def longest(mask):
 run=long=0
 for a in mask:
  run=(run+1)if a else 0;long=max(long,run)
 return long
def at(points,x):
 for (a,b),(c,d) in zip(points,points[1:]):
  if a<=x<=c:return b+(d-b)*(x-a)/(c-a)
 return None
def rgbD(a,b):return max(abs(a[u]-b[u])for u in range(3))
def mL(p):return .2126*p[0]+.7152*p[1]+.0722*p[2]
def raster(A,B,pose):
 # Distinguish abrupt persistent old straight contour from a bright/warm AA halo
 # riding the actual new signed contour. Endpoint margin is a predeclared subset
 # solely for the diagnostic metric; strict pixel shape guard above remains full.
 a,b=map(lambda im:im.convert('RGB').load(),(A,B));w,h=A.size
 s=pose['actual']['scale']; x,y=(pose['viewport'][k]for k in ('left','top'))
 y0=math.floor((P['oldCutWU']-y)*s)
 assert 3<=y0<h-4
 cA=[];cB=[];fr=[];scan=0
 for j in range(w):
  xx=x+(j+.5)/s; yy=at(P['supportLowerContour'],xx)
  use=yy is not None and -3025<=xx<=10400
  if not use:cA.append(False);cB.append(False);fr.append(False);continue
  scan+=1
  near=range(y0-1,y0+2)
  cA.append(max(rgbD(a[j,k-1],a[j,k+1])for k in near)>=14)
  cB.append(max(rgbD(b[j,k-1],b[j,k+1])for k in near)>=14)
  py=math.floor((yy-y)*s); peak=[]; warmer=False
  for k in range(max(3,py-1),min(h-3,py+2)):
   mid=b[j,k];u=b[j,k-2];v=b[j,k+2]
   # Bright and warm relative to both actual adjacent rendered materials.
   d=mL(mid)-max(mL(u),mL(v))
   warm=(mid[0]-mid[2])-max(u[0]-u[2],v[0]-v[2])
   if d>=10 and warm>=8 and rgbD(mid,a[j,k])>=6:warmer=True;peak.append((j,k,round(d,3),warm))
  fr.append(warmer)
 total=sum(fr)
 m={'testedColumns':scan,'oldGlobalCutRow':y0,'oldBoundaryAColumns':sum(cA),'oldBoundaryBColumns':sum(cB),
    'oldBoundaryALongest':longest(cA),'oldBoundaryBLongest':longest(cB),
    'warmBrightBChangedColumns':total,'warmBrightBLongest':longest(fr),
    'interpretedAs':'actual composited pixels, not owner alpha. use independent raw pairs for human material/halo check'}
 return m
