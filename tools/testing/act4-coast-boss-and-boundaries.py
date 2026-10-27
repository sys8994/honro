"""Original App/Scene/Engine controlled chapter fixtures; not a normal campaign playthrough."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-preview/coast-first';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8772/HONRO.html');page.wait_for_function('!!window.HonroApp')
 page.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(30);await HonroCampaignLoader.ensureStage(21);await HonroCampaignLoader.ensureStage(13);HonroApp.frame=()=>{};const ss=await Promise.all(['31-35-36','32-33-34-37','38-39-40'].map(async s=>(await fetch('game/docs/act4/dialogue-seeds-'+s+'-reviewed-final.json')).json()));HONRO_ACT4_PREVIEW_SEEDS={scenes:ss.flatMap(s=>s.scenes),ui:ss.flatMap(s=>s.ui)};window.ownerBefore=JSON.stringify(HonroApp.profile);}''')
 for name in ['review-art','terrain-preview','coast-maps','coast-art','preview-events','coast-events','preview-lifecycle']:page.add_script_tag(url='http://127.0.0.1:8772/'+{'review-art':'shared/runtime/act4-art.js','terrain-preview':'shared/runtime/act4-maps.js','coast-maps':'shared/runtime/act4-coast-maps.js','coast-art':'shared/runtime/act4-coast-art.js','preview-events':'shared/runtime/act4-events.js','coast-events':'shared/runtime/act4-coast-events.js'}.get(name,'tools/act4/'+name+'.js'))
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
 setup(39,5930,1720,6100,1850,'mage');assert ev('HonroAct4TerrainPreview.interact()');step(2)
 ev("HonroApp.engine.impulse(HonroApp.engine.active,200,-160)");step(15)
 assert not ev('!!HonroApp.engine.b.honroAct4PreviewState.exitStable');assert not ev('!!HonroApp.engine.b.honroAct4PreviewState.stabilizing')
 print('PASS 39 actual impulse interrupts unfinished anchor without stable-exit fact',flush=True)
 ev('HonroAct4TerrainPreview.launch(38)')
 ev("""()=>{const a=HonroApp,e=a.engine,b=e.b;for(const u of b.units.filter(u=>u.side===1||u.id==='mage'))e.hurt(u,100000);b.honroAct4PreviewState.vistaDone=true;b.active='archer';const u=e.active;u.x=3100;u.y=3050;u.vx=u.vy=0;let jams=0;for(let i=0;i<2600&&u.x<4580;i++){u.moveLeft=10000;const x=u.x;e.move(1,HONRO_CORE.STEP);e.tick(HONRO_CORE.STEP);jams=u.x-x<.01?jams+1:0;if(jams>5&&e.grounded(u)){e.jump(u);jams=0;}}window.fallback={x:u.x,hp:u.hp,grounded:e.grounded(u),failure:b.honroAct4PreviewState.failure,connected:!!b.honroAct4PreviewState.connected};}""")
 r=ev('window.fallback');assert r['x']>=4580 and r['hp']>0 and not r['connected'] and not r.get('failure'),r
 print('PASS 38 mage actually dead: native movement/jumps cross finite emergency route; no fake mage/connection',flush=True)
 ev('HonroAct4TerrainPreview.launch(39)')
 ev("""()=>{const a=HonroApp,e=a.engine,b=e.b;for(const u of b.units.filter(u=>u.side===1&&!u.honroAct4WreckBoss))e.hurt(u,100000);for(const [i,u]of b.units.filter(u=>u.side===0).entries()){u.x=6850+i*100;u.y=1700;u.vx=u.vy=0;}Object.assign(a.scene,{manual:true,editorView:true,x:6900,y:1500,scale:.65});}""")
 step(1);finish();step(1);render()
 assert ev('HonroApp.engine.combatEnemies().some(u=>u.id==="a4-wreck")'),'boss must remain active at far high ground'
 assert ev('HonroApp.engine.b.honroAct4PreviewState.artillery.next.warningSeen')
 page.locator('#battlecanvas').screenshot(path=str(OUT/'39-live-boss-warning.png'))
 ev("""()=>{const e=HonroApp.engine,b=e.b,q=b.honroAct4PreviewState;b.round=q.artillery.next.dueRound;b.side=1;b.phase='aim';b.active='a4-wreck';e.active.acted=false;e.enemyAction();window.shells=b.projectiles.filter(p=>p.honroAct4Artillery).map(p=>({id:p.id,x:p.x,y:p.y,vx:p.vx,vy:p.vy}));}""")
 assert ev('window.shells.length')>0,ev('({boss:HonroApp.engine.active,q:HonroApp.engine.b.honroAct4PreviewState.artillery})')
 ev("""()=>{const e=HonroApp.engine,b=e.b;window.impactBefore=b.units.filter(u=>u.side===0).map(u=>({id:u.id,hp:u.hp}));for(let i=0;i<600&&b.projectiles.length;i++)e.tick(HONRO_CORE.STEP);window.shotAfter={remaining:b.projectiles.length,hp:b.units.filter(u=>u.side===0).map(u=>({id:u.id,hp:u.hp})),history:b.honroAct4PreviewState.artillery.history};}""")
 after=ev('window.shotAfter');before={r['id']:r['hp'] for r in ev('window.impactBefore')};assert after['remaining']==0,after
 assert any(r['hp']<before[r['id']] for r in after['hp']),after
 print('PASS 39 boss at distant high ground: real warning -> native enemy fire -> ballistic impact/HP damage',flush=True)
 ev("""()=>{const e=HonroApp.engine,b=e.b;b.side=0;b.phase='aim';b.active='archer';for(const u of b.units.filter(u=>u.side===0))u.acted=false;}""");step(1)
 assert ev('!!HonroApp.engine.b.honroAct4PreviewState.artillery.next')
 ev('HonroApp.engine.hurt(HonroApp.engine.unit("a4-wreck"),100000)');assert not ev('!!HonroApp.engine.b.honroAct4PreviewState.artillery.next')
 assert not ev('HonroApp.engine.b.honroAct4PreviewState.complete')
 assert not errors,errors
 print('PASS real boss death cancels next warning; does not complete rescue or respawn',flush=True)
 ev('HonroAct4TerrainPreview.launch(39)')
 ev("""()=>{const a=HonroApp,e=a.engine,b=e.b;for(const u of b.units.filter(u=>u.side===1&&!u.honroAct4WreckBoss))e.hurt(u,100000);b.active='mage';Object.assign(e.active,HonroTerrain.place(b,e.active,{x:5930,y:1720,maxDistance:100}),{vx:0,vy:0});Object.assign(a.scene,{manual:true,x:6100,y:1850,scale:.5});}""");render()
 assert ev('HonroAct4TerrainPreview.interact()');step(20);finish();step(3)
 ev("""()=>{const e=HonroApp.engine;e.b.active='occultist';Object.assign(e.active,HonroTerrain.place(e.b,e.active,{x:5470,y:1720,maxDistance:100}),{vx:0,vy:0});Object.assign(HonroApp.scene,{x:5600,y:1850});}""")
 assert ev('HonroAct4TerrainPreview.interact()');step(20);finish();step(3)
 for turn in range(25):ev('HonroApp.engine.b.shot++');step(30);finish()
 assert ev('HonroApp.engine.b.honroAct4PreviewState.rescued.ids.length')==4
 ev("""()=>{const e=HonroApp.engine;for(const [i,u]of e.b.units.filter(u=>u.side===0).entries()){u.x=8300+i*80;u.y=HonroMapEngine.surfaceY(e.b.terrain,u.x).y;u.vx=u.vy=0;}}""")
 assert ev('HonroAct4TerrainPreview.interact()');assert ev('HonroApp.engine.b.phase')=='won'
 assert ev('HonroApp.engine.b.honroAct4PreviewState.completionProof.bossAlive')
 print('PASS 39 actual four NPC walks/grounded high arrival/party exit wins with live boss; controlled-turn fixture',flush=True)
 ev('HonroAct4TerrainPreview.launch(33)')
 ev("""()=>{const a=HonroApp,e=a.engine,b=e.b;for(const u of b.units.filter(u=>u.side===1))e.hurt(u,100000);const guard=b.units.find(u=>u.side===1);guard.dead=false;guard.hp=guard.maxHp;guard.awake=true;guard.aggroUntil=10000;guard.fixed=true;guard.x=6000;guard.y=1500;guard.loadout=[];for(const [i,u]of b.units.filter(u=>u.side===0).entries()){u.x=1710+i*90;u.y=HonroMapEngine.surfaceY(b.terrain,u.x,2300).y;u.vx=u.vy=0;u.acted=false;u.moveLeft=u.maxMove;}b.round=2;b.side=0;b.phase='aim';b.active='archer';HonroAct4TerrainPreview.coast.tide(b);window.fleeLog=[];for(let i=0;i<12000&&b.round<5;i++){const u=e.active;if(b.side===0&&b.phase==='aim'&&u?.side===0){if(u.x>1200&&u.moveLeft>2)e.move(-1,HONRO_CORE.STEP);else{window.fleeLog.push({round:b.round,id:u.id,x:u.x,y:u.y,remaining:u.moveLeft});e.finishAction(true);}}e.tick(HONRO_CORE.STEP);HonroAct4TerrainPreview.coast.tide(b);}window.fleeResult={round:b.round,tide:b.honroAct4PreviewState.tide,units:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp})),log:window.fleeLog};Object.assign(a.scene,{manual:true,x:1300,y:2080,scale:.6});a.scene.render(e,0,'',.5,false,0);}""")
 r=ev('window.fleeResult');assert r['round']==5 and r['tide']['phase']=='high',r
 assert all(u['x']<1300 and u['hp']>0 for u in r['units']),r
 assert all(any(t['id']==u['id'] and t['round']==round for t in r['log']) for round in [2,3,4] for u in r['units']),r
 page.locator('#battlecanvas').screenshot(path=str(OUT/'33-native-three-round-escape.png'))
 print('PASS 33 all four native action queues receive rounds2/3/4 and walk out before high water; finite-budget fixture without enemy fire',flush=True)
 assert not errors,errors
 browser.close()
