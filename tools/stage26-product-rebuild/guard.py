"""Exact disposable source pair and active normal web graph checks; no writes to product."""
import json,re,hashlib,subprocess,sys
from pathlib import Path
BASE='4416dfb527f810398903d15510ab8ca05a892661'
TARGET='ffa3f0bd7c99a6ba34610d8175598e9000c93600'
TREES=('0950474c25bc899ea8195e91a839020633e90999','5ef7ae4b769c7c3a30c3968a75bec76e06e761fb')
AUTHOR='shared/runtime/act3-handoff-art.js'
ASSET='shared/assets/environment/act3-handoff/stage26-kiln-foundation.json'
PINS={
 AUTHOR:['57f8bb1758f6bac112f22608775a8f0d56c7492d','c68f211286da5bda2a2575988828e8b448c65110'],
 ASSET:['b9f5732b4a4562f59dde4afb5cc062559ea35b28','9ef0fa44bce003d7a82f0931fa4b3091a647e57e']}
MARK='westBedMaterial'
STOCK={'HONRO.html':'87b82bd0b887a02294a70a9c3768d2b61d247a8f23a30f204a878046f2209192',
 'web/entries/game.340c32a30a66adad.js':'340c32a30a66adad5aeadb58301f0b5cb74b2be29dd3fb6270676a21b4520986',
 'web/data/campaign.9840d8f258b12a6d.json':'9840d8f258b12a6d5bf3d122ceb4706ed069854523ddfcd1cc7e38839a5b2fc3',
 'web/data/chapter-26.cc8e0e37503433b3.json':'cc8e0e37503433b3d091272c8900b7163a8a7f3187286f2e6391885ae6f87cf6',
 'web/data/chapter-26-assets.a45d6ce39671a754.json':'a45d6ce39671a75478df0d707daaf648f56b275399f4c51e3bc2a770dc142642',
 'web/runtime/ordered-common-17.9b8e07dd9a78ec92.js':'9b8e07dd9a78ec925564ce3ea9e9b5a41388ef76fa875f988e8098173461afb7'}
SHA=lambda b:hashlib.sha256(b).hexdigest()
def git(p,*args):
 return subprocess.check_output(['git','-C',str(p),*args])
def blob(b):
 return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def check(root,stock,target,out,post=False):
 assert all(re.fullmatch(r'[a-f0-9]{40}',x) for x in (TARGET,*TREES,*sum(PINS.values(),[]))), 'four reviewed root pins required'
 assert git(root,'show','-s','--format=%P','HEAD').strip().decode()==TARGET
 qa=['.github/workflows/stage26-product-rebuild.yml']+['tools/stage26-product-rebuild/'+p for p in ['capture.py','guard.py','verify.py','registered-v2.json']]
 assert sorted(git(root,'diff','--name-status','--no-renames',TARGET,'HEAD').decode().splitlines())==['A\t'+p for p in sorted(qa)]
 assert git(root,'show','-s','--format=%P',TARGET).strip().decode()==BASE
 assert sorted(git(root,'diff','--name-status','--no-renames',BASE,TARGET).decode().splitlines())==['M\t'+p for p in sorted(PINS)]
 all_rows=[]
 for i,r in enumerate((stock,target)):
  head,target_tree=[BASE,TARGET][i],TREES[i]
  assert git(r,'rev-parse','HEAD').strip().decode()==head
  assert git(r,'rev-parse','HEAD^{tree}').strip().decode()==target_tree
  assert not git(r,'branch','--show-current').strip()
  if not post:assert git(r,'status','--porcelain=v1','-z','--untracked-files=all')==b''
  assert git(r,'status','--porcelain=v1','-z','--untracked-files=all','--','shared','game/engine','game/src','tests','workshop/build.mjs','tools','package.json','package-lock.json','game/package.json','game/package-lock.json')==b''
  pins={p:blob((r/p).read_bytes()) for p in PINS}
  assert all(pins[p]==PINS[p][i] for p in pins),pins
  all_rows.append({'commit':head,'tree':target_tree,'pinnedInputs':pins})
 a,b=[json.loads((r/ASSET).read_bytes()) for r in (stock,target)]
 assert MARK not in a.get('params',{}) and b['params'].get(MARK),'missing typed Stage26 material'
 stable=json.loads(json.dumps(b));del stable['params'][MARK]
 assert a==stable,'original asset changed outside params.westBedMaterial'
 assert MARK.encode() not in (stock/AUTHOR).read_bytes() and MARK.encode() in (target/AUTHOR).read_bytes()
 (out/('source-after.json' if post else 'source.json')).write_text(json.dumps(all_rows,indent=2)+'\n')
PATH=re.compile(r'web/(?:runtime|entries|data|styles|graphics|fonts)/[a-zA-Z0-9_.-]+\.([a-f0-9]{16})\.[a-zA-Z0-9]+')
def graph(root,arm):
 m=json.loads((root/'web/manifest.json').read_bytes())
 html=(root/'HONRO.html').read_bytes()
 assert len(m['files'])==len({r['path'] for r in m['files']})
 files={v['path']:{n:v[n]for n in ('bytes','sha256')}for v in m['files']}
 def read(rel):
  f=root/rel; match=PATH.fullmatch(rel)
  assert match and f.is_file() and not f.is_symlink() and f.resolve().is_relative_to(root.resolve())
  b=f.read_bytes(); assert files[rel]=={'bytes':len(b),'sha256':SHA(b)} and SHA(b).startswith(match.group(1)),rel
  return b
 entry=m['gameEntry']; campaign=m['project']
 assert len(set(re.findall(rb'web/entries/game\.[0-9a-f]{16}\.js',html)))==1 and entry.encode() in html
 entry_src=read(entry); assert campaign.encode() in entry_src
 loaders=set(re.findall(rb'["\x27]\.\./runtime/(campaign\.[0-9a-f]{16}\.js)["\x27]',entry_src));assert len(loaders)==1
 loader='web/runtime/'+next(iter(loaders)).decode()
 assert campaign.encode() in read(loader)
 q=json.loads(read(campaign))
 assert len(q['catalog'])==len(q['stages'])==len(q['stageLibraries'])==50
 assert [x['metadata']['stageId'] for x in q['catalog']]==list(range(1,51))
 closure={}
 for rel in [q['base'],q['shared'],*q['stages'],*q['stageLibraries']]:
  if rel in closure:continue
  raw=read(rel);it=[rel]
  # If the compiler split a large packet, the descriptor is not the asset bytes.
  # Check the ids, length and every real part the browser must fetch in order.
  if '-parts.' in rel or b'"$honroJsonParts"' in raw[:128]:
   d=json.loads(raw);assert d['$honroJsonParts']==1 and isinstance(d['parts'],list) and d['parts'],rel
   h=hashlib.sha256();size=0
   for v in d['parts']:
    p=v['path'];part=read(p)
    assert v['sha256']==SHA(part) and v['bytes']==len(part),(rel,p)
    h.update(part);size+=len(part);it.append(p)
   assert d['bytes']==size and d['sha256']==h.hexdigest(),rel
  closure[rel]=it
 reachable=[rel for rel in m['common'] if 'ordered-common-' in rel]
 assert reachable and all(('../runtime/'+rel.rsplit('/',1)[-1]).encode() in entry_src for rel in reachable)
 if arm=='A':
  runtime=next(rel for rel in STOCK if 'ordered-common-' in rel)
  assert runtime in reachable
  assert all(MARK.encode() not in read(rel) for rel in reachable)
  assert all(SHA(html if rel=='HONRO.html' else read(rel))==h for rel,h in STOCK.items())
 else:
  owners=[rel for rel in reachable if MARK.encode() in read(rel) and b'act3-handoff:' in read(rel)]
  assert len(owners)==1,owners;runtime=owners[0]
 assert b'act3-handoff:' in read(runtime)
 field=json.loads((root/ASSET).read_bytes()).get('params',{}).get(MARK)
 assert bool(field)==(arm=='B')
 return q,{'htmlSHA256':SHA(html),'needed':list(dict.fromkeys([entry,loader,campaign,runtime,*closure[q['base']],*closure[q['shared']],
                       *closure[q['stages'][25]],*closure[q['stageLibraries'][25]]])),
   'files':files,'roles':{'entry':entry,'campaign':campaign,'loader':loader,'activeRuntime':runtime,
    'stageMap':q['stages'][25],'chapterPacket':q['stageLibraries'][25]},'material':field}
def built(a,b,out):
 old,x=graph(a,'A'); new,y=graph(b,'B')
 assert old['stageLibraries'][25]!=new['stageLibraries'][25]
 assert old['stages']==new['stages'] and old['catalog']==new['catalog']
 for name in ('stageLibraries','assetEncodings','assetPaths'):
  if name=='stageLibraries':u,v=old[name],new[name]
  else:
   assert set(old[name])==set(new[name])
   assert {k:o for k,o in old[name].items() if k!='stageLibraries'}=={k:o for k,o in new[name].items() if k!='stageLibraries'}
   u,v=old[name]['stageLibraries'],new[name]['stageLibraries']
  assert len(u)==len(v)==50 and u[:25]+u[26:]==v[:25]+v[26:],name
 assert {k:v for k,v in old.items() if k not in ('stageLibraries','assetEncodings','assetPaths')}=={k:v for k,v in new.items() if k not in ('stageLibraries','assetEncodings','assetPaths')}
 assert x['roles']['activeRuntime']!=y['roles']['activeRuntime']
 for n,g in [('A',x),('B',y)]: (out/f'{n}-graph.json').write_text(json.dumps(g,indent=2)+'\n')
 (out/'built-scope.json').write_text(json.dumps({'A':x['roles'],'B':y['roles'],'49OtherChapterAssetPathsExact':True,
   '50ChapterMapPathsExact':True},indent=2)+'\n')
if __name__=='__main__':
 mode,*args=sys.argv[1:];args=[Path(p)for p in args]
 if mode in ('source','post'):check(*args,post=mode=='post')
 elif mode=='built':built(*args)
 else:raise SystemExit(mode)
