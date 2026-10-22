"""Actual Chromium fixtures for confirmed menu review gaps, not normal fullplay."""
import json,sys,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch,serve_game,ROOT
OUT=Path(os.environ.get('HONRO_PHASE0_OUT',str(ROOT/'game/docs/stage-clear-report/evidence/phase0')));OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,ok):
 assert ok,name
 checks.append(name);print('PASS',name,flush=True)
SETUP="""async()=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(5);if(a.debugMode)a.setDebugMode(false);a.stopBattle();a.close();a.profile.honroBattle=null;a.profile.cleared={};a.profile.seen={};a.profile.honroActEnding=null;for(let i=1;i<5;i++)a.profile.cleared[i]={visits:1,rounds:4};a.profile.recruited=['archer','mage'];a.profile.party=['archer','mage'];a.launch(5);for(let i=0;a.dialogue&&i<40;i++)HonroStory.finish(a);a.pause();}"""
with sync_playwright() as pw,serve_game() as url:
 b=launch(pw);p=b.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp')
 for w,h in [(390,844),(844,390)]:
  p.set_viewport_size({'width':w,'height':h});p.evaluate(SETUP)
  for action in ['cancel','X','Escape']:
   p.locator('[data-action=rest]').click();p.wait_for_function('HonroApp.modalKind==="journey-confirm"')
   before=p.evaluate('JSON.stringify(HonroApp.engine.b)');saved=p.evaluate('localStorage.getItem("honro-first-act-profile-1")')
   if action=='cancel':p.locator('[data-action=cancel-journey-launch]').click()
   elif action=='X':p.locator('#modal [data-action=close]').click()
   else:p.keyboard.press('Escape')
   p.wait_for_timeout(130)
   check(f'{w} {action} retains pause, battle, autosave',p.evaluate('HonroApp.modalKind==="pause-dialog"') and p.evaluate('JSON.stringify(HonroApp.engine.b)')==before and p.evaluate('localStorage.getItem("honro-first-act-profile-1")')==saved)
  p.screenshot(path=str(OUT/f'pause-{w}.jpg'),type='jpeg',quality=82)
  p.evaluate('HonroApp.settings()');p.locator('[data-action=settings-page][data-id=sound]').click()
  before=p.evaluate('JSON.stringify(HonroApp.engine.b)')
  p.locator('[data-action=fullscreen]').click();p.wait_for_function('!!document.fullscreenElement')
  p.locator('[data-action=fullscreen]').click();p.wait_for_function('!document.fullscreenElement')
  check(f'{w} native fullscreen retains battle',p.evaluate('JSON.stringify(HonroApp.engine.b)')==before)
  for page,ids in [('sound',['setting-sound','setting-music']),('screen',['minimap-setting']),('debug',['debug-mode-setting','terrain-outline-setting'])]:
   p.evaluate('(page)=>HonroMenuUI.settings(HonroApp,page)',page)
   if page=='debug' and not p.locator('#terrain-outline-setting').count():
    p.evaluate('HonroApp.setDebugMode(true);for(let i=0;HonroApp.dialogue&&i<40;i++)HonroStory.finish(HonroApp);HonroApp.settings("debug")')
   for id in ids:
    n=p.locator('#'+id);n.scroll_into_view_if_needed();r=n.bounding_box()
    target=n.evaluate('(n)=>{const l=document.querySelector(`label[for="${n.id}"]`),r=l.getBoundingClientRect();return{width:r.width,height:r.height}}')
    check(f'{w} {id} real control and label targets',r['width']>=44 and r['height']>=44 and target['height']>=44)
    before=n.is_checked();p.mouse.click(r['x']+2,r['y']+2)
    if id=='debug-mode-setting':p.evaluate('HonroApp.settings("debug")')
    # Debug toggle rebuilds its own view, so test state through the replacement node.
    check(f'{w} {id} corner toggles',p.locator('#'+id).is_checked()!=before)
    if id=='debug-mode-setting':
     p.evaluate('HonroApp.setDebugMode(true);for(let i=0;HonroApp.dialogue&&i<40;i++)HonroStory.finish(HonroApp);HonroApp.settings("debug")')
    n=p.locator('#'+id);before=n.is_checked();n.focus();p.keyboard.press('Space');
    if id=='debug-mode-setting':p.evaluate('for(let i=0;HonroApp.dialogue&&i<40;i++)HonroStory.finish(HonroApp);HonroApp.settings("debug")')
    check(f'{w} {id} Space toggles',p.locator('#'+id).is_checked()!=before)
    if id=='debug-mode-setting':p.evaluate('HonroApp.setDebugMode(true);for(let i=0;HonroApp.dialogue&&i<40;i++)HonroStory.finish(HonroApp);HonroApp.settings("debug")')
   if page=='sound':p.screenshot(path=str(OUT/f'sound-{w}.jpg'),type='jpeg',quality=82)
 check('no browser exceptions',not errors);b.close()
(OUT/'checks.json').write_text(json.dumps({'checks':checks,'errors':errors,'limits':['Desktop Chromium viewport/touch fixtures; no physical-device/full-campaign claim.']},ensure_ascii=False,indent=2))
