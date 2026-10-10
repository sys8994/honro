"""Real generated Workshop: narrow desktop resize, dialogue, Stop/reopen, and Game parity.

No device emulation, style injection, gameplay cheats, or replacement iframe.
Run sequentially with other browser/performance checks idle.
"""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT = ROOT / '_local/reports/workshop-responsive'
OUT.mkdir(parents=True, exist_ok=True)
checks = []


def check(name, ok, detail=None):
    assert ok, (name, detail)
    checks.append({'name': name, 'detail': detail})
    print('PASS', name, flush=True)


def bounds(page, selector, name):
    result = page.locator(selector).evaluate('''e=>{
      const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,
      right:r.right,bottom:r.bottom,vw:innerWidth,vh:innerHeight};}''')
    check(name, result['w'] > 0 and result['h'] > 0 and result['x'] >= -1 and
          result['y'] >= -1 and result['right'] <= result['vw'] + 1 and
          result['bottom'] <= result['vh'] + 1, result)
    return result


def ready_frame(editor):
    editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine?.b')
    frame = editor.locator('#runtimeFrame').element_handle().content_frame()
    frame.locator('[data-action="dialogue-next"]').wait_for(state='visible')
    return frame


with sync_playwright() as pw:
    browser = launch(pw)
    editor = browser.new_page(viewport={'width': 1440, 'height': 900})
    editor.goto((ROOT / 'HONRO_WORKSHOP.html').as_uri())
    editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    editor.evaluate("HonroWorkshopAPI.selectStage('stage-1')")
    original = editor.evaluate('HonroWorkshopAPI.exportProject()')
    editor.click('[data-tab="play"]')
    ready_frame(editor)

    # Resize the same live iframe both ways, including the published 506px failure.
    for width, height in [(1440, 900), (506, 756), (390, 844), (1440, 900)]:
        editor.set_viewport_size({'width': width, 'height': height})
        editor.wait_for_timeout(250)
        label = f'{width}x{height}'
        for selector in ['.tabs', '#exportBtn', '#playFromStart', '#playFromSelected',
                         '#playFromCamera', '#stopPlay', '#runtimeFrame']:
            bounds(editor, selector, f'{label} {selector}')
        host = bounds(editor, '#runtimeFrame', f'{label} iframe bounds')
        check(f'{label} iframe matches viewport width', abs(host['w'] - width) <= 1, host)
        frame = ready_frame(editor)
        bounds(frame, '#battlecanvas', f'{label} embedded canvas')
        bounds(frame, '[data-action="dialogue-next"]', f'{label} dialogue next')
        bounds(frame, '#story-line', f'{label} dialogue text')
        controls = editor.locator('.play-controls').bounding_box()
        check(f'{label} controls do not overlap iframe',
              controls['y'] + controls['height'] <= host['y'] + 1, controls)
        frame.click('[data-action="dialogue-next"]')
        editor.screenshot(path=str(OUT / f'playtest-{label}.png'))
        editor.click('#stopPlay')
        check(f'{label} Stop removes iframe', editor.locator('#runtimeFrame').count() == 0)
        bounds(editor, '#stageCanvas', f'{label} restored Stage canvas')
        check(f'{label} project unchanged', editor.evaluate('HonroWorkshopAPI.exportProject()') == original)
        editor.click('[data-tab="play"]')
        ready_frame(editor)
        check(f'{label} reopen creates exactly one iframe', editor.locator('#runtimeFrame').count() == 1)
    editor.click('[data-tab="stage"]')
    check('Stage tab also disposes Playtest', editor.locator('#runtimeFrame').count() == 0)
    editor.close()

    # Use the same public launchMap entry point in the standalone Game.
    game = browser.new_page(viewport={'width': 1440, 'height': 900})
    game.goto((ROOT / 'HONRO.html').as_uri())
    game.wait_for_function('window.HonroApp')
    game.evaluate("HonroApp.launchMap(HONRO_PROJECT,'stage-1')")
    game.locator('[data-action="dialogue-next"]').wait_for(state='visible')
    for width, height in [(1440, 900), (506, 756)]:
        game.set_viewport_size({'width': width, 'height': height})
        game.wait_for_timeout(250)
        bounds(game, '#battlecanvas', f'Game {width} canvas')
        bounds(game, '[data-action="dialogue-next"]', f'Game {width} dialogue next')
        game.screenshot(path=str(OUT / f'game-{width}x{height}.png'))
    browser.close()

(OUT / 'summary.json').write_text(json.dumps({'checks': checks}, indent=2), encoding='utf8')
