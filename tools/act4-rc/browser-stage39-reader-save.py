import json
from pathlib import Path
from playwright.sync_api import sync_playwright
f=json.loads(Path('/workspace/honro-act4-rc/tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];f['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,39)};f['lastStage']=39;f['mapNode']=39;f.pop('honroBattle',None)
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});p.goto('http://127.0.0.1:8774/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',f);p.reload();p.wait_for_function('window.HonroApp && window.HonroAct4PilotCombat');p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(39);HonroApp.launch(39)}''');p.wait_for_function('HonroApp.engine?.b?.honroStage===39');p.wait_for_timeout(1000)
 for i in range(60):
  a=p.evaluate('''()=>({r:HonroApp.engine.b.round,side:HonroApp.engine.b.side,can:HonroApp.canInput(),dlg:!!HonroApp.dialogue,phase:HonroApp.engine.b.phase,active:HonroApp.engine.b.active})''');print('step',i,a,flush=True)
  if a['r']>=2 and a['side']==0 and a['phase']=='aim':break
  if a['dlg']:p.keyboard.press('Enter')
  elif a['can']:p.keyboard.press('f')
  p.wait_for_timeout(1000)
 p.mouse.move(720,450);p.mouse.wheel(0,2000);p.wait_for_timeout(800)
 p.wait_for_function('!!HonroApp.dialogue',timeout=15000)
 get="""()=>{const a=HonroApp,q=HonroAct4TerrainPreview.eventAPI.memory(a.engine.b),s=JSON.parse(localStorage.getItem('honro-first-act-profile-1')).honroBattle?.honroAct4PreviewState;return {dialogue:a.dialogue&&{id:a.dialogue.id,index:a.dialogue.index,lines:a.dialogue.lines.length},live:{clock:q.clock,reader:q.reader,events:q.events},saved:{clock:s?.clock,reader:s?.reader,events:s?.events},dirty:a.dirty}}"""
 p.keyboard.press('Enter');p.wait_for_timeout(300);assert p.evaluate('HonroApp.dialogue?.index')==1;print('BEFORE',json.dumps(p.evaluate(get),ensure_ascii=False),flush=True);p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===39',timeout=30000);p.wait_for_timeout(500);assert p.evaluate('HonroApp.dialogue?.index')==1;print('AFTER',json.dumps(p.evaluate(get),ensure_ascii=False),flush=True);p.screenshot(path='/tmp/stage39-reader-reload.png');b.close()
