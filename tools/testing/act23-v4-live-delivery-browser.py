"""Local Chromium delivery checks. Prior clears/cart damage/paused setup are
fixtures; subtitle DOM, keyboard movement, clicks and reload/Continue are real."""
import ast,json,os,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act23-v4/integration-delivery';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8771')
constants={}
for node in ast.parse((ROOT/'tools/testing/act23-v4-reviewed21-browser.py').read_text()).body:
 if isinstance(node,ast.Assign) and isinstance(node.targets[0],ast.Name) and node.targets[0].id in ['PAUSE','LAUNCH','TICK']:constants[node.targets[0].id]=ast.literal_eval(node.value)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':1280,'height':800});errors=[];checks=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def boot():
  page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroStoryBarks&&!!globalThis.HonroAct23V4FieldTalk');page.evaluate(constants['PAUSE'])
 def finish():
  for _ in range(20):
   if not page.evaluate('!!HonroApp.dialogue'):return
   page.keyboard.press('Enter')
  assert not page.evaluate('!!HonroApp.dialogue')
 def tick(n):page.evaluate(constants['TICK'],n)
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp');page.evaluate(constants['PAUSE']);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"');page.evaluate('()=>{HonroApp.turnNotice=null;HonroStoryBarks.tick(HonroApp,performance.now())}')
 boot();assert page.evaluate(constants['LAUNCH'])==421;tick(20);finish();tick(60);finish()
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;a.engine.hurt(a.engine.unit('v4.gate-cart'),999999,a.engine.heroesAlive()[0].id);Object.assign(b,{side:0,phase:'aim'});}""");tick(20)
 assert not page.evaluate('!!HonroApp.dialogue');assert not page.locator('body').evaluate('(n)=>n.classList.contains("story-lock")')
 assert page.locator('#banter').is_visible();assert page.locator('#banter').get_attribute('data-reviewed-bark')=='A3.S21.CART_STOP.01';assert page.evaluate('HonroAct23V4Chapter21.memory(HonroApp.engine.b).proof.turn.distance>0')
 text=page.evaluate('HonroAct23V4Chapter21Reviewed.row("A3.S21.CART_STOP.01").text');assert text in page.locator('#banter').inner_text()
 page.evaluate('HonroApp.reviewPaused=false');page.wait_for_timeout(400);start=page.evaluate('HonroApp.engine.active.x');page.keyboard.down('ArrowRight');page.wait_for_timeout(350);page.evaluate('HonroApp.reviewPaused=true');page.keyboard.up('ArrowRight');end=page.evaluate('HonroApp.engine.active.x');assert end>start,(start,end,page.evaluate("({canInput:HonroApp.canInput(),phase:HonroApp.engine.b.phase,side:HonroApp.engine.b.side,turn:HonroApp.turnNotice,modal:HonroApp.modal.classList.contains(\"open\"),active:HonroApp.engine.active,keys:[...HonroApp.keys],done:HonroApp.done})"))
 page.screenshot(path=str(OUT/'01-live-subtitle-movement.png'));checks.append({'bark':'A3.S21.CART_STOP.01','keyboardDistance':end-start,'dialogueLock':False})
 page.evaluate("""()=>{const a=HonroApp;let now=a.reviewedBarkClock||performance.now();for(let i=0;i<80&&a.engine.b.honroState.reviewedBarks.queue[0]?.index===0;i++)HonroStoryBarks.tick(a,now+=100);}""")
 assert page.locator('#banter').get_attribute('data-reviewed-bark')=='A3.S21.CART_STOP.02';elapsed=page.evaluate('HonroApp.engine.b.honroState.reviewedBarks.queue[0].elapsed');resume();assert page.locator('#banter').get_attribute('data-reviewed-bark')=='A3.S21.CART_STOP.02';assert elapsed<=page.evaluate('HonroApp.engine.b.honroState.reviewedBarks.queue[0].elapsed')<page.evaluate('HonroStoryBarks.duration(HonroApp.engine.b.honroState.reviewedBarks.queue[0].lines[1])')
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;a.engine.hurt(a.engine.unit(b.honroV4Chapter21.old),999999,a.engine.heroesAlive()[0].id);HonroStory.tick(a,performance.now());}""");assert page.locator('#banter').get_attribute('data-reviewed-bark')!='A3.S21.CART_STOP.02';checks.append({'barkCursor':1,'reloadContinue':True,'deathDiscard':True})
 # Field menu is reached through the existing player-facing objective button.
 page.evaluate("""async()=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(11);a.stopBattle();a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<=10;i++)p.cleared[i]={visits:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.seen['act2:first-spirit-encounter']=true;a.profile=p;a.launch(11);a.turnNotice=null;}""")
 page.locator('#objective-text').click();page.locator('[data-reviewed-field-talk="occultist"]').click();assert page.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].rowId')=='EDGE.OPTIONAL_11_OCCULTIST_0';page.keyboard.press('Enter');assert page.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].rowId')=='EDGE.OPTIONAL_11_OCCULTIST_1';resume();assert page.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].rowId')=='EDGE.OPTIONAL_11_OCCULTIST_1';page.screenshot(path=str(OUT/'02-field-talk-resumed.png'));finish()
 page.set_viewport_size({'width':390,'height':844});page.locator('#objective-text').click();assert page.locator('[data-reviewed-field-talk="mage"]').is_visible();page.screenshot(path=str(OUT/'03-field-menu-mobile.png'));checks.append({'fieldTalk':'actual help click + Enter + reload/Continue','mobile':390})
 # Mixed survival: terminal once must never witness an unrendered reply.
 page.evaluate("""()=>{const a=HonroApp;a.stopBattle();a.close();a.profile.honroBattle=null;a.launch(11);a.turnNotice=null;}""")
 page.locator('#objective-text').click();page.locator('[data-reviewed-field-talk="occultist"]').click()
 ids=page.evaluate('HonroApp.dialogue.lines.map(l=>l[2].rowId)');page.evaluate('HonroApp.engine.hurt(HonroApp.engine.unit("p-archer"),999999)');page.keyboard.press('Enter');assert page.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].rowId')==ids[2];page.keyboard.press('Enter')
 observed=page.evaluate('()=>{HonroAct23V4.recordOutcome(HonroApp,true);return HonroApp.profile.honroAct23V4History.stages[11].reviewedNarrative.rows}')
 assert observed==[ids[0],ids[2]],observed;checks.append({'mixedSpeakerReceipt':observed,'unrenderedReplyExcluded':ids[1]})
 assert not errors,errors;(OUT/'summary.json').write_text(json.dumps({'checks':checks,'pageErrors':errors,'limits':['Controlled local fixture, not normal campaign completion or public Pages.']},ensure_ascii=False,indent=2));browser.close()
print('PASS Chromium live subtitle without lock, real keyboard movement, ordered cursor/reload/death guard and actual field menu clicks/Enter/mobile; pageerror0')
