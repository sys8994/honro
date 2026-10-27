"""Original App/Story/Engine controlled event fixtures, not normal playthrough."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-preview/events';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8772/HONRO.html');page.wait_for_function('!!window.HonroApp')
 page.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(30);await HonroCampaignLoader.ensureStage(21);HonroApp.frame=()=>{};HonroApp.profile.settings.music=false;HonroApp.profile.settings.sound=false;window.HONRO_ACT4_PREVIEW_SEEDS=await(await fetch('game/docs/act4/dialogue-seeds-31-35-36-reviewed-final.json')).json();}''')
 for path in ['review-art.js','terrain-preview.js','preview-events.js']:page.add_script_tag(url='http://127.0.0.1:8772/tools/act4/'+path)
 def ev(s):return page.evaluate(s)
 def settle():page.wait_for_timeout(180)
 def finish():
  for i in range(10):
   if not ev('!!window.HonroApp.dialogue'):return
   settle();ev('HonroStory.next(HonroApp)')
  assert not ev('!!window.HonroApp.dialogue')
 render='''()=>{const a=HonroApp;Object.assign(a.scene,{manual:true,storyTween:null,cinematic:null,goalFocus:null,storyFrame:null,editorView:true,skillPreview:true});a.scene.render(a.engine,0,'',.6,false,0);}'''
 ev('HonroAct4TerrainPreview.launch(31)');ev('''()=>{for(let i=0;i<45;i++){HonroAct4TerrainPreview.observe(HonroApp,.1);HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0);}}''');ev(render);settle();assert ev('HonroApp.dialogue?.lines[0][2].act4PreviewRow')=='A4.S31.ENTRY.01';finish();settle()
 assert ev('HonroApp.engine.b.honroAct4PreviewState.events.arrival.presented.length')==2
 ev('''()=>{const e=HonroApp.engine;for(const u of e.b.units.filter(u=>u.side===1))e.hurt(u,100000); }''');settle();assert ev('HonroApp.engine.b.honroAct4PreviewState.boat.phase')=='approach';finish();settle()
 ev('''()=>{for(let i=0;i<18;i++)HonroAct4TerrainPreview.observe(HonroApp,1);}''');finish();settle();ev(render)
 assert ev('HonroApp.engine.b.honroAct4PreviewState.boat.phase')=='docked';assert not ev('HonroAct4TerrainPreview.interact()')
 assert not ev('HonroApp.engine.b.honroAct4PreviewState.complete')
 ev('''()=>{const a=HonroApp,e=a.engine;for(const [i,u]of e.b.units.filter(u=>u.side===0).entries()){u.x=6320+i*90;u.y=1860;u.vx=u.vy=0;}Object.assign(a.scene,{x:6470,y:1650,scale:.6});}''');ev(render)
 assert ev('HonroAct4TerrainPreview.interact()');page.locator('#battlecanvas').screenshot(path=str(OUT/'31-boat-docked.png'))
 ev('window.boatSaved=HonroAct4TerrainPreview.snapshot();HonroAct4TerrainPreview.restore(boatSaved)');assert ev('HonroApp.engine.b.honroAct4PreviewState.complete')
 ev('HonroAct4TerrainPreview.launch(36)')
 ev('''()=>{const a=HonroApp,e=a.engine;for(const u of e.b.units.filter(u=>u.side===1))e.hurt(u,100000);e.b.active='knight';const u=e.active;u.x=2370;u.y=HonroMapEngine.surfaceY(e.b.terrain,u.x).y;u.vx=u.vy=0;Object.assign(a.scene,{x:2600,y:1800,scale:.6});}''');ev(render);settle();finish();settle();assert ev('HonroAct4TerrainPreview.interact()')
 ev('''()=>{for(let i=0;i<6;i++)HonroAct4TerrainPreview.observe(HonroApp,1);}''')
 assert not ev('!!window.HonroApp.engine.b.honroAct4PreviewState.events.door_falls?.started'),'unrendered fall must not narrate'
 ev('window.doorSaved=HonroAct4TerrainPreview.snapshot();HonroAct4TerrainPreview.restore(doorSaved)');ev('HonroAct4TerrainPreview.observe(HonroApp,5)');assert not ev('!!window.HonroApp.engine.b.honroAct4PreviewState.events.door_falls?.started')
 ev('Object.assign(HonroApp.scene,{x:2450,y:1800,scale:.6})');ev(render);page.locator('#battlecanvas').screenshot(path=str(OUT/'36-door-fallen.png'))
 ev('HonroAct4TerrainPreview.observe(HonroApp,2.5)');settle();assert ev('HonroApp.dialogue?.lines[0][2].act4PreviewRow')=='A4.S36.DOOR.01'
 ev('HonroApp.engine.hurt(HonroApp.engine.b.units.find(u=>u.id==="knight"),100000)');ev('HonroStory.next(HonroApp)');settle()
 state=ev('HonroApp.engine.b.honroAct4PreviewState')
 assert state['events']['door_falls']['presented']==['A4.S36.DOOR.01'],state
 assert 'A4.S36.DOOR.02' in state['events']['door_falls']['retired'],state
 assert 'A4.S36.DOOR.02' not in state['receipts'];assert not state['events'].get('leave',{}).get('started')
 ev('HonroAct4TerrainPreview.launch(35)');settle();finish();settle()
 ev('''()=>{const a=HonroApp,e=a.engine,u=e.b.units.find(u=>u.id==='archer');e.b.active=u.id;const cast=x=>{u.x=x;u.y=HonroMapEngine.surfaceY(e.b.terrain,x).y;u.vx=u.vy=0;u.acted=false;u.focus=u.maxFocus;u.critChance=0;e.b.phase='aim';e.b.side=0;if(!e.fire('A01',5,.2))throw Error('fixture fire rejected');for(let i=0;i<1000&&e.b.projectiles.length;i++)for(const p of [...e.b.projectiles])if(e.b.projectiles.includes(p))e.stepProjectile(p,HONRO_CORE.STEP);};cast(3040);cast(3350);u.x=3040;u.y=HonroMapEngine.surfaceY(e.b.terrain,u.x).y;e.b.phase='aim';HonroAct4TerrainPreview.observe(a,.1);}''');settle()
 assert ev('HonroApp.engine.b.honroAct4PreviewState.blockedAtBamboo&&HonroApp.engine.b.honroAct4PreviewState.clearShotFromSide')
 assert not ev('!!HonroApp.dialogue');assert ev('HonroApp.engine.b.phase')=='aim'
 assert 'A4.S35.MID.01' in ev('HonroApp.engine.b.honroAct4PreviewState.receipts')
 ev('window.barkSaved=HonroAct4TerrainPreview.snapshot();HonroAct4TerrainPreview.restore(barkSaved)');settle()
 assert ev('HonroApp.engine.b.honroAct4PreviewState.receipts.filter(id=>id==="A4.S35.MID.01").length')==1
 assert not errors,errors
 (OUT/'results.json').write_text(json.dumps({'scope':__doc__,'boat':'moved/docked/group check/snapshot preserved','door':'unrendered held across snapshot; rendered+silence; dead unseen row retired','final':state,'pageErrors':errors},ensure_ascii=False,indent=2))
 print('PASS preview boat movement/deck/snapshot; door rendered/snapshot/dead unseen receipt; real bamboo/side shot/live bark/once; pageerror0')
 browser.close()
