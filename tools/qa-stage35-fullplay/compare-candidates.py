#!/usr/bin/env python3
"""Compare pinned Stage 35 gameplay records and collision-bearing library data."""
import hashlib,json,sys
from pathlib import Path
old_path,new_path=map(Path,sys.argv[1:3])
old_raw,new_raw=old_path.read_bytes(),new_path.read_bytes()
old,new=map(json.loads,(old_raw,new_raw));a,b=old['stages'][0],new['stages'][0]
keys=['terrains','units','events','encounters','objectives','markers','initialState','width','height','playBounds','terrainBounds']
assert all(a.get(k)==b.get(k) for k in keys), 'gameplay record changed'
x={v['id']:v for v in old['library']};y={v['id']:v for v in new['library']}
assert x['approved35:body']==y['approved35:body']
assert all(not item.get('collision') for item in list(x.values())+list(y.values()))
print(json.dumps({'oldSha256':hashlib.sha256(old_raw).hexdigest(),'newSha256':hashlib.sha256(new_raw).hexdigest(),'equalStageFields':keys,'bodyEqual':True,'allLibraryCollisionArraysEmpty':True,'changedElementIds':[v['id'] for v in b['elements'] if v not in a['elements']],'changedLibraries':[k for k in sorted(x.keys()|y.keys()) if x.get(k)!=y.get(k)]},ensure_ascii=False,indent=2))
