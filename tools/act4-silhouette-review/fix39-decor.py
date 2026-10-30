"""Remove one confirmed nonphysical dangling cliff decoration; ground retained timbers."""
import json
from pathlib import Path
f=Path('_local/reports/stage39-bank-v4/candidate-project.json');p=json.loads(f.read_text());s=p['stages'][0];L={a['id']:a for a in p['library']};t=s['terrains'][0]['points'];changes=[]
def top(x):return min(a['y']+(b['y']-a['y'])*(x-a['x'])/(b['x']-a['x'])for a,b in zip(t,t[1:]+t[:1])if b['x']>a['x']and a['x']<=x<=b['x'])
for e in s['elements']:
 if e['id']=='a4-coast-39-art-2':assert not L[e['assetId']].get('collision');changes.append({'instance':e['id'],'action':'remove','reason':'noncolliding steep cliff boulder reads as dangling false obstacle in actual normal; no functional support'})
 if 'timber-'in e['assetId']:
  assert not L[e['assetId']].get('collision');old=e['y'];e['y']=top(e['x']);changes.append({'instance':e['id'],'oldY':old,'newY':e['y'],'collision':False})
s['elements']=[e for e in s['elements']if e['id']!='a4-coast-39-art-2'];f.write_text(json.dumps(p,separators=(',',':')));Path('art/stage39-bank-silhouette-v4/decor-fit-report.json').write_text(json.dumps(changes,indent=2))
