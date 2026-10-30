"""Reuse reviewed cave decor palette for stage39 noncolliding rescue boulders."""
import copy,json
from pathlib import Path
f=Path('_local/reports/stage39-bank-v4/candidate-project.json');p=json.loads(f.read_text());s=p['stages'][0];before=copy.deepcopy(s);L={a['id']:a for a in p['library']}
crack={'#aeb2b5':'#53697b','#949ca2':'#53697b','#889099':'#465c6f','#77828e':'#465c6f','#6b7685':'#465c6f','#576475':'#394f62','#495768':'#394f62','#364455':'#2b4052','#2c3848':'#2b4052','#212c3a':'#1c2d3e','#1b2533':'#1c2d3e'}
rock={'#6d8294':'#53697b','#5c7387':'#53697b','#526b80':'#465c6f','#486176':'#465c6f','#40596f':'#465c6f','#365066':'#394f62','#30495f':'#394f62','#263e55':'#2d4356','#223a50':'#2d4356'}
changes=[]
for eid,pal in [('a4-coast-39-art-1',crack),('a4-coast-39-art-4',rock)]:
 e=next(e for e in s['elements']if e['id']==eid);old=e['assetId'];a=copy.deepcopy(L[old]);assert not a['collision'];a['id']='s39-coherent-v4:'+eid;a['params']={**a.get('params',{}),'sourceAssetId':old,'decorOnly':True,'paletteEdit':'Reviewed cave blue-dawn grouped palette; geometry retained'}
 def rec(v):
  if isinstance(v,dict):
   for k,x in v.items():
    if k in ['fill','stroke']and isinstance(x,str):v[k]=pal.get(x,x)
    else:rec(x)
  elif isinstance(v,list):
   for x in v:rec(x)
 rec(a['vector']);p['library']=[v for v in p['library']if v['id']!=a['id']]+[a];e['assetId']=a['id'];changes.append({'instance':eid,'sourceAssetId':old,'assetId':a['id'],'palette':pal,'geometryExact':True,'nonColliding':True})
for k in ['terrains','units','events','encounters','objectives','environment','initialState']:assert s[k]==before[k]
f.write_text(json.dumps(p,separators=(',',':')));Path('art/stage39-bank-silhouette-v4/rescue-decor-palette.json').write_text(json.dumps(changes,indent=2));print('39 noncolliding rescue decor quieted; source preserved')
