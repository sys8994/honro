"""Final integration browser evidence. Terminal flow fixtures are explicitly separate
from the genuine normal-run checkpoint traversal below. No image transforms."""
from pathlib import Path
import json, hashlib, subprocess, sys, os, re
from browser_support import launch
from story_browser_server import story_base_url
from playwright.sync_api import sync_playwright
OUT=Path(os.environ.get('HONRO_ENDING_OUT','game/docs/rest-hub-journey-flow/evidence/endings'));OUT.mkdir(parents=True,exist_ok=True)
VIEW="()=>JSON.stringify(Object.fromEntries(['heroes','loadouts','cleared','honroGrowth','recruited','party','record'].map(k=>[k,HonroApp.profile[k]??null])))"
rows=[];errors=[];requests=[];failed=[]
def capture(page,path):
 target=Path(path).with_suffix('.jpg')
 page.screenshot(path=str(target),type='jpeg',quality=85)
 assert target.stat().st_size<1000000

with sync_playwright() as p:
 browser=launch(p)
 page=browser.new_page(viewport={'width':1440,'height':900},has_touch=True,accept_downloads=True)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:requests.append(r.url) if re.search(r'/ending-\d+-|/endings/act-',r.url) else None)
 page.on('response',lambda r:failed.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 page.goto(story_base_url()+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
 assert not requests,'no ending-image preload at title'
 for stage in ([] if '--checkpoint-only' in sys.argv else [10,20,30]):
  page.set_viewport_size({'width':1440,'height':900})
  page.evaluate('''async id=>{await HonroCampaignLoader.ensureStage(id);const a=HonroApp;
   a.stopBattle();a.close();a.profile.honroActEnding=null;a.profile.seen={};a.profile.cleared={};
   for(let i=1;i<id;i++)a.profile.cleared[i]={visits:1,rounds:6};
   a.profile.recruited=id===10?['archer','mage','knight']:['archer','mage','knight','occultist'];
   for(const cls of a.profile.recruited){a.profile.heroes[cls].xp=HONRO_CORE.xpAtLevel(id===10?12:20);HONRO_CORE.autoTrain(a.profile.heroes[cls],cls);HONRO_CORE.sanitizeLoadout(a.profile,cls);}
   a.profile.honroBattle=null;a.launch(id);for(let i=0;a.dialogue&&i<40;i++)HonroStory.finish(a);
   a.engine.b.phase='won';a.engine.b.honroState.storyQueue=[];a.engine.b.honroState.deferredStory=[];
   if(id===10)a.engine.b.honroState.sodanWithdrawal={phase:'safe',party:['설오','담허','휘겸','소단']};
   a.outcome();for(let i=0;a.dialogue&&i<60;i++)HonroStory.finish(a);}''',stage)
  page.wait_for_selector('#act-ending');page.wait_for_function('document.querySelector(".act-ending-art").naturalWidth===1672')
  assert page.locator('#act-ending').get_attribute('data-cut')=='1'
  assert page.locator('#act-ending button,.story-portrait').count()==0
  page.wait_for_timeout(500);capture(page,path=str(OUT/f'focus1-act{stage//10}-landscape.png'))
  dimensions=page.locator('.act-ending-art').evaluate('(n)=>({width:n.naturalWidth,height:n.naturalHeight,src:n.getAttribute("src"),fit:getComputedStyle(n).objectFit})')
  assert dimensions['height']==941 and dimensions['fit']=='cover'
  before=page.evaluate(VIEW)
  page.evaluate('HonroApp.showRest();HonroApp.showMap()');assert page.locator('#act-ending').get_attribute('data-cut')=='1'
  # Completed outcome guard must apply even while an ending is on screen.
  page.evaluate('for(let i=0;i<3;i++)HonroApp.outcome()')
  assert before==page.evaluate(VIEW) and page.evaluate('!HonroApp.dialogue&&HonroApp.profile.honroBattle===null')
  page.evaluate('HonroApp.endingInputAfter=performance.now()+350')
  page.locator('#act-ending').dispatch_event('click',{'detail':0})
  assert page.locator('#act-ending').get_attribute('data-cut')=='1'
  page.wait_for_timeout(380);page.touchscreen.tap(30,30)
  assert page.locator('#act-ending').get_attribute('data-cut')=='2'
  page.locator('#act-ending').dispatch_event('click',{'detail':1})
  assert page.locator('#act-ending').get_attribute('data-cut')=='2'
  page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000);page.evaluate('HonroApp.continue()')
  page.wait_for_selector('#act-ending');assert page.locator('#act-ending').get_attribute('data-cut')=='2'
  assert before==page.evaluate(VIEW),'reward/XP/SP/equipment/visits/ledger unchanged on resume'
  # Save and reimport through actual file-input path while cut2 is pending.
  with page.expect_download() as info:page.evaluate('HonroApp.export()')
  file=OUT/f'act{stage//10}-cut2-export.json';info.value.save_as(str(file));saved=json.loads(file.read_text())
  assert saved.get('honroBattle') is None and saved['honroActEnding']=={'stage':stage,'index':1}
  page.locator('#file-import').set_input_files(str(file));page.wait_for_function('document.querySelector("#file-import").value===""')
  page.evaluate('HonroApp.continue()');page.wait_for_selector('#act-ending')
  assert page.locator('#act-ending').get_attribute('data-cut')=='2' and before==page.evaluate(VIEW)
  page.wait_for_timeout(380);page.keyboard.press('Enter');assert page.locator('#act-ending').get_attribute('data-cut')=='3'
  # Long copy and bright foreground parchment contrast at normal desktop distance.
  page.wait_for_timeout(400);capture(page,path=str(OUT/f'focus2-act{stage//10}-copy.png'))
  for width,height in [(390,844),(320,568),(844,390)]:
   page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(400)
   box=page.locator('.act-ending-copy').bounding_box();assert box['x']>=0 and box['y']>=0 and box['x']+box['width']<=width+1 and box['y']+box['height']<=height+1
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   capture(page,path=str(OUT/f'focus3-act{stage//10}-{width}x{height}.png'))
  page.set_viewport_size({'width':390,'height':844});page.emulate_media(reduced_motion='reduce')
  page.wait_for_timeout(380);page.keyboard.press('Space');assert page.locator('#act-ending').get_attribute('data-cut')=='4'
  assert page.locator('.act-ending-copy').evaluate('(n)=>getComputedStyle(n).animationName')=='none'
  page.wait_for_timeout(380);page.keyboard.press('Enter');assert page.locator('#act-ending').get_attribute('data-cut')=='title'
  if stage==30:assert '준비 중' in page.locator('#act-ending').inner_text()
  capture(page,path=str(OUT/f'act{stage//10}-next-title.png'))
  page.wait_for_timeout(380);page.locator('#act-ending').click(position={'x':30,'y':30});page.wait_for_function('HonroApp.screen==="rest"')
  assert page.evaluate('HonroApp.engine===null&&HonroApp.profile.honroBattle===null')
  if stage==30:assert page.evaluate('HONRO_CONTENT.nextAct.available===false')
  page.evaluate('for(let i=0;HonroApp.dialogue&&i<30;i++)HonroStory.finish(HonroApp)')
  # Rest may recruit Sodan once; capture settled profile before the final reload.
  settled=page.evaluate(VIEW);capture(page,path=str(OUT/f'act{stage//10}-rest.png'))
  page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000);page.evaluate('HonroApp.continue()')
  assert page.locator('#act-ending').count()==0 and settled==page.evaluate(VIEW)
  rows.append({'stage':stage,'image':dimensions,'flow':'touch/click/Enter/Space; 4 cuts/title/rest','pendingCut2ReloadAndFileImport':True,'outcomeGuard':True,'settledReload':True,'scope':'terminal battle fixture, not a normal combat run'})
 (OUT/'flow-summary.json').write_text(json.dumps({'rows':rows,'errors':errors,'httpFailures':failed,'initialLazyLoad':True},ensure_ascii=False,indent=2)) if rows else None
 assert not errors,errors
 browser.close()
 print("PASS three act endings: four cuts/title/rest, pending reload/import, exactly-once rewards/recruit, and hub/book cannot skip pending ending")
