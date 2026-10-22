"""Production composite inspection; fixed cameras and explicit render fixtures.
No combat completion or natural descent claim. Old saves remain byte-exact.
"""
import gzip,json,hashlib,shutil,subprocess,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from story_browser_server import story_base_url
label=sys.argv[1];group=sys.argv[2] if len(sys.argv)>2 else 'shape'
out=ROOT/'_local/reports/stage18-bell-mouth'/label;out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 p=browser.new_page(viewport={'width':1440,'height':900});errors=[];http=[];rows=[]
 p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:http.append(r.url)if r.status>=400 else None)
 p.goto(story_base_url()+'/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=90000)
 def skip():
  for _ in range(30):
   p.wait_for_timeout(90)
   if not p.evaluate('!!HonroApp.dialogue'):return
   s=p.locator('[data-action=dialogue-skip]');(s if s.count()else p.locator('[data-action=dialogue-next]')).click()
  assert not p.evaluate('!!HonroApp.dialogue')
 p.locator('[data-action=settings]').click();p.locator('[data-action=settings-page][data-id=records]').click();p.locator('[data-action=settings-page][data-id=debug]').click();p.locator('#debug-mode-setting').click();skip()
 p.locator('[data-action=journey-book]').click();p.locator('[data-action=journey-act][data-id="2"]').click();p.locator('[data-action=journey-select][data-id="18"]').click();p.wait_for_timeout(300)
 p.locator('[data-action=journey-travel][data-id="18"]').click();p.wait_for_function('HonroApp.screen==="rest"&&HonroApp.debugRestStage===18');skip();p.wait_for_timeout(300)
 p.locator('[data-action=journey-enter][data-id="18"]').click();p.wait_for_function('HonroApp.engine?.b.honroStage===18',timeout=90000);skip();p.wait_for_function('HonroAuthoredFarArt.ready(18)',timeout=90000)
 p.wait_for_function('!document.querySelector("#turn-banner")||document.querySelector("#turn-banner").hidden',timeout=10000)
 p.evaluate('HonroApp.frame=()=>{}');p.wait_for_timeout(80)
 original=p.evaluate('JSON.stringify(HonroApp.engine.b)')
 p.evaluate((ROOT/'tools/testing/stage18-bell-render-fixture.js').read_text())
 def shot(name,x=7500,y=6420,z=.4,w=1440,h=900,scope='Fresh18 actual UI, declared inspection camera'):
  p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(80)
  before=p.evaluate('JSON.stringify((window.__mouthEngine||HonroApp.engine).b)')
  info=p.evaluate('''v=>{const a=HonroApp,e=window.__mouthEngine||a.engine,s=a.scene,b=e.b;
    Object.assign(s,{manual:true,x:v.x,y:v.y,scale:v.z,editorView:true,skillPreview:true,goalFocus:null,cinematic:null,storyTween:null});
    s.render(e,0,'',.6,false,0);const body=b.honroLandmarks.find(l=>l.id==='sb-bell-body');
    return{stage:b.honroStage,round:b.round,bell:structuredClone(HonroStage18Bell.memory(b)),camera:[s.x,s.y,s.scale],
      savedVector:body.asset.vector.source,paintVector:HonroStage18BellArt.bellPaint(body.asset,b).paint.vector.source};}''',dict(x=x,y=y,z=z))
  p.wait_for_timeout(100);p.screenshot(path=str(out/(name+'.jpg')),type='jpeg',quality=87)
  assert(out/(name+'.jpg')).stat().st_size<1_000_000
  assert p.evaluate('JSON.stringify((window.__mouthEngine||HonroApp.engine).b)')==before
  for key in ['savedVector','paintVector']:info[key+'Sha256']=hashlib.sha256(info.pop(key).encode()).hexdigest()
  rows.append(dict(file=name+'.jpg',scope=scope,renderPure=True,**info))
 if group in ['shape','final']:
  shot('mouth');shot('whole',7200,4800,.16);shot('silhouette',7200,4500,.13);shot('mobile-mouth',7850,6380,.19,390,844)
 if group in ['states','final']:
  for phase,offset in [('suspended',0),('lowering',100),('settled',200)]:
   p.evaluate('''phase=>{const q=HonroStage18BellRenderFixture(HonroApp.engine.b,phase);window.__mouthEngine=new HONRO_CORE.Engine(q.battle,()=>{},false);}''',phase)
   shot('state-'+phase,y=6420+offset,scope='Forced '+phase+' render fixture; actors/source unchanged; not natural descent')
   assert rows[-1]['bell']['offset']==offset
  p.evaluate('''()=>{const q=HonroStage18BellRenderFixture(HonroApp.engine.b,'settled');
    const u=q.battle.units.find(u=>u.id==='p-mage');Object.assign(u,{x:7740,y:6603.6,vx:0,vy:0});
    window.__mouthEngine=new HONRO_CORE.Engine(q.battle,()=>{},false);}''')
  shot('route-pose',x=8000,y=6470,z=.65,scope='Explicit cloned settled fixture; mage posed on actual ramp walk edge; no traversal claim')
  p.evaluate('delete window.__mouthEngine');assert p.evaluate('JSON.stringify(HonroApp.engine.b)')==original
 if group in ['reuse','final']:
  p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(19);const st=HONRO_PROJECT.stages[18],b=HonroMaps.createBattle(st,HONRO_PROJECT,HonroApp.profile);HonroStageRules.sanitizeStageBattle(b);window.__mouthEngine=new HONRO_CORE.Engine(b,()=>{},false);}''')
  p.evaluate("HonroApp.scene.render(window.__mouthEngine,0,'',.6,false,0)");p.wait_for_function('HonroAuthoredFarArt.ready(19)',timeout=90000)
  shot('stage19-mouth',y=6620,scope='Fresh19 production factory render; no campaign transition claim')
  path=ROOT/'tests/fixtures/stage18-current-post-descent-r22-20261022.json.gz';record=json.loads(gzip.decompress(path.read_bytes()));expected=record['profile']['honroBattle']
  p.evaluate('''profile=>{delete window.__mouthEngine;const a=HonroApp;a.debugMode=false;a.profile=profile;a.normalProfile=profile;a.continue();a.close();a.updateHUD(true);}''',record['profile'])
  p.wait_for_function('HonroApp.engine?.b.round===22');assert json.loads(p.evaluate('JSON.stringify(HonroApp.engine.b)'))==expected
  shot('old-r22-mouth',y=6620,scope='Actual R22 Continue; entire saved battle including old SVG unchanged; fixed render camera')
  assert json.loads(p.evaluate('JSON.stringify(HonroApp.engine.b)'))==expected
  with p.expect_download()as dl:p.evaluate('HonroApp.export()')
  assert json.loads(Path(dl.value.path()).read_text())['honroBattle']==expected
 report={'sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'tree':subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True),'rows':rows,'errors':errors,'httpFailures':http}
 (out/'capture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');assert not errors,errors;assert not http,http;browser.close()
 print('PASS composite inspection screenshots '+str(len(rows)))
