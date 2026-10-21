"""Focused real-browser reviews; pending-ending fixtures are not combat proof.
Round 3 uses the unchanged existing intro portrait as a transport fixture only.
Parent-supplied ending art still requires a separate final visual review.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
from story_browser_server import story_base_url

parser = argparse.ArgumentParser()
parser.add_argument('--round', choices=['1', '2', '3', 'final'], required=True)
args = parser.parse_args()
OUT = ROOT / '_local/reports/responsive-story-art' / args.round
OUT.mkdir(parents=True, exist_ok=True)
SIZES = [(320, 568), (390, 844), (412, 915), (844, 390), (1440, 900)]
rows = []
errors = []
VIEW = "JSON.stringify(HonroApp.profile)"


def stable_image(page):
    page.wait_for_function('''()=>{const i=document.querySelector('.act-ending-art,.title-painting img');return i&&i.complete&&i.naturalWidth>0}''')
    page.wait_for_timeout(180)


def capture(page, name, selectors):
    result = page.evaluate('''selectors=>{
      const rect=n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom}};
      const image=document.querySelector('.act-ending-art,.title-painting img');
      return {viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth,
       image:{src:image.currentSrc,width:image.naturalWidth,height:image.naturalHeight,fit:getComputedStyle(image).objectFit,position:getComputedStyle(image).objectPosition},
       boxes:selectors.flatMap(s=>[...document.querySelectorAll(s)].map(n=>({selector:s,...rect(n)}))),
       stage:document.querySelector('#act-ending')?.dataset.stage,cut:document.querySelector('#act-ending')?.dataset.cut};
    }''', selectors)
    assert not result['overflow'], result
    w, h = result['viewport']
    for box in result['boxes']:
        assert box['x'] >= -1 and box['y'] >= -1 and box['right'] <= w + 1 and box['bottom'] <= h + 1, (name, box)
    page.screenshot(path=str(OUT / f'{name}.png'))
    result['screenshot'] = f'{name}.png'
    rows.append(result)
    return result


def show_ending(page, stage, index=0, fixture=False):
    page.evaluate('''({stage,index,fixture})=>{
      const a=HonroApp;a.stopBattle();a.close();a.profile.cleared[stage]||={visits:1,rounds:6};
      delete a.profile.seen['act-ending-v1:'+stage];a.profile.honroActEnding={stage,index};
      if(fixture)HONRO_ACT_ENDINGS[stage].portraitImage='/__portrait-fixture/act-'+stage+'.webp';
      HonroActEndings.show(a);
    }''', dict(stage=stage, index=index, fixture=fixture))
    stable_image(page)


with sync_playwright() as p:
    browser = launch(p)
    base = story_base_url()
    for width, height in SIZES:
        context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True, is_mobile=True)
        page = context.new_page()
        requests = []
        responses = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('request', lambda request: requests.append(request.url))
        page.on('response', lambda response: responses.append((response.url, response.status)))
        page.add_init_script("window.layoutShifts=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)layoutShifts.push(e.value)})).observe({type:'layout-shift',buffered:true})")
        if args.round in ['2', 'final']:
            insets = {'top': 44, 'bottom': 34, 'left': 0, 'right': 0} if width < height else {'top': 0, 'bottom': 21, 'left': 44, 'right': 44}
            context.new_cdp_session(page).send('Emulation.setSafeAreaInsetsOverride', {'insets': insets})
        if args.round == '3':
            page.route('**/__portrait-fixture/*.webp', lambda route: route.fulfill(path=str(ROOT / 'shared/assets/environment/title/portrait.webp'), content_type='image/webp'))
        page.goto(base + '/HONRO.html')
        page.wait_for_function('!!globalThis.HonroApp', timeout=120000)
        stable_image(page)
        assert not any(re.search(r'/ending-\d+-|/endings/', u) for u in requests), 'ending art requested at startup'
        title_sources = [u for u in requests if re.search(r'/title-(?:portrait|landscape)\.', u)]
        assert len(title_sources) == 1, title_sources
        assert ('title-portrait.' in title_sources[0]) == (width <= height)
        if args.round != '3':
            # Exercise the longest profile-aware title action branch too.
            if args.round in ['2', 'final']:
                page.evaluate("HonroApp.profile.honroJourney={story:{id:'layout-fixture'}};HonroApp.profile.honroBattle={stageId:1};HonroApp.showTitle()")
                stable_image(page)
            title = capture(page, f'intro-{width}x{height}', ['.honro-logo-wrap', '.title-hangul', '.title-tagline', '.title-actions', '.honro-title>.top button', '.honro-title .footer'])
            boxes = {x['selector']: x for x in title['boxes']}
            assert boxes['.honro-logo-wrap']['bottom'] <= boxes['.title-tagline']['y']
            assert boxes['.title-tagline']['bottom'] < boxes['.title-actions']['y']
            assert boxes['.title-actions']['bottom'] <= boxes['.honro-title .footer']['y']
            if args.round in ['2', 'final']:
                assert boxes['.honro-title>.top button']['y'] >= insets['top']
                assert boxes['.title-actions']['x'] >= insets['left']
                assert boxes['.title-actions']['right'] <= width - insets['right']
        else:
            # Native picture rotation selects only the newly visible title orientation.
            saved_title = page.evaluate(VIEW)
            page.set_viewport_size({'width': height, 'height': width})
            page.wait_for_function('(portrait)=>document.querySelector(".title-painting img").currentSrc.includes(portrait?"title-portrait.":"title-landscape.")', arg=height <= width)
            stable_image(page)
            assert page.evaluate(VIEW) == saved_title
            page.set_viewport_size({'width': width, 'height': height})
            page.wait_for_function('(portrait)=>document.querySelector(".title-painting img").currentSrc.includes(portrait?"title-portrait.":"title-landscape.")', arg=width <= height)
        for stage in [10, 20, 30]:
            fixture = args.round == '3'
            show_ending(page, stage, 2 if args.round in ['2', 'final'] else 0, fixture)
            data = page.evaluate('HONRO_ACT_ENDINGS')
            if not fixture:
                assert data[str(stage)]['portraitImage'] is None, 'Supply final portraits and update expected scope before art approval'
            result = capture(page, f'act{stage//10}-{width}x{height}', ['.act-ending-copy'])
            assert result['image']['fit'] == 'cover'
            if args.round in ['2', 'final']:
                box = result['boxes'][0]
                assert box['x'] >= insets['left'] and box['right'] <= width - insets['right']
                assert box['y'] >= insets['top'] and box['bottom'] <= height - insets['bottom']
            # No other ending and no hidden direction are fetched on this screen.
            this_requests = [u for u in requests if re.search(r'/ending-'+str(stage)+r'-|/__portrait-fixture/act-'+str(stage), u)]
            assert len(this_requests) == 1, this_requests
            before = page.evaluate(VIEW)
            if fixture:
                assert ('/__portrait-fixture/' in result['image']['src']) == (width <= height)
                page.set_viewport_size({'width': height, 'height': width})
                page.wait_for_function('(portrait)=>document.querySelector("#act-ending").dataset.art===(portrait?"portrait":"landscape")', arg=height <= width)
                stable_image(page)
                capture(page, f'act{stage//10}-rotated-from-{width}x{height}', ['.act-ending-copy'])
                page.set_viewport_size({'width': width, 'height': height})
                page.wait_for_function('(portrait)=>document.querySelector("#act-ending").dataset.art===(portrait?"portrait":"landscape")', arg=width <= height)
                stable_image(page)
                # A decoded orientation reused from the module cache makes no new network request.
                assert len([u for u in requests if re.search(r'/ending-'+str(stage)+r'-|/__portrait-fixture/act-'+str(stage), u)]) == 2
            assert page.evaluate(VIEW) == before, 'rotation modified saved data'
            if args.round in ['2', 'final']:
                page.evaluate('HonroApp.profile.honroActEnding.index=4;HonroActEndings.show(HonroApp)')
                stable_image(page)
                capture(page, f'act{stage//10}-next-title-{width}x{height}', ['.act-ending-copy'])
                if stage == 30:
                    assert '준비 중' in page.locator('.act-ending-copy').inner_text()
        if args.round == 'final':
            # Real pending-cut persistence and production keyboard/touch/rest boundary.
            page.evaluate('HonroApp.profile.honroActEnding.index=1;HonroActEndings.show(HonroApp)')
            saved = page.evaluate(VIEW)
            page.reload();page.wait_for_function('!!globalThis.HonroApp', timeout=120000)
            page.evaluate('HonroApp.continue()');stable_image(page)
            assert page.locator('#act-ending').get_attribute('data-cut') == '2'
            assert page.evaluate(VIEW) == saved
            page.evaluate('HonroApp.endingInputAfter=performance.now()+350')
            page.locator('#act-ending').dispatch_event('click', {'detail': 0})
            assert page.locator('#act-ending').get_attribute('data-cut') == '2'
            page.wait_for_timeout(380);page.touchscreen.tap(20, 20)
            assert page.locator('#act-ending').get_attribute('data-cut') == '3'
            page.locator('#act-ending').dispatch_event('click', {'detail': 1})
            assert page.locator('#act-ending').get_attribute('data-cut') == '3'
            page.emulate_media(reduced_motion='reduce')
            for key, cut in [('Enter', '4'), ('Space', 'title')]:
                page.wait_for_timeout(380);page.keyboard.press(key)
                assert page.locator('#act-ending').get_attribute('data-cut') == cut
            assert page.locator('.act-ending-copy').evaluate('(n)=>getComputedStyle(n).animationName') == 'none'
            page.wait_for_timeout(380);page.keyboard.press('Enter')
            page.wait_for_function('HonroApp.screen==="rest"')
            assert page.evaluate('HonroApp.profile.seen["act-ending-v1:30"]&&!HonroApp.profile.honroActEnding&&HonroApp.profile.honroBattle===null')
        assert not [r for r in responses if r[1] >= 400], responses
        assert not errors, errors
        assert page.evaluate('layoutShifts.reduce((a,b)=>a+b,0)') < .01
        context.close()
    browser.close()
report = {'round':args.round, 'rows': rows, 'errors': errors,
          'scope':'Real Chromium; pending-ending and saved-profile fixtures. Round 3 portrait is unchanged intro art used only as a transport fixture. No new painting/art approval or normal combat run.'}
(OUT / 'checks.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(f'PASS round {args.round}: {len(rows)} actual viewport screenshots, lazy requests, orientation, layout and applicable save/input checks')
