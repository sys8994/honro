"""Final merged-build evidence, reusing the approved arena and rest-hub harness.
Actual Chromium pixels/inputs; controlled arena and fixture campaign progress.
No historical module overrides, normal campaign completion, or device claim.
"""
import ast
import hashlib
import json
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game

OUT = ROOT / 'game/docs/cheonroe-rich-effects-restoration/integration-evidence'
OUT.mkdir(parents=True, exist_ok=True)

def literals(path):
    tree = ast.parse(path.read_text())
    return {n.targets[0].id: n.value.value for n in tree.body
            if isinstance(n, ast.Assign) and isinstance(n.targets[0], ast.Name)
            and isinstance(n.value, ast.Constant)}

arena = literals(ROOT / 'tests/cheonroe-target-lightning-browser.py')
rich = literals(ROOT / 'tests/cheonroe-rich-effects-browser.py')
# Reuse existing profile setup and dialogue helper without executing its test loop.
rest_tree = ast.parse((ROOT / 'tests/rest-hub-journey-browser.py').read_text())
rest = literals(ROOT / 'tests/rest-hub-journey-browser.py')
exec(compile(ast.Module(body=[n for n in rest_tree.body
     if isinstance(n, ast.FunctionDef) and n.name in ('setup', 'inside')],
     type_ignores=[]), '<existing rest-hub helpers>', 'exec'), rest)

rows = []
errors = []
screenshots = []
def shot(page, name):
    file = OUT / (name + '.jpg')
    page.screenshot(path=str(file), type='jpeg', quality=85)
    data = file.read_bytes()
    assert len(data) < 1_000_000
    screenshots.append({'path': str(file.relative_to(ROOT)), 'bytes': len(data),
                        'sha256': hashlib.sha256(data).hexdigest()})

with sync_playwright() as pw, serve_game() as base:
    browser = launch(pw)
    for width, height, count, zoom in [(390, 844, 1, .75),
                                      (390, 844, 10, .75),
                                      (1280, 900, 10, 1.0)]:
        page = browser.new_page(viewport={'width': width, 'height': height},
                                device_scale_factor=1, has_touch=True)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base + '/HONRO.html')
        page.wait_for_function('window.HonroApp && window.HONRO_CORE')
        page.evaluate("HonroOptionalRuntime.load('training')")
        page.add_script_tag(content=(ROOT / 'tests/cheonroe-fixture.mjs').read_text()
                            .replace('export function', 'function'))
        opts = {'count': count, 'zoom': zoom, 'cameraX': 1000, 'cameraY': 760,
                'variant': 'restored-rich', 'spacing': 38,
                'label': f'MERGED BUILD | {count} targets | controlled arena (not campaign)'}
        page.evaluate(arena['SETUP'], opts)
        page.evaluate(rich['CONFIG'], opts)
        heads = page.evaluate('fixture.b.units.slice(1).map(u=>HonroMonsterVisual.headPoint(u))')
        page.evaluate(rich['STRIKE'])
        snap = page.evaluate(arena['SNAP'])
        assert len(snap['bolts']) == count == len(snap['hits']) == snap['liveRays']
        assert len({hit['id'] for hit in snap['hits']}) == count
        for ray, head in zip(snap['bolts'], heads):
            assert abs(ray['x2'] - head['x']) < 1e-6
            assert abs(ray['y2'] - head['y']) < 1e-6
            assert ray['size'] == 3.5
        shot(page, f'final-{width}x{height}-{count}-controlled-arena')
        page.evaluate('renderFrame(1.05)')
        assert page.evaluate('HonroApp.scene.arcFx.fxs.filter(f=>f.kind==="lightningBolt").length') == 0
        rows.append({'viewport': [width, height], 'scope': 'approved controlled arena', **snap})
        page.close()

    for width, height in [(390, 844), (1280, 900)]:
        page = browser.new_page(viewport={'width': width, 'height': height}, has_touch=True)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base + '/HONRO.html')
        page.wait_for_function('!!globalThis.HonroApp', timeout=120000)
        rest['setup'](page)
        if width == 390:
            shot(page, 'final-390x844-flow-rest')
        page.locator('[data-action="journey-book"]').click()
        assert page.locator('[data-action="journey-act"][data-id="2"]').is_disabled()
        pin = page.locator('[data-action="journey-select"][data-id="5"]')
        pin.scroll_into_view_if_needed()
        pin.click()
        assert page.locator('[data-action="journey-travel"]').inner_text() == '휴식터로 진입'
        if width == 390:
            shot(page, 'final-390x844-flow-journal')
        page.locator('[data-action="journey-travel"]').click()
        page.wait_for_function('HonroApp.screen==="rest"')
        page.evaluate(rest['FINISH'])
        page.wait_for_timeout(450)
        page.locator('[data-action="journey-enter"]').click()
        page.wait_for_function('HonroApp.screen==="battle"')
        page.evaluate(rest['FINISH'])
        assert page.evaluate('HonroApp.engine.b.honroStage===5&&HonroApp.engine.b.round===1')
        # Let the production entry camera and turn banner settle before capture.
        page.wait_for_timeout(2200)
        if width == 390:
            shot(page, 'final-390x844-flow-battle')
        page.evaluate('HonroApp.pause()')
        before = page.evaluate('JSON.stringify(HonroApp.engine.b)')
        page.locator('.pause-menu [data-action="rest"]').click()
        assert rest['inside'](page, '.journey-confirm')
        assert page.evaluate('JSON.stringify(HonroApp.engine.b)') == before
        if width == 390:
            shot(page, 'final-390x844-flow-confirmation')
        session = page.evaluate('HonroApp.engine.b.session')
        page.locator('[data-action="cancel-journey-launch"]').click()
        # Cancel resumes the normal RAF: transient animation clocks can advance.
        # Exact paused/save preservation is covered by the existing hub suite.
        assert page.evaluate('HonroApp.engine.b.session') == session
        assert page.evaluate('HonroApp.engine.b.honroStage===5&&HonroApp.engine.b.round===1')
        page.evaluate('HonroApp.pause()')
        page.locator('.pause-menu [data-action="rest"]').click()
        page.locator('[data-action="confirm-journey-launch"]').click()
        page.wait_for_function('HonroApp.screen==="rest"')
        assert page.evaluate('HonroApp.engine===null&&HonroApp.profile.honroBattle===null')
        rows.append({'viewport': [width, height], 'scope': 'public UI input flow on fixture progress',
                     'flow': 'rest → journal → rest → battle → confirmation/cancel/confirm',
                     'actGate': True, 'newBattleRound': 1})
        page.close()
    version = browser.version
    browser.close()
assert not errors, errors
(OUT / 'browser-results.json').write_text(json.dumps({
    'status': 'passed', 'candidateSourceCommit': subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'], text=True).strip(),
    'browser': version, 'rows': rows, 'pageErrors': errors, 'screenshots': screenshots,
    'limits': ['Actual desktop Chromium at mobile and desktop viewports; no physical device.',
               'VFX uses the original controlled-arena harness, no module override.',
               'Navigation uses fixture progress and actual clicks, not normal stage completion.']
}, ensure_ascii=False, indent=2) + '\n')
print('PASS final merged build: three VFX captures, mobile/desktop rest/journal/battle/confirmation; seven JPGs <1MB, no page errors')
