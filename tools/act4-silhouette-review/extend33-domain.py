"""Continue native edge material only into existing off-stage physical domains."""
import json,copy,numpy as np
from pathlib import Path
O=Path('_local/reports/act4-silhouette33');D=Path('art/stage33-bank-silhouette-v4');p=json.loads((O/'candidate-dawn.json').read_text());s=p['stages'][0];t=s['terrains'][0]['points'];top=sorted([q for q in t if q['y']<4000],key=lambda q:q['x']);tx=[q['x'] for q in top];ty=[q['y'] for q in top];floor=lambda x:float(np.interp(x,tx,ty));source=json.loads((D/'bank-world-asset.json').read_text());assets=[]
for name,lo,hi,sign,offset in [('left-far',-6000,-3000,-1,0),('left-near',-3000,0,-1,0),('right-near',7600,10600,-1,15200),('right-far',10600,13600,-1,15200)]:
 a=copy.deepcopy(source);v=a['vector'];v['symbols']={'native-bank':v['root']};v['clips']={};children=[]
 def delta(x):return floor(x)-floor(sign*x+offset)
 knots=sorted(set([*np.linspace(lo,hi,31),*[x for x in tx if lo<x<hi]]))
 for i,(l,r) in enumerate(zip(knots[:-1],knots[1:])):
  dl,dr=delta(l),delta(r);m=(dr-dl)/(r-l);b=dl-m*l;tr=[sign,m*sign,0,1,-sign*offset,b-m*sign*offset];key=f'slice{i}';v['clips'][key]=[f'M{l-.00001} 0H{r+.00001}V40000H{l-.00001}Z'];children.append({'tag':'g','clipPath':key,'pixelSnapClip':True,'children':[{'tag':'g','transform':tr,'children':[{'tag':'use','symbol':'native-bank'}]}]})
 points=[{'x':lo,'y':floor(lo)},*[q for q in top if lo<q['x']<hi],{'x':hi,'y':floor(hi)},{'x':hi,'y':40000},{'x':lo,'y':40000}];d='M'+' L'.join(f"{q['x']} {q['y']}" for q in points)+' Z';v['clips']['physicalDomain']=[d];v['root']={'tag':'g','clipPath':'physicalDomain','children':[{'tag':'path','d':d,'fill':'#192d3b'},*children]};a['id']='s33-silhouette:domain-'+name;a['bounds']={'x':lo,'y':0,'w':hi-lo,'h':40000};a['reference']['bounds']=a['bounds'];a['reference']['heightM']=40000/60;v['viewBox']=[lo,0,hi-lo,40000];a['params'].update(semanticLayer='BODY',collisionSource='a4-33-land',silhouetteUnderpaint=False,domainContinuation={'range':[lo,hi],'source':'native composed bank v4','method':'reflected edge, support-aligned outside play interval only; actual old physical domain clip','collisionUnchanged':True});assets.append(a)
# Main BODY is also explicitly linked to its real collision source, not fake approval metadata.
source['params']['collisionSource']='a4-33-land'
for a in p['library']:
 if a['id']==source['id']:a['params']['collisionSource']='a4-33-land'
(D/'bank-world-asset.json').write_text(json.dumps(source,separators=(',',':')))
p['library']+=assets
for a in assets:s['elements'].append({'id':a['id'],'assetId':a['id'],'x':0,'y':0,'scale':1,'rotation':0,'depthLayer':'L1','layer':'front'})
(D/'domain-assets.json').write_text(json.dumps(assets,separators=(',',':')));(O/'candidate-dawn.json').write_text(json.dumps(p,separators=(',',':')));print('33 four native edge domains appended; original outside terrain unchanged')
