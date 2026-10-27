"""Actual Chromium DOM/Canvas/save acceptance; combat/hero poses are fixtures."""
import json, os, pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/reports/act23-v4/reviewed14-browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8768')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};globalThis.t14=(n=1)=>{for(let i=0;i<n&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);if(!a.dialogue)a.engine.stepUnits(.025);}};globalThis.pose14=(u,p)=>Object.assign(u,p,{vx:0,vy:0,jumping:false,airborne:false,acted:false});}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':800});errors=[];rows=[];frames={};page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Reviewed14');page.evaluate(PAUSE)
 assert page.evaluate("""async()=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(14);a.stopBattle();a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<=13;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.seen['act2:first-spirit-encounter']=true;p.seen['map-story-v'+HonroStoryContent.version+'-13']=true;HonroAct23V4.migratePresentation(p);a.profile=p;a.launch(14);a.turnNotice=null;return a.engine.b.honroCampaignMapRevision;}""")==514
 def at(id,n=400):
  page.evaluate('t14('+str(n)+');HonroApp.updateHUD()');actual=page.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId')
  assert actual==id,(id,actual,page.evaluate('({m:HonroAct23V4ReviewedChapters.memory(HonroApp.engine.b),s:HonroAct23V4Act2Scenes.memory(HonroApp.engine.b)})'))
  assert page.locator('#story-line').text_content()==page.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][1]');rows.append(id)
 def next():page.keyboard.press('Enter')
 def finish():
  for _ in range(30):
   if not page.evaluate('!!HonroApp.dialogue'):break
   next()
  assert not page.evaluate('!!HonroApp.dialogue')
 def reload():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"')
 def snap(name,x,y,scale=.7):
  # Keep the actual production story frame and allow its damped response to
  # settle. The manual view is only used when no dialogue owns the camera.
  page.evaluate('p=>{const a=HonroApp,s=a.scene;if(!s.storyFrame){s.manual=true;s.storyTween=null;s.cinematic=null;s.goalFocus=null;s.x=p.x;s.y=p.y;s.scale=p.scale;}s.render(a.engine,0,a.selected,a.power,false,0,true);}',{'x':x,'y':y,'scale':scale});page.wait_for_timeout(450);page.screenshot(path=str(OUT/(name+'.png')));frames[name]=page.evaluate('HonroApp.scene.storyFrameReport')
 at('EDGE.ARRIVALS_14_0');assert page.locator('#objective-text').text_content()==page.evaluate("HonroAct23V4ReviewedChapters.row('A2.S14.OBJECTIVE.01',14).text");finish();page.evaluate('t14(40)');assert not page.evaluate('!!HonroApp.dialogue')
 optional_profile=page.evaluate("""()=>({...HonroApp.profile,honroBattle:structuredClone(HonroApp.engine.b),honroJourney:{version:1,talked:{},restStageId:14}})""")
 assert page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,p={...a.profile,honroBattle:b},J=HonroJourneyContent;return JSON.stringify(['archer','mage','knight','occultist'].map(c=>J.optional(p,14,c).length))==='[1,1,2,1]';}""")
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,u=HonroAct23V4.heroes(b).find(u=>u.cls==='archer'),p=HonroAct23V4.marker(b,'14.house');pose14(u,{x:p.x-180,y:p.y});}""");at('A2.S14.INTRO.01');snap('01-closed-house-entry',2980,2270);reload();at('A2.S14.INTRO.01');next();at('A2.S14.INTRO.02');next();at('A2.S14.INTRO.03');reload();at('A2.S14.INTRO.03');next();at('A2.S14.INTRO.04');finish()
 assert page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,p={...a.profile,honroBattle:b};return !HonroAct23V4Act2Scenes.base.memory(b).houseOpen&&HonroJourneyContent.optional(p,14,'archer').length===0&&HonroJourneyContent.optional(p,14,'knight').length===1;}""")
 page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,V=HonroAct23V4,p=V.marker(b,'14.house'),s=V.steps(b).find(s=>s.id==='14.door-threat'),u=s.defeatIds.map(id=>e.unit(id)).find(V.alive);t14();u.fixed=false;u.moveLeft=500;e.walk(u,Math.sign(p.x-u.x),.05);t14();}""");at('A2.S14.MID.01');next();at('A2.S14.MID.02');finish()
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;for(const id of HonroAct23V4.steps(b).find(s=>s.id==='14.door-threat').defeatIds){const u=a.engine.unit(id);if(u){u.dead=true;u.hp=0;}}}""");at('A2.S14.MID.03');finish();assert page.evaluate("HonroJourneyContent.optional({...HonroApp.profile,honroBattle:HonroApp.engine.b},14,'occultist').length===0")
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,V=HonroAct23V4,p=V.marker(b,'14.house'),u=V.heroes(b).find(u=>u.cls==='occultist');for(const v of b.units)if(v.side===1&&v.id!=='resident-spirit-1'){v.dead=true;v.hp=0;}pose14(u,{x:p.x-100,y:p.y});Object.assign(b,{active:u.id,side:0,phase:'aim'});if(!V.use(a,p))throw Error('house action');a.turnNotice=null;}""");at('A2.S14.MID.04');assert page.locator('#objective-text').text_content()==page.evaluate("HonroAct23V4ReviewedChapters.row('A2.S14.OBJECTIVE.02',14).text");assert not page.evaluate('!!HonroAct23V4Act2Scenes.memory(HonroApp.engine.b).hypnosis');next();at('A2.S14.MID.05');reload();at('A2.S14.MID.05');assert not page.evaluate('!!HonroAct23V4Act2Scenes.memory(HonroApp.engine.b).hypnosis');finish()
 page.evaluate("""()=>{for(const[i,u]of HonroAct23V4.heroes(HonroApp.engine.b).entries())pose14(u,{x:2100-i*100,y:2300});}""");at('A2.S14.MID.06');assert page.evaluate('HonroAct23V4Act2Scenes.memory(HonroApp.engine.b).walks["14.hypnosis"].distance>=90');assert page.evaluate("HonroApp.scene.storyFrame.camera.targets.some(t=>t.actor==='14.gilchan')");snap('02-real-hypnosis-safe-path',3000,2470,.66);next();at('A2.S14.POPUP.01');finish();at('A2.S14.MID.07');finish()
 assert not page.evaluate('HonroAct23V4Reviewed14.sheltered(HonroApp.engine.b)')
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,u=HonroAct23V4.heroes(b).find(u=>u.cls==='mage'),g=a.engine.unit('14.gilchan');pose14(u,{x:g.x-180,y:g.y});}""");at('A2.S14.MID.08');finish()
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,u=HonroAct23V4.heroes(b).find(u=>u.cls==='occultist'),g=a.engine.unit('14.gilchan');pose14(u,{x:g.x-85,y:g.y});Object.assign(b,{active:u.id,side:0,phase:'aim'});if(!HonroAct23V4.use(a,HonroAct23V4.marker(b,'14.extract')))throw Error('Sodan extraction');}""");at('A2.S14.MID.09');next();at('A2.S14.MID.10');reload();at('A2.S14.MID.10');next();at('A2.S14.MID.11');finish()
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,V=HonroAct23V4;for(const[i,u]of V.heroes(b).entries())pose14(u,{x:2100-i*110,y:2300});for(let i=0;i<900&&!a.dialogue;i++){const g=a.engine.unit('14.gilchan');pose14(V.heroes(b).find(u=>u.cls==='archer'),{x:g.x+160,y:g.y});if(g.moveLeft<30)b.round++;t14();}}""");at('A2.S14.COMPLETE.01',1);assert page.evaluate('HonroAct23V4Reviewed14.sheltered(HonroApp.engine.b)');snap('03-supported-refuge',2760,2270,.8);next();at('A2.S14.COMPLETE.02');next();at('A2.S14.COMPLETE.03');reload();at('A2.S14.COMPLETE.03');page.set_viewport_size({'width':390,'height':844});snap('04-mobile-post-refuge',2790,2250,.72);page.set_viewport_size({'width':1280,'height':800});snap('05-final-overall',2930,2470,.5);finish();page.evaluate('t14(3)')
 assert page.evaluate('HonroApp.profile.record.filter(r=>r.rowId==="A2.S14.JOURNAL.01").length===1');assert not errors,errors
 facts=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,s=HonroAct23V4Act2Scenes.memory(b),u=a.engine.unit('14.gilchan');return{mapRevision:b.honroCampaignMapRevision,hypnosisDistance:s.walks['14.hypnosis'].distance,refugeDistance:s.walks['14.refuge'].distance,gilchan:{x:u.x,y:u.y,contact:HONRO_CORE.validTerrainContactPose(b.terrain,u)},separated:HonroAct23V4Reviewed14.separated(b),journalCount:a.profile.record.filter(r=>r.rowId==='A2.S14.JOURNAL.01').length};}""")
 # A separate browser context shows the actual five optional rows from the
 # saved pre-news battle. Returning to rest preserves the stage-state guards.
 page=browser.new_page(viewport={'width':1280,'height':800});page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp');page.evaluate(PAUSE)
 page.evaluate('p=>{const a=HonroApp;a.profile=p;a.engine=null;HonroRestJourney.showRest(a);}',optional_profile)
 def rest_at(id):
  actual=page.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId');assert actual==id,(id,actual,page.evaluate('({screen:HonroApp.screen,journey:HonroApp.profile.honroJourney,battle:!!HonroApp.profile.honroBattle})'))
  assert page.locator('#story-line').text_content()==page.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][1]');rows.append(id)
 for cls in ['archer','mage','knight','occultist']:
  page.locator('[data-action="rest-talk"][data-class="'+cls+'"]').click();rest_at('EDGE.OPTIONAL_14_'+cls.upper()+'_0')
  if cls=='knight':
   next();rest_at('EDGE.OPTIONAL_14_KNIGHT_1');page.reload();page.wait_for_function('!!globalThis.HonroApp');page.evaluate(PAUSE);page.evaluate('HonroRestJourney.showRest(HonroApp)');rest_at('EDGE.OPTIONAL_14_KNIGHT_1')
  finish()
 page.evaluate("""p=>{const a=HonroApp;a.engine=null;a.profile=p;const b=p.honroBattle,m=HonroAct23V4.mem(b);m.reviewedChapter.events.news={status:'done',ids:[]};m.done['14.door-threat']=true;HonroRestJourney.showRest(a);}""",optional_profile)
 for cls in ['archer','occultist']:
  assert page.locator('[data-action="rest-talk"][data-class="'+cls+'"]').is_disabled();assert not page.evaluate('!!HonroApp.dialogue')
 page.locator('[data-action="rest-talk"][data-class="knight"]').click();rest_at('EDGE.OPTIONAL_14_KNIGHT_0');assert page.evaluate('HonroApp.dialogue.lines.length')==1;finish();assert not errors,errors
 (OUT/'capture.json').write_text(json.dumps({'rows':rows,'pageErrors':errors,'facts':facts,'frames':frames,'fixtures':'actual Chromium DOM/Canvas/Enter/localStorage including five optional UI rows and stage guards; opponent deaths and hero poses controlled; NPC hypnosis/refuge use real Engine walk/jump/integration. No normal fullplay claim.'},ensure_ascii=False,indent=2)+'\n');print('PASS reviewed14 actual browser first voice/news/prebell/physical hypnosis+extraction+refuge/middle and refuge reloads/optional UI+guards; no page errors');browser.close()
