"""Native A1/A2/B served from two isolated normal HTTP roots; no route overrides."""
import base64,hashlib,json,os,re,sys,time,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
import frames
from guard import H,fact,save
P=json.loads((H/'QA-POSES.json').read_bytes());O=json.loads((H/'observer.json').read_bytes());PARK=(H/'park.js').read_text()
MEDIA={f'assets/bgm/{k}.mp3'for k in ('main','battle-1','battle-2','battle-3','battle-4')}
DIR={'west':(-1,0),'northwest':(-1,-1),'east':(1,0),'west-near':(-1,0)}
def capture(browser,root,g,r,role,dim):
 out=root/'out';arm='B' if role=='B' else 'A';works=g['active'+arm]
 expected=set(g['required'+arm])|{'HONRO.html'};assert expected<=works.keys()
 origin='http://127.0.0.1:'+('18912'if arm=='B'else '18911')+'/';bl=re.compile(r'blob:'+re.escape(origin)+r'[0-9a-f-]{36}')
 res=[];pending=set();fault=[];seen={};blobs=set()
 w,h=map(int,dim.split('x'));cv={'width':w,'height':h}
 c=browser.new_context(viewport=cv,device_scale_factor=1,service_workers='block')
 assert c.storage_state()=={'cookies':[],'origins':[]}
 p=c.new_page();p.set_default_timeout(30000);p.add_init_script('('+O['INIT']+')()')
 def key(x):return x[len(origin):]if x.startswith(origin)and '?'not in x and '#'not in x else None
 def req(q):
  x=key(q.url)
  if q.method!='GET' or not(x in works or x in MEDIA and q.resource_type=='media' or bl.fullmatch(q.url) or q.url.startswith('data:')):
   fault.append(('request',q.method,q.url))
  if x in works:pending.add(q)
 def fail(q):
  pending.discard(q)
  if not(key(q.url)in MEDIA and q.resource_type=='media'and q.failure=='net::ERR_ABORTED'):fault.append(('failed',q.url,q.failure))
 def got(q):
  x=key(q.url)
  if x in works and q.status==200 and not q.from_service_worker:res.append((x,q))
  elif bl.fullmatch(q.url)and q.status==200:blobs.add(q.url)
  elif not(x in MEDIA and q.status in (200,206) and q.request.resource_type=='media' or q.url.startswith('data:')):fault.append(('response',q.status,q.url))
 for name,fn in [('request',req),('requestfailed',fail),('requestfinished',lambda q:pending.discard(q)),('response',got),('pageerror',lambda e:fault.append(('pageerror',str(e))))]:
  p.on(name,fn)
 rows=r['visits'][role]
 try:
  nav=p.goto(origin+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  assert nav and nav.status==200 and nav.url==origin+'HONRO.html' and not nav.from_service_worker
  assert nav.request.method=='GET' and nav.request.is_navigation_request() and nav.request.frame==p.main_frame and not nav.request.redirected_from and not nav.request.redirected_to
  assert fact(nav.body())==works['HONRO.html']
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  provider=p.evaluate(O['LAUNCH'],{'stage':17,'catalogID':'stage-17','activeDeclaredDimensions':[6200,4600],'compactWitness':g['compact'+arm]})
  assert provider=={'stage':'stage-17','compact':{'revision':617,'matched':True,'assetCount':len(g['compact'+arm]['packageAssetIDs'])},'width':6200,'height':4600}
  cv=p.locator('#battlecanvas');cv.wait_for(state='visible')
  p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  cases={k:v['direction']for k,v in P.items()if v['device']==dim}
  if dim=='1440x900':cases[dim+'-west-near']='west-near'
  for k,name in cases.items():
   dx,dy=DIR[name];q=dict(stage=17,id='stage-17',name=name,dx=dx,dy=dy,readback=False)
   if name=='west-near':q['near']={'x':80,'y':1650,'scale':.5}
   f=p.evaluate(PARK,q);count=p.evaluate(O['DECODE'])
   assert count>0 and p.evaluate(PARK,{**q,'readback':True})==f
   row=rows[k]={'frame':f,'provider':provider,'decodeCount':count,'verifiedServedClosure':False,'pngs':{'RAW':{},'DOM':{}}}
   for phase in ('firstCaptured','settled'):
    assert p.evaluate(PARK,{**q,'readback':True})==f
    for kind,raw in [('RAW',base64.b64decode(p.evaluate(O['RAW']),validate=True)),('DOM',cv.screenshot(type='png'))]:
     n=f'{role}-{k}-{kind}-{phase}.png';(out/n).write_bytes(raw)
     row['pngs'][kind][phase]={'file':n,'sha256':hashlib.sha256(raw).hexdigest()}
   save(out/'NATIVE-STAGE17.json',r)
  at=0;stable=0;deadline=time.monotonic()+30
  while time.monotonic()<deadline:
   assert not fault,fault
   while at<len(res)and res[at][1].request not in pending:
    x,q=res[at];assert fact(q.body())==works[x],x;seen[x]=works[x];at+=1
   plen=(len(res),len(blobs));p.wait_for_timeout(105)
   stable=stable+1 if at==len(res)and not pending and plen==(len(res),len(blobs))and expected<=seen.keys()else 0
   if stable==3:break
  assert stable==3 and not fault,(sorted(expected-seen.keys()),fault)
  assert blobs<=set(p.evaluate('()=>Array.from(__honroObserver.blobs)'))
  for k in cases:
   rows[k]['verifiedServedClosure']=True;rows[k]['requiredObserved']={x:seen[x]for x in sorted(expected)}
 finally:
  r['network'][role+'-'+dim]={'observed':len(seen),'fault':fault};save(out/'NATIVE-STAGE17.json',r);c.close()
def main(work):
 g=json.loads((work/'out/GRAPH.json').read_bytes())
 proof={'mode':'NORMAL_BUILT_HTTP_BROWSER_WITHOUT_OVERRIDES','visits':{k:{}for k in ('A1','A2','B')},'network':{},'errors':{},'status':'HOLD'}
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True)
  assert b.version=='151.0.7922.34';proof['chrome']=b.version
  for role in proof['visits']:
   for dim in ('1440x900','390x844'):
    try:capture(b,work,g,proof,role,dim)
    except Exception:proof['errors'][role+'-'+dim]=traceback.format_exc();save(work/'out/NATIVE-STAGE17.json',proof)
 assert not proof['errors'],proof['errors']
 proof['scopeComparison']=frames.main(work/'out')
 proof['status']='PASS_NARROW_STAGE17_NATIVE_ONLY'
 save(work/'out/NATIVE-STAGE17.json',proof)
if __name__=='__main__':main(Path(sys.argv[1]))
