"""Actual browser image decode/retry; stage unlocks are fixtures, no combat changes."""
import json,pathlib,os
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/journey-image-format';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8772')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':1280,'height':900});errors=[];responses=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:responses.append({'url':r.url,'status':r.status,'type':r.headers.get('content-type')}) if 'journey-map-act' in r.url else None)
 page.goto(BASE+'/HONRO.html');page.wait_for_function('!!window.HonroApp')
 page.evaluate("()=>{const a=HonroApp;a.frame=()=>{};for(let n=1;n<=40;n++)a.profile.cleared[n]={visits:1};a.profile.lastStage=40;}")
 for act in [1,2,3]:
  page.evaluate('act=>HonroRestJourney.showBook(HonroApp,(act-1)*10+1)',act);page.wait_for_function('()=>document.querySelector(".journey-map-image")?.naturalWidth>0')
  assert page.locator('.journey-image-status').is_hidden();assert page.locator('.journey-pin').count()==10
 # An actual failed request must retain place controls and offer the existing retry.
 attempts=[]
 def fail_once(route):
  attempts.append(route.request.url)
  if len(attempts)==1:route.abort('failed')
  else:route.continue_()
 page.route('**/journey-map-act4.*',fail_once)
 page.evaluate('HonroRestJourney.showBook(HonroApp,31)');page.wait_for_function('HonroJourneyImages.cacheInfo().some(v=>v.act===4&&v.state==="error")')
 assert page.locator('.journey-pin').count()==10;page.locator('[data-action="journey-image-retry"]').click();page.wait_for_function('()=>document.querySelector(".journey-map-image")?.naturalWidth>0')
 assert page.locator('.journey-image-status').is_hidden();row=page.evaluate('({src:document.querySelector(".journey-map-image").src,width:document.querySelector(".journey-map-image").naturalWidth,height:document.querySelector(".journey-map-image").naturalHeight})');assert row['src'].endswith('.svg') and abs(row['width']/row['height']-1.6)<.001,row
 assert any(r['url']==row['src'] and r['status']==200 and 'image/svg+xml' in r['type'] for r in responses),responses
 page.screenshot(path=str(OUT/'act4-decoded.png'));assert not errors,errors
 (OUT/'result.json').write_text(json.dumps({'scope':__doc__,'responses':responses,'forcedFailure':attempts[0],'act4':row,'errors':errors},ensure_ascii=False,indent=2));print('PASS four journal maps actual decode/HTTP200; SVG content type; failed request preserves10 pins; visible retry succeeds; no page errors');b.close()
