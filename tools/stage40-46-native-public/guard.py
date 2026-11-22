"""Strictly read-only authority for native public save readback, disabled by default."""
import hashlib,io,json,os,re,stat,subprocess as sp,sys,urllib.request,zipfile
from pathlib import Path
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes());M='web/manifest.json'
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def f(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':f(b)}
def full(b):return {**fact(b),'git':hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()}
def git(r,*args):return sp.check_output(['git','-C',str(r),*args],timeout=120,text=True).strip()
def save(path,val):path.write_text(json.dumps(val,indent=2)+'\n')
def read(r,k):
 k=Path(k);p=r/k
 need(not k.is_absolute() and '..' not in k.parts and p.is_file() and not p.is_symlink() and p.resolve().is_relative_to(r.resolve()),'untrusted path '+str(k))
 return p.read_bytes()
def idx(rows):
 d={}
 for row in rows:
  k=row['path'];v={x:row[x]for x in ('bytes','sha256')}
  need(re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k)and type(v['bytes'])is int and v['bytes']>0 and re.fullmatch('[a-f0-9]{64}',v['sha256'])and(k not in d or d[k]==v),'conflicting URL registry '+k)
  d[k]=v
 return d
def reg(m):return idx([*m['files'],*m['previousFiles'],*sum(m['previousGenerations'],[]),*(x for g in m['publishedGenerations']for x in g['files'])])
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):raise RuntimeError('unexpected HTTP redirect')
def request(url,pin):
 q=urllib.request.Request(url,headers={'Accept-Encoding':'identity','User-Agent':'HOLLO official isolated anonymous QA'})
 with urllib.request.build_opener(NoRedirect()).open(q,timeout=45)as r:
  need(r.status==200 and r.geturl()==url and fact(r.read(pin['bytes']+1))==pin,'HTTP immutable mismatch '+url)
 return pin
def env(w):
 p=P['release'];n=P['workshopAuthority']
 need(P['enabled'] is True and all(p.values()) and all(n.values()),'DISABLED: exact union artifact and published release pins unsealed')
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve();h=os.environ['GITHUB_SHA'];base=P['head']
 need((os.environ.get('GITHUB_REPOSITORY'),os.environ.get('GITHUB_REF'),os.environ.get('GITHUB_EVENT_NAME'))==(P['repo'],P['qaRef'],'push'),'unexpected isolated QA event')
 need(w.parent==Path(os.environ['RUNNER_TEMP']).resolve() and w.name=='stage40-46-native-public-successor','unsafe temp root')
 scope={'.github/workflows/stage40-46-native-public.yml',*(str(D.relative_to(root)/k) for k in ('guard.py','capture.py','PINS.json','observer.json'))}
 need(git(root,'show','-s','--format=%P',h)==p['head'] and git(root,'show','-s','--format=%P',p['head'])==base,'released parent mismatch')
 need(git(root,'rev-parse',p['head']+'^{tree}')==p['tree'] and git(root,'rev-parse',base+'^{tree}')==P['tree'],'wrong release/baseline tree')
 need(not git(root,'status','--porcelain') and set(git(root,'diff','--name-status','--no-renames',p['head'],h).splitlines())=={'A\t'+k for k in scope},'wrong product parent or extra source changes')
 return root

def evidence(raw_before,raw_after,w):
 old=P['failedUnion'];new=P['workshopAuthority']
 def archive(z):
  ns=z.namelist();need(len(ns)==len(set(ns)) and all(not Path(k).is_absolute() and '..' not in Path(k).parts for k in ns) and sum(v.file_size for v in z.infolist())<90<<20 and z.testzip() is None,'unsafe or corrupt actual archive')
 need(fact(raw_before)=={k:old[k] for k in ('bytes','sha256')} and fact(raw_after)=={k:new[k] for k in ('bytes','sha256')},'wrong exact dual actual source ZIPs')
 with zipfile.ZipFile(io.BytesIO(raw_before)) as z, zipfile.ZipFile(io.BytesIO(raw_after)) as y:
  archive(z);archive(y);ld=lambda k:json.loads(z.read(k));yd=lambda k:json.loads(y.read(k))
  q0=ld('ACCEPTANCE.json');q=yd('ACCEPTANCE.json');cont=yd('CONTINUATION.json');recomputed=yd('R1-RECOMPUTED.json')
  g=ld('GRAPH.json');c=ld('B-NATIVE-CLOSURE.json');s=ld('BASE-AND-SOURCE.json')
  need(q0['status']=='HOLD' and len(q0['errors'])==1 and old['error'] in q0['errors'][0] and q['previousR1Errors']==q0['errors'],'original R1 must retain exact failure')
  need(cont['status']=='PASS_COMBINED_NO_REBUILD_R1_FAILED_WORKSHOP_TRANSPORT_ONLY' and cont['prior']==old and cont['r1RemainsFailed'] is True and cont['normalBuildRerun'] is False,'continuation did not explicitly accept only extra Workshop step')
  need(yd('PRIOR-R1-AUTHORITY.json')['checkout']==new['head'] and recomputed['source']==old and recomputed['completedHistoricalArms']==28 and recomputed['verifiedHistoricalPNG']==12 and recomputed['priorActualSavePairs']==4,'prior actual cases not recomputed')
  need(cont['graph']==fact(z.read('GRAPH.json')) and cont['custody']==fact(z.read('B-NATIVE-CLOSURE.zip')) and cont['combinedAcceptance']==fact(y.read('ACCEPTANCE.json')),'prior graph/closure/combined acceptance hashes differ')
  need(all(z.read(k)==y.read(k) for k in ('GRAPH.json','BASE-AND-SOURCE.json','B-NATIVE-CLOSURE.json','B-NATIVE-CLOSURE.zip')),'R3 rebuilt or changed any prior graph/custody bytes')
  need(q['status']=='NATIVE_EQUIVALENCE_TIMING_QUALIFIED' and q['rawSaveExported'] is q0['rawSaveExported'] is False and not q['errors'] and q['timing']==recomputed['timing'] and all(q[k]==q0[k] for k in ('trials','images','saves')),'prior native measurement or image/save evidence was replaced')
  need(set(q['workshop'])=={'A','B'} and q['workshop']==cont['workshop']==yd('WORKSHOP-OBSERVED.json') and all(x['status']=='OBSERVED' and x['stages']==50 and x['library']==1194 for x in q['workshop'].values()),'unqualified actual Workshop proof')
  need(set(q['images'])=={f'{d}-{s}' for d in P['devices'] for s in (11,40,46)} and all(fact(z.read(im['file']))==im['png'] for pairs in q['images'].values() for im in pairs.values()),'prior actual accepted PNG bytes missing')
  need(s['head']==old['head'] and s['base']==P['head'] and s['source']==P['source'],'exact pre-browser source scope changed')
  need(g['identicalCampaignSlots']==50 and g['ordered']['status']=='PASS_ONLY_FOUR_SIGNED_SOURCE_MODULES_AND_POINTERS' and c['shipAuthorized'] is False and c['retentionIncluded'] is False,'unqualified normal candidate identity')
  need(c['pathCount']==len(c['files'])==P['closureContract']['outputCount'] and sorted(c['oldActiveAliasesNotToRetireInProduct'])==P['closureContract']['stockActiveAliases'],'unqualified raw B closure')
  raw_b=z.read('B-NATIVE-CLOSURE.zip');need(fact(raw_b)==c['archive'],'raw approved B archive identity mismatch')
  with zipfile.ZipFile(io.BytesIO(raw_b)) as internal:
   archive(internal)
   need(sorted(internal.namelist())==sorted(c['files']) and all(full(internal.read(k))==v for k,v in c['files'].items()),'raw approved B material mismatch')
  save(w/'REFERENCE.json',{'nativeImages':q['images'],'nativeSaves':q['saves'],'workshop':q['workshop'],'graph':g,'closure':c})

def acquire(w):
 root=env(w);r=P['release'];n=P['workshopAuthority']
 def api(u):
  arg=['gh','api','repos/'+P['repo']+'/'+u]
  if u.endswith(('/logs','/zip')):arg.append('--allow-escape-sequences')
  return sp.check_output(arg,timeout=95)
 def j(u):return json.loads(api(u))
 pages=j('actions/runs/'+str(r['pagesRun']));pj=j('actions/jobs/'+str(r['pagesJob']));m=j('branches/master')
 need(pages['head_branch']=='master' and pages['head_sha']==pj['head_sha']==m['commit']['sha']==r['head'] and r['tree']==m['commit']['commit']['tree']['sha'],'wrong exact current public master')
 need(pages['status']==pj['status']=='completed' and pages['conclusion']==pj['conclusion']=='success' and pj['run_id']==r['pagesRun'] and pj['name']=='deploy','Pages exact deployment missing')
 logs=api('actions/jobs/'+str(r['pagesJob'])+'/logs');stamp=(r['pagesUTC']+' Reported success!').encode()
 if zipfile.is_zipfile(io.BytesIO(logs)):
  with zipfile.ZipFile(io.BytesIO(logs)) as q:
   need(sum(v.file_size for v in q.infolist())<20<<20 and q.testzip() is None and any(stamp in q.read(v) for v in q.infolist() if not v.is_dir()),'exact deployment timestamp not observed')
 else:need(stamp in logs,'exact deployment timestamp not observed')
 x=P['failedUnion']
 for authority,conclusion in ((x,'failure'),(n,'success')):
  re=j('actions/runs/'+str(authority['run']));job=j('actions/jobs/'+str(authority['job']));a=j('actions/artifacts/'+str(authority['artifact']))
  need(re['head_sha']==job['head_sha']==a['workflow_run']['head_sha']==authority['head'] and re['id']==job['run_id']==a['workflow_run']['id']==authority['run'] and re['status']==job['status']=='completed' and re['conclusion']==job['conclusion']==conclusion and not a['expired'] and a['name']==authority['name'] and a['digest']=='sha256:'+authority['sha256'] and a['size_in_bytes']==authority['bytes'],'wrong exact dual real browser authority')
 w.mkdir();(w/'out').mkdir()
 evidence(api('actions/artifacts/'+str(x['artifact'])+'/zip'),api('actions/artifacts/'+str(n['artifact'])+'/zip'),w)
 save(w/'out'/'AUTHORITY.json',{'released':r,'failedOriginalR1':x,'approvedWorkshopContinuationR3':n,'r1RemainsFailed':True,'sourceParent':P['head'],'noDeploy':True})

def prepare(w):
 root=env(w);need(not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')),'secret in anonymous verification')
 p=P['release'];r=json.loads(read(w,'REFERENCE.json'));g=r['graph'];c=r['closure']
 old=P['head'];git(root,'worktree','add','--detach',str(w/'A'),old)
 oa=read(w/'A',M);raw=read(root,M);need(full(oa)==P['manifest'] and full(raw)==p['manifest'],'wrong exactly pinned predecessor/current manifest bytes')
 released=json.loads(raw);orig=json.loads(oa);ja=idx(orig['files']);now=idx(released['files']);registry=reg(released);old_history=reg(orig)
 need(ja==g['a']['active'] and now==g['b']['active'],'active released graph not exact accepted normal B')
 nonhistory=lambda d:{k:v for k,v in d.items() if k not in ('previousFiles','previousGenerations','publishedGenerations','publishedRetention')}
 need(nonhistory(released)==nonhistory(g['b']['manifest']),'non-history generated route metadata drift')
 need(all(registry.get(k)==v and fact(read(root,k))==v for k,v in old_history.items()),'prior public immutable registry bytes were lost')
 expected={('A' if k in g['bonly'] else 'M')+'\t'+k for k in c['files']}
 need(set(git(root,'diff','--name-status','--no-renames',old,p['head']).splitlines())==expected,'deployed tree changed files outside exact normal closure')
 need(all(full(read(root,k))==v for k,v in c['files'].items() if k!=M),'published candidate current file bytes drift')
 for arm,where in [('a',w/'A'),('b',root)]:
  g[arm]['workshopShell']=fact(read(where,'HONRO_WORKSHOP.html'))
  need(fact(read(where,'HONRO.html'))==g[arm]['shell'] and g[arm]['workshopShell']==g['ordered']['workshopShell'][arm],'actual shell evidence drift')
 sample={M:fact(raw),**{k:registry[k] for k in P['closureContract']['stockActiveAliases']},**{k:now[k] for k in g['bonly']}}
 for k,v in sample.items():request(P['publicRoot']+k,v)
 save(w/'out'/'GRAPH-AND-ANONYMOUS-HTTP.json',{'active':len(now),'preservedHistoricalPaths':len(old_history),'oldAndNewAliasHTTP':sample})
 save(w/'REFERENCE.json',r)

if __name__=='__main__':
 {'acquire':acquire,'prepare':prepare}[sys.argv[1]](Path(sys.argv[2]).resolve())
