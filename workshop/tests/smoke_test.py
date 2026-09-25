from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'HONRO_MAP_WORKSHOP.html').read_text(encoding='utf-8')
PACK=str(ROOT/'examples/RC20_STAGE_1_4_STAGE_PACK.json')

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content(HTML, wait_until='load')
    page.wait_for_timeout(250)
    assert page.evaluate('typeof window.HonroWorkshopAPI') == 'object'
    assert page.locator('.asset-card').count() >= 12
    assert page.evaluate('HonroWorkshopAPI.validate()[0].level') == 'ok'
    page.set_input_files('#fileInput', PACK)
    page.wait_for_timeout(250)
    assert page.locator('.stage-card').count() == 5
    before=page.evaluate('HonroWorkshopAPI.getContext().counts.elements')
    page.evaluate('HonroWorkshopAPI.applyCommands([{op:"element.place",assetId:"rock_large",x:1600,layer:"interactive"}])')
    after=page.evaluate('HonroWorkshopAPI.getContext().counts.elements')
    assert after == before + 1
    spec=page.evaluate('HonroWorkshopAPI.exportHonroSpec()')
    assert len(spec['grounds'][0]['top']) >= 100
    assert not errors, errors
    browser.close()
print('HONRO Workshop smoke test: PASS')
