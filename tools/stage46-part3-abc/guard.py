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
 need(w.parent==Path(os.environ['RUNNER_TEMP']).resolve() and w.name=='stage46-part3-abc','bad scratch root')
 scope={'.github/workflows/stage46-part3-abc.yml',*('tools/stage46-part3-abc/'+f for f in ('PINS.json','guard.py','capture.py','observer.json','packet.mjs'))}
 need(git(repo,'show','-s','--format=%P',h)==a and git(repo,'rev-parse',a+'^{tree}')==P['tree'] and git(repo,'rev-parse',b+'^{tree}')==P['previousTree'],'wrong exact revision trees')
 need(set(git(repo,'diff','--name-status','--no-renames',a,h).splitlines())=={'A\t'+x for x in scope},'not scoped add-only')
 j=lambda k:json.loads(sp.check_output(['gh','api','repos/'+P['repo']+'/'+k],timeout=45))
 pages=j('actions/runs/'+str(P['pages']['run']));job=j('actions/jobs/'+str(P['pages']['job']))
 need(pages['head_sha']==job['head_sha']==a and pages['head_branch']=='master' and pages['id']==job['run_id'] and pages['conclusion']==job['conclusion']=='success' and job['name']=='deploy','actual exact Pages not ready')
 w.mkdir();(w/'out').mkdir()
 for tag,sha in [('A',b),('B',a),('C',a)]:git(repo,'worktree','add','--detach',str(w/tag),sha)
 save(w/'out'/'AUTHORITY.json',{'base':b,'current':a,'pages':P['pages'],'noDeploy':True,'realBrowserExpectation':['A','B','C']})
def full(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def assemble(w):
 b,c=w/'B',w/'C';f=P['fixture'];o=P['overlay'];d=Path(__file__).resolve().parent
 sp.run(['node',str(d/'packet.mjs'),str(w),str(d/'PINS.json')],check=True,timeout=50)
 source='shared/runtime/profile-store.js';rules=f['provider'];old=rules['acceptedBefore'][:-1];earlier=rules['acceptedBefore']
 def literal(p,n,quote):
  def j(v):return quote+v+quote
  return ('previous:Object.freeze(['+','.join(map(j,p))+']),current:'+j(n)).encode()
 def swap(v,a,b):
  if isinstance(a,str):a=a.encode()
  if isinstance(b,str):b=b.encode()
  need(v.count(a)==1,'scoped signed compiled/source token missing or duplicated')
  return v.replace(a,b)
 def place(new,v,locked):
  need(full(v)==locked,'bit-exact C output drift: '+new);dst=c/new
  need(dst.parent.is_dir() and not dst.is_symlink() and dst.resolve().is_relative_to(c.resolve()),'unsafe output path')
  dst.write_bytes(v)
 bo=read(b,source);need(full(bo)==f['sources'][source]['A'],'wrong exact B profile source')
 co=swap(bo,literal(old,earlier[-1],"'"),literal(earlier,rules['pristine'],"'"));place(source,co,f['sources'][source]['C'])
 d0=P['packs']['B']['descriptor'];d1=P['packs']['C']['descriptor'];inp={}
 for k,(path,sha) in o['input'].items():
  raw=read(b,path);need(full(raw)['git']==sha,'exact compiled input drift '+path);inp[k]=(path,raw)
 rew=o['rewrites'];ref={}
 for key,(oldpath,original) in inp.items():ref[key]=rew[oldpath]
 a=swap(inp['common5.js'][1],literal(old,earlier[-1],'"'),literal(earlier,rules['pristine'],'"'))
 z=swap(inp['campaign.json'][1],d0,d1)
 x,y=map(json.loads,(inp['campaign.json'][1],z))
 need(y['stageLibraries'][45]==d1 and x['stageLibraries'][45]==d0,'wrong compiled Stage46 injection location')
 y['stageLibraries'][45]=d0;need(x==y,'compiled file changed other data')
 n=swap(inp['campaign.js'][1],inp['campaign.json'][0],ref['campaign.json'])
 e=inp['entry.js'][1]
 for key in ('common5.js','campaign.js'):e=swap(e,Path(inp[key][0]).name,Path(ref[key]).name)
 e=swap(e,inp['campaign.json'][0],ref['campaign.json'])
 h=swap(inp['HONRO.html'][1],inp['entry.js'][0],ref['entry.js'])
 for key,v in [('common5.js',a),('campaign.json',z),('campaign.js',n),('entry.js',e),('HONRO.html',h)]:
  place(ref[key],v,o['files'][ref[key]])
 m=json.loads(read(b,M));T={i['path']:i for i in m['files']}
 desc=json.loads(read(b,d0));remove=set(rew)|{d0,*(p['path']for p in desc['parts'])}
 m['files']=[i for i in m['files']if i['path']not in remove]
 for k,z in o['files'].items():
  need(full(read(c,k))==z,'exact mounted C layer differs')
  if k!='HONRO.html':m['files'].append({'path':k,**{f:z[f]for f in ('bytes','sha256')}})
 m['project']=P['packs']['C']['campaign'];m['gameEntry']=P['packs']['C']['entry']
 m['common']=[rew.get(k,k) for k in m['common']]
 # Diagnostic current graph only, not a production build/retention manifest.
 (c/M).write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
 changed={x.strip() for x in git(c,'status','--porcelain','-uall').splitlines()}
 expected={(' M ' if k in ('HONRO.html',M,*f['sources']) else '?? ')+k for k in {M,*o['files'],*f['sources']}}
 need(changed=={x.strip()for x in expected},'C scratch has extra files or edits')
 save(w/'out'/'C-DERIVATION.json',{'candidateDocument':ref['HONRO.html'],'derivedOutputs':o['files'],'signedSources':f['sources'],'notNormalBuild':True,'productionWritable':False,'profileNeutralOtherStage':True})
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
   if tag=='C' and f in P['overlay']['files']:need(v=={k:P['overlay']['files'][f][k] for k in ('bytes','sha256')},'C active mounted scope proof drift '+f)
  out[tag]={'files':files,'aggregate':{'bytes':n,'sha256':h.hexdigest()},'parts':[v['path']for v in s['parts']]}
 need(maps['A']==maps['B']==maps['C'] and out['A']['files'][P['map']]==out['B']['files'][P['map']]==out['C']['files'][P['map']],'one or more physical map aliases changed')
 save(w/'out'/'GRAPH.json',out)
if __name__=='__main__':
 {'authority':authority,'prepare':prepare,'assemble':assemble}[sys.argv[1]](Path(sys.argv[2]).resolve())
