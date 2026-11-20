import hashlib,json,os,re,sys
from splice import produce
from pathlib import Path
stock,after,out=map(Path, sys.argv[1:4])
name='tools/environment/stage22-vertical-art.mjs'
line=b" box('v22-lower-court','buried-west-foundation',0,5660,1590,940,'#354d48');box('v22-lower-court','buried-east-foundation',1610,4940,3200,1680,'#304a47');\n"
sha=lambda s:hashlib.sha256(s).hexdigest()
before_source=(stock/name).read_bytes()
after_source=(after/name).read_bytes()
assert before_source.count(line)==1 and before_source.replace(line,b'')==after_source

def path1(pattern,s):
 m=set(re.findall(pattern,s))
 assert len(m)==1,(pattern,m)
 return m.pop()
def read(root):
 html=(root/'HONRO.html').read_text()
 entry=path1(r'web/entries/game\.[0-9a-f]{16}\.js',html)
 raw=(root/entry).read_text()
 manifest=path1(r'web/data/campaign\.[0-9a-f]{16}\.json',raw)
 return dict(html=html,entry=entry,raw=raw,manifest=manifest,doc=json.loads((root/manifest).read_bytes()))
A,B=read(stock),read(after)
assert A['html'].replace(A['entry'],B['entry'])==B['html'],'HTML difference beyond entry hash'
assert A['raw'].replace(A['manifest'],B['manifest'])==B['raw'],'Runtime entry difference beyond manifest hash'
ma,mb=A['doc'],B['doc']
a22,b22=ma['stages'][21],mb['stages'][21]
assert a22!=b22,'Stage22 did not re-author during source build'
raw_stock=(stock/a22).read_bytes();raw_new=(after/b22).read_bytes()
assert sha(raw_stock)=='45371aeca83d76f74dd2b052e445d21d6a510b2d19fc05f4e0db0d43358f197e','Stock packet does not match prior isolated App proof'
prior_expected,prior_info=produce(raw_stock,'compiled-fixture')
assert raw_new==prior_expected,'Authored build bytes do not exactly match old App-proven two-row packet splice'
assert sha(raw_new)=='a8be99a3221a730acd6692d5c27867e2e46fc6d896404e6092e3948dccd02888'
runs=[]
verified=[]
def active_urls(x):
 if isinstance(x,str):
  if x.startswith('web/') and not x.endswith('/') and '\n' not in x:yield x
 elif isinstance(x,list):
  for y in x:yield from active_urls(y)
 elif isinstance(x,dict):
  for y in x.values():yield from active_urls(y)
for u in sorted(set(active_urls(ma))-{a22}):
 if not ((stock/u).is_file() or (after/u).is_file()):continue
 ab=(stock/u).read_bytes();bb=(after/u).read_bytes()
 assert ab==bb,u
 verified.append([u,sha(ab)])
mb['stages'][21]=a22
assert ma==mb,'Campaign manifest difference beyond Stage22 filename'
a,b=(json.loads((root/u).read_bytes()) for root,u in [(stock,a22),(after,b22)])
ids={'v22-art-built-buried-west-foundation','v22-art-built-buried-east-foundation'}
ap,bp=[d['design']['space']['terrainPlanes'] for d in (a,b)]
old=[p for p in ap if p['id'] in ids]
assert len(old)==2 and all(p['terrainId']=='v22-lower-court' and p['stage22VerticalArt'] for p in old)
assert bp==[p for p in ap if p['id'] not in ids]
assert not a['materials'] and not b['materials']
b['design']['space']['terrainPlanes']=ap
assert a==b,'Real-built Stage22 packet differs beyond two plane rows'
runtime_index=[]
for file in sorted((stock/'web/runtime').iterdir()):
 if not file.is_file():continue
 r=Path('web/runtime')/file.name
 if not (after/r).exists():
  raise AssertionError('Baseline runtime missing '+str(r))
 assert file.read_bytes()==(after/r).read_bytes(),r
 runtime_index.append(str(r))
assert set(x.name for x in (stock/'web/runtime').iterdir())==set(x.name for x in (after/'web/runtime').iterdir())
(out/'packet-contract.json').write_text(json.dumps(dict(terrainPolygon=next(t['points'] for t in a['terrains'] if t['id']=='v22-lower-court'),removed=old,stockMap=a22,candidateMap=b22,sourceFile=name,stockSourceSha256=sha(before_source),candidateSourceSha256=sha(after_source),oldCount=len(ap),newCount=len(bp),stage22Only=True,oldBuiltPacketSha256=sha(raw_stock),newBuiltPacketSha256=sha(raw_new),matchesPriorAppProvenPacketSplice=True,outsideSourceVerifiedViaGitDiff=True,activeFilesChecked=verified,runtimeFilesChecked=runtime_index,htmlOnlyEntryRename=True,entryOnlyManifestRename=True),ensure_ascii=False,indent=2))
print(f'Source equivalent: exact {len(ap)}→{len(bp)} Stage22 planes, {len(verified)} referenced files and {len(runtime_index)} runtime files byte exact.')
