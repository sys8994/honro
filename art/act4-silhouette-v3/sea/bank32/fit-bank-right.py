import json,xml.etree.ElementTree as E,numpy as np
from pathlib import Path
from svgpathtools import parse_path
from scipy.interpolate import PchipInterpolator
D=Path(__file__).parent
outer=parse_path(next(e.get('d') for e in E.parse(D/'ground-right-master.svg').getroot().iter() if e.get('id')=='path7'))
pts=[]
for seg in outer:
 for t in np.linspace(0,1,max(3,int(seg.length()/1.5)),endpoint=False):
  p=seg.point(t)
  if p.imag<400:pts.append([p.real,p.imag])
pts=np.array(sorted(pts));xx,idx=np.unique(pts[:,0],return_index=True);yy=pts[idx,1]
sx=3300/2172;sy=1100/724
anchors=np.array([[0,2010],[500,2010],[1000,2010],[1500,2010],[2000,2010],[2400,2010],[2800,1900],[3300,1900]])
raw=lambda wx:1700+sy*np.interp(wx/sx,xx,yy)
correction=PchipInterpolator(anchors[:,0],anchors[:,1]-raw(anchors[:,0]))
knots=sorted(set([*np.linspace(0,3300,25),*anchors[:,0]])); corrections=correction(knots)
def corrected(wx):return raw(wx)+np.interp(wx,knots,corrections)
a=json.loads((D/'source-right-asset.json').read_text());v=a['vector'];v['clips']={'authoredOuter':[outer.d()]};v['symbols']={'bank-source':{'tag':'g','clipPath':'authoredOuter','children':[v['root']]}};children=[{'tag':'path','d':'M-2 2600 H3302 V40600 H-2 Z','fill':'#233443'}]
for i,(lo,hi) in enumerate(zip(knots[:-1],knots[1:])):
 m=(corrections[i+1]-corrections[i])/(hi-lo);b=corrections[i]-m*lo
 key=f'slice-{i}';v['clips'][key]=[f'M{lo-.00001} 1500 H{hi+.00001} V40000 H{lo-.00001}Z'];children.append({'tag':'g','clipPath':key,'pixelSnapClip':True,'children':[{'tag':'g','transform':[sx,m*sx,0,sy,0,1700+b],'children':[{'tag':'use','symbol':'bank-source'}]}]})
children=children[1:]+[{'tag':'path','d':'M-2 2590 H3302 V40600 H-2Z','fill':'#233443'}];v['root']={'tag':'g','children':children};a['id']='s32-silhouette:bank32-right-profile-v3';a['name']='Stage32 authored coastal soil profile';a['bounds']={'x':-2,'y':1850,'w':3304,'h':38150};a['reference']['bounds']=a['bounds'];v['viewBox']=[-2,1850,3304,38150];a['params'].update(source='ground-right-master.svg',correction='PCHIP macro-anchor vertical drift reconciliation, piecewise affine paint and exact same collider surface',collisionIn='stage.terrains.a4-32-land',collisionSource='a4-32-land',silhouetteUnderpaint=False)
# Preserve medium authored contour, remove subpixel tessellation through bounded RDP.
ps=[[float(x),float(corrected(x))] for x in sorted(set([*np.arange(0,3300,3),3300,*anchors[:,0]]))]
def rdp(ps,eps):
 if len(ps)<3:return ps
 ar=np.array(ps);a=ar[0];v=ar[-1]-a;vv=v@v;t=np.clip((ar-a)@v/vv,0,1);ds=np.linalg.norm(ar-(a+t[:,None]*v),axis=1);i=int(np.argmax(ds))
 return rdp(ps[:i+1],eps)[:-1]+rdp(ps[i:],eps) if ds[i]>eps else [ps[0],ps[-1]]
poly=[]
for l,r in zip(anchors[:-1,0],anchors[1:,0]):
 q=rdp([p for p in ps if l<=p[0]<=r],.6);poly+=q[:-1]
poly.append(ps[-1]);slopes=[(b[1]-a[1])/(b[0]-a[0]) for a,b in zip(poly[:-1],poly[1:])]
base=np.interp(np.array(ps)[:,0],anchors[:,0],anchors[:,1]);delta=np.array(ps)[:,1]-base
(D/'asset-right.json').write_text(json.dumps(a,separators=(',',':')));(D/'terrain-top-right.json').write_text(json.dumps([dict(x=round(x,5),y=round(y,5)) for x,y in poly]));(D/'fit-report-right.json').write_text(json.dumps(dict(anchors=anchors.tolist(),sourceDriftCorrections=(anchors[:,1]-raw(anchors[:,0])).tolist(),vertices=len(poly),maxAbsSlope=max(abs(x) for x in slopes),minDeviation=float(min(delta)),maxDeviation=float(max(delta)),simplificationErrorWorld=.6,paintSliceCount=len(knots)-1),indent=2));print((D/'fit-report-right.json').read_text())
