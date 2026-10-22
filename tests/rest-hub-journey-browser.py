import os
"""Actual Chromium navigation/input evidence. Progress and terminal-ending states
are explicit fixtures, not normal campaign completion or pixel approval."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch, serve_game
OUT=Path(os.environ.get('HONRO_JOURNEY_OUT','game/docs/rest-hub-journey-flow/evidence'));OUT.mkdir(parents=True,exist_ok=True)
KEY='honro-first-act-profile-1'
rows=[];errors=[]
FINISH='for(let i=0;HonroApp.dialogue&&i<60;i++)HonroStory.finish(HonroApp)'
PERMANENT="()=>JSON.stringify(Object.fromEntries(['heroes','loadouts','cleared','honroGrowth','recruited','party','record','items'].map(k=>[k,HonroApp.profile[k]??null])))"
def shot(page,name):
    page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=82)
    assert (OUT/(name+'.jpg')).stat().st_size<1000000

def setup(page,cleared=4):
    page.evaluate('''async cleared=>{await HonroCampaignLoader.ensureStage(Math.min(30,cleared+1));const a=HonroApp;a.stopBattle();a.close();a.debugMode=false;const p=HONRO_TOOLS.fresh();p.settings.music=false;p.settings.sound=false;p.cleared={};for(let i=1;i<=cleared;i++)p.cleared[i]={visits:1,rounds:6};p.recruited=cleared>=10?['archer','mage','knight','occultist']:cleared>=5?['archer','mage','knight']:cleared>=2?['archer','mage']:['archer'];p.party=[...p.recruited];for(const cls of p.recruited)p.heroes[cls].xp=HONRO_CORE.xpAtLevel(16);a.profile=p;a.normalProfile=p;a.stageId=cleared+1;a.debugRestStage=null;a.journeySelection=null;a.journeyAct=null;a.journeyLayer=null;a.journeyInputAfter=0;a.showRest();}''',cleared)
    page.evaluate(FINISH)

def inside(page,selector):
    return page.locator(selector).evaluate('(n)=>{const r=n.getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&r.width>0&&r.height>0}')

with sync_playwright() as p, serve_game() as base:
    browser=launch(p)
    for w,h in [(360,800),(390,844),(844,390),(1280,900)]:
        page=browser.new_page(viewport={'width':w,'height':h},has_touch=True)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(base+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
        setup(page)
        page.locator('[data-action="journey-enter"]').click();page.wait_for_function('HonroApp.screen==="battle"');page.evaluate(FINISH)
        page.evaluate('''const a=HonroApp;a.engine.b.round=7;a.engine.active.hp-=12;a.engine.b.items.heal=0;a.dirty=false;a.profile.honroBattle=JSON.parse(JSON.stringify(a.engine.b));a.persist();a.pause()''')
        assert page.get_by_text('휴식터로 가기',exact=True).count()==1
        shot(page,f'{w}x{h}-pause')
        before=page.evaluate('JSON.stringify(HonroApp.engine.b)');saved=page.evaluate('(k)=>localStorage.getItem(k)',KEY)
        page.locator('.pause-menu [data-action="rest"]').click()
        assert page.locator('.journey-confirm').is_visible() and inside(page,'.journey-confirm')
        assert page.evaluate('JSON.stringify(HonroApp.engine.b)')==before
        assert page.evaluate('(k)=>localStorage.getItem(k)',KEY)==saved
        if w==360:
            page.evaluate('HonroApp.dirty=true;HonroApp.lastSave=0');page.wait_for_timeout(1400)
            assert page.evaluate('(k)=>localStorage.getItem(k)',KEY)==saved
            assert page.evaluate('HonroApp.dirty===true')
        shot(page,f'{w}x{h}-confirm')
        page.locator('[data-action="cancel-journey-launch"]').click()
        assert page.evaluate('HonroApp.engine.b.round===7&&HonroApp.profile.honroBattle.round===7')
        assert page.evaluate('(k)=>localStorage.getItem(k)',KEY)==saved
        page.evaluate('HonroApp.pause()');page.locator('.pause-menu [data-action="rest"]').click()
        permanent=page.evaluate(PERMANENT)
        page.locator('[data-action="confirm-journey-launch"]').dblclick(delay=60)
        page.wait_for_function('HonroApp.screen==="rest"');page.evaluate(FINISH)
        assert page.evaluate('HonroApp.engine===null&&HonroApp.profile.honroBattle===null')
        assert page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).honroBattle===null',KEY)
        assert page.evaluate(PERMANENT)==permanent
        assert inside(page,'.rest-actions')
        shot(page,f'{w}x{h}-rest')
        page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
        page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="rest"');page.evaluate(FINISH)
        assert page.evaluate('HonroApp.profile.honroBattle===null&&HonroApp.engine===null')
        page.locator('[data-action="journey-book"]').click()
        assert page.locator('.journey-acts button').count()==6
        assert page.locator('[data-action="journey-act"][data-id="2"]').is_disabled()
        assert page.locator('[data-action="journey-act"][data-id="4"]').is_disabled()
        assert page.locator('[data-action="journey-layer"]').count()==0
        assert inside(page,'.journey-acts') and inside(page,'.journey-detail')
        assert page.locator('.journey-acts').evaluate('(n)=>[...n.children].every(b=>b.scrollWidth<=b.clientWidth+1)')
        snapshot=page.evaluate('JSON.stringify(HonroApp.profile)');saved=page.evaluate('(k)=>localStorage.getItem(k)',KEY)
        pin=page.locator('[data-action="journey-select"][data-id="5"]');pin.scroll_into_view_if_needed();pin.click()
        assert page.evaluate('HonroApp.screen==="journey"&&HonroApp.engine===null&&HonroApp.journeySelection===5')
        assert page.evaluate('JSON.stringify(HonroApp.profile)')==snapshot
        assert page.evaluate('(k)=>localStorage.getItem(k)',KEY)==saved
        assert page.locator('[data-action="journey-travel"]').inner_text()=='휴식터로'
        shot(page,f'{w}x{h}-act1-cta')
        # Drag begins on a pin; the release click must not move or alter saves.
        box=pin.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+15);page.mouse.down();page.mouse.move(box['x']+box['width']/2+70,box['y']+65,steps=8);page.mouse.up()
        assert page.evaluate('HonroApp.screen==="journey"&&HonroApp.engine===null')
        page.mouse.wheel(0,-160)
        assert page.evaluate('(k)=>localStorage.getItem(k)',KEY)==saved
        # Two rapid CTA taps must not also press the new rest's departure.
        page.locator('[data-action="journey-travel"]').dblclick(delay=60)
        page.wait_for_function('HonroApp.screen==="rest"');assert page.evaluate('HonroApp.engine===null')
        page.wait_for_timeout(450)
        page.locator('[data-action="journey-enter"]').click();page.wait_for_function('HonroApp.screen==="battle"');page.evaluate(FINISH)
        assert page.evaluate('HonroApp.engine.b.honroStage===5&&HonroApp.engine.b.round===1')
        page.evaluate('HonroApp.pause()');shot(page,f'{w}x{h}-fresh-stage')
        # Act 2's unified geography, and direct CTA for a stage with no rest.
        setup(page,19);page.locator('[data-action="journey-book"]').click()
        page.locator('[data-action="journey-act"][data-id="2"]').click()
        assert page.locator('.journey-pin').count()==10
        assert page.locator('[data-action="journey-select"][data-id="11"]').count()==1
        assert page.locator('[data-action="journey-act"][data-id="3"]').is_disabled()
        page.locator('[data-action="journey-select"][data-id="12"]').scroll_into_view_if_needed();page.locator('[data-action="journey-select"][data-id="12"]').click()
        shot(page,f'{w}x{h}-act2-surface')
        pin=page.locator('[data-action="journey-select"][data-id="19"]');pin.scroll_into_view_if_needed();pin.click()
        assert page.locator('[data-action="journey-travel"]').inner_text()=='진입'
        assert inside(page,'.journey-detail')
        shot(page,f'{w}x{h}-act2-direct')
        # Real viewport rotation keeps the selected pin/CTA and bounded UI.
        page.set_viewport_size({'width':h,'height':w});page.wait_for_timeout(100)
        assert inside(page,'.journey-acts') and inside(page,'.journey-detail')
        assert page.evaluate('HonroApp.journeySelection===19&&HonroApp.engine===null')
        page.set_viewport_size({'width':w,'height':h})
        page.locator('[data-action="journey-travel"]').click();page.wait_for_function('HonroApp.screen==="battle"&&HonroApp.engine.b.honroStage===19',timeout=120000);page.evaluate(FINISH)
        assert page.evaluate('HonroApp.engine.b.round===1')
        rows.append({'viewport':[w,h],'flow':'pause/cancel/confirm/reload/hub/book/select/CTA/new battle','act2':'11–12 surface and 13–20 underground','rotation':True,'doubleClick':True,'savePreservedBeforeApproval':True})
        page.close()
    assert not errors,errors
    browser.close()
(OUT/'browser-results.json').write_text(json.dumps({'checks':rows,'errors':errors,'scope':'Real Chromium inputs on fixture campaign profiles; no normal combat completion or parent pixel approval claimed.'},ensure_ascii=False,indent=2)+'\n')
print('PASS four Chromium viewports: tab/CTA/confirmation/hub/new entry, save/reload, rotation, drag/wheel and double click')
