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
 need(w.parent==Path(os.environ['RUNNER_TEMP']).resolve() and w.name=='stage46-part2345-abe','bad scratch root')
 scope={'.github/workflows/stage46-part2345-abe.yml',*('tools/stage46-part2345-abe/'+f for f in ('PINS.json','guard.py','capture.py','observer.json','packet.mjs','loader-preflight.mjs','benchmark.py'))}
 need(git(repo,'show','-s','--format=%P',h)==a and git(repo,'rev-parse',a+'^{tree}')==P['tree'] and git(repo,'rev-parse',b+'^{tree}')==P['previousTree'],'wrong exact revision trees')
 need(set(git(repo,'diff','--name-status','--no-renames',a,h).splitlines())=={'A\t'+x for x in scope},'not scoped add-only')
 j=lambda k:json.loads(sp.check_output(['gh','api','repos/'+P['repo']+'/'+k],timeout=45))
 pages=j('actions/runs/'+str(P['pages']['run']));job=j('actions/jobs/'+str(P['pages']['job']))
 need(pages['head_sha']==job['head_sha']==a and pages['head_branch']=='master' and pages['id']==job['run_id'] and pages['conclusion']==job['conclusion']=='success' and job['name']=='deploy','actual exact Pages not ready')
 w.mkdir();(w/'out').mkdir()
 for tag,sha in [('A',b),('B',a),('E',a)]:git(repo,'worktree','add','--detach',str(w/tag),sha)
 save(w/'out'/'AUTHORITY.json',{'base':b,'current':a,'pages':P['pages'],'noDeploy':True,'realBrowserExpectation':['A','B','E']})
def full(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def assemble(w):
 b,d=w/'B',w/'E';f=P['fixture'];o=P['overlay'];q=Path(__file__).resolve().parent
 sp.run(['node',str(q/'packet.mjs'),str(w),str(q/'PINS.json')],check=True,timeout=50)
 def swap(val,a,b):
  need(val.count(a.encode())==1,'scoped signed token missing or duplicated')
  return val.replace(a.encode(),b.encode())
 def place(k,v):
  need(full(v)==o['files'][k],'bit-exact E output drift: '+k)
  dst=d/k
  need(dst.parent.is_dir() and not dst.is_symlink() and dst.resolve().is_relative_to(d.resolve()),'unsafe output path')
  dst.write_bytes(v)
 d0=P['packs']['B']['descriptor'];d1=P['packs']['E']['descriptor'];inp={}
 for k,(path,sha) in o['input'].items():
  raw=read(b,path);need(full(raw)['git']==sha,'exact compiled input drift '+path);inp[k]=(path,raw)
 c1=P['packs']['E']['campaign'];e1=P['packs']['E']['entry'];n1=o['wrapper']
 u=swap(inp['campaign.json'][1],d0,d1)
 need(full(u)=={k:v for k,v in P['loaderProbe']['negativeCampaign'].items() if k!='path'},'exact historical E loader-fail control drift')
 x,y=map(json.loads,(inp['campaign.json'][1],u))
 need(y['stageLibraries'][45]==d1 and x['stageLibraries'][45]==d0,'wrong mounted Stage46 slot')
 need(x['assetEncodings']['stageLibraries'][45]==y['assetEncodings']['stageLibraries'][45]=='json' and len(y['assetEncodings']['stageLibraries'])==50,'unexpected exact baseline encoding')
 need((json.dumps(y,ensure_ascii=False,separators=(',',':'))+'\n').encode()==u,'unexpected exact baseline campaign serialization')
 y['assetEncodings']['stageLibraries'][45]='json-pool-v1'
 z=(json.dumps(y,ensure_ascii=False,separators=(',',':'))+'\n').encode()
 y['stageLibraries'][45]=d0
 y['assetEncodings']['stageLibraries'][45]='json'
 need(x==y,'compiled campaign changed other data')
 n=swap(inp['campaign.js'][1],inp['campaign.json'][0],c1)
 e=swap(swap(inp['entry.js'][1],Path(inp['campaign.js'][0]).name,Path(n1).name),inp['campaign.json'][0],c1)
 h=swap(inp['HONRO.html'][1],inp['entry.js'][0],e1)
 for k,v in ((c1,z),(n1,n),(e1,e),('HONRO.html',h)):place(k,v)
 m=json.loads(read(b,M));desc=json.loads(read(b,d0))
 remove={inp[k][0]for k in ('campaign.json','campaign.js','entry.js')}|{d0,*(p['path']for p in desc['parts'])}
 need(len(remove)==6 and remove<={i['path']for i in m['files']},'unexpected active minted aliases')
 m['files']=[i for i in m['files']if i['path']not in remove]
 for k,z in o['files'].items():
  need(full(read(d,k))==z,'exact mounted E layer differs')
  if k!='HONRO.html':m['files'].append({'path':k,**{f:z[f]for f in ('bytes','sha256')}})
 m['project']=c1;m['gameEntry']=e1
 raw=(json.dumps(m,ensure_ascii=False,indent=2)+'\n').encode()
 need(full(raw)==o['localCanonicalManifest'],'derived normalized manifest drift')
 (d/M).write_bytes(raw)
 changed={x.strip()for x in git(d,'status','--porcelain','-uall').splitlines()}
 expected={(' M ' if k in ('HONRO.html',M) else '?? ')+k for k in {M,*o['files']}}
 need(changed=={x.strip()for x in expected},'E scratch has extra files or edits')
 protected=[inp['common5.js'][0],'shared/runtime/profile-store.js',*f['sources']]
 need(all(read(b,p)==read(d,p)for p in protected),'E profile/runtime/author source drift')
 save(w/'out'/'E-DERIVATION.json',{'derivedOutputs':o['files'],'physicalObjectsUnchanged':True,'runtimeAndTrackedSourceUnchanged':protected,'restoredCompiledObjects':f['sources'],'notNormalBuild':True,'productionWritable':False,'oldSaveTest':'OMITTED: art selection only; original profile implementation and provider-compatibility aliases unchanged'})
def prepare(w, local_partial=False):
 need(not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')),'credentials in anonymous observer')
 out={}; maps={}
 for tag,p in P['packs'].items():
  if local_partial and tag=='A':continue
  d=w/tag;files={}
  m=json.loads(read(d,M));a={x['path']:{'bytes':x['bytes'],'sha256':x['sha256']}for x in m['files']}
  c=json.loads(read(d,p['campaign']));maps[tag]=c['stages'];s=json.loads(read(d,p['descriptor']))
  need(m['project']==p['campaign'] and m['gameEntry']==p['entry'] and len(c['stages'])==len(c['stageLibraries'])==50 and c['stages'][45]==P['map'] and c['stageLibraries'][45]==p['descriptor'],'wrong active authored route')
  need(s['$honroJsonParts']==1 and s['bytes']==p['splitBytes'] and len(s['parts'])=={'A':4,'B':2,'E':3}[tag],'wrong packed Stage46 size')
  h=hashlib.sha256();n=0
  for v in s['parts']:
   b=read(d,v['path']);n+=len(b);h.update(b)
   need(fact(b)==a[v['path']]=={k:v[k]for k in ('bytes','sha256')},'part bytes drift')
  need(n==s['bytes'] and h.hexdigest()==s['sha256'],'aggregate split digest drift')
  for f in (M,'HONRO.html',p['entry'],p['campaign'],P['map'],p['descriptor'],*(v['path']for v in s['parts'])):
   v=fact(read(d,f));files[f]=v
   if f in a:need(a[f]==v,'tracked route hash drift '+f)
   if tag=='E' and f in P['overlay']['files']:need(v=={k:P['overlay']['files'][f][k] for k in ('bytes','sha256')},'E active mounted scope proof drift '+f)
  if tag=='E':
   need(full(read(d,M))==P['overlay']['localCanonicalManifest'],'E exact local manifest drift')
   k=P['overlay']['wrapper'];v=fact(read(d,k));need(v==a[k],'exact E campaign wrapper drift');files[k]=v
  out[tag]={'files':files,'aggregate':{'bytes':n,'sha256':h.hexdigest()},'parts':[v['path']for v in s['parts']]}
 need(maps['B']==maps['E'] and out['B']['files'][P['map']]==out['E']['files'][P['map']],'one or more physical map aliases changed')
 active=P['expectedActiveAB']
 if local_partial:
  need(out['B']==active['B'],'exact local B active graph drift')
  old=dict(active['A']['files']); old.pop(M)
  need(all(fact(read(w/'A',k))==v for k,v in old.items()),'exact archived A raw dependency drift')
 else:
  need(maps['A']==maps['B'] and out['A']['files'][P['map']]==out['B']['files'][P['map']],'old canonical map changed')
  need({a:out[a] for a in 'AB'}==active,'archived exact A/B active graph drift')
 for tag in 'BE':
  m=json.loads(read(w/tag,M)); c=json.loads(read(w/tag,P['packs'][tag]['campaign']))
  keys=[P['overlay']['input']['common5.js'][0]]
  need(all(x in {row['path'] for row in m['files']} for x in keys),'runtime alias drift')
 bc=json.loads(read(w/'B',P['packs']['B']['campaign']))
 ec=json.loads(read(w/'E',P['packs']['E']['campaign']))
 need(ec['assetEncodings']['stageLibraries'][45]=='json-pool-v1','E asset encoding flag missing')
 ec['stageLibraries'][45]=bc['stageLibraries'][45];ec['assetEncodings']['stageLibraries'][45]=bc['assetEncodings']['stageLibraries'][45]
 need(ec==bc,'unrelated stage provider or stage campaign drift')
 for dep,pin in P['loaderProbe']['deps'].items():
  need(all(full(read(w/tag,dep))==pin for tag in 'BE'),'exact loader proof dependency drift '+dep)
 sp.run(['node',str(Path(__file__).with_name('loader-preflight.mjs')),str(w),str(Path(__file__).with_name('PINS.json'))],check=True,timeout=45)
 if local_partial:
  need(not os.getenv('GITHUB_ACTIONS'),'partial preflight is forbidden in Actions')
  save(w/'out'/'LOCAL-PREPARE.json',{'status':'LOCAL_E_AND_B_EXACT_A_ROUTES_NOT_MANIFEST','actualBrowser':False,'fullGraphForBrowser':False,'AArchivedVerifiedNonManifestFiles':sorted(old),'graph':out})
 else:save(w/'out'/'GRAPH.json',out)
if __name__=='__main__':
 {'authority':authority,'prepare':prepare,'assemble':assemble,'prepare-local':lambda w:prepare(w,True)}[sys.argv[1]](Path(sys.argv[2]).resolve())
