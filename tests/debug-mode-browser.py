"""Real navigation in both bundles; QA terminal states are explicit fixtures.
Does not claim a normal-play campaign clear, and uses only fresh test storage.
"""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
OUT = ROOT / '_local/reports/debug-mode'
OUT.mkdir(parents=True, exist_ok=True)
checks = []

def check(label, condition):
    assert condition, label
    checks.append(label)
    print('PASS', label, flush=True)

def dismiss(page):
    for _ in range(30):
        button = page.locator('[data-action="dialogue-skip"]')
        if not button.count():
            return
        button.click()
    raise AssertionError('Dialogue did not reach its boundary')

def book(page, stage):
    if page.evaluate('HonroApp.screen') == 'battle':
        page.click('[data-action="pause"]')
        page.click('.pause-menu [data-action="map"]')
    elif page.evaluate('HonroApp.screen') == 'rest':
        dismiss(page)
        page.click('[data-action="journey-book"]')
    layer = page.evaluate('(id)=>HonroJourneyContent.at(id).layer', stage)
    page.click(f'[data-action="journey-layer"][data-layer="{layer}"]')
    page.click(f'[data-action="journey-select"][data-id="{stage}"]')

def start_selected(page):
    page.locator('.journey-detail button').click()
    if page.locator('[data-action="confirm-journey-launch"]').count():
        page.click('[data-action="confirm-journey-launch"]')
    dismiss(page)

with sync_playwright() as playwright:
    browser = launch(playwright)
    context = browser.new_context(viewport={'width': 1440, 'height': 900})
    errors = []
    game = context.new_page()
    game.on('pageerror', lambda error: errors.append(str(error)))
    game.goto((ROOT / 'HONRO.html').as_uri())
    game.wait_for_function('window.HonroApp')
    game.evaluate('HonroApp.frame=()=>{}')
    game.click('.title-actions [data-action="rest"]')
    dismiss(game)
    game.click('[data-action="journey-enter"][data-id="1"]')
    dismiss(game)
    game.evaluate('HonroApp.engine.active.hp-=17;HonroApp.engine.b.round=7')
    game.click('[data-action="pause"]')
    game.click('.pause-menu [data-action="settings"]')
    game.screenshot(path=str(OUT / 'settings-before.png'))
    game.locator('#debug-mode-setting').check()
    dismiss(game)
    original = game.evaluate('JSON.parse(localStorage.getItem("honro-first-act-profile-1"))')
    check('Debug opens the same rest screen and keeps an independent copy of the saved battle', game.evaluate('''() =>
      HonroApp.debugMode && HonroApp.screen==='rest' &&
      HonroApp.profile!==HonroApp.normalProfile && HonroApp.profile.honroBattle.honroStage===1 &&
      HonroApp.profile.honroBattle.round===7 && !window.HonroJourney'''))
    game.screenshot(path=str(OUT / 'debug-rest.png'))
    game.click('[data-action="journey-book"]')
    seen = set()
    for layer in ['surface', 'underground', 'city']:
        game.click(f'[data-action="journey-layer"][data-layer="{layer}"]')
        seen.update(game.locator('[data-action="journey-select"]').evaluate_all('(nodes)=>nodes.map(n=>Number(n.dataset.id)).filter(Number.isFinite)'))
        check(f'{layer} uses the shared journey book and unlocks every chapter pin', game.locator('.journey-screen').count() == 1 and game.locator('.journey-pin.unreached').count() == 0)
        game.screenshot(path=str(OUT / f'debug-book-{layer}.png'))
    check('Exactly 30 real chapter destinations are listed across the three layers', seen == set(range(1, 31)))
    book(game, 30)
    game.click('.journey-detail [data-action="journey-enter"]')
    check('Changing chapter uses the real saved-battle replacement confirmation', game.locator('.journey-confirm').count() == 1)
    game.click('[data-action="cancel-journey-launch"]')
    check('Cancel leaves the original battle intact in both snapshots', game.evaluate('HonroApp.profile.honroBattle.honroStage===1 && HonroApp.normalProfile.honroBattle.honroStage===1'))
    start_selected(game)
    check('Stage 30 uses campaign rules with no debug XP or skill grant', game.evaluate('''() => {
      const a=HonroApp,b=a.engine.b;
      return b.honroStage===30 && b.mode==='campaign' && !a.training &&
        JSON.stringify(b.heroes.archer)===JSON.stringify(a.normalProfile.heroes.archer) &&
        JSON.stringify(b.units.filter(u=>u.side===0&&!u.summoned).map(u=>u.cls).sort())===JSON.stringify(HonroStageRules.stageParty(30).sort());
    }'''))
    game.evaluate('HonroApp.scene.render(HonroApp.engine,0)')
    game.screenshot(path=str(OUT / 'stage-30-debug.png'))
    game.evaluate('HonroApp.engine.b.phase="lost";HonroApp.outcome(true)')
    game.click('.result [data-action="retry"]')
    dismiss(game)
    check('Defeat and retry stay on the selected real chapter', game.evaluate('HonroApp.engine.b.honroStage===30 && !HonroApp.done'))
    game.evaluate('HonroApp.engine.b.phase="won";HonroApp.outcome(true)')
    check('Fixture victory writes only QA progression', game.evaluate('!!HonroApp.profile.cleared[30] && !HonroApp.normalProfile.cleared[30]'))
    check('QA loss, retry, victory and rewards leave normal storage byte-for-byte unchanged', game.evaluate('(before)=>JSON.stringify(JSON.parse(localStorage.getItem("honro-first-act-profile-1")))===JSON.stringify(before)', original))
    game.click('[data-action="result-continue"]')
    dismiss(game)
    check('Finishing a selected chapter returns through the normal rest route', game.evaluate('HonroApp.screen==="rest"'))
    game.reload()
    game.wait_for_function('window.HonroApp')
    game.evaluate('HonroApp.frame=()=>{}')
    check('Reload resets the QA clone to the original battle and keeps the debug switch', game.evaluate('''() =>
      HonroApp.debugMode && HonroApp.profile.honroBattle.honroStage===1 &&
      HonroApp.profile.honroBattle.round===7 && !HonroApp.profile.cleared[30]'''))
    game.click('.title-actions [data-action="continue"]')
    dismiss(game)
    for stage in range(1, 31):
        book(game, stage)
        start_selected(game)
        check(f'Chapter {stage} enters from shared book controls', game.evaluate(f'HonroApp.engine?.b.honroStage==={stage}'))
    game.click('[data-action="pause"]')
    game.click('.pause-menu [data-action="settings"]')
    game.locator('#debug-mode-setting').uncheck()
    dismiss(game)
    check('Disabling debug restores normal locks and its exact saved battle', game.evaluate('''before => {
      const a=HonroApp;return !a.debugMode&&!a.isOpen(HONRO_CONTENT.stages[29])&&
        JSON.stringify(a.profile.honroBattle)===JSON.stringify(before.honroBattle);
    }''', original))
    game.click('[data-action="continue"]')
    dismiss(game)
    check('Normal Continue resumes the original damaged unit and round', game.evaluate('HonroApp.engine.b.honroStage===1 && HonroApp.engine.b.round===7 && HonroApp.engine.active.hp<HonroApp.engine.active.maxHp'))

    editor = browser.new_page(viewport={'width': 1440, 'height': 900})
    editor.on('pageerror', lambda error: errors.append(str(error)))
    editor.goto((ROOT / 'HONRO_WORKSHOP.html').as_uri())
    editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    editor.click('[data-tab="play"]')
    editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
    play = editor.frames[1]
    play.evaluate('HonroApp.settings()')
    check('Workshop Playtest stays isolated without a campaign debug toggle', play.locator('#debug-mode-setting').count() == 0)
    check('No browser exceptions', not errors)
    (OUT / 'summary.json').write_text(json.dumps({'status': 'passed', 'checks': checks, 'errors': errors, 'limits': ['The animation loop was frozen for deterministic navigation.', 'Victory and defeat are explicit terminal-state fixtures, not combat clears.', 'Only a fresh isolated browser context was used.']}, ensure_ascii=False, indent=2), encoding='utf8')
    browser.close()
