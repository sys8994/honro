"""Completion fixtures and independent gallery: real Chromium UI/storage checks.
Fixtures verify lifecycle boundaries, not stage20/30 combat playthroughs.
"""
from pathlib import Path
import argparse, json, hashlib, subprocess
from playwright.sync_api import sync_playwright
from browser_support import launch
from story_browser_server import story_base_url

parser=argparse.ArgumentParser();parser.add_argument('--mode',choices=['completion','gallery','all'],default='all');parser.add_argument('--out',default='game/docs/stage10-world-outro-ending-replay/evidence');args=parser.parse_args()
OUT=Path(args.out);OUT.mkdir(parents=True,exist_ok=True)
KEY='honro-first-act-profile-1';errors=[];http=[];rows=[]
def ready(page):page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
def shot(page,name):page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=88)
def cut(page):return page.locator('#act-ending').get_attribute('data-cut')
def step(page,key,expected):
    page.wait_for_timeout(380)
    if key=='tap':page.touchscreen.tap(30,page.viewport_size['height']//2)
    else:page.keyboard.press(key)
    assert cut(page)==expected,(key,cut(page),expected)
def image_ready(page):page.wait_for_function('''()=>{const n=document.querySelector('.act-ending-art');return n&&n.complete&&n.naturalWidth>0}''')
IMMUTABLE="""()=>JSON.stringify(Object.fromEntries(Object.entries(HonroApp.profile).filter(([k])=>!['honroActEnding','seen','saved'].includes(k))))"""
PROFILE='()=>JSON.stringify(HonroApp.profile)'
STORED='()=>localStorage.getItem("'+KEY+'")'
VIEW="""()=>{const a=HonroApp,n=document.querySelector('.journey-map-scroll');return {act:a.journeyAct,selection:a.journeySelection,layer:a.journeyLayer,zoom:a.journeyZoom,left:n.scrollLeft,top:n.scrollTop}}"""
SETUP="""async ({stage,repeat})=>{await HonroCampaignLoader.ensureStage(stage);const a=HonroApp;a.stopBattle();a.close();a.debugMode=false;a.customMap=null;a.training=false;a.profile=HONRO_TOOLS.fresh();a.normalProfile=a.profile;
for(let id=1;id<stage+(repeat?1:0);id++)a.profile.cleared[id]={visits:repeat&&id===stage?3:1,rounds:6};
if(repeat)a.profile.seen['act-ending-v1:'+stage]=true;
a.profile.recruited=stage===10?['archer','mage','knight']:['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];
for(const cls of a.profile.recruited){a.profile.heroes[cls].xp=HONRO_CORE.xpAtLevel(20);HONRO_CORE.autoTrain(a.profile.heroes[cls],cls);HONRO_CORE.sanitizeLoadout(a.profile,cls);}
a.launch(stage);for(let i=0;a.dialogue&&i<60;i++)HonroStory.finish(a);const b=a.engine.b;b.honroJourneyReplay=repeat;b.phase='won';b.honroState.storyQueue=[];b.honroState.deferredStory=[];if(stage===10)b.honroState.sodanWithdrawal={phase:'safe'};
const counts=globalThis.__endingCounts={};for(const [o,key]of [[HonroProgression,'complete'],[HonroProgression,'syncRoster'],[a,'recruit'],[HonroRestJourney,'recordOutcome'],[HonroSplitCampaign,'outcome']]){const original=o[key];o[key]=function(...args){counts[key]=(counts[key]||0)+1;return original.apply(this,args)};}
a.outcome();for(let i=0;a.dialogue&&i<60;i++)HonroStory.finish(a);
}"""
with sync_playwright() as p:
    browser=launch(p)
    page=browser.new_page(viewport={'width':390,'height':844},has_touch=True)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:http.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
    page.goto(story_base_url()+'/HONRO.html');ready(page)
    if args.mode in ['completion','all']:
        for width,height in [(390,844),(844,390)]:
            page.set_viewport_size({'width':width,'height':height})
            for stage in [10,20,30]:
                for repeat in [False,True]:
                    # Reload clears instrumentation from the prior fixture.
                    page.reload();ready(page)
                    page.evaluate(SETUP,{'stage':stage,'repeat':repeat});page.wait_for_selector('#act-ending');image_ready(page)
                    assert cut(page)=='1'
                    assert page.locator('#act-ending').get_attribute('data-mode')=='completion'
                    assert page.locator('[data-ending-return]').count()==0
                    counts=page.evaluate('__endingCounts');assert counts==dict(complete=1,syncRoster=1,recruit=1,recordOutcome=1,outcome=1),counts
                    assert page.evaluate('HonroApp.profile.cleared['+str(stage)+'].visits')==(4 if repeat else 1)
                    before=page.evaluate(IMMUTABLE)
                    page.evaluate('HonroApp.outcome();HonroApp.outcome();HonroApp.outcome()')
                    assert before==page.evaluate(IMMUTABLE) and counts==page.evaluate('__endingCounts')
                    page.evaluate('HonroApp.endingInputAfter=performance.now()+350');page.keyboard.press('Enter');assert cut(page)=='1'
                    page.wait_for_timeout(380);shot(page,f'act{stage//10}-'+('repeat' if repeat else 'first')+f'-{width}x{height}')
                    step(page,'tap','2');page.locator('#act-ending').dispatch_event('click',{'detail':1});assert cut(page)=='2'
                    assert before==page.evaluate(IMMUTABLE)
                    page.reload();ready(page);page.evaluate('HonroApp.continue()');page.wait_for_selector('#act-ending');assert cut(page)=='2'
                    assert before==page.evaluate(IMMUTABLE),'resume cannot re-settle outcome'
                    step(page,'Enter','3');page.wait_for_timeout(380);shot(page,f'act{stage//10}-copy3-'+('repeat' if repeat else 'first')+f'-{width}x{height}');step(page,'Space','4');step(page,'tap','title');page.wait_for_timeout(380);shot(page,f'act{stage//10}-title-'+('repeat' if repeat else 'first')+f'-{width}x{height}')
                    assert before==page.evaluate(IMMUTABLE)
                    page.wait_for_timeout(380);page.keyboard.press('Enter');page.wait_for_function('HonroApp.screen==="rest"')
                    page.evaluate('for(let i=0;HonroApp.dialogue&&i<60;i++)HonroStory.finish(HonroApp)')
                    assert page.evaluate('HonroApp.profile.honroActEnding==null&&HonroApp.profile.honroBattle===null')
                    assert page.evaluate('HonroApp.profile.cleared['+str(stage)+'].visits')==(4 if repeat else 1)
                    assert page.evaluate('HonroApp.profile.seen["act-ending-v1:'+str(stage)+'"]')
                    settled=page.evaluate(IMMUTABLE)
                    page.reload();ready(page);page.evaluate('HonroApp.continue()');assert page.locator('#act-ending').count()==0
                    assert settled==page.evaluate(IMMUTABLE)
                    rows.append({'mode':'completion','stage':stage,'repeat':repeat,'viewport':[width,height],'counts':counts,'cut2Reload':True,'presentationImmutable':hashlib.sha256(before.encode()).hexdigest(),'tapSingleCut':True,'restSettledReload':True})
        # Presentation eligibility excludes all non-campaign contexts.
        exclusions=page.evaluate('''()=>{const a=HonroApp,result={};const profile=JSON.stringify(a.profile),b={phase:'won',honroStage:10};for(const key of ['debugMode','training','customMap']){const old=a[key];a[key]=true;result[key]=HonroActEndings.prepare(a,b,false)===false&&!HonroActEndings.canReplay(a,10)&&!HonroActEndings.replayButton(a,10);a[key]=old;}result.customBattle=!HonroActEndings.prepare(a,{...b,honroCustom:true},false);const embedded=globalThis.HONRO_EMBEDDED;globalThis.HONRO_EMBEDDED=true;result.embedded=!HonroActEndings.prepare(a,b,false)&&!HonroActEndings.canReplay(a,10);globalThis.HONRO_EMBEDDED=embedded;result.noProfileWrite=profile===JSON.stringify(a.profile);return result;}''')
        assert all(exclusions.values()),exclusions
        rows.append({'exclusions':exclusions})
    if args.mode in ['gallery','all']:
        checkpoint=json.loads(Path('game/docs/stage-review/act-endings/evidence/normal-21-escape-save.json').read_text())['profile']['honroBattle']
        # Every ending unlock boundary, including the end-selected stage30 marker.
        for cleared in [0,9,10,19,20,29,30]:
            page.evaluate('''({cleared,battle})=>{const a=HonroApp;a.stopBattle();a.close();a.debugMode=false;a.training=false;a.customMap=null;a.profile=HONRO_TOOLS.fresh();a.normalProfile=a.profile;for(let id=1;id<=cleared;id++)a.profile.cleared[id]={visits:1,rounds:6};a.profile.honroBattle=battle;a.persist();}''',{'cleared':cleared,'battle':checkpoint if cleared==20 else None})
            for stage in [10,20,30]:
                actual=page.evaluate('(id)=>HonroActEndings.canReplay(HonroApp,id)',stage);assert actual==(stage<=cleared)
                if stage<=cleared or stage==cleared+1:
                    page.evaluate('(id)=>HonroRestJourney.showBook(HonroApp,id,null,id/10)',stage)
                    assert page.locator('[data-action="act-ending-replay"]').count()==(1 if stage<=cleared else 0)
            before=page.evaluate(PROFILE)
            assert not page.evaluate('HonroActEndings.replay(HonroApp,9)')
            assert before==page.evaluate(PROFILE)
            rows.append({'mode':'unlock','clearedThrough':cleared,'available':[id for id in [10,20,30] if id<=cleared]})
        for width,height in [(390,844),(844,390)]:
            page.set_viewport_size({'width':width,'height':height})
            for stage in [10,20,30]:
                page.evaluate('''({stage,battle})=>{const a=HonroApp;a.stopBattle();a.close();a.profile=HONRO_TOOLS.fresh();a.normalProfile=a.profile;for(let id=1;id<=30;id++)a.profile.cleared[id]={visits:1,rounds:6};a.profile.honroBattle=stage===10?battle:null;a.persist();HonroRestJourney.showBook(a,stage,null,stage/10);if(stage===30)HonroRestJourney.selectBook(a,stage);globalThis.__journalNode=a.root.firstElementChild;}''',{'stage':stage,'battle':checkpoint})
                page.wait_for_function('document.querySelector(".journey-map-image")?.complete')
                page.locator('[data-action="journey-zoom"][data-id="in"]').click()
                page.evaluate('''()=>{const n=document.querySelector('.journey-map-scroll');n.scrollLeft=Math.max(0,n.scrollLeft-37);n.scrollTop=Math.max(0,n.scrollTop-23);}''')
                view=page.evaluate(VIEW);before=page.evaluate(PROFILE);stored=page.evaluate(STORED)
                if stage==30:assert view['selection']=='end'
                engine=page.evaluate('HonroApp.engine');assert engine is None
                button=page.locator('[data-action="act-ending-replay"]');box=button.bounding_box();assert box['y']>=0 and box['y']+box['height']<=height+1,box
                shot(page,f'journal-act{stage//10}-{width}x{height}')
                page.wait_for_timeout(400);button.click();page.wait_for_selector('#act-ending');image_ready(page)
                assert page.locator('#act-ending').get_attribute('data-mode')=='gallery';assert cut(page)=='1'
                assert before==page.evaluate(PROFILE) and stored==page.evaluate(STORED)
                if stage==10:
                    page.set_viewport_size({'width':height,'height':width});image_ready(page);page.wait_for_timeout(450)
                    assert cut(page)=='1' and before==page.evaluate(PROFILE) and stored==page.evaluate(STORED)
                    page.set_viewport_size({'width':width,'height':height});image_ready(page);page.wait_for_timeout(450)
                page.wait_for_timeout(400);shot(page,f'gallery-act{stage//10}-{width}x{height}')
                step(page,'tap','2');step(page,'Enter','3');step(page,'Space','4');step(page,'tap','title')
                page.wait_for_timeout(380);page.keyboard.press('Space');page.wait_for_function('HonroApp.screen==="journey"')
                page.wait_for_timeout(150)
                assert before==page.evaluate(PROFILE) and stored==page.evaluate(STORED),'entire profile and raw saved battle remain byte-exact'
                assert view==page.evaluate(VIEW),'act/selection/layer/zoom/scroll exact return'
                assert page.evaluate('HonroApp.root.firstElementChild===__journalNode&&HonroApp.engine===null')
                shot(page,f'journal-return-act{stage//10}-{width}x{height}')
                # Escape, explicit close and browser Back all return to the retained map.
                for exit_kind in ['escape','close','back']:
                    page.wait_for_timeout(400);page.locator('[data-action="act-ending-replay"]').click();page.wait_for_selector('#act-ending')
                    if exit_kind=='escape':page.keyboard.press('Escape')
                    elif exit_kind=='close':page.locator('[data-ending-return]').click()
                    else:page.go_back()
                    page.wait_for_function('HonroApp.screen==="journey"');page.wait_for_timeout(150)
                    assert view==page.evaluate(VIEW)
                    assert before==page.evaluate(PROFILE) and stored==page.evaluate(STORED)
                # Reload discards gallery. No pending flag or gallery cursor enters the save.
                page.wait_for_timeout(400);page.locator('[data-action="act-ending-replay"]').click();step(page,'Enter','2')
                assert stored==page.evaluate(STORED)
                page.reload();ready(page)
                assert page.evaluate('!HonroApp.endingGallery&&!HonroApp.profile.honroActEnding')
                assert stored==page.evaluate(STORED),'reload never writes a gallery state'
                rows.append({'mode':'gallery','stage':stage,'viewport':[width,height],'view':view,'byteExactProfile':hashlib.sha256(before.encode()).hexdigest(),'byteExactStorage':hashlib.sha256(stored.encode()).hexdigest(),'savedBattle':stage==10,'returnMethods':['complete','Escape','close','browser Back'],'reload':'discard temporary viewer; unchanged normal save'})
    assert not errors,errors
    assert not http,http
    browser.close()
source={f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in ['shared/runtime/main.js','shared/runtime/act-endings.js','shared/runtime/rest-journey.js','game/src/act-endings.css']}
(OUT/'summary.json').write_text(json.dumps({'executionSHA':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'sourceHashes':source,'rows':rows,'errors':errors,'httpFailures':http,'limits':['Stage10/20/30 lifecycle uses terminal battle fixtures, not combat victories.','Gallery tests use coherent unlock fixtures; no actual 30-stage full run.','Chromium emulation only.']},ensure_ascii=False,indent=2)+'\n')
print('PASS',args.mode,'ending lifecycle / replay unlock / exact journal return / profile and localStorage invariants')
