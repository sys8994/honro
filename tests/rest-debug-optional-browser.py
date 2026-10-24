"""Explicit debug14 preview versus locked/unlocked normal profiles, normal App frames."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/rest-debug-optional';OUT.mkdir(parents=True,exist_ok=True)
rows=[]
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw)
 for mode in ['debug-preview','normal-locked','normal-unlocked','debug-no-selection']:
  ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp')
  p.evaluate("mode=>{const q=HONRO_TOOLS.fresh();q.settings.debugMode=mode.startsWith('debug');if(mode!=='debug-preview'){q.recruited=['archer','mage','knight','occultist'];q.party=[...q.recruited];q.honroJourney={version:1,restStageId:14,talked:{}};}if(mode==='normal-unlocked')for(let i=1;i<=13;i++)q.cleared[i]={visits:1,rounds:3};localStorage.setItem('honro-first-act-profile-1',JSON.stringify(q))}",mode)
  p.reload();p.wait_for_function('window.HonroApp');p.evaluate("()=>{window.normalBefore=JSON.stringify(HonroApp.normalProfile);window.storageBefore=localStorage.getItem('honro-first-act-profile-1')}")
  p.locator('[data-action=rest]').click();p.wait_for_timeout(150)
  for _ in range(4):
   if p.locator('[data-action=dialogue-skip]').count():p.locator('[data-action=dialogue-skip]').click();p.wait_for_timeout(80)
  p.wait_for_timeout(450)
  if mode=='debug-preview':
   p.locator('[data-action=journey-book]').click();p.locator('[data-action=journey-act][data-id="2"]').click();p.locator('[data-action=journey-select][data-id="14"]').click(force=True);p.locator('[data-action=journey-travel][data-id="14"]').click();p.wait_for_function('HonroApp.screen==="rest"&&HonroApp.debugRestStage===14');p.wait_for_timeout(450)
  button=p.locator('[data-action=rest-talk][data-class=knight]');allowed=mode in ['debug-preview','normal-unlocked'];assert button.is_disabled()!=allowed,(mode,button.get_attribute('aria-label'))
  row={'mode':mode,'enabled':not button.is_disabled(),'label':button.get_attribute('aria-label')}
  p.evaluate('window.clearedBefore=JSON.stringify(HonroApp.profile.cleared)')
  if allowed:
   assert '새 대화' in row['label'];button.click();p.wait_for_selector('#story-line');p.wait_for_timeout(250)
   assert p.evaluate("HonroApp.dialogue.restClass==='knight'&&HonroApp.dialogue.id==='rest-talk-v1-14-knight'")
   assert p.locator('#story-line').inner_text() and p.locator('#story-line').bounding_box()['height']>0
   p.evaluate("()=>{window.firstDialogue=HonroApp.dialogue;HonroRestJourney.talk(HonroApp,'knight')}");assert p.evaluate('HonroApp.dialogue===firstDialogue')
   p.screenshot(path=str(OUT/(mode+'-talk.jpg')),type='jpeg',quality=80);p.locator('[data-action=dialogue-skip]').click();assert p.evaluate("!HonroApp.dialogue&&HonroApp.profile.honroJourney.talked['rest-talk-v1-14-knight']")
   p.evaluate('window.historyCount=HonroApp.profile.honroNarrative.length');assert '새 대화' not in button.get_attribute('aria-label')
   p.locator('[data-action=camp]').click();p.wait_for_selector('#armory');p.locator('.top [data-action=rest]').click();p.wait_for_selector('.rest-screen');p.wait_for_timeout(450)
   button.click();p.wait_for_selector('#story-line');p.locator('[data-action=dialogue-skip]').click();assert p.evaluate('HonroApp.profile.honroNarrative.length===historyCount')
   row.update(opened=True,repeatedClickGuard=True,skipAndCampReturn=True,noDuplicateHistory=True)
  else:
   assert '새 대화' not in row['label'];p.evaluate("HonroRestJourney.talk(HonroApp,'knight')");assert p.evaluate('!HonroApp.dialogue');row['executionBlocked']=True
  assert p.evaluate('JSON.stringify(HonroApp.profile.cleared)===clearedBefore')
  if mode.startswith('debug'):assert p.evaluate("JSON.stringify(HonroApp.normalProfile)===normalBefore&&localStorage.getItem('honro-first-act-profile-1')===storageBefore"),mode
  row.update(clearedUnchanged=True,normalStorageIsolated=mode.startswith('debug'),errors=errors);assert not errors,errors;rows.append(row);ctx.close()
 b.close()
(OUT/'browser.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print(json.dumps(rows,ensure_ascii=False))
