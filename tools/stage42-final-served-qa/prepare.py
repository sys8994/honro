import json,hashlib,sys
from pathlib import Path
R=Path(sys.argv[1]);Q=Path(__file__).parent
p=R/'shared/assets/environment/act5/stage42-registered-body.json'
raw=p.read_bytes();assert hashlib.sha256(raw).hexdigest()=='cf96948e596d37d7c80cedef76c56bee868214ed2147aa18cad62deb0f5284f6'
a=json.loads(raw);v=json.loads((Q/'template.json').read_text());assert v['root']['children'][1] is None;v['root']['children'][1]=a['vector']['root']
assert hashlib.sha256(json.dumps(v,separators=(',',':')).encode()).hexdigest()=='55c5caca5c94d0334682c8fc31a79154b0832ddd25ae39ccfb44b383ceaa219f'
a['vector']=v;a['bounds']={'x':-1250,'y':0,'w':4510,'h':1255};a['reference']['bounds']=a['bounds']
p.write_text(json.dumps(a,separators=(',',':')))
f=R/'shared/runtime/act5-edge-art.js';s=f.read_text();old="if(l.asset?.id==='act5:near:42'){const s=l.scale??1;return{left:q.left-900*s,right:q.right+900*s,top:q.top,bottom:q.bottom+468*s};}"
new="if(l.asset?.id==='act5:near:42'){const s=l.scale??1,a=l.asset.edgeWall.bounds;return{left:Math.min(q.left-900*s,l.x+(a.x-(l.asset.edgeWall.anchor?.x||0))*s),right:Math.max(q.right+900*s,l.x+(a.x+a.w-(l.asset.edgeWall.anchor?.x||0))*s),top:Math.min(q.top,l.y+(a.y-(l.asset.edgeWall.anchor?.y||0))*s),bottom:Math.max(q.bottom+468*s,l.y+(a.y+a.h-(l.asset.edgeWall.anchor?.y||0))*s)};}"
assert s.count(old)==1;s=s.replace(old,new);f.write_text(s)
print('QA temporary tree only: BODY binding and Stage42 visual bounds; no optimizer, physics, camera changes')
