"""Fit native Inkscape artwork to existing ramp; no invented decorative shapes."""
import json,xml.etree.ElementTree as E,numpy as np
from pathlib import Path
from svgpathtools import parse_path,Line
D=Path(__file__).parent
r=E.parse(D/'stone-ramp-cover-master.svg').getroot();outer=parse_path(next(e.attrib['d'] for e in r.iter() if e.get('id')=='path6'))
xmin,xmax,ymin,ymax=outer.bbox();sx=300/(xmax-xmin);sy=.30
worldX=lambda x:2130+(-150+(x-xmin)*sx)
support=lambda wx:1760
# Bottom profile is derived by vertical intersections with the authored outer path.
def bottom(x):
 hits=[]
 for seg in outer:
  try:
   for t,u in seg.intersect(Line(complex(x,-2000),complex(x,2000))):hits.append(seg.point(t).imag)
  except ValueError:pass
 return max(hits) if hits else ymax
knots=sorted(set([xmin+0.001,xmax-0.001,*np.linspace(xmin+1,xmax-1,13).tolist()])); bs=[bottom(x) for x in knots]
def warp(x,y):
 localx=-150+(x-xmin)*sx
 return [localx,sy*(y-float(np.interp(x,knots,bs)))+(support(worldX(x))-1760)+1.5]
a=json.loads((D/'stone-ramp-cover-master-asset.json').read_text());v=a['vector'];v['symbols']={'stone-source':v['root']};v['clips']={};children=[];segments=[]
for i,(lo,hi) in enumerate(zip(knots[:-1],knots[1:])):
 m=(bs[i+1]-bs[i])/(hi-lo); b=bs[i]-m*lo
 wx=worldX((lo+hi)/2); slope=0
 # local ramp slope per source x = slope*sx
 c=slope*sx-sy*m
 f=(support(worldX(lo))-1760)-slope*sx*lo-sy*b+1.5
 dx=-150-xmin*sx; lx=sx*lo+dx; hx=sx*hi+dx
 key=f'slice-{i}';v['clips'][key]=[f'M{lx-0.00001} -2000 H{hx+0.00001} V2000 H{lx-0.00001}Z'];trans=[sx,c,0,sy,dx,f]
 children.append({'tag':'g','clipPath':key,'pixelSnapClip':True,'children':[{'tag':'g','transform':trans,'children':[{'tag':'use','symbol':'stone-source'}]}]});segments.append({'sourceX':[lo,hi],'transform':trans})
v['root']={'tag':'g','children':children}
# Curve sample follows authored visible boundary; Douglas-Peucker bounded in world units.
points=[]
for seg in outer:
 for t in np.linspace(0,1,max(3,int(seg.length()/3)),endpoint=False):
  p=seg.point(t);points.append(warp(p.real,p.imag))
points.append(points[0])
def rdp(ps,eps):
 if len(ps)<=2:return ps
 a=np.array(ps[0]);b=np.array(ps[-1]);v=b-a;vv=v@v
 ds=[np.linalg.norm(np.array(p)-(a+min(1,max(0,((np.array(p)-a)@v)/vv))*v)) if vv else np.linalg.norm(np.array(p)-a) for p in ps]
 i=int(np.argmax(ds))
 return rdp(ps[:i+1],eps)[:-1]+rdp(ps[i:],eps) if ds[i]>eps else [ps[0],ps[-1]]
poly=rdp(points,.22)[:-1];xy=np.array(points);box={'x':float(xy[:,0].min()),'y':float(xy[:,1].min()),'w':float(np.ptp(xy[:,0])),'h':float(np.ptp(xy[:,1]))};a.update(material='rock',breakable=False,hp=360,oneWay=False,climbable=False,id='s32-silhouette:stone-landing-cover-v3',name='Flat-landing broken stone parapet',collision=[[{'x':round(x,5),'y':round(y,5)} for x,y in poly]],bounds=box,anchor={'x':0,'y':0});a['reference'].update(bounds=box,foot={'x':0,'y':1.5});v['viewBox']=[box[k] for k in ['x','y','w','h']];a['params'].update(source='stone-ramp-cover-master.svg',supportFit={'sourceBottom':list(zip(knots,bs)),'targetSupportId':'a4-32-back-alley','instanceFoot':[2130,1760],'instanceScale':1,'collision':'authored outerpath6 flattened and0.22local-unit RDP; same geometric warp as paint','sourceScaleX':sx,'sourceScaleY':sy,'burialLocal':1.5});(D/'stone-ramp-cover-asset.json').write_text(json.dumps(a,separators=(',',':')));(D/'support-fit.json').write_text(json.dumps({'segments':segments,'collisionVertices':len(poly),'bounds':box,'sourceOuter':'path6'},indent=2));print(len(poly),len(segments),box)
