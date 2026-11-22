"""Read-only normal public Chromium from the pinned official retained release."""
import json,sys,base64,hashlib,io,re,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes());O=json.loads((D/'observer.json').read_bytes());base=P['publicRoot']
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
q={'status':'HOLD','stages':{}}
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
def stage(b,n0,dev,pn,u):
 def render(p):
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  p.evaluate(O['LAUNCH'],n0);p.locator('#battlecanvas').wait_for(state='visible')
  p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}",timeout=14000)
  if n0==32:p.evaluate(O['DECODE'])
  params=dict(id=n0,mapId=f'stage-{n0}',name='south',dx=0,dy=1,readback=False,fixedNow=O['PHASE'])
  m=p.evaluate(O['FROZEN'],params)['meta'];m['physics']=sha(m.pop('signature').encode())
  if n0==42:p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**params,'readback':True})
  raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
  with Image.open(io.BytesIO(raw))as im:read=dict(size=list(im.size),rgba=sha(im.convert('RGBA').tobytes()))
  path=f'public-stage{n0}-{dev}.png';(out/path).write_bytes(raw)
  n({k:m[k]for k in u['pose']}==u['pose'] and u['raw']==read,'reviewed native image / physics / camera mismatch '+path)
  return {'image':path,'png':fact(raw),'rgba':read,'pose':{k:m[k]for k in u['pose']}}
 x=opened(b,[u['width'],u['height']],'HONRO.html',P['stableShell'],pn['required'],render)
 n(x['archiveGETs']==0,'ordinary public launch fetched Stage32 archive')
 if n0==32:
  x['stagePayloadBodies']=sum(x['served'][k]['bytes']for k in pn['parts'])
  n(x['stagePayloadBodies']==pn['assetBytes']==4780398,'ordinary stage32 exact body slice byte count')
 return x
def workshop(b):
 w=P['workshop'];routes={w['entry']:w['entryFact'],P['legacy']['path']:P['legacy']['fact']}
 def project(p):
  p.wait_for_function("()=>window.HONRO_READY instanceof Promise&&window.HONRO_PROJECT_MODE==='full'",timeout=90000)
  p.evaluate("()=>Promise.race([HONRO_READY,new Promise((_,reject)=>setTimeout(()=>reject(Error('Workshop ready deadline')),150000))])")
  res=p.evaluate("""ids=>{
    const p=HONRO_PROJECT;const all=p.library.map(a=>a.id);if(p.stages.length!==50||p.stages.some(s=>s.pending)||all.some(id=>id.startsWith('act4compat32:v1:')))throw Error('bad actual native workshop project');
    const h=a=>{const s=JSON.stringify(a);let x=2166136261;for(let i=0;i<s.length;i++)x=Math.imul(x^s.charCodeAt(i),16777619);return s.length+':'+(x>>>0).toString(16);};
    return {maps:p.stages.map(x=>x.id),library:all,ids:Object.fromEntries(ids.map(k=>[k,h(p.library.find(a=>a.id===k))]))};
  }""",list(w['legacySignatures']))
  n(res['maps']==w['stages'] and res['ids']==w['legacySignatures'] and len(res['library'])==w['assetCount'] and sha(js(res['library']))==w['listSHA256'],'actual native Workshop authors/order/provenance drift')
  return {'mapCount':len(res['maps']),'assetCount':len(res['library']),'archivedSignatures':res['ids'],'orderSHA256':sha(js(res['library']))}
 x=opened(b,[1440,900],'HONRO_WORKSHOP.html',w['shell'],routes,project)
 n(x['archiveGETs']==1,'actual native Workshop fetched archive not exactly once')
 return x
save()
try:
 n(P['enabled'] and P['release'] and base=='https://sys8994.github.io/honro/','readback disabled until exact official new Pages')
 m=json.loads(get('web/manifest.json',P['release']['manifest']))
 keep={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 n(sha(js({k:v for k,v in m.items()if k not in keep},True))==P['normalActiveGraphSHA256'],'published activation differs from qualified review; retention metadata only allowed')
 prior=[x for x in m['publishedGenerations']if x['sourceSha']==P['priorRetainedHead']]
 n(len(prior)==1,'former normal deployment not retained')
 q['retained']={k:fact(get(k,v))for k,v in P['retained'].items()};save()
 with sync_playwright()as pw:
  b=pw.chromium.launch(headless=True);n(b.version=='151.0.7922.34','wrong official Chrome');q['chromium']=b.version
  for i in (32,42):
   row=P[f's{i}']
   for dev,z in row['frames'].items():
    q['stages'][f'{i}-{dev}']=stage(b,i,dev,row,z);save()
  q['workshop']=workshop(b);b.close()
 q['status']='PASS_PUBLIC_EXACT_32_42_PC_M_AND_REAL_WORKSHOP'
finally:save()
