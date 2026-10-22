"""Stage15 floor/ceiling material: actual UI entry, wheel and drag; isolated profile."""
import json,sys,shutil,hashlib,subprocess,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from story_browser_server import story_base_url
group=sys.argv[2] if len(sys.argv)>2 else 'ui'
out=ROOT/'_local/reports/stage15-vector-finish'/sys.argv[1];out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport=({'width':390,'height':844} if group=='mobile' else {'width':1180,'height':757}));errors=[];http=[]
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
 p.locator('[data-action=journey-select][data-id="15"]').click();p.wait_for_timeout(450)
 p.locator('[data-action=journey-travel][data-id="15"]').click()
 p.wait_for_function('HonroApp.screen==="rest"&&HonroApp.debugRestStage===15');skip_dialogues();p.wait_for_timeout(450)
 p.locator('[data-action=journey-enter][data-id="15"]').click()
 p.wait_for_function('HonroApp.screen==="battle"&&HonroApp.engine?.b.honroStage===15',timeout=90000)
 skip_dialogues()
 p.wait_for_function('HonroAuthoredFarArt.ready(15)',timeout=90000);p.wait_for_timeout(700)
 rows=[]
 def snap(name,mode):
  p.wait_for_timeout(180)
  row=p.evaluate("""()=>{const a=HonroApp,s=a.scene,b=(window.__stage15FixtureEngine||a.engine).b,r=s.canvas.getBoundingClientRect();return{camera:[s.x,s.y,s.scale],viewport:HonroBounds.viewport(s,r.width,r.height),goal:HonroAct2.current(b)?.id,objectiveText:document.querySelector('#objective-text')?.textContent,phase:b.phase,round:b.round,drain:HonroAct2.memory(b).drainRevealed||false,ledge:b.terrain.find(t=>t.id==='fc15-drained-ledge')?.broken,cache:s.renderCacheStats(),heroes:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}))}}""")
  path=out/(name+'.jpg');p.screenshot(path=str(path),type='jpeg',quality=86);assert path.stat().st_size<1_000_000;rows.append({'file':name+'.jpg','mode':mode,**row});print(json.dumps(rows[-1],ensure_ascii=False),flush=True)
 def drag(x0,y0,x1,y1):
  p.mouse.move(x0,y0);p.mouse.down();p.mouse.move(x1,y1,steps=18);p.mouse.up();p.wait_for_timeout(160)
 def horizontal(target):
  w=p.viewport_size['width'];cx=w/2
  for i in range(14):
   x,z=p.evaluate('[HonroApp.scene.x,HonroApp.scene.scale]');dx=max(-w*.55,min(w*.55,(x-target)*z))
   if abs(dx)<2:break
   drag(cx,310,max(25,min(w-25,cx+dx)),310)
 def fixed(name,x,y,z,w=1440,h=900):
  p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(100)
  p.evaluate("""v=>{const a=HonroApp,s=a.scene;Object.assign(s,{manual:true,x:v.x,y:v.y,scale:v.z,editorView:v.name==='overview',skillPreview:v.name==='overview',goalFocus:null,cinematic:null,storyTween:null});s.render(window.__stage15FixtureEngine||a.engine,0,'',.6,false,0)}""",dict(name=name,x=x,y=y,z=z));snap(name,'Fixed production camera; no gameplay actions')
 if group in ['ui','camera','mobile','final']:
  snap('entry-default','Actual fresh UI entry/default follow')
  p.mouse.move(min(610,p.viewport_size['width']/2),310);p.mouse.wheel(0,757);p.wait_for_timeout(120);p.mouse.wheel(0,757);p.wait_for_timeout(240);snap('minimum-entry','Actual UI wheel two pages')
  horizontal(4000);snap('center-pan','Actual horizontal camera drag after wheel')
  if group in ['camera','mobile']:
   horizontal(-3000);snap('left-pan','Actual west focus limit');assert abs(rows[-1]['camera'][0]+320)<1
   horizontal(11000);snap('right-pan','Actual east focus limit');assert abs(rows[-1]['camera'][0]-8320)<1
   horizontal(4000)
   for i in range(4):drag(p.viewport_size['width']/2,520,p.viewport_size['width']/2,160)
   snap('lower-pan','Actual lower camera focus limit')
 views=[('overview',4000,3150,.12,'structure'),('entry',1100,3250,.45,'structure'),('cavern',4200,2850,.32,'structure'),('water',5680,4420,.5,'structure'),('exit',7200,3350,.5,'structure'),('west-arch',4210,3690,.65,'detail'),('east-arch',7120,3950,.7,'detail'),('roof-near',4480,1710,.6,'detail')]
 for name,x,y,z,focus in views:
  if group=='ui' and name!='overview':continue
  if group=='final' and name not in ['overview','water']:continue
  if group not in ['ui','final'] and group!=focus:continue
  fixed(name,x,y,z)
 if group=='detail':
  fixed('water-before',5680,4420,.65)
  p.evaluate('HonroApp.frame=()=>{}');p.wait_for_timeout(80);original=p.evaluate('JSON.stringify(HonroApp.engine.b)')
  p.evaluate((ROOT/'tools/testing/stage15-drain-render-fixture.js').read_text())
  fixture_scope=p.evaluate("""()=>{const a=HonroApp,q=HonroStage15DrainRenderFixture(a.engine.b,a.stage);window.__stage15FixtureEngine=new HONRO_CORE.Engine(q.battle,()=>{},false);window.__stage15FixtureContacts=q.knownContacts;return q.scope;}""")
  fixed('water-after-fixture',5680,4420,.65)
  assert p.evaluate('JSON.stringify(HonroApp.engine.b)')==original
  rows[-1]['mode']=fixture_scope;rows[-1]['knownSeparateDrainContacts']=p.evaluate('window.__stage15FixtureContacts')
 sources=['tools/testing/stage15-drain-render-fixture.js','shared/data/campaign.json','tools/environment/stage15-vector-finish.mjs','shared/runtime/act2-spatial-art.js','shared/runtime/renderer.js','shared/map/bounds.js','web/manifest.json']
 report={'sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'workingTree':subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True),'scope':'Fresh isolated debug UI; actual wheel/drag and explicitly separate fixed cameras. No combat completion/FPS claim.','rows':rows,'sourceHashes':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest()for f in sources if(ROOT/f).exists()},'errors':errors,'httpFailures':http};(out/'capture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');b.close();assert not errors,errors;assert not http,http
