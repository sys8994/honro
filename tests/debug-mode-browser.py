"""Debug stage access must never write campaign progress or replace a normal save."""
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT = ROOT / '_local/reports/debug-mode'
OUT.mkdir(parents=True, exist_ok=True)


def check(label, condition):
    assert condition, label
    print('PASS', label, flush=True)


def dismiss(page):
    page.evaluate('while(HonroApp.dialogue)HonroStory.finish(HonroApp)')


with sync_playwright() as playwright:
    browser = launch(playwright)
    context = browser.new_context(viewport={'width': 1440, 'height': 900})
    errors = []
    game = context.new_page()
    game.on('pageerror', lambda error: errors.append(str(error)))
    game.goto((ROOT / 'HONRO.html').as_uri())
    game.wait_for_function('window.HonroApp')
    game.evaluate('HonroApp.frame=()=>{}')

    game.click('.title-actions [data-action="map"]')
    dismiss(game)
    game.click('#map-dock [data-action="launch"]')
    dismiss(game)
    original = game.evaluate('''() => {
      const a=HonroApp;a.persist();const p=JSON.parse(localStorage.getItem('honro-first-act-profile-1'));
      return {battle:p.honroBattle.honroStage,cleared:p.cleared,xp:p.heroes.archer.xp,
        record:p.record,lastStage:p.lastStage};
    }''')
    check('Normal stage 1 battle is saved before debug', original['battle'] == 1)

    game.click('[data-action="pause"]')
    game.click('.pause-menu [data-action="settings"]')
    game.screenshot(path=str(OUT / 'settings-before.png'))
    game.locator('#debug-mode-setting').evaluate('(node) => node.click()')
    dismiss(game)
    game.screenshot(path=str(OUT / 'all-stages-map.png'))
    check('Settings unlock all 20 map nodes without clear marks', game.evaluate('''() =>
      HonroApp.debugMode && document.querySelectorAll('.map-node.open').length===20 &&
      document.querySelectorAll('.map-node.cleared').length===0'''))
    check('Normal battle, XP and records survive enabling debug', game.evaluate('''before => {
      const p=JSON.parse(localStorage.getItem('honro-first-act-profile-1'));
      return p.settings.debugMode===true && p.honroBattle.honroStage===before.battle &&
        JSON.stringify(p.cleared)===JSON.stringify(before.cleared) &&
        p.heroes.archer.xp===before.xp && JSON.stringify(p.record)===JSON.stringify(before.record) &&
        p.lastStage===before.lastStage;
    }''', original))

    game.locator('.map-node[data-id="20"]').evaluate('(node)=>node.click()')
    check('Stage 20 can be selected in debug', game.evaluate('HonroApp.stageId===20 && !document.querySelector("#map-dock [data-action=launch]").disabled'))
    game.click('#map-dock [data-action="launch"]')
    dismiss(game)
    game.evaluate('HonroApp.scene.render(HonroApp.engine,0)')
    game.screenshot(path=str(OUT / 'stage-20-debug.png'))
    check('Stage 20 starts with its intended party and entry XP', game.evaluate('''() => {
      const a=HonroApp,b=a.engine.b,party=HonroStageRules.stageParty(20);
      const floor=HonroProgression.xpAt(HonroProgression.plan(20).entryLevel);
      return b.honroStage===20 && party.every(cls=>b.units.some(u=>u.side===0&&u.cls===cls)) &&
        party.every(cls=>b.heroes[cls].xp>=floor) && !!document.querySelector('.battle-title-row .debug-badge');
    }'''))
    game.evaluate('''() => {
      const a=HonroApp,b=a.engine.b;b.phase='won';a.outcome(true);
      if(!a.profile.cleared[20])throw Error('Debug victory was not processed');
      a.persist();
    }''')
    check('Debug victory and reward do not alter normal storage', game.evaluate('''before => {
      const p=JSON.parse(localStorage.getItem('honro-first-act-profile-1'));
      return !p.cleared[20] && p.honroBattle.honroStage===before.battle &&
        p.heroes.archer.xp===before.xp && JSON.stringify(p.record)===JSON.stringify(before.record);
    }''', original))
    game.click('.result [data-action="retry"]')
    dismiss(game)
    check('Debug retry stays in stage 20 without touching normal save', game.evaluate('''() =>
      HonroApp.engine.b.honroStage===20 && !JSON.parse(localStorage.getItem('honro-first-act-profile-1')).cleared[20]'''))

    game.reload()
    game.wait_for_function('window.HonroApp')
    game.evaluate('HonroApp.frame=()=>{}')
    check('Reload keeps debug setting but discards debug battle and clears', game.evaluate('''() =>
      HonroApp.debugMode && !HonroApp.profile.honroBattle &&
      Object.keys(HonroApp.profile.cleared).length===0 && HonroApp.normalProfile.honroBattle.honroStage===1'''))
    game.click('.title-actions [data-action="map"]')
    dismiss(game)
    check('Every stage can start in debug after reload', game.evaluate('''() => {
      const a=HonroApp;
      for(let id=1;id<=20;id++){
        a.launch(id);
        while(a.dialogue)HonroStory.finish(a);
        if(a.engine?.b.honroStage!==id)return false;
      }
      return true;
    }'''))
    game.click('[data-action="pause"]')
    game.click('.pause-menu [data-action="settings"]')
    game.locator('#debug-mode-setting').evaluate('(node) => node.click()')
    dismiss(game)
    check('Disabling debug restores locked normal journey and original battle', game.evaluate('''() =>
      !HonroApp.debugMode && !HonroApp.isOpen(HONRO_CONTENT.stages[19]) &&
      HonroApp.profile.honroBattle.honroStage===1 &&
      JSON.parse(localStorage.getItem('honro-first-act-profile-1')).settings.debugMode===false'''))
    game.click('.map-screen [data-action="title"]')
    game.click('.title-actions [data-action="continue"]')
    check('Normal continue resumes its original stage', game.evaluate('HonroApp.engine.b.honroStage===1'))

    editor = browser.new_page(viewport={'width': 1440, 'height': 900})
    editor.on('pageerror', lambda error: errors.append(str(error)))
    editor.goto((ROOT / 'HONRO_WORKSHOP.html').as_uri())
    editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    editor.click('[data-tab="play"]')
    editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
    play = editor.frames[1]
    play.evaluate('HonroApp.settings()')
    check('Workshop Playtest stays isolated from the campaign debug switch', play.locator('#debug-mode-setting').count() == 0)
    check('No browser exceptions', not errors)
    browser.close()
