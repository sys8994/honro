"""Unshipped visual diagnostic: fixture entry and controlled views, not release/gameplay acceptance."""
import json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('_local/reports/stage6-art-preview');out.mkdir(parents=True,exist_ok=True)
errors=[];result={'scope':'Nonproduction prototype; fixture-seeded launch, controlled cameras and short keyboard movement only. Not a gameplay clear, mobile device performance or release evidence.','sha':os.environ.get('GITHUB_SHA'),'errors':errors}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:8870/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
  profile=json.loads(Path('game/docs/stage-review/stage06-bridge/evidence/entry-profile.json').read_text())['profile']
  page.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile);page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
  result['entry']=page.evaluate('''async()=>{await HONRO_APP_READY;await HonroCampaignLoader.ensureStage(6);const a=HonroApp;a.launch(6,false);while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;return {stage:a.engine.b.honroStage,units:a.engine.b.units.length,terrain:a.engine.b.terrain.map(t=>t.id)};}''')
  page.wait_for_timeout(1000);page.screenshot(path=str(out/'entry.png'))
  result['before']=page.evaluate('''()=>({x:HonroApp.engine.active?.x,y:HonroApp.engine.active?.y,canInput:HonroApp.canInput()})''')
  page.keyboard.down('ArrowRight');page.wait_for_timeout(400);page.keyboard.up('ArrowRight');page.wait_for_timeout(250)
  result['after']=page.evaluate('''()=>({x:HonroApp.engine.active?.x,y:HonroApp.engine.active?.y,canInput:HonroApp.canInput()})''');page.screenshot(path=str(out/'movement.png'))
  # Controlled cameras expose locations that are not all reachable in one turn.
  for label,x,y,scale in [('overview',3300,2350,.21),('west',1750,2100,.48),('center',3350,2550,.48),('east',5000,2550,.48)]:
   page.evaluate('''([x,y,scale])=>{const a=HonroApp;Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,x,y,scale});a.scene.render(a.engine,0,a.selected,.3,false,0)}''',[x,y,scale]);page.wait_for_timeout(300);page.screenshot(path=str(out/(label+'.png')))
  for label,w,h,x,y in [('mobile-portrait',390,844,3150,2650),('mobile-landscape',844,390,4800,2500)]:
   page.set_viewport_size({'width':w,'height':h});page.evaluate('''([x,y])=>{let a=HonroApp;Object.assign(a.scene,{manual:true,x,y,scale:.48});a.scene.render(a.engine,0,a.selected,.3,false,0)}''',[x,y]);page.wait_for_timeout(500);page.screenshot(path=str(out/(label+'.png')))
  result['documentWidth']=page.evaluate('document.documentElement.scrollWidth');result['previewAssets']=page.evaluate('''()=>HonroApp.engine.b.honroLandmarks.filter(l=>l.id.startsWith('stage06-prototype')).map(l=>({id:l.id,asset:l.asset.id,collisions:l.collisionIds.length}))''');browser.close()
except Exception as exc:
 result['error']=repr(exc)
finally:
 (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False))
if errors or 'error' in result:raise SystemExit(1)
