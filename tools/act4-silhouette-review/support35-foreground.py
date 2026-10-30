"""Reuse the authored native bank contour as a quiet FORE ground plane; no physics changes."""
import copy,json,hashlib
from pathlib import Path
F=Path('_local/reports/stage35-bank-v4/candidate-full.json');p=json.loads(F.read_text());s=p['stages'][0];before=copy.deepcopy(s);points=s['terrains'][0]['points']
def top(x):return min(a['y']+(b['y']-a['y'])*(x-a['x'])/(b['x']-a['x'])for a,b in zip(points,points[1:]+points[:1])if b['x']>a['x']and a['x']<=x<=b['x'])
# A single affine placement of the existing native contour. The foreground plants
# sit on their own continuous land plane, 35 world units inside its crown.
x0,x1=2070,4310;y0,y1=4015,3965;sy=.15;shear=((y1-y0)-sy*(top(x1)-top(x0)))/(x1-x0);offset=y0-sy*top(x0)-shear*x0
q=[{'x':v['x'],'y':round(sy*v['y']+shear*v['x']+offset,6)}for v in points]
# The original solid's two deep closure vertices are technical coverage only.
for v,w in zip(points,q):
 if v['y']==max(z['y']for z in points):w['y']=30000
bounds={'x':min(v['x']for v in q),'y':min(v['y']for v in q),'w':max(v['x']for v in q)-min(v['x']for v in q),'h':30000-min(v['y']for v in q)}
a={'id':'s35-silhouette:foreground-native-bank','name':'근경 대나무 지지 지면','category':'terrain','visual':[],'collision':[],'sockets':[],'anchor':{'x':0,'y':0},'bounds':bounds,'reference':{'bounds':bounds,'foot':{'x':0,'y':0},'heightM':bounds['h']/60,'scaleRange':[1,1],'backgroundRange':[1,1]},'params':{'semanticLayer':'FORE','nonColliding':True,'sourceRole':'Monochrome reuse of the native authored35 bank crown; affine placement below the play route; deep closure extended for camera coverage'},'vector':{'version':1,'viewBox':[bounds['x'],bounds['y'],bounds['w'],bounds['h']],'root':{'tag':'path','d':' '.join(('M'if i==0 else'L')+str(v['x'])+' '+str(v['y'])for i,v in enumerate(q))+'Z','fill':'#172e3f','stroke':'none'}}}
p['library']=[v for v in p['library']if v['id']!=a['id']]+[a];s['elements']=[e for e in s['elements']if e['id']!='s35v:fore-native-support'];idx=next(i for i,e in enumerate(s['elements'])if e['id'].startswith('s35v:fore-bamboo'))
s['elements'].insert(idx,{'id':'s35v:fore-native-support','assetId':a['id'],'x':0,'y':0,'scale':1,'rotation':0,'depthLayer':'L1','layer':'front'})
for k in ['terrains','units','events','encounters','objectives','initialState','environment']:assert s[k]==before[k],k
F.write_text(json.dumps(p,separators=(',',':')));Path('art/stage35-bank-silhouette-v4/foreground-support.json').write_text(json.dumps({'source':'existing native source-derived a4-35-land contour','sourceVertices':len(points),'affine':{'verticalScale':sy,'shear':shear,'translateY':offset},'sourceTerrainSHA256':hashlib.sha256(json.dumps(points,separators=(',',':')).encode()).hexdigest(),'feet':[{'x':x0,'rootY':4050,'groundY':y0},{'x':x1,'rootY':4000,'groundY':y1}],'physicalFieldsUnchanged':True,'status':'actual visual inspection pending'},indent=2));print('foreground support written; physics unchanged')
