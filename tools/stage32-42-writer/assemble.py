"""No rebuild, exact success-only archive and guarded frozen assembly. Disabled until root binds scope."""
from datetime import datetime,timezone
from pathlib import Path
import hashlib,io,json,os,re,stat,subprocess as sp,sys,time,zipfile
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes());R=P['base'];Q=P['normalQA'];OLD=R['head']
M='web/manifest.json';F={'HONRO.html','HONRO_WORKSHOP.html','index.html',M}
SRC=set(R['sources']); MODIFY=SRC|F
KEEP={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
RETAINER='tools/release/retain-published-web.mjs'; POLICY='shared/web-retention.mjs'
FILES={'.github/workflows/stage32-42-writer.yml',*(f'tools/stage32-42-writer/{x}'for x in ('assemble.py','PINS.json','safe-push.sh'))}
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def h(b):return hashlib.sha256(b).hexdigest()
def f(b):return {'bytes':len(b),'sha256':h(b)}
def g(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def full(b):return {**f(b),'git':g(b)}
def o(b):
 def strict(p):
  d=dict(p);need(len(d)==len(p),'duplicate JSON keys');return d
 return json.loads(b,object_pairs_hook=strict)
def save(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def git(p,*x):return sp.check_output(['git','-C',str(p),*x],timeout=120,text=True).strip()
def read(p,k):
 k=Path(k);q=p/k
 need(not k.is_absolute() and '..' not in k.parts and q.is_file() and not q.is_symlink() and q.resolve().is_relative_to(p.resolve()),'unsafe path '+str(k));return q.read_bytes()
def idx(rows):
 d={}
 for x in rows:
  k=x['path'];m={p:x[p]for p in ('bytes','sha256')}
  need(re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k) and type(m['bytes'])is int and m['bytes']>0 and re.fullmatch('[0-9a-f]{64}',m['sha256']) and(k not in d or d[k]==m),'unsafe or conflicting registered immutable')
  d[k]=m
 return d
def registry(m):
 return idx([*m['files'],*m['previousFiles'],*sum(m['previousGenerations'],[]),*(x for gen in m['publishedGenerations']for x in gen['files'])])
def zipped(b,expect,limit):
 z=zipfile.ZipFile(io.BytesIO(b));v=z.infolist()
 need(len(v)==len(expect) and {x.filename for x in v}==set(expect) and sum(x.file_size for x in v)<limit,'unexpected/missing archive members')
 need(all(not x.is_dir() and x.file_size>0 and x.compress_type in (0,8) and stat.S_IFMT(x.external_attr>>16) in (0,stat.S_IFREG) for x in v),'unsupported archive entry')
 need(z.testzip() is None,'archive CRC error')
 return z
def verified(raw):
 need(f(raw)==Q['fact'],'official outer archive hash')
 with zipped(raw,Q['members'],100_000_000)as z:
  need(all(f(z.read(k))==v for k,v in Q['receipts'].items()),'official candidate evidence receipts')
  def load(k):return o(z.read(k))
  c=load('out/OUTPUT-CUSTODY.json')
  d=load('out/ACTIVE-DELTA.json')
  proof=load('out/BROWSER.json')
  r=load('out/RESUME-40-46.json')
  w=load('out/WORKSHOP.json')
  pic=load('stage42/out/BROWSER.json')
  save42=load('stage42/out/RESUME.json')
  scoped=load('out/BUILT-SCOPE.json')
  need(c['status']=='QA_REVIEW_ONLY_NO_DEPLOY' and not c['published'] and c['sourceHead']==OLD and c['runHead']==Q['head'],'official custody wrong scope')
  need(all(f(z.read(k))==v for k,v in c['proofs'].items()),'native evidence proof edge changed')
  need(proof['status']=='PASS_ACTUAL_NORMAL_NEW_AND_SCOPED_OLD_SAVE_NO_DEPLOY' and len(proof['cases'])==9 and proof['cases']['untouched-c60-stage33-continue']['status']=='PASS','wrong Stage32 or historical Stage33 run')
  checks={'normal-1440x900-A':(7999873,0),'normal-1440x900-B':(4780398,0),'normal-390x844-A':(7999873,0),'normal-390x844-B':(4780398,0),'current-save':(4780398,0),'invalid-before-archive':(4780398,0),'old-save-continue-and-resave':(4780398,1)}
  need(all((proof['cases'][k]['stageAssetsWire'],proof['cases'][k]['archiveGETs'])==v and not proof['cases'][k]['errors']for k,v in checks.items()),'archive lazy path did not meet exact real Win/restore gates')
  need(w['status']=='PASS_ACTUAL_WORKSHOP_FULL_ORIGINAL_AND_ORDER' and w['scopes']['A']['libraryIds']==w['scopes']['B']['libraryIds'] and len(w['scopes']['A']['libraryIds'])==1193 and len(w['scopes']['A']['mapIds'])==50 and w['scopes']['A']['mapIds']==w['scopes']['B']['mapIds'] and [w['scopes'][k]['normalArchiveGETs']for k in 'AB']==[0,1],'Workshop active full fixture not verified')
  need(r['status']=='PASS_NATIVE_PERSISTED_733_AND_CURRENT_OLD_NEW_PC_M' and set(r['runs'])=={'40-PC','40-M','46-PC','46-M'} and r['publicExactManifest']=={k:R['manifest'][k]for k in ('bytes','sha256')},'wrong exact peers or public authority')
  for k,row in r['runs'].items():
   need(row['currentStock733Resume']['actual'] and row['currentStock733Resume']['untouched'] and all(row['malformedControlsRejected'].values()) and all(row[x]['actualRestore'] and row[x]['peer33RegistryExact'] and not row[x]['errors']for x in ('historical733ColdB','candidateFreshColdB')),'wrong peer signed path '+k)
  need(pic['status']=='PASS_STAGE42_ACTUAL_SCOPED_OPTIMIZATION_NO_DEPLOY' and len(pic['comparisons'])==8 and sum(x['changed']for x in pic['comparisons'])==4 and all(x['outside']==x['alpha']==0 and x['maxDN']<=1 for x in pic['comparisons']) and save42['status']=='PASS_ACTUAL_STAGE42_OLD_CURRENT_COLD_RESUME_PC_M_NO_DEPLOY','wrong Stage42 reviewed stationary/cold fixture')
  need(scoped['allOther48StagePacketsAndAll50MapsByteExact'] and scoped['stage33ExistingCompatAndCurrentAStrict'] and d['activeBefore']==810 and d['activeAfter']==811 and len(d['newActive'])==96 and len(d['retiredActive'])==95,'wrong normalized active graph')
  data=z.read('out/B-REVIEW-ONLY.zip')
  need(f(data)==Q['innerFact']==c['compiledArchive'] and c['candidateManifest']==Q['candidateManifest'],'candidate artifact named scope')
  with zipped(data,c['packageFiles'],50_000_000)as zz:
   parts={p:zz.read(p)for p in c['packageFiles']}
  need(set(parts)==SRC|F|set(d['newActive']) and len(parts)==Q['innerMembers']==104 and all(full(v)==c['packageFiles'][p] for p,v in parts.items()) and full(parts[M])==c['candidateManifest'],'narrow candidate file bytes or member scope')
  need(all(c['packageFiles'][p]==load('out/SOURCE-JOINT.json')[p] for p in SRC),'qualified source scope changed')
  return parts,d,load('out/GRAPH.json')
def env():
 need(P['enabled'] is True and bool(P['scopeApproval']) and P['destinationMustBeAtBase'] is True,'DISABLED until root reviews exact scope')
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve();head=os.environ['GITHUB_SHA']
 need((os.environ.get('GITHUB_REPOSITORY'),os.environ.get('GITHUB_REF'),os.environ.get('GITHUB_EVENT_NAME'))==(P['repo'],P['qaRef'],'push'),'wrong repo/event/QA branch')
 need(git(root,'rev-list','--parents','-1','HEAD')==head+' '+OLD and git(root,'rev-parse',OLD+'^{tree}')==R['tree'],'wrong released sole parent')
 need(not git(root,'status','--porcelain') and set(git(root,'diff','--no-renames','--name-status',OLD,head).splitlines())=={'A\t'+k for k in FILES},'unexpected staged writer edits')
 return root
def acquire(w):
 env()
 def api(p):return sp.check_output(['gh','api','repos/'+P['repo']+'/'+p],timeout=120)
 ri=o(api('actions/runs/'+str(Q['run'])));ji=o(api('actions/jobs/'+str(Q['job'])));c=o(api('git/commits/'+Q['head']))
 need(ri['head_sha']==ji['head_sha']==Q['head'] and ri['head_branch']==Q['branch'] and ji['run_id']==Q['run'] and ri['status']==ji['status']=='completed' and ri['conclusion']==ji['conclusion']=='success' and c['tree']['sha']==Q['tree'] and [x['sha']for x in c['parents']]==[OLD],'unverified QA authority')
 p=o(api('actions/runs/'+str(R['pages'])));j=o(api('actions/jobs/'+str(R['job'])));b=o(api('branches/master'))
 need(p['head_sha']==j['head_sha']==b['commit']['sha']==OLD and p['head_branch']=='master' and p['conclusion']==j['conclusion']=='success' and j['run_id']==R['pages'] and any(q['name']=='Deploy to GitHub Pages' and q['conclusion']=='success' for q in j['steps']),'wrong exact Pages fixed 72dd')
 logs=api('actions/jobs/'+str(R['job'])+'/logs');stamp=(R['publishedAt']+' Reported success!').encode()
 if zipfile.is_zipfile(io.BytesIO(logs)):
  with zipfile.ZipFile(io.BytesIO(logs))as l:
   need(l.testzip() is None and sum(e.file_size for e in l.infolist())<16<<20,'unexpected log archive')
   found=any(stamp in l.read(e)for e in l.infolist()if not e.is_dir())
 else:found=stamp in logs
 need(found,'exact Pages success moment mismatch')
 n=str(Q['artifact']);a=o(api('actions/artifacts/'+n))
 need(a['workflow_run']['id']==Q['run'] and a['workflow_run']['head_sha']==Q['head'] and a['name']==Q['artifactName'] and not a['expired'] and a['digest']=='sha256:'+Q['fact']['sha256'] and a['size_in_bytes']==Q['fact']['bytes'],'wrong official artifact metadata')
 raw=api('actions/artifacts/'+n+'/zip');verified(raw);w.mkdir();(w/'joint.zip').write_bytes(raw)
def select(b,old,incoming,now):
 code="""import fs from 'node:fs';import{graphSha256,selectPublishedGenerations}from './shared/web-retention.mjs';const a=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(selectPublishedGenerations([{...a.incoming,graphSha256:graphSha256(a.incoming.files)},...a.prior],{now:a.now})));"""
 return o(sp.check_output(['node','--input-type=module','-e',code],cwd=b,input=json.dumps({'prior':old,'incoming':incoming,'now':now}).encode(),timeout=60))
def assemble(w):
 root=env();need(not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')),'no checkout token in assembly env')
 parts,d,native=verified(read(w,'joint.zip'))
 b=w/'B';git(root,'worktree','add','--detach',str(b),OLD)
 need(not git(b,'status','--porcelain') and git(b,'rev-parse','HEAD^{tree}')==R['tree'],'nonpristine assembly stage')
 before=read(b,M)
 need(full(before)==R['manifest'] and g(read(b,RETAINER))==R['retainerGit'] and g(read(b,POLICY))==R['policyGit'],'official retention code mismatch')
 need(all(g(read(b,k))==v for k,v in R['sources'].items()),'four exact prior author pins changed')
 old,normal=o(before),o(parts[M])
 oldreg=registry(old);active=idx(normal['files']);baseactive=idx(old['files'])
 diff=set(active)-set(baseactive)
 need(len(oldreg)==R['registry'] and len(old['publishedGenerations'])==R['publishedGenerations'] and len(active)==len(baseactive)+1 and diff==set(d['newActive']) and set(baseactive)-set(active)==set(d['retiredActive']),'wrong exact old/new live graph')
 need(all(f(read(b,k))==v for k,v in oldreg.items()),'historical immutable URL bytes changed')
 need(all(oldreg[k]==active[k]for k in set(oldreg)&set(active)),'existing immutable path identity changed')
 ca,cb=o(read(b,old['project'])),o(parts[normal['project']]);rec=json.loads(json.dumps(cb))
 for key in ('stageLibraries','assetPaths'):
  if key=='stageLibraries':
   for j in (31,41):rec[key][j]=ca[key][j]
  else:rec[key]['stageLibraries'][31]=ca[key]['stageLibraries'][31]
 for k in (rec,rec['assetPaths'],rec['assetEncodings']):del k['compatibility32']
 need(rec==ca and len(ca['stages'])==50 and all(k in active and active[k]==baseactive[k]for k in ca['stages']),'ordinary maps/unrelated route changed')
 for x in ('A','B'):need(native[x]['project']==[old,normal][x=='B']['project'],'custody actual runtime project mismatch')
 need(all(k in active and f(parts[k])==active[k] for k in diff),'included active body hash differs')
 add=diff-set(oldreg)
 # Previous published asset URL bytes are never removed. The compiled active graph is not recomposed.
 need(OLD not in {x['sourceSha']for x in old['publishedGenerations']},'prior retained provenance already exists')
 merged={**normal,**{k:old[k]for k in KEEP}}
 prev={r['path']for r in old['previousFiles']}
 merged['previousFiles']=[*old['previousFiles'],*(dict(path=k,**v)for k,v in oldreg.items()if k not in active and k not in prev)]
 union={**oldreg,**{k:active[k]for k in add}}
 need(registry(merged)==union,'historical URL registry not preserved')
 for k,v in parts.items():
  p=b/k
  need(p.parent.resolve().is_relative_to(b) and not p.is_symlink(),'unsafe named candidate path')
  if k in MODIFY or k in add:
   need(p.exists()==(k in MODIFY),'stale or missing exact path '+k)
   p.write_bytes(v)
  else:need(read(b,k)==v,'candidate already published path bytes differ '+k)
 save(b/M,merged)
 evidence=f"https://github.com/sys8994/honro/actions/runs/{R['pages']}"
 incoming={'sourceSha':OLD,'publishedAt':R['publishedAt'],'publishedAtPrecision':'instant','publicationOrder':0,'evidence':evidence,'files':old['files']}
 before_ms=int(time.time()*1000)
 rt=o(sp.check_output(['node',RETAINER,OLD,'--published-at',R['publishedAt'],'--evidence',evidence],cwd=b,timeout=180))
 after_ms=int(time.time()*1000);final=o(read(b,M))
 need(rt['restored']==[] and rt['restoredBytes']==0,'previous asset restoration unexpected')
 need(final['publishedGenerations']==select(b,old['publishedGenerations'],incoming,before_ms)==select(b,old['publishedGenerations'],incoming,after_ms),'official retention window drift')
 oldg={x['sourceSha']:x for x in old['publishedGenerations']};newg={x['sourceSha']:x for x in final['publishedGenerations']}
 need(newg[OLD]['publishedAt']==R['publishedAt'] and newg[OLD]['files']==old['files'] and all(oldg[k]==newg[k]for k in oldg.keys()&newg.keys()),'published archive authority mismatch')
 need(registry(final)==union and final['publishedRetention']==old['publishedRetention'] and all(f(read(b,k))==v for k,v in union.items()),'bad published immutable route closure')
 need({k:v for k,v in final.items()if k not in KEEP}=={k:v for k,v in normal.items()if k not in KEEP} and all(read(b,k)==v for k,v in parts.items()if k!=M),'official retention changed reviewed active data')
 git(b,'add','--',*sorted(MODIFY|add));changes=set(git(b,'diff','--cached','--name-status','--no-renames',OLD).splitlines())
 # A generated stable shell is only staged if actually different; no unrelated mode/byte stamped.
 typ={k for k in MODIFY if read(b,k)!=sp.check_output(['git','-C',str(b),'show',OLD+':'+k],timeout=90)}
 need(SRC|{M}<=typ and changes=={'M\t'+k for k in typ}|{'A\t'+k for k in add} and not git(b,'ls-files','--others','--exclude-standard') and not git(b,'diff','--name-only'),'dirty exact release scope')
 need(all(git(b,'ls-files','--stage','--',k).split()[:3]==['100644',g(read(b,k)),'0'] for k in add|typ),'staged original bytes mismatch')
 tree=git(b,'write-tree')
 report={'status':'EXACT_DERIVED_LOCAL_TREE_NO_PUSH_NO_DEPLOY','candidateTree':tree,'parent':OLD,'manifest':full(read(b,M)),'add':sorted(add),'modify':sorted(typ),'oldUrls':len(oldreg),'preservedUrls':len(union),'publishedGenerations':len(newg),'expiredMetadata':sorted(set(oldg)-set(newg)),'candidateRawManifest':Q['candidateManifest'],'files':{k:full(read(b,k))for k in sorted(add|typ)},'reviewedRun':Q['run']}
 save(w/'ASSEMBLY.json',report);print(json.dumps({k:v for k,v in report.items()if k not in ('files','add','modify')}))
if __name__=='__main__':
 act=sys.argv[1]
 if act=='local-verify':
  v,d,_=verified(Path(sys.argv[2]).read_bytes());print(json.dumps({'status':'EXACT_LOCAL_ARCHIVE_VERIFIED','files':len(v),'newActive':len(d['newActive']),'manifest':full(v[M])}))
 else:
  w=Path(sys.argv[2]).resolve();need(w.parent==Path(os.environ['RUNNER_TEMP']).resolve() and w.name=='stage32-42-qualified-checkpoint','unauthorized runner path')
  {'acquire':acquire,'assemble':assemble}[act](w)
