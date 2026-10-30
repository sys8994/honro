"""Reuse traced master on actual35/37 ground profiles, preserving instance anchors."""
import json,xml.etree.ElementTree as E,numpy as np
from pathlib import Path
from svgpathtools import parse_path,Line
D=Path(__file__).parent;ROOT=D.parents[2];world=json.loads((ROOT/'shared/data/act4/world.json').read_text())
r=E.parse(D/'stone-ramp-cover-master.svg').getroot();outer=parse_path(next(e.attrib['d'] for e in r.iter() if e.get('id')=='path6'));xmin,xmax,ymin,ymax=outer.bbox();sx=360/(xmax-xmin);sy=.34
master=json.loads((D/'stone-ramp-cover-master-asset.json').read_text()); rows=[]
def bottom(x):
 hits=[]
 for seg in outer:
  try:
   for t,u in seg.intersect(Line(complex(x,-2000),complex(x,2000))):hits.append(seg.point(t).imag)
  except ValueError:pass
 return max(hits) if hits else ymax
baseknots=[xmin+.001,xmax-.001,*np.linspace(xmin+1,xmax-1,13).tolist()]
def rdp(ps,eps):
 if len(ps)<=2:return ps
 a=np.array(ps[0]);b=np.array(ps[-1]);v=b-a;vv=v@v
 ds=[np.linalg.norm(np.array(p)-(a+min(1,max(0,((np.array(p)-a)@v)/vv))*v)) if vv else np.linalg.norm(np.array(p)-a) for p in ps];i=int(np.argmax(ds))
 return rdp(ps[:i+1],eps)[:-1]+rdp(ps[i:],eps) if ds[i]>eps else [ps[0],ps[-1]]
for s in world['stages']:
 if s['id'] not in ['stage-35','stage-37']:continue
 for e in s['elements']:
  if 'stone-cover-natural' not in e.get('assetId',''):continue
  n=int(s['id'].split('-')[1]);z=e['scale'];ex=e['x'];ey=e['y'];points=next(t['points'] for t in s['terrains'] if t['id']==f'a4-{n}-land')
  # Select upper land boundary in increasing-x order; exclude deep closing polygon.
  top=[]
  for p in points:
   if top and p['x']<top[-1]['x']:break
   top.append(p)
  def support(wx):
   for a,b in zip(top,top[1:]):
    if a['x']<=wx<=b['x'] and a['x']!=b['x']:return a['y']+(wx-a['x'])*(b['y']-a['y'])/(b['x']-a['x'])
   raise ValueError(('No support',s['id'],wx))
  def worldX(x):return ex+(-180+(x-xmin)*sx)*z
  cuts=[xmin+((p['x']-ex)/z+180)/sx for p in top if ex-180*z<p['x']<ex+180*z];knots=sorted(set(baseknots+cuts));bs=[bottom(x) for x in knots]
  def warp(x,y):return [-180+(x-xmin)*sx,sy*(y-float(np.interp(x,knots,bs)))+(support(worldX(x))-ey)/z+1.5]
  a=json.loads(json.dumps(master));v=a['vector'];v['symbols']={'stone-source':v['root']};v['clips']={};children=[]
  for i,(lo,hi) in enumerate(zip(knots[:-1],knots[1:])):
   m=(bs[i+1]-bs[i])/(hi-lo);b=bs[i]-m*lo;tlo=(support(worldX(lo))-ey)/z;thi=(support(worldX(hi))-ey)/z;tm=(thi-tlo)/(hi-lo);tb=tlo-tm*lo;c=tm-sy*m;f=tb-sy*b+1.5;dx=-180-xmin*sx;lx=sx*lo+dx;hx=sx*hi+dx;key=f'slice-{i}';v['clips'][key]=[f'M{lx-.00001} -2000H{hx+.00001}V2000H{lx-.00001}Z'];children.append({'tag':'g','clipPath':key,'pixelSnapClip':True,'children':[{'tag':'g','transform':[sx,c,0,sy,dx,f],'children':[{'tag':'use','symbol':'stone-source'}]}]})
  v['root']={'tag':'g','children':children};ps=[]
  for seg in outer:
   for t in np.linspace(0,1,max(3,int(seg.length()/3)),endpoint=False):
    p=seg.point(t);ps.append(warp(p.real,p.imag))
  ps.append(ps[0]);poly=rdp(ps,.22)[:-1];xy=np.array(ps);box={'x':float(xy[:,0].min()),'y':float(xy[:,1].min()),'w':float(np.ptp(xy[:,0])),'h':float(np.ptp(xy[:,1]))};id=f's{n}-silhouette:{e["id"]}-cover-v3';a.update(id=id,name='Ground-supported broken stone cover',category='architecture',material='rock',breakable=False,hp=360,oneWay=False,climbable=False,collision=[[{'x':round(x,5),'y':round(y,5)} for x,y in poly]],bounds=box,anchor={'x':0,'y':0});a['reference'].update(bounds=box,foot={'x':0,'y':(support(ex)-ey)/z+1.5});v['viewBox']=[box[k] for k in ['x','y','w','h']];a['params'].update(source='stone-ramp-cover-master.svg',supportFit={'sourceBottom':list(zip(knots,bs)),'targetSupportId':f'a4-{n}-land','instanceFoot':[ex,ey],'instanceScale':z,'collision':'authoredouterpath6flattened+0.22localRDP;samepaintwarp','sourceScaleX':sx,'sourceScaleY':sy,'burialLocal':1.5});name=f'{e["id"]}-asset.json';(D/name).write_text(json.dumps(a,separators=(',',':')));rows.append({'stageId':s['id'],'instanceId':e['id'],'oldAssetId':e['assetId'],'assetFile':str(D/name),'newAssetId':id,'instanceUnchanged':True,'sourceOuter':'path6','collisionVertices':len(poly),'materialChange':'implicitwood→explicitrock;indestructiblepreserved','supportSamples':[{'x':x,'groundY':support(x)} for x in [ex-180*z,ex,ex+180*z]]})
(D/'related-cover-variants.json').write_text(json.dumps(rows,indent=2));print(len(rows),'fittedvariants')
