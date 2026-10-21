"""Unedited sequential screenshots of the cliff establishing-shot → reverse-shot pan."""
import json,base64
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/dialogue-camera-motion/pan';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=launch(p);rows=[];errors=[]
 for device,size in [('desktop',{'width':1280,'height':800}),('mobile',{'width':390,'height':844})]:
  context=browser.new_context(viewport=size);page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://localhost:8014/HONRO.html');page.wait_for_function('window.HonroApp',timeout=120000)
  page.evaluate('''()=>{const a=HonroApp;a.profile=HONRO_TOOLS.fresh();a.profile.cleared[1]={};a.launch(2);}''');page.wait_for_function('HonroApp.engine?.b.honroStage===2&&HonroApp.dialogue');page.evaluate('''()=>{while(HonroApp.dialogue.index<3)HonroStory.next(HonroApp);}''');page.wait_for_timeout(650)
  page.screenshot(path=str(OUT/f'{device}-before.png'))
  boundary=page.evaluate('''()=>{const s=HonroApp.scene;window.panStart=performance.now();const before={x:s.x,y:s.y,scale:s.scale};document.querySelector('[data-action="dialogue-next"]').click();return{before,after:{x:s.x,y:s.y,scale:s.scale}};}''');assert boundary['before']==boundary['after']
  frames=[];cdp=context.new_cdp_session(page)
  for deadline in [0,60,120,200,280,360,460,620]:
   elapsed=page.evaluate('performance.now()-panStart');page.wait_for_timeout(max(0,deadline-elapsed));name=f'{device}-{deadline:03}.png';capture=cdp.send('Page.captureScreenshot',{'format':'png','fromSurface':True,'captureBeyondViewport':False});(OUT/name).write_bytes(base64.b64decode(capture['data']));frames.append(page.evaluate('''image=>({image,elapsed:performance.now()-panStart,x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale,target:HonroApp.scene.storyFrameReport.targetCamera})''',name))
  rows.append({'device':device,'boundary':boundary,'frames':frames});context.close()
 browser.close();assert not errors;(OUT/'frames.json').write_text(json.dumps({'sequences':rows,'errors':errors},ensure_ascii=False,indent=2));print('PASS desktop/mobile pan input boundaries and 16 sequential frames')
