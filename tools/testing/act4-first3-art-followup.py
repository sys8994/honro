"""Actual initial positions; camera/art follow-up only, no campaign completion."""
import json,pathlib,hashlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-preview/art-followup';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8772/HONRO.html');page.wait_for_function('!!window.HonroApp')
 page.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(30);await HonroCampaignLoader.ensureStage(21);HonroApp.frame=()=>{};const ss=await Promise.all(['31-35-36','32-33-34-37','38-39-40'].map(async s=>(await fetch('game/docs/act4/dialogue-seeds-'+s+'-reviewed-final.json')).json()));HONRO_ACT4_PREVIEW_SEEDS={scenes:ss.flatMap(s=>s.scenes),ui:ss.flatMap(s=>s.ui)};}''')
 for f in ['review-art','terrain-preview','coast-maps','coast-art','preview-events','coast-events','preview-lifecycle']:page.add_script_tag(url='http://127.0.0.1:8772/tools/act4/'+f+'.js')
 def ev(s):return page.evaluate(s)
 ev('HonroAct4TerrainPreview.freezeReviewClock=true')
 def render(dt=.04):ev(f"HonroApp.scene.render(HonroApp.engine,{dt},'',.5,false,{dt})")
 def settle():
  for i in range(180):
   ev('HonroAct4TerrainPreview.observe(HonroApp,.04)');render();page.wait_for_timeout(20)
   if ev('!!HonroApp.dialogue'):
    page.wait_for_timeout(120);ev('HonroAct4TerrainPreview.observe(HonroApp,.01);HonroStory.next(HonroApp)')
   if i>80 and ev('!HonroApp.dialogue&&!HonroApp.scene.storyTween&&!HonroApp.engine.b.honroAct4PreviewState.arrivalTour?.active'):break
 rows=[]
 cues={31:[{'x':1100,'y':1900}],35:[{'x':850,'y':1810},{'x':900,'y':1730}],36:[{'x':1220,'y':1850},{'x':1350,'y':1760}]}
 for n in [31,35,36]:
  ev(f'HonroAct4TerrainPreview.launch({n})');initial=ev('HonroApp.engine.b.units.map(u=>[u.id,u.x,u.y,u.hp])');settle()
  ev('for(let i=0;i<300;i++)HonroApp.engine.tick(HONRO_CORE.STEP)');render(0)
  result=page.evaluate('''cues=>{const a=HonroApp,e=a.engine,s=a.scene,cv=s.canvas,w=cv.clientWidth,h=cv.clientHeight,screen=p=>({x:w/2+(p.x-s.x)*s.scale,y:h/2+(p.y-s.y)*s.scale});return {camera:{x:s.x,y:s.y,scale:s.scale,manual:s.manual},canvas:{w,h},intro:e.b.honroAct4StartView,units:e.b.units.map(u=>[u.id,u.x,u.y,u.hp]),heroes:e.b.units.filter(u=>u.side===0).map(u=>({id:u.id,...screen(u),pixels:u.h*s.scale,grounded:e.grounded(u)})),cues:cues.map(screen)};}''',cues[n])
  assert initial==result['units'],result
  assert all(u['grounded'] and u['pixels']>=24 and 20<u['x']<result['canvas']['w']-18 and result['canvas']['h']*.25<u['y']<result['canvas']['h']*.82 for u in result['heroes']),result
  assert all(12<v['x']<result['canvas']['w']-12 and 80<v['y']<result['canvas']['h']-35 for v in result['cues']),result
  assert result['intro']['active'],result
  page.locator('#battlecanvas').screenshot(path=str(OUT/f'{n}-mobile-normal-start.png'));rows.append({'chapter':n,**result})
  assert ev('HonroAct4TerrainPreview.save()');ev('HonroApp.stopBattle()');assert ev('HonroAct4TerrainPreview.resume()');render(0)
  assert ev('HonroApp.engine.b.honroAct4StartView.active');assert abs(ev('HonroApp.scene.scale')-result['camera']['scale'])<.001
  z=ev('HonroApp.scene.scale');ev('''()=>{const s=HonroApp.scene,c=s.canvas;s.zoom(1.2,c.clientWidth/2,c.clientHeight/2,true);}''');render();render();assert abs(ev('HonroApp.scene.scale')-z*1.2)<.001;assert ev('HonroApp.scene.manual');assert not ev('HonroApp.engine.b.honroAct4StartView.active')
  print('PASS',n,'unposed mobile start/next cue/300tick stable; manual zoom preserved',flush=True)
 # A fresh initial view returns to the established follow after actual walking.
 ev('HonroAct4TerrainPreview.launch(36)');settle();start=ev('HonroApp.engine.active.x')
 for i in range(30):ev('HonroApp.engine.move(1,HONRO_CORE.STEP);HonroApp.engine.tick(HONRO_CORE.STEP)');render(.02)
 for i in range(25):render(.02);page.wait_for_timeout(20)
 assert ev('HonroApp.engine.active.x')>start+16;assert not ev('HonroApp.engine.b.honroAct4StartView.active');assert not ev('HonroApp.scene.manual');assert abs(ev('HonroApp.scene.scale')-.62)<.001
 print('PASS native walking releases opening view to native follow',flush=True)
 # Same desktop camera as v4 initial; actors stay at their authored start.
 page.set_viewport_size({'width':1440,'height':900});ev('HonroAct4TerrainPreview.launch(31)');settle()
 ev('Object.assign(HonroApp.scene,{manual:true,x:470,y:HonroApp.engine.active.y-40,scale:.8,storyTween:null,storyFrame:null,goalFocus:null})');render(0)
 page.locator('#battlecanvas').screenshot(path=str(OUT/'31-sandbar-same-camera.png'))
 # Enlarged water-plane detail, camera only; no actor or collision edits.
 ev('Object.assign(HonroApp.scene,{manual:true,x:1170,y:1550,scale:1.0})');render(0);page.locator('#battlecanvas').screenshot(path=str(OUT/'31-sandbar-detail.png'))
 assert not errors,errors
 source=hashlib.sha256(b''.join((ROOT/'tools/act4'/f).read_bytes() for f in ['review-art.js','terrain-preview.js','preview-events.js'])).hexdigest()
 (OUT/'results.json').write_text(json.dumps({'scope':__doc__,'sourceSHA256':source,'rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2));browser.close()
