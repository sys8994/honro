"""Real App camera-only spot checks of changed candidate regions; not mission proof."""
import json,pathlib
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[2];out=root/'_local/act4-rc/browser';fixture=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];targets={32:(2998,710),34:(1300,1900),36:(1463,1160),38:(3600,1300),40:(2660,3500)}
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);results=[]
 for n,(tx,ty) in targets.items():
  p=b.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto('http://127.0.0.1:8770/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader');q=json.loads(json.dumps(fixture));q['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,n)};q['lastStage']=n;q['mapNode']=n;q.pop('honroBattle',None);p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',q);p.reload();p.wait_for_function('window.HonroApp && window.HonroAct4PilotCombat && window.HONRO_ACT4_PILOT_COMBAT_REFERENCE');p.evaluate('''async n=>{await HonroCampaignLoader.ensureStage(n);HonroApp.launch(n)}''',n);p.wait_for_function('(n)=>HonroApp.engine?.b?.honroStage===n',arg=n,timeout=60000);p.wait_for_timeout(1200)
  for _ in range(10):
   if not p.evaluate('!!HonroApp.dialogue'):break
   p.keyboard.press('Enter');p.wait_for_timeout(600)
  p.mouse.move(720,350);p.mouse.wheel(0,1100);p.wait_for_timeout(800)
  for i in range(15):
   a=p.evaluate('''([x,y])=>{let s=HonroApp.scene,r=s.canvas.getBoundingClientRect();return {sx:r.width/2+(x-s.x)*s.scale,sy:r.height/2+(y-s.y)*s.scale,x:s.x,y:s.y,scale:s.scale}}''',[tx,ty]);dx=720-a['sx'];dy=350-a['sy'];
   if abs(dx)<35 and abs(dy)<35:break
   p.mouse.move(700,350);p.mouse.down();p.mouse.move(700+max(-250,min(250,dx)),350+max(-250,min(250,dy)),steps=10);p.mouse.up();p.wait_for_timeout(250)
  p.wait_for_timeout(1200);p.screenshot(path=str(out/f'stage{n}-detail.png'));results.append({'stage':n,'target':[tx,ty],'camera':a,'dialogue':p.evaluate('!!HonroApp.dialogue'),'errors':errors});print(n,a,errors,flush=True);p.close()
 b.close();(out/'views.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
