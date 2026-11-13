"""Focused Chromium inputs in isolated profiles; no claim of a fresh chapter clear."""
import json
import os
from contextlib import nullcontext
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game

OUT = ROOT / '_local/reports/combat-rest-polish'
OUT.mkdir(parents=True, exist_ok=True)
KEY = 'honro-first-act-profile-1'
errors = []
base_override = os.environ.get('HONRO_PUBLIC_URL')
fixture = ROOT / 'game/docs/stage-review/act-endings/evidence/normal-21-escape-save.json'

def ready(page, base):
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base + '/HONRO.html', wait_until='domcontentloaded')
    page.wait_for_function('!!window.HonroApp', timeout=60000)

def advance(page, stop=None):
    for _ in range(65):
        if stop and stop():
            return
        next_button = page.locator('[data-action="dialogue-next"]:visible').first
        if not next_button.count():
            return
        next_button.click()

with sync_playwright() as p, (nullcontext(base_override) if base_override else serve_game()) as base:
    browser = launch(p)
    page = browser.new_page(viewport={'width': 1150, 'height': 740})
    ready(page, base)
    page.evaluate('''async ()=>{await HonroCampaignLoader.ensureStage(11);const a=HonroApp,p=HONRO_TOOLS.fresh();
      p.settings.sound=p.settings.music=false;for(let i=1;i<=10;i++)p.cleared[i]={visits:1,rounds:8};
      p.recruited=p.party=['archer','mage','knight','occultist'];a.profile=a.normalProfile=p;a.debugMode=false;a.showRest();}''')
    page.wait_for_selector('.rest-screen')
    advance(page, lambda: page.locator('#story-line').count() and '발자국이 남았을지' in page.locator('#story-line').inner_text())
    assert '발자국이 남았을지' in page.locator('#story-line').inner_text()
    page.locator('[data-action="dialogue-next"]').click()
    assert '문밖 피난처' in page.locator('#story-line').inner_text()
    assert page.evaluate("HonroApp.persist() && JSON.parse(localStorage.getItem('honro-first-act-profile-1')).honroJourney.story.index") > 0
    page.reload()
    page.wait_for_function('!!window.HonroApp')
    page.evaluate('async ()=>{await HonroCampaignLoader.ensureStage(11);HonroApp.showRest();}')
    restored = page.evaluate("""()=>({line:document.querySelector('#story-line')?.textContent,
        stage:HonroJourneyContent.next(HonroApp.profile)?.stageId,story:HonroApp.profile.honroJourney?.story,
        store:HonroApp.profileStore.state,profile:HonroApp.profile.game,debug:HonroApp.debugMode})""")
    assert '문밖 피난처' in (restored.get('line') or ''), restored
    advance(page)
    assert page.locator('.rest-screen header.top, .rest-actions .rest-equipment').count() == 0
    assert page.locator('.rest-screen-controls [data-action="title"]').is_visible()
    assert page.locator('.rest-screen-controls [data-action="settings"]').is_visible()
    page.screenshot(path=OUT / 'rest.jpg')
    flame = page.locator('[data-rest-motion="flame-inner"]').first.bounding_box()
    assert flame, 'real flame geometry'
    x, y = flame['x'] + flame['width'] / 2, flame['y'] + flame['height'] / 2
    assert page.evaluate('([x,y])=>!!document.elementFromPoint(x,y)?.closest(".rest-fire")', [x, y])
    page.mouse.click(x, y)
    page.wait_for_selector('.hero-tab')
    cards = page.locator('.hero-tab:not([disabled])')
    a, b = cards.first.bounding_box(), cards.nth(1).bounding_box()
    first = cards.first.get_attribute('data-class')
    second = cards.nth(1).get_attribute('data-class')
    page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2)
    page.mouse.down()
    page.mouse.move(b['x']+b['width']/2,a['y']+a['height']+60,steps=14)
    page.mouse.up()
    assert page.evaluate('HonroPlayerTurnOrder.known(HonroApp.profile).slice(0,2)') == [second, first]
    page.evaluate('HonroApp.showRest()')
    page.locator('.rest-next').click()
    page.wait_for_selector('.battle-screen')
    page.wait_for_selector('.story-progress')
    lines=page.evaluate("HonroApp.dialogue.lines.map(l=>l[2]?.rowId)")
    assert lines[0]=='EDGE.ARRIVALS_11_0' and lines[1:5]==['A2.S11.INTRO.0'+str(i) for i in range(1,5)],lines
    page.locator('[data-action="dialogue-next"]').click()
    assert page.locator('.story-progress').inner_text().strip().startswith('2')
    page.locator('[data-action="dialogue-skip"]').click()
    page.wait_for_function("HonroAct23V4Reviewed.memory(HonroApp.engine.b).events.advance.status==='done'")
    assert page.evaluate("HonroAct23V4Reviewed.memory(HonroApp.engine.b).events.advance.retiredIds.includes('A2.S11.INTRO.04')")
    data=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,s=HonroAct23V4.current(b),h=HonroObjectives.state(b,a.stage);return {id:s.id,actual:h.targets.map(t=>[t.id,t.x,t.kind]),expected:s.defeatIds.map(id=>[id,a.engine.unit(id).x,'hostile']),text:h.currentInstruction}}''')
    assert data['id']=='11.entry-threat' and sorted(data['actual'])==sorted(data['expected']) and f"{len(data['expected'])}명 남음" in data['text'],data
    shifted=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,s=HonroAct23V4.current(b),u=a.engine.unit(s.defeatIds[0]);u.x+=410;
      a.engine.unit(s.defeatIds[1]).hp=0;a.engine.unit(s.defeatIds[1]).dead=true;
      const h=HonroObjectives.state(b,a.stage);return h.targets.some(t=>t.id===u.id&&t.x===u.x)&&!h.targets.some(t=>t.id===s.defeatIds[1]);}''')
    assert shifted
    page.screenshot(path=OUT / 'act2-1-objective.jpg')
    page.evaluate('async()=>{const a=HonroApp;a.stopBattle();await HonroCampaignLoader.ensureStage(1);a.profile=a.normalProfile=HONRO_TOOLS.fresh();a.profile.settings.music=a.profile.settings.sound=false;a.launch(1);}')
    page.wait_for_selector('.battle-screen')
    advance(page, lambda: page.locator('.guide-overlay').count() > 0)
    page.wait_for_selector('.guide-overlay',timeout=12000)
    page.wait_for_function("getComputedStyle(document.querySelector('.battle-bottom')).opacity==='1'")
    assert page.locator('.battle-bottom').evaluate("(el)=>{const s=getComputedStyle(el);return s.visibility==='visible'&&s.pointerEvents==='none'}")
    page.screenshot(path=OUT / 'goal-hud.jpg')
    page.evaluate('''async()=>{const a=HonroApp;a.stopBattle();await HonroCampaignLoader.ensureStage(12);
      const p=HONRO_TOOLS.fresh();p.settings.sound=p.settings.music=false;p.recruited=p.party=['archer','mage','knight','occultist'];
      for(let i=1;i<=11;i++)p.cleared[i]={visits:1,rounds:8};p.seen['act2:first-spirit-encounter']=true;
      a.profile=a.normalProfile=p;a.launch(12);}''')
    page.wait_for_function('HonroApp.engine?.b.honroStage===12')
    advance(page)
    page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,x=3830;
      const y=HONRO_CORE.topAt(b.terrain.find(t=>t.id==='sq-lower-ground'),x);
      Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false});a.scene.x=x;a.scene.y=y-100;a.turnNotice=null;}''')
    advance(page)
    page.wait_for_function('HonroApp.canInput()',timeout=6000)
    for key, comparison in [('ArrowLeft','<3800'),('ArrowRight','>3845')]:
        page.keyboard.down(key)
        try:
            page.wait_for_function(f'HonroApp.engine.active.x{comparison}',timeout=6000)
        except Exception as exc:
            raise AssertionError(page.evaluate("()=>{const a=HonroApp,u=a.engine.active;return [u.x,u.y,u.moveLeft,a.canInput(),a.dialogue?.lines[a.dialogue.index]?.slice(0,2),a.engine.b.phase,[...a.keys]]}")) from exc
        finally:
            page.keyboard.up(key)
    page.screenshot(path=OUT / 'act2-2-sign-slope.jpg')
    print('PASS stage 12 54.54 degree sign slope in both directions with keyboard',flush=True)
    page.close()
    print('PASS rest story + saved page, header controls, painted flame hit, off-row pointer drag, goal HUD', flush=True)

    if not base_override:
        page = browser.new_page(viewport={'width': 1150, 'height': 740})
        ready(page, base)
        profile = json.loads(fixture.read_text(encoding='utf8'))['profile']
        # Place only the three playable heroes near the gate for this focused UI
        # checkpoint. Sodan starts at the original recorded ritual position.
        positions = {'p-archer':4630, 'p-mage':4560, 'p-knight':4490}
        battle = profile['honroBattle']
        for unit in battle['units']:
            if unit['id'] in positions:
                x=positions[unit['id']]
                unit.update(x=x,y=unit['y'],
                            vx=0,vy=0,acted=False,airborne=False,jumping=False)
        profile = page.evaluate('''p=>{const b=p.honroBattle;for(const u of b.units)if(u.id.startsWith('p-'))u.y=HonroWorld.top(b,u.x,2900,'outer-yard');return p}''',profile)
        profile['settings'].update(sound=False,music=False)
        page.evaluate('([key,p])=>localStorage.setItem(key,JSON.stringify(p))', [KEY, profile])
        page.reload()
        page.wait_for_function('!!window.HonroApp')
        page.evaluate('HonroApp.continue()')
        page.wait_for_function("document.querySelector('#story-line')?.textContent.includes('매듭은 다 풀었어요')", timeout=25000)
        page.locator('[data-action="dialogue-next"]').click()
        assert '동쪽 외문' in page.locator('#story-line').inner_text()
        page.locator('[data-action="dialogue-next"]').click()
        for i, hero in enumerate(positions):
            page.wait_for_function(f"HonroApp.engine.active?.id==='{hero}'")
            page.keyboard.down('d')
            try:
                page.wait_for_function(f"HonroApp.engine.unit('{hero}').x>4800",timeout=16000)
            finally:
                page.keyboard.up('d')
            if i<2:
                assert page.evaluate('HonroApp.engine.b.honroState.sodanWithdrawal.phase') == 'escape'
                page.keyboard.press('Tab')
        page.wait_for_function("HonroApp.engine.b.phase==='won'", timeout=20000)
        page.wait_for_selector('#story-line')
        assert page.evaluate("HonroApp.dialogue.lines.some(l=>l[1].includes('닫혔어요'))"), page.evaluate("HonroApp.dialogue.lines.map(l=>l.slice(0,2))")
        assert page.evaluate("HonroSodanWithdrawal.progress(HonroApp.engine.b)===4")
        page.screenshot(path=OUT / 'stage10-gate.jpg')
        advance(page)
        page.wait_for_function("HonroApp.done&&!!HonroApp.profile.cleared[10]",timeout=10000)
        page.wait_for_selector('[data-action="result-continue"], #act-ending',timeout=6000)
        assert page.evaluate("!!JSON.parse(localStorage.getItem('honro-first-act-profile-1')).cleared[10]")
        page.close()
        print('PASS stage 10 checkpoint: retreat dialogue, keyboard movement for all three heroes, Sodan walks, gate outro and settlement',flush=True)
    assert not errors, errors
    browser.close()
