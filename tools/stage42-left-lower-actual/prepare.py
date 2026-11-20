"""QA-only detached fixture; never publish or alter the source branch."""
import json,sys,hashlib,copy
from pathlib import Path
D=Path(__file__).parent
cfg=json.loads((D/'config.json').read_text())
p=Path(sys.argv[1])/'shared/assets/environment/act5/stage42-registered-body.json'
s=p.read_bytes()
sha=lambda b:hashlib.sha256(b).hexdigest()
pack=lambda x:json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
v=cfg['pins']
assert sha(s)==v['originalWrapperSHA256']
orig=json.loads(s)
target=copy.deepcopy(orig);root=target['vector']['root']['children']
assert len(root)==4 and [sha(pack(q))for q in root]==v['oldRoots']
assert len(orig['vector']['clips'])==7 and sha(pack(orig['vector']['clips']))==v['oldClipsSHA256']
group=v['insertedRoot'];paths=group['children']
assert set(group)=={'tag','children'} and group['tag']=='g' and len(paths)==2
assert [k['fill']for k in paths]==['#29343e','#252f39']
assert all(set(x)=={'tag','d','fill'} and x['tag']=='path' for x in paths)
assert sha(pack(group))==v['insertedRootSHA256']
for b,w in zip(paths,v['paths']):
 assert sha(b['d'].encode())==w['dSHA256'] and sha(pack(b))==w['pathNodeSHA256']
assert v['rootIndex']==3
root.insert(3,group)
assert sha(pack(target['vector']))==cfg['artistVector']
f=pack(target)
assert sha(f)==v['targetWrapperSHA256'] and len(f)==len(s)+1082
assert root.pop(3)==group and pack(target)==s
p.write_bytes(f)
print('Exact 4f53fe3 BODY source, same four ordered original roots/seven clips; +2 lower-west authored paths only:', sha(f))
