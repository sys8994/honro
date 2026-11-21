"""Read-only actual Pages Stage28: canonical bytes + unmasked candidate-native RGBA."""
import base64,datetime as dt,hashlib,io,json,os,re,subprocess,sys,time,traceback
from pathlib import Path
from urllib.request import HTTPRedirectHandler,Request,build_opener
H=Path(__file__).resolve().parent
def distinct(b):
 def pairs(x):
  d=dict(x);assert len(x)==len(d),'duplicate JSON members';return d
 return json.loads(b,object_pairs_hook=pairs)
P=distinct((H/'PINS.json').read_bytes())
R=P['release'];PRE=P['previousPages'];OLD=P['priorCommit'];N=P['normalAuthority']
TOP='sys8994/honro';REF='refs/heads/qa/stage28-public-readback-r2'
BASE='https://sys8994.github.io/honro/'
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[a-f0-9-]{36}')
SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
MF='web/manifest.json';HTML='HONRO.html'
FILES={'.github/workflows/stage28-public-readback.yml',*(f'tools/stage28-public-readback/{k}'for k in ('PINS.json','proof.py','park.js','observe.js','stock-observer.json'))}
MEDIA=set(f'assets/bgm/{k}.mp3'for k in ('main','battle-1','battle-2','battle-3','battle-4'))
DIRECTIONS={'north':(0,-1),'east':(1,0),'south':(0,1),'west':(-1,0),'northwest':(-1,-1),'northeast':(1,-1),'southwest':(-1,1),'southeast':(1,1)}
SCREEN=r"""() => {
 const s=HonroApp.scene,c=s.canvas,r=s.renderCacheStats();
 const caches=['_screenWorldCache','_screenBackgroundCache','_screenForegroundCache'].map(k=>{
  const q=s[k]; return {registered:typeof q?.key==='string',size:q?.canvas?[q.canvas.width,q.canvas.height]:null,bytes:q?.bytes??null};
 });
 const fields=['worldBuilds','bgBuilds','screenBuilds','screenWorldBytes','screenBackgroundBytes','screenForegroundBytes',
   'worldBytes','worldScale','backgroundBytes','domainCanvasAllocations','domainTileBuilds'];
 if(fields.some(k=>r[k]!=null&&!Number.isFinite(r[k])))throw Error('invalid native cache counters');
 return {caches,structural:Object.fromEntries(fields.map(k=>[k,r[k]??0])),
   hits:Object.fromEntries(['worldHits','bgHits','screenHits'].map(k=>[k,r[k]??0])),
   backing:[c.width,c.height]};
}"""
OUT=None
proof={'status':'INIT','frames':{},'visits':[],'failures':[],'scope':'Anonymous production Stage28 actual native capture only, first-aim clean QA prerequisite and bounded diagnostic camera; not campaign completion. R6 historical aggregate HOLD unchanged; Stage3 R7 separate.'}
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def want(d):return {k:d[k]for k in ('bytes','sha256')}
def hx(x,n):return type(x)is str and len(x)==n and bool(re.fullmatch(r'[0-9a-f]+',x)) and set(x)!={'0'}
def pos(x):return type(x)is int and x>0
def valid(d):return pos(d['bytes']) and hx(d['sha256'],64)
def save(k,v):(OUT/k).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def log():save('BROWSER.json',proof)
def git(*a):return subprocess.check_output(['git',*a],timeout=40)
def show(c,p):return git('show',c+':'+p)
def inv(d):
 a={v['path']:want(v)for v in d['files']};assert len(a)==len(d['files'])==810;return a
def graph_id(x):return sha(json.dumps(x,sort_keys=True,separators=(',',':')).encode())
def require_release():
 assert R['enabled'] is True,'DISABLED: exact retained Stage28 master and successful Pages required'
 m=R['retainedManifest']; ret=R['retainerAuthority']
 assert all(hx(x,40)for x in (R['commit'],R['tree'],m['git'],ret['head']))
 assert all(hx(x,64)for x in (R['retainedPreviousGraphSHA256'],R['normalManifestWithoutHistory'],ret['receiptSHA256']))
 assert valid(m) and valid(ret['artifact']) and all(pos(x)for x in (R['pagesRun'],R['pagesJob'],ret['job'],ret['run'],ret['artifact']['id']))
 assert m['bytes']<=12<<20 and m['sha256'] not in (PRE['manifest']['sha256'],P['normalManifestR6']['sha256'])
 assert dt.datetime.fromisoformat(R['publishedAt']).tzinfo is not None
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(TOP,'push',REF)
def registry(m):
 rows=[*m['files'],*m.get('previousFiles',[])]
 for group in m.get('previousGenerations',[]):rows.extend(group)
 for group in m.get('publishedGenerations',[]):rows.extend(group['files'])
 r={}
 for x in rows:
  k=x['path'];value=want(x)
  assert re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[a-zA-Z0-9_.-]+',k) and valid(value)
  assert k not in r or r[k]==value,('conflicting immutable registry',k)
  r[k]=value
 return r
def established():
 require_release()
 head=os.environ['GITHUB_SHA'];live=R['commit'];m=R['retainedManifest']
 assert git('rev-list','--parents','-n1','HEAD').decode().split()==[head,live]
 assert git('rev-list','--parents','-n1',live).decode().split()==[live,OLD]
 assert all(git('rev-parse',c+'^{tree}').decode().strip()==t for c,t in ((OLD,P['priorTree']),(live,R['tree'])))
 assert not git('status','--porcelain=v1','-z')
 assert set(git('diff','--name-status','--no-renames',live,head).decode().splitlines())=={'A\t'+k for k in FILES}
 assert all(git('ls-tree',head,k).split(None,1)[0]==b'100644'for k in FILES)
 sk=P['source']['path'];mod=SHELL|{MF,sk};add=set(P['newURLs'])
 assert sk=='shared/map/terrain-domain.js' and len(mod)==5 and len(add)==4
 assert set(git('diff','--name-status','--no-renames',OLD,live).decode().splitlines())=={'M\t'+k for k in mod}|{'A\t'+k for k in add}
 assert all(git('ls-tree',live,k).split(None,1)[0]==b'100644'for k in mod|add)
 for c,k in ((OLD,'old'),(live,'new')):
  b=show(c,sk);assert {**fact(b),'git':blob(b)}==P['source'][k]
 for c,table in ((live,{**P['newURLs'],**P['oldURLs'],**P['shells'],**P['resources']}),(OLD,{**P['oldURLs'],**P['priorShells']})):
  assert all(fact(show(c,k))==v for k,v in table.items())
 assert all(fact((H/k).read_bytes())==v for k,v in P['observers'].items())
 raw,old=show(live,MF),show(OLD,MF)
 assert fact(raw)==want(m) and blob(raw)==m['git'] and fact(old)==want(PRE['manifest']) and blob(old)==PRE['manifest']['git']
 lg,og=distinct(raw),distinct(old);a,b=inv(og),inv(lg)
 omit={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 assert graph_id({k:v for k,v in lg.items()if k not in omit})==R['normalManifestWithoutHistory']
 assert graph_id(b)==P['graphB'] and graph_id(a)==P['graphA']
 assert a.keys()-b.keys()==P['oldURLs'].keys() and b.keys()-a.keys()==P['newURLs'].keys()
 assert all(a[k]==b[k]for k in a.keys()&b.keys())
 hist=[g for g in lg['publishedGenerations'] if g['sourceSha']==OLD]
 assert len(hist)==1 and hist[0]['files']==og['files'] and hist[0]['publishedAt']==PRE['publishedAt']
 assert hist[0]['publishedAtPrecision']=='instant' and hist[0]['evidence']==f"https://github.com/{TOP}/actions/runs/{PRE['run']}"
 assert hist[0]['graphSha256']==R['retainedPreviousGraphSHA256']
 ra,rb=registry(og),registry(lg)
 assert len(ra)==1317 and len(rb)==1321 and not set(ra)&set(P['newURLs']) and rb=={**ra,**P['newURLs']}
 return {**b,**P['shells'],MF:want(m)}
def api(p):return distinct(subprocess.check_output(['gh','api','-X','GET',f'repos/{TOP}/'+p],timeout=35))
def artifact(run,pins):
 a=api(f'actions/runs/{run}/artifacts?per_page=100')['artifacts']
 for w in pins:
  s=[v for v in a if v['id']==w['id']]
  assert len(s)==1 and not s[0]['expired'] and s[0]['size_in_bytes']==w['bytes'] and s[0]['digest']=='sha256:'+w['sha256']
def job(run,pin,name,verdict):
 j=api(f'actions/jobs/{pin}')
 assert (j['id'],j['run_id'],j['name'],j['status'],j['conclusion'])==(pin,run,name,'completed',verdict)
 return j
def run(pins):
 v=api(f"actions/runs/{pins['run']}")
 assert (v['id'],v['head_sha'],v['status'],v['conclusion'])==(pins['run'],pins['head'],'completed',pins['conclusion'])
 assert v['repository']['full_name']==v['head_repository']['full_name']==TOP
 return v
def cert_body():
 return {'status':'EXACT_MASTER_AND_SUCCESSFUL_PAGES','release':R,'independentNormal':N,'tokenlessNext':True}
def authority():
 established()
 live=R['commit']
 assert api('git/ref/heads/master')['object']['sha']==live,'master advanced: do not reuse pins'
 v=run(dict(run=R['pagesRun'],head=live,conclusion='success'))
 assert (v['head_branch'],v['name'])==('master','pages build and deployment')
 j=job(R['pagesRun'],R['pagesJob'],'deploy','success')
 step=[s for s in j['steps']if s['name']=='Deploy to GitHub Pages']
 assert len(step)==1 and (step[0]['status'],step[0]['conclusion'])==('completed','success')
 stamp=dt.datetime.fromisoformat(R['publishedAt'])
 assert dt.datetime.fromisoformat(step[0]['started_at'])<=stamp<=dt.datetime.fromisoformat(j['completed_at'])+dt.timedelta(seconds=1)
 for n in N.values():
  a=run(n)
  assert (a['head_branch'],a['path'],a['run_attempt'])==(n['branch'],n['workflow'],n['attempt'])
  job(n['run'],n['job'],n['jobName'],n['conclusion']);artifact(n['run'],n['artifacts'])
 ret=R['retainerAuthority']
 run({**ret,'conclusion':'success'});job(ret['run'],ret['job'],ret['jobName'],'success');artifact(ret['run'],[ret['artifact']])
 save('PAGES-AUTHORITY.json',cert_body())
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*a,**kw):raise RuntimeError('public canonical response redirected')
def http(k,limit):
 p=BASE+k;r=Request(p,headers={'Accept-Encoding':'identity'})
 with build_opener(NoRedirect).open(r,timeout=25)as y:
  assert y.status==200 and y.geturl()==p
  b=y.read(limit+1);assert len(b)<=limit,(k,'served excess bytes')
  return b
def anonymous():
 assert not(os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN'))
 pins=established();assert distinct((OUT/'PAGES-AUTHORITY.json').read_bytes())==cert_body()
 obs={MF:fact(http(MF,12<<20))}
 if obs[MF]!=pins[MF]:
  proof['status']='HOLD_PRIOR_MANIFEST_STILL_SERVED' if obs[MF]['sha256']==PRE['manifest']['sha256'] else 'HOLD_UNRECOGNIZED_PUBLIC_MANIFEST'
  save('HTTP-PUBLIC.json',{'status':proof['status'],'actual':obs[MF],'wanted':pins[MF]})
  raise RuntimeError(proof['status'])
 raw={}
 for k,v in sorted({**P['oldURLs'],**P['newURLs'],**P['resources'],**P['shells']}.items()):
  raw[k]=http(k,v['bytes']);obs[k]=fact(raw[k]);assert obs[k]==v,('wrong canonical public bytes',k)
 obs['root/']=fact(http('',pins['index.html']['bytes']));assert obs['root/']==pins['index.html']
 b=P['binding'];c=distinct(raw[b['campaign']])
 assert len(c['stages'])==len(c['stageLibraries'])==50
 assert (c['stages'][27],c['stageLibraries'][27],c['base'],c['shared'])==(b['map'],b['packet'],b['base'],b['shared'])
 assert distinct(raw[b['map']])['metadata']['stageId']==28
 assert next(k for k in P['newURLs']if k.startswith('web/entries/game.') and k.endswith('.js')).rsplit('/',1)[-1].encode()in raw[HTML]
 assert next(k for k in P['newURLs']if k.startswith('web/entries/workshop.')).rsplit('/',1)[-1].encode()in raw['HONRO_WORKSHOP.html']
 save('HTTP-PUBLIC.json',{'status':'EXACT_PUBLIC_FOUR_OLD_FOUR_NEW','oldRegistryEntries':1317,'newRegistryEntries':1321,'verified':obs,'stage28Binding':b})
 return pins
def path(u):
 return u[len(BASE):] if u.startswith(BASE) and not any(a in u for a in '?#') else None
def rgba(data):
 from PIL import Image
 with Image.open(io.BytesIO(data))as im:
  im.load();a=im.convert('RGBA');return {'size':list(a.size),'rgba':sha(a.tobytes())}
def close_visit(page,needs,checked,errors,todo,hits,seen,pins):
 ix=0;q=0;end=time.monotonic()+20
 while time.monotonic()<end:
  assert not errors,errors
  while ix<len(hits)and hits[ix][1].request not in todo:
   k,r=hits[ix];rec=fact(r.body());assert rec==pins[k],('browser fetched incorrect bytes',k)
   checked[k]=rec;ix+=1
  before=(ix,len(seen));page.wait_for_timeout(105)
  q=q+1 if before==(len(hits),len(seen))and not todo and needs<=checked.keys() else 0
  if q==3:
   assert seen<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)'))
   return
 raise RuntimeError(('missing required real app body',sorted(needs-checked.keys()),sorted(r.url for r in todo),errors))
def screen_intrinsic(x):
 # Counter history is not a cache allocation or canvas shape. The absolute values
 # are still stored and settled same-pose increments are separately mandatory.
 return {'caches':x['caches'],'backing':x['backing'],
         'structural':{k:v for k,v in x['structural'].items()if k!='screenBuilds'}}
def screen_counters(x):
 return {'screenBuilds':x['structural']['screenBuilds'],**x['hits']}
def counter_delta(before,after):
 a,b=screen_counters(before),screen_counters(after)
 assert a.keys()==b.keys() and all(type(a[k])is int and type(b[k])is int and 0<=a[k]<=b[k]for k in a)
 return {k:b[k]-a[k]for k in a}
def failure_detail(e):
 # Local traceback retains the earliest failed source statement, without env dumps.
 return {'reason':repr(e),'trace':traceback.format_exc()}
def capture(browser,pins,key,v):
 w,h=v['device']
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 state={'device':[w,h],'status':'INIT','errors':[],'observed':{},'views':[]}
 proof['visits'].append(state);log()
 try:
  assert ctx.storage_state()=={'cookies':[],'origins':[]}
  page=ctx.new_page();page.set_default_timeout(30000)
  O=distinct((H/'stock-observer.json').read_bytes());park=(H/'park.js').read_text();native=(H/'observe.js').read_text()
  page.add_init_script('('+O['INIT']+')()')
  errors=state['errors'];checked=state['observed'];todo=set();hits=[];seen=set()
  def request(r):
   k=path(r.url)
   if r.method!='GET' or not(k in pins or k in MEDIA and r.resource_type=='media' or BLOB.fullmatch(r.url) or r.url.startswith('data:')):
    errors.append(['unexpected request',r.method,r.url])
   if k in pins:todo.add(r)
  def failed(r):
   todo.discard(r)
   if not(path(r.url)in MEDIA and r.resource_type=='media' and r.failure=='net::ERR_ABORTED'):errors.append(['failed',r.url,r.failure])
  def response(r):
   k=path(r.url)
   if k in pins and r.status==200 and not r.from_service_worker:hits.append((k,r))
   elif BLOB.fullmatch(r.url)and r.status==200:seen.add(r.url)
   elif k in MEDIA and r.status in (200,206) and r.request.resource_type=='media':pass
   elif not r.url.startswith('data:'):errors.append(['unexpected response',r.status,r.url])
  for event,cb in [('request',request),('requestfinished',lambda r:todo.discard(r)),('requestfailed',failed),('response',response),('pageerror',lambda e:errors.append(['pageerror',str(e)]))]:
   page.on(event,cb)
  nav=page.goto(BASE+HTML,wait_until='domcontentloaded',timeout=50000)
  assert nav and nav.url==BASE+HTML and nav.status==200 and not nav.from_service_worker
  n=nav.request
  assert n.url==BASE+HTML and n.method=='GET' and n.resource_type=='document' and n.is_navigation_request() and n.frame==page.main_frame
  assert n.redirected_from is None and n.redirected_to is None
  checked[HTML]=fact(nav.body());assert checked[HTML]==pins[HTML]
  state['navigationDocument']=checked[HTML]
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  p=v['provider'];expected={'stage':28,'catalogID':p['stage'],'activeDeclaredDimensions':[p['width'],p['height']]}
  state['actualProvider']=page.evaluate(O['LAUNCH'],expected);assert state['actualProvider']==p
  page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  assert v['directions']==list(DIRECTIONS)
  for name in v['directions']:
   k=f'{key}-{name}';ref=P['frames'][k]; dx,dy=DIRECTIONS[name]
   p={'stage':28,'id':v['provider']['stage'],'name':name,'dx':dx,'dy':dy,'readback':False}
   rec=proof['frames'][k]={'phases':{},'errors':[]};state['activeFrame']=k
   try:
    start=page.evaluate(park,p)
    rec['images']=page.evaluate(O['DECODE'])
    rec['imageSnapshotDiagnostic']={'actualDecoded':rec['images'],'R6Snapshot':ref['images'],
                                    'objectCountExact':rec['images']==ref['images']}
    # Exact R6 native contract: fonts loaded and every currently registered,
    # nonempty-src image complete and decoded. Never skip normal phase draws
    # merely because the browser instantiated asynchronous preload objects
    # earlier or later than in the localhost run.
    assert type(rec['images'])is int and rec['images']>0,('no canonical decoded images',k)
    rec['phaseOrder']=[]
    previous=None
    rec['physics']={i:start[i]for i in ref['physics']}; log()
    for phase in ('phase1','phase2','repeat1','repeat2'):
     here=page.evaluate(park,{**p,'readback':True});row=rec['phases'][phase]={'sameCameraAndPhysics':here==start}
     row['native']=page.evaluate(native,{'stage':28,'depth':27400})
     raw=base64.b64decode(page.evaluate(O['RAW']),validate=True)
     fn=f'public-{k}-{phase}-raw.png';row['file']=fn;(OUT/fn).write_bytes(raw)
     row['png']=fact(raw);row.update(rgba(raw));row['screen']=page.evaluate(SCREEN)
     pp=ref['phases'][phase]
     row['counterHistory']={'observed':screen_counters(row['screen']),'R6':screen_counters(pp['screen'])}
     row['exact']={'physics':rec['physics']==ref['physics'] and row['sameCameraAndPhysics'],
       'rgba':row['rgba']==pp['rgba'] and row['size']==ref['physics']['backing'],'native':row['native']==pp['native'],
       'intrinsicScreen':screen_intrinsic(row['screen'])==screen_intrinsic(pp['screen'])}
     if previous is not None:
      got=counter_delta(rec['phases'][previous]['screen'],row['screen'])
      expected=counter_delta(ref['phases'][previous]['screen'],pp['screen'])
      row['counterHistory']['fromPriorSample']={'observed':got,'R6':expected}
      if phase.startswith('repeat'):
       row['exact']['settledR6CounterDelta']=got==expected
       row['exact']['settledNativeRaw']=row['rgba']==rec['phases']['phase2']['rgba']
     rec['phaseOrder'].append(phase);previous=phase
     if phase.startswith('repeat') and all(row['exact'].values()) and row['png']==rec['phases']['phase2']['png']:
      (OUT/fn).unlink();row['file']=rec['phases']['phase2']['file'];row['repeatDuplicateNotArchived']=True
     log()
    assert rec['phaseOrder']==['phase1','phase2','repeat1','repeat2']
    rec['pass']=all(all(r['exact'].values())for r in rec['phases'].values())
    assert rec['pass'],('public vs R6 B strictly phase-matched complete RGBA/state',k,{s:r['exact']for s,r in rec['phases'].items()})
    state['views'].append(k)
   except Exception as e:
    rec['pass']=False; rec['errors'].append(failure_detail(e));proof['failures'].append({'pose':k,**rec['errors'][-1]})
    # Preserve actual first failure imagery when a verifier failed before its raw read.
    try:(OUT/f'public-{k}-HOLD-raw.png').write_bytes(base64.b64decode(page.evaluate(O['RAW']),validate=True))
    except Exception:pass
    log()
  close_visit(page,set(v['required'])-{'HONRO.html'},checked,errors,todo,hits,seen,pins)
  state['networkVerified']=True
  state['status']='PASS' if len(state['views'])==8 and not errors else 'HOLD_NATIVE_FRAME'
  del state['activeFrame'];log()
 finally:ctx.close()
def app():
 try:
  pins=anonymous()
  from playwright.sync_api import sync_playwright
  with sync_playwright()as w:
   b=w.chromium.launch(headless=True)
   try:
    proof['chrome']=b.version;assert b.version==P['chrome']
    for key in ('s28-1440x900','s28-390x844'):
     try:capture(b,pins,key,P['visits'][key])
     except Exception as e:proof['failures'].append({'device':key,'reason':repr(e),'trace':traceback.format_exc()});log()
   finally:b.close()
  assert not proof['failures'] and set(proof['frames'])==set(P['frames']) and len(proof['visits'])==2
  assert all(x['status']=='PASS'for x in proof['visits']) and all(x['pass'] for x in proof['frames'].values())
  assert fact(http(MF,12<<20))==pins[MF],'public manifest changed during capture'
  proof.update(status='PASS_EXACT_PUBLIC_STAGE28_NATIVE_16_VIEWS',release=R['commit'],actualViews=16,matchedPhaseFrames=32)
 except Exception as e:
  if not proof['status'].startswith('HOLD'):proof['status']='HOLD'
  proof['failure']=repr(e);raise
 finally:log()
if __name__=='__main__':
 mode=sys.argv[1];OUT=Path(sys.argv[2]);assert OUT.is_dir()
 if mode=='authority':
  try:authority()
  except Exception as e:save('AUTHORITY-HOLD.json',{'status':'HOLD_BEFORE_PUBLIC_LOAD','reason':repr(e)});raise
 elif mode=='app':app()
 else:raise RuntimeError('expected authority or app')
