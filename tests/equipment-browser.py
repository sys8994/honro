"""Focused real UI checks on ordinary profiles. Chapter victories/progress are fixtures."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch,serve_game,ROOT
PUBLIC=os.environ.get('HONRO_EQUIPMENT_PUBLIC');OUT=ROOT/('_local/reports/equipment-public' if PUBLIC else '_local/reports/equipment-ux');OUT.mkdir(parents=True,exist_ok=True)
RESET=r'''(through=0)=>{const a=HonroApp;a.frame=()=>{};const p=HonroProfileStore.fresh();p.settings.sound=false;p.settings.music=false;p.settings.debugMode=false;p.honroJourney={version:1,restStageId:through?21:2,talked:{}};if(through){p.recruited=['archer','mage','knight','occultist'];for(let i=1;i<=through;i++)p.cleared[i]={visits:1};}a.replaceProfile(a.profileStore.importText(JSON.stringify(p)));a.equipmentSelected=null;a.equipmentFilter=null;a.equipmentTransferId=null;if(through)HonroEquipment.observe(a);a.showCamp('archer');}'''
FIRST=r'''()=>{const a=HonroApp;a.launch(1);for(let n=0;a.dialogue&&n<50;n++)HonroStory.finish(a);a.engine.b.phase='won';a.outcome(true);a.engine=null;a.scene=null;a.done=false;a.profile.honroBattle=null;a.profile.honroJourney={version:1,restStageId:2,talked:{}};a.persist();a.showCamp('archer');}'''
rows=[]
with serve_game() as base,sync_playwright() as p:
 browser=launch(p)
 if PUBLIC:base='https://sys8994.github.io/honro'
 for label,size in [('mobile',{'width':390,'height':844}),('small',{'width':320,'height':568}),('landscape',{'width':844,'height':390}),('desktop',{'width':1280,'height':800})]:
  ctx=browser.new_context(viewport=size,is_mobile=label!='desktop',has_touch=label!='desktop');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  try:response=page.goto(base+'/HONRO.html'+('?equipment='+PUBLIC if PUBLIC else ''),wait_until='domcontentloaded')
  except Exception as error:
   if not PUBLIC:raise
   (OUT/'summary.json').write_text(json.dumps({'status':'access-limited','url':base+'/HONRO.html','error':str(error),'gameAssertions':'not run'},ensure_ascii=False,indent=2));print('PUBLIC ACCESS LIMITED',str(error),flush=True);browser.close();raise SystemExit(0)
  assert response.status==200,response.status
  if PUBLIC:assert json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'] in page.content(),'published entry differs from verified build'
  page.wait_for_function('window.HonroApp');page.evaluate(RESET,0)
  assert page.locator('.armory-shell').evaluate('e=>e.firstElementChild.classList.contains("hero-tabs")')
  assert page.locator('.equipment-empty').is_visible();assert page.locator('.equipment-bag-item').count()==0
  page.screenshot(path=str(OUT/f'{label}-empty.png'))
  # First ordinary campaign reward: only the victory is a fixture, outcome/save/grant are real.
  page.evaluate(FIRST);assert page.evaluate("HonroApp.profile.equipment.rewardLedger.eq_co_01.state")=='committed';assert not page.evaluate('HonroApp.debugMode')
  page.locator('.equipment-bag-item[data-id="itm_co_01"]').click();equip=page.locator('.equipment-detail-actions [data-action="equipment-equip"]');assert equip.is_visible()
  page.screenshot(path=str(OUT/f'{label}-first-item.png'));equip.click();assert page.evaluate("HonroApp.profile.equipment.equippedByClass.archer.common")=='itm_co_01';assert not page.locator('#modal').evaluate('e=>e.classList.contains("open")')
  assert '해진 장명부' in page.locator('.equipment-slots').inner_text()
  page.locator('.equipment-detail-actions [data-action="equipment-remove"]').click();assert page.evaluate('HonroApp.profile.equipment.equippedByClass.archer.common') is None
  page.locator('.equipment-detail-actions [data-action="equipment-equip"]').click()
  # Real normal save with six accumulated exclusive rewards; no debug inventory.
  page.evaluate(RESET,20);assert page.evaluate("Object.values(HonroApp.profile.equipment.rewardLedger).filter(r=>r.state==='pending').length")==6
  assert not page.evaluate('HonroApp.debugMode');assert page.locator('.equipment-bag-item').count()<20
  cols=page.locator('.equipment-inventory').evaluate('e=>getComputedStyle(e).gridTemplateColumns.split(" ").length');assert cols==2,cols
  page.wait_for_function("[...document.querySelectorAll('.hero-tabs canvas')].every(e=>e.dataset.portraitState==='ready')");page.screenshot(path=str(OUT/f'{label}-bag-six-rewards.png'));page.locator('.equipment-unclaimed').click()
  assert page.locator('.equipment-event-list').count()==0;assert page.locator('.equipment-reward-item').count()==3
  assert '1 / 6' in page.locator('.equipment-reward-head').inner_text();assert page.locator('.equipment-confirm').is_disabled()
  page.evaluate('window.rewardSurface=document.querySelector(".equipment-choice-dialog")');page.locator('.equipment-reward-item[data-id="itm_co_04"]').click();assert page.evaluate('window.rewardSurface===document.querySelector(".equipment-choice-dialog")')
  assert page.locator('.equipment-confirm').is_enabled();assert page.evaluate("HonroApp.profile.equipment.rewardLedger.eq_co_t1_choice.state")=='pending'
  page.screenshot(path=str(OUT/f'{label}-reward-three.png'));page.get_by_role('button',name='나중에',exact=True).click()
  page.reload();page.wait_for_function('window.HonroApp');page.evaluate('()=>{HonroApp.frame=()=>{};HonroApp.showCamp();}')
  assert page.evaluate("Object.values(HonroApp.profile.equipment.rewardLedger).filter(r=>r.state==='pending').length")==6
  page.locator('.equipment-unclaimed').click();page.locator('.equipment-reward-item[data-id="itm_co_04"]').click()
  page.evaluate("()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('quota fixture');};}")
  page.locator('.equipment-confirm').click();assert page.evaluate("HonroApp.profile.equipment.rewardLedger.eq_co_t1_choice.state")=='pending';assert page.locator('.equipment-save-error').is_visible()
  page.screenshot(path=str(OUT/f'{label}-save-failure.png'));page.evaluate('()=>{Storage.prototype.setItem=window.originalSet;}');page.locator('.equipment-confirm').dblclick()
  assert page.evaluate("HonroApp.profile.equipment.rewardLedger.eq_co_t1_choice.selectedItemId")=='itm_co_04'
  assert page.evaluate("Object.values(HonroApp.profile.equipment.rewardLedger).filter(r=>r.state==='pending').length")==5
  assert page.locator('.equipment-reward-item').count()==2;assert page.locator('.equipment-confirm').is_disabled()
  page.screenshot(path=str(OUT/f'{label}-reward-two.png'));page.get_by_role('button',name='나중에',exact=True).click()
  # Equip the chosen common item directly, then transfer it without another modal.
  page.locator('.equipment-bag-item[data-id="itm_co_04"]').click();page.locator('.equipment-detail-actions [data-action="equipment-equip"]').click()
  page.locator('.hero-tab[data-class="mage"]').click();page.locator('.equipment-bag-item[data-id="itm_co_04"]').click();page.locator('.equipment-detail-actions [data-action="equipment-equip"]').click()
  assert page.evaluate("HonroApp.profile.equipment.equippedByClass.archer.common")=='itm_co_04';assert page.locator('[data-action="equipment-transfer"]').is_visible();assert not page.locator('#modal').evaluate('e=>e.classList.contains("open")')
  page.screenshot(path=str(OUT/f'{label}-transfer.png'));page.locator('[data-action="equipment-transfer"]').click()
  assert page.evaluate('HonroApp.profile.equipment.equippedByClass.archer.common') is None;assert page.evaluate("HonroApp.profile.equipment.equippedByClass.mage.common")=='itm_co_04'
  # Read-only bag while a real suspended battle remains active.
  page.evaluate("()=>{const a=HonroApp;a.launch(21);}")
  page.wait_for_function('HonroApp.engine&&HonroApp.screen==="battle"');page.evaluate("()=>{const a=HonroApp;for(let n=0;a.dialogue&&n<50;n++)HonroStory.finish(a);a.turnNotice=null;a.close();const b=a.engine.b;b.phase='aim';b.side=0;b.projectiles=[];delete b.volley;for(const u of b.units)Object.assign(u,{vx:0,vy:0,airborne:false,jumping:false});a.equipmentNextCheck=0;HonroEquipmentUI.tick(a);}")
  page.locator('#equipment-pending-battle').click();assert page.locator('.equipment-reward-item').count() in [2,3];before=page.evaluate('HonroApp.equipmentChoice');page.get_by_role('button',name='다음 보상',exact=True).click();assert page.evaluate('HonroApp.equipmentChoice')!=before
  page.screenshot(path=str(OUT/f'{label}-battle-rewards.png'));page.get_by_role('button',name='나중에',exact=True).click()
  page.evaluate("()=>{const a=HonroApp;a.profile.honroJourney={version:1,restStageId:21,talked:{}};a.showCamp('mage');}")
  page.locator('.equipment-bag-item[data-id="itm_co_04"]').click();assert page.locator('.equipment-detail-actions button').is_disabled();assert page.locator('.equipment-lock').is_visible();page.screenshot(path=str(OUT/f'{label}-locked.png'))
  assets=page.evaluate("async()=>await Promise.all(Object.entries(HONRO_EQUIPMENT_ICONS).map(async([id,url])=>({id,status:(await fetch(url)).status})))");assert len(assets)==52 and all(a['status']==200 for a in assets),assets
  assert not errors,errors
  assert page.locator('.equipment-panel').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
  rows.append({'viewport':label,'size':size,'ordinaryProfile':True,'inventoryColumns':cols,'checks':['empty','real outcome first reward/equip/unequip','six pending direct items','same modal selection','close/reload','save failure/retry/doubletap','common transfer inline','battle rewards direct/paging','battle lock','52 icons HTTP200'],'pageErrors':errors})
  print('PASS',label,flush=True);ctx.close()
 browser.close()
(OUT/'summary.json').write_text(json.dumps({'status':'passed','rows':rows,'sourceShaBeforeCommit':os.popen('git rev-parse HEAD').read().strip(),'limits':['Chapter victory and prior cleared chapters are fixtures. No complete campaign playthrough.','User Library originals could not be materialized; current source was reproduced locally.']},ensure_ascii=False,indent=2)+'\n')
