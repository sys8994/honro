"""Original App/Scene/Engine controlled chapter fixtures; not a normal campaign playthrough."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-official';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8772/HONRO.html');page.wait_for_function('!!window.HonroApp')
 page.evaluate("""()=>{const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};for(let n=1;n<=30;n++)a.profile.cleared[n]={visits:1,rounds:1};a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];for(const cls of a.profile.recruited)a.profile.heroes[cls].xp=C.xpAtLevel(22);a.persist();}""")
 def ev(code):return page.evaluate(code)
 def render():ev("HonroApp.scene.render(HonroApp.engine,0,'',.5,false,0)")
 def finish():
  for i in range(16):
   page.wait_for_timeout(100)
   if not ev('!!HonroApp.dialogue'):break
   ev('HonroAct4TerrainPreview.observe(HonroApp,.01);HonroStory.next(HonroApp)')
  page.wait_for_timeout(150)
 def setup(n,x,y,cx,cy,cls='archer'):
  page.evaluate('n=>HonroCampaignLoader.ensureStage(n)',n)
  page.evaluate('n=>{for(let i=31;i<n;i++)HonroApp.profile.cleared[i]??={visits:1,rounds:1};HonroApp.launch(n);HonroApp.close();}',n)
  page.wait_for_function('n=>HonroApp.engine?.b.honroStage===n',arg=n);page.wait_for_timeout(200);finish()
  page.evaluate("""v=>{const a=HonroApp,e=a.engine,b=e.b;for(const u of b.units.filter(u=>u.side===1))e.hurt(u,100000);for(let i=0;i<300;i++)e.tick(HONRO_CORE.STEP);b.phase='aim';b.side=0;b.active=v.cls;const u=e.active;const p=HonroTerrain.place(b,u,{x:v.x,y:v.y,maxDistance:80});if(!p)throw Error('fixture placement');Object.assign(u,p,{vx:0,vy:0});Object.assign(a.scene,{manual:true,editorView:true,skillPreview:true,x:v.cx,y:v.cy,scale:.5,storyTween:null,cinematic:null,storyFrame:null,goalFocus:null});HonroReinforcementCamera.prime(a.scene,b);} """,dict(x=x,y=y,cx=cx,cy=cy,cls=cls))
  render()
 def step(count=1,dt=.1):
  for _ in range(count):ev(f'HonroAct4TerrainPreview.observe(HonroApp,{dt})');render()
 def launch(n):
  page.evaluate('n=>HonroCampaignLoader.ensureStage(n)',n);page.evaluate('n=>{for(let i=31;i<n;i++)HonroApp.profile.cleared[i]??={visits:1,rounds:1};HonroApp.launch(n);}',n);page.wait_for_function('n=>HonroApp.engine?.b.honroStage===n',arg=n);page.wait_for_timeout(200);finish()
 # Enemy water traits and their low-bank navigation reservation.
 launch(39)
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
 launch(39)
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
 launch(39)
 ev("""()=>{const a=HonroApp,e=a.engine,b=e.b;for(const u of b.units.filter(u=>u.side===1&&!u.honroAct4WreckBoss))e.hurt(u,100000);b.active='mage';Object.assign(e.active,HonroTerrain.place(b,e.active,{x:5930,y:1720,maxDistance:100}),{vx:0,vy:0});Object.assign(a.scene,{manual:true,editorView:true,skillPreview:true,x:6100,y:1850,scale:.5,storyFrame:null,storyTween:null});HonroReinforcementCamera.prime(a.scene,b);}""");render()
 assert ev('HonroAct4TerrainPreview.interact()');step(20);finish();step(3)
 ev("""()=>{const e=HonroApp.engine;e.b.active='occultist';Object.assign(e.active,HonroTerrain.place(e.b,e.active,{x:5470,y:1720,maxDistance:100}),{vx:0,vy:0});Object.assign(HonroApp.scene,{x:5600,y:1850});}""")
 assert ev('HonroAct4TerrainPreview.interact()');step(20);finish();step(3)
 for turn in range(25):ev('HonroApp.engine.b.shot++');step(30);finish()
 assert ev('HonroApp.engine.b.honroAct4PreviewState.rescued.ids.length')==4
 ev("""()=>{const e=HonroApp.engine;for(const [i,u]of e.b.units.filter(u=>u.side===0).entries()){u.x=8300+i*80;u.y=HonroMapEngine.surfaceY(e.b.terrain,u.x).y;u.vx=u.vy=0;}}""")
 assert ev('HonroAct4TerrainPreview.interact()');assert ev('HonroApp.engine.b.phase')=='won'
 assert ev('HonroApp.engine.b.honroAct4PreviewState.completionProof.bossAlive')
 print('PASS 39 actual four NPC walks/grounded high arrival/party exit wins with live boss; controlled-turn fixture',flush=True)
 assert not errors,errors;browser.close()
