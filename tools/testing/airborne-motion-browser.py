"""Actual Chromium production inputs, normal starting resources, virtual clock; no completion claim."""
import hashlib,json,shutil,sys,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/airborne-after/browser');out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});p.goto('http://127.0.0.1:8854/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroAuthoredFarArt',timeout=90000)
 p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(2);const a=HonroApp;a.frame=()=>{};a.profile.cleared[1]={visits:1,rounds:5};a.launch(2);window.motionMs=performance.now();performance.now=()=>motionMs;window.motionRows=[];window.motionLast='';window.motionTick=()=>{motionMs+=HONRO_CORE.STEP*1000;if(a.dialogue){HonroStory.next(a);return;}HonroStory.turn(a);if(HonroStory.turnPaused(a))return;if(a.canInput())a.defend();a.engine.tick(HONRO_CORE.STEP);a.missionTick(HONRO_CORE.STEP);const b=a.engine.b,sig=[b.round,b.phase,b.active,b.queue.join(',')].join(':');if(b.queue.length>3)throw Error('Attack cap exceeded');if(motionLast!==sig){motionRows.push({round:b.round,phase:b.phase,active:b.active,queue:[...b.queue],flyers:b.units.filter(HonroStage2Airborne.roost).map(u=>({id:u.id,x:u.x,y:u.y,awake:u.awake,moveLeft:u.moveLeft,aiMove:u.aiMove}))});motionLast=sig;}};}''')
 p.wait_for_function('HonroAuthoredFarArt.ready(2)')
 for target in [2,4]:
  for _ in range(200):
   done=p.evaluate('target=>{for(let i=0;i<100&&HonroApp.engine.b.round<target;i++)motionTick();return HonroApp.engine.b.round>=target;}',target)
   if done:break
  assert done
  p.evaluate('''()=>{const a=HonroApp,s=a.scene;motionMs+=3000;HonroStory.tick(a,motionMs);a.updateHUD(true);Object.assign(s,{manual:true,x:3200,y:1200,scale:.8,storyTween:null,cinematic:null});s.render(a.engine,0,'',.6,false,0);}''');p.locator('#battlecanvas').screenshot(path=str(out/f'stage02-round{target}.png'))
 rows=p.evaluate('motionRows');(out/'trace.json').write_text(json.dumps({'scope':__doc__,'sourceHashes':{f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in ['shared/engine/src/enemyAI.ts','shared/engine/src/engine.ts','shared/runtime/terrain-space.js','shared/engine/src/locomotion.ts','shared/runtime/stage2-airborne.js']},'sha':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'rows':rows},indent=2));print('PASS actual Chromium',len(rows),'boundaries; reached round4 under cap3');b.close()
