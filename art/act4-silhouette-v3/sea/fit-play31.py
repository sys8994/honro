import json,copy,math
from pathlib import Path
import xml.etree.ElementTree as E
import numpy as np
from scipy.interpolate import PchipInterpolator
from svgpathtools import parse_path
D=Path(__file__).parent
n=31
for side in ['left','right']:
 d=D/f'bank{n}'/f'play-{side}';mp=json.load(open(d/'mapping.json'));full=mp['top'];fx=[p['x'] for p in full];fy=[p['y'] for p in full];lo=mp['x'];hi=lo+mp['w'];top=[{'x':lo,'y':float(np.interp(lo,fx,fy))},*[p for p in full if lo<p['x']<hi],{'x':hi,'y':float(np.interp(hi,fx,fy))}];anchors=np.array([[p['x'],p['y']] for p in top]);sx=mp['w']/2168;sy=mp['h']/724;ox=mp['x'];oy=mp['y'];outer=parse_path(next(e.get('d') for e in E.parse(d/'ground-master.svg').getroot().iter() if e.get('id')=='path7'));pts=[]
 for seg in outer:
  for t in np.linspace(0,1,max(3,int(seg.length()/.35)),endpoint=False):
   q=seg.point(t)
   if q.imag<500 and 2<q.real<2170:pts.append([q.real,q.imag])
 pts=sorted(pts);xx=[];yy=[]
 for x,y in pts:
  if not xx or abs(x-xx[-1])>1e-7:xx.append(x);yy.append(y)
 raw=lambda wx:oy+sy*np.interp((np.asarray(wx)-ox)/sx+2,xx,yy)
 correction=PchipInterpolator(anchors[:,0],anchors[:,1]-raw(anchors[:,0]));knots=sorted(set([*anchors[:,0],*np.arange(ox,ox+mp['w'],500),ox+mp['w']]));corr=correction(knots)
 corrected=lambda x:float(raw(x)+np.interp(x,knots,corr))
 ps=[[float(x),corrected(x)] for x in sorted(set([*np.arange(ox,ox+mp['w'],5),ox+mp['w'],*anchors[:,0]]))]
 def rdp(ps,eps):
  if len(ps)<3:return ps
  ar=np.array(ps);a=ar[0];v=ar[-1]-a;t=np.clip((ar-a)@v/(v@v),0,1);dist=np.linalg.norm(ar-(a+t[:,None]*v),axis=1);i=int(np.argmax(dist))
  return rdp(ps[:i+1],eps)[:-1]+rdp(ps[i:],eps) if dist[i]>eps else [ps[0],ps[-1]]
 poly=[]
 for l,r in zip(anchors[:-1,0],anchors[1:,0]):poly+=rdp([p for p in ps if l<=p[0]<=r],.75)[:-1]
 poly.append(ps[-1]);bottom=max(q['y'] for q in mp['sourcePoints']);terrain=[{'x':round(x,5),'y':round(y,5)} for x,y in poly]+[{'x':ox+mp['w'],'y':bottom},{'x':ox,'y':bottom}];assets=[];base=json.load(open(d/'source-asset.json'))
 breaks=[ox,ox+mp['w']]
 for part,(lo,hi) in enumerate(zip(breaks[:-1],breaks[1:])):
  a=copy.deepcopy(base);v=a['vector'];v['symbols']={'native-bank':v['root']};v['clips']={};knot=sorted(set([lo,*[x for x in knots if lo<x<hi],hi]));ch=[]
  for i,(l,r) in enumerate(zip(knot[:-1],knot[1:])):
   dl,dr=np.interp([l,r],knots,corr);m=(dr-dl)/(r-l);b=dl-m*l;key=f'slice-{i}';v['clips'][key]=[f'M{l-.00001} 0H{r+.00001}V{bottom}H{l-.00001}Z'];ch.append({'tag':'g','clipPath':key,'pixelSnapClip':True,'children':[{'tag':'g','transform':[sx,m*sx,0,sy,ox-2*sx,oy+b+m*(ox-2*sx)],'children':[{'tag':'use','symbol':'native-bank'}]}]})
  # Opaque engineered continuation wholly below authored strata; no additional decorative silhouette.
  deep=[(x,min(corrected(x)+500,oy+mp['h']-120)) for x in knot];deepd=' '.join(('M' if i==0 else 'L')+f'{x} {y}' for i,(x,y) in enumerate(deep))+f'L{hi} {bottom}H{lo}Z';ch.insert(0,{'tag':'path','d':deepd,'fill':'#233443'})
  v['root']={'tag':'g','children':ch};a['id']=f's{n}-silhouette:play-{side}-bank-v5-{part}';a['bounds']={'x':lo,'y':0,'w':hi-lo,'h':bottom};a['reference']['bounds']=a['bounds'];v['viewBox']=[lo,0,hi-lo,bottom];a['params'].update(collisionSource=mp['terrainId'],silhouetteUnderpaint=False,source='actual full-domain native ground-master.svg',fullDomain=[ox,ox+mp['w']],partDomain=[lo,hi],correction='PCHIP macro-anchor drift reconciliation; native authored interval contours retained; same top defines collider');assets.append(a)
 delta=np.array([q[1] for q in ps])-np.interp([q[0] for q in ps],anchors[:,0],anchors[:,1]);report={'stage':n,'vertices':len(poly),'domain':[ox,ox+mp['w']],'side':side,'sourceWorldPerPixel':sx,'minDeviationWorld':float(min(delta)),'maxDeviationWorld':float(max(delta)),'maxSlope':max(abs((b[1]-a[1])/(b[0]-a[0])) for a,b in zip(poly[:-1],poly[1:])),'rdpMaxErrorWorld':.75,'physicalBottom':bottom,'assetCount':len(assets)};(d/'assets.json').write_text(json.dumps(assets,separators=(',',':')));(d/'terrain.json').write_text(json.dumps(terrain,separators=(',',':')));(d/'fit-report.json').write_text(json.dumps(report,indent=2));print(report)
