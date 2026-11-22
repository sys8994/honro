"""No release. Exactly one compiler change, prior immutable old save generator and detached B."""
import hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_text());S='shared/build.mjs';M='web/manifest.json'
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return dict(bytes=len(b),sha256=sha(b))
def fact0(x):return {k:x[k] for k in ('bytes','sha256')}
def pin(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def need(x,msg):
 if not x:raise RuntimeError(msg)
def rd(r,k):return (r/k).read_bytes()
def sv(w,n,x):(w/'out'/n).write_text(json.dumps(x,indent=2)+'\n')
def git(r,*args):return subprocess.check_output(['git','-C',str(r),*args],timeout=120,text=True).strip()
def pre(w):
 a=Path(os.environ['GITHUB_WORKSPACE']);h=os.environ['GITHUB_SHA'];b=w/'B'
 need(P['enabled'] is True and not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'disabled or has write credentials')
 pub=P['baseRelease']
 need(type(pub['pagesRun']) is int and type(pub['pagesJob']) is int and isinstance(pub['pagesDeployCompletedUTC'],str),'exact Pages is not bound')
 need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef']),'wrong QA trigger')
 paths={'.github/workflows/stage33-provider-2c4-r3.yml',*(str(D.relative_to(a)/k)for k in ('PINS.json','build-hotfix.mjs','old-c60-HONRO.html','old-2c4-HONRO.html','observer.json','guard.py','capture.py'))}
 need(git(a,'show','-s','--format=%P',h)==P['head'] and git(a,'rev-parse',P['head']+'^{tree}')==P['tree'] and set(git(a,'diff','--name-status','--no-renames',P['head'],h).splitlines())=={'A\t'+k for k in paths} and not git(a,'status','--porcelain=v1'),'unexpected QA delta')
 need(pin(rd(a,M))==P['manifest'] and pin(rd(a,S))==P['sourceBefore'] and pin(rd(D,'build-hotfix.mjs'))==P['sourceCandidate'] and pin(rd(D,'old-c60-HONRO.html'))==P['oldShell'] and pin(rd(D,'observer.json'))==P['observer'],'initial pin error')
 need(pin(rd(a,'shared/runtime/profile-store.js'))==pub['profileSource'] and pin(rd(a,pub['profileModule']))==pub['profileCompiled'],'exact shipping Stage46 scoped restore profile not present')
 ma=json.loads(rd(a,M))
 regAll={x['path']:fact0(x) for x in [*ma['files'],*ma['previousFiles'],*sum(ma['previousGenerations'],[]),*(r for gg in ma['publishedGenerations'] for r in gg['files'])]}
 need(len(regAll)==pub['registry'] and len(ma['files'])==pub['active'],'published active/old immutable registry changed')
 c=[x for x in ma['publishedGenerations']if x['sourceSha']==P['old']]
 need(len(c)==1,'exact historic retained c60 graph not found')
 reg={r['path']:{k:r[k]for k in ('bytes','sha256')}for r in c[0]['files']}
 need(all(reg[k]==v==fact(rd(a,k)) for k,v in P['stage40OldRoutes'].items()),'c60 Stage40 genuine immutable registration missing')
 old={k:fact(rd(a,k))for k in [P['oldEntry'],P['oldWrapper'],P['oldCampaign'],P['oldPacket'],P['map']]}
 need(all(reg[k]==v for k,v in old.items()),'old canonical source not exact immutable c60 route')
 two=P['old2c4']
 mm=[x for x in ma['publishedGenerations']if x['sourceSha']==two['head']]
 need(len(mm)==1 and pin(rd(D,'old-2c4-HONRO.html'))==two['shell'],'exact historic 2c4 graph or shell not retained')
 reg2={r['path']:{k:r[k]for k in ('bytes','sha256')}for r in mm[0]['files']}
 old2={k:fact(rd(a,k))for k in two['route']}
 need(all(reg2[k]==v for k,v in old2.items()),'old canonical 2c4 immutable graph mismatch')
 otc=w/'A';otc.mkdir();(otc/'HONRO.html').write_bytes(rd(D,'old-c60-HONRO.html'));(otc/'OLD-2C4.html').write_bytes(rd(D,'old-2c4-HONRO.html'));(otc/'web').symlink_to(a/'web',target_is_directory=True)
 git(a,'worktree','add','--detach',str(b),P['head']);(b/S).write_bytes(rd(D,'build-hotfix.mjs'))
 need(git(b,'diff','--name-status')=='M\t'+S,'not scoped one source')
 sv(w,'SOURCE.json',{'head':h,'base':P['head'],'before':P['sourceBefore'],'candidate':P['sourceCandidate'],'oldStock':P['old'],'oldShell':P['oldShell'],'oldRoutes':old,'2c4Routes':old2,'2c4Shell':two['shell'],'source':S})
def observe(w):
 a=Path(os.environ['GITHUB_WORKSPACE']); b=w/'B'; x,y=[json.loads(rd(r,M))for r in (a,b)]
 ia,ib=({q['path']:{k:q[k]for k in ('bytes','sha256')}for q in d['files']}for d in (x,y))
 add=sorted(ib.keys()-ia.keys());drop=sorted(ia.keys()-ib.keys());pat=r'web/(runtime/ordered-common-12\.[a-f0-9]{16}\.js|entries/(game\.[a-f0-9]{16}\.(js|html)|workshop\.[a-f0-9]{16}\.js))'
 need(len(ia)==len(ib)==810 and len(add)==len(drop)==4 and all(ia[k]==ib[k]for k in ia.keys()&ib.keys()) and all(re.fullmatch(pat,k)for k in add+drop),'only registry common12 + 3 entries may change')
 need(x['project']==y['project'] and rd(a,x['project'])==rd(b,x['project']),'project assets/map modified')
 old=P['oldTable'];new=next(k for k in add if 'ordered-common-12.'in k)
 oa,nb=rd(a,old),rd(b,new)
 need(pin(oa)==P['oldTableIdentity'] and pin(nb)==P['newCommonPrediction'],'verified 72dd baseline or single splice prediction not exact')
 pub=P['baseRelease'];profile=pub['profileModule']
 need(pin(rd(a,profile))==pin(rd(b,profile))==pub['profileCompiled'] and pin(rd(b,'shared/runtime/profile-store.js'))==pub['profileSource'],'Stage46 scoped profile changed')
 for owner,literal in P['stage40RowsLexical'].items():
  row=(json.dumps(owner)+':'+literal).encode()
  need(oa.count(row)==nb.count(row)==1,'Stage40 exact historical/optimized row changed: '+owner)
 def split(z):
  prefix,sep,tail=z.partition(b'globalThis.HONRO_PREVIOUS_TERRAIN_ART=');need(sep!=b'','missing registry assignment')
  val,sp,post=tail.partition(b'})();await yieldIfNeeded();');need(sp!=b'','wrong native registry module end');return prefix,val,post
 p,u,j=split(oa);q,v,k=split(nb);need(p==q and j==k,'compiled non-registry code drifted')
 needle=b'"act4-sideview:33:coastal-v2:lowland":{stage:33,previous:"743870:a3735931",current:"745366:5d4bce0d"}'
 one=needle[:-1]+b',previousOptimized:"728197:c76800ec"}'
 need(u.count(needle)==1 and v==u.replace(needle,one,1),'unexpected registry change; only exact 2c4 lowland token permitted')
 c=json.loads(rd(a,x['project']));peers={}
 for id in (21,32,33,40,42,46):
  d=id-1;mp=c['stages'][d];pack=c['stageLibraries'][d]
  rr=json.loads(rd(a,pack));parts=[j['path']for j in rr.get('parts',[])]if isinstance(rr,dict)else []
  paths=[mp,pack,*parts];peers[str(id)]={k:fact(rd(a,k))for k in paths}
  need(peers[str(id)]==P['exactPeers'][str(id)] and all(fact(rd(b,k))==v for k,v in peers[str(id)].items()),'peer authored map, packet or split parts changed')
 need(c['stages'][32]==P['map'] and c['stageLibraries'][32]==P['newPacket'],'stage33 active paths do not match current')
 sv(w,'GRAPH.json',dict(add=add,removed=drop,peers=peers,oldCommon=old,newCommon=new,currentEntry=y['gameEntry'].split('?')[0],currentProject=y['project'],protectedProfile=profile,protectedProfileBody=fact(rd(b,profile)),allFiveStage40Rows=True,unchangedOutsideRegistry=True,sha=fact(nb),base=P['head']))
def seal(w):
 b=w/'B';o=w/'out';c=json.loads(rd(o,'BROWSER.json'));g=json.loads(rd(o,'GRAPH.json'))
 need(c['status']=='PASS_STAGE33_2C4_REPRODUCED_AND_SCOPED_RECOVERY','browser diagnosis must pass')
 files={}
 with zipfile.ZipFile(o/'B-STAGE33-SAVE-HOTFIX-NO-DEPLOY.zip','x',compression=zipfile.ZIP_DEFLATED) as z:
  for k in sorted({*g['add'],S,M,'HONRO.html','HONRO_WORKSHOP.html','index.html'}):
   raw=rd(b,k);files[k]=pin(raw);z.writestr(k,raw)
 sv(w,'SEAL.json',dict(status=c['status'],base=P['head'],files=files,zip=pin(rd(o,'B-STAGE33-SAVE-HOTFIX-NO-DEPLOY.zip')),proof=pin(rd(o,'BROWSER.json')),graph=pin(rd(o,'GRAPH.json')),noDeploy=True))
if __name__=='__main__':{'pre':pre,'observe':observe,'seal':seal}[sys.argv[1]](Path(sys.argv[2]))
