import json,hashlib,sys
from pathlib import Path
R=Path(sys.argv[1]);Q=Path(__file__).parent
p=R/'shared/assets/environment/act5/stage42-registered-body.json'
raw=p.read_bytes();assert hashlib.sha256(raw).hexdigest()=='cf96948e596d37d7c80cedef76c56bee868214ed2147aa18cad62deb0f5284f6'
a=json.loads(raw);mode=sys.argv[2];v=json.loads((Q/'template.json').read_text())[mode];parts=v['root']['children'][1]['children'][0]['children'];assert parts==[None];parts[0]=a['vector']['root']
assert hashlib.sha256(json.dumps(v,separators=(',',':')).encode()).hexdigest()=={'stock':'1db7c108f45a1ee4842893db886790658808baa7f8dce508359cdcd581eae922','target':'42052426ca0c5cc6b46f5b39d4601bfb01b80a9e1fda0c6793d8cb44df3b1eff'}[mode]
a['vector']=v;a['bounds']={'x':-410,'y':0,'w':2760,'h':2900};a['reference']['bounds']=a['bounds']
p.write_text(json.dumps(a,separators=(',',':')))
f=R/'shared/runtime/act5-edge-art.js';s=f.read_text();old="if(l.asset?.id==='act5:near:42'){const s=l.scale??1;return{left:q.left-900*s,right:q.right+900*s,top:q.top,bottom:q.bottom+468*s};}"
new="if(l.asset?.id==='act5:near:42'){const s=l.scale??1,a=l.asset.edgeWall.bounds;return{left:Math.min(q.left-900*s,l.x+a.x*s),right:Math.max(q.right+900*s,l.x+(a.x+a.w)*s),top:Math.min(q.top,l.y+a.y*s),bottom:Math.max(q.bottom+468*s,l.y+(a.y+a.h)*s)};}"
assert s.count(old)==1;s=s.replace(old,new);f.write_text(s)
print('QA temporary tree only: BODY binding and Stage42 visual bounds; no optimizer, physics, camera changes')
