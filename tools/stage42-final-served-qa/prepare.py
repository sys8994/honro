import json,hashlib,sys
from pathlib import Path
R=Path(sys.argv[1]);Q=Path(__file__).parent
p=R/'shared/assets/environment/act5/stage42-registered-body.json'
raw=p.read_bytes();assert hashlib.sha256(raw).hexdigest()=='fb3357b110b729213fec13cf1fae9fc780d57a054856709781c3392bc13f85a8'
a=json.loads(raw);v=json.loads((Q/'template.json').read_text());v['symbols']={'original-body':a['vector']['root']}
a['vector']=v;a['bounds']={'x':-700,'y':0,'w':3900,'h':3250};a['reference']['bounds']=a['bounds'];a['reference']['foot']={'x':0,'y':3250};a['params']['qaDiagnosticOnly']='Stage42 crossed native underbody, no art approval or gameplay change'
p.write_text(json.dumps(a,separators=(',',':')))
f=R/'shared/runtime/act5-edge-art.js';s=f.read_text();old="if(l.asset?.id==='act5:near:42'){const s=l.scale??1;return{left:q.left-900*s,right:q.right+900*s,top:q.top,bottom:q.bottom+468*s};}"
new="if(l.asset?.id==='act5:near:42'){const s=l.scale??1,a=l.asset.edgeWall.bounds;return{left:Math.min(q.left-900*s,l.x+a.x*s),right:Math.max(q.right+900*s,l.x+(a.x+a.w)*s),top:Math.min(q.top,l.y+a.y*s),bottom:Math.max(q.bottom+468*s,l.y+(a.y+a.h)*s)};}"
assert s.count(old)==1;s=s.replace(old,new);f.write_text(s)
print('QA temporary tree only: BODY binding and Stage42 visual bounds; no optimizer, physics, camera changes')
