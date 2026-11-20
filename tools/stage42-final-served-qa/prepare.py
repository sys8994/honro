from pathlib import Path
import json,hashlib,sys,copy
Q=Path(__file__).resolve().parent;root=Path(sys.argv[1]);sha=lambda b:hashlib.sha256(b).hexdigest()
p=root/'shared/assets/environment/act5/stage42-registered-body.json'
assert sha(p.read_bytes())=='95ce6aee7094c1b4f9a1f62c7f90f1fe164d99b007b286a8c41ebd2b4565ace8'
obj=json.loads(p.read_bytes())
old=copy.deepcopy(obj);v=json.loads((Q/'template.json').read_bytes())
assert v['root']['children'][1]['children']==[None]
v['root']['children'][1]['children'][0]=old['vector']['root']
assert all(v['clips'][k]==ds for k,ds in old['vector']['clips'].items())
assert sha(json.dumps(v,separators=(',',':')).encode())=='907d56f9f1ec862e49afcd8f3e0438d86027d2f581e4b19d370b1d74be02cc49'
assert v['viewBox']==[-1250,0,4510,2900]
obj['vector']=v;obj['bounds']={'x':-1250,'y':0,'w':4510,'h':2900};obj['reference']['bounds']=obj['bounds']
rewind=copy.deepcopy(obj);rewind['vector']=old['vector'];rewind['bounds']=old['bounds'];rewind['reference']['bounds']=old['reference']['bounds']
assert rewind==old
p.write_text(json.dumps(obj,separators=(',',':')))
print('Detached target BODY only; vector 907d… and visual height2900; stock cbf renderer remains exact; file SHA256',sha(p.read_bytes()))
