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
   ev('HonroAct4TerrainPreview.observe(HonroApp,.01);HonroStory.next(HonroApp)')
  page.wait_for_timeout(150)
 def setup(n,x,y,cx,cy,cls='archer'):
  ev(f"HonroAct4TerrainPreview.launch({n})")
  page.evaluate("""v=>{const a=HonroApp,e=a.engine,b=e.b;for(const u of b.units.filter(u=>u.side===1))e.hurt(u,100000);for(let i=0;i<300;i++)e.tick(HONRO_CORE.STEP);b.phase='aim';b.side=0;b.active=v.cls;const u=e.active;const p=HonroTerrain.place(b,u,{x:v.x,y:v.y,maxDistance:80});if(!p)throw Error('fixture placement');Object.assign(u,p,{vx:0,vy:0});Object.assign(a.scene,{manual:true,editorView:true,skillPreview:true,x:v.cx,y:v.cy,scale:.5,storyTween:null,cinematic:null,storyFrame:null,goalFocus:null});} """,dict(x=x,y=y,cx=cx,cy=cy,cls=cls))
  render()
 def step(count=1,dt=.1):
  for _ in range(count):ev(f'HonroAct4TerrainPreview.observe(HonroApp,{dt})');render()
 ev('HonroAct4TerrainPreview.freezeReviewClock=true')
 setup(35,6250,1850,6320,1730,'mage');assert not ev('HonroAct4TerrainPreview.interact()');assert not ev('HonroApp.engine.b.honroAct4FactEvents?.some(f=>f.eventId==="eq_da_t3b")')
 ev("""()=>{const e=HonroApp.engine,u=e.unit('knight'),p=HonroTerrain.place(e.b,u,{x:6370,y:1850,maxDistance:80});Object.assign(u,p,{vx:0,vy:0});}""");render()
 assert ev('HonroAct4TerrainPreview.interact()')
 for i in range(18):ev('HonroAct4TerrainPreview.observe(HonroApp,.1)')
 assert not ev('HonroApp.engine.b.honroAct4FactEvents?.some(f=>f.eventId==="eq_da_t3b")'),'unrendered receiver cannot create delivery fact'
 hidden=page.add_style_tag(content='#battlecanvas{opacity:0!important}');step(3)
 assert not ev('HonroApp.engine.b.honroAct4FactEvents?.some(f=>f.eventId==="eq_da_t3b")'),'hidden canvas cannot create receipt'
 hidden.evaluate('(n)=>n.remove()')
 assert ev('HonroAct4TerrainPreview.save()');ev('HonroApp.stopBattle()');assert ev('HonroAct4TerrainPreview.resume()')
 ev('HonroApp.engine.impulse(HonroApp.engine.unit("knight"),180,-160)');step(1)
 assert not ev('!!HonroApp.engine.b.honroAct4PreviewState.flaskDelivery');assert not ev('HonroApp.engine.b.honroAct4FactEvents?.some(f=>f.eventId==="eq_da_t3b")')
 ev("""()=>{const e=HonroApp.engine;for(const [id,x]of [['mage',6250],['knight',6370]]){const u=e.unit(id),p=HonroTerrain.place(e.b,u,{x,y:1850,maxDistance:100});Object.assign(u,p,{vx:0,vy:0,jumping:false,airborne:false,acted:false});}e.b.active='mage';Object.assign(HonroApp.scene,{manual:true,x:6320,y:1730,scale:.8});}""");render();assert ev('HonroAct4TerrainPreview.interact()');step(8)
 assert not ev('HonroApp.engine.b.honroAct4FactEvents?.some(f=>f.eventId==="eq_da_t3b")')
 assert ev('HonroAct4TerrainPreview.save()');ev('HonroApp.stopBattle()');assert ev('HonroAct4TerrainPreview.resume()');render();step(4)
 page.locator('#battlecanvas').screenshot(path=str(OUT/'35-flask-actual-reception.png'));step(5)
 row=ev('HonroApp.engine.b.honroAct4FactEvents.find(f=>f.eventId==="eq_da_t3b")');assert row['proof']['giver']=='knight' and row['proof']['receiver']=='mage' and row['proof']['itemId']=='itm_da_06' and row['officialAct4']==False,row
 assert not ev('HonroAct4TerrainPreview.interact()')
 assert ev('HonroAct4TerrainPreview.save()');ev('HonroApp.stopBattle()');assert ev('HonroAct4TerrainPreview.resume()');assert ev('HonroApp.engine.b.honroAct4FactEvents.filter(f=>f.eventId==="eq_da_t3b").length')==1
 assert ev('HonroAct4TerrainPreview.restart()');assert ev('!!HonroAct4TerrainPreview.campaignProof.factEvents.eq_da_t3b')
 assert not ev('HonroApp.profile.equipment?.ownedItemIds.includes("itm_da_06")')
 assert not errors,errors
 print('PASS 35 physical companion handoff: alone/unrendered/interrupted fail; mid-handoff save resumes; actual reception once; retry preserves run fact; no preview equipment grant',flush=True)
 browser.close()
