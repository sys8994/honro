"""Read-only actual anonymous live route; old synthetic save held in process memory."""
from pathlib import Path
import os,subprocess as S,sys,hashlib,base64,time,json,urllib.request
from playwright.sync_api import sync_playwright
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes());O=json.loads((D/'observer.json').read_bytes())
def need(x,m):
 if not x:raise RuntimeError(m)
def fact(x):return {'bytes':len(x),'sha256':hashlib.sha256(x).hexdigest()}
def stamp(x):return {**fact(x),'git':hashlib.sha1(f'blob {len(x)}\0'.encode()+x).hexdigest()}
def git(p,*q):return S.check_output(['git','-C',str(p),*q],text=True,timeout=90).strip()
w=Path(sys.argv[1]).resolve();out=w/'out';report={'status':'HOLD','photos':{},'legacy':{},'rawExported':False}
def result():(out/'PUBLIC.json').write_text(json.dumps(report,indent=2)+'\n')
result();R=P['release'];origin=P['origin'];head=os.environ['GITHUB_SHA'];root=Path(os.environ['GITHUB_WORKSPACE'])
need(P['enabled'] is True and all(R[v] for v in ('head','tree','pages','job','manifest')),'DISABLED: exact future live publication not authorized')
need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(P['repo'],P['qaRef'],'push'),'wrong readback ref')
need(git(root,'rev-list','--parents','-1',head)==head+' '+R['head'] and git(root,'rev-parse',R['head']+'^{tree}')==R['tree'],'nonexact current published parent')
want={'.github/workflows/stage07-chapter-public.yml',*(f'tools/stage07-chapter-public/{x}'for x in ('PINS.json','observer.json','readback.py'))}
need(set(git(root,'diff','--name-status',R['head'],head).splitlines())=={'A\t'+p for p in want},'unexpected changes in readback ref')
def get(url,limit):
 q=urllib.request.Request(url,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 HONRO chapter7 public check'})
 with urllib.request.urlopen(q,timeout=35)as r:need(r.status==200 and r.geturl()==url,'wrong anonymous origin');return r.read(limit+1)
manifest=get(origin+'web/manifest.json',R['manifest']['bytes'])
need(stamp(manifest)==R['manifest'],'public manifest does not have exact official master bytes')
report['publicManifest']=stamp(manifest);result()
old=w/'H';git(root,'worktree','add','--detach',str(old),P['old']['head']);need(git(old,'rev-parse','HEAD^{tree}')==P['old']['tree'],'historical stage7 checkout differs')
for k,v in P['old']['routes'].items():need(fact((old/k).read_bytes())==v,'historical source differs '+k)
old_url='http://127.0.0.1:18841/'
proc=S.Popen(['python','-m','http.server','18841','--bind','127.0.0.1','--directory',str(old)],stdout=(out/'old-http.log').open('wb'),stderr=S.STDOUT)
KEY='honro-first-act-profile-1'
def auth(br,url,dim,seed=None):
 c=br.new_context(viewport={'width':dim[0],'height':dim[1]},device_scale_factor=1,service_workers='block')
 if seed is not None:c.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(seed,ensure_ascii=True)+');')
 p=c.new_page();requests={};e=[]
 p.on('response',lambda rr:requests.setdefault(rr.url,rr));p.on('pageerror',lambda err:e.append(str(err)))
 p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
 nav=p.goto(url+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
 need(nav and nav.status==200 and nav.url==url+'HONRO.html' and not nav.from_service_worker,'public app wrong document')
 p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
 return c,p,requests,e
def load_routes(net,u,pins):
 for k,v in pins.items():
  r=net.get(u+k);need(r and r.status==200 and not r.from_service_worker and fact(r.body())==v,('unexpected public stage7 route',k))
def begin(p):
 p.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
 p.evaluate(O['LAUNCH'],7)
 ready(p)
def ready(p):
 p.locator('#battlecanvas').wait_for(state='visible')
 p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return a.engine?.b?.honroStage===7&&document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}",polling=125,timeout=15000)
def save(p):
 return p.evaluate("()=>{const a=HonroApp;if(a.engine?.b?.mode!=='campaign'||a.engine?.b?.honroStage!==7||a.debugMode||a.training)throw Error('not genuine normal save route');a.showTitle();const s=localStorage.getItem('honro-first-act-profile-1');if(JSON.parse(s||'null')?.honroBattle?.honroStage!==7||a.profileStore.locked)throw Error('Stage7 UI persistence missing');return s;}")
def model(p):
 q=p.evaluate("""()=>{const b=HonroApp.engine.b,old=b.honroLandmarks.find(x=>x.asset?.id==='act1-site:7:body'),paint=HonroTerrainDomain.materialLandmarks(b).find(x=>x.asset?.id==='act1-site:7:body');
 return {provider:JSON.stringify(old.asset),scope:JSON.stringify([b.honroWorldTerrain,b.honroPlayBounds,b.honroTerrainBounds,b.honroLandmarks.map(z=>[z.id,z.scale,z.x,z.y,z.collisionIds])]),oldBase:old.asset.vector.root.children[0]===paint.asset.vector.root.children[0],usesFacies:paint.asset.vector.root.children[1]?.clipPath==='stage7R7Facies'};}""")
 need(q['oldBase'] and q['usesFacies'] and {'provider':fact(q['provider'].encode()),'physicalUnregistered':fact(q['scope'].encode())}==P['provider'],'wrong authoritative public original provider/reference class')
try:
 for attempt in range(12):
  try:get(old_url+'HONRO.html',20000);break
  except Exception:
   if attempt==11:raise
   time.sleep(.25)
 with sync_playwright()as a:
  browser=a.chromium.launch(headless=True)
  try:
   need(browser.version=='151.0.7922.34','wrong native Chromium')
   for v,dim in [('PC',(1440,900)),('M',(390,844))]:
    c,p,n,e=auth(browser,origin,dim)
    try:
     begin(p);model(p)
     d={'id':7,'mapId':'stage-7','name':'south','dx':0,'dy':1,'ordinary':None,'readback':False,'fixedNow':O['PHASE']}
     m=p.evaluate(O['FROZEN'],d)['meta'];p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**d,'readback':True})
     raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
     raw_name=v+'-public-south-RAW.png';(out/raw_name).write_bytes(raw)
     (out/(v+'-public-south-DOM.png')).write_bytes(p.screenshot(timeout=15000))
     pose={k:m[k]for k in ('actual','viewport','backing')}
     report['photos'][v]={'raw':fact(raw),'pose':pose,'path':raw_name};result()
     load_routes(n,origin,P['liveRoutes'])
     need(fact(raw)==P['approvedRaw'][v] and pose==P['scopePose'][v] and not e,'published native scene differs from approved normal R7')
    finally:c.close()
   c,p,net,e=auth(browser,old_url,(1440,900))
   try:
    begin(p);load_routes(net,old_url,P['old']['routes'])
    d={'id':7,'mapId':'stage-7','name':'ordinary','dx':0,'dy':0,'ordinary':P['historicalSaveCamera'],'readback':False,'fixedNow':O['PHASE']}
    p.evaluate(O['FROZEN'],d);p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**d,'readback':True});txt=save(p)
    need(isinstance(txt,str) and fact(txt.encode())==P['old']['oldSave'] and not e,'genuine historical stage7 autosave changed')
   finally:c.close()
   for v,dim in [('PC',(1440,900)),('M',(390,844))]:
    c,p,n,e=auth(browser,origin,dim,txt)
    try:
     need(p.evaluate("()=>HonroApp.profileStore.original().text")==txt,'public local read did not preserve exact old bytes')
     p.evaluate("()=>{HonroApp.frame=()=>{};}")
     p.locator('[data-action="continue"]').first.click(timeout=15000)
     p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===7&&!!HonroApp.scene",timeout=22000);ready(p);model(p)
     load_routes(n,origin,P['liveRoutes'])
     now=save(p);need(isinstance(now,str) and 'act1-site:7:r7-facies' not in now and 'r7FaciesAssetId' not in now ,'paint spilled into saved source')
     before,after=[json.loads(v)['honroBattle']for v in (txt,now)]
     same=all(before.get(k)==after.get(k)for k in ('honroWorldTerrain','honroTerrainBounds','honroPlayBounds','honroLandmarks','honroElements','honroMap'))
     need(same and not e,'old public resave physics/design/provider changed')
     report['legacy'][v]={'actualTitleContinue':True,'oldExact':fact(txt.encode()),'resaved':fact(now.encode()),'geometryAndProviderExact':same};result()
    finally:c.close()
   need(set(report['photos'])==set(report['legacy'])=={'PC','M'},'incomplete required public receipts')
   report['status']='PASS_ACTUAL_PUBLIC_07_PC_M_AND_OLD_NATIVE_SAVE'
  finally:browser.close()
finally:proc.terminate();result()
