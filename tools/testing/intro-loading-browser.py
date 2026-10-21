"""Focused loading regressions; local Chromium, not a full campaign playthrough."""
import json,re,sys,subprocess,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch
from story_browser_server import story_base_url
from playwright.sync_api import sync_playwright
OUT=ROOT/'_local/reports/intro-audit';OUT.mkdir(parents=True,exist_ok=True)
checks={}
with sync_playwright() as p:
 browser=launch(p);context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);page=context.new_page();errors=[];requests=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url));base=story_base_url();page.goto(base+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady')
 assert page.locator('[data-action="import-map"]').count()==0
 assert page.locator('#map-import').count()==1 and page.evaluate("typeof HonroApp.launchMap==='function'")
 assert not any('honro_act2_far_data-' in u and '.svg' in u for u in requests)
 assert page.evaluate("Object.keys(HonroAct1Background.images).every(k=>!!Object.getOwnPropertyDescriptor(HonroAct1Background.images,k).get)")
 assert page.evaluate('Object.keys(HONRO_SVG_SOURCES).length')==4
 assert page.evaluate('HONRO_PROJECT.stages.filter(s=>!s.pending).map(s=>s.metadata.stageId)')==[1]
 page.screenshot(path=str(OUT/'verified-title.png'));checks['title']={'noWorkshopButton':True,'developmentAPIsPreserved':True,'act2SVGRequests':0,'act1ImagesNotCreated':True,'restSVGSourceCount':4,'prepared':[1]}
 page.locator('.title-actions button.primary').click();page.wait_for_function("HonroApp.screen==='rest'&&HonroApp.audio.context?.state==='running'");page.screenshot(path=str(OUT/'verified-rest.png'));checks['newStartAndAudio']=True
 page.evaluate('HonroApp.debugMode=true;HonroApp.launch(11)');page.wait_for_function('HonroApp.engine?.b.honroStage===11');page.wait_for_function('HonroAuthoredFarArt.ready(11)');page.screenshot(path=str(OUT/'verified-stage11.png'))
 assert any('honro_act2_far_data-stage11-ravine' in u for u in requests)
 assert not any('honro_act2_far_data-dawn.' in u for u in requests)
 checks['stage11']={'imageFarReady':True,'requestedOwnFallbackOnly':True}
 page.evaluate('HonroApp.launch(20)');page.wait_for_function('HonroApp.engine?.b.honroStage===20');page.wait_for_function('HonroAuthoredFarArt.ready(20)');checks['stage20Transition']=True
 page.evaluate('window.sameImage=HonroAct1Background.imageFor(1)');page.wait_for_function('sameImage.complete&&sameImage.naturalWidth>0');assert page.evaluate('sameImage===HonroAct1Background.imageFor(1)');checks['fallbackImageIdentityAndDecode']=True
 assert not errors,errors
 # A failed required source leaves the title and offers the existing reload retry.
 fail=context.new_page();pattern=re.compile(r'/honro_act1_far_data-mountains\.[^/]+\.svg$');fail.route(pattern,lambda route:route.abort());fail.goto(base+'/HONRO.html');fail.locator('[data-startup-retry]').wait_for(timeout=30000);assert fail.locator('.title-painting').count()==1;fail.unroute(pattern);fail.locator('[data-startup-retry]').click();fail.wait_for_function('document.documentElement.dataset.honroReady',timeout=30000);checks['startupSourceErrorRetry']=True
 # Load the exact base commit HTML against the retained immutable assets.
 old=subprocess.check_output(['git','show','544825ee77930756dd28ce056ab15e12bb885278:HONRO.html'],cwd=ROOT,text=True).replace('<head>','<head><base href="/">',1)
 (OUT/'old-entry.html').write_text(old);cached=context.new_page();cached.goto(base+'/_local/reports/intro-audit/old-entry.html');cached.wait_for_function('document.documentElement.dataset.honroReady',timeout=30000);assert cached.locator('[data-action="import-map"]').count()==1;checks['previousHTMLRetainedAssets']=True
 browser.close()
(OUT/'regressions.json').write_text(json.dumps(checks,indent=2));print(json.dumps(checks))
