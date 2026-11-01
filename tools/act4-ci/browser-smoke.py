"""CI capability smoke, not Act4 acceptance. Uses only normal UI inputs.

Fresh isolated context; no fixture, storage injection, direct App launch or live
state mutation. HONRO_QA_URL is the complete HTTP URL of HONRO.html.
"""
import json
import os
import time
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(os.environ.get('HONRO_QA_OUT', '_local/reports/github-qa'))
out.mkdir(parents=True, exist_ok=True)
result = {'scope': 'fresh canonical title -> official stage-1 entry UI',
          'sourceCommit': os.environ.get('GITHUB_SHA'), 'releaseApproved': False,
          'buildOutcome': os.environ.get('HONRO_BUILD_OUTCOME'),
          'passed': False, 'pageErrors': [], 'httpErrors': [], 'inputs': []}
browser = page = None
try:
    with sync_playwright() as playwright:
        try:
            browser = playwright.chromium.launch(headless=True)
            result['browserVersion'] = browser.version
            context = browser.new_context(viewport={'width': 1440, 'height': 900})
            page = context.new_page()
            page.on('pageerror', lambda error: result['pageErrors'].append(str(error)))
            page.on('response', lambda response: result['httpErrors'].append(
                {'status': response.status, 'url': response.url}) if response.status >= 400 else None)
            page.goto(os.environ.get('HONRO_QA_URL', 'http://127.0.0.1:8770/HONRO.html'),
                      wait_until='domcontentloaded', timeout=60000)
            page.wait_for_function('window.HonroApp', timeout=60000)
            start = page.get_by_role('button', name='길을 열다', exact=True)
            start.wait_for(state='visible', timeout=60000)
            page.screenshot(path=str(out / 'title.png'))
            start.click()
            result['inputs'].append('click: 길을 열다')
            deadline = time.monotonic() + 90
            while time.monotonic() < deadline:
                if page.evaluate('window.HonroApp?.engine?.b?.honroStage === 1'):
                    break
                next_line = page.locator('[data-action="dialogue-next"]:visible')
                enter = page.locator('[data-action="journey-enter"]:visible')
                if next_line.count() and next_line.first.is_enabled():
                    next_line.first.click()
                    result['inputs'].append('click: dialogue-next')
                elif not page.evaluate('!!window.HonroApp?.dialogue') and enter.count():
                    enter.first.click()
                    result['inputs'].append('click: journey-enter')
                page.wait_for_timeout(500)
            page.wait_for_function('window.HonroApp?.engine?.b?.honroStage === 1', timeout=1000)
            page.locator('#battlecanvas').wait_for(state='visible', timeout=30000)
            page.wait_for_timeout(1000)
            result['observed'] = page.evaluate('''() => ({screen: HonroApp.screen,
              stage: HonroApp.engine.b.honroStage, round: HonroApp.engine.b.round,
              dialogue: !!HonroApp.dialogue, canvasWidth: document.querySelector('#battlecanvas').width,
              canvasHeight: document.querySelector('#battlecanvas').height})''')
            page.screenshot(path=str(out / 'stage1-entry.png'))
            assert result['observed']['canvasWidth'] > 0 and result['observed']['canvasHeight'] > 0
            assert not result['pageErrors'], result['pageErrors']
            assert not result['httpErrors'], result['httpErrors']
            result['passed'] = True
        except Exception:
            if page is not None:
                try:
                    page.screenshot(path=str(out / 'failure.png'))
                except Exception as screenshot_error:
                    result['screenshotError'] = str(screenshot_error)
            raise
        finally:
            if browser is not None:
                browser.close()
except Exception:
    result['error'] = traceback.format_exc()
finally:
    (out / 'browser.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False), flush=True)
if not result['passed']:
    raise SystemExit(1)
