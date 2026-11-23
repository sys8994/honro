"""Bounded real normal f6 / prototype A/B; local loopback only. No deploy or live website."""
import base64,functools,hashlib,io,json,re,statistics,sys,threading
from contextlib import ExitStack,contextmanager
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit,unquote
from local import D,authorization,fact,need,read,write
O=read(D/'observer.json');OBS=(D/'observe.js').read_text();DIAG=(D/'telemetry.js').read_text();API=(D/'public-api.js').read_text()
EXPECTED_API={'separate':True,'stablePerVector':True,'before':[True,True,False,False],'after':[True,True,True,False]}
MOUNT="()=>__honroPrivateDiag.wire()"
BATTLE="()=>{const a=globalThis.HonroApp,b=a?.engine?.b;return b?.honroStage===40&&b.honroCanonical===true&&b.honroCustom===false&&b.mode==='campaign'&&b.honroMapOrigin==='campaign'&&a.scene?.battle===b&&!a.profileStore.locked;}"
RATIO=('records','coldPaths','peakEntries','peakChars')
CAPS=dict(zip(RATIO,[15,512,128,4300000]))
def delta(before,after):return {k:after[k]-before[k] for k in ('constructed','svg','chars')}
def digest(s):return hashlib.sha256(s.encode()).hexdigest()
def diag_path(url,origin):
 try:u=urlsplit(url)
 except ValueError:return None
 if f'{u.scheme}://{u.netloc}'!=origin:return None
 if not re.fullmatch(r'/[A-Za-z0-9_./-]{0,190}',u.path):return '<noncanonical-loopback-path>'
 return u.path+('?' + u.query if u.query=='embedded=1' else '')
def diag_text(value,origin=None):
 s=str(value)[:4000]
 url=re.compile(r'(?i)(?:https?://|file://|blob:|data:)[^\s\)\]\"\']+')
 s=url.sub(lambda m:(diag_path(m.group(0),origin) if origin else None) or '<url omitted>',s)
 s=re.sub(r'(?i)(?:bearer\s+[^\s\)]+|(?:gh[pousr]_|github_pat_|sk-)[A-Za-z0-9_-]{12,})','<credential omitted>',s)
 return s[:1400]
TITLE_READY="()=>document.documentElement.dataset.honroReady==='true'&&globalThis.HonroApp?.screen==='title'&&typeof globalThis.HonroCampaignLoader?.ensureStage==='function'"
CAMPAIGN_READY="()=>typeof globalThis.HonroVectorArt?.draw==='function'&&typeof globalThis.HonroScene?.prototype?.render==='function'&&typeof globalThis.HonroAct4Campaign?.ownsFreshHarborSnapshot==='function'"
WORKSHOP_READY="()=>typeof globalThis.HonroWorkshopAPI?.startPlaytest==='function'&&typeof globalThis.HONRO_READY?.then==='function'"
START_READY="()=>globalThis.__honroP1Budget?.state?.marks?.firstFollowingRaf!==undefined||!!globalThis.HonroApp?.lastError"
NATIVE_BOOT_STATE="""()=>({readyFlag:document.documentElement.dataset.honroReady==='true',title:globalThis.HonroApp?.screen==='title',
 readyPromise:typeof globalThis.HONRO_READY?.then==='function',appPromise:typeof globalThis.HONRO_APP_READY?.then==='function',
 vectorDraw:typeof globalThis.HonroVectorArt?.draw==='function',sceneRender:typeof globalThis.HonroScene?.prototype?.render==='function',
 stageLoader:typeof globalThis.HonroCampaignLoader?.ensureStage==='function',act4ContentEnabled:globalThis.HonroAct4Content?.enabled===true,
 act4Campaign:typeof globalThis.HonroAct4Campaign?.ownsFreshHarborSnapshot==='function',appError:!!globalThis.HonroApp?.lastError})"""

class Server:
 def __init__(self,root):
  class Handler(SimpleHTTPRequestHandler):
   def log_message(self,*x):pass
   def send_head(self):
    parts=unquote(urlsplit(self.path).path).split('/')
    if any(x in ('.git','..') for x in parts):
     self.send_error(404);return None
    return super().send_head()
   def end_headers(self):
    self.send_header('Cache-Control','no-store')
    super().end_headers()
  self.h=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)))
  self.h.daemon_threads=True;self.origin=f'http://127.0.0.1:{self.h.server_port}'
 def __enter__(self):
  threading.Thread(target=self.h.serve_forever,daemon=True).start();return self.origin
 def __exit__(self,*e):self.h.shutdown();self.h.server_close()
def capture(w,p):
 # Imports after explicit authorization (static / disabled checks never launch).
 from PIL import Image
 from playwright.sync_api import sync_playwright
 g=read(w/'out'/'GRAPH-PRE.json');qgraph=read(w/'out'/'ORDERED.json')
 need(qgraph['status']=='PASS_ONLY_TWO_SIGNED_SOURCE_MODULES_AND_POINTERS','missing exact production compiler closure')
 need({x['file'] for x in qgraph['ops']}==set(p['source']),'wrong compiled controlled source')
 source=read(w/'out'/'SOURCE.json')
 need(source=={'A':p['base'],'B':p['source'],'deploy':False},'wrong exact signed inputs')
 q={'status':'HOLD_NOT_CAPTURED','source':source,'trials':[],'semantic':{},'workshop':{},'errors':[],'noPublicOrAuth':True,
    'memoryUnits':{'jsHeap':'coarse renderer process-reported JS heap, not native Path2D bytes','peakChars':'per-bank retained UTF-16 units only'}}
 def save():write(w/'out'/'NATIVE.json',q)
 diag={'contexts':[],'capture':'bounded error diagnostics; no external URL, content/headers, or saved state'}
 def save_diag():write(w/'out'/'BROWSER-DIAGNOSTICS.json',diag)
 save_diag()
 @contextmanager
 def context(br,arm,dev,*,telemetry=False,workshop=False):
  origin=urls[arm];ctx=None;page=None
  report={'arm':arm,'device':dev,'role':'workshop' if workshop else 'pairedCapture' if telemetry else 'timing',
          'phase':'new_context','pageErrors':[],'consoleErrors':[],'loopbackFailures':[],'blockedExternal':[]}
  diag['contexts'].append(report);save_diag()
  seen={};errors=[];blocked=report['blockedExternal']
  def add(which,row):
   vals=report[which]
   if len(vals)<40:vals.append(row);save_diag()
   else:report[which+'Dropped']=report.get(which+'Dropped',0)+1
  def route(r):
   u=urlsplit(r.request.url)
   if f'{u.scheme}://{u.netloc}'==origin or u.scheme in ('data','blob'):r.continue_()
   else:
    add('blockedExternal',{'scheme':u.scheme if u.scheme in ('http','https','ws','wss') else 'other','resourceType':r.request.resource_type})
    r.abort('blockedbyclient')
  def response(r):
   u=urlsplit(r.url);key=u.path.removeprefix('/')+('?' + u.query if u.query else '')
   if f'{u.scheme}://{u.netloc}'==origin:
    seen[key]=[r.status,r.from_service_worker,r.request.method]
    if r.status>=400:add('loopbackFailures',{'kind':'HTTP','path':diag_path(r.url,origin),'status':r.status,'type':r.request.resource_type})
  def failed(r):
   path=diag_path(r.url,origin)
   if path:add('loopbackFailures',{'kind':'requestfailed','path':path,'failure':diag_text(r.failure,origin),'type':r.resource_type})
  def page_error(e):
   msg=diag_text(getattr(e,'stack',None) or str(e),origin);errors.append(msg)
   add('pageErrors',{'message':msg})
  def console(msg):
   if msg.type!='error':return
   loc=msg.location or {};u=loc.get('url','');path=diag_path(u,origin)
   # Never read messages whose location is explicitly external.
   add('consoleErrors',{'message':diag_text(msg.text,origin) if not u or path else '<non-loopback console content omitted>',
                        'path':path,'line':loc.get('lineNumber'),'column':loc.get('columnNumber')})
  def current_state():
   if page is not None and not page.is_closed():
    try:report.setdefault('nativeBoot',{})[report['phase']]=page.evaluate(NATIVE_BOOT_STATE)
    except Exception as e:report['nativeBootUnavailable']=diag_text(e,origin)
  try:
   ctx=br.new_context(**p['devices'][dev],service_workers='block')
   ctx.route('**/*',route)
   if telemetry:ctx.add_init_script(DIAG)
   if not workshop:
    ctx.add_init_script(OBS)
    if telemetry:ctx.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
   ctx.on('response',response);ctx.on('requestfailed',failed)
   page=ctx.new_page();page.on('pageerror',page_error);page.on('console',console)
   armG=g[arm.lower()];m=armG['manifest'];file='HONRO_WORKSHOP.html' if workshop else 'HONRO.html'
   report['phase']='goto_shell';n=page.goto(origin+'/'+file,wait_until='domcontentloaded',timeout=45000)
   need(n and n.status==200 and n.url==origin+'/'+file and not n.from_service_worker and fact(n.body())==armG['workshopShell' if workshop else 'shell'],'actual immutable document not loaded')
   def verify(paths):
    need(all(seen.get(k)==[200,False,'GET'] for k in paths),'missing browser route(s) '+repr({k:seen.get(k) for k in paths if seen.get(k)!=[200,False,'GET']}))
    need(not errors,'page error '+repr(errors))
    return {k:armG['active'][k.split('?',1)[0]] for k in paths}
   if not workshop:
    report['phase']='wait_title_and_stage_loader';page.wait_for_function(TITLE_READY,timeout=45000)
    report['phase']='wait_native_act4_exports';page.wait_for_function(CAMPAIGN_READY,timeout=20000)
   if workshop:report['phase']='workshop_operation'
   else:report['phase']='stage40_operation'
   current_state();save_diag()
   yield ctx,page,m,verify,blocked
   report['phase']='done'
  except Exception as e:
   report['failure']=diag_text(e,origin);raise
  finally:
   current_state();save_diag()
   if ctx is not None:ctx.close()
 def actual_paths(m,workshop=False):
  changed_ordered=set(qgraph['addressPairs'])|set(qgraph['addressPairs'].values())
  touched=[k for k in [*m['common'],*m['gameOnly']] if k in changed_ordered]
  need(touched,'normal app does not select changed compiler group(s)')
  return ([m['workshopEntry'],m['playtest'],m['gameEntry'],*touched] if workshop else [m['gameEntry'],m['project'],*p['stage40']['files'],*touched])
 def start(page):
  page.evaluate('()=>__honroP1Budget.start(40)')
  page.wait_for_function(START_READY,timeout=45000,polling=75)
  page.wait_for_function(BATTLE,timeout=20000)
 def first(pg):
  x=pg.evaluate("()=>{const s=__honroP1Budget.state;return {first:s.firstFrame,ensures:s.ensures,marks:s.marks,eager:s.eager,appError:HonroApp.lastError||null}}")
  ensure=x['ensures'];f=x['first'];m=x['marks']
  need(f and x['eager'] is False and not x['appError'] and len(ensure)==1 and ensure[0].get('stage')==40 and not ensure[0].get('error') and ensure[0]['end']<=f['start']<=f['end']<=m['firstFollowingRaf'],'wrong native Stage40 read/draw ordering')
  return {'ensure':ensure[0],'pose':f['pose'],'launchToDrawEndMs':f['end']-m['launchStart'],
   'readyToDrawEndMs':f['end']-ensure[0]['end'],'drawCpuMs':f['cpu'],'readyToFollowingRafMs':m['firstFollowingRaf']-ensure[0]['end']}
 def image(pg,tag,dev):
  # Only after natural launch and guide window. No manual step can alter measured timing.
  pg.evaluate("""()=>{const a=HonroApp;if(a.engine?.b?.honroStage!==40)throw Error('not canonical battle');a.frame=()=>{};
    for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
    if(a.dialogue)throw Error('existing Stage40 guide did not close normally');
    a.close();HonroStoryFraming.clear(a.scene);}""")
  pg.evaluate('()=>__honroPrivateDiag.markCapture()')
  d={'id':40,'mapId':'stage-40','name':'ordinary','ordinary':p['ordinary'][dev],'readback':False,'fixedNow':O['PHASE']}
  before=pg.evaluate(O['FROZEN'],d)['meta'];d['readback']=True
  ready=pg.evaluate(O['DECODE']);after=pg.evaluate(O['FROZEN'],d)['meta']
  need(before==after and not ready['failed'],'frozen readback did not reach a repeatable genuine stage')
  after['physics']=digest(after.pop('signature'))
  raw=base64.b64decode(pg.evaluate(O['CANVAS']),validate=True);n=tag+'-RAW.png'
  with Image.open(io.BytesIO(raw)) as im:
   need(list(im.size)==after['backing'],'native framebuffer dims changed')
   rgba=hashlib.sha256(im.convert('RGBA').tobytes()).hexdigest()
  (w/'out'/n).write_bytes(raw)
  return {'meta':after,'rgba':rgba,'png':fact(raw),'file':n}
 def semantic(br,arm,dev):
  r=q['semantic'].setdefault(dev,{}).setdefault(arm,{})
  with context(br,arm,dev,telemetry=True) as (c,page,m,verify,blocked):
   page.evaluate(MOUNT);start(page);r['first']=first(page)
   r['cold']=page.evaluate('()=>__honroPrivateDiag.read()');firstP=r['cold']
   need(firstP['firstBefore'] and firstP['firstAfter'],'no actual native render telemetry')
   r['coldConstructors']=delta(firstP['firstBefore'],firstP['firstAfter'])
   page.wait_for_timeout(p['guideWindowMs'])
   r['afterNaturalGuide']=page.evaluate('()=>__honroPrivateDiag.read()')
   r['image']=image(page,f'{arm}-{dev}-S40',dev);r['afterMatchedDraw']=page.evaluate('()=>__honroPrivateDiag.read()')
   r['publicAPI']=page.evaluate(API);need(r['publicAPI']==EXPECTED_API,'public per-vector handle or mutator isolation failed')
   r['http']=verify(actual_paths(m));r['blockedExternal']=blocked
   save()
 def workshop(br,arm):
  r=q['workshop'].setdefault(arm,{})
  with context(br,arm,'PC',telemetry=True,workshop=True) as (c,page,m,verify,blocked):
   page.wait_for_function(WORKSHOP_READY,timeout=45000)
   start_state=page.evaluate("""async()=>{await HONRO_READY;const p=HonroWorkshopAPI.getProject();return {route:HONRO_PLAYTEST_URL, stages:p.stages.length,lib:p.library.length};}""")
   need(start_state=={'route':m['playtest'],'stages':50,'lib':1194},'workshop owner not actual complete project')
   page.evaluate("()=>{HonroWorkshopAPI.selectStage('stage-1');HonroWorkshopAPI.startPlaytest();}")
   page.wait_for_function("""()=>{const x=document.querySelector('#runtimeFrame')?.contentWindow,a=x?.HonroApp;return x?.HONRO_EMBEDDED===true&&a?.customMap?.stageId==='stage-1'&&a?.engine?.b?.units?.length>0;}""",timeout=45000)
   fr=page.frame(url=urls[arm]+'/'+m['playtest']);need(fr is not None,'actual native embedded route missing')
   r['editorPublicAPI']=page.evaluate(API)
   r['publicAPI']=fr.evaluate(API)
   r['audit']=fr.evaluate('()=>__honroPrivateDiag.read()')
   need(r['editorPublicAPI']==r['publicAPI']==EXPECTED_API and r['audit']['current']['private'] is None,'native workshop got shared public handle/private bank')
   r['state']=digest(fr.evaluate("()=>{const b=HonroApp.engine.b;return JSON.stringify([b.terrain,b.units,b.honroObjectives,b.width,b.height]);}"))
   r['http']=verify(actual_paths(m,True));r['blockedExternal']=blocked;r['workshop']=start_state
   save()
 with ExitStack() as stack:
  urls={arm:stack.enter_context(Server(w/arm)) for arm in ('A','B')}
  try:
   with sync_playwright() as pw:
    launch=lambda:pw.chromium.launch(headless=True,chromium_sandbox=True,timeout=30000)
    with launch() as br:
     need(br.version==p['chromium'],'missing exact tested Chromium '+br.version)
     for dev in ('PC','Mobile'):
      for a in ('A','B'):semantic(br,a,dev)
     for a in ('A','B'):workshop(br,a)
    for n in range(p['repeats']):
     row={'n':n+1,'order':['B','A'] if n%2 else ['A','B']};q['trials'].append(row);save()
     for arm in row['order']:
      with launch() as br:
       need(br.version==p['chromium'],'unexpected chromium')
       with context(br,arm,'PC') as (c,page,m,v,blocked):
        start(page);row[arm]={'measurements':first(page),'http':v(actual_paths(m)),'blockedExternal':blocked};save()
   for dev,r in q['semantic'].items():
    a,b=r['A'],r['B']
    need(all(a['image'][k]==b['image'][k] for k in ('rgba','meta')),'actual registered native image/pose/physics drift '+dev)
    aa=a['afterMatchedDraw'];bb=b['afterMatchedDraw']
    need(all(x['app']['stage']==40 and x['app']['canonical'] is True and x['app']['sceneCurrent'] for x in (aa,bb)),'same normal stage identity missing '+dev)
    need(aa['ctm'] and aa['ctm']==bb['ctm'],'actual per-owner native fill CTM drift/missing '+dev)
    need(aa['current']['private'] is None,'wrong stock arm: candidate bank present')
    if dev=='Mobile':
     need(bb['app']['touch']>0 and bb['current']['private'] is None ,'mobile scope or cold construction changed')
   need(q['workshop']['A']['state']==q['workshop']['B']['state'],'ordinary Workshop seed state changed')
   ra,rb=(q['semantic']['PC'][arm] for arm in ('A','B'));priv=rb['afterMatchedDraw']['current']['private']
   if priv is not None:need(all(priv[k]<=v for k,v in CAPS.items()),'runtime bank exceeded exact declared memory/count cap')
   firstPa=ra['cold']['firstAfter']['private'];firstPb=rb['cold']['firstAfter']['private']
   need(firstPa is None,'wrong stock arm, bank existed before screenshot')
   has_guide={arm:[x for x in row['afterNaturalGuide']['guide'] if x.get('result') in ('prepared','cached')] for arm,row in [('A',ra),('B',rb)]}
   q['guideOutcome']={arm:{'attempted':len(row['afterNaturalGuide']['guide']),'prepared':[x['ids'] for x in has_guide[arm] if x['result']=='prepared'],
       'cacheReuseAlreadyAvailable':[x['ids'] for x in has_guide[arm] if x['result']=='cached'],
       'deltaFromFirstFrameEnd':delta(row['cold']['firstAfter'],row['afterNaturalGuide']['current'])}for arm,row in [('A',ra),('B',rb)]}
   gains={k:[round(t['A']['measurements'][k]-t['B']['measurements'][k],3)for t in q['trials']]for k in ('drawCpuMs','readyToDrawEndMs','readyToFollowingRafMs','launchToDrawEndMs')}
   q['timingDiagnosticOnly']={k:{'pairedMs':xs,'medianMs':statistics.median(xs)}for k,xs in gains.items()}
   firsthit=firstPb and firstPb['hit']>0 and ra['coldConstructors']['svg']>rb['coldConstructors']['svg']
   med=q['timingDiagnosticOnly']['drawCpuMs']['medianMs']
   q['timingQualification']={'thresholdMs':max(8,0.05*statistics.median(t['A']['measurements']['drawCpuMs'] for t in q['trials'])),'positivePairs':sum(x>0 for x in gains['drawCpuMs']),'nativeFirstFramePathReuse':bool(firsthit)}
   t=q['timingQualification']
   q['status']='PASS_BOUNDED_NATIVE_PC_MECHANISM' if firsthit and med>=t['thresholdMs'] and t['positivePairs']>=2 else 'HOLD_ACTUAL_PC_COLD_BENEFIT_NOT_DEMONSTRATED'
   # Timing noise, naturally unavailable guide completion, and heap metric absence are not correctness failures.
  except Exception as e:q['status']='FAIL_EXACT_NATIVE_CONTRACT';q['errors'].append(diag_text(e));raise
  finally:save()
if __name__=='__main__':
 need(len(sys.argv)==3,'usage: capture.py /tmp/exact-work AUTH.json')
 auth=authorization(Path(sys.argv[2]).resolve())
 w=Path(sys.argv[1]).resolve();need(w.is_relative_to(Path('/tmp')),'local /tmp lifecycle only')
 capture(w,auth)
