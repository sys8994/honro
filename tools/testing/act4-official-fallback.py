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
 launch(38)
 ev("""()=>{const a=HonroApp,e=a.engine,b=e.b;for(const u of b.units.filter(u=>u.side===1||u.id==='mage'))e.hurt(u,100000);b.honroAct4PreviewState.vistaDone=true;b.active='archer';const u=e.active;u.x=3100;u.y=3050;u.vx=u.vy=0;let jams=0;for(let i=0;i<2600&&u.x<4580;i++){u.moveLeft=10000;const x=u.x;e.move(1,HONRO_CORE.STEP);e.tick(HONRO_CORE.STEP);jams=u.x-x<.01?jams+1:0;if(jams>5&&e.grounded(u)){e.jump(u);jams=0;}}window.fallback={x:u.x,hp:u.hp,grounded:e.grounded(u),failure:b.honroAct4PreviewState.failure,connected:!!b.honroAct4PreviewState.connected};}""")
 r=ev('window.fallback');assert r['x']>=4580 and r['hp']>0 and not r['connected'] and not r.get('failure'),r
 print('PASS 38 mage actually dead: native movement/jumps cross finite emergency route; explicit position/movement-budget fixture; no fake mage/connection',flush=True)
 assert not errors,errors;browser.close()
