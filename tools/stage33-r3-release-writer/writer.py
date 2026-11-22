"""Disabled fixed Stage33 product-branch writer. No network write in this Python."""
import hashlib,json,io,os,re,stat,sys,subprocess,zipfile
from datetime import datetime
from pathlib import Path,PurePosixPath
HERE=Path(__file__).resolve().parent
TOP='sys8994/honro'; BASE='2c4e90ff24d1f5aa5d04f01317caa02f89b8194c';TREE='8d90f1fc6737adb025a5bb092b03462e283297ce'
TARGET='refs/heads/release/act4-stage33-coastal-end-20261122'
QA='refs/heads/qa/stage33-r3-2c4-release-writer-r3'; ORIGIN='https://github.com/sys8994/honro'
R2='b5a6b7b60bc769ef304396dcbb945c0ead74a78d'; R2_TREE='e73bf992747007c0e82580d14534ffefa8579191'
AUTHOR='shared/data/act4/sideview-art/33-coastal-v2.json';BLOB='3ab093ce8cff00efb620d2fed8eae6cc4c732892'
AUTHOR_SHA='4585577066f5db159605e405d6565795e3e1382df4f30e944ec84ee4c2c6c91a'
PRODUCER='qa/stage33-r3-2c4-release-payload';PRODUCER_WF='.github/workflows/stage33-r3-2c4-release-payload.yml'
PRODUCER_AR='honro-stage33-r3-exact-retained-payload-review-only'
CARRIER={'.github/workflows/stage33-r3-2c4-release-writer.yml',*(f'tools/stage33-r3-release-writer/{x}' for x in ('PINS.json','safe-push.sh','writer.py'))}
MF='web/manifest.json';SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
INNER='STAGE33-12-EXACT-REVIEW-ONLY.zip';REC='RETAINED-DELTA-RECEIPT.json'
HIST={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
def die(t,*m):
 if not t:raise SystemExit('STOP '+repr(m))
def hx(s,n):return isinstance(s,str) and re.fullmatch(f'[0-9a-f]{{{n}}}',s) and set(s)!={'0'}
def sha(b):return hashlib.sha256(b).hexdigest()
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def stamped(b):return {**facts(b),'git':blob(b)}
def data(b):
 def distinct(r):
  o=dict(r);die(len(r)==len(o),'duplicate keys');return o
 return json.loads(b,object_pairs_hook=distinct)
def git(r,*x,env=None,inp=None):return subprocess.check_output(['git','-C',str(r),*x],env=env,input=inp,timeout=200)
def tg(r,*x,env=None,inp=None):return git(r,*x,env=env,inp=inp).decode().strip()
def api(p):return data(subprocess.check_output(['gh','api',f'repos/{TOP}/'+p],timeout=45))
def normalize(x,aliases):
 for a,b in aliases.items():x=x.replace(b.encode(),a.encode()).replace(Path(b).name.encode(),Path(a).name.encode())
 return x
def inv(rows):
 m={}
 for r in rows:
  p=r['path'];v={k:r[k]for k in ('sha256','bytes')}
  die(re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',p) and hx(v['sha256'],64)and type(v['bytes'])is int and v['bytes']>0 and (p not in m or m[p]==v),'invalid manifest immutable address',p)
  m[p]=v
 return m
def reg(m):return inv([*m['files'],*m['previousFiles'],*sum(m['previousGenerations'],[]),*[v for q in m['publishedGenerations']for v in q['files']]])
def load():
 p=data((HERE/'PINS.json').read_bytes())
 die(p['enabled'] is True,'disabled until independent official producer payload + pinned digests')
 die((p['repo'],p['base'],p['baseTree'],p['target'],p['normalHead'],p['normalTree'],p['normalRun'],p['normalJob'],p['branch'])==
 (TOP,BASE,TREE,TARGET,R2,R2_TREE,44965208780,137032559280,QA.removeprefix('refs/heads/')),'source or writer scope changed')
 die(p['source']['path']==AUTHOR and p['source']['new']==BLOB and p['source']['sha256']==AUTHOR_SHA,'source Git authority drift')
 m=p['producer'];die((m['branch'],m['workflow'],m['jobName'],m['artifactName'])==(PRODUCER,PRODUCER_WF,'read-only-producer',PRODUCER_AR),'invalid producer scope')
 die(all(hx(m[k],40)for k in ('head','tree','productTree')) and all(hx(m[k],64)for k in ('outerHash','nestedHash','receiptSHA256')),'missing exact sealed hashes')
 die(all(type(m[k])is int and m[k]>0 for k in ('run','job','outerId','outerBytes','nestedBytes'))and m['outerBytes']<40<<20 and m['nestedBytes']<28<<20,'missing official artifact bounds')
 a=p['aliases']; fs=p['files']
 die(len(a)==len(set(a.values()))==7 and all(re.sub(r'\.[0-9a-f]{16}\.', '.ALIAS.', k)==re.sub(r'\.[0-9a-f]{16}\.', '.ALIAS.',y) and k!=y for k,y in a.items()),'seven fixed scoping aliases required')
 die(set(fs)=={AUTHOR,MF,*SHELL,*a.values()} and len(fs)==12,'exact 12 entries needed')
 for path,q in fs.items():
  die(q['mode']=='100644' and q['change']==('A'if path in a.values()else'M') and hx(q['git'],40) and hx(q['sha256'],64) and 0<q['bytes']<12<<20,'invalid target description',path)
 die(all(p['aliasFacts'][k]=={n:fs[k][n]for n in ('bytes','sha256')} for k in a.values()),'normal compiled leaf changed')
 die(fs[AUTHOR]['git']==BLOB and fs[AUTHOR]['sha256']==AUTHOR_SHA and fs[AUTHOR]['bytes']==1629325,'unapproved author bits')
 die({n:fs['HONRO.html'][n]for n in ('bytes','sha256')}==p['normalShellB'] and fs['index.html']==fs['HONRO.html'],'wrong active game shell')
 die(p['priorPhysical']==1329 and p['retainedPhysical']==1336,'history bound')
 die(type(p['commitDate'])is str and bool(re.fullmatch(r'2026-11-22T\d\d:\d\d:\d\dZ',p['commitDate'])),'fixed commit timestamp missing')
 datetime.fromisoformat(p['commitDate'])
 return p
def za(z,cap,inner=False):
 names=set();total=0
 for v in z.infolist():
  p=PurePosixPath(v.filename);m=v.external_attr>>16
  die(v.filename not in names and p.parts and not p.is_absolute() and '..' not in p.parts and chr(92)not in v.filename and p.as_posix()==v.filename.rstrip('/') and not(v.flag_bits&1) and stat.S_IFMT(m)in (0,stat.S_IFREG,stat.S_IFDIR)and(not inner or (m==0o100644 and not v.is_dir())),'unsafe/archive mode',v.filename)
  names.add(v.filename);total+=v.file_size
 die(total<=cap and z.testzip()is None,'invalid archive size/CRC')
 return names
def zread(z,k,cap):
 i=z.getinfo(k);die(not i.is_dir()and 0<i.file_size<=cap,'archive entry unsafe size',k);return z.read(i)
def validate(p,rec,nested):
 m=p['producer'];die(sha(rec)==m['receiptSHA256'] and facts(nested)=={'bytes':m['nestedBytes'],'sha256':m['nestedHash']},'payload/receipt mismatch')
 c=data(rec);fs=p['files']
 die(c['status']=='SEALED_NORMAL_PRODUCT_BYTES_FOR_REVIEW_ONLY' and c['published'] is False and c['base']==BASE and c['tree']==m['productTree'] and c['files']==fs and c['zip']==facts(nested),'wrong source/producer seal')
 die(c['authority']==p['artifact'] and c['legacyStrictStillFailed'] is True and (c['active'],c['priorPhysical'],c['retainedPhysical'])==(810,1329,1336),'old actual QA or retention authority')
 with zipfile.ZipFile(io.BytesIO(nested))as z:
  die(za(z,30<<20,True)==set(fs),'unexpected retained payload paths')
  files={k:zread(z,k,v['bytes'])for k,v in fs.items()}
 for k,v in files.items():die(stamped(v)=={n:fs[k][n]for n in ('bytes','sha256','git')},'sealed payload data changed',k)
 return files,c
def handoff(p,work):
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve();head=os.environ['GITHUB_SHA'];m=p['producer']
 die((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(TOP,'push',QA),'wrong orchestration')
 die(work.parent==Path(os.environ['RUNNER_TEMP']).resolve() and not work.exists(),'non-disposable evidence root')
 die(tg(root,'rev-parse','HEAD')==head and tg(root,'rev-list','--parents','-1',head).split()==[head,m['head']],'writer branch not exact producer descendant')
 die(set(tg(root,'diff','--name-status','--no-renames',m['head'],head).splitlines())=={'A\t'+k for k in CARRIER},'extra writer branch input')
 for ref,tr,par in ((BASE,TREE,None),(R2,R2_TREE,None),(m['head'],m['tree'],R2)):
  r=api('git/commits/'+ref)
  die(r['sha']==ref and r['tree']['sha']==tr and (par is None or [k['sha'] for k in r['parents']]==[par]),'immutable ancestry changed',ref)
 die(api('git/ref/heads/master')['object']['sha']==BASE and api('git/ref/heads/'+TARGET.removeprefix('refs/heads/'))['object']['sha']==BASE,'release branch must already exist at exact current master')
 n=api(f"actions/runs/{p['normalRun']}");die((n['head_sha'],n['status'],n['conclusion'])==(R2,'completed','success'),'normal visual/input source not approved')
 r=api(f"actions/runs/{m['run']}")
 die((r['head_sha'],r['head_branch'],r['path'],r['status'],r['conclusion'])==(m['head'],PRODUCER,PRODUCER_WF,'completed','success') and r['repository']['full_name']==r['head_repository']['full_name']==TOP,'wrong producer run')
 j=next(k for k in api(f"actions/runs/{m['run']}/jobs")['jobs'] if k['id']==m['job'])
 die((j['name'],j['conclusion'])==('read-only-producer','success') and sum(s['conclusion']=='success'for s in j['steps'] if 4<=s['number']<=6)==3,'producer authority/build/upload incomplete')
 aa=api(f"actions/runs/{m['run']}/artifacts")['artifacts'];die(len(aa)==1,'unexpected transport copies')
 a=aa[0];die((a['id'],a['name'],a['size_in_bytes'],a['digest'],a['expired'])==(m['outerId'],PRODUCER_AR,m['outerBytes'],'sha256:'+m['outerHash'],False)and a['workflow_run']['head_sha']==m['head'] and a['workflow_run']['id']==m['run'],'producer artifact metadata mismatch')
 work.mkdir(mode=0o700)
 z=work/'producer.zip'
 with z.open('xb') as f:subprocess.run(['gh','api',f"repos/{TOP}/actions/artifacts/{m['outerId']}/zip"],stdout=f,timeout=150,check=True)
 die(facts(z.read_bytes())=={'bytes':m['outerBytes'],'sha256':m['outerHash']},'outer payload altered')
 with zipfile.ZipFile(z)as f:
  names=za(f,45<<20)
  die({INNER,REC,'retainer.json','build-B.log','production-contract.log'}<=names and all(n in {INNER,REC,'retainer.json','build-B.log','production-contract.log','prepare.log','CANDIDATE-SOURCE.json','npm-root.log','npm-game.log'} for n in names),'unexpected outer data')
  nested,rec=zread(f,INNER,m['nestedBytes']),zread(f,REC,2<<20)
  validate(p,rec,nested)
 (work/INNER).write_bytes(nested);(work/REC).write_bytes(rec)
def before(r,p,files):
 da=data(git(r,'show',BASE+':'+MF));db=data(files[MF])
 die(facts(git(r,'show',BASE+':'+MF))==p['normalManifestA'],'wrong prior published manifest')
 ar,br=reg(da),reg(db);a,b=inv(da['files']),inv(db['files']); adds=set(p['aliases'].values())
 die(len(ar)==1329 and len(br)==1336 and set(br)-set(ar)==adds and all(k in br and br[k]==v for k,v in ar.items()),'history not preserved without mutation')
 die(len(a)==len(b)==810 and set(b)-set(a)==adds and set(a)-set(b)==set(p['aliases']) and all(a[k]==b[k]for k in a.keys()&b.keys()),'unexpected active unrelated bytes')
 die(sha(json.dumps(b,sort_keys=True,separators=(',',':')).encode())==p['originalActiveCommonFactsDigest'],'wrong active SHA on reconstructed product')
 for k in SHELL:die(normalize(files[k],p['aliases'])==git(r,'show',BASE+':'+k),'shell non-pointer difference',k)
 for k,n in p['aliases'].items():
  if n.endswith(('.js','.html')):die(normalize(files[n],p['aliases'])==git(r,'show',BASE+':'+k),'runtime non-pointer difference',n)
 pa={k['sourceSha']:k for k in da['publishedGenerations']};pb={k['sourceSha']:k for k in db['publishedGenerations']}
 die(BASE in pb and set(pb)<=set(pa)|{BASE} and all(pa[k]==v for k,v in pb.items()if k!=BASE) and pb[BASE]['files']==da['files'] and pb[BASE]['publishedAt']==p['pages']['at'],'previous published identity drift')
 die(all((row['path'] in b or row['path'] in inv(db['previousFiles'])) for k in set(pa)-set(pb)for row in pa[k]['files']),'expired registry orphaned')
 # Root tree comparison after write proves all preexisting addresses (and every other path) are untouched.
def make(p,work,repo):
 m=p['producer'];files,_=validate(p,(work/REC).read_bytes(),(work/INNER).read_bytes())
 die(tg(repo,'rev-parse',BASE+'^{tree}')==TREE and tg(repo,'remote','get-url','--push','origin')==ORIGIN,'wrong checkout/root')
 before(repo,p,files)
 idx=work/'candidate-index';die(not idx.exists(),'existing index')
 e={**os.environ,'GIT_INDEX_FILE':str(idx)}
 git(repo,'read-tree',BASE,env=e);fs=p['files']
 for k,v in sorted(files.items()):
  die(tg(repo,'hash-object','-w','--stdin',env=e,inp=v)==fs[k]['git'],'local Git blob differs',k)
  git(repo,'update-index','--add','--cacheinfo','100644,'+fs[k]['git']+','+k,env=e)
 t=tg(repo,'write-tree',env=e);die(t==m['productTree'],'new tree is not official retained proof')
 d={q['change']+'\t'+k for k,q in fs.items()}
 die(set(tg(repo,'diff-tree','--no-renames','-r','--name-status',BASE,t).splitlines())==d,'unexpected index changes/old URL mutation')
 time=p['commitDate']
 e.update(GIT_AUTHOR_NAME='HONRO QA',GIT_AUTHOR_EMAIL='qa@honro.invalid',GIT_COMMITTER_NAME='HONRO QA',GIT_COMMITTER_EMAIL='qa@honro.invalid',GIT_AUTHOR_DATE=time,GIT_COMMITTER_DATE=time)
 c=tg(repo,'commit-tree',t,'-p',BASE,env=e,inp=b'Stage33: reconnect lower coastal rock strata\n')
 die(hx(c,40)and tg(repo,'show','-s','--format=%P',c)==BASE and tg(repo,'rev-parse',c+'^{tree}')==t,'commit not a single exact descendant')
 (work/'candidate.sha').write_text(c+'\n')
 print(c)
if __name__=='__main__':
 p=load()
 if sys.argv[1]=='handoff':handoff(p,Path(sys.argv[2]).resolve())
 elif sys.argv[1]=='prepare':make(p,Path(sys.argv[2]).resolve(),Path(sys.argv[3]).resolve())
 elif sys.argv[1]!='pins':raise SystemExit('unknown command')
