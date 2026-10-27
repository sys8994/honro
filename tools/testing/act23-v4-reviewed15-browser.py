"""Chapter 15 actual Chromium DOM/Canvas/Enter/localStorage acceptance.
Hero positions, combat deaths and inspection cameras are declared fixtures.
The build is shared and immutable: this script never builds or edits it.
"""
import hashlib,json,os,pathlib,subprocess
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/reports/act23-v4/reviewed15-browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8768')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,1/60,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};globalThis.t15=(n=1)=>{for(let i=0;i<n&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);if(!a.dialogue)a.engine.stepUnits(.025);}};globalThis.pose15=(cls,x,support)=>{const b=a.engine.b,u=HonroAct23V4.heroes(b).find(u=>u.cls===cls),t=b.terrain.find(t=>t.id===support&&!t.broken);if(!u||!t)throw Error('pose15 fixture');Object.assign(u,{x,y:HONRO_CORE.topAt(t,x),vx:0,vy:0,jumping:false,airborne:false,acted:false});if(!HONRO_CORE.validTerrainContactPose(b.terrain,u))throw Error('unsupported fixture '+support);Object.assign(b,{active:u.id,side:0,phase:'aim'});a.updateHUD(true);return{id:u.id,x:u.x,y:u.y};};}"""
LAUNCH="""async()=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(15);a.stopBattle();a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<=14;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.seen['act2:first-spirit-encounter']=true;p.seen['map-story-v'+HonroStoryContent.version+'-14']=true;a.profile=p;a.launch(15);a.turnNotice=null;a.lastTurnNotice='1:player';return a.engine.b.honroCampaignMapRevision;}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':800});errors=[];rows=[];captures=[];checks=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Reviewed15');page.evaluate(PAUSE)
 assert page.evaluate(LAUNCH)==515
 def tick(n=1):page.evaluate('t15',n)
 def at(id,n=250):
  tick(n)
  actual=page.evaluate('({id:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId,text:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[1]})')
  assert actual.get('id')==id,(id,actual,page.evaluate('({m:HonroAct23V4ReviewedChapters.memory(HonroApp.engine.b),safe:HonroAct23V4.safe(HonroApp),current:HonroAct23V4.current(HonroApp.engine.b)})'))
  assert page.locator('#story-line').text_content()==actual['text'];assert actual['text']==page.evaluate('id=>HonroAct23V4ReviewedChapters.row(id,15).text',id);rows.append(actual)
 def next():page.keyboard.press('Enter')
 def finish():
  while page.evaluate('!!HonroApp.dialogue'):next()
 def pose(cls,x,support):return page.evaluate('p=>pose15(...p)',[cls,x,support])
 def snap(name,focus=None):
  if page.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId==="A2.S15.MID.04"'):
   page.wait_for_function('!HonroReinforcementCamera.active(HonroApp.scene)',timeout=5000);page.wait_for_timeout(350)
  if focus:page.wait_for_timeout(120);page.evaluate("""p=>{const a=HonroApp,s=a.scene;s.manual=true;s.storyFrame=null;s.storyTween=null;s.cinematic=null;s.goalFocus=null;s.focusUntil=s.speakerUntil=0;s.x=p.x;s.y=p.y;s.scale=p.scale;s.render(a.engine,0,a.selected,a.power,false,1/60,true);}""",focus)
  page.wait_for_timeout(220)
  page.screenshot(path=str(OUT/(name+'.png')))
  captures.append({'file':name+'.png','viewport':page.viewport_size,'inspectionCamera':focus,'state':page.evaluate("""()=>{const a=HonroApp,b=a.engine?.b,s=a.scene;return{screen:a.screen,row:a.dialogue?.lines[a.dialogue.index]?.[2]?.rowId,camera:s&&{x:s.x,y:s.y,scale:s.scale},drained:b&&!!HonroAct23V4Act2Scenes.base.memory(b).drained,water:b?.waters?.map(w=>({x:w.x,y:w.y,w:w.w,depth:w.depth})),pair:b&&HonroAct23V4Reviewed15.memory(b).merge};}""")})
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"')
 at('EDGE.ARRIVALS_15_0');snap('01-arrival-wheel-pulley');resume();at('EDGE.ARRIVALS_15_0');next()
 pose('archer',1200,'act2-floor');at('A2.S15.INTRO.01');snap('02-wheel-live');wheel_before=page.evaluate('HonroApp.scene.time');wheel_clip=page.evaluate('()=>{const a=HonroApp,s=a.scene,u=a.engine.unit(a.engine.b.honroV4LowWheel),r=s.canvas.getBoundingClientRect();return{x:r.x+r.width/2+(u.x-s.x)*s.scale-35,y:r.y+r.height/2+(u.y-u.h*.55-s.y)*s.scale-35,width:70,height:70};}');wheel_frame=page.screenshot(clip=wheel_clip);page.wait_for_timeout(700);wheel_after=page.evaluate('HonroApp.scene.time');assert wheel_after>wheel_before;assert page.screenshot(clip=wheel_clip)!=wheel_frame;snap('02b-wheel-motion');next();at('A2.S15.INTRO.02');resume();at('A2.S15.INTRO.02');snap('03-wheel-middle-cursor');next()
 pose('archer',2280,'act2-floor');at('A2.S15.INTRO.03');next();at('A2.S15.CHOICE.01');next()
 assert page.evaluate('HonroAct23V4.state(HonroApp.engine.b).targets.filter(t=>t.rowId?.startsWith("A2.S15.UI_CHOICE")).length===2')
 pose('archer',4420,'fc15-crown-return');at('A2.S15.BRANCH.02');assert page.evaluate('HonroAct23V4Reviewed15.blockedSight(HonroApp,HonroAct23V4Reviewed15.memory(HonroApp.engine.b).blockedSight)');snap('04-return-bridge-blocked-ray');next()
 snap('05-flooded-lower-platform',{'x':5800,'y':4450,'scale':.68});page.set_viewport_size({'width':390,'height':844});snap('05b-mobile-flooded-platform',{'x':5800,'y':4450,'scale':.3});page.set_viewport_size({'width':1280,'height':800})
 assert page.evaluate('HonroAct23V4Reviewed15.flooded(HonroApp.engine.b)&&!!HonroAct23V4Reviewed15.memory(HonroApp.engine.b).returnBridge')
 page.evaluate('HonroApp.stopBattle();HonroRestJourney.showRest(HonroApp)');assert page.locator('[data-action="rest-talk"][data-class="knight"]').is_enabled();page.locator('[data-action="rest-talk"][data-class="knight"]').click();at('EDGE.OPTIONAL_15_KNIGHT_0',0);snap('06-knight-flood-claim')
 rest_cursor=page.evaluate('JSON.parse(JSON.stringify(HonroApp.profile.honroJourney.story))');assert rest_cursor['id']=='rest-talk-v1-15-knight-reviewed1'
 # Keep that real interrupted rest cursor while advancing its suspended battle.
 page.reload();page.wait_for_function('!!globalThis.HonroApp');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"')
 pose('occultist',2350,'act2-floor');page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,V=HonroAct23V4;e.hurt(e.unit(b.honroV4LowWheel),999999,e.active.id);for(const foe of b.units.filter(u=>u.side===1&&V.alive(u)&&V.near(u,V.marker(b,'sluice'),300)))e.hurt(foe,999999,e.active.id);if(!V.use(a,V.marker(b,'sluice')))throw Error('low warning interaction');}""")
 at('A2.S15.BRANCH.01',0);assert page.evaluate('!HonroAct23V4Act2Scenes.base.memory(HonroApp.engine.b).drained');next()
 assert page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;Object.assign(b,{side:0,phase:'aim'});a.engine.active.acted=false;return HonroAct23V4.use(a,HonroAct23V4.marker(b,'sluice'));}""")
 tick(4);assert page.evaluate('HonroAct23V4Act2Scenes.base.memory(HonroApp.engine.b).drained&&!HonroAct23V4Reviewed15.flooded(HonroApp.engine.b)')
 page.evaluate('HonroApp.stopBattle();HonroRestJourney.showRest(HonroApp)');assert not page.evaluate('HonroApp.dialogue?.lines.some(l=>l[2]?.rowId==="EDGE.OPTIONAL_15_KNIGHT_0")');assert page.locator('[data-action="rest-talk"][data-class="knight"]').is_disabled();assert not page.evaluate('HonroApp.profile.honroJourney.story');snap('07-stale-knight-suppressed')
 checks.append('Actual rest button opened the approved flood line; its saved interrupted cursor was suppressed after real sluice drainage, with the knight button disabled.')
 page.reload();page.wait_for_function('!!globalThis.HonroApp');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"')
 # Actual Canvas guide invokes production predict through its normal arc renderer.
 pose('archer',5100,'act2-floor');page.evaluate("""()=>{const a=HonroApp,u=a.engine.active;u.angle=15;u.lastPower=.5;a.selected='A01';a.power=.5;a.scene.manual=true;a.scene.storyFrame=null;a.scene.storyTween=null;a.scene.x=5630;a.scene.y=4380;a.scene.scale=.68;a.updateHUD(true);}""");page.wait_for_function('!!HonroAct23V4Reviewed15.memory(HonroApp.engine.b).prediction');snap('08-production-preview-field')
 assert page.evaluate('!!HonroAct23V4Reviewed15.memory(HonroApp.engine.b).trace')
 shot=page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,C=HONRO_CORE;const pr=e.predict(u,C.SKILLS.A01,15,.5),impacts=[],old=e.impact;e.impact=function(p,h,...args){impacts.push({x:h.x,y:h.y,terrain:h.terrain?.id});return old.call(e,p,h,...args);};globalThis.reviewed15Shot={predicted:{x:pr.x,y:pr.y,terrain:pr.terrain},impacts};if(!e.fire('A01',15,.5))throw Error('real A01 launch');for(let n=0;n<2400&&b.projectiles.length&&!HonroAct23V4Reviewed15.memory(b).liveForce;n++)for(const p of [...b.projectiles])e.stepProjectile(p,C.STEP);return{live:HonroAct23V4Reviewed15.memory(b).liveForce,remaining:b.projectiles.length};}""");assert shot['live'] and shot['remaining']>0;snap('09-real-shot-field')
 page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b;for(let n=0;n<2400&&b.projectiles.length;n++)for(const p of [...b.projectiles])e.stepProjectile(p,HONRO_CORE.STEP);Object.assign(b,{side:0,phase:'aim'});e.active.acted=false;for(let n=0;n<30;n++)e.stepUnits(.025);}""")
 parity=page.evaluate("""()=>{const q=reviewed15Shot,h=q.impacts[0];return{...q,error:Math.hypot(h.x-q.predicted.x,h.y-q.predicted.y)};}""");assert parity['error']<1e-6
 pose('archer',6240,'fc15-water-toe');at('A2.S15.MID.01');snap('10-first-droplets');next();at('A2.S15.MID.02');resume();at('A2.S15.MID.02');next();at('A2.S15.POPUP.01');snap('11-shared-force-guide');next();at('A2.S15.MID.03');next()
 tick(30);assert page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;return HonroAct23V4.use(a,HonroAct23V4.marker(b,'groove'));}""")
 at('A2.S15.MID.04');pair=page.evaluate('HonroAct23V4Reviewed15.memory(HonroApp.engine.b).merge.ids');assert len(pair)==2;count=page.evaluate('HonroApp.engine.b.units.length');snap('12-two-real-spirits');page.set_viewport_size({'width':390,'height':844});snap('13-two-real-spirits-mobile');page.set_viewport_size({'width':1280,'height':800});resume();at('A2.S15.MID.04');assert page.evaluate('HonroAct23V4Reviewed15.memory(HonroApp.engine.b).merge.ids')==pair;assert page.evaluate('HonroApp.engine.b.units.length')==count;next();tick(8);assert page.evaluate('HonroApp.engine.b.units.length')==count
 page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,V=HonroAct23V4;for(const id of HonroAct23V4Reviewed15.memory(b).merge.ids)e.hurt(e.unit(id),999999,e.active.id);for(const foe of b.units.filter(u=>u.side===1&&V.alive(u)&&V.near(u,b.honroV4Reviewed15.merge,320)))e.hurt(foe,999999,e.active.id);}""")
 at('A2.S15.MID.05');next();at('A2.S15.MID.06');assert page.evaluate('HonroAct23V4Act2Scenes.memory(HonroApp.engine.b).knocks.emitted.length')==1;resume();at('A2.S15.MID.06');next();at('A2.S15.MID.07');next();at('A2.S15.COMPLETE.01');page.set_viewport_size({'width':390,'height':844});snap('14-mobile-drained-postknock');page.set_viewport_size({'width':1280,'height':800});snap('15-postknock-desktop');next();tick(3)
 assert page.evaluate('HonroAct23V4Act2Scenes.memory(HonroApp.engine.b).knocks.emitted.length')==3
 assert page.evaluate('HonroApp.profile.record.filter(r=>r.rowId==="A2.S15.JOURNAL.01").length')==1
 page.set_viewport_size({'width':390,'height':844});snap('15b-mobile-drained-platform',{'x':5800,'y':4450,'scale':.3});page.set_viewport_size({'width':1280,'height':800});snap('16-final-overall-inspection',{'x':4100,'y':3800,'scale':.15})
 pose('archer',7530,'act2-floor');at('A2.S15.COMPLETE.02');snap('17-lower-exit');next();tick(4);assert page.evaluate('HonroApp.engine.b.honroRouteChoice.selectedRoute')=='A';assert page.evaluate('HonroAct23V4Reviewed15.complete(HonroApp.engine.b)')
 checks.extend(['The same wheel dialogue row has different real Canvas wheel rasters across advancing visual time.','Actual Canvas preview and actual A01 flight share the fixed force; predicted/live collision endpoint error is zero.','Exactly two real ghosts remain the same IDs/count across page reload; saved first-knock cursor resumes and the finite count remains three.','The actual DOM/Enter order, mobile scenes, one reviewed journal and lower A receipt complete without page errors.'])
 assert not errors,errors
 report={'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'runtime15SHA256':hashlib.sha256((ROOT/'shared/runtime/act23-v4-reviewed15.js').read_bytes()).hexdigest(),'base':BASE,'rows':rows,'captures':captures,'checks':checks,'pageErrors':errors,'wheelAnimation':{'sceneTimeBefore':wheel_before,'sceneTimeAfter':wheel_after,'sameRowRasterChanged':True},'trajectory':parity,'pair':{'ids':pair,'unitCount':count},'restCursor':rest_cursor,'limits':['Real Chromium DOM/Canvas/localStorage and production Engine, using declared supported hero poses and combat-death fixtures.','Simulation is stepped explicitly; actual visual animation/rendering continues. No continuous normal-input full playthrough or audio-device listening claim.','Inspection overview camera is an explicit QA fixture. No build, generated asset, shared source, commit or deployment is changed.']}
 (OUT/'capture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');browser.close();print('PASS reviewed15 Chromium actual DOM/Canvas/Enter, trace/live force, pair/save, middle cursor, stale rest after actual drain and finite knocks; inspect captures separately')
