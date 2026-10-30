"""Ground only non-colliding rear decor on source-authored35 bank; preserve FORE and gameplay."""
import json,copy
from pathlib import Path
f=Path('_local/reports/stage35-bank-v4/candidate-full.json');p=json.loads(f.read_text());s=p['stages'][0];pts=s['terrains'][0]['points'];L={a['id']:a for a in p['library']};changes=[]
def top(x):
 ys=[a['y']+(b['y']-a['y'])*(x-a['x'])/(b['x']-a['x'])for a,b in zip(pts,pts[1:]+pts[:1])if b['x']>a['x']and a['x']<=x<=b['x']];return min(ys)
for e in s['elements']:
 if e['id'] not in ['a4-art-35-extra-0','a4-35-bamboo-2','a4-35-bamboo-3','a4-35-bamboo-4']:continue
 a=L[e['assetId']];assert not a.get('collision'),e['id'];old=e['y'];e['y']=top(e['x']);changes.append({'instance':e['id'],'oldY':old,'newY':e['y'],'collision':False})
 if e['id']=='a4-art-35-extra-0':
  a=copy.deepcopy(a);a['id']='s35-silhouette:fallen-bamboo-quiet';colors={'#627e8d':'#3a5364','#385b70':'#2c465a','#748b99':'#465f70','#8a9da8':'#51697a'}
  def rec(v):
   if isinstance(v,dict):return {k:rec(x)for k,x in v.items()}
   if isinstance(v,list):return [rec(x)for x in v]
   return colors.get(v,v)if isinstance(v,str)else v
  a['vector']=rec(a['vector']);p['library'].append(a);e['assetId']=a['id']
f.write_text(json.dumps(p,separators=(',',':')));Path('art/stage35-bank-silhouette-v4/decor-fit-report.json').write_text(json.dumps({'changes':changes,'scope':'noncolliding rear decor only; no FORE or gameplay edits'},indent=2));print(changes)
