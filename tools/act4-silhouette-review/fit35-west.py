"""Fit native35 west bank around protected existing stair supports; isolated prototype."""
import json,copy,sys,xml.etree.ElementTree as E
from pathlib import Path
import numpy as np
from scipy.interpolate import PchipInterpolator
from shapely.geometry import LineString
from svgpathtools import parse_path
sys.path.insert(0,'tools/vector-production');from bounded_flatten import flatten
D=Path('art/stage35-bank-silhouette-v4');p=json.load(open('_local/reports/stage35-stone-style-v3/candidate-project.json'));s=p['stages'][0];t=s['terrains'][0];old=copy.deepcopy(t['points']);sk=json.load(open(D/'play-west-skeleton.json'));orig=sk['protectedTop'];outer=parse_path(flatten(E.parse(D/'play-west-master.svg').getroot().find('.//{http://www.w3.org/2000/svg}path').get('d'),.15));edges=[(z.start,z.end) for z in outer]
def sourceY(x):return min(u.imag+(v.imag-u.imag)*(x-u.real)/(v.real-u.real) for u,v in edges if abs(v.real-u.real)>1e-9 and min(u.real,v.real)<=x<=max(u.real,v.real))
sources=np.array([1,485,526,567,1314,1350,1389,1773.]);world=np.array([-800,660,760,860,2910,2990,3070,4000.]);sy=4800/1774
raw=lambda x:1550+sy*sourceY(float(np.interp(x,world,sources)))
anchors=np.array([[-800,orig[0]['y']],[0,1910],[540,1910],[920,1800],[1380,1800],[2180,2040],[2820,2030],[3160,1856],[3380,1820],[4000,orig[-1]['y']]])
cor=PchipInterpolator(anchors[:,0],anchors[:,1]-[raw(x)for x in anchors[:,0]])
knots=sorted(set([*np.arange(-800,4000,160),4000,*anchors[:,0],*world]));cv=cor(knots)
def top(x):return raw(x)+float(np.interp(x,knots,cv))
protected=[(540,920),(2820,3160)];new=[]
for lo,hi in [(-800,540),(920,2820),(3160,4000)]:
 q=[(float(x),top(x))for x in sorted(set([*np.arange(lo,hi,3),hi,*[x for x in anchors[:,0]if lo<x<hi]]))];q=list(LineString(q).simplify(.6).coords);new+=q
new+=[(q['x'],q['y'])for q in orig if any(lo<=q['x']<=hi for lo,hi in protected)];new=sorted(set(new),key=lambda q:(q[0],-q[1]));poly=[{'x':round(x,5),'y':round(y,5)}for x,y in new]
# Cyclic original terrain: replace west interval, preserve every other vertex and both protected stair sequences.
rest=[q for q in old if q['x']>4000 or q['x']<-800];t['points']=poly+rest
clip='M'+'L'.join(f"{q['x']} {q['y']}"for q in poly)+'L4000 27100H-800Z';a=json.load(open(D/'play-west-source-asset.json'));v=a['vector'];v['symbols']={'native':v['root']};v['clips']={'physical':[clip]};children=[{'tag':'path','d':clip,'fill':'#203749'}]
# Native soil/stone layers use source-relative depth compression, preserving top supports.
def exactTop(x):
 if any(lo<=x<=hi for lo,hi in protected):
  hits=[]
  for u,w in zip(orig[:-1],orig[1:]):
   if w['x']>u['x'] and u['x']<=x<=w['x']:hits.append(u['y']+(w['y']-u['y'])*(x-u['x'])/(w['x']-u['x']))
  return min(hits) if hits else top(x)
 return top(x)
for el in E.parse(D/'play-west-master.svg').getroot().iter():
 if not el.tag.endswith('path'):continue
 flat=parse_path(flatten(el.get('d'),.10));subs=[]
 for part in flat.continuous_subpaths():
  xy=[part[0].start]+[z.end for z in part];out=[]
  for z in xy:
   sx0=max(1,min(1770,z.real));paintSources=sources.copy();paintSources[-1]=1770;wx=float(np.interp(sx0,paintSources,world));wy=exactTop(wx)+1.25*(z.imag-sourceY(sx0));wy+=5000 if el.get('id')=='path2' and z.imag>850 else 0;out.append((wx,wy))
  subs.append('M'+'L'.join(f'{x:.4f} {y:.4f}'for x,y in out)+'Z')
 col=el.get('fill') or el.get('style','').split('fill:')[-1].split(';')[0];col={'#486175':'#3d566b'}.get(col,col);children.append({'tag':'path','d':' '.join(subs),'fill':col})
v.pop('symbols',None)
v['root']={'tag':'g','clipPath':'physical','children':children};a['id']='s35-silhouette:west-native-v4';a['bounds']={'x':-800,'y':0,'w':4800,'h':27100};a['reference']['bounds']=a['bounds'];v['viewBox']=[-800,0,4800,27100];a['params'].update(collisionSource='a4-35-land',silhouetteUnderpaint=False,protectedStairs=protected,visualApproval=False);p['library'].append(a)
# Keep old domains outside the replacement; no transparent seams or contradictory old top inside.
for e in s['elements']:
 if 'body-continuous' not in e['id']:continue
 olda=next(z for z in p['library']if z['id']==e['assetId']);b=copy.deepcopy(olda);b['id']+='-outside-west';b['vector'].setdefault('clips',{})['outside-west']=['M-10000 0H-800V40000H-10000Z M4000 0H20000V40000H4000Z'];b['vector']['root']={'tag':'g','clipPath':'outside-west','children':[b['vector']['root']]};p['library'].append(b);e['assetId']=b['id']
s['elements']=[e for e in s['elements']if e['id'] not in ['s35-density:surface','s35-density:central-stone-treads-blue-dawn-v3']]
ix=next(i for i,e in enumerate(s['elements'])if 'body-continuous'in e['id']);s['elements'].insert(ix,{'id':a['id'],'assetId':a['id'],'x':0,'y':0,'scale':1,'rotation':0,'depthLayer':'L1','layer':'front'});(D/'west-world-asset.json').write_text(json.dumps(a,separators=(',',':')));(D/'west-fit-report.json').write_text(json.dumps({'protectedStairs':protected,'vertices':len(poly),'source':'play-west-master.svg','status':'candidate, physical and visual review pending'},indent=2));out=Path('_local/reports/stage35-bank-v4/candidate-west.json');out.write_text(json.dumps(p,separators=(',',':')));print(out)
