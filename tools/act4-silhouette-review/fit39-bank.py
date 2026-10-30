"""Two actual skeleton-authored native concepts; protected recovery/rescue supports remain exact."""
import json,copy,sys,xml.etree.ElementTree as E
from pathlib import Path
import numpy as np
from scipy.interpolate import PchipInterpolator
from shapely.geometry import LineString
from svgpathtools import parse_path
sys.path.insert(0,'tools/vector-production');from bounded_flatten import flatten
D=Path('art/stage39-bank-silhouette-v4');O=Path('_local/reports/stage39-bank-v4');O.mkdir(parents=True,exist_ok=True)
p=json.load(open('_local/reports/sea-silhouette-v3/project.json'));s=next(s for s in p['stages']if s['metadata']['stageId']==39);p['stages']=[s];p['activeStageId']=s['id'];t=next(t for t in s['terrains']if t['id']=='a4-39-land');old=copy.deepcopy(t['points']);protected=[(1380,1700),(4500,6200),(6600,8000)]
def oldTop(x):return min(a['y']+(b['y']-a['y'])*(x-a['x'])/(b['x']-a['x'])for a,b in zip(old,old[1:]+old[:1])if b['x']>a['x']and a['x']<=x<=b['x'])
models=[];newpoints=[];assets=[]
for side,lo,hi in [('west',-800,4200),('east',4200,9800)]:
 sk=json.load(open(D/f'play-{side}-skeleton.json'));paths={e.get('id'):e for e in E.parse(D/f'play-{side}-master.svg').getroot().iter()if e.tag.endswith('path')};outer=parse_path(flatten(paths['path5'].get('d'),.1));edges=[(z.start,z.end)for z in outer]
 def sy(x,edges=edges):return min(a.imag+(b.imag-a.imag)*(x-a.real)/(b.real-a.real)for a,b in edges if abs(b.real-a.real)>1e-9 and min(a.real,b.real)<=x<=max(a.real,b.real))
 ox=sk['physicalRange'][0]if isinstance(sk['physicalRange'],list)else(-800 if side=='west'else 4000);width=5200 if side=='west'else 5800;sx=width/1774;oy=-sk['worldToImage'][5]/sk['worldToImage'][0]
 def raw(x,sy=sy,ox=ox,sx=sx,oy=oy):return oy+sx*sy(max(1,min(1773,(x-ox)/sx)))
 ax=sorted(set([lo,hi,*[q['x']for q in sk['protectedTop']if lo<q['x']<hi],*[x for r in protected for x in r if lo<x<hi]]));cor=PchipInterpolator(ax,[oldTop(x)-raw(x)for x in ax]);knots=sorted(set([*np.arange(lo,hi,140),hi,*ax]));cv=cor(knots)
 def top(x,raw=raw,knots=knots,cv=cv):
  if any(a<=x<=b for a,b in protected):return oldTop(x)
  return raw(x)+float(np.interp(x,knots,cv))
 # Simplify each free interval independently; exact protected supports are pinned, not approximated.
 cuts=sorted(set([lo,hi,*[x for r in protected for x in r if lo<x<hi]]));poly=[]
 for a,b in zip(cuts,cuts[1:]):
  if any(u<=(a+b)/2<=v for u,v in protected):q=[(a,oldTop(a)),*[(z['x'],z['y'])for z in old if a<z['x']<b],(b,oldTop(b))]
  else:q=list(LineString([(float(x),top(x))for x in sorted(set([*np.arange(a,b,3),b,*[x for x in ax if a<x<b]]))]).simplify(.6).coords)
  poly+=q[:-1]
 poly.append((hi,top(hi)));poly=[{'x':round(x,5),'y':round(y,5)}for x,y in poly];newpoints+=poly[:-1]if side=='west'else poly
 models.append(dict(side=side,lo=lo,hi=hi,paths=paths,sy=sy,ox=ox,sx=sx,top=top,poly=poly))
t['points']=newpoints+[q for q in old if q['x']>9800 or q['x']<-800]
colors={'path5':'#5c7386','path4':'#3d566b','path3':'#2a4356','path2':'#203749','path1':'#203749'};decisions=[]
def depth(el,x,sy):
 pp=parse_path(flatten(el.get('d'),.1));return min(z.start.imag+(z.end.imag-z.start.imag)*(x-z.start.real)/(z.end.real-z.start.real)for z in pp if abs(z.end.real-z.start.real)>1e-9 and min(z.start.real,z.end.real)<=x<=max(z.start.real,z.end.real))-sy(x)
for m in models:
 side,lo,hi=m['side'],m['lo'],m['hi'];clip='M'+'L'.join(f"{q['x']} {q['y']}"for q in m['poly'])+f'L{hi} 28600H{lo}Z';ch=[{'tag':'path','d':clip,'fill':'#203749'}]
 for pid,col in colors.items():
  el=m['paths'][pid];delta=0
  if side=='east':
   left=models[0];lx=(4200-left['ox'])/left['sx'];rx=(4200-m['ox'])/m['sx'];delta=1.25*(depth(left['paths'][pid],lx,left['sy'])-depth(el,rx,m['sy']))
  ds=[]
  for part in parse_path(flatten(el.get('d'),.1)).continuous_subpaths():
   out=[]
   for z in [part[0].start]+[v.end for v in part]:
    ss=max(1,min(1773,z.real));wx=m['ox']+ss*m['sx'];u=max(0,min(1,(wx-4200)/500));wy=m['top'](max(lo,min(hi,wx)))+1.25*(z.imag-m['sy'](ss))+delta*(1-u*u*(3-2*u));wy+=5000 if pid in ['path2','path1'] and z.imag>850 else 0;out.append((wx,wy))
   ds.append('M'+'L'.join(f'{x:.4f} {y:.4f}'for x,y in out)+'Z')
  ch.append({'tag':'path','d':' '.join(ds),'fill':col});decisions.append({'side':side,'path':pid,'joinDelta':delta})
 a=json.load(open(D/f'play-{side}-source-asset.json'));a['id']=f's39-silhouette:{side}-native-v4';a['bounds']={'x':lo,'y':0,'w':hi-lo,'h':28600};a['reference']['bounds']=a['bounds'];a['vector']={'version':1,'viewBox':[lo,0,hi-lo,28600],'root':{'tag':'g','clipPath':'physical','children':ch},'clips':{'physical':[clip]}};a['params'].update(collisionSource='a4-39-land',semanticLayer='BODY',silhouetteUnderpaint=False,visualApproval=False);assets.append(a)
# Keep established outer-domain source only outside new actual authored range.
for e in s['elements']:
 if 'body'not in e['id']:continue
 olda=next(a for a in p['library']if a['id']==e['assetId']);a=copy.deepcopy(olda);a['id']+='-outside-native39';a['vector'].setdefault('clips',{})['outside-native']=['M-10000 0H-800V40000H-10000Z M9800 0H20000V40000H9800Z'];a['vector']['root']={'tag':'g','clipPath':'outside-native','children':[a['vector']['root']]};assets.append(a);e['assetId']=a['id']
ix=next(i for i,e in enumerate(s['elements'])if e['id']=='s39v:body')
for a in reversed(assets[:2]):s['elements'].insert(ix,{'id':a['id'],'assetId':a['id'],'x':0,'y':0,'scale':1,'rotation':0,'depthLayer':'L1','layer':'front'})
p['library']+=assets;s['design']['vectorGround']['baseColor']='#203749';s['design']['act4']['palette']={'top':'#5c7386','light':'#8296a6','body':'#2a4356','seam':'#203749','deep':'#203749'};s['environment']['atmosphere']['overrides'].update(json.load(open('art/act4-silhouette-v3/sea/palette32-manifest.json'))['environmentOverrides'])
p.setdefault('production',{}).setdefault('cards',{})[s['id']]={'cameraViews':[{'id':i,'x':x,'y':y,'scale':z,'width':w,'height':h}for i,x,y,z,w,h in [('normal',1000,1850,.53,1440,900),('valley',3200,2250,.4,1440,900),('join',4200,2250,.55,1440,900),('rescue',6500,1850,.5,1440,900),('whole',4500,2200,.14,1440,900),('mobile',1000,1850,.32,430,932)]]}
(D/'native-bank-assets.json').write_text(json.dumps(assets,separators=(',',':')));(D/'fit-report.json').write_text(json.dumps({'protected':protected,'newVertices':len(newpoints),'materialJoin':decisions,'visualApproval':False},indent=2));(O/'candidate-project.json').write_text(json.dumps(p,separators=(',',':')));print(O/'candidate-project.json')
