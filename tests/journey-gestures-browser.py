"""Real wheel, drag and multi-touch on the shared journey book; isolated saves."""
import json
import os
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game

BASE = os.environ.get('HONRO_BASE_URL', '')
OUT = ROOT / '_local/reports' / ('journey-gestures-public' if BASE else 'journey-gestures')
OUT.mkdir(parents=True, exist_ok=True)
checks, errors = [], []


def url(name):
    return BASE.rstrip('/') + '/' + name if BASE else (ROOT / name).as_uri()


def check(name, ok, detail=None):
    assert ok, (name, detail)
    checks.append({'name': name, 'detail': detail})
    print('PASS', name, flush=True)


def setup(host):
    host.evaluate('''async()=>{
      await globalThis.HonroCampaignLoader?.ensureStage(21);
      const a=HonroApp;a.stopBattle();a.frame=()=>{};a.profile=HONRO_TOOLS.fresh();a.debugMode=false;
      a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();
      a.profile.recruited=['archer','mage','knight','occultist'];
      for(let i=1;i<=20;i++)a.profile.cleared[i]={visits:1,rounds:8};
      a.launch(21);for(let i=0;a.dialogue&&i<80;i++)HonroStory.finish(a);
      a.engine.active.hp-=11;a.engine.b.round=4;
      // A preexisting suspended campaign is an inert setup fixture. Navigation
      // is tested below without approving its replacement or resuming it.
      a.stopBattle();a.screen='title';HonroRestJourney.showBook(a,21,'city');
      window.journeySaved=JSON.stringify(a.profile);
    }''')


def zoom(host):
    return host.evaluate('HonroApp.journeyZoom')


def anchor(host, x, y):
    if hasattr(host, 'frame_element'):
        frame = host.frame_element().bounding_box()
        x -= frame['x']; y -= frame['y']
    return host.locator('.journey-map-scroll').evaluate('''(v,p)=>{
      const m=v.querySelector('.journey-map'),r=m.getBoundingClientRect();
      return[(p[0]-r.left)/m.clientWidth,(p[1]-r.top)/m.clientHeight];
    }''', [x, y])


def desktop(host, owner, label):
    setup(host)
    check(label + ': accessible zoom/fit/recenter controls present', host.locator('[data-action=journey-zoom],[data-action=journey-fit],[data-action=journey-center]').count() == 4)
    for act,layer in [(1,'surface'),(2,'cutaway'),(3,'city')]:
        host.locator(f'[data-action=journey-act][data-id="{act}"]').click()
        host.evaluate('HonroApp.journeyZoom=1;HonroRestJourney.showBook(HonroApp,HonroApp.journeySelection,null,HonroApp.journeyAct)')
        # Start in the middle of the map, away from scroll limits.
        host.locator('.journey-map-scroll').evaluate('(v)=>{v.scrollLeft=0;v.scrollTop=100;}')
        box = host.locator('.journey-map-scroll').bounding_box()
        x, y = box['x'] + box['width'] * .5, box['y'] + box['height'] * .45
        before = anchor(host, x, y)
        old = zoom(host)
        owner.mouse.move(x, y)
        owner.mouse.wheel(0, -80)
        host.wait_for_timeout(70)
        after = anchor(host, x, y)
        check(f'{label} {layer}: plain wheel zooms at the cursor', zoom(host) > old and max(abs(a-b) for a, b in zip(before, after)) < .004, [old, zoom(host), before, after])
        owner.mouse.wheel(0, -5000); host.wait_for_timeout(70)
        high = zoom(host)
        owner.mouse.wheel(0, 5000);host.wait_for_timeout(70);owner.mouse.wheel(0, 5000);host.wait_for_timeout(70)
        low = zoom(host)
        check(f'{label} {layer}: both zoom bounds', abs(high-1.8) < 1e-9 and abs(low-host.evaluate('(HonroApp.journeyAct===2?460:600)/Number(document.querySelector(".journey-map").dataset.baseWidth)')) < 1e-9, [low, high])
        # Restore enough scale for the next layer's anchor check.
        owner.mouse.wheel(0, -115); host.wait_for_timeout(70)
    host.evaluate('HonroApp.journeyZoom=1.3')
    host.locator('[data-action=journey-act][data-id="1"]').click()
    host.evaluate("HonroRestJourney.selectBook(HonroApp,3)")
    pin = host.locator('[data-action=journey-select][data-id="2"]')
    pin.scroll_into_view_if_needed()
    box = pin.bounding_box()
    x, y = box['x'] + box['width']/2, box['y'] + box['height']/2
    old = host.locator('.journey-map-scroll').evaluate('(v)=>v.scrollTop')
    owner.mouse.move(x, y); owner.mouse.down()
    owner.mouse.move(x-45, y+(55 if old > 25 else -55), steps=8); owner.mouse.up()
    now = host.locator('.journey-map-scroll').evaluate('(v)=>v.scrollTop')
    picked = host.evaluate('HonroApp.journeySelection')
    check(label + ': dragging a pin pans without selecting it', picked == 3 and abs(now-old) > 20, [old, now, picked])
    pin.click()
    check(label + ': next click selects normally', host.evaluate('HonroApp.journeySelection===2') and host.locator('[data-id="2"].journey-pin.selected').count() == 1)
    host.locator('[data-action=journey-select][data-id="3"]').focus()
    host.locator('[data-action=journey-select][data-id="3"]').press('Enter')
    check(label + ': keyboard selection remains usable', host.evaluate('HonroApp.journeySelection===3'))
    old = zoom(host)
    box = host.locator('.journey-heading').bounding_box()
    owner.mouse.move(box['x']+10, box['y']+10); owner.mouse.wheel(0, -100)
    host.wait_for_timeout(70)
    check(label + ': wheel outside the map leaves its zoom unchanged', zoom(host) == old)
    check(label + ': saved battle and progression unchanged', host.evaluate('JSON.stringify(HonroApp.profile)===journeySaved'))
    owner.screenshot(path=str(OUT / (label + '.png')))


def touch_suite(page, width, height):
    label = f'touch-{width}x{height}'
    setup(page)
    page.evaluate("HonroRestJourney.showBook(HonroApp,3,'surface')")
    pin = page.locator('[data-action=journey-select][data-id="2"]')
    pin.scroll_into_view_if_needed()
    box, view = pin.bounding_box(), page.locator('.journey-map-scroll').bounding_box()
    x, y = box['x']+box['width']/2, box['y']+box['height']/2
    # Begin with one finger on an unselected pin; the second starts inside the map.
    direction = 1 if x+90 < view['x']+view['width']-10 else -1
    session = page.context.new_cdp_session(page)
    def points(gap, shift=0):
        return [{'x':x+shift, 'y':y, 'id':1}, {'x':x+direction*gap+shift, 'y':y, 'id':2}]
    session.send('Input.dispatchTouchEvent', {'type':'touchStart', 'touchPoints':points(70)})
    old = zoom(page)
    for gap in [80, 90, 100, 110, 120]:
        session.send('Input.dispatchTouchEvent', {'type':'touchMove', 'touchPoints':points(gap)})
    page.wait_for_timeout(60)
    check(label + ': spread pinch expands at its midpoint', zoom(page) > old and zoom(page) <= 1.8, [old, zoom(page)])
    for gap in [100, 80, 60, 40, 20]:
        session.send('Input.dispatchTouchEvent', {'type':'touchMove', 'touchPoints':points(gap)})
    page.wait_for_timeout(60)
    check(label + ': closing pinch reaches the lower bound', abs(zoom(page)-page.evaluate('600/Number(document.querySelector(".journey-map").dataset.baseWidth)')) < 1e-9, zoom(page))
    horizontal = page.locator('.journey-map-scroll').evaluate('(v)=>v.scrollWidth-v.clientWidth>120')
    axis = 'scrollLeft' if horizontal else 'scrollTop'
    page.locator('.journey-map-scroll').evaluate('(v,axis)=>v[axis]=80', axis)
    shifted = [{'x':p['x']-(25 if horizontal else 0), 'y':p['y']-(0 if horizontal else 25), 'id':p['id']} for p in points(20)]
    session.send('Input.dispatchTouchEvent', {'type':'touchMove', 'touchPoints':shifted})
    page.wait_for_timeout(60)
    now = page.locator('.journey-map-scroll').evaluate('(v,axis)=>v[axis]', axis)
    check(label + ': moving the pinch center also pans at the zoom limit', abs(now-105) < 3 and abs(zoom(page)-page.evaluate('600/Number(document.querySelector(".journey-map").dataset.baseWidth)')) < 1e-9, [axis, now, zoom(page)])
    # Lift only the second finger, then move the first: no re-press.
    session.send('Input.dispatchTouchEvent', {'type':'touchEnd', 'touchPoints':[shifted[1]]})
    old = page.locator('.journey-map-scroll').evaluate('(v,axis)=>v[axis]=80', axis)
    session.send('Input.dispatchTouchEvent', {'type':'touchMove', 'touchPoints':[{'x':shifted[0]['x']-(40 if horizontal else 0), 'y':shifted[0]['y']-(0 if horizontal else 40), 'id':1}]})
    page.wait_for_timeout(60)
    now = page.locator('.journey-map-scroll').evaluate('(v,axis)=>v[axis]', axis)
    check(label + ': one remaining finger continues panning', now-old > 25, [axis, old, now])
    session.send('Input.dispatchTouchEvent', {'type':'touchEnd', 'touchPoints':[]})
    check(label + ': pinch does not choose a place and releases its cursor', page.evaluate('HonroApp.journeySelection===3') and not page.locator('.journey-map-scroll').evaluate('(v)=>v.classList.contains("dragging")'))
    pin.tap()
    check(label + ': next ordinary tap selects its pin', page.evaluate('HonroApp.journeySelection===2'))
    # Cancellation must release capture; the next gesture starts independently.
    view = page.locator('.journey-map-scroll').bounding_box()
    cx, cy = view['x']+view['width']/2, view['y']+view['height']/2
    session.send('Input.dispatchTouchEvent', {'type':'touchStart', 'touchPoints':[{'x':cx,'y':cy,'id':4}]})
    session.send('Input.dispatchTouchEvent', {'type':'touchCancel', 'touchPoints':[]})
    check(label + ': cancellation leaves no dragging state or save changes', not page.locator('.journey-map-scroll').evaluate('(v)=>v.classList.contains("dragging")') and page.evaluate('JSON.stringify(HonroApp.profile)===journeySaved'))
    check(label + ': page itself stays at its original scale', page.evaluate('visualViewport.scale===1'))
    page.screenshot(path=str(OUT / (label + '.png')))
    session.detach()


with serve_game() as local_base, sync_playwright() as pw:
    if not BASE:BASE=local_base
    browser = launch(pw)
    game = browser.new_page(viewport={'width':1440,'height':900})
    game.on('pageerror', lambda e: errors.append(str(e)))
    game.goto(url('HONRO.html')); game.wait_for_function('window.HonroApp')
    desktop(game, game, 'game'); game.close()
    editor = browser.new_page(viewport={'width':1440,'height':900})
    editor.on('pageerror', lambda e: errors.append(str(e)))
    editor.goto(url('HONRO_WORKSHOP.html')); editor.wait_for_function('window.HonroWorkshopAPI')
    editor.close()
    embedded=browser.new_page(viewport={'width':1440,'height':900});embedded.goto(url('HONRO.html?embedded=1'));embedded.wait_for_function('window.HonroApp');desktop(embedded,embedded,'embedded');embedded.close()
    for width, height in [(390,844), (844,390)]:
        page = browser.new_page(viewport={'width':width,'height':height}, is_mobile=True, has_touch=True)
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(url('HONRO.html')); page.wait_for_function('window.HonroApp')
        touch_suite(page, width, height); page.close()
    browser.close()
check('No uncaught browser errors', not errors, errors)
(OUT / 'report.json').write_text(json.dumps({'checks':checks,'errors':errors}, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
print('JOURNEY GESTURES PASS', len(checks), flush=True)
