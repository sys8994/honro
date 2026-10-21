"""Final integration browser evidence. Terminal flow fixtures are explicitly separate
from the original normal21 checkpoint traversal below. No image transforms."""
from pathlib import Path
import json, hashlib, subprocess, sys, os
from playwright.sync_api import sync_playwright
OUT=Path(os.environ.get('HONRO_ENDING_OUT','game/docs/stage-review/final-integration-20261021/evidence/browser'));OUT.mkdir(parents=True,exist_ok=True)
VIEW="()=>JSON.stringify(Object.fromEntries(['heroes','loadouts','cleared','honroGrowth','recruited','party','record'].map(k=>[k,HonroApp.profile[k]??null])))"
rows=[];errors=[];requests=[];failed=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1280,'height':720},has_touch=True,accept_downloads=True)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:requests.append(r.url) if '/endings/act-' in r.url else None)
 page.on('response',lambda r:failed.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 page.goto('http://127.0.0.1:8000/HONRO.html');page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
 assert not requests,'no ending-image preload at title'
 for stage in ([] if '--checkpoint-only' in sys.argv else [10,20,30]):
  page.set_viewport_size({'width':1280,'height':720})
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
  page.wait_for_timeout(500);page.screenshot(path=str(OUT/f'focus1-act{stage//10}-landscape.png'))
  dimensions=page.locator('.act-ending-art').evaluate('(n)=>({width:n.naturalWidth,height:n.naturalHeight,src:n.getAttribute("src"),fit:getComputedStyle(n).objectFit})')
  assert dimensions['height']==941 and dimensions['fit']=='contain'
  before=page.evaluate(VIEW)
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
  page.wait_for_timeout(400);page.screenshot(path=str(OUT/f'focus2-act{stage//10}-copy.png'))
  for width,height in [(390,844),(320,568),(844,390)]:
   page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(400)
   box=page.locator('.act-ending-copy').bounding_box();assert box['x']>=0 and box['y']>=0 and box['x']+box['width']<=width+1 and box['y']+box['height']<=height+1
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=str(OUT/f'focus3-act{stage//10}-{width}x{height}.png'))
  page.set_viewport_size({'width':390,'height':844});page.emulate_media(reduced_motion='reduce')
  page.wait_for_timeout(380);page.keyboard.press('Space');assert page.locator('#act-ending').get_attribute('data-cut')=='4'
  assert page.locator('.act-ending-copy').evaluate('(n)=>getComputedStyle(n).animationName')=='none'
  page.wait_for_timeout(380);page.keyboard.press('Enter');assert page.locator('#act-ending').get_attribute('data-cut')=='title'
  if stage==30:assert '준비 중' in page.locator('#act-ending').inner_text()
  page.screenshot(path=str(OUT/f'act{stage//10}-next-title.png'))
  page.wait_for_timeout(380);page.locator('#act-ending').click(position={'x':30,'y':30});page.wait_for_function('HonroApp.screen==="rest"')
  assert page.evaluate('HonroApp.engine===null&&HonroApp.profile.honroBattle===null')
  if stage==30:assert page.evaluate('HONRO_CONTENT.nextAct.available===false')
  page.evaluate('for(let i=0;HonroApp.dialogue&&i<30;i++)HonroStory.finish(HonroApp)')
  # Rest may recruit Sodan once; capture settled profile before the final reload.
  settled=page.evaluate(VIEW);page.screenshot(path=str(OUT/f'act{stage//10}-rest.png'))
  page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000);page.evaluate('HonroApp.continue()')
  assert page.locator('#act-ending').count()==0 and settled==page.evaluate(VIEW)
  rows.append({'stage':stage,'image':dimensions,'flow':'touch/click/Enter/Space; 4 cuts/title/rest','pendingCut2ReloadAndFileImport':True,'outcomeGuard':True,'settledReload':True,'scope':'terminal battle fixture, not a normal combat run'})
 (OUT/'flow-summary.json').write_text(json.dumps({'rows':rows,'errors':errors,'httpFailures':failed,'initialLazyLoad':True},ensure_ascii=False,indent=2)) if rows else None
 # Continue original genuine normal21 save under combined SP/HP/beast migrations.
 page.emulate_media(reduced_motion='no-preference');page.set_viewport_size({'width':1280,'height':720})
 live=json.loads(Path('game/docs/stage-review/act-endings/evidence/normal-21-escape-save.json').read_text())['profile']
 page.evaluate('p=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',live)
 page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000);page.evaluate('HonroApp.continue()')
 page.wait_for_function('HonroApp.screen==="battle"&&!!HonroApp.engine');page.wait_for_timeout(2000)
 assert '출구' in page.locator('#objective-text').inner_text()
 start=page.evaluate('JSON.parse(JSON.stringify(HonroApp.engine.b))')
 page.screenshot(path=str(OUT/'checkpoint-exit-desktop.png'))
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(500);page.screenshot(path=str(OUT/'checkpoint-exit-mobile.png'))
 for _ in range(3):
  if page.evaluate('HonroApp.engine.active.cls')=='knight':break
  page.keyboard.press('Tab')
 assert page.evaluate('HonroApp.engine.active.cls')=='knight'
 # Production keyboard/frame/move/mission path, no actor or resource assignment.
 page.keyboard.down('d')
 try:page.wait_for_function('HonroApp.engine.b.honroState.sodanWithdrawal.phase!=="escape"',timeout=20000)
 finally:page.keyboard.up('d')
 page.wait_for_function('!!HonroApp.dialogue',timeout=15000)
 assert '…이제 손을 놔도 돼요?' in page.locator('#story-line').inner_text()
 page.wait_for_timeout(500);page.screenshot(path=str(OUT/'final-safe-outro-first.png'))
 end=page.evaluate('JSON.parse(JSON.stringify(HonroApp.engine.b))')
 assert end['phase']=='won' and end['honroState']['sodanWithdrawal']['phase']=='safe'
 assert len([u for u in end['units'] if u['side']==1 and not u.get('dead')])>0
 assert next(u for u in end['units'] if u['id']=='boss')['hp']>0
 assert start['items']==end['items']
 assert len(start['units'])==len(end['units'])
 page.evaluate('while(HonroApp.dialogue.index<HonroApp.dialogue.lines.length-1)HonroStory.next(HonroApp)')
 page.wait_for_timeout(500);page.screenshot(path=str(OUT/'final-safe-outro-last.png'))
 assert '일행 곁에 앉았다.' in page.locator('#story-line').inner_text()
 page.evaluate('HonroStory.finish(HonroApp)');page.wait_for_selector('#act-ending');page.wait_for_function('document.querySelector(".act-ending-art").naturalWidth===1672');page.wait_for_timeout(400)
 page.screenshot(path=str(OUT/'final-real-checkpoint-act1.png'))
 (OUT/'checkpoint-traversal.json').write_text(json.dumps({'source':'committed original normal21 escape checkpoint, not fresh normal fullplay','start':start,'end':end,'input':'keyboard d via real browser frame until withdrawal; no coordinate/resource writes'},ensure_ascii=False))
 assert not errors,errors
 assert not failed,failed
 browser.close()
summary={'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'rows':rows,'initialLazyLoad':True,'imageRequests':requests,'pageerrors':errors,'httpFailures':failed,'originalNormal21CheckpointTraversal':'passed','limits':['Chromium synthetic desktop/touch events, not physical devices/Safari.','Act20/30 terminal flow setup is a fixture, not a combat proof.']}
(OUT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print('PASS genuine checkpoint keyboard extraction/safe outro' if '--checkpoint-only' in sys.argv else 'PASS final original-image loading/composition viewports, touch/click/Enter/Space, guard, cut2 reload/export/import, rewards/equipment/XP/SP/visits, Act4 boundary, genuine checkpoint keyboard extraction/safe outro')
