import json,shutil,subprocess,os
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];out=root/'game/docs/act2-pacing-20261022/evidence';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto('http://127.0.0.1:8854/HONRO.html');p.wait_for_function('window.HonroApp',timeout=90000)
 ids=[int(i) for i in __import__('sys').argv[1:]] or [11]
 rows=[];keyboard=[]
 for id in ids:
  p.evaluate('''async id=>{await HonroCampaignLoader.ensureStage(id);const a=HonroApp; a.frame=()=>{};a.profile=HONRO_CORE.defaults();a.profile.recruited=['archer','mage','knight','occultist'];for(const cls of a.profile.recruited)a.profile.heroes[cls].xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);a.profile.settings.music=false;a.profile.settings.sound=false;a.stageId=id;a.stage=HONRO_CONTENT.stages[id-1];a.dialogue=null;const map=HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id);a.mount(HonroMaps.createBattle(map,HONRO_PROJECT,a.profile));while(a.dialogue)HonroStory.finish(a);a.close();a.updateHUD(true);}''',id)
  p.wait_for_function(f'HonroAuthoredFarArt.ready({id})',timeout=90000)
  p.evaluate('''()=>{const a=HonroApp;Object.getPrototypeOf(a).frame.call(a,a.prev+16.667);while(a.dialogue)HonroStory.finish(a);}''');p.wait_for_timeout(350)
  start=p.evaluate('HonroApp.prev=performance.now();HonroApp.engine.active.x');p.keyboard.down('ArrowRight')
  p.evaluate('''()=>{const a=HonroApp,frame=Object.getPrototypeOf(a).frame;for(let n=0;n<20;n++){frame.call(a,a.prev+16.667);if(a.dialogue)while(a.dialogue)HonroStory.finish(a);}}''');p.keyboard.up('ArrowRight');end=p.evaluate('HonroApp.engine.active.x');assert end>start;keyboard.append({'stage':id,'startX':start,'endX':end,'input':'real keyboard ArrowRight; production App.frame 20 frames'})
  if os.environ.get('HONRO_PACING_CAPTURE_FINAL_ONLY'):
   p.wait_for_timeout(1100);p.evaluate('HonroStory.tick(HonroApp,performance.now())')
  views={11:[('focus1-overview',8000,7250,.115,1440,900),('focus2-refuge',10350,8470,.5,1440,900),('focus3-mobile-trace',11900,7850,.36,390,844),('final-lower-route',11300,8100,.22,1440,900)],14:[('focus1-overview',3800,4900,.105,1200,1000),('focus2-refuge',4200,8000,.45,1440,900),('focus3-mobile-market',4730,3910,.48,390,844),('final-bridge',4300,8170,.35,1200,700)],17:[('focus1-overview',5800,4000,.14,1440,900),('focus2-hoist',7500,4500,.4,1440,900),('focus3-mobile',8660,4500,.4,390,844),('final-worksite',8700,4700,.25,1200,700)],18:[('focus1-overview',7250,4800,.18,1440,900),('focus2-mouth',7350,6280,.44,1440,900),('focus3-mobile',7350,6280,.34,390,844),('final-keeper',11200,6050,.36,1440,900)]}[id]
  for label,x,y,z,w,h in views:
   if os.environ.get('HONRO_PACING_CAPTURE_FINAL_ONLY') and not label.startswith('final-'):continue
   native=root/f'_local/reports/act2-pacing/segment-{id}.json'
   if os.environ.get('HONRO_PACING_CAPTURE_FINAL_ONLY') and id in [14,17,18] and native.exists():
    saved=json.loads(native.read_text());assert saved['result']['phase']=='won';p.evaluate('''v=>{const a=HonroApp;a.dialogue=null;a.mount(v.final);while(a.dialogue)HonroStory.finish(a);a.close();a.updateHUD(true);}''',saved)
   p.set_viewport_size({'width':w,'height':h})
   if id==11 and label=='final-lower-route':p.evaluate('''()=>{const a=HonroApp,b=a.engine.b;for(const s of HonroAct2.steps(b))if(s.id!=='trace')HonroAct2.memory(b).done[s.id]=true;a.updateHUD(true);}''')
   if label=='final-keeper' and not os.environ.get('HONRO_PACING_CAPTURE_FINAL_ONLY'):p.evaluate('''()=>{const a=HonroApp,b=a.engine.b;HonroStage18Bell.shift(b,b.honroBellDescent.distance);HonroStage18Bell.memory(b).status='settled';for(const s of HonroAct2.steps(b)){if(s.id==='keeper')break;HonroAct2.memory(b).done[s.id]=true;}b.sceneVersion++;a.updateHUD(true);}''')
   p.evaluate('''v=>{const a=HonroApp,s=a.scene;Object.assign(s,{manual:true,x:v.x,y:v.y,scale:v.z,storyTween:null,cinematic:null,goalFocus:null,editorView:v.label.includes('overview'),skillPreview:v.label.includes('overview')});s.render(a.engine,0,'',.6,false,0);}''',{'x':x,'y':y,'z':z,'label':label})
   p.wait_for_timeout(150);p.evaluate('HonroApp.scene.render(HonroApp.engine,0,"",.6,false,0)');file=f'{id}-{label}.jpg';p.locator('#battlecanvas').screenshot(path=str(out/file),type='jpeg',quality=82);rows.append({'stage':id,'label':label,'file':file,'camera':[x,y,z],'viewport':[w,h]})
  print('CAPTURED',id,flush=True)
 (out/((('final-capture-'+str(ids[0]) if len(ids)==1 else 'final-capture') if os.environ.get('HONRO_PACING_CAPTURE_FINAL_ONLY') else 'capture-'+str(ids[0]))+'.json')).write_text(json.dumps({'sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'scope':'Normal-level real browser Scene; camera fixtures. Final-only mode renders saved actual native segment wins for14/17/18; other views are prepared camera/progression fixtures, not full-stage input completions.','rows':rows,'keyboard':keyboard,'errors':errors},ensure_ascii=False,indent=2));assert not errors; b.close()
