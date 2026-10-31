#!/usr/bin/env python3
"""Build an isolated QA world; fail on unknown asset conflicts, never mutate source."""
import copy,hashlib,json,pathlib
R=pathlib.Path(__file__).resolve().parents[2]; source=R/'shared/data/act4/world.json';out=R/'_local/act4-rc'
def digest(x):return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def walk(x):
 if isinstance(x,str):yield x
 elif isinstance(x,dict):
  for v in x.values():yield from walk(v)
 elif isinstance(x,list):
  for v in x:yield from walk(v)
world=json.loads(source.read_bytes());base=json.loads((R/'shared/data/campaign.json').read_bytes());index=json.loads((R/'tools/act4-rc/REVIEW_INDEX.json').read_text()); assets={a['id']:a for a in world['library']}; assert len(assets)==len(world['library']);canonical={a['id']:a for a in base['library']}; aliases=[];stages=[]
for row in index['candidates']:
 n=row['stage'];raw=(out/f'candidates/stage{n}.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==row['rawSha256'];d=json.loads(raw);s=copy.deepcopy(d['stages'][0]);assert s['metadata']['stageId']==n
 for raw_asset in d['library']:
  a=copy.deepcopy(raw_asset);aid=a['id']
  if aid=='a4:door' and n==36:
   old=assets.get(aid);assert old and digest(old)!=digest(a) and not a.get('collision') and a.get('vector');assert not s['design'].get('vectorDoorAssetId');a['id']='act4rc:stage36-door';s['design']['vectorDoorAssetId']=a['id'];aliases.append({'stage':36,'original':aid,'alias':a['id'],'reason':'Distinct visual asset; retain shared dynamic door ID, use existing vectorDoorAssetId render contract','originalAssetSha256':digest(raw_asset),'aliasedAssetSha256':digest(a)});aid=a['id']
  if aid in assets and digest(assets[aid])!=digest(a):raise ValueError(f'Conflicting asset {aid} in stage {n}')
  if aid in canonical and digest(canonical[aid])!=digest(a):raise ValueError(f'Conflict with 1–30 canonical asset {aid} in stage {n}')
  assets.setdefault(aid,a)
 i=next(i for i,x in enumerate(world['stages']) if x['metadata']['stageId']==n);world['stages'][i]=s;stages.append({'stage':n,'inputSha256':row['rawSha256'],'assembledStageSemanticSha256':digest(s)})
world['library']=list(assets.values());known=set(assets)|set(canonical)
for s in world['stages']:
 for e in [*s.get('elements',[]),*s.get('environment',{}).get('placements',[])]:
  if e.get('assetId') not in known:raise ValueError(f"Missing asset {s['id']} {e.get('assetId')}")
for s in world['stages']:
 reachable=set(v for v in walk(s) if v in known);todo=list(reachable)
 while todo:
  aid=todo.pop();a=assets.get(aid) or canonical.get(aid)
  for x in walk(a):
   if x in known and x not in reachable:reachable.add(x);todo.append(x)
 stages[s['metadata']['stageId']-31]['reachableAssetIds']=sorted(reachable)
assert 'act4rc:stage36-door' in stages[5]['reachableAssetIds']
ferry=world['stages'][9]['design'].get('vectorReturnBoatAssetId');assert ferry and ferry in stages[9]['reachableAssetIds'],f'Missing stage40 dynamic ferry {ferry}'
raw=json.dumps(world,ensure_ascii=False,separators=(',',':')).encode();(out/'world.json').write_bytes(raw);report={'kind':'QA-only assembly; no release acceptance','worldSha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'stages':stages,'aliases':aliases,'dynamicFerry':ferry,'libraryCount':len(assets)};(out/'assembly.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'worldSha256':report['worldSha256'],'bytes':len(raw),'assets':len(assets),'aliases':aliases,'dynamicFerry':ferry},ensure_ascii=False))
