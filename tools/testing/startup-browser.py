"""One cold-start probe, reused before/after; simulated Chromium, not a phone benchmark."""
import sys,json,re,time
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tests'))
from playwright.sync_api import sync_playwright
from browser_support import launch
from story_browser_server import story_base_url
MODE=sys.argv[1] if len(sys.argv)>1 else 'after'
OUT=ROOT/'_local/reports/startup';OUT.mkdir(parents=True,exist_ok=True)
INIT=r'''globalThis.__startup={dataWork:[],imports:[],longTasks:[],paint:[],titlePaint:null,appReady:null};
new PerformanceObserver(l=>__startup.longTasks.push(...l.getEntries().map(e=>({start:e.startTime,ms:e.duration})))).observe({type:'longtask',buffered:true});
new PerformanceObserver(l=>__startup.paint.push(...l.getEntries().map(e=>({name:e.name,ms:e.startTime})))).observe({type:'paint',buffered:true});
Object.defineProperty(globalThis,'HonroApp',{configurable:true,set(value){Object.defineProperty(globalThis,'HonroApp',{value,writable:true,configurable:true});__startup.appReady=performance.now();}});
globalThis.__startupImport=async file=>{const start=performance.now();const result=await import(file);__startup.imports.push({file:file.split('/').at(-1),start,ms:performance.now()-start});return result;};
function titleTick(){const t=document.querySelector('.honro-title'),imgs=t&&[...t.querySelectorAll('.title-painting img,.honro-logo')];if(!__startup.titlePaint&&imgs?.length>=3&&imgs.every(i=>i.complete&&i.naturalWidth)&&t.getBoundingClientRect().height>0){requestAnimationFrame(()=>{__startup.titlePaint??=performance.now();});}if(!__startup.titlePaint||!__startup.appReady)requestAnimationFrame(titleTick);}requestAnimationFrame(titleTick);'''

def instrument(route):
 path=ROOT/urlparse(route.request.url).path.lstrip('/')
 body=path.read_text()
 if path.name.startswith('load-data.'):
  body=re.sub(r'export async function loadData\(file(,refs)?\)\{return hydrate\(await request\(file\)(,refs)?\);\}',lambda m:"export async function loadData(file"+(",refs" if m[1] else "")+"){const data=await request(file),start=performance.now(),pending=hydrate(data"+(",refs" if m[1] else "")+"),syncMs=performance.now()-start,value=await pending;globalThis.__startup.dataWork.push({file,start,syncMs,ms:performance.now()-start});return value;}",body)
  body=body.replace('return {...base,library,stages};',"performance.mark('project-data-ready');return {...base,library,stages};")
 if path.name.startswith('campaign.'):
  body += "\nperformance.mark('project-author-ready');\n"
 if path.parent.name=='entries':body=body.replace('await import(file)','await globalThis.__startupImport(file)')
 route.fulfill(status=200,content_type='text/javascript',body=body)

def checks():
 results={};errors=[]
 with sync_playwright() as p:
  browser=launch(p);base=story_base_url();context=browser.new_context(viewport={'width':1440,'height':960});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.add_init_script(INIT)
  cdp=context.new_cdp_session(page);cdp.send('Emulation.setCPUThrottlingRate',{'rate':4});cdp.send('Network.enable');cdp.send('Network.emulateNetworkConditions',{'offline':False,'latency':40,'downloadThroughput':2*1024*1024,'uploadThroughput':1024*1024})
  page.goto(base+'/',wait_until='commit');page.locator('[data-startup-title]').wait_for();page.evaluate('window.startupPainting=document.querySelector(".title-painting");window.startupLogo=document.querySelector(".honro-logo-hanja")');page.locator('[data-startup-start]').click(force=True);page.locator('[data-startup-start]').click(force=True);assert page.evaluate('!window.HonroApp');assert page.locator('[data-startup-start]').inner_text()=='준비 중';assert page.evaluate("localStorage.getItem('honro-first-act-profile-1')===null");page.screenshot(path=str(OUT/'title-before-ready.png'))
  page.wait_for_function('window.HonroApp&&document.documentElement.dataset.honroReady',timeout=60000);assert page.evaluate('startupPainting===document.querySelector(".title-painting")&&startupLogo===document.querySelector(".honro-logo-hanja")');assert page.locator('.honro-title').count()==1 and page.locator('.title-actions button').count()==1;assert page.locator('.title-actions button').inner_text()=='길을 열다';page.screenshot(path=str(OUT/'title-ready-desktop.png'));results['handoff']={'samePaintingAndLogoNodes':True,'noAutoStartAfterEarlyClicks':page.evaluate('HonroApp.screen')=='title','rootRedirects':page.evaluate("performance.getEntriesByType('navigation')[0].redirectCount")}
  page.evaluate('''()=>{const a=HonroApp;window.audioWakes=0;const wake=a.audio.wake.bind(a.audio);a.audio.wake=(...args)=>{audioWakes++;return wake(...args);};window.firstReadyClick=performance.now();}''');page.locator('.title-actions button.primary').click();page.wait_for_function("HonroApp.screen!=='title'");results['firstReadyClick']={'responseMs':page.evaluate('performance.now()-firstReadyClick'),'audioWakeCalls':page.evaluate('audioWakes')};page.wait_for_function("HonroApp.audio.context?.state==='running'",timeout=10000);results['firstReadyClick']['audioContext']=page.evaluate('HonroApp.audio.context.state')
  page.evaluate('''()=>{const a=HonroApp;a.frame=()=>{};while(a.dialogue)HonroStory.finish(a);a.close();window.normalBeforeDebug=JSON.stringify({heroes:a.profile.heroes,loadouts:a.profile.loadouts});a.setDebugMode(true);a.profile.heroes.archer.xp+=7;a.persist();a.setDebugMode(false);if(normalBeforeDebug!==JSON.stringify({heroes:a.profile.heroes,loadouts:a.profile.loadouts}))throw Error('debug changed normal');a.launch(1);while(a.dialogue)HonroStory.finish(a);a.profile.honroBattle=structuredClone(a.engine.b);if(a.profile.honroJourney)delete a.profile.honroJourney.story;a.persist();}''');saved=page.evaluate("JSON.parse(localStorage.getItem('honro-first-act-profile-1'))");page.reload(wait_until='commit');page.wait_for_function('window.HonroApp',timeout=60000);loaded=page.evaluate('({heroes:HonroApp.profile.heroes,loadouts:HonroApp.profile.loadouts,cleared:HonroApp.profile.cleared})');assert loaded=={k:saved[k] for k in ['heroes','loadouts','cleared']};assert page.locator('.title-actions button.primary').get_attribute('data-action')=='continue';assert page.locator('.title-actions button.primary').inner_text()=='이어서 걷기';page.locator('.title-actions button.primary').click();page.wait_for_function('HonroApp.engine?.b.honroStage===1');assert page.evaluate('HonroApp.engine.b.units.find(u=>u.side===0&&u.cls===\'archer\')?.hp')==next(u['hp'] for u in saved['honroBattle']['units'] if u['side']==0 and u.get('cls')=='archer');results['saveAndContinue']={'growthLoadoutsClearedPreserved':True,'normalDebugSeparated':True,'stage':1}
  editor=context.new_page();editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto(base+'/HONRO_WORKSHOP.html');editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene',timeout=60000);project=editor.evaluate('HonroWorkshopAPI.exportProject()');editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine',timeout=60000);frame=editor.frames[1];assert frame.evaluate('HONRO_EMBEDDED&&document.documentElement.classList.contains("honro-embedded")&&!document.querySelector("[data-startup-title]")');results['embedded']=frame.evaluate('({stage:HonroApp.engine.b.honroStage,custom:HonroApp.engine.b.honroCustom,ready:!!HONRO_READY})');editor.click('#stopPlay');assert editor.evaluate('HonroWorkshopAPI.exportProject()')==project
  fail=context.new_page();fail.route(re.compile(r'/engine-core\.[^/]+\.js$'),lambda route:route.abort());fail.goto(base+'/HONRO.html');fail.locator('[data-startup-retry]').wait_for(timeout=60000);assert fail.locator('.title-painting').count()==1;fail.unroute(re.compile(r'/engine-core\.[^/]+\.js$'));fail.locator('[data-startup-retry]').click();fail.wait_for_function('window.HonroApp',timeout=60000);results['errorRetry']={'paintingRetained':True,'retryReloadReady':True};assert not errors,errors;browser.close()
 (OUT/'checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(results,ensure_ascii=False))

def stage_checks():
 results={};errors=[]
 with sync_playwright() as p:
  browser=launch(p);context=browser.new_context(viewport={'width':1440,'height':960});page=context.new_page();base=story_base_url();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp',timeout=60000)
  results['fresh']=page.evaluate("({prepared:HONRO_PROJECT.stages.filter(s=>!s.pending).map(s=>s.metadata.stageId),library:HONRO_PROJECT.library.length,catalog:HONRO_PROJECT.stages.length})");assert results['fresh']['prepared']==[1]
  page.evaluate("HonroApp.frame=()=>{};HonroApp.launch(1);while(HonroApp.dialogue)HonroStory.finish(HonroApp);window.beforeFailed={battle:HonroApp.engine.b,save:localStorage.getItem('honro-first-act-profile-1'),profile:JSON.stringify(HonroApp.profile)};HonroApp.debugMode=true")
  # A failed request keeps the live battle, profile and persisted save. Retry uses
  # the same UI action, with failed fetches evicted from the request cache.
  fail=re.compile(r'/chapter-12\.[^/]+\.json$');page.route(fail,lambda route:route.abort());page.evaluate('HonroApp.launch(12);HonroApp.launch(12)');page.locator('.campaign-loading button',has_text='다시 시도').wait_for(timeout=30000)
  assert page.evaluate("HonroApp.engine.b===beforeFailed.battle&&JSON.stringify(HonroApp.profile)===beforeFailed.profile&&localStorage.getItem('honro-first-act-profile-1')===beforeFailed.save");page.unroute(fail);page.locator('.campaign-loading button',has_text='다시 시도').click();page.wait_for_function('HonroApp.engine?.b.honroStage===12',timeout=30000);results['failedRetry']={'keptBattleAndSave':True,'retriedStage':12}
  # Navigation invalidates a delayed request; another request can use the same
  # in-flight fetch without allowing the first action to replace the new screen.
  page.route(re.compile(r'/chapter-21\.[^/]+\.json$'),lambda route:(time.sleep(.25),route.continue_()))
  page.evaluate('while(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.launch(21);HonroApp.showTitle()');page.wait_for_function('HonroCampaignLoader.has(21)',timeout=30000);assert page.evaluate("HonroApp.screen==='title'&&!HonroApp.engine");results['staleEntryCancelled']=True
  page.evaluate('HonroApp.launch(21)');page.wait_for_function('HonroApp.engine?.b.honroStage===21');page.evaluate("while(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.engine.b.round=3;const u=HonroApp.engine.b.units.find(u=>u.side===0&&u.cls==='archer');u.hp=Math.max(1,u.hp-9);HonroApp.profile.honroBattle=structuredClone(HonroApp.engine.b);HonroApp.profile.lastStage=1;if(HonroApp.profile.honroJourney)delete HonroApp.profile.honroJourney.story;HonroApp.profile.settings.debugMode=false;for(let id=1;id<21;id++)HonroApp.profile.cleared[id]=true;HonroApp.debugMode=false;HonroApp.persist()")
  saved=page.evaluate("JSON.parse(localStorage.getItem('honro-first-act-profile-1'))");stage21=page.evaluate('HONRO_PROJECT.stages.find(s=>s.metadata.stageId===21)');stage1=page.evaluate('HONRO_PROJECT.stages[0]');page.reload();page.wait_for_function('window.HonroApp',timeout=60000)
  assert page.evaluate('HONRO_PROJECT.stages.filter(s=>!s.pending).map(s=>s.metadata.stageId)')==[21];assert page.locator('.title-actions button.primary').get_attribute('data-action')=='continue';page.locator('.title-actions button.primary').click();page.wait_for_function('HonroApp.engine?.b.honroStage===21');assert page.evaluate("HonroApp.engine.b.units.find(u=>u.side===0&&u.cls==='archer').hp")==next(u['hp'] for u in saved['honroBattle']['units'] if u['side']==0 and u.get('cls')=='archer');assert page.evaluate('HonroApp.engine.b.round')==3
  assert page.evaluate('({heroes:HonroApp.profile.heroes,loadouts:HonroApp.profile.loadouts,cleared:HonroApp.profile.cleared})')=={k:saved[k] for k in ['heroes','loadouts','cleared']};results['laterContinue']={'stage':21,'ignoredMisleadingLastStage':True,'hpRoundGrowthLoadoutsClearedPreserved':True}
  # The same six authors produce the same real chapters on the editor route.
  editor=context.new_page();editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto(base+'/HONRO_WORKSHOP.html');editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene',timeout=60000);assert editor.evaluate('HONRO_PROJECT.stages[0]')==stage1;assert editor.evaluate('HONRO_PROJECT.stages[20]')==stage21;results['authorParity']=[1,21]
  page.evaluate('HonroApp.frame=()=>{};while(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.showTitle();HonroApp.debugMode=true;HonroApp.launch(3)');page.wait_for_function('HonroApp.engine?.b.honroStage===3',timeout=30000);results['nextOrJump']={'stage':3,'synchronousAPI':page.evaluate("!(HonroApp.launch(3) instanceof Promise)")};page.evaluate('while(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.retry()');assert page.evaluate('HonroApp.engine.b.honroStage')==3
  editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine',timeout=60000);assert editor.frames[1].evaluate('HONRO_EMBEDDED&&!window.HonroCampaignLoader');results['embeddedFullEditorRoute']=True
  assert not errors,errors;browser.close()
 (OUT/'stage-checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(results,ensure_ascii=False))

if MODE=='entry-checks':
 results={};errors=[]
 with sync_playwright() as p:
  browser=launch(p);page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(story_base_url()+'/HONRO.html');page.wait_for_function('window.HonroApp',timeout=60000)
  page.evaluate("HonroApp.frame=()=>{};HonroApp.launch(1);while(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.profile.cleared={1:true};HonroApp.engine.b.phase='won';HonroApp.done=true;HonroApp.resultDismissed=false;HonroApp.open('<button>다음</button>','result');HonroApp.resultContinue()")
  page.wait_for_function('HonroApp.engine?.b.honroStage===2',timeout=30000);results['directNext']=2
  page.evaluate("while(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.profile.cleared={1:true,2:true,3:true};HonroApp.showMap();HonroRestJourney.requestLaunch(HonroApp,4,'next')")
  page.wait_for_function('HonroApp.pendingJourneyLaunch?.id===4',timeout=30000);assert page.evaluate('HonroApp.profile.honroBattle.honroStage')==2;page.locator('[data-action="confirm-journey-launch"]').click();page.wait_for_function('HonroApp.engine?.b.honroStage===4',timeout=30000);results['journeyConfirmedJump']=4;assert not errors,errors;browser.close()
 (OUT/'entry-checks.json').write_text(json.dumps(results,indent=2));print(json.dumps(results));sys.exit(0)

if MODE=='stage-checks':
 stage_checks();sys.exit(0)

if MODE=='mobile':
 with sync_playwright() as p:
  browser=launch(p);page=browser.new_page(viewport={'width':390,'height':844});page.goto(story_base_url()+'/HONRO.html');page.wait_for_function('window.HonroApp');page.wait_for_function('[...document.querySelectorAll(".title-painting img,.honro-logo")].every(i=>i.complete&&i.naturalWidth)');assert page.evaluate('document.documentElement.scrollWidth===innerWidth');assert 'title-portrait.' in page.locator('.title-painting img').evaluate('(img)=>img.currentSrc');page.screenshot(path=str(OUT/'title-ready-mobile.png'));browser.close();print('PASS portrait title and controls fit 390x844')
 sys.exit(0)

if MODE=='checks':
 checks();sys.exit(0)

rows=[]
with sync_playwright() as p:
 browser=launch(p);base=story_base_url()
 for name,width,height in [('desktop',1440,960),('mobile-viewport',390,844)]:
  context=browser.new_context(viewport={'width':width,'height':height});page=context.new_page();errors=[];finished=[];page.on('pageerror',lambda e:errors.append(str(e)));page.add_init_script(INIT)
  page.route(re.compile(r'/web/(runtime/(load-data|campaign)\.[^/]+\.js|entries/game\.[^/]+\.js)$'),instrument)
  cdp=context.new_cdp_session(page);cdp.send('Network.enable');cdp.send('Network.setCacheDisabled',{'cacheDisabled':True});cdp.send('Network.emulateNetworkConditions',{'offline':False,'latency':40,'downloadThroughput':2*1024*1024,'uploadThroughput':1024*1024,'connectionType':'wifi'});cdp.send('Emulation.setCPUThrottlingRate',{'rate':4});cdp.on('Network.loadingFinished',lambda e:finished.append(e))
  page.goto(base+'/HONRO.html',wait_until='commit');page.wait_for_function('__startup.appReady&&__startup.titlePaint',timeout=120000);page.wait_for_timeout(500)
  result=page.evaluate('''()=>({...__startup,marks:performance.getEntriesByType('mark').map(e=>({name:e.name,ms:e.startTime})),resources:performance.getEntriesByType('resource').map(e=>({name:e.name.split('/').at(-1),type:e.initiatorType,bytes:e.encodedBodySize,start:e.startTime,end:e.responseEnd,ms:e.duration})),title:{buttons:[...document.querySelectorAll('.title-actions button')].map(b=>b.textContent),ready:!!window.HonroApp}})''')
  row={'viewport':name,'conditions':{'cpuSlowdown':4,'latencyMs':40,'downloadBytesPerSecond':2*1024*1024,'cache':'new isolated context, disabled'},'titlePaintMs':result['titlePaint'],'appReadyMs':result['appReady'],'requests':len(finished),'transferBytes':sum(e['encodedDataLength'] for e in finished),'longTaskCount':len(result['longTasks']),'longTaskTotalMs':sum(e['ms'] for e in result['longTasks']),'longestTaskMs':max((e['ms'] for e in result['longTasks']),default=0),'detail':result,'errors':errors}
  row['preReadyBodyBytes']=sum(r['bytes'] for r in result['resources'] if r['end']<=result['appReady']);row['preReadyChapters']=[r['name'] for r in result['resources'] if re.match(r'chapter-\d+\.[^.]+\.json$',r['name']) and r['start']<=result['appReady']];row['fullLibraryBeforeReady']=any(r['name'].startswith('campaign-library.') and r['start']<=result['appReady'] for r in result['resources']);
  assert not errors,errors;rows.append(row);print(json.dumps({k:v for k,v in row.items() if k!='detail'}),flush=True);context.close()
 browser.close()
(OUT/(MODE+'.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2))
