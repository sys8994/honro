import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
f=json.loads((Path(__file__).resolve().parents[2] / 'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];f['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,33)};f['lastStage']=33;f['mapNode']=33;f.pop('honroBattle',None)
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page();p.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8774/HONRO.html'));p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',f);p.reload();p.wait_for_function('window.HonroApp');p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(33);HonroApp.launch(33)}''');p.wait_for_function('HonroApp.engine?.b?.honroStage===33');p.wait_for_timeout(1500)
 for i in range(15):
  if not p.evaluate('!!HonroApp.dialogue'):break
  p.keyboard.press('Enter');p.wait_for_timeout(500)
 p.wait_for_function('HonroApp.canInput()',timeout=30000);p.keyboard.press('f');p.wait_for_function("HonroApp.engine?.b?.side===0 && HonroApp.engine?.b?.phase==='aim' && HonroApp.engine?.active?.id!=='archer' && HonroApp.canInput()",timeout=60000);p.wait_for_function('!HonroApp.dirty',timeout=30000);p.wait_for_timeout(3500)
 get='''()=>{let a=HonroApp,e=a.engine,u=e.active,s=JSON.parse(localStorage.getItem('honro-first-act-profile-1')).honroBattle;let v=s?.units?.find(x=>x.id===u.id);return {live:{x:u.x,y:u.y,moveLeft:u.moveLeft,id:u.id},saved:v&&{x:v.x,y:v.y,moveLeft:v.moveLeft},dirty:a.dirty}}'''
 print('before',p.evaluate(get),flush=True);p.keyboard.down('ArrowRight');p.wait_for_timeout(500);p.keyboard.up('ArrowRight');p.wait_for_timeout(10);before_reload=p.evaluate(get);print('pre-pagehide',before_reload,flush=True);assert before_reload['dirty'] and before_reload['live']['x']!=before_reload['saved']['x']
 p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===33',timeout=30000);p.wait_for_timeout(500);restored=p.evaluate(get);print('reload',restored,flush=True);assert restored['live']==before_reload['live'];b.close()
