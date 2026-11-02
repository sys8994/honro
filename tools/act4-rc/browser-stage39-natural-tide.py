import json
from pathlib import Path
from playwright.sync_api import sync_playwright
f=json.loads(Path('/workspace/honro-act4-rc/tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];f['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,39)};f['lastStage']=39;f['mapNode']=39;f.pop('honroBattle',None)
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});p.goto('http://127.0.0.1:8774/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',f);p.reload();p.wait_for_function('window.HonroApp');p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(39);HonroApp.launch(39)}''');p.wait_for_function('HonroApp.engine?.b?.honroStage===39');p.wait_for_timeout(1000)
 for i in range(60):
  a=p.evaluate('''()=>({r:HonroApp.engine.b.round,side:HonroApp.engine.b.side,can:HonroApp.canInput(),dlg:!!HonroApp.dialogue,phase:HonroApp.engine.b.phase,active:HonroApp.engine.b.active})''');print('step',i,a,flush=True)
  if a['r']>=2 and a['side']==0 and a['phase']=='aim':break
  if a['dlg']:p.keyboard.press('Enter')
  elif a['can']:p.keyboard.press('f')
  p.wait_for_timeout(1000)
 p.mouse.move(720,450);p.mouse.wheel(0,2000);p.wait_for_timeout(800)
 for i in range(5):
  if p.evaluate('!!HonroApp.dialogue'):
   p.keyboard.press('Enter');p.wait_for_timeout(700);continue
  q=p.evaluate('''()=>{let a=HonroApp,q=HonroAct4TerrainPreview.eventAPI.memory(a.engine.b);return {scene:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},obs:q.observed,bark:q.bark?.key,phase:q.tide?.phase}}''');print('camera',i,q,flush=True)
  if q['bark']:break
  p.mouse.move(900,600);p.mouse.down();p.mouse.move(500,350,steps=10);p.mouse.up();p.wait_for_timeout(900)
 p.screenshot(path='/tmp/stage39-tide-probe.png');p.wait_for_timeout(3000);b.close()
