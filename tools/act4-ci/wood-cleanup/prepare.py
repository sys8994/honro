"""Remove the redundant raster-stair timber trace, preserving source geometry.
This is an authored layer removal, not a bounded-loss simplification claim.
"""
import argparse,copy,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('output');a=p.parse_args()
raw=Path(a.input).read_bytes()
assert hashlib.sha256(raw).hexdigest()=='a2dbd0c8baeb73ab0cb703f9af8cc4c772d9abb8ed4ffafbd618ae2858df03f9'
w=json.loads(raw);before=copy.deepcopy(w);asset=next(v for v in w['library'] if v['id']=='approved38:body');v=asset['vector'];children=v['root']['children']
assert len(children)==3 and children[2]['clipPath']=='timber-spatial-selection'
assert children[0]['clipPath']=='source-alpha-silhouette'
old=json.dumps(asset,separators=(',',':'),ensure_ascii=False).encode()
del children[2]
for name in ['timber-source-alpha-silhouette','timber-spatial-selection']:del v['clips'][name]
assert w['stages']==before['stages']
assert all(x==y for x,y in zip(w['library'],before['library']) if x['id']!='approved38:body')
source=next(x for x in before['library'] if x['id']=='approved38:body')
assert children==source['vector']['root']['children'][:2]
assert {k:x for k,x in asset.items() if k!='vector'}=={k:x for k,x in source.items() if k!='vector'}
result=json.dumps(w,ensure_ascii=False,separators=(',',':')).encode();Path(a.output).parent.mkdir(parents=True,exist_ok=True);Path(a.output).write_bytes(result)
print(json.dumps({'scope':'art layer only; no terrain, units, events, growth or source paths changed','oldAssetBytes':len(old),'newAssetBytes':len(json.dumps(asset,ensure_ascii=False,separators=(',',':')).encode()),'worldSha256':hashlib.sha256(result).hexdigest(),'releaseApproved':False}))
