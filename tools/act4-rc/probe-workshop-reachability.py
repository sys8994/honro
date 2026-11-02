import json,hashlib,sys
from pathlib import Path
p=Path(sys.argv[1]);raw=p.read_bytes();d=json.loads(raw);assets={a['id']:a for a in d['library']};ids=set(assets);enc=lambda x:len(json.dumps(x,ensure_ascii=False,separators=(',',':')).encode())
def strings(x):
 todo=[x]
 while todo:
  v=todo.pop()
  if isinstance(v,str):
   if v in ids:yield v
  elif isinstance(v,dict):todo.extend(v.values())
  elif isinstance(v,list):todo.extend(v)
for no in (2,32,36,40):
 s=next(x for x in d['stages'] if x.get('metadata',{}).get('stageId')==no);seen=set(strings(s));todo=list(seen)
 while todo:
  for x in strings(assets[todo.pop()]):
   if x not in seen:seen.add(x);todo.append(x)
 dynamic={k:v for k,v in (s.get('design') or {}).items() if 'AssetId' in k};door=(s.get('design') or {}).get('vectorShelterDoor');
 if door:dynamic['vectorShelterDoor.assetId']=door.get('assetId');print(json.dumps({'stage':no,'reachableCount':len(seen),'libraryCount':len(assets),'reachableBytes':enc([a for a in d['library'] if a['id'] in seen]),'fullBytes':enc(d['library']),'dynamic':dynamic,'dynamicIdExists':{k:v in ids for k,v in dynamic.items() if isinstance(v,str)}},ensure_ascii=False),flush=True)
print('rawSha256',hashlib.sha256(raw).hexdigest())
