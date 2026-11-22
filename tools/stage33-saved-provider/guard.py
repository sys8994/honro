"""No release. Exactly one compiler change, prior immutable old save generator and detached B."""
import hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_text());S='shared/build.mjs';M='web/manifest.json';F='shared/runtime/profile-store.js'
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return dict(bytes=len(b),sha256=sha(b))
def fact0(x):return {k:x[k] for k in ('bytes','sha256')}
def pin(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def need(x,msg):
 if not x:raise RuntimeError(msg)
def rd(r,k):return (r/k).read_bytes()
def sv(w,n,x):(w/'out'/n).write_text(json.dumps(x,indent=2)+'\n')
def git(r,*args):return subprocess.check_output(['git','-C',str(r),*args],timeout=120,text=True).strip()
def checkAuthored(r,alter=False):
 need(all(pin(rd(r,path))==(P['profileCandidate'] if alter and path==F else who)for path,who in P['jointSource'].items()),'one of the four signed joint author paths changed')
def pre(w):
 a=Path(os.environ['GITHUB_WORKSPACE']);h=os.environ['GITHUB_SHA'];b=w/'B'
 need(P['enabled'] is True and not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'disabled or has write credentials')
 pub=P['baseRelease']
 need(isinstance(P['head'],str) and re.fullmatch('[0-9a-f]{40}',P['head']) and isinstance(P['tree'],str) and re.fullmatch('[0-9a-f]{40}',P['tree']) and isinstance(P['manifest'],dict) and type(pub['registry']) is int,'new published joint parent not bound')
 need(type(pub['pagesRun']) is int and type(pub['pagesJob']) is int and isinstance(pub['pagesDeployCompletedUTC'],str),'exact Pages is not bound')
 need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef']),'wrong QA trigger')
 paths={'.github/workflows/stage33-provider-2c4-r6.yml',*(str(D.relative_to(a)/k)for k in ('PINS.json','build-hotfix.mjs','old-c60-HONRO.html','old-2c4-HONRO.html','observer.json','guard.py','capture.py','profile-candidate.js','compiled.mjs'))}
 need(git(a,'show','-s','--format=%P',h)==P['head'] and git(a,'rev-parse',P['head']+'^{tree}')==P['tree'] and set(git(a,'diff','--name-status','--no-renames',P['head'],h).splitlines())=={'A\t'+k for k in paths} and not git(a,'status','--porcelain=v1'),'unexpected QA delta')
 need(pin(rd(a,M))==P['manifest'] and pin(rd(a,S))==P['sourceBefore'] and pin(rd(D,'build-hotfix.mjs'))==P['sourceCandidate'] and pin(rd(D,'profile-candidate.js'))==P['profileCandidate'] and pin(rd(D,'old-c60-HONRO.html'))==P['oldShell'] and pin(rd(D,'observer.json'))==P['observer'],'initial pin error')
 checkAuthored(a)
 need(git(a,'show','-s','--format=%P',P['head'])==P['qualifiedJoint']['normalCandidateParent'],'new live parent not exact joint-only footprint')
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
 git(a,'worktree','add','--detach',str(b),P['head']);(b/S).write_bytes(rd(D,'build-hotfix.mjs'));(b/F).write_bytes(rd(D,'profile-candidate.js'))
 need(set(git(b,'diff','--name-status').splitlines())=={'M\t'+S,'M\t'+F},'not scoped exact two authored sources')
 sv(w,'SOURCE.json',{'head':h,'base':P['head'],'before':P['sourceBefore'],'candidate':P['sourceCandidate'],'oldStock':P['old'],'oldShell':P['oldShell'],'oldRoutes':old,'2c4Routes':old2,'2c4Shell':two['shell'],'source':S,'profile':P['profileCandidate']})
def observe(w):
 a=Path(os.environ['GITHUB_WORKSPACE']); b=w/'B'; x,y=[json.loads(rd(r,M))for r in (a,b)]
 ia,ib=({q['path']:{k:q[k]for k in ('bytes','sha256')}for q in d['files']}for d in (x,y))
 add=sorted(ib.keys()-ia.keys());drop=sorted(ia.keys()-ib.keys());pat=r'web/(runtime/ordered-common-(?:4|12)\.[a-f0-9]{16}\.js|entries/(game\.[a-f0-9]{16}\.(js|html)|workshop\.[a-f0-9]{16}\.js))'
 need(len(ia)==len(ib)==P['baseRelease']['active'] and len(add)==len(drop)==5 and all(ia[k]==ib[k]for k in ia.keys()&ib.keys()) and all(re.fullmatch(pat,k)for k in add+drop),'only same owner common4/common12 + three entries may change')
 need(x['project']==y['project']==P['qualifiedJoint']['project'] and rd(a,x['project'])==rd(b,x['project']),'project assets/map modified')
 checkAuthored(a);checkAuthored(b,True)
 need(pin(rd(b,S))==P['sourceCandidate'] and pin(rd(b,F))==P['profileCandidate'],'normal build changed signed restore author bytes')
 pub=P['baseRelease'];profile=pub['profileModule'];new4=next(k for k in add if 'ordered-common-4.'in k)
 old=P['oldTable'];new=next(k for k in add if 'ordered-common-12.'in k)
 need(set(drop)=={profile,old,x['gameEntry'],x['workshopEntry'],x['playtest'].split('?')[0]},'unexpected removed normal file')
 need(set(add)=={new4,new,y['gameEntry'],y['workshopEntry'],y['playtest'].split('?')[0]},'unexpected added normal file')
 need(pin(rd(a,old))==P['oldTableIdentity'] and pin(rd(a,profile))==pub['profileCompiled'],'before owner source differs')
 protected={k:v for k,v in P['qualifiedJoint']['protectedActive'].items()if k!=profile}
 need(all(ia[k]==ib[k]==v==fact(rd(a,k))==fact(rd(b,k))for k,v in protected.items()),'joint lazy data/loader or other active peer drift')
 repl={profile:new4,old:new}
 for name in ('common','gameOnly'):
  need([repl.get(k,k)for k in x[name]]==y[name],'exact ordered script slots moved')
 comp=json.loads(subprocess.check_output(['node',str(D/'compiled.mjs'),str(a),str(b),profile,new4,old,new,P['qualifiedJoint']['loader']],timeout=90))
 sv(w,'COMPILED-LOCAL-SLOTS.json',comp)
 def replace(source,slots):
  for k,v in slots.items():source=source.replace(Path(k).name.encode(),Path(v).name.encode())
  return source
 need(replace(rd(a,x['gameEntry']),repl)==rd(b,y['gameEntry']),'unexpected game route transitive difference')
 need(replace(rd(a,x['playtest'].split('?')[0]),{x['gameEntry']:y['gameEntry']})==rd(b,y['playtest'].split('?')[0]),'unexpected playtest outer shell difference')
 need(replace(rd(a,x['workshopEntry']),{**repl,x['playtest'].split('?')[0]:y['playtest'].split('?')[0]})==rd(b,y['workshopEntry']),'unexpected Workshop route transitive difference')
 for k,role in [('HONRO.html','gameEntry'),('index.html','gameEntry'),('HONRO_WORKSHOP.html','workshopEntry')]:
  need(replace(rd(a,k),{x[role]:y[role]})==rd(b,k),'unrelated root shell difference '+k)
 nb=rd(b,new)
 c=json.loads(rd(a,x['project']));peers={}
 for id in (21,32,33,40,42,46):
  d=id-1;mp=c['stages'][d];pack=c['stageLibraries'][d]
  rr=json.loads(rd(a,pack));parts=[j['path']for j in rr.get('parts',[])]if isinstance(rr,dict)else []
  paths=[mp,pack,*parts];peers[str(id)]={k:fact(rd(a,k))for k in paths}
  need(peers[str(id)]==P['exactPeers'][str(id)] and all(fact(rd(b,k))==v for k,v in peers[str(id)].items()),'peer authored map, packet or split parts changed')
 need(c['stages'][32]==P['map'] and c['stageLibraries'][32]==P['newPacket'],'stage33 active paths do not match current')
 workshop={}
 for tag,m,active,root in [('A',x,ia,a),('B',y,ib,b)]:
  wp=m['workshopEntry'].split('?')[0]
  sel=[wp,P['qualifiedJoint']['project'],P['qualifiedJoint']['legacyStage32Archive'],*P['exactPeers']['32']]
  workshop[tag]={'shell':fact(rd(root,'HONRO_WORKSHOP.html')),'archive':P['qualifiedJoint']['legacyStage32Archive'],'routes':{k:active[k]for k in sel},'entry':wp}
 sv(w,'GRAPH.json',dict(workshop=workshop,add=add,removed=drop,peers=peers,oldCommon=old,newCommon=new,currentEntry=y['gameEntry'].split('?')[0],currentProject=y['project'],protectedJoint=protected,protectedProfile=new4,protectedProfileBody=fact(rd(b,new4)),allFiveStage40Rows=True,onlyExactProfileAndCoastHelper=True,sha=fact(nb),base=P['head']))
def seal(w):
 b=w/'B';o=w/'out';c=json.loads(rd(o,'BROWSER.json'));g=json.loads(rd(o,'GRAPH.json'))
 need(c['status']=='PASS_STAGE33_2C4_NATIVE_RESTORE_RESAVE_AND_ART_PC_M' and set(c['workshop'])=={'A','B'} and set(c['coldResave'])=={'PC','M'},'all native phases and Workshop must pass')
 files={}
 with zipfile.ZipFile(o/'B-STAGE33-SAVE-HOTFIX-NO-DEPLOY.zip','x',compression=zipfile.ZIP_DEFLATED) as z:
  for k in sorted({*g['add'],S,F,M,'HONRO.html','HONRO_WORKSHOP.html','index.html'}):
   raw=rd(b,k);files[k]=pin(raw);z.writestr(k,raw)
 sv(w,'SEAL.json',dict(status=c['status'],base=P['head'],files=files,zip=pin(rd(o,'B-STAGE33-SAVE-HOTFIX-NO-DEPLOY.zip')),proof=pin(rd(o,'BROWSER.json')),graph=pin(rd(o,'GRAPH.json')),independentCompile=pin(rd(o,'COMPILED-LOCAL-SLOTS.json')),noDeploy=True))
if __name__=='__main__':{'pre':pre,'observe':observe,'seal':seal}[sys.argv[1]](Path(sys.argv[2]))
