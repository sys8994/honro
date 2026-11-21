"""A-only official native observer feasibility pilot. No network outside browser fixture or Git writes."""
import argparse,base64,hashlib,io,json,mimetypes,os,re,subprocess,time,traceback
from pathlib import Path
from urllib.parse import urlsplit
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread,Lock
from collections import Counter
import contextlib
H=Path(__file__).resolve().parent
PIN=json.loads((H/'PINS.json').read_bytes())
NATIVE=(H/'native.js').read_text()
SCENE=(H/'scene.js').read_text()
BASE=PIN['base']
R1='c02cee384bbb42eafc543cfb6426d135c3aee62c'
SHELL='HONRO.html'; MAN='web/manifest.json'
MEDIA=re.compile(r'assets/bgm/(?:main|battle-[1-4])\.mp3')
PATH=re.compile(r'[a-zA-Z0-9_.-]+(?:/[a-zA-Z0-9_.-]+)*')
MEDIA_PINS={
 'assets/bgm/main.mp3':{'bytes':4741261,'sha256':'a2ffcceb9b0045f72e6baeab7292fd503fd92c4969d727009c057a60cbaca5fd'},
 'assets/bgm/battle-1.mp3':{'bytes':4416906,'sha256':'3671f34895c9f80d5d04466a440c19420e3d0ea42acc4461a6dcb7ffb974b614'},
}
R1_NONMEDIA=(282,'d41464df35af553a7bfecb489038c98430766bf656609f84661418ed26976943')
PHASES=('first','allocate','hit')
TAGS=['landmark:before','original-root:after','body:after','surface:after','props:after','props:after','landmark:after']
if not __debug__:raise RuntimeError('strict pilot requires assertions')
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def canon(x):return json.dumps(x,ensure_ascii=True,sort_keys=True,separators=(',',':')).encode()
def save(p,x):
 t=p.with_name(p.name+'.tmp');t.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n');t.replace(p)
def pathpart(path):
 p=path[1:]
 return p if path.startswith('/') and PATH.fullmatch(p) and not {'.','..'}.intersection(p.split('/')) else None
def parts(url,origin):
 u=urlsplit(url)
 if (u.scheme,u.netloc,u.query,u.fragment)!=('http',urlsplit(origin).netloc,'',''):return None
 return pathpart(u.path)
def git(repo,*a):return subprocess.check_output(['git','--no-replace-objects','-C',str(repo),*a])
def secure(repo,official):
 g=lambda *a:git(repo,*a).decode().strip()
 assert PIN['status']=='DISABLED_NOT_RELEASE'
 assert g('rev-parse',BASE+'^{commit}')==BASE and g('rev-parse',BASE+'^{tree}')==PIN['tree']
 assert g('rev-parse',BASE+':shared/runtime/renderer.js')==PIN['rendererGit']
 assert g('rev-parse',BASE+':shared/runtime/act5-edge-art.js')==PIN['edgeGit']
 if official:
  head=os.environ['GITHUB_SHA'];here='tools/stage42-native-observer-pilot/'
  assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',PIN['ref'])
  assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
  assert head==g('rev-parse','HEAD') and g('rev-list','--parents','-n1',head).split()==[head,R1]
  assert g('rev-list','--parents','-n1',R1).split()==[R1,BASE]
  assert set(g('diff','--no-renames','--name-status',R1,head).splitlines())=={
     'M\t.github/workflows/stage42-stock-native-observer-pilot.yml','M\t'+here+'pilot.py'}
  files={'A\t'+here+n for n in ('PINS.json','native.js','pilot.py','scene.js')}
  files.add('A\t.github/workflows/stage42-stock-native-observer-pilot.yml')
  assert set(g('diff','--no-renames','--name-status',BASE,head).splitlines())==files
  assert not g('status','--porcelain=v1','--untracked-files=all')
  return head
 return None
def closure(get):
 for p,f in PIN['file'].items():assert fact(get(p))==f,p
 m=json.loads(get(MAN));c=json.loads(get(PIN['campaignFile']));s=json.loads(get(PIN['stageMap']));a=json.loads(get(PIN['stageAssetFile']))
 active={r['path']:{'bytes':r['bytes'],'sha256':r['sha256']}for r in m['files']}
 assert len(active)==len(m['files'])==810 and sha(canon(active))==PIN['activeSignature']
 for p,f in PIN['file'].items():
  if p not in (MAN,SHELL):assert active[p]==f
 assert m['project']==PIN['campaignFile'] and m['gameEntry']=='web/entries/game.df8a4c7f1873e38c.js'
 assert [i for i,r in enumerate(c['catalog'])if r['metadata']['stageId']==42]==[41]
 assert c['stages'][41]==PIN['stageMap'] and c['stageLibraries'][41]==PIN['stageAssetFile']
 assert c['stageLibraries'].count(PIN['stageAssetFile'])==1 and c['assetPaths']['stageLibraries'][41]==[] and c['assetEncodings']['stageLibraries'][41]=='json'
 assert s['id']=='stage-42' and [p for p in s['elements']if p['id']=='a5-near']==[{'id':'a5-near','assetId':'act5:near:42',
  'x':0,'y':0,'scale':6500/2022,'rotation':0,'layer':'structural-back','depthLayer':'L1','visualRole':'scenery'}]
 assert [row['id']for row in a]==['act5:near:42']
 return {**active,SHELL:PIN['file'][SHELL],MAN:PIN['file'][MAN]}
READY="()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'&&typeof window.HonroApp?.launch==='function'&&typeof window.HonroTimeOfDay?.sky==='function'"
ENTRY="""async()=>{
 const a=HonroApp;
 if(a.engine?.b?.honroStage===42||HonroCampaignLoader.has(42))throw Error('not fresh canonical profile');
 a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
 await HonroCampaignLoader.ensureStage(42);
 for(let n=1;n<42;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(42).entryLevel);
 a.launch(42);if(a.engine?.b?.honroStage!==42)throw Error('wrong launch');
 for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
 if(a.dialogue)throw Error('entry dialogue remains');
 a.close();HonroStoryFraming.clear(a.scene);
}"""
INIT=r"""(()=>{
 const images=new Set(),blobs=new Set(),orig=URL.createObjectURL,proto=HTMLImageElement.prototype,d=Object.getOwnPropertyDescriptor(proto,'src');
 Object.defineProperty(proto,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});
 URL.createObjectURL=function(...a){const x=Reflect.apply(orig,this,a);blobs.add(x);return x};
 Object.defineProperty(window,'__s42PilotImages',{value:{images,blobs}});
})()"""
DECODE=r"""async()=>{
 const xs=[...new Set([...document.images,...__s42PilotImages.images])].filter(i=>i.currentSrc||i.src);
 let timer;try{await Promise.race([Promise.all([document.fonts.ready,...xs.map(i=>i.decode())]),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('image decode timeout')),21000)})]);}
 finally{clearTimeout(timer);}
 return {number:xs.length,font:document.fonts.status,bad:xs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.currentSrc||i.src)};
}"""
RAW="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
def ranged(b,range_header):
 if range_header is None:return 200,None,b
 m=re.fullmatch(r'bytes=(\d+)-(\d*)',range_header)
 assert m,range_header
 start=int(m[1]);end=min(int(m[2]),len(b)-1) if m[2] else len(b)-1
 assert 0<=start<=end<len(b),range_header
 return 206,f'bytes {start}-{end}/{len(b)}',b[start:end+1]

@contextlib.contextmanager
def wire(get,known):
 """One ephemeral real TCP host per context; only checked git-backed bytes."""
 records={};violations=[];bodies={};lock=Lock()
 def file(p):
  with lock:
   if p not in bodies:
    b=get(p);assert fact(b)==(known[p] if p in known else MEDIA_PINS[p]),p
    bodies[p]=b
   return bodies[p]
 def snapshot():
  with lock:return ({i:dict(x) for i,x in records.items()},list(violations))
 class Server(ThreadingHTTPServer):
  daemon_threads=True
 class Handler(BaseHTTPRequestHandler):
  protocol_version='HTTP/1.1'
  def log_message(self,*a):pass
  def rejected(self,reason,code):
   with lock:violations.append([self.command,self.path,reason])
   self.close_connection=True
   try:self.send_error(code)
   except OSError:pass
  def do_GET(self):
   p=pathpart(self.path)
   try:
    assert p in known or p in MEDIA_PINS,('unlisted path',p)
    assert self.headers.get('Host')==f'127.0.0.1:{self.server.server_port}'
    if p in MEDIA_PINS:assert self.headers.get('Sec-Fetch-Dest')=='audio','not an audio request'
    b=file(p);r=self.headers.get('Range')
    assert r is None or p in MEDIA_PINS,'unapproved range'
    code,range_out,out=ranged(b,r)
    mime='text/javascript' if p.endswith('.js') else mimetypes.guess_type(p)[0];assert mime,p
   except Exception as e:return self.rejected(repr(e),403)
   with lock:
    req_id=str(len(records)+1)
    entry={'path':p,'status':code,'range':r,'contentRange':range_out,'body':fact(out),'trackedBody':fact(b),'socket':'WRITING'}
    records[req_id]=entry
   try:
    self.send_response(code);self.send_header('Content-Type',mime);self.send_header('Content-Length',str(len(out)))
    self.send_header('Cache-Control','no-store');self.send_header('Connection','close')
    self.send_header('X-Honro-QA-Receipt',req_id)
    if range_out:self.send_header('Content-Range',range_out);self.send_header('Accept-Ranges','bytes')
    self.end_headers();self.wfile.write(out);self.wfile.flush()
   except (BrokenPipeError,ConnectionResetError):
    flag='PEER_CLOSED'
   except OSError as e:
    flag='SOCKET_ERROR'
    with lock:violations.append([self.command,self.path,repr(e)])
   else:flag='WRITTEN'
   finally:
    with lock:entry['socket']=flag
    self.close_connection=True
  def do_HEAD(self):return self.rejected('strict GET only',405)
  def do_POST(self):return self.rejected('strict GET only',405)
 http=Server(('127.0.0.1',0),Handler)
 thread=Thread(target=http.serve_forever,kwargs={'poll_interval':.05},daemon=True);thread.start()
 try:yield f'http://127.0.0.1:{http.server_port}/',file,snapshot
 finally:http.shutdown();http.server_close();thread.join(timeout=1)

class Ledger:
 """Per actual Request record. A hanging request cannot block later body checks."""
 def __init__(self,known,origin,file,snapshot,errors):
  self.entries={};self.known=known;self.origin=origin;self.file=file;self.snapshot=snapshot;self.errors=errors
  self.blob_rx=re.compile(r'blob:'+re.escape(origin)+r'[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}')
  self.blobs=set();self.verified=[]
 def key(self,req):return parts(req.url,self.origin)
 def record(self,req):
  k=self.key(req)
  if k in self.known or k in MEDIA_PINS:
   return self.entries.setdefault(req,{'path':k,'method':req.method,'resource':req.resource_type,
    'range':req.headers.get('range'),'start':False,'finished':False,'failure':None,'response':None,'state':'PENDING'})
  return None
 def request(self,req):
  rr=self.record(req)
  if rr is not None:
   rr['start']=True;ifbad=req.method!='GET' or (rr['path'] in MEDIA_PINS and req.resource_type!='media')
   if ifbad:self.errors.append(['unexpected method or purpose',req.method,req.resource_type,req.url])
  elif not(req.url.startswith('data:') or self.blob_rx.fullmatch(req.url)):self.errors.append(['unexpected request',req.method,req.url])
 def response(self,r):
  q=r.request;rr=self.record(q)
  if rr is None:
   if self.blob_rx.fullmatch(r.url) and r.status==200:self.blobs.add(r.url)
   elif not r.url.startswith('data:'):self.errors.append(['unexpected response',r.status,r.url])
   return
  rr['response']=r; rr['status']=r.status
  if q.redirected_from or q.redirected_to or r.from_service_worker or r.status not in ((200,206) if rr['path'] in MEDIA_PINS else (200,)):
   self.errors.append(['noncanonical response',r.status,r.url])
 def finished(self,req):
  rr=self.record(req)
  if rr is not None:rr['finished']=True
 def failed(self,req):
  rr=self.record(req)
  if rr is not None:rr['failure']=req.failure
  if not(rr and rr['path'] in MEDIA_PINS and req.resource_type=='media' and req.failure=='net::ERR_ABORTED'):
   self.errors.append(['unexpected request failure',req.url,req.failure])
 def harvest(self):
  server,violations=self.snapshot()
  for rr in list(self.entries.values()):
   if rr['state']!='PENDING':continue
   k=rr['path']; r=rr['response']; canceled=rr['failure']=='net::ERR_ABORTED' and k in MEDIA_PINS
   if not(rr['finished'] or canceled):continue
   try:
    # Exact per-response metadata, with a unique loopback issuance ID.
    code,cr,body=ranged(self.file(k),rr['range'])
    if r is not None:
     rid=r.headers.get('x-honro-qa-receipt');assert rid in server
    elif canceled:
     # Cancellation may precede response header capture; a unique pinned served
     # media range is still required and stays explicitly unverified/canceled.
     candidates=[i for i,w in server.items() if w['path']==k and w['range']==rr['range']]
     if not candidates:continue
     assert len(candidates)==1
     rid=candidates[0]
    else:continue
    entry=server[rid]
    if entry['socket']=='WRITING':continue
    assert rr['start'] and rr['method']=='GET'
    assert (entry['path'],entry['status'],entry['range'],entry['contentRange'],entry['body'])==(k,code,rr['range'],cr,fact(body))
    if r is not None:
     assert (r.status,r.headers.get('content-range'),r.headers.get('content-length'))==(code,cr,str(len(body)))
    rr['wireID']=rid;rr['served']=entry
    if canceled:
     assert entry['socket'] in ('WRITTEN','PEER_CLOSED')
     rr['state']='CANCELED_PERMITTED_UNREAD_BODY'
    else:
     assert r is not None and not rr['failure'] and entry['socket']=='WRITTEN'
     got=r.body()
     assert got==body,(k,'actual browser decoded body differs from pinned response')
     rr['state']='BODY_EXACT';rr['actualBody']=fact(got)
     self.verified.append([k,code,fact(got)])
   except Exception as e:
    rr['state']='ERROR';rr['error']=repr(e);self.errors.append(['response verification',k,repr(e)])
  return server,violations
 def receipt(self):
  server,violations=self.harvest()
  data=[{k:v for k,v in rr.items()if k!='response'} for rr in self.entries.values()]
  return {'errors':self.errors,'requests':data,'verified':self.verified,'served':server,'serverViolations':violations}
 def metrics(self):
  r=self.receipt();q=r['requests']
  active=[w for w in q if w['path'] not in MEDIA_PINS]
  media=[w for w in q if w['path'] in MEDIA_PINS]
  n=sorted((k,c,h['bytes'],h['sha256'])for k,c,h in self.verified if k not in MEDIA_PINS)
  a=[w for w in active if w['state']=='BODY_EXACT']
  pending=[(w['path'],w['state'],w.get('status'),w['failure'])for w in q if w['state'] not in ('BODY_EXACT','CANCELED_PERMITTED_UNREAD_BODY')]
  wire_ids=[w['wireID']for w in q if 'wireID' in w]
  stageAsset=[w for w in a if w['path']==PIN['stageAssetFile']]
  nonmedia=(len(n),sha(canon(n)))
  sound=Counter(w['path'] for w in media)
  return r,{'nonMediaCount':nonmedia[0],'nonMediaSignature':nonmedia[1],'expectedR1Same':nonmedia==R1_NONMEDIA,
    'pending':pending,'missingRequired':sorted(set(PIN['required'])-{w['path']for w in a}),
    'exactStageAssetGETCount':len(stageAsset),'matchedAllWireIDs':len(set(wire_ids))==len(wire_ids) and set(wire_ids)==set(r['served']),
    'exactMediaRequestSet':sound==Counter(MEDIA_PINS.keys()),
    'media':sorted((w['path'],w['range'] or '',w['state'],w['served']['status'] if 'served'in w else 0) for w in media)}

def pilot(browser,get,known,pose,arm,out,row,flush):
 with wire(get,known) as (origin,read,snapshot):
  return visit(browser,known,origin,read,snapshot,pose,arm,out,row,flush)

def visit(browser,known,origin,read,snapshot,pose,arm,out,row,flush):
 from PIL import Image
 size=PIN['viewport']
 ctx=browser.new_context(viewport={'width':size[0],'height':size[1]},device_scale_factor=1,service_workers='block',reduced_motion='reduce')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 page=ctx.new_page();page.set_default_timeout(30000);page.add_init_script(INIT)
 errors=[];events=Ledger(known,origin,read,snapshot,errors)
 row.update(status='INIT',frames={},originKind='real_ephemeral_loopback_http1_get',network=events.receipt())
 # Nothing on the loopback is fulfilled or modified by Playwright. Abort all
 # non-local HTTP(S) before it can leave the isolated context; blob/data are local.
 ctx.route(re.compile(r'^https?://(?!'+re.escape(urlsplit(origin).netloc+'/')+r')'),lambda route:route.abort())
 for ev,fn in [('request',events.request),('response',events.response),('requestfinished',events.finished),
               ('requestfailed',events.failed),('pageerror',lambda e:errors.append(['page error',str(e)]))]:page.on(ev,fn)
 def snapshot_net(final=False):
  def one():
   row['network'],row['networkGuard']=events.metrics()
   return row['networkGuard']
  if not final:
   # Keep an early/partial receipt and free finished browser buffers, but never
   # suppress genuine otherwise valid RAW/DOM on a later request verdict.
   try:one()
   except Exception as e:errors.append(['nonblocking network receipt',repr(e)])
   return
  end=time.monotonic()+20
  while True:
   q=one()
   if (not q['pending'] and not q['missingRequired'] and q['matchedAllWireIDs']) or time.monotonic()>=end:break
   page.wait_for_timeout(100)
  assert events.blobs<=set(page.evaluate('()=>Array.from(__s42PilotImages.blobs)'))
  assert not errors and not row['network']['serverViolations'],('network errors',errors,row['network']['serverViolations'])
  assert not q['pending'] and not q['missingRequired'] and q['matchedAllWireIDs'] and q['exactStageAssetGETCount']==1 and q['exactMediaRequestSet'] and q['expectedR1Same'],('strict final network HOLD',q)
 def grab(phase):
  canvas=page.locator('#battlecanvas');rec={}
  raw=base64.b64decode(page.evaluate(RAW),validate=True)
  def archive(mode,v):
   file=f'{arm}-{pose["name"]}-{phase}-{mode}.png';(out/file).write_bytes(v)
   with Image.open(io.BytesIO(v))as im:
    im.load();wh=im.size
    assert wh==tuple(PIN['backing']) if mode=='raw' else wh[0]==PIN['backing'][0] and wh[1] in (PIN['backing'][1],PIN['backing'][1]+1)
    rec[mode]={**fact(v),'path':file,'size':wh,'rgba':sha(im.convert('RGBA').tobytes())}
  archive('raw',raw)
  row.setdefault('partialRaw',{})[phase]=rec['raw'];flush()
  archive('dom',canvas.screenshot(animations='disabled',timeout=30000))
  assert base64.b64decode(page.evaluate(RAW),validate=True)==raw,'frozen frame during DOM capture'
  return rec
 native_installed=False
 try:
  n=page.goto(origin+SHELL,wait_until='domcontentloaded',timeout=50000)
  assert n and n.url==origin+SHELL and n.status==200 and not n.from_service_worker and n.body()==read(SHELL)
  req=n.request
  assert req.frame==page.main_frame and req.is_navigation_request() and req.method=='GET' and not req.redirected_from and not req.redirected_to
  row['navigation']=fact(n.body());assert row['navigation']==known[SHELL];snapshot_net();flush()
  try:page.wait_for_function(READY,timeout=45000)
  except Exception:
   row['readiness']=page.evaluate("()=>({href:location.href,ready:document.documentElement.dataset.honroReady,loader:typeof HonroCampaignLoader?.ensureStage,app:typeof HonroApp?.launch,sky:typeof HonroTimeOfDay?.sky,body:document.body?.innerText.slice(0,700)})");raise
  page.evaluate(ENTRY);page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  row['provider']=page.evaluate(SCENE,{'op':'prepare','law':PIN})
  def camera(q):return page.evaluate(SCENE,{'op':'park','css':PIN['css'],'pose':q})
  def draw(q,c):return page.evaluate(SCENE,{'op':'paint','css':PIN['css'],'backing':c['backing'],'center':c['center'],'pose':q})
  # Prime images and a different cache scale using a legitimate parked draw;
  # none of the production cache APIs are reset or overwritten.
  prime={'requested':[3250,1430.5,.55]}
  p=draw(prime,camera(prime));row['prime']=p
  row['decode']=page.evaluate(DECODE);assert row['decode']['number']>0 and row['decode']['font']=='loaded' and not row['decode']['bad']
  q=camera(pose);row['camera']=q;assert q['backing']==PIN['backing'];flush()
  snapshot_net()
  if arm=='N':
   try:native_installed=page.evaluate(NATIVE,{'op':'install','pose':pose,'backing':q['backing'],'center':q['center']})
   except Exception as e:row.setdefault('observerErrors',[]).append(['install',repr(e)])
  for phase in PHASES:
   if native_installed:
    try:page.evaluate(NATIVE,{'op':'phase','phase':phase})
    except Exception as e:row.setdefault('observerErrors',[]).append(['phase',phase,repr(e)])
   render=draw(pose,q)
   images=grab(phase);row['frames'][phase]={'images':images,'render':render};del row['partialRaw'][phase];flush()
   snapshot_net()
   if native_installed:
    try:row['frames'][phase]['observer']=page.evaluate(NATIVE,{'op':'commit'})
    except Exception as e:row.setdefault('observerErrors',[]).append(['commit',phase,repr(e)])
  snapshot_net(final=True);row['status']='CAPTURED'
 except Exception as e:row['status']='HOLD';row['error']=[repr(e),traceback.format_exc()]
 finally:
  if native_installed:
   try:row['observer']=page.evaluate(NATIVE,{'op':'finish'});save(out/f'{arm}-{pose["name"]}-native-events.json',row['observer'])
   except Exception as e:row.setdefault('observerErrors',[]).append(['finish',repr(e)])
  try:ctx.close()
  finally:flush()
def net_signature(row):
 f=row['networkGuard']
 return (f['nonMediaCount'],f['nonMediaSignature'],f['exactStageAssetGETCount'],tuple(map(tuple,f['media'])))
def matrix_exact(a,b):return len(a)==len(b)==6 and all(abs(x-y)<1e-7 for x,y in zip(a,b))
def assess(report):
 issues=[];variants=report['visits']
 for p in PIN['poses']:
  n=p['name'];rows=[variants.get(f'{v}/{n}',{})for v in ('A1','A2','N')]
  if any(r.get('status')!='CAPTURED' or tuple(r.get('frames',{}))!=PHASES for r in rows):
   issues.append([n,'incomplete normal or diagnostic visit']);continue
  if any(r['provider']!=rows[0]['provider'] or r['camera']!=rows[0]['camera'] or r['navigation']!=rows[0]['navigation'] or net_signature(r)!=net_signature(rows[0])for r in rows[1:]):
   issues.append([n,'not same provider/camera/request bytes']);continue
  for phase in PHASES:
   for mode in ('raw','dom'):
    f=[{k:v for k,v in r['frames'][phase]['images'][mode].items()if k!='path'}for r in rows]
    if f[0]!=f[1]:issues.append([n,phase,mode,'A1/A2 normal PNG mismatch'])
    if f[0]!=f[2]:issues.append([n,phase,mode,'observer PNG mismatch'])
   if any(r['frames'][phase]['render']!=rows[0]['frames'][phase]['render']for r in rows[1:]):
    issues.append([n,phase,'cache/state count drift'])
  first,allocate,hit=(rows[2]['frames'][k]['render']for k in PHASES)
  target=first if p['targetPhase']=='first' else allocate
  if p['viewKind']=='tile':
   try:
    x,y=map(int,p['target'].split(':'));rs=p['rs'];tile=first['after']['tile']
    assert first['before']['tile'] is None and first['after']['tileBuilds']>first['before']['tileBuilds'] and first['after']['domainRS']==rs
    assert tile['size']==[516,516] and abs(tile['left']-x*512/rs)<1e-7 and abs(tile['top']-y*512/rs)<1e-7
    assert hit['after']['tileBuilds']==first['after']['tileBuilds']
   except (AssertionError,TypeError):issues.append([n,'actual cold tile / warm cache not witnessed'])
  else:
   if first['after']['viewport'] is not None or allocate['before']['viewport'] is not None or allocate['after']['viewport']!={'main':False,'size':PIN['backing'],'detached':True,'nativeZoom':True} or allocate['after']['screenBuilds']<=allocate['before']['screenBuilds'] or hit['after']['screenBuilds']!=allocate['after']['screenBuilds']:
    issues.append([n,'actual settled native viewport allocation missing'])
  if hit['after']['screenHits']<=hit['before']['screenHits']:issues.append([n,'steady screen raster hit missing'])
  ob=rows[2].get('observer',{})
  if rows[2].get('observerErrors') or not ob.get('bound') or ob.get('errors') or ob.get('untouchedMain') is not True or [ev['tag']for ev in ob.get('events',[])]!=TAGS or any(ev['phase']!=p['targetPhase']or not matrix_exact(ev.get('basis',[]),p['matrix']) for ev in ob.get('events',[])):
   issues.append([n,'native owner readback incomplete or unbound'])
 return issues
def main():
 args=argparse.ArgumentParser();args.add_argument('--repo',type=Path,required=True);args.add_argument('--out',type=Path,required=True);args.add_argument('--official',action='store_true');args.add_argument('--preflight',action='store_true');ns=args.parse_args()
 ns.out.mkdir(exist_ok=True,parents=True)
 report={'release':BASE,'status':'HOLD','scope':'Stage42 exact A1/A2/N observer feasibility only', 'visits':{}}
 def flush():save(ns.out/'PILOT.json',report)
 flush()
 try:
  report['head']=secure(ns.repo,ns.official);get=lambda p:git(ns.repo,'show',BASE+':'+p)
  known=closure(get)
  report['activeGraphCount']=len(known)-2;report['preflight']='EXACT_TRACKED_STOCK_A_ONLY';flush()
  if ns.preflight:return
  assert ns.official,'no local browser launch in this disabled carrier'
  from playwright.sync_api import sync_playwright
  with sync_playwright()as pw:
   b=pw.chromium.launch(headless=True,args=['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--no-proxy-server','--disable-background-networking'])
   try:
    report['browser']=b.version;assert b.version==PIN['browser']
    # All six normal visits are attempted and archived before any observer visit/verdict.
    for arm in ('A1','A2','N'):
     for pose in PIN['poses']:
      k=f'{arm}/{pose["name"]}';row=report['visits'][k]={};flush()
      try:pilot(b,get,known,pose,arm,ns.out,row,flush)
      except Exception as e:row.update(status='HOLD',error=[repr(e),traceback.format_exc()]);flush()
   finally:b.close()
  report['issues']=assess(report)
  if report['issues']:raise RuntimeError('HOLD: exact A-only observer gates not all met')
  report['status']='PASS_A_ONLY_NATIVE_OBSERVER_NONPERTURBATION'
 except Exception as e:report['error']=[repr(e),traceback.format_exc()];raise
 finally:flush()
if __name__=='__main__':main()
