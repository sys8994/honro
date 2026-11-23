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
 need(w.parent==Path(os.environ['RUNNER_TEMP']).resolve() and w.name=='stage46-part23-abd','bad scratch root')
 scope={'.github/workflows/stage46-part23-abd.yml',*('tools/stage46-part23-abd/'+f for f in ('PINS.json','guard.py','capture.py','observer.json','packet.mjs'))}
 need(git(repo,'show','-s','--format=%P',h)==a and git(repo,'rev-parse',a+'^{tree}')==P['tree'] and git(repo,'rev-parse',b+'^{tree}')==P['previousTree'],'wrong exact revision trees')
 need(set(git(repo,'diff','--name-status','--no-renames',a,h).splitlines())=={'A\t'+x for x in scope},'not scoped add-only')
 j=lambda k:json.loads(sp.check_output(['gh','api','repos/'+P['repo']+'/'+k],timeout=45))
 pages=j('actions/runs/'+str(P['pages']['run']));job=j('actions/jobs/'+str(P['pages']['job']))
 need(pages['head_sha']==job['head_sha']==a and pages['head_branch']=='master' and pages['id']==job['run_id'] and pages['conclusion']==job['conclusion']=='success' and job['name']=='deploy','actual exact Pages not ready')
 w.mkdir();(w/'out').mkdir()
 for tag,sha in [('A',b),('B',a),('D',a)]:git(repo,'worktree','add','--detach',str(w/tag),sha)
 save(w/'out'/'AUTHORITY.json',{'base':b,'current':a,'pages':P['pages'],'noDeploy':True,'realBrowserExpectation':['A','B','D']})
def full(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def assemble(w):
 b,d=w/'B',w/'D';f=P['fixture'];o=P['overlay'];q=Path(__file__).resolve().parent
 sp.run(['node',str(q/'packet.mjs'),str(w),str(q/'PINS.json')],check=True,timeout=50)
 def swap(val,a,b):
  need(val.count(a.encode())==1,'scoped signed token missing or duplicated')
  return val.replace(a.encode(),b.encode())
 def place(k,v):
  need(full(v)==o['files'][k],'bit-exact D output drift: '+k)
  dst=d/k
  need(dst.parent.is_dir() and not dst.is_symlink() and dst.resolve().is_relative_to(d.resolve()),'unsafe output path')
  dst.write_bytes(v)
 d0=P['packs']['B']['descriptor'];d1=P['packs']['D']['descriptor'];inp={}
 for k,(path,sha) in o['input'].items():
  raw=read(b,path);need(full(raw)['git']==sha,'exact compiled input drift '+path);inp[k]=(path,raw)
 c1=P['packs']['D']['campaign'];e1=P['packs']['D']['entry'];n1=o['wrapper']
 z=swap(inp['campaign.json'][1],d0,d1)
 x,y=map(json.loads,(inp['campaign.json'][1],z))
 need(y['stageLibraries'][45]==d1 and x['stageLibraries'][45]==d0,'wrong mounted Stage46 slot')
 y['stageLibraries'][45]=d0;need(x==y,'compiled campaign changed other data')
 n=swap(inp['campaign.js'][1],inp['campaign.json'][0],c1)
 e=swap(swap(inp['entry.js'][1],Path(inp['campaign.js'][0]).name,Path(n1).name),inp['campaign.json'][0],c1)
 h=swap(inp['HONRO.html'][1],inp['entry.js'][0],e1)
 for k,v in ((c1,z),(n1,n),(e1,e),('HONRO.html',h)):place(k,v)
 m=json.loads(read(b,M));desc=json.loads(read(b,d0))
 remove={inp[k][0]for k in ('campaign.json','campaign.js','entry.js')}|{d0,*(p['path']for p in desc['parts'])}
 need(len(remove)==6 and remove<={i['path']for i in m['files']},'unexpected active minted aliases')
 m['files']=[i for i in m['files']if i['path']not in remove]
 for k,z in o['files'].items():
  need(full(read(d,k))==z,'exact mounted D layer differs')
  if k!='HONRO.html':m['files'].append({'path':k,**{f:z[f]for f in ('bytes','sha256')}})
 m['project']=c1;m['gameEntry']=e1
 (d/M).write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
 changed={x.strip()for x in git(d,'status','--porcelain','-uall').splitlines()}
 expected={(' M ' if k in ('HONRO.html',M) else '?? ')+k for k in {M,*o['files']}}
 need(changed=={x.strip()for x in expected},'D scratch has extra files or edits')
 protected=[inp['common5.js'][0],'shared/runtime/profile-store.js',*f['sources']]
 need(all(read(b,p)==read(d,p)for p in protected),'D profile/runtime/author source drift')
 save(w/'out'/'D-DERIVATION.json',{'derivedOutputs':o['files'],'physicalObjectsUnchanged':True,'runtimeAndTrackedSourceUnchanged':protected,'restoredCompiledObjects':f['sources'],'notNormalBuild':True,'productionWritable':False,'oldSaveTest':'OMITTED: art selection only; original profile implementation and provider-compatibility aliases unchanged'})
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
   if tag=='D' and f in P['overlay']['files']:need(v=={k:P['overlay']['files'][f][k] for k in ('bytes','sha256')},'D active mounted scope proof drift '+f)
  if tag=='D':
   k=P['overlay']['wrapper'];v=fact(read(d,k));need(v==a[k],'exact D campaign wrapper drift');files[k]=v
  out[tag]={'files':files,'aggregate':{'bytes':n,'sha256':h.hexdigest()},'parts':[v['path']for v in s['parts']]}
 need(maps['A']==maps['B']==maps['D'] and out['A']['files'][P['map']]==out['B']['files'][P['map']]==out['D']['files'][P['map']],'one or more physical map aliases changed')
 need({a:out[a] for a in 'AB'}==P['expectedActiveAB'],'archived exact A/B active graph drift')
 save(w/'out'/'GRAPH.json',out)
if __name__=='__main__':
 {'authority':authority,'prepare':prepare,'assemble':assemble}[sys.argv[1]](Path(sys.argv[2]).resolve())
