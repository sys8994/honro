"""Two real anonymous Stage17 Pages screenshots. This test cannot build, write refs or deploy."""
import base64,datetime as dt,hashlib,json,os,re,subprocess,sys,time
from pathlib import Path
from urllib.request import Request,HTTPRedirectHandler,build_opener
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes()); O=json.loads((H/'observer.json').read_bytes())
PARK=(H/'park.js').read_text()
BASE='https://sys8994.github.io/honro/';REPO='sys8994/honro';REF='refs/heads/qa/stage17-public-smoke'
ROOT=Path(os.environ.get('GITHUB_WORKSPACE','.')).resolve()
MF='web/manifest.json';SHELL='HONRO.html'
FILES={'.github/workflows/stage17-public-smoke.yml',*['tools/stage17-public/'+s for s in ('smoke.py','PINS.json','observer.json','park.js')]}
MEDIA={f'assets/bgm/{i}.mp3'for i in ('main','battle-1','battle-2','battle-3','battle-4')}
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[a-f0-9-]{36}')
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def gitblob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\x00'+b).hexdigest()
def facts(r):return {k:r[k]for k in ('bytes','sha256')}
def git(*args):return subprocess.check_output(['git','-C',str(ROOT),*args],timeout=75)
def gh(endpoint):return json.loads(subprocess.check_output(['gh','api',f'repos/{REPO}/'+endpoint],timeout=60))
def save(out,n,x):(out/n).write_text(json.dumps(x,indent=2)+'\n')
def load(path):
 def uniq(ps):
  x=dict(ps);assert len(x)==len(ps),'duplicate JSON key';return x
 return json.loads(path,object_pairs_hook=uniq)
def ready(out):
 assert P['enabled'] is True,'DISABLED: current exact master, successful Pages job and retained manifest facts required'
 assert out.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(REPO,'push',REF)
 r=P['release']
 assert set(r)=={'head','tree','pagesRun','pagesJob','publishedAt','manifest'}
 assert all(re.fullmatch('[a-f0-9]{40}',r[k])for k in ('head','tree')) and r['head']!=P['priorRelease']
 assert set(r['manifest'])=={'bytes','sha256','git'}
 assert re.fullmatch('[a-f0-9]{64}',r['manifest']['sha256'])and re.fullmatch('[a-f0-9]{40}',r['manifest']['git'])
 assert type(r['pagesRun']) is type(r['pagesJob']) is int and dt.datetime.fromisoformat(r['publishedAt']).tzinfo
 return r
def authority(out):
 r=ready(out);h=os.environ['GITHUB_SHA'];lh=r['head']
 assert os.getenv('GH_TOKEN')and not os.getenv('GITHUB_TOKEN')
 assert git('rev-parse','HEAD').decode().strip()==h
 assert git('rev-list','--parents','-n1',h).decode().split()==[h,lh]
 assert git('rev-list','--parents','-n1',lh).decode().split()==[lh,P['priorRelease']]
 assert git('rev-parse',lh+'^{tree}').decode().strip()==r['tree']
 assert not git('status','--porcelain=v1','-z')
 assert set(git('diff','--no-renames','--name-status',lh,h).decode().splitlines())=={'A\t'+k for k in FILES}
 for row in (P['authorSource'],P['stage33Source']):
  b=git('show',lh+':'+row['path']);assert facts(row)==fact(b) and row['git']==gitblob(b)
 m=git('show',lh+':'+MF);assert fact(m)==facts(r['manifest'])and gitblob(m)==r['manifest']['git']
 assert gh('git/ref/heads/master')['object']['sha']==lh
 run,j=gh(f"actions/runs/{r['pagesRun']}"),gh(f"actions/jobs/{r['pagesJob']}")
 assert (run['id'],run['head_sha'],run['head_branch'],run['name'],run['conclusion'])==(r['pagesRun'],lh,'master','pages build and deployment','success')
 assert (j['id'],j['run_id'],j['head_sha'],j['name'],j['conclusion'])==(r['pagesJob'],r['pagesRun'],lh,'deploy','success')
 (step,)= [x for x in j['steps'] if x['name']=='Deploy to GitHub Pages']
 assert step['conclusion']=='success' and dt.datetime.fromisoformat(step['started_at'])<=dt.datetime.fromisoformat(r['publishedAt'])<=dt.datetime.fromisoformat(j['completed_at'])+dt.timedelta(seconds=1)
 q=P['qa'];qa,qj=gh(f"actions/runs/{q['run']}"),gh(f"actions/jobs/{q['job']}")
 assert (qa['head_sha'],qa['head_branch'],qa['conclusion'])==(q['head'],q['branch'],'success')
 assert (qj['run_id'],qj['name'],qj['conclusion'])==(q['run'],'native','success')
 arts={v['id']:v for v in gh(f"actions/runs/{q['run']}/artifacts")['artifacts']}
 for key,z in (('normalPayloadArtifact','normalArchiveSHA256'),('nativeArtifact','nativeArchiveSHA256')):
  a=arts[q[key]];assert a['digest']=='sha256:'+q[z] and a['workflow_run']['head_sha']==q['head']
 save(out,'PAGES-AUTHORITY.json',{'status':'EXACT_STAGE17_MASTER_PAGES','release':r,'qa':q,'qaHead':h})
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*a,**kw):raise RuntimeError('unexpected Pages redirect')
def public(k,want):
 x=BASE+k
 with build_opener(NoRedirect).open(Request(x,headers={'Accept-Encoding':'identity'}),timeout=24)as r:
  assert r.status==200 and r.geturl()==x
  b=r.read(want['bytes']+1);assert fact(b)==want,(k,fact(b),want)
  return b
def firstparty(out,r):
 a=load((out/'PAGES-AUTHORITY.json').read_bytes());assert a['release']==r and a['status']=='EXACT_STAGE17_MASTER_PAGES'
 raw=public(MF,facts(r['manifest']));m=load(raw)
 assert gitblob(raw)==r['manifest']['git'] and m['gameEntry']==P['entry'] and m['project']==P['campaign']
 active={p['path']:facts(p)for p in m['files']}
 assert len(active)==len(m['files'])==810 and all(active[k]==v for k,v in P['activeStatic'].items())
 history=[*m['files'],*m['previousFiles']]
 for x in m['previousGenerations']:history.extend(x)
 for x in m['publishedGenerations']:history.extend(x['files'])
 known={}
 for x in history:
  k=x['path'];assert k not in known or known[k]==facts(x);known[k]=facts(x)
 assert all(known[k]==v for k,v in P['oldImmutable'].items())
 check={SHELL:P['html'],**P['activeStatic'],**P['oldImmutable']}
 got={k:public(k,v)for k,v in check.items()}
 assert P['entry'].encode()in got[SHELL]
 camp=load(got[P['campaign']]);assert len(camp['stages'])==len(camp['stageLibraries'])==50
 assert (camp['stages'][16],camp['stageLibraries'][16])==(P['map'],P['library'])
 comp=[x for x in P['activeStatic'] if 'HONRO_ACT2_COMPACT_PACKAGES' in x]
 (descriptor,)= [p for p in comp if '-parts.'in p]
 (loader,)= [p for p in comp if p.endswith('.js')]
 assert descriptor.encode()in got[loader]
 q=load(got[descriptor]);assert q.get('$honroJsonParts')==1 and len(q['parts'])==2
 assert set(comp)=={descriptor,loader,*(p['path']for p in q['parts'])}
 d=b''.join(got[v['path']]for v in q['parts']);assert facts(q)==fact(d) and all(fact(got[v['path']])==facts(v)for v in q['parts'])
 stage=load(d)['17'];assert stage['mapRevision']==P['compact']['revision']
 assert [x['id']for x in stage['assets']]==P['compact']['packageAssetIDs']
 save(out,'PUBLIC-HTTP.json',{'status':'EXACT_CURRENT_STAGE17_AND_RETAINED_STAGE33','verified':{MF:fact(raw),**{k:fact(v)for k,v in got.items()}},'stage17Index':[P['map'],P['library']],'stage17Compact':comp})
 return {**known,MF:facts(r['manifest']),SHELL:P['html']}
def capture(browser,out,key,case,authority):
 d=case['frame']['name'];w,h=map(int,key.split('-')[0].split('x'))
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 p=ctx.new_page();p.set_default_timeout(30000);p.add_init_script('('+O['INIT']+')()')
 need=set(P['requiredBrowser']);hits={};seen={};bad=[];blobs=set();known_count=0
 urlkey=lambda u:u[len(BASE):]if u.startswith(BASE)and '?'not in u and '#'not in u else None
 def req(q):
  k=urlkey(q.url)
  if q.method!='GET' or not(k in authority or k in MEDIA and q.resource_type=='media' or q.url.startswith('data:')or BLOB.fullmatch(q.url)):
   bad.append(('request',q.method,q.url))
 def res(r):
  nonlocal known_count
  k=urlkey(r.url)
  if k in authority and r.status==200 and not r.from_service_worker:
   known_count+=1
   if k in need:
    assert r.request.redirected_from is None and r.request.redirected_to is None
    hits.setdefault(k,[]).append(r)
  elif BLOB.fullmatch(r.url)and r.status==200:blobs.add(r.url)
  elif not(k in MEDIA and r.status in (200,206)and r.request.resource_type=='media' or r.url.startswith('data:')):bad.append(('response',r.status,r.url))
 def fail(q):
  if not(urlkey(q.url)in MEDIA and q.resource_type=='media'and q.failure=='net::ERR_ABORTED'):
   bad.append(('failed',q.url,q.failure))
 for k,f in (('request',req),('response',res),('requestfailed',fail),('pageerror',lambda x:bad.append(('pageerror',str(x))))):p.on(k,f)
 try:
  nav=p.goto(BASE+SHELL,wait_until='domcontentloaded',timeout=55_000)
  assert nav and nav.status==200 and nav.url==BASE+SHELL and not nav.from_service_worker and not nav.request.redirected_from
  assert fact(nav.body())==authority[SHELL]
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90_000)
  target={'stage':17,'catalogID':'stage-17','activeDeclaredDimensions':[6200,4600],'compactWitness':P['compact']}
  provider=p.evaluate(O['LAUNCH'],target);assert provider=={'stage':'stage-17','compact':{'revision':617,'matched':True,'assetCount':len(P['compact']['packageAssetIDs'])},'width':6200,'height':4600}
  cv=p.locator('#battlecanvas');cv.wait_for(state='visible')
  p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  pose={'stage':17,'id':'stage-17','name':d,'dx':-1,'dy':-1 if d=='northwest'else 0,'readback':False}
  if d=='west-near':pose['near']={'x':80,'y':1650,'scale':.5}
  x=p.evaluate(PARK,pose);assert p.evaluate(O['DECODE'])>0
  for i in range(2):assert p.evaluate(PARK,{**pose,'readback':True})==x
  for k in ('actual','viewport','phase','round','dpr','backing','css','physics','actualTerrainIDs','actualDrawOwnerIDs','declaredMissing'):
   assert x[k]==case['frame'][k],(key,k)
  assert x['actualDrawOwnerIDs'].count(P['owner'])==1
  wall=time.monotonic()+16
  while not need<=hits.keys()and time.monotonic()<wall:p.wait_for_timeout(100)
  assert need<=hits.keys() and not bad,(sorted(need-hits.keys()),bad)
  for k,items in hits.items():
   for r in items:assert fact(r.body())==authority[k],k
   seen[k]=authority[k]
  assert p.evaluate(PARK,{**pose,'readback':True})==x
  raw=base64.b64decode(p.evaluate(O['RAW']),validate=True)
  png=cv.screenshot(type='png')
  assert png.startswith(b'\x89PNG\r\n\x1a\n')and len(png)>4096
  assert not bad and blobs<=set(p.evaluate('()=>Array.from(__honroObserver.blobs)'))
  fn='stage17-'+key+'-steady-dom.png';(out/fn).write_bytes(png)
  return {'pose':x,'provider':provider,'servedBrowser':seen,'firstPartyResponses':known_count,
    'image':{'path':fn,**fact(png)},'historicalQAComparisonDiagnosticNotGate':{'RAW':sha(raw)==case['photoQASHA256']['RAW'],'DOM':sha(png)==case['photoQASHA256']['DOM']}}
 finally:ctx.close()
def main(out):
 from playwright.sync_api import sync_playwright
 r=ready(out);assert not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN'))
 m=firstparty(out,r);q={'status':'HOLD','release':r,'frames':{},'scope':'Two aligned anonymous Pages actual Stage17 views; no gameplay/atlas/build claim'}
 with sync_playwright()as pw:
  b=pw.chromium.launch(headless=True)
  for k,v in P['poses'].items():
   q['frames'][k]=capture(b,out,k,v,m);save(out,'PUBLIC-BROWSER.json',q)
  b.close()
 assert len(q['frames'])==2
 q['status']='EXACT_PUBLIC_STAGE17_PC_MOBILE';save(out,'PUBLIC-BROWSER.json',q)
if __name__=='__main__':{'authority':authority,'public':main}[sys.argv[1]](Path(sys.argv[2]).resolve())
