"""Real built UI: debug enabled in act 1, untouched campaign and exact journal return."""
from pathlib import Path
import argparse, hashlib, json, subprocess
from playwright.sync_api import sync_playwright
from browser_support import launch
from story_browser_server import story_base_url

parser=argparse.ArgumentParser()
parser.add_argument('--review',choices=['entry','exit','storage','final'],required=True)
parser.add_argument('--out',default='_local/reports/debug-journal-ending-records')
args=parser.parse_args();OUT=Path(args.out);OUT.mkdir(parents=True,exist_ok=True)
SHA=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
rows=[];errors=[];http=[]
STATE="""()=>JSON.stringify({profile:HonroApp.profile,normal:HonroApp.normalProfile,
 storage:Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])),battle:HonroApp.engine?.b})"""
VIEW="""()=>{const a=HonroApp,n=document.querySelector('.journey-map-scroll');return {act:a.journeyAct,selection:a.journeySelection,layer:a.journeyLayer,zoom:a.journeyZoom,left:n.scrollLeft,top:n.scrollTop,html:a.root.innerHTML}}"""

def shot(page,name):
    target=OUT/(name+'.jpg');page.screenshot(path=str(target),type='jpeg',quality=85)
    assert target.stat().st_size<1_000_000

def ready(page):page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
def image_ready(page):page.wait_for_function('''()=>{const n=document.querySelector('.act-ending-art');return n?.complete&&n.naturalWidth>0}''')
def step(page,key='Enter'):
    page.wait_for_timeout(380)
    if key=='tap':page.touchscreen.tap(30,page.viewport_size['height']//2)
    else:page.keyboard.press(key)

def setup(page):
    page.locator('[data-action="settings"]').first.click()
    page.locator('[data-action="settings-page"][data-id="records"]').click()
    page.locator('[data-action="settings-page"][data-id="debug"]').click()
    page.locator('#debug-mode-setting').click()
    page.wait_for_function('HonroApp.debugMode&&HonroApp.screen==="rest"')
    page.evaluate('for(let i=0;HonroApp.dialogue&&i<60;i++)HonroStory.finish(HonroApp)')
    assert page.evaluate('Object.keys(HonroApp.profile.cleared).length===0&&HonroApp.profile.lastStage===1')
    page.locator('[data-action="journey-book"]').click()
    page.wait_for_selector('.journey-screen')
    page.wait_for_timeout(3200) # Existing debug notification must not cover controls in evidence.

def select_last(page,stage):
    page.wait_for_function('performance.now()>(HonroApp.journeyInputAfter||0)')
    page.locator(f'[data-action="journey-act"][data-id="{stage//10}"]').click()
    page.wait_for_function('document.querySelector(".journey-map-image")?.complete')
    # Actual fit button makes the act-2 exit visible, without clearing act 1.
    page.locator('[data-action="journey-fit"]').click()
    pin=page.locator(f'[data-action="journey-select"][data-id="{stage}"]')
    box=pin.bounding_box();viewport=page.locator('.journey-map-scroll').bounding_box()
    assert viewport['x']-1<=box['x']+box['width']/2<=viewport['x']+viewport['width']+1
    assert viewport['y']-1<=box['y']+box['height']/2<=viewport['y']+viewport['height']+1
    pin.click()
    page.wait_for_timeout(400)
    assert page.evaluate('HonroApp.journeySelection')==stage
    assert page.locator('.journey-pin').count()==10
    summary=page.locator('.journey-records>summary');assert summary.inner_text()=='기록'
    box=summary.bounding_box();assert box['width']>=44 and box['height']>=44
    # Preserve a nondefault zoom and scroll as well as the selected map/place.
    page.locator('.journey-map-scroll').focus();page.keyboard.press('+')
    pin.click() # Recenter the selected place after changing map scale.
    page.evaluate('''()=>{const n=document.querySelector('.journey-map-scroll');n.scrollLeft=Math.max(0,n.scrollLeft-11);n.scrollTop=Math.max(0,n.scrollTop-17);}''')
    summary.click()
    assert page.locator('[data-action="clear-report"],.report-missing').count()==0
    button=page.locator('[data-action="debug-journal-ending-preview"]')
    assert button.inner_text()=='막 엔딩 미리보기'
    box=button.bounding_box();assert box['width']>=44 and box['height']>=44
    page.wait_for_timeout(80)
    page.evaluate('''()=>{const a=HonroApp;globalThis.__retained={node:a.root.firstElementChild,focus:document.activeElement,engine:a.engine,scene:a.scene};}''')
    return page.evaluate(STATE),page.evaluate(VIEW)

def open_preview(page):
    page.locator('[data-action="debug-journal-ending-preview"]').click()
    page.wait_for_selector('#act-ending[data-mode="debug-journal"]');image_ready(page)
    assert page.locator('[data-ending-return]').inner_text()=='여정첩으로 돌아가기'
    assert page.locator('#act-ending').get_attribute('data-cut')=='1'

def restored(page,state,view):
    page.wait_for_function('HonroApp.screen==="journey"');page.wait_for_timeout(150)
    after=page.evaluate(VIEW)
    if after!=view:
        (OUT/'view-before.json').write_text(json.dumps(view,ensure_ascii=False,indent=2))
        (OUT/'view-after.json').write_text(json.dumps(after,ensure_ascii=False,indent=2))
    assert after==view,'act/selection/layer/zoom/scroll/DOM must return exactly'
    assert page.evaluate(STATE)==state,'profile/normal/storage/battle must be byte exact'
    assert page.evaluate('HonroApp.root.firstElementChild===__retained.node&&HonroApp.engine===__retained.engine&&HonroApp.scene===__retained.scene')
    assert page.locator('.journey-records').get_attribute('open') is not None

with sync_playwright() as p:
    browser=launch(p)
    for width,height in [(390,844),(844,390)]:
        context=browser.new_context(viewport={'width':width,'height':height},has_touch=True)
        page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('response',lambda r:http.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
        page.goto(story_base_url()+'/HONRO.html');ready(page);setup(page)
        for stage in [10,20,30]:
            state,view=select_last(page,stage)
            if args.review in ['entry','final']:shot(page,f'{args.review}-records-{stage}-{width}x{height}')
            # Neither API can be used as the other entry context, nor target an unselected ending.
            assert page.evaluate('(id)=>!HonroActEndings.previewDebug(HonroApp,id)&&!HonroActEndings.previewJournal(HonroApp,id===10?20:10)',stage)
            open_preview(page);assert page.evaluate(STATE)==state
            if args.review in ['entry','final']:
                page.wait_for_timeout(400);shot(page,f'{args.review}-ending-{stage}-{width}x{height}')
            if args.review=='exit':
                for key,cut in [('tap','2'),('Enter','3'),('Space','4'),('tap','title')]:
                    step(page,key);assert page.locator('#act-ending').get_attribute('data-cut')==cut
                step(page)
            else:
                step(page,'tap');assert page.locator('#act-ending').get_attribute('data-cut')=='2'
                page.locator('[data-ending-return]').click()
            restored(page,state,view)
            if args.review=='exit':
                for method in ['close','escape','back']:
                    open_preview(page)
                    if method=='close':page.locator('[data-ending-return]').click()
                    elif method=='escape':page.keyboard.press('Escape')
                    else:page.go_back()
                    restored(page,state,view)
            if args.review=='final' and stage==30:shot(page,f'final-return-{stage}-{width}x{height}')
            rows.append({'stage':stage,'viewport':[width,height],'act1UnclearedDebug':True,'tenPins':True,
                         'profileNormalStorageSHA256':hashlib.sha256(state.encode()).hexdigest(),
                         'view':{k:v for k,v in view.items() if k!='html'},'exactDOM':True,'openRecordsRetained':True})
        if args.review=='storage':
            before=page.evaluate(STATE)
            for flag in ['training','customMap']:
                assert page.evaluate('''key=>{const a=HonroApp,old=a[key];a[key]=true;const ok=!HonroActEndings.previewJournal(a,30)&&!HonroActEndings.replayButton(a,30);a[key]=old;return ok;}''',flag)
            assert before==page.evaluate(STATE)
            stored=page.evaluate('JSON.stringify({...localStorage})');open_preview(page);step(page)
            page.reload();ready(page)
            assert page.evaluate('!HonroApp.endingGallery&&!HonroApp.profile.honroActEnding')
            assert stored==page.evaluate('JSON.stringify({...localStorage})')
        context.close()
    browser.close()
assert not errors,errors
assert not http,http
(OUT/(args.review+'-summary.json')).write_text(json.dumps({'executionSHA':SHA,'review':args.review,'rows':rows,
    'sourceHashes':{f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in ['shared/runtime/act-endings.js','shared/runtime/main.js','shared/runtime/rest-journey.js']},
    'errors':errors,'httpFailures':http,'limits':['Chromium touch/viewport emulation, no physical mobile or combat playthrough.']},ensure_ascii=False,indent=2)+'\n')
print('PASS',args.review,len(rows),'uncleared debug journal cases / exact DOM, view, profiles and storage')
