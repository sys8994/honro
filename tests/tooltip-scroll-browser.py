"""One stationary-pointer scroll regression; no broader UI suite."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
out=ROOT/'_local/reports/tooltip-lifecycle';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw,serve_game() as base:
    browser=launch(pw)
    page=browser.new_page(viewport={'width':360,'height':320})
    page.goto(base+'/HONRO.html')
    page.wait_for_function('window.HonroApp')
    page.evaluate('HonroApp.startTraining()')
    page.wait_for_selector('.training-dialog')
    page.evaluate('HonroApp.close();HonroApp.pause();HonroApp.settings()')
    page.wait_for_function('document.fonts.status==="loaded"')
    owner=page.locator('[data-action=settings-page][data-id=sound]')
    owner.hover()
    page.wait_for_selector('#honro-tooltip')
    before=owner.bounding_box()
    page.evaluate('window.scrollPointerMoves=0;document.addEventListener("pointermove",()=>scrollPointerMoves++)')
    page.mouse.wheel(0,140)
    page.wait_for_function('document.querySelector(".menu-body").scrollTop>0')
    page.wait_for_timeout(100)
    after=owner.bounding_box()
    data={'before':before,'after':after,'scrollTop':page.locator('.menu-body').evaluate('e=>e.scrollTop'),
          'pointerMoves':page.evaluate('scrollPointerMoves'),'tooltips':page.locator('#honro-tooltip').count()}
    assert after['y']<before['y'] and data['pointerMoves']==0 and data['tooltips']==0,data
    browser.close()
(out/'stationary-pointer-scroll.json').write_text(json.dumps(data,indent=2)+'\n')
print('PASS actual wheel scroll moves owner away from stationary pointer and dismisses tooltip',json.dumps(data))
