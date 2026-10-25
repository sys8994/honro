"""Focused tooltip modality regression using an existing three-page rest dialogue."""
import sys,json,hashlib
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/tooltip-lifecycle';OUT.mkdir(parents=True,exist_ok=True)
rows=[]
def check(name,ok,data=None):
 assert ok,(name,data)
 rows.append({'check':name,'data':data});print('PASS',name,flush=True)
def none(p,name):
 p.wait_for_timeout(40);check(name,p.locator('#honro-tooltip').count()==0)
with sync_playwright() as pw,serve_game() as base:
 b=launch(pw);p=b.new_page(viewport={'width':1440,'height':900});p.set_default_timeout(5000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.evaluate('()=>{const a=HonroApp;a.close();for(let n=1;n<=5;n++)a.profile.cleared[n]={visits:1};a.profile.recruited=["archer","mage","knight"];a.profile.party=["archer","mage","knight"];a.profile.honroBattle=null;HonroRestJourney.state(a.profile).restStageId=6;a.profile.seen["map-story-v"+HonroStoryContent.version+"-5"]=true;a.profile.seen["rest-interlude-v1-6"]=true;a.showRest()}');p.wait_for_selector('[data-action=rest-talk][data-class=knight]');p.mouse.move(1400,100)
 p.keyboard.press('e');p.locator('[data-action=rest-talk][data-class=knight]').focus();p.keyboard.press('Space');p.wait_for_selector('#story-line');p.wait_for_timeout(150)
 if '--baseline' in sys.argv:
  check('reproduced unsolicited tooltip after gameplay E and Space dialogue activation',p.locator('#honro-tooltip').count()==1 and p.locator('[data-action=dialogue-next]').evaluate('e=>e===document.activeElement'),p.locator('#honro-tooltip').inner_text());p.screenshot(path=str(OUT/'before-dialogue-tooltip.png'))
 else:
  none(p,'E then Space dialogue entry and Next autofocus do not open a tooltip');p.wait_for_function('document.fonts.status==="loaded"');p.wait_for_timeout(600);p.screenshot(path=str(OUT/'after-dialogue-keyboard.png'))
  p.keyboard.press('Space');none(p,'Space advance does not leave or reopen a tooltip');p.keyboard.press('Enter');none(p,'Enter advance does not leave or reopen a tooltip')
  # Reopen the same canonical dialogue for pointer/focus activation cases.
  p.evaluate('HonroStory.finish(HonroApp)');p.locator('[data-action=rest-talk][data-class=knight]').focus();p.keyboard.press('Space');p.wait_for_selector('#story-line')
  next=p.locator('[data-action=dialogue-next]');next.hover();p.wait_for_selector('#honro-tooltip');next.evaluate('e=>e.focus()');p.mouse.move(1400,100);none(p,'hovered Next leaves cleanly while retaining keyboard focus');check('focus is not blurred',next.evaluate('e=>e===document.activeElement'))
  next.hover();p.wait_for_selector('#honro-tooltip');next.click();none(p,'click and new dialogue page do not reopen tooltip under stationary mouse')
  p.mouse.move(1400,100);p.keyboard.press('Tab');p.wait_for_selector('#honro-tooltip');check('intentional Tab navigation has one associated tooltip',p.locator('#honro-tooltip').count()==1 and p.evaluate('document.activeElement.getAttribute("aria-describedby")?.includes("honro-tooltip")'))
  p.mouse.move(1390,110);none(p,'mouse movement away dismisses keyboard tooltip without blurring focus')
  p.keyboard.press('Shift+Tab');p.wait_for_selector('#honro-tooltip');focused=p.evaluate('document.activeElement.dataset.action');p.locator(':focus').hover();p.wait_for_selector('#honro-tooltip');p.mouse.move(1400,100);none(p,'keyboard tooltip transfers to actual hover then disappears on exit');check('pointer exit preserves focused control',p.evaluate('document.activeElement.dataset.action')==focused)
  p.keyboard.press('Tab');p.wait_for_selector('#honro-tooltip');p.keyboard.press('Enter');none(p,'keyboard activation dismisses tooltip and disarms programmatic autofocus')
  p.evaluate('HonroStory.finish(HonroApp);HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.evaluate('HonroApp.close()');p.mouse.move(1400,200);p.keyboard.press('Escape');none(p,'Escape pause opening does not show autofocus tooltip');p.keyboard.press('Escape');none(p,'Escape close and restored pause focus do not show tooltip')
  p.keyboard.press('Escape');p.wait_for_selector('.pause-dialog');p.wait_for_timeout(180);p.keyboard.press('Tab');p.wait_for_selector('#honro-tooltip');p.evaluate('window.dispatchEvent(new Event("blur"))');none(p,'window blur dismisses keyboard tooltip')
  p.locator('.pause-menu [data-action=settings]').hover();p.wait_for_selector('#honro-tooltip');p.evaluate('document.dispatchEvent(new PointerEvent("pointerout",{pointerType:"mouse",bubbles:true,relatedTarget:null}))');none(p,'leaving the window dismisses hover tooltip')
  p.mouse.move(1400,200);p.locator('.pause-menu [data-action=settings]').hover();p.wait_for_selector('#honro-tooltip');p.evaluate('Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));delete document.hidden');none(p,'hidden document dismisses tooltip')
  p.mouse.move(1400,200);p.locator('.pause-menu [data-action=settings]').hover();p.wait_for_selector('#honro-tooltip');p.locator('.pause-menu [data-action=settings]').evaluate('e=>e.style.visibility="hidden"');none(p,'hidden owner dismisses tooltip');p.evaluate('HonroApp.pause()')
  p.mouse.move(1400,200);p.locator('.pause-menu [data-action=settings] svg').hover();p.wait_for_selector('#honro-tooltip');p.evaluate('window.savedTooltip=document.getElementById("honro-tooltip")');p.locator('.pause-menu [data-action=settings] strong').hover();check('nested SVG to text crossing keeps the same tooltip node',p.evaluate('document.getElementById("honro-tooltip")===window.savedTooltip'));p.locator('.pause-menu [data-action=settings]').evaluate('e=>e.remove()');none(p,'DOM removal dismisses tooltip')
  p.evaluate('HonroApp.pause()');p.locator('[data-action=fullscreen]').click();p.wait_for_function('document.fullscreenElement');p.locator('.pause-menu [data-action=settings]').hover();p.wait_for_selector('#honro-tooltip');check('fullscreen tooltip stays within fullscreen root',p.evaluate('document.fullscreenElement.contains(document.getElementById("honro-tooltip"))'));p.keyboard.press('Escape');p.wait_for_function('!document.fullscreenElement');none(p,'fullscreen transition dismisses tooltip');p.keyboard.press('Escape');none(p,'following Escape restores focus without a new tooltip')
  # Positioning remains unchanged: long text at every viewport corner.
  for x,y in [(1,1),(1390,1),(1,855),(1390,855)]:
   p.evaluate('v=>{document.getElementById("corner-tip")?.remove();const e=document.createElement("button");e.id="corner-tip";e.textContent="검사";e.dataset.tooltip="긴 설명 ".repeat(100);Object.assign(e.style,{position:"fixed",left:v[0]+"px",top:v[1]+"px",width:"40px",height:"40px",zIndex:9999});document.body.append(e)}',[x,y]);p.mouse.move(700,400);p.locator('#corner-tip').hover();p.wait_for_selector('#honro-tooltip');geom=p.locator('#honro-tooltip').evaluate('e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom}}');check('edge clamp '+str((x,y)),geom['left']>=9 and geom['top']>=9 and geom['right']<=1431 and geom['bottom']<=891,geom)
  p.evaluate('document.getElementById("corner-tip").remove()');none(p,'last owner removal leaves no tooltip');check('no browser/runtime errors',not errors and p.evaluate('!HonroApp.lastError'),errors)
 b.close()
(OUT/('baseline.json' if '--baseline' in sys.argv else 'regression.json')).write_text(json.dumps({'rows':rows,'source':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest()for f in ['shared/runtime/tooltips.js','shared/runtime/story.js']},'scope':'Actual keyboard/pointer events and canonical chapter6 Hwigyeom rest dialogue; window/visibility events are explicit lifecycle fixtures. No broader game suite.'},ensure_ascii=False,indent=2))
