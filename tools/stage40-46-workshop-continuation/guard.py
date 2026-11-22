"""Strictly read-only authority for isolated exact prior normal-build continuation, disabled by default."""
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
def authority(w):
 x=P['failedUnion'];base=P['head'];root=Path(os.environ['GITHUB_WORKSPACE']).resolve();head=os.environ['GITHUB_SHA']
 need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(P['repo'],P['qaRef'],'push'),'not exact QA event')
 need(w.parent==Path(os.environ['RUNNER_TEMP']).resolve() and w.name=='stage40-46-workshop-continuation','invalid scratch root')
 need(git(root,'rev-parse',base+'^{tree}')==P['tree'] and git(root,'show','-s','--format=%P',head)==base and git(root,'show','-s','--format=%P',x['head'])==base,'not exact eaf/QA ancestry')
 scope={'.github/workflows/stage40-46-workshop-continuation.yml',*('tools/stage40-46-workshop-continuation/'+f for f in ('PINS.json','guard.py','verify.py','workshop.py','observer.json'))}
 need(set(git(root,'diff','--name-status','--no-renames',base,head).splitlines())=={'A\t'+k for k in scope},'not exact add-only QA')
 def get(url):
  # Capture the exact GitHub-hosted binary/log bytes in a subprocess pipe;
  # never emit control sequences to a terminal. JSON paths keep stock gh validation.
  arg=['gh','api']
  if url.endswith(('/logs','/zip')):arg.append('--allow-escape-sequences')
  return sp.check_output([*arg,'repos/'+P['repo']+'/'+url],timeout=90)
 def j(url):return json.loads(get(url))
 run=j('actions/runs/'+str(x['run']));job=j('actions/jobs/'+str(x['job']));a=j('actions/artifacts/'+str(x['artifact']))
 need(run['head_sha']==job['head_sha']==a['workflow_run']['head_sha']==x['head'] and run['id']==job['run_id']==a['workflow_run']['id']==x['run'] and run['status']==job['status']=='completed' and run['conclusion']==job['conclusion']=='failure','not exact failed prior run')
 steps={s['name']:s['conclusion'] for s in job['steps']}
 need(steps['A is tracked exact stock and B is a single standard normal build']=='success' and steps['Native cold launch timing, matched raw and ordinary A save continued in B']=='failure','prior build or test did not have stated outcome')
 need(not a['expired'] and a['name']==x['name'] and a['size_in_bytes']==x['bytes'] and a['digest']=='sha256:'+x['sha256'],'wrong exact prior archive identity')
 raw_log=get('actions/jobs/'+str(x['job'])+'/logs')
 if zipfile.is_zipfile(io.BytesIO(raw_log)):
  with zipfile.ZipFile(io.BytesIO(raw_log)) as z:
   need(z.testzip() is None and sum(e.file_size for e in z.infolist())<20<<20,'invalid official logs')
   log=b'\n'.join(z.read(e) for e in z.infolist() if not e.is_dir())
 else:log=raw_log
 need(x['error'].encode() in log and b'line 230, in workshop' in log,'the exact isolated Workshop error unobserved')
 w.mkdir();(w/'out').mkdir();raw=get('actions/artifacts/'+str(x['artifact'])+'/zip')
 need(fact(raw)=={k:x[k] for k in ('sha256','bytes')},'official R1 raw ZIP mismatch')
 (w/'r1.zip').write_bytes(raw)
 save(w/'out'/'PRIOR-R1-AUTHORITY.json',{'prior':x,'r1JobRemainsFailed':True,'checkout':head,'noRebuild':True})

if __name__=='__main__':
 need(P['enabled'] is True,'DISABLED: only root may arm exact Workshop continuation')
 authority(Path(sys.argv[1]).resolve())
