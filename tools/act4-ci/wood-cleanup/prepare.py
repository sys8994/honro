"""Apply actual Inkscape simplification to the selected timber trace only.
Keep the original rock/glyph paths, all terrain, actors and gameplay untouched.
"""
import argparse,copy,hashlib,json,lzma,re,xml.etree.ElementTree as E
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('output');a=p.parse_args()
raw=Path(a.input).read_bytes();assert hashlib.sha256(raw).hexdigest()=='a2dbd0c8baeb73ab0cb703f9af8cc4c772d9abb8ed4ffafbd618ae2858df03f9'
w=json.loads(raw);before=copy.deepcopy(w);asset=copy.deepcopy(next(v for v in w['library'] if v['id']=='approved38:body'));v=asset['vector'];children=v['root']['children'];old=json.dumps(asset,separators=(',',':'),ensure_ascii=False).encode()
assert len(children)==3 and children[2]['clipPath']=='timber-spatial-selection'
svg=lzma.decompress(Path(__file__).with_name('timber-simplified.svg.xz').read_bytes());assert hashlib.sha256(svg).hexdigest()=='a515e5955fb1f1820292054c19704808a76aa729e8cd000329cd9eef7619dd4d'
ds={e.get('id'):e.get('d') for e in E.fromstring(svg).iter() if e.tag.endswith('path')}
def parts(d):
 sub=re.findall('[Mm][^Mm]*',d);assert ''.join(sub)==d.strip();out=[];cur=''
 for s in sub:
  assert len(s)<=55000
  if len(cur)+len(s)>55000:out.append(cur);cur=''
  cur+=s
 if cur:out.append(cur)
 assert len(out)<=32
 return out
nodes=children[2]['children'][0]['children'][0]['children'];assert len(nodes)==12
for i,n in enumerate(nodes):
 old_d=n.get('d') or ' '.join(n['dParts']);d=ds['wood-'+str(i)];assert len(re.findall('[Mm]',d))==len(re.findall('[Mm]',old_d))
 n.pop('d',None);n.pop('dParts',None)
 if len(d)<=60000:n['d']=d
 else:n['dParts']=parts(d)
v['clips']['timber-source-alpha-silhouette']=parts(ds['wood-alpha']);nodes[0]['fill']='#6a5648'
source=next(x for x in before['library'] if x['id']=='approved38:body')
assert children[:2]==source['vector']['root']['children'][:2]
assert {k:x for k,x in asset.items() if k!='vector'}=={k:x for k,x in source.items() if k!='vector'}
assert w==before
asset['id']='approved38:body-timber-smooth-v1';w['library'].append(asset)
stage=next(s for s in w['stages'] if s['metadata']['stageId']==38)
body=next(e for e in stage['elements'] if e['id']=='approved38-body');assert body['assetId']=='approved38:body';body['assetId']=asset['id']
# The existing dependency-closure loader reads this explicit historical reference.
# Keep the original provider byte-exact so revision5 compact saves still resolve.
stage['metadata']['retainedArtAssetIds']=['approved38:body']
check=copy.deepcopy(w);check['library'].pop();cs=next(s for s in check['stages'] if s['metadata']['stageId']==38);cs['metadata'].pop('retainedArtAssetIds');next(e for e in cs['elements'] if e['id']=='approved38-body')['assetId']='approved38:body';assert check==before
result=json.dumps(w,ensure_ascii=False,separators=(',',':')).encode();Path(a.output).parent.mkdir(parents=True,exist_ok=True);Path(a.output).write_bytes(result)
print(json.dumps({'scope':'selected timber paths only; no terrain, units, events, growth, rock paths or glyph changed','oldAssetBytes':len(old),'newAssetBytes':len(json.dumps(asset,ensure_ascii=False,separators=(',',':')).encode()),'worldSha256':hashlib.sha256(result).hexdigest(),'releaseApproved':False}))
