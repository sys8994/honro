"""Real Chromium renderer, camera inputs and timed screenshots.
Directly invoke production spawn actions in paused inspection fixtures; not fullplay.
"""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/reinforcement-camera';OUT.mkdir(parents=True,exist_ok=True)
PREP='''()=>{const a=HonroApp,b=a.engine.b;a.dialogue=null;a.storyCamera=null;document.getElementById('dialogue-root').innerHTML='';document.body.classList.remove('story-lock');a.done=true;a.modal.classList.remove('open');b.honroState.storyQueue=[];b.honroState.deferredStory=[];HonroStoryFraming.clear(a.scene);Object.assign(a.scene,{storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x:600,y:1550,scale:.58,manual:true});HonroReinforcementCamera.prime(a.scene,b);return{x:a.scene.x,y:a.scene.y,scale:a.scene.scale,manual:a.scene.manual};}'''
SPAWN='''()=>{const a=HonroApp,b=a.engine.b,ids=new Set(b.units.map(u=>u.id));const ev=b.honroEvents.find(ev=>HonroEncounters.combat(ev.action));if(!ev)throw Error('no combat event');const result=HonroAllies.execute(a,structuredClone(ev.action));window.cameraNewIds=b.units.filter(u=>!ids.has(u.id)&&u.side===1).map(u=>u.id);if(!cameraNewIds.length)throw Error('fixture spawn blocked '+ev.id);window.cameraSpawnAt=performance.now();return{event:ev.id,result,ids:cameraNewIds,at:cameraSpawnAt};}'''
SNAP='''()=>{const a=HonroApp,s=a.scene,{w,h}=s.size(),units=a.engine.b.units.filter(u=>cameraNewIds.includes(u.id));return{elapsed:performance.now()-window.cameraSpawnAt,x:s.x,y:s.y,scale:s.scale,manual:s.manual,active:HonroReinforcementCamera.active(s),targets:units.map(u=>({id:u.id,x:(u.x-s.x)*s.scale+w/2,y:(u.y-s.y)*s.scale+h/2,top:(u.y-u.h-s.y)*s.scale+h/2})),w,h};}'''
with serve_game() as url,sync_playwright() as p:
 browser=launch(p);errors=[];rows=[]
 for device,size in [('desktop',{'width':1280,'height':800}),('mobile',{'width':390,'height':844})]:
  context=browser.new_context(viewport=size,has_touch=True);page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url+'/HONRO.html');page.wait_for_function('window.HonroApp',timeout=120000)
  page.evaluate('''()=>{const a=HonroApp;a.profile=HONRO_TOOLS.fresh();for(let i=1;i<=30;i++)a.profile.cleared[i]={rounds:5};a.launch(3);}''');page.wait_for_function('HonroApp.engine?.b.honroStage===3&&HonroApp.dialogue',timeout=120000)
  original=page.evaluate(PREP);page.wait_for_timeout(50);page.screenshot(path=str(OUT/f'{device}-00-before.png'))
  spawned=page.evaluate(SPAWN);sequence=[]
  for label,delay in [('01-pan',180),('02-group',430),('03-hold',520),('04-return',560),('05-restored',520)]:
   page.wait_for_timeout(delay);snap=page.evaluate(SNAP);sequence.append({'image':f'{device}-{label}.png',**snap});page.screenshot(path=str(OUT/f'{device}-{label}.png'))
  held=sequence[1];assert held['active'];assert held['scale']<=original['scale'];assert all(0<=u['x']<=held['w'] and 0<=u['top']<=u['y']<=held['h']*.76+1 for u in held['targets']),held
  restored=sequence[-1];assert not restored['active'];assert all(abs(restored[k]-original[k])<1e-6 for k in ['x','y','scale']);assert restored['manual']
  # Concurrent authored dialogue framing, focusUnit turn notice, projectile and
  # goal focus must yield to the exact new reinforcement group.
  page.evaluate(PREP);page.evaluate(SPAWN);page.wait_for_timeout(80)
  page.evaluate('''()=>{const a=HonroApp,s=a.scene,b=a.engine.b;HonroStory.start(a,[['설오','', {camera:{id:'reinforcement-regression',intent:'situation',targets:[{actor:b.active}],padding:75,maxScale:.6}}]],{title:a.stage.name});b.active=b.units.find(u=>u.side===1&&!cameraNewIds.includes(u.id)).id;b.side=1;b.phase='enemy';b.round++;s.focusUnit(b.active,1200);s.goalFocus={x:50,y:100};}''');page.wait_for_timeout(550);assert page.evaluate('HonroApp.storyCamera.x')==600;concurrent=page.evaluate(SNAP);assert concurrent['active'];assert all(0<=u['x']<=concurrent['w'] for u in concurrent['targets']);page.screenshot(path=str(OUT/f'{device}-concurrent-dialogue.png'))
  page.wait_for_timeout(1500);assert not page.evaluate('HonroReinforcementCamera.active(HonroApp.scene)')
  # Wheel and canvas drag are genuine browser inputs, not calls to cancel().
  page.evaluate(PREP);page.evaluate(SPAWN);page.wait_for_timeout(150);page.mouse.move(size['width']*.55,size['height']*.4);page.mouse.wheel(0,-120);page.wait_for_timeout(100);assert not page.evaluate('HonroReinforcementCamera.active(HonroApp.scene)');wheel=page.evaluate(SNAP);page.wait_for_timeout(1700);assert abs(page.evaluate('HonroApp.scene.x')-wheel['x'])<1e-6
  page.evaluate(PREP);page.evaluate(SPAWN);page.wait_for_timeout(150);page.mouse.move(size['width']*.6,size['height']*.45);page.mouse.down();page.mouse.move(size['width']*.75,size['height']*.50,steps=5);page.mouse.up();page.wait_for_timeout(80);assert not page.evaluate('HonroReinforcementCamera.active(HonroApp.scene)');drag=page.evaluate(SNAP);page.wait_for_timeout(1700);assert abs(page.evaluate('HonroApp.scene.x')-drag['x'])<1e-6
  # Consecutive production additions start at the current rendered view.
  original2=page.evaluate(PREP);page.evaluate(SPAWN);page.wait_for_timeout(180);boundary=page.evaluate('()=>{const s=HonroApp.scene,before={x:s.x,y:s.y};('+SPAWN+')();return{before,after:{x:s.x,y:s.y}};}');assert boundary['before']==boundary['after']
  page.wait_for_timeout(2100);assert not page.evaluate('HonroReinforcementCamera.active(HonroApp.scene)')
  # Removal during the insert returns to the original view, without picking an
  # old enemy, objective or the changed active unit.
  old=page.evaluate(PREP);page.evaluate(SPAWN);page.wait_for_timeout(200);page.evaluate('HonroApp.engine.b.units.filter(u=>cameraNewIds.includes(u.id)).forEach(u=>{u.dead=true;u.hp=0;})');page.wait_for_timeout(600);dead=page.evaluate(SNAP);assert not dead['active'];assert abs(dead['x']-old['x'])<1e-6
  # Re-mount a saved population: no replay of any previously committed enemy.
  page.evaluate('''()=>{const a=HonroApp,b=structuredClone(a.engine.b);a.dialogue=null;a.mount(b);a.done=true;}''');page.wait_for_timeout(100);assert not page.evaluate('HonroReinforcementCamera.active(HonroApp.scene)')
  # Persist and use the real Continue path after a page reload.
  page.evaluate('''()=>{const a=HonroApp;a.profile.honroBattle=structuredClone(a.engine.b);a.profile.lastStage=3;a.persist();}''');page.reload();page.wait_for_function('window.HonroApp',timeout=120000);page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine?.b.honroStage===3',timeout=120000);page.wait_for_timeout(150);assert not page.evaluate('HonroReinforcementCamera.active(HonroApp.scene)')
  rows.append({'device':device,'spawn':spawned,'original':original,'sequence':sequence,'concurrent':concurrent,'wheel':wheel,'drag':drag,'savedPopulationRemount':True,'reloadContinue':True,'consecutive':True,'deadReturn':dead});context.close()
 assert not errors,errors
 (OUT/'browser.json').write_text(json.dumps({'fixtures':'Production stage3 event actions, simulation frozen for presentation inspection. No campaign fullplay claim.','rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2));browser.close();print('PASS Chromium desktop/mobile: group bounds, smooth return, concurrent dialogue/turn request, wheel, drag, saved population remount; pageErrors 0')
