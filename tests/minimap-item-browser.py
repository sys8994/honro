"""Production CSS regression: Stage11 normal entry from a disclosed unlock fixture.
No battle injection or source overlay. Not campaign completion or fun acceptance.
"""
import hashlib, json, os, time, traceback
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game
OUT = ROOT / os.environ.get('HONRO_MINIMAP_OUT', '_local/reports/minimap-item')
OUT.mkdir(parents=True, exist_ok=True)
fixture = ROOT / 'tests/fixtures/minimap-item/stage11-declared-entry.json'
raw = fixture.read_bytes()
report = {'passed': False, 'scope': __doc__, 'fixture': {'sha256': hashlib.sha256(raw).hexdigest(),
    'scope': 'Synthetic pre-entry chapter 1–10 unlock and planned growth; no prior continuous play claimed. All battle entry and controls use normal UI.'},
    'sourceCommit': os.environ.get('GITHUB_SHA'), 'views': [], 'errors': []}

def ready(page, enter=False):
    until = time.monotonic() + 150
    stable = 0
    while time.monotonic() < until:
        if page.evaluate('!!HonroApp.dialogue'):
            stable = 0
            nxt = page.locator('[data-action="dialogue-next"]:visible')
            if nxt.count() and nxt.first.is_enabled(): nxt.first.click()
            else: page.keyboard.press('Enter')
        elif page.evaluate('HonroApp.engine?.b?.honroStage===11 && HonroApp.canInput()'):
            stable += 1
            if stable >= 4: return
        elif enter:
            entry = page.locator('[data-action="journey-enter"][data-id="11"]:visible')
            if entry.count() and entry.first.is_enabled(): entry.first.click()
        page.wait_for_timeout(150)
    raise AssertionError('No dialogue-free normal input boundary')

try:
    with serve_game() as origin, sync_playwright() as pw:
        browser = launch(pw)
        try:
            for name, width, height in [('desktop',1440,900),('mobile',390,844),('small',320,568),('landscape',844,390)]:
                context = browser.new_context(viewport={'width':width,'height':height})
                page = context.new_page()
                view = {'name':name,'viewport':{'width':width,'height':height},'passed':False,'clicks':[]}
                report['views'].append(view)
                page.on('pageerror', lambda e: report['errors'].append(str(e)))
                try:
                    page.goto(os.environ.get('HONRO_QA_URL',origin+'/HONRO.html'),wait_until='domcontentloaded')
                    page.wait_for_function('window.HonroApp',timeout=60000)
                    page.evaluate('p=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',json.loads(raw)['profile'])
                    page.reload(wait_until='domcontentloaded')
                    page.wait_for_function('window.HonroApp',timeout=60000)
                    page.locator('.title-actions button.primary:visible').click()
                    ready(page,enter=True)
                    mini=page.locator('#minimap'); item=page.locator('#equipment-pending-battle')
                    mini.wait_for(state='visible');item.wait_for(state='visible')
                    for label, fx, fy in [('top-left',0,0),('top-right',1,0),('bottom-right',1,1),('bottom-left',0,1),('bottom',.5,1)]:
                        ready(page)
                        a=mini.bounding_box();b=item.bounding_box()
                        assert a and b
                        assert b['height']>=44 and b['width']>=44, b
                        gap=b['y']-(a['y']+a['height'])
                        assert gap>=7.5, {'minimap':a,'item':b,'gap':gap}
                        assert b['y']+b['height']<=height and b['x']>=0 and b['x']+b['width']<=width+1,b
                        pos={'x':4+(a['width']-8)*fx,'y':4+(a['height']-8)*fy}
                        hit=page.evaluate('p=>document.elementFromPoint(p.x,p.y)?.id',{'x':a['x']+pos['x'],'y':a['y']+pos['y']})
                        assert hit=='minimap', {'point':pos,'hit':hit}
                        mini.click(position=pos,timeout=5000)
                        page.wait_for_timeout(200)
                        view['clicks'].append({'point':label,'minimap':a,'item':b,'gap':gap,'hit':hit})
                    ready(page)
                    page.screenshot(path=str(OUT/f'{name}-minimap.png'))
                    item.click(timeout=5000)
                    page.locator('.equipment-choice-dialog:visible').wait_for(timeout=5000)
                    page.screenshot(path=str(OUT/f'{name}-item-open.png'))
                    page.locator('.equipment-choice-dialog .close').click()
                    ready(page)
                    assert item.is_visible()
                    assert page.evaluate('document.documentElement.scrollWidth')<=width+1
                    assert not report['errors'],report['errors']
                    view['passed']=True
                except Exception:
                    view['exception']=traceback.format_exc()
                    try:page.screenshot(path=str(OUT/f'{name}-failure.png'))
                    except Exception:pass
                    raise
                finally:context.close()
            report['passed']=all(v['passed'] for v in report['views']) and len(report['views'])==4
        finally:browser.close()
except Exception:
    report['passed']=False
    report['exception']=traceback.format_exc()
finally:
    (OUT/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'passed':report['passed'],'views':[(v['name'],v['passed']) for v in report['views']]},ensure_ascii=False))
if not report['passed']: raise SystemExit(1)
