"""Explicit shore-entry fixture: real Chromium engine jump, recovery and render.
This isolates water boundaries; it is separate from the normal-input campaign run.
"""
import json,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];out=R/'_local/reports/stage5-review/water-browser';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto('http://127.0.0.1:8842/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader',timeout=90000)
 fixture=json.loads((R/'_local/reports/stage5-review/browser-entry-fixture/trace.json').read_text())['profile']
 p.evaluate('''async profile=>{await HonroCampaignLoader.ensureStage(5);const a=HonroApp;a.profile=profile;a.debugMode=false;a.profile.settings.sound=false;a.profile.settings.music=false;a.launch(5);for(let i=0;i<20&&a.dialogue;i++)HonroStory.finish(a);a.close();a.turnNotice=null;a.frame=()=>{};}''',fixture)
 p.wait_for_function('HonroAuthoredFarArt.ready(5)',timeout=90000)
 initial=p.evaluate('''()=>{const a=HonroApp,e=a.engine,u=e.unit('p-archer');Object.assign(u,{x:4060,y:2860,moveLeft:u.maxMove,vx:0,vy:0,acted:false});e.b.active=u.id;e.b.phase='aim';e.b.side=0;e.tick(0);const before={hp:u.hp,maxHp:u.maxHp};if(!e.jump(u))throw Error('actual jump unavailable');for(let i=0;i<300&&!u.waterRecovery&&!u.dead;i++){if(e.canAct())e.move(1,1/60);e.tick(1/60);}if(!u.waterRecovery)throw Error('No deep water entry');e.tick(.15);a.updateHUD(true);return{before,after:{hp:u.hp,acted:u.acted,moveLeft:u.moveLeft,recovery:u.waterRecovery},active:e.b.active,canAct:e.canAct(),durable:!!a.profile.honroBattle?.units.find(v=>v.id===u.id)?.waterRecovery};}''')
 def shot(name,width,height):
  p.set_viewport_size({'width':width,'height':height});p.wait_for_timeout(150);p.evaluate('''()=>{const a=HonroApp,s=a.scene,u=a.engine.unit('p-archer');a.turnNotice=null;document.getElementById('turn-banner').hidden=true;Object.assign(s,{x:u.x+100,y:2870,scale:.6,manual:true,cinematic:null,storyTween:null});s.render(a.engine,0,'',.6,false,0);a.updateHUD(true);}''');p.screenshot(path=str(out/name))
 shot('water-drift-desktop.png',1440,900);shot('water-drift-mobile.png',390,844)
 returned=p.evaluate('''()=>{const a=HonroApp,e=a.engine,u=e.unit('p-archer');for(let i=0;i<60;i++)e.tick(1/60);if(u.waterRecovery||u.x!==3990||!HONRO_CORE.validTerrainContactPose(e.b.terrain,u))throw Error('No safe same-bank return');return{hp:u.hp,x:u.x,y:u.y,acted:u.acted,moveLeft:u.moveLeft};}''')
 shot('water-return-mobile.png',390,844);shot('water-return-desktop.png',1440,900)
 (out/'evidence.json').write_text(json.dumps({'scope':__doc__,'initial':initial,'returned':returned,'errors':errors},ensure_ascii=False,indent=2));assert not errors,errors;print(initial,returned);b.close()
