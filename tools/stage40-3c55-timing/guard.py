"""Exact source and release authority for read-only Stage40 QA."""
from pathlib import Path
import hashlib,json,os,re,subprocess as sp,sys,urllib.request
D=Path(__file__).resolve().parent; P=json.loads((D/'PINS.json').read_bytes())
R=P['refs']; M='web/manifest.json'
def need(ok,msg):
 if not ok: raise RuntimeError(msg)
def fact(b):return dict(bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def git(root,*a):return sp.check_output(['git','-C',str(root),*a],timeout=180,text=True).strip()
def save(path,v):path.write_text(json.dumps(v,indent=2)+'\n')
def load(p):return json.loads(p.read_bytes())
def read(root,key):
 p=root/key
 need(p.resolve().is_relative_to(root.resolve()) and p.is_file() and not p.is_symlink(),'unexpected input path '+key)
 return p.read_bytes()
def api(path):return json.loads(sp.check_output(['gh','api','repos/'+P['repo']+'/'+path],timeout=90))
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):raise RuntimeError('unexpected redirect')
def request(url,pin):
 q=urllib.request.Request(url,headers={'Accept-Encoding':'identity','User-Agent':'HONRO Stage40 isolated official readback'})
 with urllib.request.build_opener(NoRedirect()).open(q,timeout=45)as r:
  need(r.status==200 and r.geturl()==url and fact(r.read(pin['bytes']+1))==pin,'public bytes mismatch '+url)
def routes(root,r):
 raw=read(root,M);need({'bytes':len(raw),'git':blob(raw)}==r['manifest'],'compiled manifest identity')
 active={v['path']:{'bytes':v['bytes'],'sha256':v['sha256']}for v in json.loads(raw)['files']}
 hx=read(root,'HONRO.html');e,c,n,j,d=[r[k]for k in ('entry','campaignRuntime','nativeRuntime','campaign','descriptor')]
 need(hx.count(e.encode())==1,'wrong stable game entry')
 entry=read(root,e)
 for k in (c,n):need(entry.count(k.removeprefix('web/').encode())==1,'entry does not bind '+k)
 need(read(root,c).count(j.encode())==1,'compiled campaign binding')
 cj=load(root/j);need(cj['stages'][39]==P['stageMap']and cj['stageLibraries'][39]==d,'wrong active chapter map/descriptor')
 rt=read(root,n)
 need(rt.count(b'compactArt:true});return persist.apply(this,args)')==(1 if r==R['B'] else 0),'compiled early compact route mismatch')
 if r!=R['B']:need(b'compactAct4Autosave===true' in rt,'wrong historical save branch')
 desc=load(root/d);need(desc.get('$honroJsonParts')==1 and len(desc['parts'])==3,'wrong Stage40 split')
 parts=[q['path']for q in desc['parts']];need(len(set(parts))==3,'duplicate split part')
 keys=[e,c,n,j,P['stageMap'],d,*parts]
 out={'manifest':fact(raw),'shell':fact(hx),'routes':{}}
 for k in keys:
  b=read(root,k);f=fact(b);need(active[k]==f and f['sha256'][:16]==k.split('.')[-2],'content-addressed active file mismatch '+k)
  out['routes'][k]=f
 need(all(out['routes'][q['path']]=={k:q[k]for k in ('bytes','sha256')}for q in desc['parts']),'descriptor parts mismatch')
 out['stageData']={k:out['routes'][k]for k in [P['stageMap'],d,*parts]}
 return out
def pages(r):
 x=api('actions/runs/'+str(r['run']));j=api('actions/jobs/'+str(r['job']))
 need(x['name']=='pages build and deployment' and x['head_branch']=='master' and x['head_sha']==j['head_sha']==r['head'] and x['conclusion']==j['conclusion']=='success' and j['run_id']==r['run'] and j['name']=='deploy','unverified exact Pages '+r['head'])
 return j['completed_at']
def descendant(root,q,b):
 # The scoped QA parent is not the timing baseline. This is proof on fixed Git blobs only.
 need(git(root,'rev-parse',q['head']+'^{tree}')==q['tree'] and git(root,'show','-s','--format=%P',q['head'])==R['B']['head'],'not exact direct published successor of timing B')
 d=set(git(root,'diff','--name-status','--no-renames',R['B']['head'],q['head']).splitlines())
 need(d=={v+'\t'+k for k,v in q['diffFromB'].items()},'unexpected release scope between B and QA parent')
 raw=read(root,M);need({'bytes':len(raw),'git':blob(raw)}==q['manifest'],'QA parent manifest identity')
 rows={x['path']:{'bytes':x['bytes'],'sha256':x['sha256']}for x in json.loads(raw)['files']}
 e=q['gameEntry'];entry=read(root,e)
 need(rows[e]==fact(entry) and fact(entry)['sha256'][:16]==e.split('.')[-2] and read(root,'HONRO.html').count(e.encode())==1,'wrong QA parent game entry')
 binds=[R['B'][k]for k in ('campaignRuntime','nativeRuntime')]
 need(all(entry.count(k.removeprefix('web/').encode())==1 for k in binds),'QA parent no longer runs the same Stage40 owner/campaign')
 retained={}
 for k,v in b['routes'].items():
  # Old hashed shell entry can be retained but is not active on this different release.
  need(fact(read(root,k))==v,'exact Stage40-related historical alias disappeared '+k)
  if k!=R['B']['entry']:
   need(rows[k]==v,'active Stage40 ownership changed '+k)
   retained[k]=v
 return {'head':q['head'],'tree':q['tree'],'parent':R['B']['head'],'exactDiff':q['diffFromB'],'standaloneGameEntry':e,'activeStage40OwnerRoutes':retained}
def main(w):
 need(P['enabled'] is True,'DISABLED; set enabled=true only on exact QA branch after review')
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve();head=os.environ['GITHUB_SHA'];q=P['qaParent']
 need(w.name=='stage40-3c55-timing'and w.parent==Path(os.environ['RUNNER_TEMP']).resolve(),'unexpected sandbox directory')
 need((os.environ.get('GITHUB_REPOSITORY'),os.environ.get('GITHUB_REF'),os.environ.get('GITHUB_EVENT_NAME'))==(P['repo'],'refs/heads/'+P['branch'],'push'),'unexpected ref')
 files={'.github/workflows/stage40-3c55-timing.yml',*['tools/stage40-3c55-timing/'+k for k in ('guard.py','capture.py','PINS.json')]}
 need(git(root,'show','-s','--format=%P',head)==q['head']and set(git(root,'diff','--name-status','--no-renames',q['head'],head).splitlines())=={'A\t'+x for x in files} and not git(root,'status','--porcelain'),'not exact add-only QA')
 qa_at=pages(q)
 for rec in (P['sealedPublicReadback'],P['sealedTimingR2'],P['sealedTimingR4']):
  x=api('actions/runs/'+str(rec['run']));j=api('actions/jobs/'+str(rec['job']));a=api('actions/artifacts/'+str(rec['artifact']))
  need(x['conclusion']==j['conclusion']==rec['expectedConclusion'] and x['head_sha']==j['head_sha']==a['workflow_run']['head_sha']==rec['head'] and j['run_id']==a['workflow_run']['id']==rec['run'] and a['digest']=='sha256:'+rec['sha256'],'missing exact historical proof authority')
 w.mkdir();(w/'out').mkdir();auth={}
 for k,r in R.items():
  deployed=pages(r)
  need(git(root,'rev-parse',r['head']+'^{tree}')==r['tree'],'wrong tree '+k)
  base=w/k;git(root,'worktree','add','--detach',str(base),r['head'])
  auth[k]={**routes(base,r),'deployedAt':deployed}
 need(auth['A']['stageData']==auth['B']['stageData'],'A/B Stage40 map, descriptor or binary parts differ')
 stage40_scope={**descendant(root,q,auth['B']),'deployedAt':qa_at}
 save(w/'SIGNED.json',auth);save(w/'out'/'AUTHORITY.json',{'pins':P,'actual':auth,'publishedQAScope':stage40_scope,'mutableMasterOrHttpConsulted':False})
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
