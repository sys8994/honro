"""Focused real built-UI checks. Fixtures never imply combat playthroughs."""
from pathlib import Path
import argparse, hashlib, json, subprocess
from playwright.sync_api import sync_playwright
from browser_support import launch
from story_browser_server import story_base_url

parser = argparse.ArgumentParser()
parser.add_argument('--review', choices=['entry', 'exit', 'storage', 'final'], required=True)
parser.add_argument('--out', default='_local/reports/debug-act-ending-preview')
args = parser.parse_args()
EXECUTION_SHA = subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
OUT = Path(args.out); OUT.mkdir(parents=True, exist_ok=True)
rows, errors, http = [], [], []
SNAP = """()=>JSON.stringify({profile:HonroApp.profile,normal:HonroApp.normalProfile,
 storage:Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])),
 battle:HonroApp.engine?.b,stageId:HonroApp.stageId,debugRestStage:HonroApp.debugRestStage,
 selected:HonroApp.selected,selectedByUnit:HonroApp.selectedByUnit,power:HonroApp.power,done:HonroApp.done,
 dirty:HonroApp.dirty,training:HonroApp.training,acc:HonroApp.acc})"""

def shot(page, name):
    path = OUT / (name + '.jpg')
    page.screenshot(path=str(path), type='jpeg', quality=85)
    assert path.stat().st_size < 1_000_000

def ready(page):
    page.wait_for_function('!!globalThis.HonroApp', timeout=120000)

def debug_menu(page, live=False):
    # Normal save and an optional active debug battle are explicit fixtures.
    page.evaluate("""(live)=>{const a=HonroApp;a.stopBattle();a.close();a.debugMode=false;
      a.profile=HONRO_TOOLS.fresh();a.normalProfile=a.profile;a.persist();a.showTitle();}""", live)
    page.locator('[data-action="settings"]').first.click()
    page.locator('[data-action="settings-page"][data-id="records"]').click()
    page.locator('[data-action="settings-page"][data-id="debug"]').click()
    assert page.locator('[data-action="debug-act-ending-preview"]').count() == 0
    page.locator('#debug-mode-setting').click()
    page.wait_for_function('HonroApp.debugMode&&HonroApp.screen==="rest"')
    page.evaluate('for(let i=0;HonroApp.dialogue&&i<60;i++)HonroStory.finish(HonroApp)')
    if live:
        page.evaluate('HonroApp.launch(1);for(let i=0;HonroApp.dialogue&&i<60;i++)HonroStory.finish(HonroApp)')
        page.wait_for_selector('#battlecanvas')
        page.locator('[data-action="pause"]').click()
    page.locator('[data-action="settings"]').first.click()
    page.locator('[data-action="settings-page"][data-id="records"]').click()
    page.locator('[data-action="settings-page"][data-id="debug"]').click()
    # Let the existing deferred battle autosave settle before the read-only baseline.
    if live: page.wait_for_function('!HonroApp.dirty')
    if args.review == 'final': page.wait_for_timeout(3200)
    assert page.locator('#debug-ending-title').inner_text() == '막 엔딩 미리보기'
    assert page.locator('[data-action="debug-act-ending-preview"]').all_text_contents() == ['1막', '2막', '3막']
    assert page.evaluate('Object.keys(HonroApp.profile.cleared).length') == 0
    page.evaluate("""()=>{const a=HonroApp;globalThis.__retained={root:a.root.firstElementChild,
      modal:a.modal.firstElementChild,engine:a.engine,scene:a.scene,screen:a.screen};}""")

def open_preview(page, stage):
    button = page.locator(f'[data-action="debug-act-ending-preview"][data-id="{stage}"]')
    button.scroll_into_view_if_needed()
    box = button.bounding_box()
    assert box['width'] >= 44 and box['height'] >= 44, box
    page.touchscreen.tap(box['x'] + box['width']/2, box['y'] + box['height']/2)
    page.wait_for_selector('#act-ending[data-mode="debug"]')
    page.wait_for_function('''()=>{const n=document.querySelector('.act-ending-art');return n?.complete&&n.naturalWidth>0}''')
    assert page.locator('#act-ending').get_attribute('data-cut') == '1'
    assert page.locator('[data-ending-return]').inner_text() == '디버그 화면으로 돌아가기'
    box = page.locator('[data-ending-return]').bounding_box()
    assert box['width'] >= 44 and box['height'] >= 44


def step(page, key='Enter'):
    page.wait_for_timeout(380)
    if key == 'tap': page.touchscreen.tap(30, page.viewport_size['height']//2)
    else: page.keyboard.press(key)


def unchanged(page, before):
    after = page.evaluate(SNAP)
    if after != before:
        (OUT/'state-before.json').write_text(before)
        (OUT/'state-after.json').write_text(after)
    assert after == before, 'profile / normal / battle / localStorage changed'

def restored(page, before, scroll=None):
    page.wait_for_function('HonroApp.screen===__retained.screen&&HonroApp.modal.classList.contains("open")')
    page.wait_for_timeout(140)
    unchanged(page,before)
    assert page.evaluate('''()=>{const a=HonroApp,r=__retained;return a.root.firstElementChild===r.root&&a.modal.firstElementChild===r.modal&&a.engine===r.engine&&a.scene===r.scene&&a.settingsPage==='debug'&&a.modalKind==='settings-dialog'}''')
    if scroll is not None: assert page.locator('.menu-body').evaluate('(n)=>n.scrollTop') == scroll

with sync_playwright() as p:
    browser = launch(p)
    for width, height in [(390,844), (844,390)]:
        context = browser.new_context(viewport={'width':width,'height':height}, has_touch=True)
        page = context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('response', lambda r: http.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
        page.goto(story_base_url()+'/HONRO.html'); ready(page)
        debug_menu(page, live=args.review in ['exit','storage'])
        # Invalid context/ID requests cannot create a viewer or write state.
        before = page.evaluate(SNAP)
        assert page.evaluate('''()=>{const a=HonroApp,E=HonroActEndings;let ok=!E.previewDebug(a,9);
          for(const key of ['debugMode','training','customMap']){const old=a[key];a[key]=key==='debugMode'?false:true;ok=ok&&!E.previewDebug(a,10)&&!E.debugControls(a);a[key]=old;}
          const old=globalThis.HONRO_EMBEDDED;globalThis.HONRO_EMBEDDED=true;ok=ok&&!E.previewDebug(a,10)&&!E.debugControls(a);globalThis.HONRO_EMBEDDED=old;return ok&&!a.endingGallery;}''')
        unchanged(page,before)
        for stage in [10,20,30]:
            before = page.evaluate(SNAP)
            # Scroll before capture, matching the actual clicked location.
            page.locator(f'[data-action="debug-act-ending-preview"][data-id="{stage}"]').scroll_into_view_if_needed()
            scroll = page.locator('.menu-body').evaluate('(n)=>n.scrollTop')
            shot(page, f'{args.review}-debug-act{stage//10}-{width}x{height}')
            open_preview(page,stage)
            unchanged(page,before)
            bounds = page.locator('.act-ending-copy').bounding_box()
            assert bounds['x'] >= 0 and bounds['y'] >= 0 and bounds['x']+bounds['width'] <= width+1 and bounds['y']+bounds['height'] <= height+1
            page.wait_for_timeout(400)
            shot(page, f'{args.review}-act{stage//10}-{width}x{height}')
            if args.review in ['entry','final']:
                page.evaluate('HonroApp.endingInputAfter=performance.now()+350')
                page.keyboard.press('Enter'); assert page.locator('#act-ending').get_attribute('data-cut') == '1'
                step(page,'tap'); assert page.locator('#act-ending').get_attribute('data-cut') == '2'
                page.locator('#act-ending').dispatch_event('click',{'detail':1})
                assert page.locator('#act-ending').get_attribute('data-cut') == '2'
                page.keyboard.press('Escape')
            elif args.review == 'exit':
                for key, cut in [('tap','2'),('Enter','3'),('Space','4'),('tap','title')]:
                    step(page,key); assert page.locator('#act-ending').get_attribute('data-cut') == cut
                assert '디버그 화면으로 돌아갑니다' in page.locator('.act-ending-copy').inner_text()
                step(page)
            else:
                step(page); unchanged(page,before)
                page.locator('[data-ending-return]').click()
            restored(page,before,scroll)
            for method in (['close','back','escape'] if args.review == 'exit' else []):
                open_preview(page,stage)
                if method == 'close': page.locator('[data-ending-return]').click()
                elif method == 'back': page.go_back()
                else: page.keyboard.press('Escape')
                restored(page,before,scroll)
            rows.append({'review':args.review,'stage':stage,'viewport':[width,height],
                         'uncleared':True,'byteExactStateSHA256':hashlib.sha256(before.encode()).hexdigest(),
                         'retainedDOMEngineScene':True,'restoredSettingsScroll':scroll})
        if args.review == 'storage':
            # Reload discards the temporary viewer; the complete raw storage is unchanged.
            stored = page.evaluate('JSON.stringify({...localStorage})')
            open_preview(page,30); step(page)
            page.reload();ready(page)
            assert page.evaluate('!HonroApp.endingGallery&&!HonroApp.profile.honroActEnding')
            assert stored == page.evaluate('JSON.stringify({...localStorage})')
        if args.review == 'final':
            # Fullscreen Escape keeps ownership: first exits fullscreen, second returns.
            page.locator('[data-action="fullscreen"]').click()
            page.wait_for_function('!!document.fullscreenElement')
            open_preview(page,10)
            page.keyboard.press('Escape');page.wait_for_timeout(100)
            assert page.locator('#act-ending').count() == 1
            assert not page.evaluate('!!document.fullscreenElement')
            page.keyboard.press('Escape');restored(page,before)
            shot(page,f'final-return-{width}x{height}')
        context.close()
    browser.close()
assert not errors, errors
assert not http, http
(OUT/(args.review+'-summary.json')).write_text(json.dumps({
    'executionSHA':EXECUTION_SHA,
    'sourceHashes':{f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in ['shared/runtime/act-endings.js','shared/runtime/main.js','shared/runtime/menu-ui.js','game/src/act-endings.css']},
    'review':args.review,'rows':rows,'errors':errors,'httpFailures':http,
    'limits':['Chromium touch/viewport emulation, not physical mobile devices.','Uncleared and live combat use explicit fixtures, no combat playthrough.']
},ensure_ascii=False,indent=2)+'\n')
print('PASS',args.review,len(rows),'cases; byte-exact profile/normal/battle/storage; exact settings return')
