"""Actual UI wheel, drag and movement with autosave; declared synthetic entry."""
import json,math,os,sys,statistics,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];tag=sys.argv[1];out=root/'_local/act4-perf';out.mkdir(parents=True,exist_ok=True);f=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];f['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,38)};f.update(lastStage=38,mapNode=38);f.pop('honroBattle',None)
with sync_playwright() as w:
 browser=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1);p=context.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(f,ensure_ascii=False))+');');p.goto(os.environ.get('HONRO_QA_BASE','http://127.0.0.1:8771')+'/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader',timeout=90000);p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(38);HonroApp.launch(38)}''');p.wait_for_function('HonroApp.engine?.b?.honroStage===38',timeout=90000)
 for _ in range(30):
  if p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter');p.wait_for_timeout(250)
  else:
   p.wait_for_timeout(500)
   if not p.evaluate('!!HonroApp.dialogue'):break
 p.evaluate("HonroApp.frame=()=>{};HonroApp.scene.storyTween=null;HonroApp.scene.cinematic=null;HonroApp.scene.manual=true")
 p.wait_for_timeout(100)
 data=p.evaluate("""async()=>{const a=HonroApp,e=a.engine,u=e.active,c=HONRO_CORE,s=a.scene;const before=JSON.stringify(e.b),r=[];for(const id of ['A01','A02','A05','A14'])for(const angle of [15,44,75])for(const ignore of [false,true]){const prediction=e.predict(u,c.SKILLS[id],angle,.6,undefined,true,ignore);r.push({id,angle,ignore,prediction});}s.x=765.9574468;s.y=1758.65;s.scale=1.65;s.time=2.5;s.render(e,0,a.selected,a.power,false,0,false);const bytes=s.canvas.getContext('2d').getImageData(0,0,s.canvas.width,s.canvas.height).data,hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');return {r,hash,unchanged:before===JSON.stringify(e.b),rng:e.b.rng,unit:[u.x,u.y],stage:e.b.honroStage}}""")
 (out/f'stage38-projection-parity-{tag}.json').write_text(json.dumps(data,sort_keys=True));print('parity',tag,'unchanged',data['unchanged'],'hash',data['hash'],'rng',data['rng'],'unit',data['unit'],flush=True);context.close();browser.close()
