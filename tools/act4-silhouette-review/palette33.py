import json,copy
from pathlib import Path
O=Path('_local/reports/act4-silhouette33');p=json.loads((O/'candidate-project.json').read_text());s=p['stages'][0];used={e['assetId'] for e in s['elements']};replacements={};assets=[]
body={'#2d4350':'#182a38','#89846c':'#47596b','#736f59':'#304354','#354a58':'#203241','#626955':'#2a3d4e','#314754':'#1c2e3d','#cba85e':'#47596b'}
soil=dict(zip(['#847d62','#918971','#7e775c','#746f54','#6b674d','#605f48','#535640'],['#47596b','#526477','#405465','#384d5f','#304556','#283e50','#203649']))
reed=dict(zip(['#a6a897','#aa9e71','#7a836f','#857a54','#676d4a','#4b5947','#3b4c43'],['#71848e','#6c7e85','#536b79','#4f6570','#415b68','#334d5e','#2a4355']))
boat=dict(zip(['#a59f9c','#9b8774','#887869','#716459','#665b52','#4d4947','#43403e','#413e3e','#3a3c40','#35373c','#252a34'],['#8897a3','#7d8b95','#697c8b','#576d7f','#4f6578','#3c5366','#354c60','#33495d','#2c4358','#293f54','#1e3348']))
rock=dict(zip(['#909aa3','#79858e','#6f7a84','#626d77','#5c6771','#4e5a63','#485259','#3a4349','#363e42'],['#6d8294','#5c7387','#526b80','#486176','#40596f','#365066','#30495f','#263e55','#223a50']))
for a in list(p['library']):
 if a['id'] not in used or a['id'].startswith('s33-silhouette:'):continue
 pal=soil if 'soil-contact' in a['id'] else body if 'body' in a['id'] else reed if 'reed' in a['id'] else boat if 'skiff' in a['id'] else rock if 'boulder' in a['id'] else None
 if not pal:continue
 b=copy.deepcopy(a);b['id']=a['id']+'-dawn';
 def walk(x):
  if isinstance(x,dict):
   for k,v in x.items():
    if k in ['fill','stroke'] and isinstance(v,str) and v in pal:x[k]=pal[v]
    elif isinstance(v,(dict,list)):walk(v)
  elif isinstance(x,list):
   for v in x:walk(v)
 walk(b.get('vector',b.get('visual')));replacements[a['id']]=b['id'];assets.append(b)
for e in s['elements']:
 if e['assetId'] in replacements:e['assetId']=replacements[e['assetId']]
p['library']+=assets;s['design']['vectorGround']['baseColor']='#192d3b' if any(e['assetId'] in ['s33-silhouette:whole-bank-v2','s33-silhouette:composite-bank-v3','s33-silhouette:composite-bank-v4'] for e in s['elements']) else '#182a38';s['design']['act4']['palette']={'top':'#47596b','light':'#6d8191','body':'#2a3d4e','seam':'#203547','deep':'#182a38'}
m=json.loads(Path('art/act4-silhouette-v3/sea/palette32-manifest.json').read_text());s['environment']['atmosphere']['overrides'].update(m['environmentOverrides'])
(O/'candidate-dawn.json').write_text(json.dumps(p,separators=(',',':')));Path('art/stage33-bank-silhouette-v1/palette-assets.json').write_text(json.dumps(assets,separators=(',',':')));Path('art/stage33-bank-silhouette-v1/palette-manifest.json').write_text(json.dumps({'replacements':replacements,'design':s['design'],'environment':s['environment']},indent=2))
