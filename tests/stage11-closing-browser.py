"""Built-game regression from a prepared final-objective save, with real UI input.

Generate the save with stage11-automatic-objective-completion.mjs and set
HONRO_STAGE11_CLOSING_FIXTURE for both commands to use a different path.
"""
import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

from browser_support import launch
from story_browser_server import story_base_url

fixture = Path(os.environ.get('HONRO_STAGE11_CLOSING_FIXTURE', '_local/reports/stage11-closing-fixture.json'))
key = 'honro-first-act-profile-1'
base = story_base_url()
with sync_playwright() as pw:
    browser = launch(pw)
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base + '/HONRO.html', wait_until='domcontentloaded')
    page.wait_for_function('!!globalThis.HonroApp', timeout=60000)
    page.evaluate('([key, save]) => localStorage.setItem(key, save)', [key, fixture.read_text(encoding='utf-8')])
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('!!globalThis.HonroApp', timeout=60000)
    page.locator('[data-action="continue"]').first.click(timeout=20000)
    page.wait_for_function('HonroApp.dialogue?.reviewedEvent === "gather"', timeout=20000)
    page.evaluate('''() => {
        window.closingDialogs = [];
        const host = document.getElementById('dialogue-root');
        new MutationObserver(() => {
            if (HonroApp.dialogue?.reviewedEvent) closingDialogs.push(HonroApp.dialogue.reviewedEvent);
        }).observe(host, {childList: true, subtree: true});
    }''')
    page.locator('[data-action="dialogue-skip"]').click()
    page.locator('.result-title').get_by_text('길이 열렸다').wait_for(timeout=20000)
    assert page.evaluate('closingDialogs') == []
    saved = json.loads(page.evaluate('key => localStorage.getItem(key)', key))
    assert saved['cleared']['11']['visits'] == 1 and saved['honroBattle'] is None
    page.locator('[data-action="result-continue"]').click()
    page.wait_for_function('HonroApp.screen === "rest" && !HonroApp.engine', timeout=20000)
    assert not errors, errors
    print('PASS: Chromium, continued pre-victory save, one Skip, result, saved clear, next rest')
    ctx.close()
