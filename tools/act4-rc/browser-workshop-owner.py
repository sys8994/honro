"""Isolated real Workshop Playtest owner-storage check."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];f=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];base=os.environ.get('HONRO_QA_BASE','http://127.0.0.1:8774')
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1280,'height':800});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base+'/HONRO_WORKSHOP.html');p.wait_for_function('window.HonroWorkshopAPI');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',f);before=p.evaluate("localStorage.getItem('honro-first-act-profile-1')")
 # Existing Workshop test API selects the built-in stage and opens the real embedded iframe.
 p.evaluate("HonroWorkshopAPI.selectStage('stage-2')");p.evaluate("HonroWorkshopAPI.startPlaytest('start')");p.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine?.b.honroStage===2',timeout=60000);frame=p.locator('#runtimeFrame').element_handle().content_frame();assert frame.evaluate('HONRO_EMBEDDED===true');assert p.evaluate("localStorage.getItem('honro-first-act-profile-1')")==before
 for _ in range(15):
  if not frame.evaluate('!!HonroApp.dialogue'):break
  frame.locator('body').press('Enter');p.wait_for_timeout(250)
 frame.locator('body').press('f');p.wait_for_timeout(1200);assert p.evaluate("localStorage.getItem('honro-first-act-profile-1')")==before;p.locator('#stopPlay').click();p.wait_for_timeout(500);assert p.evaluate("localStorage.getItem('honro-first-act-profile-1')")==before and not errors;print('embedded stage 2 / action / stop: campaign bytes unchanged; errors',errors,flush=True);b.close()
