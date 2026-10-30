"""Scoped dawn material palette; remove obsolete ground-top paint, not colliders."""
import json,copy
from pathlib import Path
f=Path('_local/reports/stage39-bank-v4/candidate-project.json');p=json.loads(f.read_text());s=p['stages'][0];L={a['id']:a for a in p['library']};changes=[]
# Old exact-polyline contact paint contradicts newly authored land. New native BODY includes the actual contact lip.
s['elements']=[e for e in s['elements']if e['assetId']!='s39v:contact'and not e['assetId'].startswith('s39-density:soil-contact')]
wood=dict(zip(['#b29c77','#89755a','#75614a','#6d5b45','#584736','#4b3c2d','#372d23'],['#788b99','#5d7385','#50677b','#485f74','#3b5369','#30495f','#223b51']))
rock=dict(zip(['#46595e','#9fa492','#8b9178','#7b836f','#566366','#4a5957','#3f5053'],['#203749','#647d90','#50697e','#465f74','#385165','#2b4358','#243b50']))
timber=dict(zip(['#9d9e9c','#8c8478','#7b8284','#82796e','#756e65','#6c655b','#4a4d4c','#3b464a','#42413d','#323d41','#2f3738'],['#788d9d','#657e90','#5e788c','#5e7588','#536b80','#496278','#354f65','#2c475e','#30495e','#263f55','#233b50']))
boulder=dict(zip(['#909aa3','#79858e','#6f7a84','#626d77','#5c6771','#4e5a63','#485259','#3a4349','#363e42'],['#6d8294','#5c7387','#526b80','#486176','#40596f','#365066','#30495f','#263e55','#223a50']))
for aid in dict.fromkeys(e['assetId']for e in s['elements']):
 role='wood'if'wood-0'in aid else'rock'if'rock-east'in aid else'timber'if'timber-'in aid else'boulder'if'haul-footing'in aid else None
 if not role:continue
 a=copy.deepcopy(L[aid]);a['id']=aid+'-dawn-v4';pal=locals()[role]
 def rec(v):
  if isinstance(v,dict):
   for k,x in v.items():
    if k in ['fill','stroke']and isinstance(x,str):v[k]=pal.get(x,x)
    else:rec(x)
  elif isinstance(v,list):
   for x in v:rec(x)
 rec(a['vector']);p['library'].append(a)
 for e in s['elements']:
  if e['assetId']==aid:e['assetId']=a['id']
 changes.append({'old':aid,'new':a['id'],'role':role,'geometryExact':True})
f.write_text(json.dumps(p,separators=(',',':')));Path('art/stage39-bank-silhouette-v4/palette-report.json').write_text(json.dumps({'changes':changes,'removedPaintOnly':'obsolete old-polyline ground contact and soil overlays; no physical terrain removed'},indent=2))
