"""Chapter 16 Chromium DOM/Canvas/Enter/localStorage acceptance.
Supported hero approach/combat-terminal/inspection camera fixtures are explicit.
NPC bodies always walk/recover through the production Engine; immutable build.
"""
import hashlib,json,os,pathlib,subprocess
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/reports/act23-v4/reviewed16-browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8768')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,1/60,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};globalThis.t16=(n=1)=>{for(let i=0;i<n&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);if(!a.dialogue)a.engine.stepUnits(.025);}};globalThis.pose16=(cls,x)=>{const b=a.engine.b,u=HonroAct23V4.heroes(b).find(u=>u.cls===cls);const candidates=b.terrain.filter(t=>!t.broken&&x>=t.x&&x<=t.x+t.w).map(t=>({t,y:HONRO_CORE.topAt(t,x)})).filter(p=>Number.isFinite(p.y)).sort((p,q)=>Math.abs(p.y-5030)-Math.abs(q.y-5030));let found=false;for(const p of candidates){Object.assign(u,{x,y:p.y,vx:0,vy:0,jumping:false,airborne:false,acted:false});if(HONRO_CORE.validTerrainContactPose(b.terrain,u)){found=true;break;}}if(!found)throw Error('unsupported hero fixture '+x);Object.assign(b,{active:u.id,side:0,phase:'aim'});a.turnNotice=null;a.updateHUD(true);return{id:u.id,x:u.x,y:u.y};};}"""
LAUNCH="""async()=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(16);a.stopBattle();a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<=15;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(17));p.seen['act2:first-spirit-encounter']=true;p.seen['map-story-v'+HonroStoryContent.version+'-15']=true;a.profile=p;a.launch(16);a.turnNotice=null;a.lastTurnNotice='1:player';return a.engine.b.honroCampaignMapRevision;}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':800});errors=[];rows=[];captures=[];checks=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Reviewed16');page.evaluate(PAUSE)
 runtime_source=subprocess.check_output(['node','--input-type=module','-e',"import{readFile}from'node:fs/promises';import{minify}from'terser';const s=await readFile(process.argv[1],'utf8');process.stdout.write((await minify(s,{module:true,compress:false,mangle:false,format:{comments:false}})).code.replace(/;$/,''));",'shared/runtime/act23-v4-reviewed16.js'],cwd=ROOT,text=True);runtime_asset=None
 for asset in reversed(page.request.get(BASE+'/web/manifest.json').json()['common']):
  if 'ordered-common' not in asset:continue
  body=page.request.get(BASE+'/'+asset).body()
  if 'G.HonroAct23V4Reviewed16={memory' in body.decode():
   assert runtime_source in body.decode(),'Shared candidate runtime differs from local reviewed16 source; wait for parent rebuild'
   runtime_asset={'path':asset,'sha256':hashlib.sha256(body).hexdigest(),'canonicalFullSourceMatch':True};break
 assert runtime_asset,'reviewed16 runtime bundle unavailable'
 assert page.evaluate(LAUNCH)==516
 def tick(n=1):page.evaluate('t16',n)
 def debug():return page.evaluate('({row:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId,q:HonroAct23V4Reviewed16.memory(HonroApp.engine.b),physical:HonroAct23V4Act2Scenes.memory(HonroApp.engine.b),current:HonroAct23V4.current(HonroApp.engine.b),safe:HonroAct23V4.safe(HonroApp)})')
 def at(id,n=500):
  tick(n);actual=page.evaluate('({id:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId,text:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[1]})');assert actual.get('id')==id,(id,actual,debug());assert page.locator('#story-line').text_content()==actual['text'];assert actual['text']==page.evaluate('id=>HonroAct23V4ReviewedChapters.row(id,16).text',id);rows.append(actual)
 def next():page.keyboard.press('Enter')
 def finish():
  while page.evaluate('!!HonroApp.dialogue'):
   actual=page.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].rowId');at(actual,0);next()
 def pose(cls,x):return page.evaluate('p=>pose16(...p)',[cls,x])
 def snap(name,group,focus=None):
  if focus:page.wait_for_timeout(120);page.evaluate("""p=>{const a=HonroApp,s=a.scene;s.manual=true;s.storyFrame=null;s.storyTween=null;s.cinematic=null;s.goalFocus=null;s.focusUntil=s.speakerUntil=0;Object.assign(s,p);s.render(a.engine,0,a.selected,a.power,false,1/60,true);}""",focus)
  page.wait_for_timeout(220);page.screenshot(path=str(OUT/(name+'.png')));captures.append({'file':name+'.png','group':group,'viewport':page.viewport_size,'inspectionCamera':focus,'state':page.evaluate("""()=>{const a=HonroApp;if(!a.engine)return{screen:a.screen};const b=a.engine.b;return{screen:a.screen,row:a.dialogue?.lines[a.dialogue.index]?.[2]?.rowId,camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},npcs:b.units.filter(u=>['objective','resident-1','resident-spirit-1'].includes(u.id)).map(u=>({id:u.id,x:u.x,y:u.y,dead:u.dead,resolved:u.honroResolved,pose:u.honroScenePose})),recovered:HonroAct23V4Reviewed16.recovered(b),heard:HonroAct23V4Reviewed16.heard(b),walks:HonroAct23V4Act2Scenes.memory(b).walks};}""")})
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"');page.evaluate('HonroApp.turnNotice=null')
 at('EDGE.ARRIVALS_16_0');snap('01-entry-held-disciple','1-entry-supported-movement');next()
 for cls,x in [('archer',2700),('mage',2100),('knight',2000),('occultist',1900)]:pose(cls,x)
 if page.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId')=='A2.S16.POPUP.01':finish()
 at('A2.S16.INTRO.01');snap('02-actual-hand-contact','2-critical-contact',{'x':2910,'y':4910,'scale':.9});next()
 pose('occultist',2820);at('A2.S16.INTRO.02');next();pose('mage',2720);at('A2.S16.MID.02');next();at('A2.S16.MID.03');resume();at('A2.S16.MID.03');next()
 assert page.evaluate('!HonroAct23V4.use(HonroApp,HonroAct23V4.marker(HonroApp.engine.b,"16.testimony"))&&!HonroAct23V4Reviewed16.heard(HonroApp.engine.b)')
 page.evaluate("""()=>{const a=HonroApp,e=a.engine;for(const u of e.b.units)if(u.side===1&&u.id!=='resident-spirit-1')e.hurt(u,999999,e.active.id);}""")
 pose('archer',3270);assert page.evaluate('HonroAct23V4.use(HonroApp,HonroAct23V4.marker(HonroApp.engine.b,"16.elder"))');pose('occultist',2850);assert page.evaluate('HonroAct23V4.use(HonroApp,HonroAct23V4.marker(HonroApp.engine.b,"16.disciple"))');assert page.evaluate('HonroAct23V4Reviewed16.separated(HonroApp.engine.b)')
 for cls,x in [('archer',2700),('mage',2100),('knight',2000),('occultist',1900)]:pose(cls,x)
 tick(6);assert page.evaluate('Object.values(HonroAct23V4Act2Scenes.memory(HonroApp.engine.b).walks).every(w=>w.distance>0&&!w.arrived)');snap('03-recovery-walking','1-entry-supported-movement',{'x':2800,'y':4860,'scale':.68});moving=page.evaluate('JSON.parse(JSON.stringify(HonroAct23V4Act2Scenes.memory(HonroApp.engine.b).walks))');resume();assert page.evaluate('HonroAct23V4Act2Scenes.memory(HonroApp.engine.b).walks')==moving
 at('A2.S16.MID.04',1200);assert page.evaluate('HonroAct23V4Reviewed16.recovered(HonroApp.engine.b)');snap('04-both-supported-recovery','2-critical-contact',{'x':2650,'y':4850,'scale':.8});next();at('A2.S16.MID.05');next();at('A2.S16.WITNESS.01');assert page.evaluate('HonroApp.dialogue.lines.length')==8
 for i in range(1,5):at('A2.S16.WITNESS.0'+str(i),0);next()
 at('A2.S16.WITNESS.05',0);assert not page.evaluate('HonroAct23V4Reviewed16.heard(HonroApp.engine.b)');resume();at('A2.S16.WITNESS.05');page.set_viewport_size({'width':390,'height':844});snap('05-mobile-witness-resumed','3-mobile-state',{'x':2650,'y':4800,'scale':.32});page.set_viewport_size({'width':1280,'height':800})
 for i in range(5,9):at('A2.S16.WITNESS.0'+str(i),0);next()
 tick();assert page.evaluate('HonroAct23V4Reviewed16.heard(HonroApp.engine.b)&&HonroAct23V4.mem(HonroApp.engine.b).sceneDone["16.testimony.required"]')
 assert not page.evaluate('HonroAct23V4Reviewed16.memory(HonroApp.engine.b).trappedObserved');pose('mage',3100);at('A2.S16.MID.06');assert page.evaluate('HonroAct23V4Reviewed16.memory(HonroApp.engine.b).trappedObserved.souls.length')==2;snap('06-current-bellward-souls','2-critical-contact',{'x':3230,'y':4800,'scale':.9});next();at('A2.S16.MID.07',0);next()
 exit=page.evaluate('HonroAct23V4.marker(HonroApp.engine.b,"16.work-exit")');pose('archer',exit['x']-440);at('A2.S16.COMPLETE.01');finish();tick();assert page.evaluate('HonroAct23V4Reviewed16.complete(HonroApp.engine.b)');assert page.evaluate('HonroApp.profile.record.filter(r=>r.rowId==="A2.S16.JOURNAL.01").length')==1
 snap('07-final-source-overview','4-final-source-overview',{'x':4300,'y':3950,'scale':.15});page.evaluate('()=>{const a=HonroApp,e=a.engine,b=e.b,u=HonroAct23V4.heroes(b).find(u=>u.cls==="archer"),p=HonroAct23V4.marker(b,"16.work-exit");u.moveLeft=850;for(let i=0;i<300&&!HonroAct23V4.mem(b).done["16.work-exit"];i++){e.walk(u,Math.sign(p.x-u.x),.025);e.stepUnits(.025);t16();}}');assert page.evaluate('!!HonroAct23V4.mem(HonroApp.engine.b).done["16.work-exit"]'),debug();snap('08-work-exit-supported','3-mobile-state',{'x':exit['x']-100,'y':exit['y']-150,'scale':.7});tick(5)
 page.evaluate('HonroAct23V4.recordOutcome(HonroApp,true)');history=page.evaluate('HonroApp.profile.honroAct23V4History.stages[16]');assert history['reviewedPhysical']['witnessRows']==['A2.S16.WITNESS.0'+str(i) for i in range(1,9)];assert history['reviewedPhysical']['sourceRun']==history['run'];assert history['reviewedPhysical']['elderDiscipleObserved']
 page.evaluate('HonroRestJourney.showRest(HonroApp)');page.locator('[data-action="journey-book"]').click();page.locator('.journey-records > summary').click();assert page.locator('[data-reviewed-row="A2.S16.JOURNAL.01"]').text_content()==page.evaluate('HonroAct23V4ReviewedChapters.row("A2.S16.JOURNAL.01",16).text');snap('09-exact-journal-dom','journal-dom')
 assert not errors,errors
 report={'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'runtimeSHA256':hashlib.sha256((ROOT/'shared/runtime/act23-v4-reviewed16.js').read_bytes()).hexdigest(),'loadedRuntimeAsset':runtime_asset,'candidateHTMLSHA256':hashlib.sha256(page.request.get(BASE+'/HONRO.html').body()).hexdigest(),'scriptSHA256':hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),'base':BASE,'rows':rows,'captures':captures,'history':history,'pageErrors':errors,'checks':['Actual held elder/disciple observed before real spirit separation.','Both NPCs use Engine walking, supported arrival and recovery; partial physical walks survive localStorage reload.','Eight witness rows actually present in DOM and advance with Enter; row 5 resumes and only natural end acknowledges mandatory testimony/history.','Independent present souls observed after testimony; one exact journal and actual Engine walk into the work exit.'],'limits':['Declared supported hero approach poses and combat-terminal deaths; NPC positions are never assigned.','Explicit deterministic simulation stepping and recorded inspection cameras; not normal-input combat full playthrough or audio listening.','No shared build, generated files, deployment or commits changed.']}
 (OUT/'capture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');browser.close();print('PASS reviewed16 Chromium DOM/Canvas/Enter/localStorage, real NPC recovery, eight natural witness rows, history and work exit; view captures separately')
