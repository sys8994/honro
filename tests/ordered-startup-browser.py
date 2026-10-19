"""Only new start, selected-stage continue and the shared editor entry."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
from story_browser_server import story_base_url

out=ROOT/'_local/reports/zoom-startup'
out.mkdir(parents=True,exist_ok=True)
errors=[]
with sync_playwright() as pw:
    browser=launch(pw);page=browser.new_page();base=story_base_url()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base+'/HONRO.html')
    page.wait_for_function('document.documentElement.dataset.honroReady')
    initial=page.evaluate('HONRO_PROJECT.stages.filter(s=>!s.pending).map(s=>s.metadata.stageId)')
    assert initial==[1],initial
    assert not page.locator('.title-actions button.primary').is_disabled()
    page.locator('.title-actions button.primary').click()
    page.wait_for_function("HonroApp.screen!=='title'")
    page.evaluate('''()=>{const a=HonroApp;a.frame=()=>{};while(a.dialogue)HonroStory.finish(a);a.launch(1);while(a.dialogue)HonroStory.finish(a);}''')
    assert page.evaluate('HonroApp.engine.b.honroStage')==1
    page.evaluate('''async()=>{const a=HonroApp;for(let n=1;n<21;n++)a.profile.cleared[n]=true;await HonroCampaignLoader.ensureStage(21);a.launch(21);while(a.dialogue)HonroStory.finish(a);a.engine.b.round=3;const u=a.engine.b.units.find(u=>u.side===0&&u.cls==='archer');u.hp-=7;a.profile.honroBattle=structuredClone(a.engine.b);a.profile.lastStage=1;if(a.profile.honroJourney)delete a.profile.honroJourney.story;a.persist();}''')
    saved=page.evaluate("JSON.parse(localStorage.getItem('honro-first-act-profile-1'))")
    page.reload();page.wait_for_function('document.documentElement.dataset.honroReady')
    loaded=page.evaluate('HONRO_PROJECT.stages.filter(s=>!s.pending).map(s=>s.metadata.stageId)')
    assert loaded==[21],loaded
    assert page.locator('.title-actions button.primary').get_attribute('data-action')=='continue'
    page.locator('.title-actions button.primary').click()
    page.wait_for_function('HonroApp.engine?.b.honroStage===21')
    actual=page.evaluate("({round:HonroApp.engine.b.round,hp:HonroApp.engine.b.units.find(u=>u.side===0&&u.cls==='archer').hp,heroes:HonroApp.profile.heroes,loadouts:HonroApp.profile.loadouts,cleared:HonroApp.profile.cleared})")
    assert actual['round']==3
    assert actual['hp']==next(u['hp'] for u in saved['honroBattle']['units'] if u['side']==0 and u.get('cls')=='archer')
    assert all(actual[k]==saved[k] for k in ['heroes','loadouts','cleared'])
    editor=browser.new_page();editor.on('pageerror',lambda e:errors.append(str(e)))
    editor.goto(base+'/HONRO_WORKSHOP.html')
    editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene',timeout=60000)
    assert editor.evaluate('HONRO_PROJECT.stages.length')==30
    project_errors=editor.evaluate("HonroMaps.validate(HONRO_PROJECT).filter(x=>x.level==='err')")
    editor.click('[data-tab="play"]')
    editor.wait_for_function('!!HonroWorkshopAPI.getPlayApp()',timeout=60000)
    editor.frames[1].evaluate('()=>HONRO_READY')
    assert editor.frames[1].evaluate('HONRO_EMBEDDED && !!HonroApp')
    if not project_errors:
        assert editor.frames[1].evaluate('!!HonroApp.engine')
    assert not errors,errors
    browser.close()
result={'newStartLoaded':initial,'continueLoaded':loaded,'savedRound':actual['round'],'hpGrowthLoadoutsClearedPreserved':True,'editorAndEmbeddedInitialized':True,'playtestBlockedByProjectValidation':project_errors,'errors':errors}
(out/'startup-checks.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
