"""Play the release-shaped site locally or test its deployed URL without touching a real save."""
import argparse
import json
import mimetypes
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

arg=argparse.ArgumentParser()
arg.add_argument('--live',action='store_true')
arg.add_argument('--chromium',default='/usr/bin/chromium')
arg.add_argument('--out',default='_local/reports/ending-v2')
args=arg.parse_args()
out=Path(args.out)
out.mkdir(parents=True,exist_ok=True)
root=Path.cwd()
origin='https://sys8994.github.io'
errors=[]

def local(route):
    path=urlparse(route.request.url).path.removeprefix('/honro/')
    file=(root/(path or 'index.html')).resolve()
    if not file.is_relative_to(root) or not file.is_file():return route.fulfill(status=404)
    mime={'.js':'text/javascript','.mjs':'text/javascript','.webp':'image/webp'}.get(file.suffix,mimetypes.guess_type(file)[0])
    return route.fulfill(path=str(file),content_type=mime)
def menu(page):
    page.locator('[data-action="settings"]').first.click()
    page.locator('[data-action="settings-page"][data-id="records"]').click()
    page.locator('[data-action="settings-page"][data-id="debug"]').click()

def snapshot(page):
    return page.evaluate("JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))")

def start(page):
    menu(page)
    page.locator('#debug-mode-setting').click()
    page.wait_for_function('HonroApp.debugMode&&HonroApp.screen==="rest"')
    page.evaluate('for(let i=0;HonroApp.dialogue&&i<60;i++)HonroStory.finish(HonroApp)')
    menu(page)
    button=page.locator('[data-action="debug-act-ending-preview"][data-id="60"]')
    button.scroll_into_view_if_needed()
    before=snapshot(page)
    button.click()
    page.locator('.he-root[data-ending-mode="debug"]').wait_for()
    return before

def displayed(page,id,wide):
    page.wait_for_function("""({id,wide})=>{const r=document.querySelector('.he-root'),i=r?.querySelector('.he-still');
      return r?.dataset.endingStill===id&&i?.complete&&i.naturalWidth===(wide?1920:1080)&&i.naturalHeight===(wide?1080:1920);
    }""",arg={'id':id,'wide':wide},polling=100)
    q=page.locator('.he-copy').bounding_box()
    if q:assert q['y']+q['height']<=page.viewport_size['height']+1,q

with sync_playwright() as p:
    b=p.chromium.launch(executable_path=args.chromium,args=['--no-sandbox'])
    for width,height in [(1440,900),(390,844)]:
        wide=width>height
        c=b.new_context(viewport={'width':width,'height':height},has_touch=not wide)
        if not args.live:c.route(origin+'/honro/**',local)
        page=c.new_page()
        crawl=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('response',lambda r:crawl.append(r.url) if r.status>=400 and 'ending' in r.url else None)
        page.goto(origin+'/honro/',wait_until='domcontentloaded')
        page.wait_for_function('!!window.HonroApp',timeout=120000)
        page.clock.install()
        page.clock.pause_at(page.evaluate('Date.now()+1000'))
        before=start(page)
        page.clock.fast_forward(14500)
        r=page.locator('.he-root')
        r.locator('[data-ending-action="record"]').click()
        page.clock.run_for(1500)
        assert r.locator('.he-names').inner_text().split()==['곽진','박문돌','이만복']
        page.screenshot(path=out/f'ledger-{width}.png')
        page.clock.run_for(4500)
        if wide:
            page.keyboard.down('ArrowRight');page.clock.run_for(5500);page.keyboard.up('ArrowRight')
        else:
            btn=r.locator('[data-ending-action="walk"]')
            box=btn.bounding_box()
            cd=c.new_cdp_session(page)
            pt={'x':box['x']+box['width']/2,'y':box['y']+box['height']/2}
            cd.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[pt]})
            page.clock.run_for(5500)
            cd.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        page.clock.run_for(1100)
        displayed(page,'still_01',wide)
        page.clock.run_for(450)
        page.screenshot(path=out/f'first-{width}.png')
        if not wide:
            old=r.get_attribute('data-ending-beat')
            page.set_viewport_size({'width':844,'height':390})
            page.clock.run_for(70)
            displayed(page,'still_01',True)
            assert r.get_attribute('data-ending-beat')==old
            page.set_viewport_size({'width':width,'height':height})
            page.clock.run_for(70)
            displayed(page,'still_01',False)
        for key,ms in [('still_02',21000),('still_03',21000),('still_04',24000),('still_05',21000),('still_06a',25000),('still_06b',15000),('still_07',5000),('final',22000)]:
            page.clock.fast_forward(ms)
            displayed(page,key,wide)
            if key=='still_06a':
                page.screenshot(path=out/f'{key}-{width}.png')
            if key=='still_06b':
                page.clock.fast_forward(11000)
                assert r.get_attribute('data-ending-beat')=='2'
                page.screenshot(path=out/f'{key}-{width}.png')
        assert r.get_attribute('data-ending-beat')=='0'
        if wide:
            page.mouse.click(width/3,height/3)
        else:
            page.touchscreen.tap(width/3,height/3)
        page.clock.run_for(180)
        assert float(r.locator('.he-copy').evaluate('n=>n.style.opacity'))<.82
        assert r.get_attribute('data-ending-beat')=='0'
        page.clock.run_for(1000)
        assert r.get_attribute('data-ending-beat')=='1'
        page.screenshot(path=out/f'credits-{width}.png')
        assert r.locator('h1').inner_text()=='혼로'
        if wide:
            page.keyboard.down('Escape');page.clock.run_for(1000);page.keyboard.up('Escape')
            assert r.count()==1
            page.keyboard.down('Escape');page.clock.run_for(2020);page.keyboard.up('Escape')
        else:
            page.clock.fast_forward(27000)
        assert r.count()==0
        assert page.evaluate("HonroApp.modal.classList.contains('open')&&HonroApp.settingsPage==='debug'")
        assert before==snapshot(page)
        assert not crawl,crawl
        c.close()
    b.close()
assert not errors,errors
print(json.dumps({'debugStills':9,'pc':True,'mobile':True,'rotationStableBeat':True,'tapNextSmooth':True,'desktopEscHold':True,'naturalEnd':True,'previewSaveBytesUnchanged':True,'live':args.live}))
