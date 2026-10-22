"""Actual debug/menu isolation checks using fixture combat changes; no campaign clear."""
import json
from browser_support import ROOT,launch,serve_game
from playwright.sync_api import sync_playwright
OUT=ROOT/'game/docs/image-journey-clean-settings/evidence'
def finish(page):page.evaluate('for(let i=0;HonroApp.dialogue&&i<50;i++)HonroStory.finish(HonroApp)')
def debug_page(page):
 page.click('[data-action=settings]');page.click('[data-action=settings-page][data-id=records]');page.click('[data-action=settings-page][data-id=debug]')
with serve_game() as url,sync_playwright() as p:
 b=launch(p);page=b.new_page(viewport={'width':1280,'height':900},accept_downloads=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate('HonroApp.launch(1)');finish(page)
 page.evaluate('HonroApp.engine.active.hp-=17;HonroApp.engine.b.round=7');page.click('[data-action=pause]');debug_page(page);page.locator('#debug-mode-setting').click();page.wait_for_function('HonroApp.debugMode&&HonroApp.screen==="rest"');finish(page)
 normal=page.evaluate('JSON.parse(localStorage.getItem("honro-first-act-profile-1"))')
 assert page.evaluate('HonroApp.profile!==HonroApp.normalProfile&&HonroApp.profile.honroBattle.round===7&&!HonroApp.engine')
 page.click('[data-action=journey-book]');seen=set()
 for act in [1,2,3]:
  page.click(f'[data-action=journey-act][data-id="{act}"]');ids=page.locator('[data-action=journey-select]').evaluate_all('(nodes)=>nodes.map(n=>+n.dataset.id)');assert len(ids)==10;seen.update(ids)
 assert seen==set(range(1,31))
 page.locator('[data-action=journey-select][data-id="30"]').scroll_into_view_if_needed();page.click('[data-action=journey-select][data-id="30"]');assert page.evaluate('HonroApp.screen')=='journey'
 page.click('[data-action=journey-travel]');page.click('[data-action=menu-cancel]') if page.locator('[data-action=menu-cancel]').count() else page.click('[data-action=cancel-journey-launch]')
 assert page.evaluate('HonroApp.profile.honroBattle.round')==7
 page.click('[data-action=journey-travel]');page.click('[data-action=confirm-journey-launch]');finish(page);assert page.evaluate('HonroApp.debugRestStage')==30
 page.wait_for_timeout(450);page.click('[data-action=camp]')
 for cls in ['archer','mage','knight','occultist']:
  page.click(f'[data-action=hero][data-class="{cls}"]');page.select_option('#debug-hero-level','30');assert page.evaluate('(c)=>HONRO_CORE.levelOf(HonroApp.profile.heroes[c])',cls)==30
 page.locator('.top [data-action=rest]').click();page.wait_for_timeout(450);debug_page(page)
 assert page.locator('#terrain-outline-setting').count()==1
 page.check('#terrain-outline-setting');assert page.evaluate('HonroApp.normalProfile.settings.debugTerrainOutline')
 page.locator('.menu-back').click();assert not page.locator('[data-action=import],[data-action=newgame]').count()
 with page.expect_download() as d:page.click('[data-action=export]')
 exported=json.loads(__import__('pathlib').Path(d.value.path()).read_text());assert exported['honroBattle']['round']==7 and exported['heroes']==normal['heroes']
 page.click('[data-action=settings-page][data-id=debug]');page.locator('#debug-mode-setting').click();finish(page);assert page.evaluate('!HonroApp.debugMode&&HonroApp.profile.honroBattle.round===7')
 page.evaluate('HonroApp.showTitle()');page.click('[data-action=continue]');finish(page);assert page.evaluate('HonroApp.engine.b.round')==7
 embedded=b.new_page();embedded.goto(url+'/HONRO.html?embedded=1');embedded.wait_for_function('window.HonroApp');embedded.evaluate('HonroApp.settings("records")');assert not embedded.locator('[data-action=settings-page][data-id=debug]').count()
 assert not errors,errors
 (OUT/'debug-browser-results.json').write_text(json.dumps({'normalBattleRound':7,'allActsTenPins':True,'selectionInert':True,'explicitTravel':True,'normalExport':True,'outlinePersistence':True,'disableResume':True,'embeddedRestriction':True,'errors':errors,'scope':'fixture combat round/HP; actual Chromium'},ensure_ascii=False,indent=2))
 b.close();print('PASS debug independent battle, 30 canonical pins, explicit travel, camp levels, outline, protected export, disable/resume, embedded restriction')
