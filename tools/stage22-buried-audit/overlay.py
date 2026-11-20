import hashlib,json,os,sys
from pathlib import Path
stock,after,out=(Path(x) for x in sys.argv[1:4])
packet=Path('web/data/chapter-22.45371aeca83d76f7.json')
original=json.loads((stock/packet).read_bytes())
ids={'v22-art-built-buried-west-foundation','v22-art-built-buried-east-foundation'}
before=original['design']['space']['terrainPlanes']
target=[p for p in before if p['id'] in ids]
assert len(target)==2 and all(p['terrainId']=='v22-lower-court' and p['stage22VerticalArt'] for p in target)
assert not original['materials']
oldBody=next(p for p in before if p['id']=='v22-lower-court-built-body')
assert oldBody['fill']=='#3b514d'
result=json.loads(json.dumps(original));result['design']['space']['terrainPlanes']=[p for p in before if p['id'] not in ids]
assert len(result['design']['space']['terrainPlanes'])==len(before)-2
# Immutable temporary root; break this one hardlink before writing.
dest=after/packet
tmp=dest.with_suffix('.candidate.tmp')
tmp.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
os.replace(tmp,dest)
verify=json.loads(dest.read_bytes());verify['design']['space']['terrainPlanes']=before
assert verify==original
(out/'packet-contract.json').write_text(json.dumps({'packet':str(packet),'removed':target,'unaffectedBody':oldBody['id'],'afterRows':len(before)-2,'terrainPolygon':next(t['points'] for t in original['terrains'] if t['id']=='v22-lower-court'),'oneJsonPathOnly':True,'stockSha256':hashlib.sha256((stock/packet).read_bytes()).hexdigest(),'candidateSha256':hashlib.sha256(dest.read_bytes()).hexdigest()},indent=2))
