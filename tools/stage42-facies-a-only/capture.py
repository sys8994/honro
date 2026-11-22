"""Read-only normal public Chromium from the pinned official retained release."""
import json,sys,base64,hashlib,io,re,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes());O=json.loads((D/'observer.json').read_bytes());base=P['publicRoot']
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
q={'status':'HOLD','scope':'3 paired actual near anchors on exact 0b9, no art/gameplay edit','views':{}}
def save():(out/'READBACK.json').write_text(json.dumps(q,indent=2)+'\n')
def n(x,e):
 if not x:raise RuntimeError(e)
def sha(x):return hashlib.sha256(x).hexdigest()
def fact(x):return dict(bytes=len(x),sha256=sha(x))
def js(d,sort=False):return json.dumps(d,ensure_ascii=False,sort_keys=sort,separators=(',',':')).encode()
def get(k,pin):
 u=base+k; req=urllib.request.Request(u,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 HONRO non-mutating release verification'})
 with urllib.request.urlopen(req,timeout=45)as r:
  z=r.read(pin['bytes']+1)
  n(r.status==200 and r.geturl()==u and fact(z)==pin,'actual exact served bytes wrong: '+k)
  return z
def opened(b,size,entry,auth,routes,fn):
 c=b.new_context(viewport=dict(zip(('width','height'),size)),device_scale_factor=1,service_workers='block')
 try:
  p=c.new_page();z={};req=[];errors=[]
  p.on('request',lambda w:req.append(w.url.split('?',1)[0]))
  p.on('pageerror',lambda e:errors.append(str(e)))
  p.on('response',lambda r:z.setdefault(r.url.split('?',1)[0],r) if r.url.split('?',1)[0] in {base+k for k in routes} else None)
  p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
  nav=p.goto(base+entry,wait_until='domcontentloaded',timeout=50000)
  n(nav and nav.url==base+entry and nav.status==200 and not nav.from_service_worker and fact(nav.body())==auth,'public ordinary entrypoint changed')
  x=fn(p)
  x['served']={}
  for k,w in routes.items():
   r=z.get(base+k)
   n(r and r.status==200 and not r.from_service_worker and fact(r.body())==w,'public native page did not read exact immutable body '+k)
   x['served'][k]=w
  n(not errors,'public app page errors '+repr(errors));x['archiveGETs']=req.count(base+P['legacy']['path'])
  return x
 finally:c.close()
def verified_view(p,m,v,expected):
 want=v['requested']
 n(m['phase']=='aim' and m['round']==1 and m['sceneTime']==2 and m['physics']==expected['physics'] and m['backing']==expected['backing'],'exact same live stage/battle/backing required')
 n(m['desired']==dict(zip(('x','y','scale'),want)),'wrong exact prescribed requested camera')
 f,z,a=m['focus'],m['zoomLimits'],m['actual']
 n(f['left']<=a['x']<=f['right'] and f['top']<=a['y']<=f['bottom'] and z['min']<a['scale']<=z['max'],'near engine constrained camera is not valid')
 n(abs(a['scale']-want[2])<1e-6,'near scale clamped unexpectedly')
def stage(br,dev):
 d=P['s42'];paths=d['required'];width,height=P['device'][dev]['viewport']
 def render(p):
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  p.evaluate(O['LAUNCH'],42);p.locator('#battlecanvas').wait_for(state='visible')
  p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",timeout=14000)
  own=p.evaluate("""()=>{const b=HonroApp.engine.b;const owners=HonroTerrainDomain.materialLandmarks(b).filter(x=>x.asset?.id==='act5:near:42');if(b.honroStage!==42||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||owners.length!==1)throw Error('unqualified actual owner');const t=owners[0],s=JSON.stringify(t.asset);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return {id:t.asset.id,p:[t.x,t.y,t.scale,t.rotation||0],hasWall:!!t.asset.edgeWall,hasSurface:!!t.asset.edgeSurface,signature:s.length+':'+(h>>>0).toString(16)};}""")
  n(own['hasWall'] and own['hasSurface'] and own['p']==[0,0,6500/2022,0],'Stage42 near owner changed')
  x={'owners':own,'records':{}};q['views'][dev]=x;save()
  for k,v in P['views'].items():
   if not k.startswith(dev+'-'):continue
   args=dict(id=42,mapId='stage-42',name='ordinary',ordinary=v['requested'],dx=0,dy=0,readback=False,fixedNow=O['PHASE'])
   m=p.evaluate(O['FROZEN'],args)['meta'];m['physics']=sha(m.pop('signature').encode())
   p.evaluate(O['DECODE']);r=p.evaluate(O['FROZEN'],{**args,'readback':True})['meta'];r['physics']=sha(r.pop('signature').encode())
   n(m==r,'camera/physical state changed after asset decode '+k)
   raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
   with Image.open(io.BytesIO(raw))as im:
    n(list(im.size)==m['backing'],'PNG wrong backing')
    rgba=sha(im.convert('RGBA').tobytes())
   name=k+'-raw.png';(out/name).write_bytes(raw)
   x['records'][k]={'png':fact(raw),'image':name,'rgba':rgba,'proof':m};save()
   verified_view(p,m,v,d['frames'][dev]['pose'])
  n(len(x['records'])==3,'expected 3 exact actual near anchors')
  return x
 x=opened(br,[width,height],'HONRO.html',P['stableShell'],paths,render)
 n(x['archiveGETs']==0,'ordinary Stage42 capture fetched unrelated Stage32 legacy archive')
 return x
save()
try:
 n(P['enabled'] is True and base=='https://sys8994.github.io/honro/','unexpected public origin')
 m=get('web/manifest.json',P['release']['manifest'])
 n(hashlib.sha1(f'blob {len(m)}\0'.encode()+m).hexdigest()==P['releaseManifestGit'],'wrong exact manifest Git')
 a=json.loads(m);keep={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 n(sha(js({k:v for k,v in a.items()if k not in keep},True))==P['normalActiveGraphSHA256'],'active page graph changed')
 q['manifest']=fact(m);save()
 with sync_playwright()as pw:
  b=pw.chromium.launch(headless=True);n(b.version=='151.0.7922.34','wrong official Chrome');q['chromium']=b.version
  try:
   for dev in ('PC','M'):
    q['views'][dev]=stage(b,dev);save()
  finally:b.close()
 q['status']='PASS_EXACT_PINNED_STAGE42_SIX_ACTUAL_NEAR_FRAMES_ONLY'
finally:save()
