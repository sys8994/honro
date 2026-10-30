import json,xml.etree.ElementTree as E,numpy as np
from pathlib import Path
from svgpathtools import parse_path
D=Path(__file__).parent;p=json.load(open('_local/reports/sea-silhouette-v3/stage32-rest-palette-v1.json'));s=next(s for s in p['stages'] if s['id']=='stage-32');terrain=s['terrains'][0]['points'];top=sorted([q for q in terrain if q['y']<4000],key=lambda q:q['x']);tx=[q['x'] for q in top];ty=[q['y'] for q in top];floor=lambda x:float(np.interp(x,tx,ty));sx=3300/2172;sy=1100/724;assets=[]
for name,lo,hi,sign,offset,source in [('left-far',-6000,-3300,1,6600,'left'),('left-near',-3300,0,-1,0,'left'),('right-near',6600,9900,-1,9900,'right'),('right-far',9900,12600,1,-9900,'right')]:
 src=json.load(open(D/('source-asset.json' if source=='left' else 'source-right-asset.json')));svg='ground-master.svg' if source=='left' else 'ground-right-master.svg';outer=parse_path(next(e.get('d') for e in E.parse(D/svg).getroot().iter() if e.get('id')=='path7'));pts=[]
 for seg in outer:
  for t in np.linspace(0,1,max(3,int(seg.length()/2)),endpoint=False):
   q=seg.point(t)
   if q.imag<400:pts.append([q.real,q.imag])
 pts=np.array(sorted(pts));xx,ix=np.unique(pts[:,0],return_index=True);yy=pts[ix,1]
 def delta(x):return floor(x)-sy*float(np.interp((sign*x+offset)/sx,xx,yy))
 knots=sorted(set([*np.linspace(lo,hi,19),*[x for x in tx if lo<x<hi]]));v=src['vector'];v['symbols']={'domain-source':v['root']};v['clips']={};children=[]
 for i,(l,r) in enumerate(zip(knots[:-1],knots[1:])):
  dl,dr=delta(l),delta(r);m=(dr-dl)/(r-l);b=dl-m*l
  # q=(sign*x+offset)/sx => x=sign*sx*q-sign*offset
  tr=[sign*sx,m*sign*sx,0,sy,-sign*offset,b-m*sign*offset];k=f'domain-{i}';v['clips'][k]=[f'M{l-.00001} 0H{r+.00001}V40000H{l-.00001}Z'];children.append({'tag':'g','clipPath':k,'pixelSnapClip':True,'children':[{'tag':'g','transform':tr,'children':[{'tag':'use','symbol':'domain-source'}]}]})
 ground=[{'x':lo,'y':floor(lo)},*[q for q in top if lo<q['x']<hi],{'x':hi,'y':floor(hi)},{'x':hi,'y':40000},{'x':lo,'y':40000}];gd=' '.join(('M' if i==0 else 'L')+f"{q['x']} {q['y']}" for i,q in enumerate(ground))+'Z';v['clips']['physicalDomain']=[gd];children=[{'tag':'path','d':gd,'fill':'#233443'},*children,{'tag':'path','d':' '.join(('M' if j==0 else 'L')+f'{x} {floor(x)+650}' for j,x in enumerate([lo-2,*knots,hi+2]))+f'L{hi+2} 40000H{lo-2}Z','fill':'#233443'}];v['root']={'tag':'g','clipPath':'physicalDomain','children':children};src['id']='s32-silhouette:domain-'+name;src['bounds']={'x':lo,'y':0,'w':hi-lo,'h':40000};src['reference']['bounds']=src['bounds'];v['viewBox']=[lo,0,hi-lo,40000];src['params'].update(semanticLayer='BODY',collisionSource='a4-32-land',silhouetteUnderpaint=False,domainContinuation={'source':source,'range':[lo,hi],'method':'native edge-reflected support-aligned paint; actual preexisting terrain polygon clips margin only','collisionUnchanged':True,'slices':len(knots)-1});assets.append(src)
(D/'domain-assets.json').write_text(json.dumps(assets,separators=(',',':')));print([(a['id'],a['params']['domainContinuation']['slices']) for a in assets])
