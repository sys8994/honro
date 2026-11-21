"""Public performance smoke; bootstrap only, no write or request routing."""
import hashlib, json, os, subprocess, sys, time
from pathlib import Path
H=Path(__file__).resolve().parent
OUT=None
P=json.loads((H/'PINS.json').read_bytes()); R=P['release']; BASE=P['origin']
TOP='sys8994/honro'; REF='refs/heads/qa/stage46-performance-bootstrap-r3'; MF='web/manifest.json'
ORDER=(46,)
R2_STATE='cb6512695ecc16c3b1c7c10046aaa23b4c7b46014b0aed16cf888a6cc35ab1ed'
PATHS={'.github/workflows/stage46-performance-bootstrap-r3.yml'}|{f'tools/stage46-performance/{x}' for x in ('run.py','observe.js','PINS.json')}
def sha(b): return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def want(x):return {k:x[k] for k in ('bytes','sha256')}
def read(f):return json.loads(f.read_bytes())
def dump(f,obj):f.write_text(json.dumps(obj,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
def cmd(*a):return subprocess.check_output(a,timeout=35)
def git(*a):return cmd('git','--no-replace-objects',*a)
def api(p):return json.loads(cmd('gh','api',f'repos/{TOP}/'+p))
def authority(out):
 assert (os.environ.get('GITHUB_REPOSITORY'),os.environ.get('GITHUB_EVENT_NAME'),os.environ.get('GITHUB_REF'))==(TOP,'push',REF)
 head=os.environ['GITHUB_SHA']; b=P['base']; live=R['commit']
 assert git('rev-list','-n1','--parents','HEAD').decode().split()==[head,b]
 assert len(head)==40 and git('rev-parse',b+'^{tree}').decode().strip()==P['baseTree']
 assert git('rev-parse',live+'^{tree}').decode().strip()==R['tree']
 assert git('merge-base','--is-ancestor',live,b)==b''
 assert not git('status','--porcelain=v1','-z')
 assert set(git('diff','--name-status','--no-renames',b,head).decode().splitlines())=={'A\t'+k for k in PATHS}
 assert all(git('ls-tree',head,k).split(None,1)[0]==b'100644' for k in PATHS)
 pages=api(f"actions/runs/{R['pagesRun']}"); job=api(f"actions/jobs/{R['pagesJob']}")
 assert (pages['id'],pages['head_sha'],pages['head_branch'],pages['name'],pages['status'],pages['conclusion'])==(R['pagesRun'],live,'master','pages build and deployment','completed','success')
 assert pages['repository']['full_name']==pages['head_repository']['full_name']==TOP
 assert (job['id'],job['run_id'],job['name'],job['status'],job['conclusion'])==(R['pagesJob'],R['pagesRun'],'deploy','completed','success')
 d=[s for s in job['steps'] if s['name']=='Deploy to GitHub Pages'];assert len(d)==1 and d[0]['conclusion']=='success'
 def pinned(c,p):return git('show',c+':'+p)
 m=pinned(live,MF); assert fact(m)==want(R['retainedManifest']) and hashlib.sha1(f'blob {len(m)}\0'.encode()+m).hexdigest()==R['retainedManifest']['git']
 ids={x['path']:want(x) for x in json.loads(m)['files']}
 assert all(fact(pinned(live,k))==fact(pinned(b,k))==v and (k=='HONRO.html' or ids[k]==v) for k,v in P['resources'].items())
 assert P['common'][2].encode() in pinned(live,'HONRO.html')
 c=json.loads(pinned(live,P['campaign']))
 for n in ORDER:
  s=P['stages'][str(n)]; assert [c['stages'][n-1],c['stageLibraries'][n-1]]==s['required'][:2]
  assert json.loads(pinned(live,s['required'][0]))['metadata']['stageId']==n
 v=json.loads(pinned(live,P['stages']['46']['required'][1]))
 assert P['splitOrder']==[p['path'] for p in v['parts']]
 assert fact(b''.join(pinned(live,x) for x in P['splitOrder']))==want(v)
 # No prewarming the actual Pages origin in authority step.
 dump(out/'AUTHORITY.json',{'head':head,'base':b,'release':R,'status':'EXACT_AUTHORITY_NO_PUBLIC_PREFETCH'})
def path(url):
 if url.startswith(BASE):
  p=url[len(BASE):]
  if p and not any(c in p for c in '?&#'):return p
 return None
def summarize(stamps,visits,assets,req):
 def td(e,s):
  z=stamps[e]-stamps[s];assert 0<=z<120000,(e,s,z)
  return z
 assert [r['label'] for r in visits]==['A-stable-start','B-first-visit','B-repeat','A-return']
 assert [r['camera'][:2] for r in visits]==[[2048,3252],[2048,4300],[2048,4300],[2048,3252]]
 assert all(r['camera'][2:]==[.5,2] and 0<=r['cpuMS']<120000 for r in visits)
 assert len(assets)==len(req)==len({x['path'] for x in assets}) and {x['path'] for x in assets}==set(req)
 assert all(0<=x['startTime']<=x['responseEnd'] and x['encodedBodySize']>=0 and x['transferSize']>=0 for x in assets)
 a,b,redo,back=visits
 verdict=('OBSERVED_NATIVE_TILE_BUILD_THEN_REUSE'
          if a['delta']['domainTileBuilds']==0 and b['delta']['domainTileBuilds']>0 and
               redo['delta']['domainTileBuilds']==0 and back['delta']['domainTileBuilds']==0
          else 'NO_CLEAN_FIRST_VISIT_VS_REUSE_CONTRAST')
 return {'ensureStageMS':td('ensureEnd','ensureStart'),'appLaunchCpuMS':td('launchEnd','launchStart'),
   'firstControlledNativeRenderCpuMS':td('firstControlledRenderEnd','firstControlledRenderStart'),
   'firstControlledTwoRafProxyMS':td('firstControlledTwoRAF','firstControlledRenderEnd'),
   'firstMediaReadyNativeRenderCpuMS':td('firstMediaReadyRenderEnd','firstMediaReadyRenderStart'),
   'sequenceObservation':verdict,'actualTimedPoses':visits,
   'stageOwnedHttpFirstRequestToLastResponseMS':max(x['responseEnd'] for x in assets)-min(x['startTime'] for x in assets),
   'stageOwnedEncodedResponseBodyBytes':sum(x['encodedBodySize'] for x in assets),
   'stageOwnedDecodedResponseBodyBytes':sum(x['decodedBodySize'] for x in assets),
   'stageOwnedResourceTimingTransferBytes':sum(x['transferSize'] for x in assets),
   'scope':'Only one timed visit sequence after A stabilized; first B location visit, not cold browser or known cache miss unless actual counters increase. CPU submit, not presentation/GPU.'}
def visit(sid,out):
 from playwright.sync_api import sync_playwright
 from PIL import Image
 from io import BytesIO
 assert read(out/'AUTHORITY.json')['release']==R and not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN'))
 q=P['stages'][str(sid)]; req=set(q['required']); pins={k:P['resources'][k] for k in req|set(P['common'])}
 o={'stage':sid,'stageOwner':q['owner'],'release':R['commit'],'status':'INIT','cache':'fresh Chromium process/context; ordinary caches allowed; no routing, cache override or prefetch by harness','boundaries':{}}
 target=out/f'STAGE-{sid:02}.json'
 def save():dump(target,o)
 save()
 error=None; seen={}; requests={}; fails=[]; off=[]
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True)
  try:
   assert b.version==P['browser'],b.version
   o['browser']=b.version
   ctx=b.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,service_workers='block')
   assert ctx.storage_state()=={'cookies':[],'origins':[]}
   pg=ctx.new_page(); pg.add_init_script(path=str(H/'observe.js'))
   cdp=ctx.new_cdp_session(pg); cdp.send('Network.enable')
   def req_seen(m):
    rel=path(m['request']['url'])
    if rel in pins:
     requests[m['requestId']]={'path':rel,'fromRequestServedFromCache':False}
   def request_cached(m):
    if m['requestId'] in requests:requests[m['requestId']]['fromRequestServedFromCache']=True
   def cdp_headers(m):
    t=requests.get(m['requestId'])
    if t is not None:
     r=m['response'];t.update({k:bool(r.get(k)) for k in ['fromDiskCache','fromServiceWorker','fromPrefetchCache']})
   cdp.on('Network.requestWillBeSent',req_seen);cdp.on('Network.requestServedFromCache',request_cached);cdp.on('Network.responseReceived',cdp_headers)
   def envelope(r):
    rel=path(r.url)
    if rel in pins:
     seen.setdefault(rel,[]).append(r)
   def request_fail(r):
    if r.method!='GET' or (path(r.url) in pins or r.is_navigation_request()):fails.append([path(r.url),r.failure])
   pg.on('response',envelope);pg.on('requestfailed',request_fail)
   pg.on('request',lambda r:off.append([r.method,r.url]) if r.method not in ('GET','HEAD') else None)
   pg.on('pageerror',lambda e:fails.append(['pageerror',str(e)]))
   o['status']='COLD_NAV';save()
   dom=pg.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=55000)
   assert dom and dom.status==200 and dom.url==BASE+'HONRO.html'
   pg.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&!!window.HonroCampaignLoader",timeout=45000)
   pg.evaluate("Stage46Perf.stamp('shellReady')")
   o['status']='STAGE_ENSURE_AND_FRAMES';save()
   replay=pg.evaluate("q=>Stage46Perf.enter(q.id,q)",{**q,'id':sid})
   timing=pg.evaluate("q=>Stage46Perf.timeline(q.paths,q.base)",{'paths':sorted(pins),'base':BASE})
   source=[x for x in timing['paths'] if x['path'] in req]
   o.update({'realResourceTiming':timing,'verificationCacheSignals':list(requests.values()),'pose':{k:v for k,v in replay.items() if k not in ('signature','stamps','visits')},
             'timedSequence':replay['visits'],'browserStamps':replay['stamps'],'protectedStateSHA256':sha(replay['signature'].encode())})
   o['status']='POST_TIMING_IDENTITY';save()
   o['metrics']=summarize(replay['stamps'],replay['visits'],source,req)
   assert o['protectedStateSHA256']==R2_STATE,('R2 canonical state mismatch',o['protectedStateSHA256'])
   assert not off and not fails,(off,fails)
   actual={}
   for rel,want_ in pins.items():
    assert len(seen.get(rel,[]))==1,(rel,'must observe exactly one pinned response')
    r=seen[rel][0]; observed=fact(r.body())
    assert r.url==BASE+rel and r.status==200 and r.request.method=='GET' and observed==want_,(rel,observed)
    actual[rel]=observed
   # Content identity on resource timing is distinct from verified decode body bytes.
   assert all(x['decodedBodySize']==pins[x['path']]['bytes'] and x['encodedBodySize']>0 for x in source)
   assert all(not t.get('fromDiskCache') and not t.get('fromServiceWorker') for t in requests.values() if t['path'] in req)
   o['verifiedBodies']=actual
   img=pg.locator('#battlecanvas').screenshot(timeout=12000)
   with Image.open(BytesIO(img)) as im:
    im.load(); assert im.width==1440 and im.height>0
    pixels=im.convert('RGBA').tobytes(); assert len(set(pixels))>8
    o['screenshot']={'pixels':list(im.size),'pngSHA256':sha(img),'rgbaSHA256':sha(pixels)}
   (out/f'STAGE-{sid:02}-ordinary.png').write_bytes(img)
   o['status']='PASS_BOOTSTRAP_STAGE'; save()
  except Exception as exc:
   error=exc; o.update(error=type(exc).__name__+': '+str(exc),observedFailures=fails,priorStatus=o['status'],status='HOLD')
   if 'pg' in locals():
    try:
     partial=pg.evaluate('globalThis.Stage46Perf?.diagnostics()??null')
     if partial:o.update(partialBrowserStamps=partial['trail'],partialInvariants=partial['guards'])
    except Exception:pass
   save()
  finally:b.close()
 if error is not None:raise error
def suite(out):
 receipt={'order':ORDER,'stages':{},'status':'INIT_BOOTSTRAP','scope':'one pinned public Stage46 native cache visit sequence, no baseline stage loops, no A/B product change'}
 for sid in ORDER:
  t0=time.monotonic()
  rc='timeout'
  try:rc=subprocess.run([sys.executable,str(Path(__file__).resolve()),'stage',str(out),str(sid)],timeout=P['stages'][str(sid)]['outerSeconds']).returncode
  except subprocess.TimeoutExpired:pass
  f=out/f'STAGE-{sid:02}.json'; obj=read(f) if f.exists() else {'status':'MISSING'}
  receipt['stages'][str(sid)]={'pass':rc==0 and obj['status']=='PASS_BOOTSTRAP_STAGE','processExit':rc,'lastStageStatus':obj['status'],'runnerDiagnosticWallSeconds':time.monotonic()-t0}
  dump(out/'BOOTSTRAP.json',receipt)
 ok=all(v['pass'] for v in receipt['stages'].values());receipt['status']='PASS_READ_ONLY_BOOTSTRAP' if ok else 'HOLD_NO_BASELINE';dump(out/'BOOTSTRAP.json',receipt)
 assert ok
if __name__=='__main__':
 mode,out=sys.argv[1:3];out=Path(out).absolute()
 if mode=='authority':authority(out)
 elif mode=='suite':suite(out)
 elif mode=='stage':visit(int(sys.argv[3]),out)
 else:raise SystemExit(2)
