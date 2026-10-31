"""Real stage-40 saved-battle regression; requires the assembled QA server.

Use HONRO_QA_URL and an isolated build. The fixture is an actual stalled save;
only camera wheel and dialogue keys are used after Continue. CPU throttle is a
stress diagnostic, not a claim about normal frame rate or a full mission run.
"""
import hashlib
import json
import lzma
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[2]
raw = lzma.decompress((root / 'tools/act4-rc/fixtures/stage40-checkpoints/stalled-local-storage.json.xz').read_bytes())
assert hashlib.sha256(raw).hexdigest() == 'ac743e5d94dfac682e39964b27cf82d9b803bae95b3937cf33a0bebf25658494'
url = os.environ.get('HONRO_QA_URL', 'http://127.0.0.1:8774')
with sync_playwright() as w:
    browser = w.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.add_init_script('localStorage.setItem("honro-first-act-profile-1",' + json.dumps(raw.decode()) + ')')
    page.goto(url + '/HONRO.html')
    page.wait_for_function('window.HonroApp')
    page.get_by_text('이어서 걷기', exact=True).click()
    page.wait_for_function('HonroApp.engine?.b?.honroStage===40', timeout=60000)
    page.mouse.move(700, 400)
    page.mouse.wheel(0, 600)
    page.wait_for_function("HonroApp.engine.b.honroAct4PreviewState?.reader?.key==='reunion'", timeout=120000)
    page.wait_for_function("HonroApp.engine.b.honroAct4PreviewState.receipts.includes('A4.S40.REUNION.01')", timeout=60000)
    page.locator('[data-action="dialogue-skip"]').click()
    page.wait_for_function("HonroApp.engine.b.honroAct4PreviewState.events.reunion.terminal===true", timeout=60000)
    final = page.evaluate("HonroApp.engine.b.honroAct4PreviewState.events.reunion")
    assert final['presented'] == ['A4.S40.REUNION.01'] and final['retired'] == ['A4.S40.REUNION.02'], final
    print(json.dumps({'scope': 'actual 40 saved battle, explicit UI skip', 'reunion': final}, ensure_ascii=False))
    browser.close()
