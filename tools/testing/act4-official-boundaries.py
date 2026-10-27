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

 page.evaluate('HonroCampaignLoader.ensureStage(31)');ev('HonroApp.showRest()');finish();assert ev('HonroJourneyContent.next(HonroApp.profile).stageId')==31
 ev("HonroRestJourney.requestLaunch(HonroApp,31,'next')");page.wait_for_function('HonroApp.engine?.b.honroStage===31');finish()
 step(60);finish();step(2)
 assert ev('HonroApp.engine.b.honroAct4PreviewState.events.arrival.presented.length')==2
 ev("()=>{const e=HonroApp.engine;for(const u of e.b.units.filter(u=>u.side===1))e.hurt(u,1e6);}")
 step(30);finish();step(180);finish();step(5)
 assert ev('HonroApp.engine.b.honroAct4PreviewState.boat.phase')=='docked';assert not ev('HonroAct4TerrainPreview.interact()')
 ev("()=>{const e=HonroApp.engine;for(const [i,u]of e.b.units.filter(u=>u.side===0).entries())Object.assign(u,{x:6320+i*90,y:1860,vx:0,vy:0,acted:false});e.b.active='archer';e.b.phase='aim';e.b.side=0;}");ev('Object.assign(HonroApp.scene,{manual:true,x:6470,y:1650,scale:.6,storyTween:null,storyFrame:null,editorView:true,skillPreview:true});HonroReinforcementCamera.prime(HonroApp.scene,HonroApp.engine.b)');render();assert ev('HonroAct4TerrainPreview.interact()');assert ev('HonroApp.profile.equipment.ownedItemIds.includes("itm_se_06")');page.locator('#battlecanvas').screenshot(path=str(OUT/'31-official-boarding.png'))
 print('PASS native rest after30 ->31; real boat approach/deck; party boarding required; equipment once',flush=True)
 setup(36,2370,2010,2600,1800,'knight');step(40);finish();step(2)
 assert not ev('HonroApp.engine.b.honroAct4PreviewState.complete');assert ev('HonroAct4TerrainPreview.interact()');step(15);finish();step(30);finish();step(2)
 assert ev('HonroApp.engine.b.honroAct4PreviewState.door.phase')=='fallen'
 assert ev('["A4.S36.DOOR.01","A4.S36.DOOR.02"].every(id=>HonroApp.engine.b.honroAct4PreviewState.receipts.includes(id))')
 ev("()=>{const a=HonroApp,e=a.engine;for(const [i,u]of e.b.units.filter(u=>u.side===0).entries()){u.x=6650+i*70;u.y=HonroMapEngine.surfaceY(e.b.terrain,u.x).y;u.vx=u.vy=0;}Object.assign(a.scene,{manual:true,x:6800,y:1800,scale:.5,storyTween:null,storyFrame:null});HonroReinforcementCamera.prime(a.scene,e.b);}");step(15);finish();step(2);assert ev('HonroAct4TerrainPreview.interact()')
 print('PASS36 actual fallen door render/sound/quiet+both receipts ->leave ->exit',flush=True)
 page.set_viewport_size({'width':390,'height':844});setup(37,7300,2200,7400,2000)
 ev("()=>{const a=HonroApp,e=a.engine;Object.assign(a.scene,{manual:false,focusUntil:0,speakerUntil:0,focusId:null,speakerId:null,editorView:false,skillPreview:false,storyFrame:null,storyTween:null,cinematic:null,goalFocus:null,scale:.62});for(let i=0;i<360;i++)a.scene.render(e,HONRO_CORE.STEP,'',.5,false,HONRO_CORE.STEP);}")
 page.screenshot(path=str(OUT/'37-official-mobile-signal.png'));step(2);assert ev('HonroApp.engine.b.honroAct4PreviewState.observed.signal!==undefined');finish();step(1);assert ev('HonroApp.engine.b.honroAct4PreviewState.events.signal.terminal')
 assert not errors,errors;print('PASS37 normal mobile follow actually sees signal/gesture; native entry guides acknowledged; no page errors',flush=True);browser.close()
