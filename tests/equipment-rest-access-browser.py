"""Real normal-profile navigation from a recorded stage2 victory; never force live battle phase."""
import os,json,gzip
from playwright.sync_api import sync_playwright
from browser_support import ROOT,serve_game,launch
OUT=ROOT/'_local/reports/equipment-rest-hotfix';OUT.mkdir(parents=True,exist_ok=True)
BEFORE=bool(os.environ.get('HONRO_EQUIPMENT_BEFORE'))
profile=json.load(gzip.open(ROOT/'game/docs/stage-review/integration-20261021/evidence/stage2/profile-terminal.json.gz','rt'));assert profile['honroBattle']['phase']=='won' and not profile['cleared'].get('2');profile['settings'].update(sound=False,music=False)
def finish(page):
 for _ in range(50):
  button=page.locator('[data-action="dialogue-next"]:visible').first
  if not button.count():break
  button.click()
with serve_game() as base,sync_playwright() as p:
 b=launch(p);page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp')
 page.evaluate('p=>{const a=HonroApp;a.frame=()=>{};if(!a.replaceProfile(a.profileStore.importText(JSON.stringify(p))))throw Error("import failed");a.continue();}',profile)
 page.wait_for_function("HonroApp.engine?.b.phase==='won'");page.evaluate('HonroApp.outcome()');finish(page)
 page.locator('[data-action="result-continue"]').click();page.wait_for_selector('.rest-screen');finish(page)
 page.locator('[data-action="camp"]').click();page.locator('.hero-tab[data-class="mage"]').click();page.locator('.equipment-bag-item[data-id="itm_da_01"]').click()
 state=page.evaluate('()=>({debug:HonroApp.debugMode,stageId:HonroApp.profile.honroJourney.stageId,restStageId:HonroApp.profile.honroJourney.restStageId,mage:HONRO_CORE.levelOf(HonroApp.profile.heroes.mage),canEquip:HonroEquipment.canEquip(HonroApp),cleared2:!!HonroApp.profile.cleared[2],item:HonroApp.profile.equipment.equippedByClass.mage.personal})')
 button=page.get_by_role('button',name='장착',exact=True);assert state['debug'] is False and state['cleared2'] and state['mage']==2 and not state.get('restStageId');assert button.is_disabled()==BEFORE
 page.screenshot(path=str(OUT/('before-locked.png' if BEFORE else 'after-enabled.png')))
 if not BEFORE:
  button.click();assert page.evaluate("HonroApp.profile.equipment.equippedByClass.mage.personal")=='itm_da_01';page.screenshot(path=str(OUT/'after-equipped.png'))
  page.reload();page.wait_for_function('window.HonroApp');page.evaluate('()=>{HonroApp.frame=()=>{};HonroApp.showRest();}');finish(page);page.locator('[data-action="camp"]').click();page.locator('.hero-tab[data-class="mage"]').click();assert page.evaluate("HonroApp.profile.equipment.equippedByClass.mage.personal")=='itm_da_01';assert page.evaluate("HonroApp.profile.equipment.ownedItemIds.filter(id=>id==='itm_da_01').length")==1
  state['reloadEquipped']=True
 assert not errors,errors;b.close();(OUT/('before.json' if BEFORE else 'after.json')).write_text(json.dumps({'state':state,'errors':errors,'source':'Recorded ordinary production stage2 terminal save; outcome/resultContinue/recruit/rest/camp/save are current runtime. No new full chapter combat claimed.'},ensure_ascii=False,indent=2)+'\n');print('PASS actual mobile normal path',json.dumps(state,ensure_ascii=False),flush=True)
