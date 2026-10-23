"""500ms deterministic clock versus separately observed real Chromium touch timing."""
from pathlib import Path
import json,sys,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/camp-card-hold-feedback-20261023';OUT.mkdir(parents=True,exist_ok=True)
profile=json.loads((ROOT/'_local/reports/player-turn-order-20261023/four-profile.json').read_text());rows=[];errors=[]
with serve_game()as base,sync_playwright()as pw:
 b=launch(pw)
 def load(w,h,reduce=False):
  c=b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,reduced_motion='reduce'if reduce else'no-preference');p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=90000);p.evaluate("async()=>{await HonroCampaignLoader.ensureStage(18);HonroApp.frame=()=>{};HonroApp.showCamp('archer');}");p.wait_for_function('[...document.querySelectorAll(".hero-tab canvas")].length===4&&[...document.querySelectorAll(".hero-tab canvas")].every(c=>c.dataset.portraitState==="ready")');return c,p,c.new_cdp_session(p)
 def point(p,cls):
  r=p.locator('.hero-tab[data-class='+cls+']').bounding_box();return{'x':r['x']+r['width']/2,'y':r['y']+r['height']/2,'id':0}
 def touch(cdp,kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
 def instrument(p):
  p.evaluate('''()=>{window.holdEvents=[];window.orderSaves=0;const a=HonroApp,save=a.persist.bind(a);a.persist=()=>{orderSaves++;return save()};const timeout=window.setTimeout;window.setTimeout=(fn,ms,...args)=>{if(ms!==500)return timeout(fn,ms,...args);holdEvents.push({kind:'schedule',at:performance.now()});return timeout(()=>{holdEvents.push({kind:'fire',at:performance.now()});fn(...args)},ms)};document.addEventListener('pointerdown',()=>{window.holdStarted=performance.now()},{capture:true});}''')
 def clean(p):
  assert p.locator('.order-dragging').count()==0
  assert p.locator('.hero-tab').evaluate_all('(a)=>a.every(c=>!c.style.transform&&getComputedStyle(c).translate==="none")')
 # Real browser DOM + virtual clock: no wall-clock claim for this exact boundary.
 c,p,cdp=load(390,844);p.clock.install(time=0);p.clock.pause_at(1);instrument(p);a=point(p,'knight');top=p.locator('.hero-tab[data-class=knight]').bounding_box()['y'];touch(cdp,'touchStart',[a]);p.clock.run_for(200);touch(cdp,'touchMove',[{**a,'x':a['x']+4,'y':a['y']+3}]);p.clock.run_for(299);assert p.locator('.order-dragging').count()==0;p.clock.run_for(1);assert p.locator('.order-dragging').count()==1;assert p.evaluate('HonroApp.cls')=='archer';events=p.evaluate('holdEvents');assert len(events)==2 and events[1]['at']-events[0]['at']==500,events
 visual=p.locator('.order-dragging').evaluate('(n)=>{const s=getComputedStyle(n);return{border:s.borderColor,outline:s.outlineColor,outlineWidth:s.outlineWidth,translate:s.translate,shadow:s.boxShadow,transform:s.transform}}');assert visual['translate']=='0px -5px' and visual['outlineWidth']=='2px';assert abs(p.locator('.order-dragging').bounding_box()['y']-(top-5))<.1
 touch(cdp,'touchEnd',[]);p.clock.run_for(50);clean(p);assert p.evaluate('orderSaves')==0;rows.append({'check':'deterministic499-off/500-on','oneTimer':events,'microJitter':[4,3],'selected':'archer','visual':visual,'sameSlotNoSave':True});c.close()
 # Separately measure real event-loop timings, including deliberately busy main thread.
 for w,h,reduce in[(390,844,False),(844,390,True)]:
  c,p,cdp=load(w,h,reduce);instrument(p);a=point(p,'knight');touch(cdp,'touchStart',[a]);p.wait_for_function('document.querySelector(".order-dragging")',timeout=2500);elapsed=p.evaluate('holdEvents.at(-1).at-holdStarted');assert elapsed>=499;assert p.evaluate('HonroApp.cls')=='archer';p.screenshot(path=str(OUT/(str(w)+'-held.jpg')),type='jpeg',quality=90)
  z=point(p,'archer');touch(cdp,'touchMove',[z]);assert p.locator('.hero-tabs>.hero-tab').first.get_attribute('data-class')=='knight';assert p.evaluate('orderSaves')==0
  if reduce:assert p.locator('.hero-tab').evaluate_all('(a)=>a.every(c=>c.getAnimations().length===0)')
  touch(cdp,'touchEnd',[]);p.wait_for_timeout(100);clean(p);assert p.evaluate('orderSaves')==1;rows.append({'check':'real-touch-stationary-hold','view':[w,h],'observedMs':elapsed,'reducedMotion':reduce,'unselectedNoSelection':True,'liveReorder':True,'oneSave':True});p.screenshot(path=str(OUT/(str(w)+'-dropped.jpg')),type='jpeg',quality=90)
  if w==390:
   # Deliberate long task demonstrates callback lateness, not the user's actual cause.
   p.evaluate("HonroApp.showCamp('archer');holdEvents=[]");a=point(p,'mage');touch(cdp,'touchStart',[a]);p.evaluate('setTimeout(()=>{const until=performance.now()+180;while(performance.now()<until){}},450)');p.wait_for_function('document.querySelector(".order-dragging")',timeout=2500);blocked=p.evaluate('holdEvents.at(-1).at-holdStarted');assert blocked>=625;touch(cdp,'touchCancel',[]);p.wait_for_timeout(50);clean(p);rows.append({'check':'deliberate180ms-longtask-at450ms','observedMs':blocked,'scope':'Synthetic busy loop; mechanism only, not user-device reproduction'})
   # Movement beyond original slop still cancels and does not select on release.
   for delta in[(11,0),(0,9)]:
    p.evaluate("HonroApp.showCamp('archer');holdEvents=[]");a=point(p,'mage');touch(cdp,'touchStart',[a]);touch(cdp,'touchMove',[{**a,'x':a['x']+delta[0],'y':a['y']+delta[1]}]);p.wait_for_timeout(570);assert p.locator('.order-dragging').count()==0;touch(cdp,'touchEnd',[]);assert p.evaluate('HonroApp.cls')=='archer';clean(p)
   rows.append({'check':'existing11px/9px-cancel-preserved','noSelection':True})
   # Native long-press context menu is consumed; cancel removes feedback.
   a=point(p,'mage');touch(cdp,'touchStart',[a]);p.wait_for_function('document.querySelector(".order-dragging")');assert p.locator('.order-dragging').evaluate('(n)=>!n.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true}))');touch(cdp,'touchCancel',[]);p.wait_for_timeout(50);clean(p)
  c.close()
 assert not errors,errors;b.close()
(OUT/'feedback.json').write_text(json.dumps({'rows':rows,'errors':errors,'scope':'Headless Chromium touch emulation and separate virtual timer boundary; no physical Android test.'},ensure_ascii=False,indent=2));print('PASS499/500, one timer, stationary feedback, small jitter, observed delay/longtask, reduced motion, contextmenu and cleanup')
