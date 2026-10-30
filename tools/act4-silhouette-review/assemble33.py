"""Isolated 33 representative. Native silhouettes -> matching top supports, no main-world mutation."""
import json,copy,sys,re,shutil,xml.etree.ElementTree as E
from pathlib import Path
import numpy as np
from shapely.geometry import LineString
from svgpathtools import parse_path
sys.path.insert(0,'tools/vector-production');from bounded_flatten import flatten
O=Path('_local/reports/act4-silhouette33');O.mkdir(parents=True,exist_ok=True)
p=json.loads(Path('_local/reports/sea-silhouette-v3/project.json').read_text());s=next(s for s in p['stages'] if s['metadata']['stageId']==33);oldTerrain=copy.deepcopy(s['terrains']);changes=[]
def source(folder,prefix,report):
 D=Path(folder);Q=Path(report);chosen=json.loads((Q/'report.json').read_text())['chosen']
 for suffix in ['svg','json']:shutil.copy(Q/(chosen+'.'+suffix),D/(prefix+'-master'+('.svg' if suffix=='svg' else '-asset.json')))
 shutil.copy(Q/'report.json',D/'optimization-report.json');a=json.loads((Q/(chosen+'.json')).read_text());r=E.parse(Q/(chosen+'.svg')).getroot();e=next(e for e in r.iter() if e.tag.endswith('path'));f=parse_path(flatten(e.get('d'),.1));xy=np.array([(f[0].start.real,f[0].start.imag)]+[(z.end.real,z.end.imag) for z in f]);xmin,xmax=xy[:,0].min()+4,xy[:,0].max()-4
 def top(x):
  hits=[]
  for u,v in zip(xy[:-1],xy[1:]):
   if abs(v[0]-u[0])>1e-10 and min(u[0],v[0])-1e-8<=x<=max(u[0],v[0])+1e-8:hits.append(u[1]+(v[1]-u[1])*(x-u[0])/(v[0]-u[0]))
  return min(hits)
 return a,xmin,xmax,top,D
bridge,xmin,xmax,top,D=source('art/stage33-causeway-silhouette-v5','causeway','_local/reports/causeway-silhouette-v5/optimization')
for side in ['west','east']:
 t=next(t for t in s['terrains'] if t['id']==f'a4-33-upper-{side}');u,v=t['control'][0],t['control'][-1];scale=(v['x']-u['x'])/(xmax-xmin);yl,yr=top(xmin),top(xmax);shear=((v['y']-u['y'])-scale*(yr-yl))/(xmax-xmin);dx=u['x']-scale*xmin;dy=u['y']-scale*yl-shear*xmin
 transform=[scale,shear,0,scale,dx,dy];a=copy.deepcopy(bridge);a['id']=f's33-silhouette:bridge-{side}-v5';a['vector']['root']={'tag':'g','transform':transform,'children':[a['vector']['root']]};a['bounds']={'x':u['x'],'y':1850,'w':v['x']-u['x'],'h':550};a['reference']['bounds']=a['bounds'];a['vector']['viewBox']=[a['bounds'][k] for k in ['x','y','w','h']]
 # Use actual native top envelope. One-way only: underside and decorative piers are not blocking.
 control=list(LineString([(scale*x+dx,scale*top(x)+shear*x+dy) for x in np.linspace(xmin,xmax,int(xmax-xmin)+1)]).simplify(.18).coords)
 t.update(type='platform',control=[{'x':round(x,5),'y':round(y,5)} for x,y in control],thickness=100,oneWay=True,detail={'interpolation':'linear','roughness':0,'spacing':1,'optimizeEpsilon':0});inst=next(e for e in s['elements'] if e['id']==f's33-density:refuge-{side}');inst['assetId']=a['id'];p['library'].append(a);a['params'].update(source='causeway-master.svg',skeleton='gameplay-skeleton.svg',sourceTransform=transform,geometry='native top envelope, one-way underside/piers nonblocking',visualApproval=False);(D/f'{side}-asset.json').write_text(json.dumps(a,separators=(',',':')));changes.append({'kind':'bridge','instance':inst,'terrain':t,'assetFile':str(D/f'{side}-asset.json'),'transform':transform})
s['elements']=[e for e in s['elements'] if e.get('assetId')!='s33v:stone-pier']
# Central bank: source profile replaces old triangle; retain all outside route coordinates.
bank,xmin,xmax,top,D=source('art/stage33-bank-silhouette-v1','bank','_local/reports/bank-silhouette-v1/optimization');x1,x2=1800,4100;y1,y2=2300,2330;scale=(x2-x1)/(xmax-xmin);yl,yr=top(xmin),top(xmax);shear=((y2-y1)-scale*(yr-yl))/(xmax-xmin);dx=x1-scale*xmin;dy=y1-scale*yl-shear*xmin
profile=list(LineString([(scale*x+dx,scale*top(x)+shear*x+dy) for x in np.linspace(xmin,xmax,int(xmax-xmin)+1)]).simplify(.18).coords)
t=s['terrains'][0];points=t['points'];lo=next(i for i,q in enumerate(points) if q['x']==x1);hi=next(i for i,q in enumerate(points) if q['x']==x2);t['points']=points[:lo]+[{'x':round(x,5),'y':round(y,5)} for x,y in profile]+points[hi+1:]
# Existing body/contact excluded from the revised interval, rather than hiding collider/art mismatch.
for e in s['elements']:
 if ('body' in e['id'] and e['id'].startswith('s33v:')) or 'soil-contact' in e['id']:
  old=next(a for a in p['library'] if a['id']==e['assetId']);a=copy.deepcopy(old);a['id']=old['id']+'-outside-refuge';v=a['vector'];v.setdefault('clips',{})['outsideRefuge']=[f'M-50000 -50000H{x1}V50000H-50000Z',f'M{x2} -50000H50000V50000H{x2}Z'];v['root']={'tag':'g','clipPath':'outsideRefuge','children':[v['root']]};p['library'].append(a);e['assetId']=a['id']
a=bank;a['id']='s33-silhouette:central-refuge-bank-v1';a['vector']['root']={'tag':'g','transform':[scale,shear,0,scale,dx,dy],'children':[a['vector']['root']]};a['bounds']={'x':x1,'y':2050,'w':x2-x1,'h':700};a['reference']['bounds']=a['bounds'];a['vector']['viewBox']=[a['bounds'][k] for k in ['x','y','w','h']];p['library'].append(a);s['elements'].append({'id':a['id'],'assetId':a['id'],'x':0,'y':0,'scale':1,'rotation':0,'depthLayer':'L1','layer':'front'});(D/'bank-world-asset.json').write_text(json.dumps(a,separators=(',',':')));changes.append({'kind':'bank','terrain':t,'assetFile':str(D/'bank-world-asset.json'),'transform':[scale,shear,0,scale,dx,dy]})
p['stages']=[s];p['activeStageId']=s['id'];p['production']=json.loads(Path('_local/reports/causeway-silhouette-v3/candidate-project.json').read_text())['production'];(O/'candidate-project.json').write_text(json.dumps(p,separators=(',',':')));(O/'changes.json').write_text(json.dumps({'oldTerrain':oldTerrain,'changes':changes,'visualApproval':False},indent=2));print('bridge + bank candidate ready; central height',min(y for x,y in profile))
