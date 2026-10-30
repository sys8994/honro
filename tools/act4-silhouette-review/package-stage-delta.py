"""Package exact stage-reachable asset closure; shared definitions are hash-guarded, never overwritten."""
import json,hashlib,sys,subprocess
from pathlib import Path
file,n,out=sys.argv[1],int(sys.argv[2]),Path(sys.argv[3]);p=json.load(open(file));s=next(s for s in p['stages']if s['metadata']['stageId']==n);L={a['id']:a for a in p['library']};base={a['id']:a for f in ['shared/data/campaign.json','shared/data/act4/world.json']for a in json.load(open(f))['library']}
def enc(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def sha(x):return hashlib.sha256(enc(x)).hexdigest()
def refs(v):
 if isinstance(v,str):return {v}if v in L else set()
 if isinstance(v,dict):return set().union(*(refs(x)for x in v.values()))if v else set()
 if isinstance(v,list):return set().union(*(refs(x)for x in v))if v else set()
 return set()
seen=refs(s);todo=list(seen)
while todo:
 a=L[todo.pop()];more=refs({k:v for k,v in a.items()if k not in ['id','name']})-seen;seen|=more;todo+=list(more)
baseHashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import fs from 'node:fs';import{createHash}from'node:crypto';const b=new Map();for(const f of ['shared/data/campaign.json','shared/data/act4/world.json'])for(const a of JSON.parse(fs.readFileSync(f)).library)b.set(a.id,a);console.log(JSON.stringify(Object.fromEntries([...b].map(([id,a])=>[id,createHash('sha256').update(JSON.stringify(a)).digest('hex')]))));"]))
owned=[];shared=[];conflicts=[]
for i in sorted(seen):
 if i in base:
  if base[i]!=L[i]:conflicts.append(i)
  else:shared.append({'assetId':i,'sha256':baseHashes[i]})
 else:owned.append(L[i])
assert not conflicts,('Existing shared IDs differ: scopeclone required',conflicts)
r={'stage':s,'ownedAssets':owned,'expectedSharedAssets':shared,'sourceProjectSHA256':hashlib.sha256(Path(file).read_bytes()).hexdigest(),'status':'candidate only; source/direction/gameplay evidence separate; no release approval','sharedHashFormat':'SHA256 of JavaScript JSON.stringify UTF-8', 'scope':'exact stage + transitive reference closure, shared asset hash guards'};out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(enc(r));print(json.dumps({'stage':n,'owned':len(owned),'shared':len(shared),'rawSHA256':hashlib.sha256(out.read_bytes()).hexdigest(),'file':str(out)}))
