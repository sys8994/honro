"""Focused UI QA. Existing checked web runtime + explicit current-source UI overlay.
This is not a normal build or release-gate pass. Cleared chapters are fixtures.
"""
import json, os
from contextlib import nullcontext
from playwright.sync_api import sync_playwright
from browser_support import launch, serve_game, ROOT
PRODUCTION=os.environ.get('HONRO_ITEM_UI_MODE')=='production'
OUT=ROOT/os.environ.get('HONRO_ITEM_UI_OUT','_local/reports/item-discovery');OUT.mkdir(parents=True,exist_ok=True)
RESET=r'''(through)=>{const a=HonroApp;a.frame=()=>{};a.close();const p=HonroProfileStore.fresh();p.settings.sound=false;p.settings.music=false;p.settings.debugMode=false;p.honroJourney={version:1,restStageId:through?21:2,talked:{}};if(through){p.recruited=['archer','mage','knight','occultist'];for(let i=1;i<=through;i++)p.cleared[i]={visits:1};}a.replaceProfile(a.profileStore.importText(JSON.stringify(p)));a.engine=null;a.scene=null;a.done=false;a.equipmentSelected=null;a.equipmentFilter=null;a.equipmentTransferId=null;HonroEquipment.observe(a);a.showCamp('archer');HonroEquipmentUI.tick(a);}'''
BATTLE=r'''()=>{const a=HonroApp;for(let n=0;a.dialogue&&n<50;n++)HonroStory.finish(a);a.turnNotice=null;a.close();const b=a.engine.b;b.phase='aim';b.side=0;b.projectiles=[];delete b.volley;for(const u of b.units)Object.assign(u,{vx:0,vy:0,airborne:false,jumping:false});a.equipmentNextCheck=0;a.equipmentNextToast=Infinity;HonroEquipmentUI.tick(a);a.scene.render(a.engine,0,a.selected,a.power,false,0,true);}'''
def overlay(page):
    if PRODUCTION:return
    for f in ['shared/runtime/equipment-ui.js','shared/runtime/rest-journey.js']:
        page.add_script_tag(content=(ROOT/f).read_text())
    # Replace the equipment stylesheet in place, not append another cascade.
    # Removed baseline declarations (e.g. rotated reward thumbnails) must disappear.
    page.evaluate('''css=>{const old=document.querySelector('link[href*="game-src-equipment."],[data-equipment-source-overlay]');if(!old)throw Error('Equipment stylesheet not found');const style=document.createElement('style');style.dataset.equipmentSourceOverlay='true';style.textContent=css;old.replaceWith(style);}''',(ROOT/'game/src/equipment.css').read_text())
def battle(page):
    page.evaluate('HonroApp.launch(21)')
    page.wait_for_function('HonroApp.engine?.b.honroStage===21&&HonroApp.screen==="battle"')
    page.evaluate(BATTLE)
def shot(page,label,name):
    page.screenshot(path=str(OUT/f'{label}-{name}.png'))
def pending(page):
    return page.evaluate("Object.values(HonroApp.profile.equipment.rewardLedger).filter(r=>r.state==='pending').length")
rows=[]
with (nullcontext(os.environ['HONRO_ITEM_UI_URL']) if os.environ.get('HONRO_ITEM_UI_URL') else serve_game()) as base,sync_playwright() as p:
 browser=launch(p)
 for label,size in [('mobile',{'width':390,'height':844}),('small',{'width':320,'height':568}),('landscape',{'width':844,'height':390}),('desktop',{'width':1280,'height':800})]:
  ctx=browser.new_context(viewport=size,is_mobile=label!='desktop',has_touch=label!='desktop');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp');page.evaluate(RESET,20)
  if not PRODUCTION:
   shot(page,label,'before-bag');page.locator('.equipment-unclaimed').click();shot(page,label,'before-choice');page.get_by_role('button',name='나중에',exact=True).click();battle(page);shot(page,label,'before-hud')
  overlay(page);page.evaluate(RESET,20);assert pending(page)==6
  link=page.locator('.equipment-unclaimed');assert '보상' not in link.inner_text();assert '물건 살피기' in link.inner_text();assert link.locator('b').count()==0
  assert page.locator('.equipment-bag-heading').evaluate('e=>e.nextElementSibling.matches(".equipment-unclaimed")')
  assert not page.locator('#equipment-pending-battle').is_visible();shot(page,label,'after-bag');link.click();assert page.locator('.equipment-reward-item').count()==3;assert page.locator('.equipment-confirm').is_disabled()
  assert page.locator('.equipment-source').inner_text().startswith('7장');assert '가져갈 물건' in page.locator('.equipment-reward-head').inner_text();assert '보상' not in page.locator('.equipment-choice-dialog').inner_text()
  assert page.locator('.equipment-options').count()>0
  page.locator('.equipment-reward-item[data-id="itm_co_04"]').click();assert page.get_by_role('button',name='챙긴다',exact=True).is_enabled();shot(page,label,'after-choice')
  page.get_by_role('button',name='나중에',exact=True).click();assert pending(page)==6
  page.reload();page.wait_for_function('window.HonroApp');overlay(page);page.evaluate('()=>{HonroApp.frame=()=>{};HonroApp.showCamp();}')
  assert pending(page)==6;page.locator('.equipment-unclaimed').click();page.locator('.equipment-choice-dialog .close').click();assert pending(page)==6
  # Leave the game and use browser Back: pending saved choices survive navigation.
  page.goto(base+'/README.md');page.go_back(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp');overlay(page);page.evaluate('()=>{HonroApp.frame=()=>{};HonroApp.showCamp();}')
  assert pending(page)==6;page.locator('.equipment-unclaimed').click();page.locator('.equipment-reward-item[data-id="itm_co_04"]').click()
  page.evaluate("()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('quota fixture');};}")
  page.locator('.equipment-confirm').click();assert pending(page)==6;assert page.locator('.equipment-save-error').is_visible();assert page.evaluate('HonroApp.equipmentSelected')=='itm_co_04';shot(page,label,'save-failure')
  page.evaluate('()=>{Storage.prototype.setItem=window.originalSet;}');page.locator('.equipment-confirm').click();page.evaluate("HonroEquipmentUI.handle(HonroApp,{dataset:{action:'equipment-choice-confirm'}})")
  assert pending(page)==5;assert not page.locator('#modal').evaluate('e=>e.classList.contains("open")');assert page.evaluate("HonroApp.profile.equipment.ownedItemIds.filter(x=>x==='itm_co_04').length")==1
  shot(page,label,'after-chosen');page.locator('.equipment-unclaimed').click();assert page.locator('.equipment-reward-item').count()==2
  old=page.evaluate('HonroApp.equipmentChoice');page.get_by_role('button',name='다음 물건 묶음',exact=True).click();assert page.evaluate('HonroApp.equipmentChoice')!=old;page.keyboard.press('Escape');assert pending(page)==5
  battle(page);button=page.locator('#equipment-pending-battle');assert button.inner_text()=='물건 살피기';assert button.is_visible();shot(page,label,'after-hud')
  button.click();assert page.locator('.equipment-choice-dialog').is_visible();page.get_by_role('button',name='나중에',exact=True).click()
  page.evaluate('()=>{HonroApp.engine.b.phase="flight";HonroEquipmentUI.tick(HonroApp);}');assert not button.is_visible()
  # Real rest markup, no rest re-entry on choose, final pending choice disappears.
  page.evaluate(RESET,0);assert page.locator('.equipment-unclaimed').count()==0
  page.evaluate("()=>{const a=HonroApp;HonroEquipment.transaction(a,p=>HonroEquipment.grant(p,'eq_co_t1_choice'));a.showRest();for(let n=0;a.dialogue&&n<50;n++)HonroStory.finish(a);}")
  assert page.locator('.rest-equipment').inner_text()=='물건 살피기';page.locator('.rest-equipment').click();page.locator('.equipment-reward-item[data-id="itm_co_04"]').click();page.locator('.equipment-confirm').click()
  assert pending(page)==0;assert page.locator('.rest-equipment').inner_text()=='장비';assert page.evaluate('HonroApp.screen')=='rest';assert not page.evaluate('Boolean(HonroApp.dialogue)')
  page.locator('.rest-equipment').click();assert page.locator('.equipment-unclaimed').count()==0;assert page.locator('.equipment-bag-item[data-id="itm_co_04"]').is_visible();shot(page,label,'no-pending')
  assert not errors,errors
  assert page.locator('.equipment-panel').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
  rows.append({'viewport':label,'size':size,'checks':['six pending/no claim badge','stage provenance','three/two choices and stats','later/close/reopen','browser Back','save/reload','storage failure/retry','repeat confirm exactly once','no forced next modal','paging/Escape','battle safe/flight hidden','rest entry/last-choice/no re-entry','no pending/inventory'],'pageErrors':errors})
  print('PASS',label,flush=True);ctx.close()
 browser.close()
(OUT/'summary.json').write_text(json.dumps({'status':'passed','sourceSha':os.popen('git rev-parse HEAD').read().strip(),'mode':'normal gated production build' if PRODUCTION else 'checked web runtime plus explicit UI source overlay','rows':rows,'limits':([] if PRODUCTION else ['Not a normal production build or gate pass.'])+['Cleared chapter states and battle phases are fixtures, not full campaign gameplay.']},ensure_ascii=False,indent=2)+'\n')
