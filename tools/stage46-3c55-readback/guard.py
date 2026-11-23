"""Exact predecessor/current tracked checkout and anonymous public Stage46 dependency authority."""
import hashlib,json,os,re,subprocess as sp,sys,urllib.request
from pathlib import Path
P=json.loads(Path(__file__).with_name('PINS.json').read_bytes());M='web/manifest.json'
def need(ok,m):
 if not ok:raise RuntimeError(m)
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def save(f,v):f.write_text(json.dumps(v,indent=2)+'\n')
def read(p,k):
 f=p/k;need(f.resolve().is_relative_to(p.resolve()) and f.is_file() and not f.is_symlink(),'bad path '+k)
 return f.read_bytes()
def git(p,*args):return sp.check_output(['git','-C',str(p),*args],timeout=120,text=True).strip()
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*a,**k):raise RuntimeError('unexpected public redirect')
def http(url,size):
 req=urllib.request.Request(url,headers={'Accept-Encoding':'identity','User-Agent':'HONRO exact read-only QA'})
 with urllib.request.build_opener(NoRedirect).open(req,timeout=45) as r:
  need(r.status==200 and r.geturl()==url,'wrong expected immutable anonymous URL')
  return r.read(size+1)
def authority(w):
 need(P['enabled'] is True,'DISABLED until root arms exact Stage46 readback')
 a=P['head'];b=P['previous'];repo=Path(os.environ['GITHUB_WORKSPACE']).resolve();h=os.environ['GITHUB_SHA']
 need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(P['repo'],P['qaRef'],'push'),'bad exact QA ref')
 need(w.parent==Path(os.environ['RUNNER_TEMP']).resolve() and w.name=='stage46-3c55-readback','bad scratch root')
 scope={'.github/workflows/stage46-3c55-readback.yml',*('tools/stage46-3c55-readback/'+f for f in ('PINS.json','guard.py','capture.py','observer.json'))}
 need(git(repo,'show','-s','--format=%P',h)==a and git(repo,'rev-parse',a+'^{tree}')==P['tree'] and git(repo,'rev-parse',b+'^{tree}')==P['previousTree'],'wrong exact revision trees')
 need(set(git(repo,'diff','--name-status','--no-renames',a,h).splitlines())=={'A\t'+x for x in scope},'not scoped add-only')
 j=lambda k:json.loads(sp.check_output(['gh','api','repos/'+P['repo']+'/'+k],timeout=45))
 pages=j('actions/runs/'+str(P['pages']['run']));job=j('actions/jobs/'+str(P['pages']['job']))
 need(pages['head_sha']==job['head_sha']==j('branches/master')['commit']['sha']==a and pages['head_branch']=='master' and pages['id']==job['run_id'] and pages['conclusion']==job['conclusion']=='success' and job['name']=='deploy','actual exact Pages not ready')
 w.mkdir();(w/'out').mkdir()
 for tag,sha in [('A',b),('B',a)]:git(repo,'worktree','add','--detach',str(w/tag),sha)
 save(w/'out'/'AUTHORITY.json',{'base':b,'current':a,'pages':P['pages'],'noDeploy':True})
def prepare(w):
 need(not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')),'credentials in anonymous observer')
 out={}; maps={}
 for tag,p in P['packs'].items():
  d=w/tag;files={}
  m=json.loads(read(d,M));a={x['path']:{'bytes':x['bytes'],'sha256':x['sha256']}for x in m['files']}
  c=json.loads(read(d,p['campaign']));maps[tag]=c['stages'];s=json.loads(read(d,p['descriptor']))
  need(m['project']==p['campaign'] and m['gameEntry']==p['entry'] and len(c['stages'])==len(c['stageLibraries'])==50 and c['stages'][45]==P['map'] and c['stageLibraries'][45]==p['descriptor'],'wrong active authored route')
  need(s['$honroJsonParts']==1 and s['bytes']==p['splitBytes'] and len(s['parts'])==(4 if tag=='A' else 2),'wrong packed Stage46 size')
  h=hashlib.sha256();n=0
  for v in s['parts']:
   b=read(d,v['path']);n+=len(b);h.update(b)
   need(fact(b)==a[v['path']]=={k:v[k]for k in ('bytes','sha256')},'part bytes drift')
  need(n==s['bytes'] and h.hexdigest()==s['sha256'],'aggregate split digest drift')
  for f in (M,'HONRO.html',p['entry'],p['campaign'],P['map'],p['descriptor'],*(v['path']for v in s['parts'])):
   v=fact(read(d,f));files[f]=v
   if f in a:need(a[f]==v,'tracked route hash drift '+f)
   if tag=='B':need(fact(http(P['publicRoot']+f,v['bytes']))==v,'public route not exact tracked '+f)
  out[tag]={'files':files,'aggregate':{'bytes':n,'sha256':h.hexdigest()},'parts':[v['path']for v in s['parts']]}
 need(maps['A']==maps['B'] and out['A']['files'][P['map']]==out['B']['files'][P['map']],'one or more physical map aliases changed')
 save(w/'out'/'GRAPH.json',out)
if __name__=='__main__':
 {'authority':authority,'prepare':prepare}[sys.argv[1]](Path(sys.argv[2]).resolve())
