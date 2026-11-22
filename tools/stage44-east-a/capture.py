from pathlib import Path
import sys,json,hashlib,base64,io,urllib.request
from PIL import Image
from playwright.sync_api import sync_playwright
d=Path(__file__).resolve().parent; out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
P=json.loads((d/'PINS.json').read_bytes());O=json.loads((d/'observer.json').read_bytes());origin=P['origin']; report={'status':'HOLD','cases':{},'errors':[]}
def n(x,m):
 if not x:raise RuntimeError(m)
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def save():(out/'READBACK.json').write_text(json.dumps(report,indent=2)+'\n')
def verify_http():
 pin=P['release']['manifest']; req=urllib.request.Request(origin+'web/manifest.json',headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'})
 with urllib.request.urlopen(req,timeout=45)as r:
  data=r.read(pin['bytes']+1);n(r.status==200 and r.geturl()==req.full_url,'wrong public route')
 n(fact(data)=={k:pin[k] for k in ('bytes','sha256')} and hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()==pin['git'],'wrong exact Pages manifest body')
 g=json.loads(data);files={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in g['files']}
 n(all(files[k]==v for k,v in P['qualifiedRoutes'].items()),'current stage42/44 backdrop/painter references changed')
 report['manifest']=pin;save()
def session(browser,who,size):
 c=browser.new_context(viewport=dict(zip(('width','height'),size)),device_scale_factor=1,service_workers='block');p=c.new_page();seen={};errs=[]
 routes={origin+k for k in P['qualifiedRoutes']}
 p.on('response',lambda r:seen.setdefault(r.url,r) if r.url in routes else None);p.on('pageerror',lambda e:errs.append(str(e)))
 try:
  p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
  u=origin+'HONRO.html';nav=p.goto(u,wait_until='domcontentloaded',timeout=50000)
  n(nav and nav.url==u and nav.status==200 and not nav.from_service_worker and fact(nav.body())==P['shell'],'wrong public app')
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true' && typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  p.evaluate(O['LAUNCH'],44);p.locator('#battlecanvas').wait_for(state='visible')
  p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}",timeout=15000,polling=125)
  for k,pose in P['poses'][who].items():
   args=dict(id=44,mapId='stage-44',name='east-min' if k=='east-min' else 'ordinary',ordinary=pose,dx=1 if k=='east-min' else 0,dy=0,readback=False,fixedNow=O['PHASE'])
   m=p.evaluate(O['FROZEN'],args)['meta'];p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**args,'readback':True});m['physical']=sha(m.pop('signature').encode())
   raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True);fn=who+'-'+k+'-RAW.png';(out/fn).write_bytes(raw)
   record={'exact':False,'meta':m,'raw':{'path':fn,**fact(raw)}};report['cases'][who+'-'+k]=record;save()
   with Image.open(io.BytesIO(raw))as im:n(list(im.size)==m['backing'],'native raw size');record['rgba']=sha(im.convert('RGBA').tobytes())
   n(m['physical']==P['physics'] and m['round']==1 and m['phase']=='aim' and m['sceneTime']==2 and m['css']['w']==size[0],'original physical state changed')
   n(all(abs(m['actual'][v]-b)<1e-6 for v,b in zip(('x','y','scale'),pose)) and m['focus']['right']==pose[0] and (k!='east-min' or abs(m['zoomLimits']['min']-pose[2])<=1e-9)
      and m['viewport']['left']<6800 and m['viewport']['right']>8130 and m['viewport']['top']<950 and m['viewport']['bottom']>2375,'wrong stock native normal camera clamp')
   own=p.evaluate("""()=>{const b=HonroApp.engine.b,f=HonroTerrainDomain.materialLandmarks(b).filter(x=>x.asset?.id==='act5:near:44'),st=HONRO_PROJECT.stages.find(x=>x.id==='stage-44');if(f.length!==1)throw Error('ambiguous active native owner');const l=f[0];return {id:l.asset.id,instance:l.id,scale:l.scale,xy:[l.x,l.y],root:!!l.asset.rootExterior,crown:!!l.asset.upperCanopy,environment:st.environment.preset,groups:st.environment.groups.length,placements:st.environment.placements.length,mode:b.mode,origin:b.honroMapOrigin};}""")
   n(all(own[v]==x for v,x in P['nearAsset'].items()) and own['xy']==[0,0] and own['root'] and own['crown'] and own['mode']=='campaign' and own['origin']=='campaign' and own['groups']==own['placements']==0,'wrong approved foliage/physics ownership')
   record['owner']=own;record['exact']=True;save()
  for k,pin in P['qualifiedRoutes'].items():
   r=seen.get(origin+k);n(r and r.status==200 and not r.from_service_worker and fact(r.body())==pin,'a live packet, source or backdrop body changed: '+k)
  n(not errs,'ordinary game emitted page errors');save()
 except Exception as e:
  report['errors'].append([who,repr(e),errs]);print(who,repr(e),flush=True);save()
 finally:c.close()
save()
try:
 n(P['enabled'] and origin=='https://sys8994.github.io/honro/','disabled or unqualified anonymous origin');verify_http()
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True)
  try:
   n(b.version=='151.0.7922.34','not exact native Chromium')
   for who,size in [('PC',[1440,900]),('M',[390,844])]:session(b,who,size)
  finally:b.close()
 n(len(report['cases'])==4 and all(v['exact'] for v in report['cases'].values()) and not report['errors'],'missing one or more genuine current pictures')
 report['status']='ACTUAL_EAF_STAGE44_EAST_FOUR_STOCK_VIEWS'
finally:save()
