"""Real Chromium decode races/failures using byte-identical fresh act1 portrait.
No normal-combat claim; screenshots are runtime evidence only.
"""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
from story_browser_server import story_base_url

OUT = ROOT / 'game/docs/stage-review/fresh-responsive-art-20261022/evidence/races'
OUT.mkdir(parents=True, exist_ok=True)
rows = []
with sync_playwright() as p:
    browser = launch(p)
    page = browser.new_page(viewport={'width':844,'height':390})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(story_base_url()+'/HONRO.html')
    page.wait_for_function('!!globalThis.HonroApp', timeout=120000)
    page.evaluate('''()=>{const a=HonroApp;a.stopBattle();a.close();a.profile.cleared[10]={visits:1,rounds:6};delete a.profile.seen['act-ending-v1:10'];a.profile.honroActEnding={stage:10,index:0};window.originalLandscape=HONRO_ACT_ENDINGS[10].image;window.originalPortrait=HONRO_ACT_ENDINGS[10].portraitImage;HonroActEndings.show(a)}''')
    page.wait_for_function('document.querySelector("#act-ending").dataset.art==="landscape"')
    saved = page.evaluate('JSON.stringify(HonroApp.profile)')
    held = []
    page.route(page.evaluate('originalPortrait'), lambda route: held.append(route))
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_timeout(200)
    assert len(held)==1
    box = page.locator('.act-ending-art').bounding_box()
    assert box == {'x':0,'y':0,'width':390,'height':844}
    page.screenshot(type='jpeg', quality=85, path=str(OUT/'delayed-keeps-reserved-surface.jpg'))
    page.set_viewport_size({'width':844,'height':390})
    held[0].fulfill(path=str(ROOT/'shared/assets/endings/act-1-portrait.webp'), content_type='image/webp')
    page.wait_for_timeout(250)
    assert page.locator('#act-ending').get_attribute('data-art')=='landscape', 'stale portrait replaced landscape'
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_function('document.querySelector("#act-ending").dataset.art==="portrait"')
    assert len(held)==1, 'cached decoded portrait fetched again'
    assert page.locator('.act-ending-art').bounding_box()==box
    assert page.evaluate('JSON.stringify(HonroApp.profile)')==saved
    page.screenshot(type='jpeg', quality=85, path=str(OUT/'cached-portrait-after-race.jpg'))
    rows.append('delayed old orientation ignored; decoded cache reused; fixed image box; exact profile unchanged')
    page.route('**/__broken/*.webp', lambda route: route.fulfill(status=404))
    page.evaluate("HONRO_ACT_ENDINGS[10].portraitImage='/__broken/portrait.webp';HonroActEndings.show(HonroApp)")
    page.wait_for_function('document.querySelector("#act-ending").dataset.art==="landscape"')
    assert page.locator('.act-ending-art').is_visible()
    page.wait_for_timeout(220)
    page.screenshot(type='jpeg', quality=85, path=str(OUT/'failed-portrait-falls-back.jpg'))
    page.evaluate("HONRO_ACT_ENDINGS[10].image='/__broken/landscape.webp';HonroActEndings.show(HonroApp)")
    page.wait_for_function('document.querySelector(".act-ending-art").hidden')
    assert page.locator('.act-ending-copy').is_visible()
    page.wait_for_timeout(220)
    page.screenshot(type='jpeg', quality=85, path=str(OUT/'both-failed-readable-copy.jpg'))
    page.evaluate('HONRO_ACT_ENDINGS[10].image=originalLandscape;HONRO_ACT_ENDINGS[10].portraitImage=null;HonroActEndings.show(HonroApp)')
    page.wait_for_function('!document.querySelector(".act-ending-art").hidden')
    rows.append('portrait HTTP 404 -> landscape; both HTTP 404 -> readable dark surface; next valid image recovers')
    # Leave the ending while an image is outstanding. Completion must not put it back.
    held.clear()
    page.route('**/__delayed/leave.webp', lambda route: held.append(route))
    page.evaluate("HONRO_ACT_ENDINGS[10].portraitImage='/__delayed/leave.webp';HonroActEndings.show(HonroApp)")
    page.wait_for_timeout(150)
    assert len(held)==1
    page.evaluate('HonroApp.showTitle()')
    held[0].fulfill(path=str(ROOT/'shared/assets/endings/act-1-portrait.webp'), content_type='image/webp')
    page.wait_for_timeout(200)
    assert page.locator('#act-ending').count()==0 and page.locator('.honro-title').is_visible()
    assert page.evaluate('JSON.stringify(HonroApp.profile)')==saved
    rows.append('late completion after leaving ending cannot replace title or change profile')
    assert not errors, errors
    browser.close()
(OUT/'checks.json').write_text(json.dumps({'passed':rows,'errors':errors,'scope':'Actual fresh act1 bytes; intentional HTTP 404 and delayed-response injection only; not normal combat or parent art approval'},ensure_ascii=False,indent=2))
print('PASS delayed decode/orientation/exit races, failure fallbacks, cache and exact profile preservation')
