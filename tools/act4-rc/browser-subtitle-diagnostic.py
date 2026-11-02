import json
from pathlib import Path
from playwright.sync_api import sync_playwright
f=json.loads(Path('/workspace/honro-act4-rc/tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];f['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,35)};f['lastStage']=35;f['mapNode']=35;f.pop('honroBattle',None)
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width,height in [(1440,900),(375,812),(844,390)]:
  p=b.new_page(viewport={'width':width,'height':height});p.goto('http://127.0.0.1:8774/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',f);p.reload();p.wait_for_function('window.HonroApp');p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(35);HonroApp.launch(35)}''');p.wait_for_function('HonroApp.engine?.b?.honroStage===35');p.wait_for_timeout(1200)
  for i in range(15):
   if not p.evaluate('!!HonroApp.dialogue'):break
   p.keyboard.press('Enter');p.wait_for_timeout(350)
  p.wait_for_function('HonroApp.canInput()',timeout=30000)
  ok=p.evaluate("HonroAct4TerrainPreview.eventAPI.play(HonroApp,'blocked_shot',true)");assert ok
  p.wait_for_function("document.getElementById('act4-banter') && !document.getElementById('act4-banter').hidden");print('bark visible',width,height,flush=True)
  simultaneous=p.evaluate('''()=>{const q=HonroAct4TerrainPreview.eventAPI.memory(HonroApp.engine.b),n=document.getElementById('act4-banter'),g=document.getElementById('banter'),elapsed=q.bark.elapsed;g.hidden=false;HonroAct4TerrainPreview.observe(HonroApp,.5);const r={hidden:n.hidden,elapsed:q.bark.elapsed,original:elapsed};g.hidden=true;return r}''');assert simultaneous['hidden'] and simultaneous['elapsed']==simultaneous['original'],simultaneous;print('generic priority',width,height,flush=True)
  p.keyboard.press('Escape');p.wait_for_timeout(300);v=p.evaluate("({hidden:document.getElementById('act4-banter').hidden,elapsed:HonroAct4TerrainPreview.eventAPI.memory(HonroApp.engine.b).bark?.elapsed})");p.wait_for_timeout(1000);v2=p.evaluate("({hidden:document.getElementById('act4-banter').hidden,elapsed:HonroAct4TerrainPreview.eventAPI.memory(HonroApp.engine.b).bark?.elapsed})");assert v['hidden'] and v2['hidden'] and v['elapsed']==v2['elapsed'],(v,v2);p.keyboard.press('Escape');p.wait_for_timeout(300);print('modal pause',width,height,flush=True)
  p.evaluate("HonroApp.showTitle()");p.wait_for_timeout(200);assert p.evaluate("!document.getElementById('act4-banter') || document.getElementById('act4-banter').hidden");print('title cleanup',width,height,flush=True);p.close()
 b.close()
