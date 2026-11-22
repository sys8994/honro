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
def evidence(raw,w=None):
 q=P['approved'];need(fact(raw)==q['fact'],'wrong official SAVE ZIP')
 with zipfile.ZipFile(io.BytesIO(raw))as z:
  names=z.infolist()
  need(set(q['members'])==set(z.namelist()) and len(names)==len(q['members']) and sum(x.file_size for x in names)<20<<20,'archive immutable member scope')
  need(all(not x.is_dir() and x.file_size>0 and stat.S_IFMT(x.external_attr>>16)in(0,stat.S_IFREG) and x.compress_type in (0,8) for x in names) and z.testzip()is None,'bad ZIP member or CRC')
  need(all(fact(z.read(k))==v for k,v in q['receipts'].items()),'claimed original official receipt different')
  x=json.loads(z.read('RESUME.json'));g=json.loads(z.read('RESUME-ROUTES.json'))
  verdict=json.loads(z.read('SYSTEM-VERDICT.json'));compat=json.loads(z.read('COMPAT-MODULES.json'));cg=json.loads(z.read('COMBINED-GRAPH.json'))
  need(x['status']=='PASS_NATIVE_PERSISTED_733_AND_CURRENT_OLD_NEW_PC_M' and verdict['status']=='COMBINED_ACTUAL_40_AND_46_SAVES_AND_24_EXACT_PAIRS_NO_DEPLOY','verified old native receipt missing')
  need(compat['verifiedUnchangedStage33']==P['stageOrder'] and cg['active']==810 and cg['sourceMapFilesExact']==50 and cg['newAliases']==P['newAliases'] and cg['oldAliases']==P['oldAliases'],'approved normal graph did not preserve required fields')
  need(set(x['runs'])==set(P['savePins']) and set(g)=={'A','B','H'},'approved run coverage')
  valid={}
  for k,s in x['runs'].items():
   expected=P['savePins'][k];a,b=[s[l]for l in ('historical733ColdB','candidateFreshColdB')]
   need(s['historical733']['refs']==expected['old'] and s['candidateFresh']['refs']==expected['new'] and a['raw']['meta']==b['raw']['meta'] and a['raw']['png']==b['raw']['png'] and a['stateShas']==b['stateShas']==expected['stateShas'] and all(v is True for v in s['malformedControlsRejected'].values()),'archived restore benchmark drift '+k)
   need(a['actualRestore'] is True and b['actualRestore'] is True and a['peer33RegistryExact'] is True and b['peer33RegistryExact'] is True,'archived test was not actually restored '+k)
   need(fact(z.read(a['raw']['path']))==a['raw']['png'] and fact(z.read(b['raw']['path']))==b['raw']['png'],'approved actual PNG stale')
   valid[k]={q:a['raw'][q]for q in ('png','meta')}
  if w is not None:
   save(w/'REFERENCE.json',{'routes':{'H':g['H'],'J':g['A'],'P':g['B']},'native':valid,'rawSource':'verified official normal browser archive '+str(P['approved']['id'])})
  return valid
def env(w):
 r=P['release'];need(P['enabled'] is True and r['head']==P['candidateHead'] and r['tree']==P['candidateTree'] and all(type(r[k])is int and r[k]>0 for k in ('pagesRun','pagesJob')) and re.fullmatch(r'2026-11-22T\d\d:\d\d:\d\d(?:\.\d+)?Z',r['pagesUTC']or''),'DISABLED until exact public successor Pages pins')
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve();h=os.environ['GITHUB_SHA']
 need((os.environ.get('GITHUB_REPOSITORY'),os.environ.get('GITHUB_REF'),os.environ.get('GITHUB_EVENT_NAME'))==(P['repo'],P['qaRef'],'push'),'unexpected isolated event')
 need(w.parent==Path(os.environ['RUNNER_TEMP']).resolve() and w.name=='stage40-46-native-public','unsafe temp root')
 scope={'.github/workflows/stage40-46-save-public.yml',*(str(D.relative_to(root)/k)for k in ('guard.py','capture.py','PINS.json','observer.json'))}
 need(git(root,'show','-s','--format=%P',h)==r['head'] and git(root,'rev-parse',r['head']+'^{tree}')==r['tree'] and not git(root,'status','--porcelain') and set(git(root,'diff','--name-status','--no-renames',r['head'],h).splitlines())=={'A\t'+k for k in scope},'wrong product parent or extra source changes')
 return root
def acquire(w):
 env(w);r=P['release'];a=P['approved'];q=P['normalAuthority']
 def api(u):return sp.check_output(['gh','api','repos/'+P['repo']+'/'+u],timeout=100)
 def j(s):return json.loads(api(s))
 pages=j('actions/runs/'+str(r['pagesRun']));job=j('actions/jobs/'+str(r['pagesJob']));master=j('branches/master');ref=j('branches/'+P['releaseRef'].removeprefix('refs/heads/'))
 need(pages['name']=='pages build and deployment' and pages['head_branch']=='master' and pages['head_sha']==job['head_sha']==master['commit']['sha']==ref['commit']['sha']==r['head'] and r['tree']==master['commit']['commit']['tree']['sha'] and pages['conclusion']==job['conclusion']=='success' and job['run_id']==r['pagesRun'] and job['name']=='deploy','exact published master authority missing')
 stamp=(r['pagesUTC']+' Reported success!').encode();logs=api('actions/jobs/'+str(r['pagesJob'])+'/logs')
 if zipfile.is_zipfile(io.BytesIO(logs)):
  with zipfile.ZipFile(io.BytesIO(logs))as k:
   need(k.testzip()is None and sum(e.file_size for e in k.infolist())<16<<20,'bad Pages logs')
   published=any(stamp in k.read(x) for x in k.infolist()if not x.is_dir())
 else:published=stamp in logs
 need(published,'wrong exact Pages deployment UTC')
 normal=j('actions/runs/'+str(q['run']));nj=j('actions/jobs/'+str(q['job']));ac=j('actions/artifacts/'+str(a['id']))
 need(normal['head_sha']==nj['head_sha']==q['head'] and nj['run_id']==q['run'] and normal['conclusion']==nj['conclusion']=='success' and normal['head_branch']==q['branch'] and ac['workflow_run']['id']==q['run'] and ac['workflow_run']['head_sha']==q['head'] and not ac['expired'] and ac['name']==a['name'] and ac['digest']=='sha256:'+a['fact']['sha256'] and ac['size_in_bytes']==a['fact']['bytes'],'wrong official browser artifact')
 raw=api('actions/artifacts/'+str(a['id'])+'/zip')
 w.mkdir();(w/'out').mkdir();evidence(raw,w)
 save(w/'out'/'AUTHORITY.json',{'status':'EXACT_ANONYMOUS_RELEASE_AUTHORITY','release':r,'normal':q,'archived':a['fact'],'artifact':a['id']})
def prepare(w):
 repo=env(w);need(not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'credential in anonymous prep')
 r=P['release'];old=P['baseJ']['head'];scope={v+'\t'+k for k,v in P['expectedChanged'].items()}
 need(git(repo,'show','-s','--format=%P',r['head'])==old and set(git(repo,'diff','--name-status','--no-renames',old,r['head']).splitlines())==scope and all(full(read(repo,k))==v for k,v in P['exactWrites'].items()),'published source/candidate tree differs')
 raw=read(repo,M);need(full(raw)==P['finalManifest'],'retained manifest differs');cur=json.loads(raw);active=idx(cur['files']);registry=reg(cur); pub={q['sourceSha']:q for q in cur['publishedGenerations']}
 d=json.loads(read(w,'REFERENCE.json'));g=d['routes'];out=w/'out'
 for arm,pin in [('H',P['baseH']),('J',P['baseJ'])]:
  h=pin['head'];need(git(repo,'rev-parse',h+'^{tree}')==pin['tree'] and h in pub,'historic release not preserved')
  e=w/arm;git(repo,'worktree','add','--detach',str(e),h)
  b=read(e,M);need(fact(b)=={k:pin['manifest'][k]for k in ('bytes','sha256')} and fact(b)==g[arm]['manifest'] and fact(read(e,'HONRO.html'))==g[arm]['shell'],'historic compiled artifact differs '+arm)
  graph=idx(json.loads(b)['files']);past=idx(pub[h]['files']);need(graph==past,'historical graph metadata differs '+arm)
  for st,routes in g[arm]['routes'].items():
   need(all(graph[k]==registry[k]==v==fact(read(e,k))for k,v in routes.items()),'not exact historical assets '+arm+' '+st)
 j=json.loads(read(w/'J',M));ja=idx(j['files']);jr=reg(j)
 need(len(pub)==P['publishedGraphs'] and len(registry)==P['registry'] and len(active)==len(ja)==P['active'] and set(active)-set(ja)==set(P['newAliases']) and set(ja)-set(active)==set(P['oldAliases']) and all(active[k]==ja[k]for k in active.keys()&ja.keys()) and all(registry[k]==v==fact(read(repo,k)) for k,v in jr.items()),'retained history or unchanged active graph drift')
 need(fact(read(repo,'HONRO.html'))==g['P']['shell'] and all(active[k]==fact(read(repo,k))==v for s in g['P']['routes'].values() for k,v in s.items()),'published candidate graph/entry does not match normal B')
 for k in ('21','32','33','42'):need(g['P']['routes'][k]==g['J']['routes'][k],'peer immutable route changed '+k)
 g['P']['manifest']=fact(raw)
 sites={k:ja[k]for k in P['oldAliases'] if 'assets-parts' in k or '/campaign.' in k or 'ordered-common-'in k}
 sites.update({k:active[k] for k in P['newAliases'] if k.startswith('web/runtime/')or 'assets-parts'in k})
 split={}
 for st in (40,46):
  leaf=[x for x in g['P']['routes'][str(st)]if re.fullmatch(r'web/data/chapter-'+str(st)+r'-assets-parts\.[a-f0-9]+\.json',x)]
  need(len(leaf)==1,'unexpected actual split descriptor')
  name=leaf[0];a=json.loads(read(repo,name));paths=[x['path']for x in a['parts']]
  need(a['$honroJsonParts']==1 and len(paths)==(3 if st==40 else 4) and len(set(paths))==len(paths),'unexpected actual split contract')
  bag=[read(repo,k)for k in paths];need(all(fact(v)==g['P']['routes'][str(st)][k]for k,v in zip(paths,bag)),'local split bytes are not exact')
  split[str(st)]={'path':name,'pieces':paths,'whole':fact(b''.join(bag))}
 save(w/'REFERENCE.json',d);save(out/'GRAPH.json',{'active':len(active),'retained':len(registry),'publishedGraphs':len(pub),'httpSample':sites,'split':split,'protectedPeers':['21','32','33','42']})
if __name__=='__main__':
 if sys.argv[1]=='verify':print(json.dumps(evidence(Path(sys.argv[2]).read_bytes())))
 else:{'acquire':acquire,'prepare':prepare}[sys.argv[1]](Path(sys.argv[2]).resolve())
