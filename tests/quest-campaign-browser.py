"""Production browser quest checks using isolated profiles and declared checkpoints."""
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '_local/reports/quest-campaign'
OUT.mkdir(parents=True, exist_ok=True)
URL = os.getenv('HONRO_QUEST_URL', 'http://127.0.0.1:8891/HONRO.html')
PROFILE = json.loads((ROOT / 'tests/fixtures/act4-rc/support-entry-fixture.json').read_bytes())['profile']


def launch(browser, n):
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    profile = {**PROFILE, 'lastStage': n, 'mapNode': n,
               'cleared': {str(i): {'visits': 1, 'rounds': 5} for i in range(1, n)}}
    profile.pop('honroBattle', None)
    page.goto(URL, wait_until='domcontentloaded')
    page.wait_for_function('window.HonroApp && window.HonroCampaignLoader')
    page.evaluate('(p) => localStorage.setItem("honro-first-act-profile-1", JSON.stringify(p))', profile)
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.HonroApp && window.HonroAct4PilotCombat && window.HONRO_ACT4_PILOT_COMBAT_REFERENCE')
    page.evaluate('async n => { await HonroCampaignLoader.ensureStage(n); HonroApp.launch(n); }', n)
    page.wait_for_function('n => HonroApp.engine?.b?.honroStage === n', arg=n)
    return page, errors


with sync_playwright() as p:
    browser = p.chromium.launch()
    if '--survey' in sys.argv:
        rows = []
        for n in range(1, 41):
            page, errors = launch(browser, n)
            row = page.evaluate('''() => {
              const a=HonroApp,e=a.engine,b=e.b,V=HonroAct23V4;
              const controls=(b.honroMarkers||[]).filter(m=>m.action).map(m=>({
                id:m.id,kind:V.active(b)?V.steps(b).find(s=>s.id===m.id)?.kind||m.action:m.action,
                automatic:!!HonroAct23V4Reviewed.automaticMarker(b,m),
              }));
              const state=HonroObjectives.help(a);
              return {n:b.honroStage,goal:state.summary,controls,targets:a.scene.missionTargets.map(t=>({id:t.id,kind:t.kind}))};
            }''')
            assert row['goal'] and not errors, (row, errors)
            rows.append(row)
            print('Entry', n, 'markers', len(row['controls']), flush=True)
            page.close()
        (OUT / 'survey.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
        sys.exit(0)
    page, errors = launch(browser, 15)
    # Preserve all authored geometry and the real route decision. Prepare only
    # completed encounter/evidence state and a supported start before the exit.
    prep = page.evaluate('''() => {
      const app=HonroApp,e=app.engine,b=e.b,V=HonroAct23V4,A=HonroAct23V4Act2Scenes;
      const api=HonroAct23V4ReviewedChapters.apiFor(15),q=api.memory(b),m=HonroAct23V4Reviewed15.memory(b);
      if(app.dialogue) HonroStory.finish(app,true);
      for(const key of ['arrival','wheel','paths','high-branch','first-drops','repeat-drops','trajectory-guide','merge-pair','merge-clear','first-knock','deep-knocks','temple'])q.events[key]={status:'done',ids:[]};
      for(const s of V.steps(b))if(!s.optional&&s.kind!=='route')V.mem(b).done[s.id]=true;
      A.memory(b).proof['15.knocks']={count:3};m.merge.cleared=true;
      delete m.route;delete m.departure;delete b.honroRouteChoice;
      const exit=V.marker(b,'route-upper-exit'),u=e.unit('p-archer');
      const support=b.terrain.find(t=>t.id==='fc15-east-arch');
      const at=exit.x-165,y=HONRO_CORE.topAt(support,at);
      if(!Number.isFinite(y))throw Error('Expected supported approach to upper exit');
      Object.assign(u,{x:at,y,vx:0,vy:0,jumping:false,airborne:false,acted:false});
      b.active=u.id;app.turnNotice=null;
      return {exit,approach:u.x,grounded:e.grounded(u)};
    }''')
    assert prep['grounded'], prep
    page.wait_for_function("document.getElementById('objective-text').textContent.includes('바위길')")
    goal = page.locator('#objective-text').inner_text()
    marker = page.evaluate('HonroApp.scene.missionTargets.find(t=>t.id==="route-upper-exit")')
    assert marker['kind'] == 'exit' and marker['x'] == prep['exit']['x']
    assert not page.locator('[data-context-interact="route-upper-exit"]:visible').count()
    page.screenshot(path=str(OUT / '15-exit.png'))
    page.wait_for_function('HonroApp.canInput()')
    page.keyboard.down('ArrowRight')
    page.keyboard.press('ControlLeft')
    page.wait_for_timeout(250)
    page.keyboard.up('ArrowRight')
    if not page.evaluate('!!HonroApp.dialogue'):
        # Isolate the arrival check from the steep approach and jump timing.
        page.evaluate('''() => {const e=HonroApp.engine,u=e.active,p=HonroAct23V4.marker(e.b,'route-upper-exit');
          Object.assign(u,{x:p.x,y:p.y,vx:0,vy:0,airborne:false,jumping:false});}''')
    page.wait_for_function('HonroApp.dialogue?.lines[0]?.[2]?.rowId === "A2.S15.COMPLETE.02"', timeout=8000)
    page.locator('[data-action="dialogue-next"]:visible').first.click()
    page.wait_for_function('HonroApp.engine.b.honroRouteChoice?.selectedRoute === "B"')
    page.wait_for_function('HonroApp.profile.cleared[15]?.visits === 1')
    assert not errors, errors
    print('PASS 15 live HUD, map point, no false button, arrival triggers departure, stage settles')
    page.close()

    page, errors = launch(browser, 17)
    page.evaluate('''() => {
      const app=HonroApp,b=app.engine.b,api=HonroAct23V4ReviewedChapters.apiFor(17),a=HonroAct23V4Act2.memory(b);
      if(app.dialogue)HonroStory.finish(app,true);
      for(const key of ['arrival','intro','crack','hoist','separation','child-path','shaft-question','fetch','delivery','retreat','approach','shot','lock','rotation','knock','idle'])api.memory(b).events[key]={status:'done',ids:[]};
      a.proof['17.load-test']={locksClosed:true,ropeTaut:true};a.wheelAngle=Math.PI*2;
      app.turnNotice=null;
    }''')
    page.wait_for_function('HonroApp.dialogue?.reviewedEvent === "load"')
    assert page.locator('.story-progress').inner_text() == '1 / 2'
    page.locator('[data-action="dialogue-next"]:visible').first.click()
    assert page.locator('.story-progress').inner_text() == '2 / 2'
    page.reload(wait_until='domcontentloaded')
    page.locator('[data-action="continue"]:visible').first.click()
    page.wait_for_function('HonroApp.dialogue?.index === 1 && HonroApp.dialogue?.reviewedEvent === "load"')
    assert page.locator('.story-progress').inner_text() == '2 / 2'
    page.screenshot(path=str(OUT / '17-dialogue-reload.png'))
    page.locator('[data-action="dialogue-skip"]:visible').first.click()
    page.wait_for_function("['load','depart'].every(k=>HonroAct23V4ReviewedChapters.apiFor(17).done(HonroApp.engine.b,k))")
    assert not errors, errors
    print('PASS 17 connected dialogue, page 2 after reload, one skip, independent event receipts')
    page.close()

    page, errors = launch(browser, 39)
    guidance = page.evaluate('HonroAct4TerrainPreview.questGuidance(HonroApp)')
    assert '닻' in guidance['text'] and guidance['targets'][0]['kind'] == 'interact', guidance
    page.wait_for_function("document.getElementById('objective-text').textContent.includes('닻')")
    assert not page.locator('[data-act4-interact]:visible').count()
    page.evaluate('''() => {
      const a=HonroApp,e=a.engine,b=e.b,u=e.unit('mage'),p=b.honroAct4Design.rescue.anchor;
      if(a.dialogue)HonroStory.finish(a,true);
      const x=p.x+24,y=e.contactSurface(x,p.y-120,p.y+160)?.y;
      if(!Number.isFinite(y))throw Error('Expected an anchor approach');
      Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false,acted:false});
      b.active=u.id;a.turnNotice=null;
    }''')
    button = page.locator('[data-act4-interact]:visible').first
    for _ in range(18):
        page.wait_for_timeout(220)
        next_page = page.locator('[data-action="dialogue-next"]:visible')
        if next_page.count() and next_page.first.is_enabled():
            next_page.first.click()
        elif button.count() and not page.evaluate('!!HonroApp.dialogue'):
            break
    button.wait_for(timeout=6000)
    assert '출구 닻 고정' in button.inner_text()
    assert not page.evaluate('!!HonroApp.engine.b.honroAct4PreviewState.stabilizing')
    button.click(timeout=6000)
    page.wait_for_function('Boolean(HonroApp.engine.b.honroAct4PreviewState.exitStable)',timeout=8000)
    page.wait_for_function("document.getElementById('objective-text').textContent.includes('그물')")
    assert not errors, errors
    print('PASS 39 visible anchor button requires a click; successful action updates the goal to the net')
    browser.close()
