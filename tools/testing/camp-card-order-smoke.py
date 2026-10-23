"""Final narrow touch/UI check: small widths and armed drag versus native scroll."""
from pathlib import Path
import sys,json,hashlib,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/camp-card-order-ux-20261023';profile=json.loads((ROOT/'_local/reports/player-turn-order-20261023/four-profile.json').read_text());rows=[]
with serve_game()as base,sync_playwright()as pw:
 b=launch(pw)
 for w,h in [(320,640),(360,780),(390,844),(844,390)]:
  c=b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,reduced_motion='reduce'if w==844 else'no-preference');p=c.new_page();p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(18);HonroApp.frame=()=>{};HonroApp.showCamp('archer');window.orderSaves=0;const a=HonroApp,save=a.persist.bind(a);a.persist=()=>{orderSaves++;return save();};}''');p.wait_for_function('[...document.querySelectorAll(".hero-tab canvas")].length===4&&[...document.querySelectorAll(".hero-tab canvas")].every(c=>c.dataset.portraitState==="ready")')
  def cards():return p.locator('.hero-tabs>.hero-tab').evaluate_all('(a)=>a.map(c=>c.dataset.class)')
  def point(cls):
   r=p.locator('.hero-tab[data-class='+cls+']').bounding_box();assert r['width']>=44 and r['height']>=44;return{'x':r['x']+r['width']/2,'y':r['y']+r['height']/2,'id':0}
  cdp=c.new_cdp_session(p)
  def touch(kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
  before=cards();a,z=point('knight'),point('archer');scroll=p.locator('.camp-scroll').evaluate('(e)=>e.scrollTop');p.screenshot(path=str(OUT/(str(w)+'-before.jpg')),type='jpeg',quality=92);touch('touchStart',[a]);p.wait_for_timeout(1050);assert p.locator('.order-dragging').count()==1
  for n in range(1,5):touch('touchMove',[{'x':a['x']+(z['x']-a['x'])*n/4,'y':a['y']+16*n/4,'id':0}]);p.wait_for_timeout(20)
  assert cards()[0]=='knight'and p.evaluate('HonroApp.cls')=='archer'and p.evaluate('orderSaves')==0;assert p.locator('.camp-scroll').evaluate('(e)=>e.scrollTop')==scroll
  if w==844:assert p.locator('.hero-tab').evaluate_all('(a)=>a.every(c=>c.getAnimations().every(x=>x.constructor.name!=="Animation"))')
  p.screenshot(path=str(OUT/(str(w)+'-preview.jpg')),type='jpeg',quality=92);touch('touchEnd',[]);p.wait_for_timeout(60);assert p.evaluate('orderSaves')==1 and p.evaluate('HonroApp.profile.playerTurnOrder[0]')=='knight';assert p.locator('.order-dragging').count()==0 and p.locator('.hero-tabs').evaluate('(n)=>n.scrollWidth<=n.clientWidth+1');assert p.locator('[data-card-order-hint]').inner_text()=='길게 눌러 순서 변경';p.screenshot(path=str(OUT/(str(w)+'-saved.jpg')),type='jpeg',quality=92);rows.append({'view':[w,h],'before':before,'after':cards(),'selected':'archer','armedVerticalJitterScrollDelta':0,'saves':1,'reducedMotion':w==844});c.close()
 b.close()
(OUT/'smoke.json').write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'runtimeSha256':hashlib.sha256((ROOT/'shared/runtime/player-turn-order.js').read_bytes()).hexdigest(),'cssSha256':hashlib.sha256((ROOT/'game/src/presentation.css').read_bytes()).hexdigest(),'rows':rows},indent=2));print('PASS320/360/390/844 touch, nonselected1s drag, live preview, armed vertical jitter, one save and reduced-motion')
