"""Exact disposable source pair and active normal web graph checks; no writes to product."""
import json,re,hashlib,subprocess,sys
from pathlib import Path
BASE='4416dfb527f810398903d15510ab8ca05a892661'
TARGET='4ed239f7fb560211296fd3f9d635067af00a7bfe'
TREES=('0950474c25bc899ea8195e91a839020633e90999','af4dd1647f6d67eb55125794cdb38552c8f61167')
AUTHOR='shared/act4-handoff-art.mjs'
OPT='shared/data/terrain-path-optimization.json'
PINS={
 AUTHOR:['663aacd36e78c626825ef704e36546c96374282b','c96da5bff3811b1cecedaa94be7e147c52651333'],
 OPT:['14b7a7015d23d05ce1f11b990b438d53d47b5875','70399325e30279f10a853835981913c635ba3386']}
FINGERPRINT=['09b0a304850c8426adcf504406348222f5e29cb927a34934c1d295bd2abd48dc',
             '15ca937d5aff348e6c173d37c3cca490aa69acd874f317b3a2ba0d4e3e3c5eaf']
SHA=lambda b:hashlib.sha256(b).hexdigest()
def git(p,*args):
 return subprocess.check_output(['git','-C',str(p),*args])
def blob(b):
 return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def check(root,stock,target,out,post=False):
 assert git(root,'show','-s','--format=%P','HEAD').strip().decode()==TARGET
 qa=['.github/workflows/stage36-current-native-pocket.yml']+['tools/stage36-current-pocket/'+p for p in ['capture.py','guard.py','verify.py']]
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
 a,b=[(r/OPT).read_bytes()for r in (stock,target)]
 assert a.count(FINGERPRINT[0].encode())==1 and a.replace(*(p.encode() for p in FINGERPRINT))==b
 rows=json.loads(a);modified=json.loads(b)
 assert len(rows)==132 and sum(q['id']=='approved36:near-slope-join-inland' for q in rows)==1
 assert modified==[q|{'original':FINGERPRINT[1]} if q['id']=='approved36:near-slope-join-inland' else q for q in rows]
 (out/('source-after.json' if post else 'source.json')).write_text(json.dumps(all_rows,indent=2)+'\n')
PATH=re.compile(r'web/(?:runtime|entries|data|styles|graphics|fonts)/[a-zA-Z0-9_.-]+\.([a-f0-9]{16})\.[a-zA-Z0-9]+')
def graph(root):
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
 return q,{'htmlSHA256':SHA(html),'needed':{
   str(s):list(dict.fromkeys([entry,loader,campaign,*closure[q['base']],*closure[q['shared']],
                    *closure[q['stages'][s-1]],*closure[q['stageLibraries'][s-1]]]))for s in (36,37)},
   'files':files,'roles':{'entry':entry,'campaign':campaign,'loader':loader}}
def built(a,b,out):
 old,x=graph(a); new,y=graph(b)
 assert old['stageLibraries'][35]!=new['stageLibraries'][35]
 assert old['stages']==new['stages'] and old['catalog']==new['catalog']
 for name in ('stageLibraries','assetEncodings','assetPaths'):
  if name=='stageLibraries':u,v=old[name],new[name]
  else:
   assert set(old[name])==set(new[name])
   assert {k:o for k,o in old[name].items() if k!='stageLibraries'}=={k:o for k,o in new[name].items() if k!='stageLibraries'}
   u,v=old[name]['stageLibraries'],new[name]['stageLibraries']
  assert len(u)==len(v)==50 and u[:35]+u[36:]==v[:35]+v[36:],name
 assert {k:v for k,v in old.items() if k not in ('stageLibraries','assetEncodings','assetPaths')}=={k:v for k,v in new.items() if k not in ('stageLibraries','assetEncodings','assetPaths')}
 for n,g in [('stock',x),('target',y)]: (out/f'{n}-graph.json').write_text(json.dumps(g,indent=2)+'\n')
 (out/'built-scope.json').write_text(json.dumps({'stage36':{'before':old['stageLibraries'][35],'after':new['stageLibraries'][35]},'49OtherChapterAssetPathsExact':True,'50ChapterMapPathsExact':True},indent=2)+'\n')
if __name__=='__main__':
 mode,*args=sys.argv[1:];args=[Path(p)for p in args]
 if mode in ('source','post'):check(*args,post=mode=='post')
 elif mode=='built':built(*args)
 else:raise SystemExit(mode)
