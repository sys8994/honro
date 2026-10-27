"""Actual journal UI; prior completion/growth are fixtures. No terrain/encounter changes."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-journal-art';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8772/HONRO.html');page.wait_for_function('!!window.HonroAct4Campaign')
 page.evaluate("()=>{const a=HonroApp;a.frame=()=>{};for(let n=1;n<=40;n++)a.profile.cleared[n]={visits:1};a.profile.lastStage=40;HonroRestJourney.showBook(a,31);HonroRestJourney.fitBook(a);}")
 page.wait_for_function('document.querySelector(".journey-map-image")?.naturalWidth===1586');assert page.locator('.journey-image-status').is_hidden();assert page.locator('.journey-pin').count()==10;assert page.locator('.journey-progress path[data-from]').count()==9
 rows=[]
 for kind,size in [('desktop',{'width':1440,'height':1000}),('mobile',{'width':390,'height':844})]:
  page.set_viewport_size(size);page.evaluate('HonroApp.journeyZoom=1;HonroRestJourney.showBook(HonroApp,31)');page.wait_for_timeout(150);page.screenshot(path=str(OUT/f'{kind}-default-map.png'));page.evaluate('HonroRestJourney.fitBook(HonroApp)');page.wait_for_timeout(150);page.screenshot(path=str(OUT/f'{kind}-whole-map.png'))
  for n in range(31,41):
   pin=page.locator(f'.journey-pin[data-id="{n}"]');pin.click();assert pin.get_attribute('aria-pressed')=='true';assert page.evaluate('HonroApp.journeySelection')==('end' if n==40 else n)
  page.locator('.journey-pin[data-id="36"]').click();page.locator('.journey-map-scroll').focus();page.keyboard.press('Equal');page.wait_for_timeout(100);page.screenshot(path=str(OUT/f'{kind}-inland-selection.png'))
  page.locator('[data-action="journey-fit"]').click();page.locator('.journey-pin[data-id="31"]').click();page.screenshot(path=str(OUT/f'{kind}-estuary-selection.png'))
  rows.append({'kind':kind,'allTenPointerSelections':True,'zoom':page.evaluate('HonroApp.journeyZoom'),'image':page.locator('.journey-map-image').get_attribute('src')})
 # Enter through the journal's ordinary current-stage route, retaining the campaign's own guards.
 page.evaluate("()=>{const a=HonroApp;for(let n=31;n<=40;n++)delete a.profile.cleared[n];a.profile.lastStage=30;a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];for(const c of a.profile.recruited)a.profile.heroes[c].xp=HONRO_CORE.xpAtLevel(22);HonroRestJourney.showBook(a,31);}")
 page.evaluate('HonroRestJourney.requestLaunch(HonroApp,31,"next")');page.wait_for_function('HonroApp.engine?.b.honroStage===31');assert page.evaluate('HonroApp.engine.b.honroAct4Official')==1
 assert not errors,errors;(OUT/'journal-ui.json').write_text(json.dumps({'scope':__doc__,'rows':rows,'entry':31,'errors':errors},ensure_ascii=False,indent=2));print('PASS actual raster map; desktop/mobile ten pointer selections; keyboard zoom/fit; normal current-stage entry; no page errors');b.close()
