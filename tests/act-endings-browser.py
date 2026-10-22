"""Production browser interaction checks. Terminal battles are explicit fixtures,
not normal-combat proof; growth/reward code and reload are production paths."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
from browser_support import launch
from story_browser_server import story_base_url
OUT=Path('_local/reports/act-endings');OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=launch(p)
 page=browser.new_page(viewport={'width':1280,'height':720})
 errors=[];images=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.on('request',lambda r: images.append(r.url) if '/endings/act-' in r.url else None)
 page.goto(story_base_url()+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
 assert not images,'ending images may not load at the title'
 rows=[]
 for stage,size in [(10,{'width':1280,'height':720}),(20,{'width':390,'height':844}),(30,{'width':320,'height':568})]:
  page.set_viewport_size(size)
  page.evaluate('''async id=>{await HonroCampaignLoader.ensureStage(id);const a=HonroApp;
   a.stopBattle();a.close();a.profile.honroActEnding=null;a.profile.seen={};a.profile.cleared={};
   for(let i=1;i<id;i++)a.profile.cleared[i]={visits:1,rounds:6};
   a.profile.recruited=id===10?['archer','mage','knight']:['archer','mage','knight','occultist'];
   for(const cls of a.profile.recruited){a.profile.heroes[cls].xp=HONRO_CORE.xpAtLevel(id===10?12:20);HONRO_CORE.autoTrain(a.profile.heroes[cls],cls);HONRO_CORE.sanitizeLoadout(a.profile,cls);}
   a.profile.honroBattle=null;a.launch(id);for(let i=0;a.dialogue&&i<40;i++)HonroStory.finish(a);
   a.engine.b.phase='won';a.engine.b.honroState.storyQueue=[];a.engine.b.honroState.deferredStory=[];if(id===10)a.engine.b.honroState.sodanWithdrawal={phase:'safe',party:['설오','담허','휘겸','소단']};
   a.outcome();}''',stage)
  if stage==10:
   assert page.locator('#sodan-safe-backdrop').count()==0,'safe outro stays on the actual exit terrain'
   assert page.locator('#battlecanvas').is_visible()
   assert page.evaluate('HonroApp.engine.b.honroState.sodanWithdrawal.worldOutro===2&&HonroApp.dialogue.lines.length===16')
   page.screenshot(path=str(OUT/'review-1-safe-outro.png'))
   assert '…이제 손을 놔도 돼요?' in page.locator('#story-line').inner_text()
   page.evaluate('while(HonroApp.dialogue&&HonroApp.dialogue.index<HonroApp.dialogue.lines.length-1)HonroStory.next(HonroApp)')
   assert '일행 곁에 앉았다.' in page.locator('#story-line').inner_text()
   page.wait_for_timeout(500)
   page.screenshot(path=str(OUT/'review-1-safe-outro-last.png'))
  page.evaluate('for(let i=0;HonroApp.dialogue&&i<60;i++)HonroStory.finish(HonroApp)')
  page.wait_for_selector('#act-ending')
  assert page.locator('#act-ending').get_attribute('data-cut')=='1'
  assert page.locator('#act-ending button,.story-portrait').count()==0
  page.evaluate('HonroApp.endingInputAfter=performance.now()+350')
  # Entrance click-through and touch compatibility click must not skip two cuts.
  page.locator('#act-ending').dispatch_event('click',{'detail':0})
  assert page.locator('#act-ending').get_attribute('data-cut')=='1'
  page.wait_for_timeout(380)
  page.screenshot(path=str(OUT/f'review-{stage}-cut1.png'))
  page.locator('#act-ending').click(position={'x':30,'y':30})
  assert page.locator('#act-ending').get_attribute('data-cut')=='2'
  page.locator('#act-ending').dispatch_event('click',{'detail':1})
  assert page.locator('#act-ending').get_attribute('data-cut')=='2'
  snapshot=page.evaluate('JSON.stringify({heroes:HonroApp.profile.heroes,growth:HonroApp.profile.honroGrowth,cleared:HonroApp.profile.cleared,recruited:HonroApp.profile.recruited,loadouts:HonroApp.profile.loadouts})')
  page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
  page.evaluate('HonroApp.continue()');page.wait_for_selector('#act-ending')
  assert page.locator('#act-ending').get_attribute('data-cut')=='2'
  resumed=page.evaluate('JSON.stringify({heroes:HonroApp.profile.heroes,growth:HonroApp.profile.honroGrowth,cleared:HonroApp.profile.cleared,recruited:HonroApp.profile.recruited,loadouts:HonroApp.profile.loadouts})')
  (OUT/'before-reload.json').write_text(snapshot);(OUT/'after-reload.json').write_text(resumed)
  assert json.loads(snapshot)==json.loads(resumed),'reload must not repeat rewards or recruitment'
  for key,cut in [('Enter','3'),('Space','4'),('Enter','title')]:
   page.wait_for_timeout(380);page.keyboard.press(key)
   assert page.locator('#act-ending').get_attribute('data-cut')==cut
  if stage==30: assert '준비 중' in page.locator('#act-ending').inner_text()
  page.screenshot(path=str(OUT/f'review-{stage}-next-title.png'))
  page.wait_for_timeout(380);page.keyboard.press('Space')
  page.wait_for_function('HonroApp.screen==="rest"')
  assert page.evaluate('HonroApp.engine===null&&HonroApp.profile.honroBattle===null')
  if stage==30: assert page.evaluate('HONRO_CONTENT.nextAct.available===false')
  page.evaluate('for(let i=0;HonroApp.dialogue&&i<30;i++)HonroStory.finish(HonroApp)')
  page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000);page.evaluate('HonroApp.continue()')
  assert page.locator('#act-ending').count()==0,'finished acts must not replay on login'
  rows.append({'stage':stage,'viewport':size,'result':'passed','reload':'cut 2','rewardOnce':True,'next':'rest'})
 # Real 6-turn completed fixture: actual input must traverse right terrain to exit.
 page.set_viewport_size({'width':1280,'height':720})
 live=json.loads(Path('game/docs/stage-review/act-endings/evidence/normal-21-escape-save.json').read_text())['profile']
 page.evaluate('p=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',live)
 page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000);page.evaluate('HonroApp.continue()')
 page.wait_for_function('HonroApp.screen==="battle"&&!!HonroApp.engine')
 page.wait_for_timeout(2000)
 assert '출구' in page.locator('#objective-text').inner_text()
 page.wait_for_timeout(500);page.screenshot(path=str(OUT/'review-2-exit-camera.png'))
 page.emulate_media(reduced_motion='reduce');page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(300);page.screenshot(path=str(OUT/'review-3-mobile-exit.png'))
 assert not errors,errors
 (OUT/'browser-summary.json').write_text(json.dumps({'rows':rows,'errors':errors,'initialLazyLoad':True,'limits':['Battle terminal states are fixtures, separate normal combat trace is required.','Missing art exercises safe fallback; supplied image composition requires later inspection.']},ensure_ascii=False,indent=2))
 browser.close()
 print('PASS all three 4-cut click/keyboard flows, click-through/duplicate guard, per-cut reload, exactly-once rewards/recruit/loadouts, rest/Act4 boundary, lazy loading, desktop/mobile/reduced-motion; screenshots saved')
