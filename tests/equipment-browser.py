import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch,serve_game,ROOT
OUT=ROOT/'_local/reports/equipment-browser';OUT.mkdir(parents=True,exist_ok=True)
rows=[]
SETUP=r'''()=>{const a=HonroApp,E=HonroEquipment;a.frame=()=>{};a.stopBattle();a.profile=HonroProfileStore.fresh();a.normalProfile=a.profile;a.debugMode=false;a.profile.recruited=['archer','mage'];a.profile.honroJourney={version:1,restStageId:3,talked:{}};a.profile.settings.music=false;a.profile.settings.sound=false;E.transaction(a,p=>{E.grant(p,'eq_se_ledger');E.grant(p,'eq_co_01');E.grant(p,'eq_co_02');E.grant(p,'eq_se_t2_choice');E.grant(p,'eq_co_t1_choice');return true;});a.cls='archer';a.showCamp();}'''
with serve_game() as base,sync_playwright() as p:
 browser=launch(p)
 for name,viewport in [('desktop',{'width':1280,'height':800}),('mobile',{'width':390,'height':844}),('mobile-landscape',{'width':844,'height':390})]:
  context=browser.new_context(viewport=viewport,is_mobile=name!='desktop',has_touch=name!='desktop',device_scale_factor=1)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp');page.evaluate(SETUP)
  page.locator('[data-action="equipment-open"]').click();page.locator('[data-action="equipment-inspect"][data-id="itm_se_02"]').click()
  assert page.locator('.equipment-stat-compare').is_visible();page.screenshot(path=str(OUT/f'{name}-comparison.png'))
  bounds=page.locator('.equipment-dialog').evaluate('(e)=>({width:e.getBoundingClientRect().width,viewport:innerWidth,overflow:e.scrollWidth>e.clientWidth+2})');assert bounds['width']<=bounds['viewport'] and not bounds['overflow'],bounds
  page.locator('[data-action="equipment-equip"]').click();page.locator('.equipment-dialog [data-action="close"]').click()
  assert '솔바람 화살통' in page.locator('.equipment-slots').inner_text()
  page.locator('[data-action="equipment-pending"]').click();page.locator('[data-action="equipment-choice"][data-id="eq_se_t2_choice"]').click();page.locator('[data-action="equipment-inspect"][data-id="itm_se_03"]').click();page.screenshot(path=str(OUT/f'{name}-two-choice.png'))
  page.locator('.equipment-dialog [data-action="close"]').click();page.reload();page.wait_for_function('window.HonroApp');state=page.evaluate("()=>{HonroApp.frame=()=>{};return HonroApp.profile.equipment.rewardLedger.eq_se_t2_choice.state;}");assert state=='pending'
  page.evaluate("()=>{HonroApp.showCamp();HonroEquipmentUI.choice(HonroApp,'eq_se_t2_choice');}");page.locator('[data-action="equipment-inspect"][data-id="itm_se_04"]').click();page.locator('[data-action="equipment-choice-confirm"]').dblclick()
  assert page.evaluate("HonroApp.profile.equipment.rewardLedger.eq_se_t2_choice.selectedItemId")=='itm_se_04'
  page.evaluate("HonroEquipmentUI.choice(HonroApp,'eq_co_t1_choice')");page.locator('[data-action="equipment-inspect"][data-id="itm_co_04"]').click();page.screenshot(path=str(OUT/f'{name}-three-choice.png'))
  # Real localStorage failure: failed save preserves pending choice and selected comparison.
  page.evaluate("()=>{window.savedSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('test quota');};}");page.locator('[data-action="equipment-choice-confirm"]').click();assert page.evaluate("HonroApp.profile.equipment.rewardLedger.eq_co_t1_choice.state")=='pending';assert page.locator('[data-action="equipment-choice-confirm"]').is_visible();page.evaluate('()=>{Storage.prototype.setItem=window.savedSet;}');page.locator('[data-action="equipment-choice-confirm"]').click()
  # One shared item transfers through a separate explicit confirmation.
  page.evaluate("()=>{HonroApp.showCamp('archer');HonroEquipmentUI.open(HonroApp,'common');}");page.locator('[data-action="equipment-inspect"][data-id="itm_co_01"]').click();page.locator('[data-action="equipment-equip"]').click();page.locator('.equipment-dialog [data-action="close"]').click()
  page.evaluate("()=>{HonroApp.showCamp('mage');HonroEquipmentUI.open(HonroApp,'common');}");page.locator('[data-action="equipment-inspect"][data-id="itm_co_01"]').click();page.locator('[data-action="equipment-equip"]').click();assert page.locator('[data-action="equipment-transfer"]').is_visible();page.screenshot(path=str(OUT/f'{name}-transfer.png'));page.locator('[data-action="equipment-transfer"]').click()
  worn=page.evaluate('HonroApp.profile.equipment.equippedByClass');assert worn['archer']['common'] is None and worn['mage']['common']=='itm_co_01';assert not errors,errors
  page.locator('.equipment-dialog [data-action="close"]').click();page.evaluate("()=>{const a=HonroApp;HonroEquipment.transaction(a,p=>HonroEquipment.grant(p,'eq_da_gate'));a.equipmentNextCheck=0;a.equipmentNextToast=0;HonroEquipmentUI.tick(a);}");page.locator('#equipment-acquired:not([hidden]) img').first.wait_for();page.wait_for_function("[...document.querySelectorAll('#equipment-acquired img')].every(i=>i.complete&&i.naturalWidth===256)");page.screenshot(path=str(OUT/f'{name}-acquired.png'));assert page.locator('img.equipment-icon').evaluate_all('(es)=>es.every(e=>e.complete&&e.naturalWidth===256)');assets=page.evaluate("async()=>await Promise.all(Object.entries(HONRO_EQUIPMENT_ICONS).map(async([id,url])=>({id,status:(await fetch(url)).status})))");assert len(assets)==52 and all(a['status']==200 for a in assets),assets;rows.append({'viewport':name,'bounds':bounds,'worn':worn,'pageErrors':errors,'checks':['compare','equip','2-choice close/reload/commit/doubletap','3-choice save failure/retry','shared transfer confirmation']});print('PASS',name,flush=True);context.close()
 browser.close()
(OUT/'summary.json').write_text(json.dumps({'status':'passed','rows':rows,'limits':['Inventory/story progress were fixtures; real DOM, input, localStorage and production runtime were used.','Final52 icons were supplied and used; source PNG/prompts are not deployed.','Public deployment not performed.']},ensure_ascii=False,indent=2))
