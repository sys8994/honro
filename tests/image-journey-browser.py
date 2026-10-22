"""Actual Chromium image journal evidence. Cleared progress is an explicit fixture;
this is navigation/loading/input QA, not a campaign playthrough or phone test."""
import json,re
from browser_support import launch,serve_game,ROOT
from playwright.sync_api import sync_playwright
OUT=ROOT/'game/docs/image-journey-clean-settings/evidence';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];network=[]
def check(name,value):
 assert value,name
 checks.append(name);print('PASS',name,flush=True)
def shot(page,name):
 path=OUT/(name+'.jpg');page.screenshot(path=str(path),type='jpeg',quality=82);assert path.stat().st_size<1000000
SEED='''(count)=>{const a=HonroApp;a.stopBattle();a.engine=null;a.close();a.dialogue=null;a.profile=JSON.parse(window.freshProfile);a.normalProfile=a.profile;a.debugMode=false;a.profile.cleared={};for(let id=1;id<=count;id++)a.profile.cleared[id]={visits:1,rounds:5};a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];a.profile.seen={};a.profile.honroBattle=null;a.journeyZoom=1;a.journeySelection=null;a.screen='title';}'''
def settle(page):page.wait_for_function("document.querySelector('.journey-map-image')?.complete && document.querySelector('.journey-map-image').naturalWidth>0")
with serve_game() as url,sync_playwright() as p:
 b=launch(p);page=b.new_page(viewport={'width':390,'height':844},has_touch=True)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:network.append(r.url) if 'journey-map-act' in r.url else None)
 page.goto(url+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate('window.freshProfile=JSON.stringify(HonroApp.profile)')
 check('title has no map request',not network)
 page.click('.title-actions [data-action=rest]');page.evaluate('for(let n=0;HonroApp.dialogue&&n<40;n++)HonroStory.finish(HonroApp)')
 page.click('[data-action=camp]');page.locator('.top [aria-label=뒤로]').click();page.wait_for_timeout(450);check('intro/rest/camp do not request maps',not network)
 page.click('[data-action=journey-book]');settle(page)
 check('fresh progress only loads Act1 and emits no secret locked labels',len(network)==1 and page.locator('[data-action=journey-select]').count()==1 and page.locator('[data-action=journey-act][data-id="2"]').is_disabled())
 shot(page,'fresh-act1-gate-390x844')
 page.evaluate('HonroRestJourney.showBook(HonroApp,null,null,2)');settle(page);check('direct attempt cannot load locked Act2',len(network)==1 and page.evaluate('HonroApp.journeyAct')==1)
 page.evaluate(SEED,29)
 for w,h in [(360,800),(390,844),(844,390),(1280,900)]:
  page.set_viewport_size({'width':w,'height':h})
  for act,selected in [(1,5),(2,18),(3,25)]:
   page.evaluate('([act,id])=>HonroRestJourney.showBook(HonroApp,id,null,act)',[act,selected]);settle(page)
   check(f'{w}x{h} Act{act}: exactly ten canonical destinations; no layer toggle',page.locator('[data-action=journey-select]').count()==10 and not page.locator('[data-action=journey-layer]').count())
   dims=page.locator('.journey-map').evaluate('(n)=>({w:n.clientWidth,h:n.clientHeight})');native=[(1536,1024),(1024,1536),(1254,1254)][act-1]
   check(f'{w}x{h} Act{act}: native aspect and selected hit area',abs(dims['w']/dims['h']-native[0]/native[1])<.005 and page.locator(f'[data-action=journey-select][data-id="{selected}"]').bounding_box()['width']>=44)
   anchor_error=page.evaluate('''()=>{const m=document.querySelector('.journey-map'),r=m.getBoundingClientRect(),d=HonroJourneyImages.definition(HonroApp.journeyAct);return Math.max(...[...m.querySelectorAll('.journey-pin')].map(p=>{const a=d.stages.find(a=>a.stageNumber===+p.dataset.id),v=p.querySelector('i').getBoundingClientRect();return Math.max(Math.abs(v.x+v.width/2-(r.x+a.x/d.width*r.width)),Math.abs(v.y+v.height/2-(r.y+a.y/d.height*r.height)));}));}''')
   check(f'{w}x{h} Act{act}: circles align with native anchors',anchor_error<1)
   shot(page,f'act{act}-fixture-{w}x{h}')
   before=page.evaluate('JSON.stringify(HonroApp.profile)');page.locator(f'[data-action=journey-select][data-id="{selected}"]').click()
   check(f'{w}x{h} Act{act}: selection stays in journal and does not mutate save',page.evaluate('HonroApp.screen')=='journey' and before==page.evaluate('JSON.stringify(HonroApp.profile)'))
   vp=page.locator('.journey-map-scroll');box=vp.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);old=page.evaluate('HonroApp.journeyZoom');page.mouse.wheel(0,-180);page.wait_for_timeout(30);check(f'{w}x{h} Act{act}: wheel zoom',page.evaluate('HonroApp.journeyZoom')>old)
   page.click('[data-action=journey-center]');page.click('[data-action=journey-zoom][data-id=out]')
   if w==1280:
    page.click('[data-action=journey-fit]');shot(page,f'act{act}-fixture-overview-1280x900')
 # Pinch-like pointer events drive the actual production gesture handler, without
 # claiming a physical touchscreen. Drag must not select a pin on pointerup.
 page.set_viewport_size({'width':390,'height':844});page.evaluate('HonroRestJourney.showBook(HonroApp,18,null,2)');settle(page)
 session=page.context.new_cdp_session(page)
 session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'id':11,'x':100,'y':240},{'id':12,'x':240,'y':240}]})
 session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'id':11,'x':70,'y':240},{'id':12,'x':300,'y':260}]})
 session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 check('pinch handler changes zoom',page.evaluate('HonroApp.journeyZoom')>1)
 page.set_viewport_size({'width':844,'height':390});page.click('[data-action=journey-center]');shot(page,'rotation-act2-bell-fixture-844x390')
 check('rotation keeps CTA and recenter visible',page.locator('[data-action=journey-travel]').is_visible() and page.locator('[data-action=journey-center]').is_visible())
 check('bounded decoded cache retains at most two images',page.evaluate('HonroJourneyImages.cacheInfo().length')<=2)
 resources=page.evaluate("performance.getEntriesByType('resource').filter(r=>r.name.includes('journey-map-act')).map(r=>({name:r.name,transfer:r.transferSize,encoded:r.encodedBodySize,decoded:r.decodedBodySize}))")
 # Force decode failure in a distinct context, leaving the ten stage controls live.
 failed=b.new_page(viewport={'width':390,'height':844});failed.on('pageerror',lambda e:errors.append(str(e)));failed.route('**/journey-map-act2.*.webp',lambda r:r.abort())
 failed.goto(url+'/HONRO.html');failed.wait_for_function('window.HonroApp');failed.evaluate('window.freshProfile=JSON.stringify(HonroApp.profile)');failed.evaluate(SEED,29);failed.evaluate('HonroRestJourney.showBook(HonroApp,18,null,2)');failed.wait_for_selector('[data-action=journey-image-retry]')
 check('decode failure retains clickable landmarks and a retry',failed.locator('[data-action=journey-select]').count()==10);shot(failed,'act2-decode-failure-fixture-390x844')
 failed.unroute('**/journey-map-act2.*.webp');failed.click('[data-action=journey-image-retry]');settle(failed);check('failed map can retry successfully',failed.locator('.journey-map-image').count()==1)
 check('no runtime page errors',not errors)
 (OUT/'map-browser-results.json').write_text(json.dumps({'checks':checks,'errors':errors,'requests':network,'resources':resources,'scope':'unlocked-progress fixtures, actual desktop Chromium, not real-phone or full-campaign proof'},ensure_ascii=False,indent=2))
 b.close()
