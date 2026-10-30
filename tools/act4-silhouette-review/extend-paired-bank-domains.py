"""Native edge material continuation outside authored play spans; no collider edits."""
import json,copy,sys,numpy as np
from pathlib import Path
n=int(sys.argv[1]);f=Path(f'_local/reports/stage{n}-bank-v4/'+('candidate-full.json'if n==35 else'candidate-project.json'));p=json.loads(f.read_text());s=p['stages'][0];t=next(t for t in s['terrains']if t['id']==f'a4-{n}-land')['points'];L={a['id']:a for a in p['library']}
def floor(x):return min(a['y']+(b['y']-a['y'])*(x-a['x'])/(b['x']-a['x'])for a,b in zip(t,t[1:]+t[:1])if b['x']>a['x']and a['x']<=x<=b['x'])
left=-800;right=8000 if n==35 else 9800;low=min(q['x']for q in t);high=max(q['x']for q in t);assets=[]
for side,lo,hi,edge,src in [('left',low,left,left,L[f's{n}-silhouette:west-native-v4']),('right',right,high,right,L[f's{n}-silhouette:east-native-v4'])]:
 a=copy.deepcopy(src);v=a['vector'];v['symbols']={'native-edge':v['root']};children=[];offset=2*edge;srcLo=a['bounds']['x'];srcHi=srcLo+a['bounds']['w']
 def delta(x):return floor(x)-floor(max(srcLo,min(srcHi,-x+offset)))
 knots=sorted(set([*np.linspace(lo,hi,19),*[q['x']for q in t if lo<q['x']<hi and q['y']<10000]]))
 for i,(l,r)in enumerate(zip(knots[:-1],knots[1:])):
  m=(delta(r)-delta(l))/(r-l);b=delta(l)-m*l;k=f'edge-slice-{i}';v['clips'][k]=[f'M{l-.00001} 0H{r+.00001}V40000H{l-.00001}Z'];children.append({'tag':'g','clipPath':k,'pixelSnapClip':True,'children':[{'tag':'g','transform':[-1,-m,0,1,offset,b+m*offset],'children':[{'tag':'use','symbol':'native-edge'}]}]})
 top=sorted([q for q in t if lo<q['x']<hi and q['y']<10000],key=lambda q:q['x']);points=[{'x':lo,'y':floor(lo)},*top,{'x':hi,'y':floor(hi)},{'x':hi,'y':max(q['y']for q in t)},{'x':lo,'y':max(q['y']for q in t)}];d='M'+'L'.join(f"{q['x']} {q['y']}"for q in points)+'Z';v['clips']['domain-solid']=[d];v['root']={'tag':'g','clipPath':'domain-solid','children':[{'tag':'path','d':d,'fill':'#203749'},*children]};a['id']=f's{n}-silhouette:domain-{side}';a['bounds']={'x':lo,'y':0,'w':hi-lo,'h':40000};a['reference']['bounds']=a['bounds'];a['reference']['heightM']=40000/60;v['viewBox']=[lo,0,hi-lo,40000];a['params']['domainContinuation']={'source':src['id'],'scope':'existing offstage physical interval only','physicsUnchanged':True};assets.append(a)
s['elements']=[e for e in s['elements']if not e['assetId'].endswith('-outside-west')and not e['assetId'].endswith('-outside-native39')];ix=next(i for i,e in enumerate(s['elements'])if e['assetId']==f's{n}-silhouette:west-native-v4')
for a in reversed(assets):s['elements'].insert(ix,{'id':a['id'],'assetId':a['id'],'x':0,'y':0,'scale':1,'rotation':0,'depthLayer':'L1','layer':'front'})
p['library']+=assets;f.write_text(json.dumps(p,separators=(',',':')));Path(f'art/stage{n}-bank-silhouette-v4/domain-assets.json').write_text(json.dumps(assets,separators=(',',':')));print(n,len(assets),'domains; no physics changes')
