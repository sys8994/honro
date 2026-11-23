"""Native fresh-stage A/B evidence, no deployment or saved-session test."""
import json,sys,base64,hashlib,io,traceback
import contextlib,functools,subprocess,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes()); O=json.loads((D/'observer.json').read_bytes())
def ensure(x,msg):
 if not x: raise RuntimeError(msg)
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def matches(raw,pin):return sha(raw)==pin['sha256']
def save():(proofdir/'READBACK.json').write_text(json.dumps(q,indent=2)+'\n')
class HTTP(SimpleHTTPRequestHandler):
 def send_head(self):
  u=urlsplit(self.path)
  if u.query or not u.path.startswith('/honro/') or any(t in u.path for t in ('..','%')):
   self.send_error(404);return None
  self.path='/'+u.path.removeprefix('/honro/')
  f=Path(self.translate_path(self.path))
  if not f.is_file() or not f.resolve().is_relative_to(Path(self.directory).resolve()):
   self.send_error(404);return None
  return super().send_head()
 def log_message(self,*_):pass
@contextlib.contextmanager
def server(root):
 h=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(HTTP,directory=str(root)))
 t=threading.Thread(target=h.serve_forever,daemon=True);t.start()
 try:yield f'http://127.0.0.1:{h.server_port}/honro/'
 finally:h.shutdown();h.server_close();t.join()
def git(root,*args):return subprocess.check_output(['git','-C',str(root),*args],text=True,timeout=40).strip()
def verify_alias(arm,read):
 pin=P['arms'][arm];mf=json.loads(read('web/manifest.json'))
 files={x['path']:x['sha256'] for x in mf['files']}
 b=json.loads(read(pin['campaign']))
 ensure(mf['project']==pin['campaign'] and b['stages'][41]==pin['map'] and b['stageLibraries'][41]==pin['provider'] and b['assetEncodings']['stageLibraries'][41]=='json','wrong campaign route')
 out={}
 for k,v in pin['files'].items():
  raw=read(k);ensure(sha(raw)==v,'exact authority '+arm+' '+k)
  if k not in ('HONRO.html','web/manifest.json'):ensure(files.get(k)==v,'manifest does not bind '+k)
  out[k]=fact(raw)
 return out
def authority(arm,root):
 pin=P['arms'][arm]
 ensure(git(root,'rev-parse','HEAD')==pin['head'] and git(root,'rev-parse','HEAD^{tree}')==pin['tree'] and not git(root,'status','--porcelain','--untracked-files=all'),'bad immutable publication tree '+arm)
 return verify_alias(arm,lambda p:(root/p).read_bytes())
def camera_args(name,pose,readback=False):
 m=P['cameraModes'][name]
 return dict(id=42,mapId='stage-42',name=m['mode'],ordinary=pose if m['mode']=='ordinary' else [],dx=m['dx'],dy=m['dy'],readback=readback,fixedNow=O['PHASE'])

def stage(br,base,device,arm):
 pin=P['arms'][arm]; routes={base+k:{"sha256":v} for k,v in pin["files"].items() if k!="web/manifest.json"}
 dev=P['devices'][device]; visit=device+'-'+arm; result={'records':{},'served':{}};q['visits'][visit]=result;save()
 ctx=br.new_context(viewport=dict(zip(['width','height'],dev['size'])),device_scale_factor=1,service_workers='block')
 try:
  ctx.route('**/*',lambda route:route.continue_() if route.request.url.startswith(base) or route.request.url.startswith(('data:','blob:','about:')) else route.abort())
  p=ctx.new_page(); requested=[]; responses={}; errors=[]
  p.on('request',lambda r:requested.append(r.url))
  p.on('pageerror',lambda e:errors.append(str(e)))
  p.on('response',lambda r:responses.setdefault(r.url,r) if r.url in routes else None)
  p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
  response=p.goto(base+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  ensure(response and response.url==base+'HONRO.html' and response.status==200 and not response.from_service_worker and matches(response.body(),{'sha256':pin['files']['HONRO.html']}),'current normal shell wrong')
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  p.evaluate(O['LAUNCH'],42);p.locator('#battlecanvas').wait_for(state='visible')
  p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",timeout=14000)
  owner=p.evaluate("""()=>{const b=HonroApp.engine.b;const owners=HonroTerrainDomain.materialLandmarks(b).filter(x=>x.asset?.id==='act5:near:42');
   if(b.honroStage!==42||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||owners.length!==1)throw Error('wrong canonical stage or provider count');
   const t=owners[0],s=JSON.stringify(t.asset);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);
   return {id:t.asset.id,p:[t.x,t.y,t.scale,t.rotation||0],wall:!!t.asset.edgeWall,surface:!!t.asset.edgeSurface,signature:s.length+':'+(h>>>0).toString(16)};}""")
  result['owner']=owner; save()
  ensure(owner==dict(id='act5:near:42',p=[0,0,6500/2022,0],wall=True,surface=True,signature=pin['owner']),'exact provider stamp wrong '+visit)
  for name,k in dev['views'].items():
   result['latestAttempt']={'name':name,'expected':k,**P['cameraModes'][name]};save()
   def observe(readback=False):
    m=p.evaluate(O['FROZEN'],camera_args(name,k,readback))
    m['meta']['physics']=sha(m['meta'].pop('signature').encode())
    return m
   v=observe()
   dec=p.evaluate(O['DECODE']); ensure(not dec['failed'],'image decode failure')
   ensure(v==observe(True),'clock/camera/physical state changed after stock paint/decode')
   m=v['meta']; a=m['actual']
   ensure(m['actorCount']==34 and m['phase']=='aim' and m['round']==1 and m['sceneTime']==2 and m['physics']==P['physics'] and m['backing']==dev['backing'],'wrong actual phase/backing/geometry')
   want=dict(zip(('x','y','scale'),k))
   ensure(a==want,'actual constrained pose differs from archived pose '+visit+' '+name+' '+repr(a))
   if P['cameraModes'][name]['mode']!='ordinary':ensure(abs(a['scale']-m['zoomLimits']['min'])<1e-7,'expected native min zoom')
   raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
   dom=p.locator('#battlecanvas').screenshot(animations='disabled',caret='hide',scale='css',timeout=25000)
   pair={}
   for kind,buf in [('raw',raw),('dom',dom)]:
    image=f'{visit}-{name}-{kind}.png'
    with Image.open(io.BytesIO(buf)) as z:
     sizes=list(z.size);ensure( (sizes==dev['backing'] if kind=='raw' else abs(sizes[0]-m['css']['w'])<2 and abs(sizes[1]-m['css']['h'])<2),'frame backing or CSS dimensions')
     pair[kind]={'file':image,**fact(buf),'size':sizes,'rgba':sha(z.convert('RGBA').tobytes())}
    (proofdir/image).write_bytes(buf)
   result['records'][name]={'pose':v,'pictures':pair};save()
  for url,signed in routes.items():
   r=responses.get(url)
   ensure(r and r.status==200 and not r.from_service_worker and matches(r.body(),signed),'required actual browser route/wire '+url)
   result['served'][url[len(base):]]=fact(r.body())
  result['packetRequests']=requested.count(base+pin['provider'])
  ensure(result['packetRequests']==1 and not errors,'duplicate provider HTTP or page errors: '+repr(errors))
  save()
 finally:ctx.close()
def delta(x,y):
 with Image.open(proofdir/x['file'])as a,Image.open(proofdir/y['file'])as b:
  ensure(a.size==b.size,'RGBA size difference')
  vals=ImageChops.difference(a.convert('RGBA'),b.convert('RGBA')).split()
  all_=ImageChops.lighter(ImageChops.lighter(vals[0],vals[1]),ImageChops.lighter(vals[2],vals[3]))
  hs=all_.histogram(); alpha=vals[3].histogram(); box=all_.getbbox()
  h=all_.width*all_.height
  return {'changed':h-hs[0],'alpha':h-alpha[0],'maxDN':max(i for i,v in enumerate(hs) if v),'bbox':box}

if __name__=='__main__':
 ensure(P['enabled'] is True and P['publicRoot']=='https://sys8994.github.io/honro/','disabled; no public or browser request')
 ensure(sha((D/'observer.json').read_bytes())==P['observerSHA256'],'wrong reviewed observer')
 from playwright.sync_api import sync_playwright
 from PIL import Image,ImageChops
 roots=dict(zip(('A','B'),map(lambda p:Path(p).resolve(),sys.argv[1:3])));proofdir=Path(sys.argv[3]);proofdir.mkdir(parents=True,exist_ok=False)
 q={'status':'HOLD_BEFORE_FULL_CAPTURE','scope':'Frozen Stage42 genuine Chrome fresh public-code a6 and 3c exact historical deployment graphs on immutable loopbacks. No live endpoint or title persistence tested. Synthetic first aim, no user state; visuals require human review.','visits':{},'comparisons':{},'graph':{}}
 save()
 try:
  q['historicalPublicHTTP']=P['historicalPublicHTTP'];save()
  for arm,root in roots.items():q['graph'][arm]=authority(arm,root);save()
  with server(roots['A']) as aa,server(roots['B']) as bb,sync_playwright() as pw:
   br=pw.chromium.launch(headless=True,chromium_sandbox=True)
   try:
    ensure(br.version==P['chrome'],'wrong Chrome')
    for d in P['devices']:
     stage(br,aa,d,'A');stage(br,bb,d,'B')
   finally:br.close()
  poseFails=[];differences=[]
  for d,dev in P['devices'].items():
   for name in dev['views']:
    a=q['visits'][d+'-A']['records'][name];b=q['visits'][d+'-B']['records'][name]
    tag=d+'-'+name
    diffs={k:delta(a['pictures'][k],b['pictures'][k]) for k in ('raw','dom')}
    equal=a['pose']==b['pose']
    q['comparisons'][tag]={'poseExactlySame':equal,**diffs}
    if not equal:poseFails.append(tag)
    if any(x['changed'] for x in diffs.values()): differences.append(tag)
  ensure(not poseFails,'non-matching paired camera/pose state: '+repr(poseFails))
  q['status']='ACTUAL_EVIDENCE_REVIEW_REQUIRED_NOT_PIXEL_EQUAL' if differences else 'ACTUAL_SCOPE_EXACT_VISUAL_MATCH'
  q['changingPairs']=differences
 except Exception:
  q['firstFailure']=traceback.format_exc(limit=8);raise
 finally:save()
