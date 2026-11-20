from pathlib import Path
import json,hashlib,sys,copy
Q=Path(__file__).resolve().parent;root=Path(sys.argv[1]);sha=lambda b:hashlib.sha256(b).hexdigest()
p=root/'shared/assets/environment/act5/stage42-registered-body.json'
assert sha(p.read_bytes())=='95ce6aee7094c1b4f9a1f62c7f90f1fe164d99b007b286a8c41ebd2b4565ace8'
obj=json.loads(p.read_bytes())
old=copy.deepcopy(obj);tpl=json.loads((Q/'template.json').read_bytes());v=tpl['candidate']
assert v['root']['children'][:3]==[None]*3
v['root']['children'][:3]=old['vector']['root']['children']
assert v['root']['children'][:3]==old['vector']['root']['children']
assert all(v['clips'][k]==ds for k,ds in old['vector']['clips'].items())
assert sha(json.dumps(v,separators=(',',':')).encode())=='0a9445767f1fc114d1ff9b8bedd1b3b48ce510ddd517dccabefd7261cfdd6a62'
assert v['viewBox']==[-1250,0,4510,2900]
obj['vector']=v;obj['bounds']={'x':-1250,'y':0,'w':4510,'h':2900};obj['reference']['bounds']=obj['bounds']
rewind=copy.deepcopy(obj);rewind['vector']=old['vector'];rewind['bounds']=old['bounds'];rewind['reference']['bounds']=old['reference']['bounds']
assert rewind==old
p.write_text(json.dumps(obj,separators=(',',':')))
print('Detached target BODY only; vector 0a944… and visual height2900; stock cbf renderer remains exact; file SHA256',sha(p.read_bytes()))
