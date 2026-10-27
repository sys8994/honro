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
 ev('HonroAct4TerrainPreview.launch(32)');ev('HonroApp.engine.hurt(HonroApp.engine.unit("archer"),100000)')
 assert ev('HonroApp.engine.b.phase')=='lost';assert not ev('!!HonroApp.dialogue');assert ev('HonroAct4TerrainPreview.save()')
 ev('HonroApp.stopBattle()');assert ev('HonroAct4TerrainPreview.resume()');assert ev('HonroApp.engine.b.phase')=='lost'
 assert ev('HonroAct4TerrainPreview.restart()');assert ev('HonroApp.engine.unit("archer").hp')>0;assert ev('HonroApp.engine.b.phase')=='aim'
 print('PASS 32 real speaker death -> explicit lost; resume lost; restart usable',flush=True)
 setup(32,4620,2010,4900,1850);step(100);finish();step(1)
 hidden=page.add_style_tag(content='#story-line{visibility:hidden!important}')
 step(2);assert ev('HonroApp.dialogue?.lines[0]?.[2]?.act4PreviewRow')=='A4.S32.MISSING.01'
 ev('HonroStory.finish(HonroApp)');step(3);assert not ev('!!HonroApp.engine.b.honroAct4PreviewState.safeSeven')
 ev("""()=>{const e=HonroApp.engine;for(const [i,u]of e.b.units.filter(u=>u.side===0).entries()){u.x=6000+i*100;u.y=HonroMapEngine.surfaceY(e.b.terrain,u.x).y;u.vx=u.vy=0;}}""")
 assert not ev('HonroAct4TerrainPreview.interact()'),'unseen report cannot certify seven people'
 hidden.evaluate('(n)=>n.remove()')
 ev("""()=>{const e=HonroApp.engine,u=e.unit('archer'),p=HonroTerrain.place(e.b,u,{x:4700,y:2010,maxDistance:80});Object.assign(u,p,{vx:0,vy:0});e.b.active=u.id;Object.assign(HonroApp.scene,{x:4770,y:1890,scale:.65});}""")
 render();assert ev('HonroAct4TerrainPreview.interact()');page.wait_for_timeout(180);ev('HonroAct4TerrainPreview.observe(HonroApp,.01)');ev('HonroStory.finish(HonroApp)');step(3)
 q=ev('HonroApp.engine.b.honroAct4PreviewState');assert q.get('safeSeven'),q
 assert q['safeSeven']['reportIds']==['A4.S32.MISSING.01'],q
 assert all(id not in q['receipts'] for id in ['A4.S32.MISSING.02','A4.S32.MISSING.03','A4.S32.MISSING.04'])
 print('PASS 32 unseen report is not proof; actual NPC re-ask delivers report; optional questions skipped without false receipts',flush=True)

 ev('HonroAct4TerrainPreview.launch(39)')
 ev('HonroApp.engine.b.active="a4-wreck";HonroApp.engine.b.side=1;HonroApp.engine.b.phase="aim"')
 assert not ev('HonroAct4TerrainPreview.interact()');page.keyboard.press('e');step(2)
 assert not ev('!!HonroApp.engine.b.honroAct4PreviewState.stabilizing||!!HonroApp.engine.b.honroAct4PreviewState.releasing')
 print('PASS actual enemy-active aim + E cannot perform player anchor/net',flush=True)
 ev('HonroAct4TerrainPreview.launch(38)')
 ev("""()=>{const a=HonroApp,e=a.engine;for(const u of e.b.units.filter(u=>u.side===1&&!u.honroAct4Pursuer))e.hurt(u,100000);const u=e.unit('archer');u.x=3100;u.y=3050;u.vx=u.vy=0;e.b.active=u.id;Object.assign(a.scene,{manual:true,x:3700,y:2700,scale:.55});}""")
 step(50)
 assert ev('!!HonroApp.engine.b.honroAct4PreviewState.pursuitSeen');assert ev('HonroApp.dialogue?.lines[0]?.[2]?.act4PreviewRow')=='A4.S38.VOICE.01'
 ev('HonroAct4TerrainPreview.observe(HonroApp,.01)');page.wait_for_timeout(100);ev('HonroStory.next(HonroApp)');page.wait_for_timeout(100);ev('HonroAct4TerrainPreview.observe(HonroApp,.01)')
 ev('HonroApp.engine.b.units.filter(u=>u.honroAct4Pursuer).forEach(u=>HonroApp.engine.hurt(u,100000))');finish();step(2)
 q=ev('HonroApp.engine.b.honroAct4PreviewState');assert 'A4.S38.VOICE.03' not in q['receipts'];assert 'A4.S38.VOICE.03' in q['events']['voice']['retired'],q
 print('PASS 38 actual approaching pursuers observed; kill before third row retires untrue pursuit line',flush=True)
 setup(39,5930,1720,6100,1850,'mage');assert ev('HonroAct4TerrainPreview.interact()');step(20);finish();step(2)
 ev("""()=>{const e=HonroApp.engine;const a=e.unit('archer');a.x=5800;a.y=2000;a.vx=a.vy=0;e.b.active='occultist';const u=e.active;const p=HonroTerrain.place(e.b,u,{x:5470,y:1720,maxDistance:100});Object.assign(u,p,{vx:0,vy:0});Object.assign(HonroApp.scene,{x:5600,y:1850});}""")
 assert ev('HonroAct4TerrainPreview.interact()');step(20);finish();step(2)
 for turn in range(10):ev('HonroApp.engine.b.shot++');step(30)
 assert ev('!!HonroApp.engine.b.honroAct4PreviewState.netOpen');assert not ev('!!HonroApp.engine.b.honroAct4PreviewState.events.souls_freed?.started')
 assert not ev('HonroAct4TerrainPreview.coast.routeClear(HonroApp.engine.b)')
 ev("""()=>{const e=HonroApp.engine,u=e.unit('archer'),p=HonroTerrain.place(e.b,u,{x:5800,y:1720,maxDistance:100});Object.assign(u,p,{vx:0,vy:0});}""")
 for turn in range(4):ev('HonroApp.engine.b.shot++');step(30)
 assert ev('!!HonroApp.engine.b.honroAct4PreviewState.events.souls_freed?.started');finish();step(1)
 assert 'A4.S39.RELEASE.01' in ev('HonroApp.engine.b.honroAct4PreviewState.receipts')
 # A real airborne actor passing the goal is not a safe receipt.
 ev("""()=>{const e=HonroApp.engine,u=e.unit('a4-rescue-0');u.x=6900;u.y=1680;u.vy=-60;u.jumping=true;u.fixed=false;delete e.b.honroAct4PreviewState.escort[u.id].safe;}""")
 step(1);assert not ev('!!HonroApp.engine.b.honroAct4PreviewState.escort["a4-rescue-0"].safe')
 assert not ev('HonroAct4TerrainPreview.coast.rescueSafe(HonroApp.engine,HonroApp.engine.unit("a4-rescue-0"))')
 print('PASS 39 real route occupant withholds release claim; clearing it permits passage/receipt; airborne target not safe',flush=True)
 # Enemy water traits and their low-bank navigation reservation.
 ev('HonroAct4TerrainPreview.launch(39)')
 ev("""()=>{const e=HonroApp.engine,u=e.unit('a4-39-g0-1');u.x=1735;u.y=HonroMapEngine.surfaceY(e.b.terrain,u.x,2000).y;u.fixed=false;u.vx=u.vy=0;u.moveLeft=500;window.bankEnemyX=u.x;e.walk(u,-1,.1,true);}""")
 assert ev('HonroApp.engine.unit("a4-39-g0-1").x')==ev('window.bankEnemyX')
 ev("""()=>{const e=HonroApp.engine,u=e.unit('a4-39-g0-0');u.y=HonroMapEngine.surfaceY(e.b.terrain,u.x,2400).y;u.vx=u.vy=0;for(const v of e.b.units.filter(v=>v.honroAct4WaterTrait==='spirit'))v.y=2300;}""")
 before=ev('HonroApp.engine.b.units.filter(u=>u.side===1).map(u=>[u.id,u.hp,u.maxHp,u.honroAct4WaterTrait,!!u.honroAct4Aquatic])')
 ev('HonroApp.engine.b.round=2;HonroAct4TerrainPreview.observe(HonroApp,.1);HonroApp.engine.b.round=5;HonroAct4TerrainPreview.observe(HonroApp,.1);HonroAct4TerrainPreview.coast.water(HonroApp.engine)')
 after=ev('HonroApp.engine.b.units.filter(u=>u.side===1).map(u=>[u.id,u.hp])');bmap={r[0]:r for r in before};amap=dict(after)
 assert amap['a4-39-g0-0']<bmap['a4-39-g0-0'][1]
 assert amap['a4-wreck']==bmap['a4-wreck'][1]
 for r in before:
  if r[3]=='spirit':assert amap[r[0]]==r[1]
 print('PASS ground enemy takes high-water damage, airborne/explicit aquatic stay distinct; enemy cannot enter reserved bank',flush=True)
 # Full low bank: 3 companions + 2 original native summons. A pending fall
 # spends its action, then a normal companion move opens a same-side slot.
 setup(39,1690,2000,1600,1860)
 ev('HonroApp.engine.tick(HONRO_CORE.STEP)')
 ev("""()=>{const e=HonroApp.engine,b=e.b;for(const [i,id]of ['mage','knight','occultist'].entries()){const u=e.unit(id);u.x=1420+i*60;u.y=2000;u.vx=u.vy=0;u.acted=false;}const owner=e.unit('occultist');e.spawnSummon(owner,'stalker',1600,2000);e.spawnSummon(owner,'stalker',1660,2000);const a=e.unit('archer');a.x=2100;a.y=2400;a.vx=a.vy=0;b.active=a.id;}""")
 ev('HonroApp.engine.b.round=2;HonroAct4TerrainPreview.observe(HonroApp,.1);HonroApp.engine.b.round=5;HonroAct4TerrainPreview.observe(HonroApp,.1)')
 hp=ev('HonroApp.engine.unit("archer").hp');focus=ev('HonroApp.engine.unit("archer").focus')
 ev('HonroAct4TerrainPreview.coast.water(HonroApp.engine)');assert ev('!!HonroApp.engine.unit("archer").honroAct4Recovering')
 ev('HonroApp.selectHero("mage")');assert ev('HonroApp.engine.active.id')=='mage'
 for i in range(100):ev('HonroApp.engine.move(-1,HONRO_CORE.STEP);HonroApp.engine.tick(HONRO_CORE.STEP)')
 assert not ev('!!HonroApp.engine.unit("archer").honroAct4Recovering');assert ev('HonroApp.engine.unit("archer").x')<1700
 assert ev('HonroApp.engine.unit("archer").hp')<hp and ev('HonroApp.engine.unit("archer").focus')==focus
 assert ev('HonroApp.engine.b.honroAct4PreviewState.water.recoveries.filter(r=>r.unit==="archer").length')==1
 print('PASS occupied same-side low bank -> pending action ended -> normal companion walk frees slot -> once-only HP penalty/noMP reset',flush=True)
 page.set_viewport_size({'width':390,'height':844});ev('HonroAct4TerrainPreview.launch(37)')
 ev("""()=>{const a=HonroApp,e=a.engine,u=e.unit('archer');u.x=7300;u.y=2200;u.vx=u.vy=0;e.b.active=u.id;Object.assign(a.scene,{manual:false,editorView:false,skillPreview:false,storyFrame:null,storyTween:null,cinematic:null,goalFocus:null,scale:.62});for(let i=0;i<360;i++)a.scene.render(e,HONRO_CORE.STEP,'',.5,false,HONRO_CORE.STEP);}""")
 page.locator('#battlecanvas').screenshot(path=str(OUT/'37-mobile-signal-before-line.png'));step(2);assert ev('HonroApp.engine.b.honroAct4PreviewState.observed.signal!==undefined');assert ev('HonroApp.engine.b.honroAct4PreviewState.observed.gesture!==undefined');page.locator('#battlecanvas').screenshot(path=str(OUT/'37-mobile-signal-observed.png'));finish();step(1)
 assert ev('HonroApp.engine.b.honroAct4PreviewState.events.signal.terminal')
 assert not errors,errors
 print('PASS 37 normal mobile follow camera actually observes signal+gesture; no out-of-map mandatory view; pageerror0',flush=True)
 browser.close()
