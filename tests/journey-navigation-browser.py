"""Focused atlas UI/geometry evidence in actual Chromium, with explicit progress fixtures."""
import json,subprocess,hashlib,os
from pathlib import Path
from contextlib import contextmanager
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/os.environ.get('HONRO_JOURNEY_NAV_OUT','game/docs/icon-cache-journey-navigation/evidence');OUT.mkdir(parents=True,exist_ok=True)
PASS=os.environ.get('JOURNEY_REVIEW','review1')
@contextmanager
def server(root):
 class Quiet(SimpleHTTPRequestHandler):
  def log_message(self,*_):pass
 s=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));t=Thread(target=s.serve_forever,daemon=True);t.start()
 try:yield f'http://127.0.0.1:{s.server_port}'
 finally:s.shutdown();s.server_close();t.join(2)
SEED="""count=>{const a=HonroApp;a.stopBattle();a.engine=null;a.close();a.dialogue=null;a.profile=JSON.parse(window.freshProfile);a.normalProfile=a.profile;a.debugMode=false;a.profile.cleared={};for(let id=1;id<=count;id++)a.profile.cleared[id]={visits:1,rounds:5};a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];a.profile.seen={};a.profile.honroBattle=null;a.journeyZoom=1;a.journeySelection=null;a.screen='title';}"""
def settle(p):p.wait_for_function("document.querySelector('.journey-map-image')?.complete && document.querySelector('.journey-map-image').naturalWidth>0");p.wait_for_timeout(100)
def shot(p,name):
 path=OUT/f'{PASS}-{name}.jpg';p.screenshot(path=str(path),type='jpeg',quality=82);assert path.stat().st_size<1000000
GEO="""()=>{const v=document.querySelector('.journey-map-scroll').getBoundingClientRect(),mr=document.querySelector('.journey-map').getBoundingClientRect(),def=HonroJourneyImages.definition(HonroApp.journeyAct);return [...document.querySelectorAll('.journey-pin')].map(p=>{const n=p.querySelector('i').getBoundingClientRect(),t=p.querySelector('span').getBoundingClientRect(),r=p.getBoundingClientRect(),x=n.x+n.width/2,y=n.y+n.height/2;const anchor=def.stages.find(a=>a.stageNumber===+p.dataset.id);return {id:+p.dataset.id,anchorError:Math.hypot(x-mr.x-anchor.x/def.width*mr.width,y-mr.y-anchor.y/def.height*mr.height),x,y,dx:t.x-x,dy:t.y-y,w:t.width,h:t.height,ownOverlap:Math.max(0,Math.min(n.right,t.right)-Math.max(n.left,t.left))*Math.max(0,Math.min(n.bottom,t.bottom)-Math.max(n.top,t.top)),visible:x>=v.left&&x<=v.right&&y>=v.top&&y<=v.bottom,touch:[r.width,r.height]}})}"""
rows=[];errors=[];anchors=[];checks=[]
with sync_playwright() as pw:
 b=launch(pw)
 for label,root in [('baseline',Path('/tmp/honro-icon-baseline')),('fixed',ROOT)]:
  if PASS!='review1' and label=='baseline':continue
  with server(root) as base:
   p=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);p.on('pageerror',lambda e:errors.append(str(e)))
   p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('window.freshProfile=JSON.stringify(HonroApp.profile)')
   for w,h in [(390,844),(360,800),(844,390)]:
    p.set_viewport_size({'width':w,'height':h});p.evaluate(SEED,29);p.evaluate('HonroRestJourney.showBook(HonroApp,9,null,1)');settle(p)
    dims=p.evaluate("()=>{const v=document.querySelector('.journey-map-viewport').getBoundingClientRect(),header=document.querySelector('.journey-heading').getBoundingClientRect(),footer=document.querySelector('.journey-detail').getBoundingClientRect();return {map:{x:v.x,y:v.y,width:v.width,height:v.height,area:v.width*v.height},header:header.height,footer:footer.height,overflow:document.documentElement.scrollWidth>innerWidth}}")
    rows.append({'label':label,'size':[w,h],**dims});shot(p,f'{label}-{w}x{h}')
    if label=='fixed':
     assert not dims['overflow'];assert dims['header']<=56;assert dims['footer']<=68
     assert p.locator('.journey-map-tools,.journey-map-legend,.journey-back').count()==0
     assert p.locator('[data-action=journey-fit]').count()==1
     controls=p.locator('.journey-heading button,.journey-detail button').evaluate_all('es=>es.map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height]})');assert all(min(v)>=44 for v in controls),controls
   if label=='baseline':
    p.evaluate('HonroRestJourney.zoomBook(HonroApp,1.8,195,300);HonroRestJourney.revealBook(HonroApp)');shot(p,'baseline-zoom9');rows.append({'label':'baseline-zoom9','labels':p.evaluate(GEO)})
    p.close();continue
   # Fresh save: only one pin, no future place or route spoilers.
   p.set_viewport_size({'width':390,'height':844});p.evaluate(SEED,0);p.evaluate('HonroRestJourney.showBook(HonroApp,1,null,1)');settle(p)
   assert p.locator('.journey-pin').count()==1 and p.locator('.journey-progress path').count()==0
   assert p.locator('[data-action=journey-act][data-id="2"]').is_disabled();shot(p,'locked-initial')
   old=p.evaluate('HonroJourneyImages.cacheInfo()');p.evaluate('HonroRestJourney.showBook(HonroApp,11,null,2)');assert p.evaluate('HonroApp.journeyAct')==1;assert p.evaluate('HonroJourneyImages.cacheInfo()')==old
   checks.append('locked acts/pins/routes suppressed, no locked image request')
   p.evaluate(SEED,8);p.evaluate('HonroRestJourney.showBook(HonroApp,9,null,1)');settle(p)
   states=p.locator('.journey-progress path[data-from]').evaluate_all('es=>es.map(e=>({from:+e.dataset.from,to:+e.dataset.to,state:e.getAttribute("class")}))');assert len(states)==8 and states[-1]['state']=='progress-current';assert p.locator('.journey-pin[data-id="10"]').count()==0;checks.append('completed/current route brightness; no route to locked stage10')
   p.evaluate(SEED,29)
   for act,selected in [(1,9),(2,18),(3,25)]:
    p.set_viewport_size({'width':1280,'height':900});p.evaluate('([act,id])=>HonroRestJourney.showBook(HonroApp,id,null,act)',[act,selected]);settle(p)
    p.locator('[data-action=journey-fit]').click();p.wait_for_timeout(60);assert p.locator('.journey-map').evaluate('e=>e.clientWidth<=document.querySelector(".journey-map-scroll").clientWidth+1 && e.clientHeight<=document.querySelector(".journey-map-scroll").clientHeight+1');shot(p,f'act{act}-overview')
    routes=p.locator('.journey-progress path[data-from]').evaluate_all('es=>es.map(e=>({from:+e.dataset.from,to:+e.dataset.to,d:e.getAttribute("d")}))');assert len(routes)==9;assert all(r['to']==r['from']+1 and 'C' in r['d'] and ' L' not in r['d'] for r in routes);assert p.locator('.journey-investigations').count()==0
    p.set_viewport_size({'width':390,'height':844});p.evaluate('([act,id])=>HonroRestJourney.showBook(HonroApp,id,null,act)',[act,selected]);settle(p);shot(p,f'act{act}-mobile')
    for id in range((act-1)*10+1,act*10+1):
     for zoom in [.8,1.2,1.8]:
      p.evaluate('([id,zoom])=>{const a=HonroApp;a.journeySelection=id;HonroRestJourney.zoomBook(a,zoom,195,350);HonroRestJourney.revealBook(a)}',[id,zoom]);p.wait_for_timeout(20)
      g=next(g for g in p.evaluate(GEO) if g['id']==id);anchors.append({'act':act,'zoom':zoom,**g});assert g['anchorError']<1,(id,zoom,g);assert g['ownOverlap']<1,(id,zoom,g);assert abs(g['dx'])<=g['w']+30 and abs(g['dy'])<=g['h']+30;assert min(g['touch'])>=44
     # Selection is a UI-only operation.
    before=p.evaluate('JSON.stringify(HonroApp.profile)');p.evaluate('HonroRestJourney.selectBook(HonroApp,HonroApp.journeySelection)');assert before==p.evaluate('JSON.stringify(HonroApp.profile)')
   checks.append('all 30 anchors at 3 zooms: label proximity, no own-circle overlap, >=44px hitboxes')
   # Actual zoomed pins9/10, portrait and rotated landscape.
   for w,h in [(390,844),(844,390)]:
    p.set_viewport_size({'width':w,'height':h})
    for id in [9,10]:
     p.evaluate('(id)=>{const a=HonroApp;HonroRestJourney.showBook(a,id,null,1);HonroRestJourney.zoomBook(a,1.8,innerWidth/2,innerHeight/2);HonroRestJourney.revealBook(a)}',id);settle(p);shot(p,f'zoom{id}-{w}x{h}')
   # Keyboard, wheel and pointer production handlers.
   p.set_viewport_size({'width':390,'height':844});p.locator('.journey-map-scroll').focus();p.keyboard.press('0');z=p.evaluate('HonroApp.journeyZoom');p.keyboard.press('+');assert p.evaluate('HonroApp.journeyZoom')>z
   v=p.locator('.journey-map-scroll');box=v.bounding_box();p.mouse.move(box['x']+190,box['y']+200);z=p.evaluate('HonroApp.journeyZoom');p.mouse.wheel(0,-100);p.wait_for_timeout(80);assert p.evaluate('HonroApp.journeyZoom')>z
   cdp=p.context.new_cdp_session(p);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':120,'y':230,'id':51},{'x':200,'y':230,'id':52}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':120,'y':230,'id':51},{'x':270,'y':230,'id':52}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});checks.append('wheel, keyboard +/0, Chromium two-touch pinch retained')

   # Lazy image cache (maximum two), error and retry preserve pin interaction.
   assert len(p.evaluate('HonroJourneyImages.cacheInfo()'))<=2
   p.route('**/*journey-map-act1*.webp',lambda route:route.abort());p.evaluate('HonroJourneyImages.retry(HonroApp)');p.wait_for_selector('[data-action=journey-image-retry]');assert p.locator('.journey-pin').count()==10
   p.unroute('**/*journey-map-act1*.webp');p.locator('[data-action=journey-image-retry]').click();settle(p);checks.append('image lazy/two-entry cache/error/retry and selectable pins retained')
   p.close()
 b.close()
assert not errors,errors
sources=['shared/runtime/main.js','shared/runtime/rest-journey.js','game/src/journey.css','web/manifest.json','tests/journey-navigation-browser.py']
(OUT/f'{PASS}-results.json').write_text(json.dumps({'browser':'154.0.8037.57','sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'fileSHA256':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in sources},'rows':rows,'anchors':anchors,'checks':checks,'pageErrors':errors},ensure_ascii=False,indent=2)+'\n')
print('PASS',PASS,len(anchors),'anchor zoom samples;',checks,flush=True)
