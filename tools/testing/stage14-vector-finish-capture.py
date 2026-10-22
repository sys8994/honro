"""Stage14 vector finish: actual UI entry, wheel and drag; isolated profile."""
import json,sys,shutil,hashlib,subprocess,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from story_browser_server import story_base_url
group=sys.argv[2] if len(sys.argv)>2 else 'ui'
out=ROOT/'_local/reports/stage14-vector-finish'/sys.argv[1];out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1180,'height':757});errors=[];http=[]
 p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:http.append({'url':r.url,'status':r.status})if r.status>=400 else None)
 p.goto(story_base_url()+'/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=90000)
 def skip_dialogues():
  for i in range(30):
   p.wait_for_timeout(120)
   if not p.evaluate('!!HonroApp.dialogue'):break
   skip=p.locator('[data-action=dialogue-skip]');nxt=p.locator('[data-action=dialogue-next]')
   if skip.count():skip.click()
   elif nxt.count():nxt.click()
  assert not p.evaluate('!!HonroApp.dialogue')
 p.locator('[data-action=settings]').click()
 p.locator('[data-action=settings-page][data-id=records]').click()
 p.locator('[data-action=settings-page][data-id=debug]').click()
 p.locator('#debug-mode-setting').click();skip_dialogues()
 p.locator('[data-action=journey-book]').click()
 p.locator('[data-action=journey-act][data-id="2"]').click()
 p.locator('[data-action=journey-select][data-id="14"]').click();p.wait_for_timeout(450)
 p.locator('[data-action=journey-travel][data-id="14"]').click()
 p.wait_for_function('HonroApp.screen==="rest"&&HonroApp.debugRestStage===14');skip_dialogues();p.wait_for_timeout(450)
 p.locator('[data-action=journey-enter][data-id="14"]').click()
 p.wait_for_function('HonroApp.screen==="battle"&&HonroApp.engine?.b.honroStage===14',timeout=90000)
 skip_dialogues()
 p.wait_for_function('HonroAuthoredFarArt.ready(14)',timeout=90000);p.wait_for_timeout(700)
 rows=[]
 def snap(name,mode):
  p.wait_for_timeout(160)
  row=p.evaluate('''()=>{const a=HonroApp,s=a.scene,b=a.engine.b,r=s.canvas.getBoundingClientRect(),v=HonroBounds.viewport(s,r.width,r.height),surface=HonroTerrainDomain.render(b).find(t=>t.id==='v14-upper-hamlet'),project=x=>(x-s.x)*s.scale+r.width/2+r.left;return{camera:[s.x,s.y,s.scale],viewport:v,canvas:{x:r.x,y:r.y,w:r.width,h:r.height},worldZeroScreenX:project(0),oldPlaneStartScreenX:project(-500),terrainLeft:surface.x,focus:HonroBounds.focus(b),goal:HonroAct2.current(b)?.id,actors:b.units.filter(u=>u.side===0||u.id==='resident-1').map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,screenX:project(u.x)})),cache:s.renderCacheStats()}}''')
  p.screenshot(path=str(out/(name+'.jpg')),type='jpeg',quality=86);assert(out/(name+'.jpg')).stat().st_size<1_000_000;rows.append({'file':name+'.jpg','mode':mode,**row});print(json.dumps(rows[-1]),flush=True)
 def drag(x0,y0,x1,y1):
  p.mouse.move(x0,y0);p.mouse.down();p.mouse.move(x1,y1,steps=18);p.mouse.up();p.wait_for_timeout(120)
 if group in ['ui','final','camera']:
  snap('entry-default','Actual UI entry and automatic default follow')
  p.mouse.move(610,320);p.mouse.wheel(0,757);p.wait_for_timeout(120);p.mouse.wheel(0,757);p.wait_for_timeout(200);snap('upper-out','Actual wheel to normal minimum zoom')
  if group in ['ui','final']:
   drag(600,550,600,110);snap('middle-pan','Actual camera drag into middle village')
  if group=='camera':
   for i in range(3):drag(600,540,600,140)
   for i in range(3):drag(340,390,1040,390)
   snap('left-pan','Actual lower left boundary at unchanged minimum zoom/focus constraint')
   for i in range(3):drag(1040,390,340,390)
   snap('right-pan','Actual lower right boundary at unchanged minimum zoom/focus constraint')
 views=[('overview',3800,5200,.067,1440,960,'structure'),('upper-body',1850,3250,.35,1440,900,'structure'),('middle',4600,5000,.30,1440,900,'structure'),('lower',4100,8500,.30,1440,900,'structure'),('upper-home',2675,2250,.60,1440,900,'detail'),('market',4700,4000,.52,1440,900,'detail'),('family',4250,6800,.55,1440,900,'detail'),('bridge',3550,8150,.60,1440,900,'detail'),('mobile-upper',2675,2500,.40,390,844,'camera'),('mobile-family',4210,6700,.45,390,844,'camera'),('mobile-bridge',3600,8150,.42,390,844,'camera')]
 for name,x,y,z,w,h,focus in views:
  if group=='ui' and name!='overview':continue
  if group=='final' and name not in ['overview','family','bridge','mobile-family']:continue
  if group not in ['ui','final','all'] and group!=focus:continue
  p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(100);p.evaluate('HonroApp.scene.render(HonroApp.engine,0,"",.6,false,0)')
  p.evaluate('''v=>{const a=HonroApp,s=a.scene;Object.assign(s,{manual:true,x:v.x,y:v.y,scale:v.z,editorView:v.name==='overview',skillPreview:v.name==='overview',goalFocus:null,cinematic:null,storyTween:null});s.render(a.engine,0,'',.6,false,0)}''',dict(name=name,x=x,y=y,z=z))
  snap(name,'Separate fixed production camera '+focus+'; actors/gameplay unchanged')
 sources=['shared/data/campaign.json','tools/environment/stage14-vertical-art.mjs','tools/environment/stage14-vector-finish.mjs','shared/runtime/act2-spatial-art.js','shared/runtime/renderer.js','shared/map/bounds.js','web/manifest.json']
 report={'sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'workingTree':subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True),'baseURL':os.environ.get('HONRO_BASE_URL','local checked-out production build'),'scope':'Isolated fresh debug profile, actual UI entry/wheel/pan then separate fixed overview. No battle input/combat completion or dynamic FPS claim.','rows':rows,'sourceHashes':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest()for f in sources if (ROOT/f).exists()},'errors':errors,'httpFailures':http};(out/'capture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');b.close();assert not errors;assert not http
