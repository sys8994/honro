"""Original App/Scene/Engine controlled chapter fixtures; not a normal campaign playthrough."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-preview/coast-first';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8772/HONRO.html');page.wait_for_function('!!window.HonroApp')
 page.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(30);await HonroCampaignLoader.ensureStage(21);await HonroCampaignLoader.ensureStage(13);HonroApp.frame=()=>{};const ss=await Promise.all(['31-35-36','32-33-34-37','38-39-40'].map(async s=>(await fetch('game/docs/act4/dialogue-seeds-'+s+'-reviewed-final.json')).json()));HONRO_ACT4_PREVIEW_SEEDS={scenes:ss.flatMap(s=>s.scenes),ui:ss.flatMap(s=>s.ui)};window.ownerBefore=JSON.stringify(HonroApp.profile);}''')
 for name in ['review-art','terrain-preview','coast-maps','coast-art','preview-events','coast-events','preview-lifecycle']:page.add_script_tag(url='http://127.0.0.1:8772/tools/act4/'+name+'.js')
 def ev(code):return page.evaluate(code)
 def render():ev("HonroApp.scene.render(HonroApp.engine,0,'',.5,false,0)")
 def finish():
  for i in range(16):
   page.wait_for_timeout(100)
   if not ev('!!HonroApp.dialogue'):break
   ev('HonroStory.next(HonroApp)')
  page.wait_for_timeout(150)
 def setup(n,x,y,cx,cy,cls='archer'):
  ev(f"HonroAct4TerrainPreview.launch({n})")
  page.evaluate("""v=>{const a=HonroApp,e=a.engine,b=e.b;for(const u of b.units.filter(u=>u.side===1))e.hurt(u,100000);b.phase='aim';b.side=0;b.active=v.cls;const u=e.active;const p=HonroTerrain.place(b,u,{x:v.x,y:v.y,maxDistance:80});if(!p)throw Error('fixture placement');Object.assign(u,p,{vx:0,vy:0});Object.assign(a.scene,{manual:true,editorView:true,skillPreview:true,x:v.cx,y:v.cy,scale:.5,storyTween:null,cinematic:null,storyFrame:null,goalFocus:null});} """,dict(x=x,y=y,cx=cx,cy=cy,cls=cls))
  render()
 def step(count=1,dt=.1):
  for _ in range(count):ev(f'HonroAct4TerrainPreview.observe(HonroApp,{dt})');render()
 setup(32,4620,2010,4900,1850)
 step(100);finish();step(30);finish();step(20);finish()
 q=ev('HonroApp.engine.b.honroAct4PreviewState');assert q.get('safeSeven',{}).get('ids') and len(q['safeSeven']['ids'])==7,q
 assert q['events']['reunion']['terminal'] and q['events']['missing_four']['terminal'],q
 assert set(q['receipts'])==set(v[0] for scene in ev('HONRO_ACT4_PREVIEW_SEEDS.scenes.filter(s=>s.stage===32)') for v in scene['lines']),q
 assert ev('HonroAct4TerrainPreview.save()');ev('HonroApp.stopBattle()');assert ev('HonroAct4TerrainPreview.resume()');assert ev('HonroApp.engine.b.honroAct4PreviewState.safeSeven.ids.length')==7
 print('PASS 32 physical emergence/threshold/quiet/all8 receipts/own-storage resume',flush=True)
 setup(38,3100,3050,3700,2800,'mage');step(1);finish();step(2)
 assert ev('HonroAct4TerrainPreview.interact()');render();step(10);render();step(3)
 assert ev('HonroApp.engine.b.honroAct4PreviewState.connectionProbe.phase')=='observed'
 assert ev('HonroAct4TerrainPreview.interact()');finish();step(20);finish()
 q=ev('HonroApp.engine.b.honroAct4PreviewState');assert q.get('connected'),q
 before=ev('HonroApp.engine.active.focus');assert ev('HonroAct4TerrainPreview.interact()');assert ev('HonroApp.engine.active.x')>4300;assert ev('HonroApp.engine.active.focus')==before
 print('PASS 38 actual probe/anchor/clear landing/fixed connection/no MP cost',flush=True)
 setup(39,6130,2000,6100,1850,'mage');assert not ev('HonroApp.engine.b.honroAct4PreviewState.complete'),'early boss kill cannot win'
 assert ev('HonroAct4TerrainPreview.interact()');step(20);finish();step(3)
 assert ev('!!HonroApp.engine.b.honroAct4PreviewState.exitStable')
 ev("""()=>{const e=HonroApp.engine;e.b.active='occultist';const u=e.active;const p=HonroTerrain.place(e.b,u,{x:5470,y:2000,maxDistance:100});if(!p)throw Error('net placement');Object.assign(u,p,{vx:0,vy:0});Object.assign(HonroApp.scene,{x:5600,y:1850});}""")
 assert ev('HonroAct4TerrainPreview.interact()');step(20);finish();step(3)
 assert ev('!!HonroApp.engine.b.honroAct4PreviewState.netOpen')
 for turn in range(25):
  ev('HonroApp.engine.b.shot++;HonroApp.engine.b.side=0;HonroApp.engine.b.phase="aim"');step(30)
 q=ev('HonroApp.engine.b.honroAct4PreviewState');assert q.get('rescued',{}).get('ids') and len(q['rescued']['ids'])==4,(q,ev('HonroApp.engine.b.units.filter(u=>u.honroAct4Resident).map(u=>[u.id,u.x,u.y,u.moveLeft])'))
 assert not q['complete'];assert not q.get('failure')
 ev("""()=>{const e=HonroApp.engine;for(const [i,u]of e.b.units.filter(u=>u.side===0).entries()){u.x=8300+i*80;u.y=HonroMapEngine.surfaceY(e.b.terrain,u.x).y;u.vx=u.vy=0;}}""")
 assert ev('HonroAct4TerrainPreview.interact()');assert ev('HonroApp.engine.b.phase')=='won'
 print('PASS 39 early boss kill does not win; actual anchor/net/4NPC walk/party exit wins',flush=True)
 setup(33,800,2100,1800,2100)
 ev('HonroApp.engine.b.round=2;HonroAct4TerrainPreview.observe(HonroApp,.1)');render();finish();ev('HonroApp.engine.b.round=3;HonroAct4TerrainPreview.observe(HonroApp,.1)')
 before=ev('({hp:HonroApp.engine.active.hp,mp:HonroApp.engine.active.focus,max:HonroApp.engine.active.maxHp})')
 ev("""()=>{const e=HonroApp.engine,u=e.active;u.x=1800;u.y=2300;u.vx=u.vy=0;HonroAct4TerrainPreview.coast.water(e);}""")
 after=ev('({hp:HonroApp.engine.active.hp,mp:HonroApp.engine.active.focus,x:HonroApp.engine.active.x,acted:HonroApp.engine.active.acted,q:HonroApp.engine.b.honroAct4PreviewState})')
 assert after['x']<1300 and after['mp']==before['mp'] and after['acted'],(before,after)
 assert 0<before['hp']-after['hp']<=before['max']*.25+1,(before,after)
 assert not errors,errors
 print('PASS same-entry low-bank water recovery/25%HP/action spent/noMP reset/pageerror0',flush=True)
 browser.close()
