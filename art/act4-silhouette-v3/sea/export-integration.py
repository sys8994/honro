import json,hashlib
from pathlib import Path
D=Path(__file__).parent;R=D.parents[2];O=D/'integration';O.mkdir(exist_ok=True);base=json.load(open(R/'shared/data/act4/world.json'));baseline={a['id']:a for a in base['library']}
H=lambda o:hashlib.sha256(json.dumps(o,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
manifest=[]
for n,sha,prefix,tag in [(31,'16241604','stage31-edge-registered-','edge-'),(32,'a6abf25d','stage32-domain-review-',''),(37,'d90e8614','stage37-final-quiet-','quiet-'),(40,'f0eb4bc7','stage40-edge-registered-','edge-')]:
 source=R/f'_local/reports/sea-silhouette-v3/{prefix}{sha}.json'
 raw=source.read_bytes();p=json.loads(raw);s=next(s for s in p['stages']if s['id']==f'stage-{n}');ids={e['assetId']for e in s['elements']};assets={a['id']:a for a in p['library']if a['id']in ids};assert len(assets)==len(ids);owned=[];shared=[];conflicts=[]
 for id,a in assets.items():
  if id not in baseline:owned.append(a)
  elif H(a)==H(baseline[id]):shared.append({'id':id,'sha256':H(a)})
  else:conflicts.append({'id':id,'candidateSHA256':H(a),'baselineSHA256':H(baseline[id])})
 out={'stage':s,'ownedAssets':owned,'expectedSharedAssets':shared,'conflictingSharedAssets':conflicts,'sourceProjectSHA256':hashlib.sha256(raw).hexdigest(),'status':'representative art direction accepted; final runtime and gameplay release QA pending'};fn=f'stage{n}-{tag}{sha}.json';(O/fn).write_text(json.dumps(out,separators=(',',':'),ensure_ascii=False));manifest.append({'stage':n,'file':fn,'sha256':hashlib.sha256((O/fn).read_bytes()).hexdigest(),'sourceProjectSHA256':out['sourceProjectSHA256'],'ownedAssets':len(owned),'sharedAssets':len(shared),'conflicts':conflicts})
(O/'manifest.json').write_text(json.dumps(manifest,indent=2));print(json.dumps(manifest,indent=2))
