"""Disabled sealed combined assembly; no rebuild, no remote branch write, no publish."""
from datetime import datetime,timezone
from pathlib import Path
import hashlib,io,json,os,re,stat,subprocess as sp,sys,time,zipfile
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes());R=P['base'];Q=P['qa'];OLD=R['head']
M='web/manifest.json';F={'HONRO.html','HONRO_WORKSHOP.html','index.html',M}
SRC=set(P['inner']['author']['files']); ADD=set(P['candidateGraph']['newAliases']); MODIFY=SRC|F
KEEP={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
RETAINER='tools/release/retain-published-web.mjs'; POLICY='shared/web-retention.mjs'
FILES={'.github/workflows/stage40-46-save-compatible-writer.yml',*(f'tools/stage40-46-save-compatible-writer/{x}'for x in ('assemble.py','PINS.json','safe-push.sh'))}
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
def verified(files):
 scope=Q['archives'];z={}
 need(set(files)==set(scope),'five exact archives required')
 for k,a in scope.items():
  need(f(files[k])==a['fact'],'official outer integrity '+k);z[k]=zipped(files[k],a['members'],96<<20)
  need(all(f(z[k].read(t))==v for t,v in a['receipts'].items()),'official receipt integrity '+k)
 co=z['save']; s=o(co.read('SYSTEM-VERDICT.json'));gd=o(co.read('COMBINED-GRAPH.json'));src=o(co.read('SOURCE-UNION.json'))
 need(s['status']=='COMBINED_ACTUAL_40_AND_46_SAVES_AND_24_EXACT_PAIRS_NO_DEPLOY' and gd==P['candidateGraph'] and src['base']==OLD and src['changes']==P['exactSourceUnion'],'exact normal QA contract not met')
 compat=o(co.read('COMPAT-MODULES.json'));need(compat==gd['nativeCompatibility'] and compat['status']=='EXACT_COMPILED_PROFILE_AND_FOUR_ACT4_LINEAGES_ONLY','wrong stage-limited save modules')
 resume=o(co.read('RESUME.json'))
 need(resume['status']=='PASS_NATIVE_PERSISTED_733_AND_CURRENT_OLD_NEW_PC_M' and resume['publicExactManifest']=={k:R['manifest'][k]for k in ('bytes','sha256')},'wrong actual save authority')
 need(set(resume['runs'])==set(P['resume']) and set(resume['peerHTTP'])=={'21','32','33','42'} and all(set(v)=={'A','B'} and v['A']==v['B'] for r in resume['peerHTTP'].values() for v in r.values()),'changed peer served graph')
 for case,row in resume['runs'].items():
  st=case.split('-')[0];view=P['resume'][case]
  need(row['historical733']['refs']==view['old'] and row['candidateFresh']['refs']==view['new'] and not row['historical733']['errors'] and not row['candidateFresh']['errors'],'wrong archived or fresh native saved refs '+case)
  stock=row['currentStock733Resume'];need(stock['actual'] is True and stock['untouched'] is True,'invalid pristine restore control '+case)
  reasons={'wrongStage','wrongOrigin','wrongMode','custom','unofficial','unknownSignature','unknownID','atomicMalformedLater'}|({'wrongPlacement','noncanonical'} if st=='46' else set())
  need(row['malformedControlsRejected']=={k:True for k in reasons} and len(reasons)==view['negative'],'wrong stage negative control '+case)
  for n in ('historical733ColdB','candidateFreshColdB'):
   d=row[n];need(d['actualRestore'] is True and d['peer33RegistryExact'] is True and not d['errors'] and d['stateShas']==view['stateShas'] and d['refs']=={k:{'current':v,'rendered':[v,v]}for k,v in view['new'].items()},'wrong native cold restore '+case)
   need(f(co.read(d['raw']['path']))==d['raw']['png'],'unsealed restored native PNG '+case)
  need(row['historical733ColdB']['raw']['meta']==row['candidateFreshColdB']['raw']['meta'] and co.read(row['historical733ColdB']['raw']['path'])==co.read(row['candidateFreshColdB']['raw']['path']),'native cold raw difference '+case)
 A0=B0=None
 for k in ('40','46'):
  c=z[k];br=c.read('BROWSER.json');b=o(br);graph=o(c.read('GRAPH.json'))
  need(s['stages'][k]=={'pairedExact':12,'originalR2FoldedPoseStateExact':True,'browser':f(br)},'signed archived verdict drift '+k)
  need(b['status']=='PASS_FROZEN_PC_M_RGBA_EXACT_NO_DEPLOY' and b['browser']=='151.0.7922.34' and b['pairedRGBAExacts']==12 and not b['mismatches'] and len(b['views'])==4,'wrong actual browser '+k)
  a,bb=[graph[x]['active']for x in 'AB']
  need(graph['A']['manifest']=={q:R['manifest'][q]for q in ('bytes','sha256')} and len(a)==len(bb)==810 and len(a.keys()&bb.keys())==794,'wrong stock A')
  need(set(bb)-set(a)==ADD and set(a)-set(bb)==set(gd['oldAliases']) and all(a[x]==bb[x]for x in a.keys()&bb.keys()) and all(a[x]==bb[x]for x in gd['retainedStage21Stage33']),'wrong live protected alias registry')
  if A0 is None:A0=a;B0=bb
  else:need(a==A0 and bb==B0,'two actual programs differ')
  frameNames=set()
  for dev in ('1440x900','390x844'):
   a,d=[b['views'][x+'-'+dev]for x in 'AB']
   need(not a['networkErrors'] and not d['networkErrors'] and not a['pending'] and not d['pending'] and set(a['frames'])==set(d['frames']) and len(a['frames'])==3,'unqualified native proof')
   for name,w in a['frames'].items():
    u=d['frames'][name];need(all(w[k]==u[k]for k in ('meta','cssBox','timingPhase')) and w['meta']['phase']=='aim' and w['meta']['round']==1 and w['meta']['sceneTime']==2,'changed actual state')
    for t in ('raw','dom'):
     aa,bb=[row[t]for row in (w,u)];x,y=[c.read(v['path'])for v in (aa,bb)];frameNames.update([aa['path'],bb['path']])
     need(x==y and f(x)=={k:aa[k]for k in ('bytes','sha256')} and aa['sha256']==bb['sha256'] and aa['rgbaSHA256']==bb['rgbaSHA256'],'changed actual A/B PNG bytes')
  need(len(frameNames)==24,'native pose names reused')
 results={}
 for k,p in P['inner'].items():
  q=p['filename'];b=z[k].read(q)
  receipt=o(co.read(q+'.json'))
  need(receipt['exactNoDeploy'] and f(b)==receipt['zip']==p['archive'] and receipt['files']=={k:{j:v[j]for j in ('bytes','sha256')}for k,v in p['files'].items()},'wrong sealed bundle '+k)
  with zipped(b,p['files'],96<<20)as zz:
   result={n:zz.read(n)for n in p['files']}
   need(all(full(v)==p['files'][n]for n,v in result.items()),'wrong sealed member '+k)
  results[k]=result
 need(set(results['author'])==SRC and len(SRC)==8 and set(results['compiled'])==ADD|F and len(ADD)==16 and len(MODIFY)==12,'source/build file scope')
 need(all(f(v)==P['exactSourceUnion'][k]['B']for k,v in results['author'].items()),'authored hash doesn\'t match source receipt')
 return results['compiled'],results['author']
def env():
 need(P['enabled'] is True and isinstance(P['scopeApproval'],str) and P['scopeApproval'].strip(),'DISABLED until root reviews and expressly scopes assembly')
 need(P['releaseGate']['allowedToAssemble'] is True and P['releaseGate']['state']=='VERIFIED_ACTUAL_FORWARD_RESUME','HOLD: native pre-optimization in-battle restore is not allowed')
 need(P['releaseRef']=='refs/heads/release/act4-40-act5-46-lossless-save-compatible-20261122','unexpected authorized release target')
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve();head=os.environ['GITHUB_SHA']
 need((os.environ.get('GITHUB_REPOSITORY'),os.environ.get('GITHUB_REF'),os.environ.get('GITHUB_EVENT_NAME'))==(P['repo'],P['qaRef'],'push'),'wrong repository/event or scratch ref')
 need(git(root,'rev-list','--parents','-1','HEAD')==head+' '+OLD and git(root,'rev-parse',OLD+'^{tree}')==R['tree'],'wrong reviewed baseline')
 need(not git(root,'status','--porcelain') and all(git(root,'ls-tree',head,'--',k).startswith('100644 ')for k in FILES) and set(git(root,'diff','--no-renames','--name-status',OLD,head).splitlines())=={'A\t'+k for k in FILES},'unauthorized tracked edits')
 return root
def acquire(w):
 env()
 def api(name):return sp.check_output(['gh','api','repos/'+P['repo']+'/'+name],timeout=120)
 run=o(api('actions/runs/'+str(Q['run']))); job=o(api('actions/jobs/'+str(Q['job'])));cc=o(api('git/commits/'+Q['head']))
 need(run['head_sha']==job['head_sha']==Q['head'] and run['head_branch']==Q['branch'] and run['conclusion']==job['conclusion']=='success' and job['run_id']==Q['run'] and job['name']==Q['jobName'] and run['status']==job['status']=='completed' and cc['tree']['sha']==Q['tree'] and [p['sha']for p in cc['parents']]==[OLD],'wrong exact combined official QA authority')
 pages=o(api('actions/runs/'+str(R['pagesRun'])));d=o(api('actions/jobs/'+str(R['pagesJob'])));b=o(api('branches/master'))
 need(pages['name']=='pages build and deployment' and d['head_sha']==OLD and any(t['name']=='Deploy to GitHub Pages' and t['conclusion']=='success' for t in d['steps']),'wrong exact Pages deploy step')
 need(pages['head_sha']==b['commit']['sha']==OLD and pages['head_branch']=='master' and pages['conclusion']==d['conclusion']=='success' and d['run_id']==R['pagesRun'] and d['name']=='deploy','current live master changed')
 pr=R['actualReadback']; rr=o(api('actions/runs/'+str(pr['run']))); rj=o(api('actions/jobs/'+str(pr['job']))); rc=o(api('git/commits/'+pr['head']))
 need(rr['head_sha']==rj['head_sha']==pr['head'] and rr['conclusion']==rj['conclusion']=='success' and rj['run_id']==pr['run'] and rj['name']=='read-public' and [p['sha']for p in rc['parents']]==[OLD],'wrong exact anonymous 342 readback')
 logs=api('actions/jobs/'+str(R['pagesJob'])+'/logs')
 stamp=(R['publishedAt']+' Reported success!').encode()
 if zipfile.is_zipfile(io.BytesIO(logs)):
  with zipfile.ZipFile(io.BytesIO(logs))as l:
   need(l.testzip() is None and sum(e.file_size for e in l.infolist())<16<<20,'unexpected log archive')
   found=any(stamp in l.read(e)for e in l.infolist()if not e.is_dir())
 else:found=stamp in logs
 need(found,'wrong authoritative publication timestamp')
 w.mkdir();x={}
 for k,a in Q['archives'].items():
  z=str(a['id']);p=o(api('actions/artifacts/'+z))
  need(p['workflow_run']['id']==Q['run'] and p['workflow_run']['head_sha']==Q['head'] and p['name']==a['name'] and not p['expired'] and p['digest']=='sha256:'+a['fact']['sha256'] and p['size_in_bytes']==a['fact']['bytes'],'wrong authentic artifact metadata')
  x[k]=api('actions/artifacts/'+z+'/zip');need(f(x[k])==a['fact'],'actual archive SHA')
  (w/(k+'.zip')).write_bytes(x[k])
 verified(x)
def verified_native_compat(w):
 with zipped(read(w,'save.zip'),Q['archives']['save']['members'],96<<20)as z:
  return z.read('COMPAT-MODULES.json')
def select(b,old,incoming,now):
 code="""import fs from 'node:fs';import{graphSha256,selectPublishedGenerations}from './shared/web-retention.mjs';const a=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(selectPublishedGenerations([{...a.incoming,graphSha256:graphSha256(a.incoming.files)},...a.prior],{now:a.now})));"""
 return o(sp.check_output(['node','--input-type=module','-e',code],cwd=b,input=json.dumps({'prior':old,'incoming':incoming,'now':now}).encode(),timeout=60))
def assemble(w):
 need(not os.getenv('GH_TOKEN') and not os.getenv('GITHUB_TOKEN'),'no credentials in assembly')
 root=env();files,authors=verified({k:read(w,k+'.zip')for k in Q['archives']})
 b=w/'B';git(root,'worktree','add','--detach',str(b),OLD)
 need(not git(b,'status','--porcelain') and git(b,'rev-parse','HEAD^{tree}')==R['tree'],'not exact pristine local assembly')
 before=read(b,M); need(full(before)==R['manifest'] and g(read(b,RETAINER))==R['retainerGit'] and g(read(b,POLICY))==R['policyGit'],'retention code or released manifest mismatch')
 old,normal=o(before),o(files[M])
 for k in SRC:need(f(read(b,k))==P['exactSourceUnion'][k]['A'],'different exact author prerequisite '+k)
 oldreg=registry(old); active=idx(normal['files']);baseactive=idx(old['files'])
 need(len(oldreg)==R['registry'] and len(old['publishedGenerations'])==R['previousGraphs'] and len(active)==len(baseactive)==810 and not ADD&oldreg.keys(),'published registry or candidate shape wrong')
 need(set(active)-set(baseactive)==ADD and set(baseactive)-set(active)==set(P['candidateGraph']['oldAliases']) and all(oldreg[k]==active[k]for k in set(oldreg)&set(active)),'non-target immutable route moved')
 need(all(f(read(b,k))==v for k,v in oldreg.items()),'broken prior immutable absolute URL bytes')
 checkproject,forward=o(read(b,old['project'])),o(files[normal['project']])
 candidate=json.loads(json.dumps(checkproject))
 for i in (39,45):candidate['stageLibraries'][i]=forward['stageLibraries'][i]
 need(candidate==forward and checkproject['stages']==forward['stages'] and len(forward['stages'])==50,'campaign outside two slots changed')
 wa,wb=[P['candidateGraph']['verifiedStructuralAdaptersOnly'][k]for k in ('old','new')]; cv=old['common'].copy()
 need(cv[56]==wa and cv.count(wa)==1 and old['gameOnly']==normal['gameOnly'],'runtime order mismatch')
 a=read(b,wa);need(a.count(old['project'].encode())==1 and a.replace(old['project'].encode(),normal['project'].encode())==files[wb],'unexpected adapter source change')
 cv[56]=wb
 kc=P['candidateGraph']['nativeCompatibility'];need(kc==o(verified_native_compat(w)),'compiled compatibility receipt differs')
 # Sealed native common-order proof: these module suffixes are not list indices.
 for i,aa,bb in zip((47,55),kc['oldModules'],kc['newModules']):
  need(cv[i]==aa and cv.count(aa)==1 and bb in ADD and f(read(b,aa))==baseactive[aa] and f(files[bb])==active[bb],'unexpected compatibility module identity '+str(i))
  cv[i]=bb
 need(cv==normal['common'],'unexpected renderer alias moved')
 need(OLD not in {x['sourceSha']for x in old['publishedGenerations']},'duplicate release provenance')
 merged={**normal,**{k:old[k]for k in KEEP}}
 prev={q['path']for q in old['previousFiles']};merged['previousFiles']=[*old['previousFiles'],*(dict(path=k,**v)for k,v in oldreg.items()if k not in active and k not in prev)]
 union={**oldreg,**{k:active[k]for k in ADD}};need(registry(merged)==union and len(union)==R['registry']+len(ADD),'old URL registry not preserved')
 for k,v in {**files,**authors}.items():
  p=b/k;need(p.parent.resolve().is_relative_to(b) and not p.is_symlink() and p.exists()==(k in MODIFY),'unsafe release write path '+k)
  p.write_bytes(v)
 save(b/M,merged)
 evidence=f"https://github.com/sys8994/honro/actions/runs/{R['pagesRun']}"
 incoming={'sourceSha':OLD,'publishedAt':R['publishedAt'],'publishedAtPrecision':'instant','publicationOrder':0,'evidence':evidence,'files':old['files']}
 before_ms=int(time.time()*1000)
 r=o(sp.check_output(['node',RETAINER,OLD,'--published-at',R['publishedAt'],'--evidence',evidence],cwd=b,timeout=180))
 after_ms=int(time.time()*1000);final=o(read(b,M))
 need(r['restored']==[] and r['restoredBytes']==0,'official retainer unexpectedly restores files')
 need(final['publishedGenerations']==select(b,old['publishedGenerations'],incoming,before_ms)==select(b,old['publishedGenerations'],incoming,after_ms),'official wall-clock retention policy differed')
 oldgen={x['sourceSha']:x for x in old['publishedGenerations']};newgen={x['sourceSha']:x for x in final['publishedGenerations']}
 need(newgen[OLD]['publishedAt']==R['publishedAt'] and newgen[OLD]['files']==old['files'] and all(oldgen[k]==newgen[k]for k in oldgen.keys()&newgen.keys()),'changed old published graph or invalid timestamp')
 need(registry(final)==union and idx(final['files'])==active and final['publishedRetention']==old['publishedRetention'] and all(f(read(b,k))==v for k,v in union.items()),'immutable bytes or active altered after retain')
 need({k:v for k,v in final.items()if k not in KEEP}=={k:v for k,v in normal.items()if k not in KEEP} and all(read(b,k)==v for k,v in files.items()if k!=M),'retainer changed candidate app payload')
 git(b,'add','--',*sorted(ADD|MODIFY));diff=set(git(b,'diff','--cached','--name-status','--no-renames',OLD).splitlines())
 need(diff=={'M\t'+k for k in MODIFY}|{'A\t'+k for k in ADD} and not git(b,'ls-files','--others','--exclude-standard') and not git(b,'diff','--name-only'),'tree staging scope changed')
 for k in ADD|MODIFY:need(git(b,'ls-files','--stage','--',k).split()[:3]==['100644',g(read(b,k)),'0'],'staged exact bytes mismatch')
 tree=git(b,'write-tree');out={'status':'EXACT_DERIVED_LOCAL_TREE_NO_PUSH_NO_DEPLOY','candidateTree':tree,'parent':OLD,'approvalScope':P['scopeApproval'],'oldImmutableCount':len(oldreg),'newImmutableCount':len(union),'previousGraphs':len(oldgen),'retainedGraphs':len(newgen),'graphMetadataExpired':sorted(set(oldgen)-set(newgen)),'retentionWallClockUTC':[datetime.fromtimestamp(m/1000,timezone.utc).isoformat()for m in (before_ms,after_ms)],'manifest':full(read(b,M)),'add':sorted(ADD),'modify':sorted(MODIFY),'sourceAndCompiled':{k:full(read(b,k))for k in sorted(ADD|MODIFY)}}
 save(w/'ASSEMBLY.json',out);print(json.dumps(out))
if __name__=='__main__':
 command=sys.argv[1]
 if command=='verify':
  files,src=verified(dict(zip(Q['archives'],[read(Path(sys.argv[2]),k+'.zip')for k in Q['archives']])))
  print(json.dumps({'status':'VERIFIED_ARCHIVES_ONLY','sourceCount':len(src),'builtCount':len(files),'add':len(ADD),'modify':len(MODIFY)},indent=2))
 else:
  q=Path(sys.argv[2]).resolve();need(q.parent==Path(os.environ['RUNNER_TEMP']).resolve() and q.name=='stage40-46-save-release-checkpoint','untrusted runner path')
  {'acquire':acquire,'assemble':assemble}[command](q)
