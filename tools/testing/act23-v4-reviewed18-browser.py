"""Chapter 18 Chromium acceptance: actual DOM/Canvas/Enter/localStorage.
Supported hero placement, combat deaths, late prerequisites and overview cameras
are explicit fixtures. All witnessed rope, resident and bell motion is real.
Never builds or edits the shared candidate.
"""
import hashlib,json,os,pathlib,subprocess
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/reports/act23-v4/reviewed18-browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8768')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,1/60,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};globalThis.t18=(n=1)=>{for(let i=0;i<n&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.05);}};globalThis.pose18=(cls,x,support='sb-east-gallery-sill')=>{const b=a.engine.b,u=HonroAct23V4.heroes(b).find(u=>u.cls===cls),s=HonroMapEngine.surfaceY(b.terrain,x,undefined,support);Object.assign(u,{x,y:s.y,vx:0,vy:0,jumping:false,airborne:false,acted:false});if(!HONRO_CORE.validTerrainContactPose(b.terrain,u))throw Error('unsupported '+cls+' '+x);Object.assign(b,{active:u.id,side:0,phase:'aim'});a.updateHUD(true);return{id:u.id,x:u.x,y:u.y};};globalThis.use18=(id,cls='archer')=>{const a=HonroApp,e=a.engine,b=e.b,V=HonroAct23V4,p=id==='18.rescue'?e.unit('18.survivor'):V.marker(b,id);pose18(cls,p.x,['18.brake','18.rescue'].includes(id)?'sb-east-gallery-sill':'act2-floor');const ok=V.use(a,V.marker(b,id));if(b.phase==='review')e.finishAction(true);return ok;};globalThis.permit18=id=>{const b=a.engine.b,V=HonroAct23V4,i=V.steps(b).findIndex(s=>s.id===id);for(const s of V.steps(b).slice(0,i))V.mem(b).done[s.id]=true;};}"""
LAUNCH="""async()=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(18);a.stopBattle();a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<=17;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.seen['act2:first-spirit-encounter']=true;p.seen['map-story-v'+HonroStoryContent.version+'-17']=true;const ids=['01','02','04','06','08'].map(n=>'A2.S16.WITNESS.'+n);p.honroAct23V4History={revision:1,stages:{16:{run:'18.browser.prerequisite16',reviewedNarrative:{rows:ids},reviewedPhysical:{revision:1,sourceRun:'18.browser.prerequisite16',witness16_heard:true,witnessRows:ids}}}};a.profile=p;a.launch(18);a.turnNotice=null;a.lastTurnNotice='1:player';a.engine.settleBusy=()=>false;return a.engine.b.honroCampaignMapRevision;}"""
STATE="""()=>{const a=HonroApp,b=a.engine.b,m=HonroAct23V4Stage18.memory(b),q=HonroAct23V4Reviewed18.memory(b);return{row:a.dialogue?.lines[a.dialogue.index]?.[2]?.rowId,bell:m.bell,rescued:m.rescued,rescueSafe:m.rescueSafe,rescueDistance:m.rescueDistance,resident:{x:a.engine.unit('18.survivor').x,y:a.engine.unit('18.survivor').y},rope:q.rope,witness:q.burialWitness,translated:q.translated,locks:m.locks,stable:m.stable,events:HonroAct23V4ReviewedChapters.apiFor(18).memory(b).events};}"""
# Verify the exact source served by the immutable candidate using its production
# minifier; a trailing statement separator belongs to the containing wrapper.
SOURCE_CHECK=r"""
import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {minify} from 'terser';
const base=process.argv[1].replace(/\/$/,'')+'/',html=await(await fetch(base+'HONRO.html')).text(),entry=html.match(/<script[^>]*src="([^"]+)"/)[1],entryJS=await(await fetch(base+entry)).text(),raw=await readFile('shared/runtime/act23-v4-reviewed18.js','utf8'),built=(await minify(raw,{module:true,compress:false,mangle:false,format:{comments:false}})).code.replace(/;$/,'');
const matches=[];for(const p of new Set([...entryJS.matchAll(/\.\.\/runtime\/([^" ]+\.js)/g)].map(m=>m[1]))){const text=await(await fetch(base+'web/runtime/'+p)).text();if(text.includes('G.HonroAct23V4Reviewed18='))matches.push({url:base+'web/runtime/'+p,exactProductionMinifiedSourceInclusion:text.includes(built),sourceSHA256:createHash('sha256').update(raw).digest('hex'),servedModuleSHA256:createHash('sha256').update(text).digest('hex')});}
if(matches.length!==1||!matches[0].exactProductionMinifiedSourceInclusion)throw Error(JSON.stringify(matches));process.stdout.write(JSON.stringify({entry,matches,normalization:'Production Terser options; trailing separator omitted inside production wrapper.'}));
"""
served_source=json.loads(subprocess.check_output(['node','--input-type=module','-e',SOURCE_CHECK,BASE],cwd=ROOT,text=True))
(OUT/'served-source.json').write_text(json.dumps(served_source,indent=2)+'\n')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':800});errors=[];rows=[];captures=[];checks=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Reviewed18');page.evaluate(PAUSE)
 assert page.evaluate(LAUNCH)==518
 def tick(n=1):page.evaluate('t18',n)
 def state():return page.evaluate(STATE)
 def row():return state().get('row')
 def next():
  r=page.evaluate('()=>{const d=HonroApp.dialogue;return d&&{id:d.lines[d.index]?.[2]?.rowId,text:d.lines[d.index]?.[1]};}')
  assert r and r['id'],r
  assert page.locator('#story-line').text_content()==r['text']
  assert page.evaluate('r=>HonroAct23V4ReviewedChapters.row(r.id,18)?.text===r.text',r),r
  rows.append(r);page.keyboard.press('Enter')
 def drain(n=20):
  for _ in range(n):
   tick(1)
   if row():next()
 def finish():
  while row():next()
 def at(id,n=250):
  tick(n);assert row()==id,(id,state())
 def snap(name,focus=None):
  if focus:
   page.wait_for_timeout(100);page.evaluate("""p=>{const a=HonroApp,s=a.scene;s.manual=true;s.storyFrame=null;s.storyTween=null;s.cinematic=null;s.goalFocus=null;s.focusUntil=s.speakerUntil=0;s.x=p.x;s.y=p.y;s.scale=p.scale;s.render(a.engine,0,a.selected,a.power,false,1/60,true);}""",focus)
  page.wait_for_timeout(500);page.screenshot(path=str(OUT/(name+'.png')))
  captures.append({'file':name+'.png','viewport':page.viewport_size,'inspectionCamera':focus,'camera':page.evaluate('({x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale})'),'state':state()})
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"');page.evaluate('HonroApp.turnNotice=null;HonroApp.engine.settleBusy=()=>false;Object.assign(HonroApp.engine.b,{side:0,phase:"aim"})')
 def opportunities():
  finish()
  for _ in range(4):
   if state()['bell']['status']=='moving':break
   ids=page.evaluate('()=>{const m=HonroAct23V4Stage18.memory(HonroApp.engine.b);return m.bell.waiting?.length?m.bell.waiting:m.bell.segment.heroes;}')
   for id in ids:
    finish();page.evaluate("""id=>{const a=HonroApp,e=a.engine,b=e.b;Object.assign(b,{active:id,side:0,phase:'aim'});e.unit(id).acted=false;HonroAct23V4Stage18.tick(a,0);e.finishAction(true);}""",id);finish()
  assert state()['bell']['status']=='moving',state()
 # Actual approach/pull/walk/lowering. Supported hero locations are fixtures.
 page.evaluate("""()=>{for(const [i,c]of ['archer','mage','knight','occultist'].entries())pose18(c,9480+i*30);}""")
 at('EDGE.ARRIVALS_18_0');assert page.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].camera.id')=='18.reviewed.arrival';snap('01-arrival-supported-gallery');page.set_viewport_size({'width':390,'height':844});snap('01b-mobile-arrival-actual-frame');page.set_viewport_size({'width':1280,'height':800});next()
 snap('02-overall-bell-support',{'x':7400,'y':4950,'scale':.11})
 drain(30);assert state()['rope']['complete'];assert not state().get('witness')
 snap('03-real-rope-pull',{'x':9490,'y':6250,'scale':1.1})
 for _ in range(600):
  if page.evaluate('HonroAct23V4Stage18.memory(HonroApp.engine.b).threat.started'):break
  drain(1)
 assert page.evaluate('HonroAct23V4Stage18.memory(HonroApp.engine.b).threat.started')
 snap('04-threat-warning-from-to',{'x':7900,'y':6400,'scale':.32});opportunities();page.evaluate('HonroApp.engine.tick(.45)')
 snap('05-threat-midmotion',{'x':7480,'y':6450,'scale':.35});page.evaluate('HonroApp.engine.tick(.45)');drain(20)
 assert state()['witness'];assert state()['bell']['offset']==-40
 assert page.evaluate('HonroApp.engine.b.honroBellAnomaly===undefined&&HonroApp.engine.b.honroBellWitness===undefined')
 assert page.evaluate('use18("18.brake")');drain(12);assert page.evaluate('use18("18.rescue","occultist")')
 assert page.evaluate('HonroApp.engine.unit("18.survivor-spirit").dead&&!HonroApp.engine.unit("18.survivor").dead')
 page.evaluate('pose18("knight",9420)');start=state()['resident']
 for i in range(500):
  if state()['rescueSafe']:break
  drain(1)
  if i%30==0:page.evaluate('HonroApp.engine.b.round++;HonroApp.engine.unit("18.survivor").moveLeft=HonroApp.engine.unit("18.survivor").maxMove')
 assert state()['rescueSafe'] and state()['rescueDistance']>=120
 rescue={'from':start,'to':state()['resident'],'distance':state()['rescueDistance']}
 snap('06-supported-rescued-walk',{'x':9410,'y':6270,'scale':1})
 # Each real question cursor is inspected, and an individual answer survives reload.
 assert any(r['id']=='A2.S18.MID.05' for r in rows);at('A2.S18.PHASE2.01');snap('07-living-keeper-question');next();at('A2.S18.PHASE2.02');resume();at('A2.S18.PHASE2.02');snap('08-saved-answer-cursor');next();at('A2.S18.PHASE2.03');next();at('A2.S18.PHASE2.04');next();drain(4)
 page.evaluate('pose18("archer",9220);pose18("knight",9250);pose18("occultist",9280);pose18("mage",9600)');page.evaluate('HonroApp.engine.hurt(HonroApp.engine.unit("act2-keeper"),999999,HonroApp.engine.active.id)')
 assert page.evaluate('HonroAct23V4Reviewed18.corpseAccess(HonroApp)&&!HonroAct23V4Reviewed18.allow(HonroApp,HonroAct23V4ReviewedChapters.row("A2.S18.DEATH.01",18))'), page.evaluate('()=>{const a=HonroApp,e=a.engine,b=e.b,h=HonroAct23V4ReviewedChapters.actor(b,"담허"),u=e.unit("act2-keeper");return{hero:h,boss:u,ground:e.grounded(h),validHero:HONRO_CORE.validTerrainContactPose(b.terrain,h),validCorpse:HONRO_CORE.validTerrainContactPose(b.terrain,u),sight:HonroAct23V4Reviewed18.sight(e,h,u)};}')
 at('A2.S18.DEATH.02');corpse=page.evaluate('JSON.stringify(HonroApp.engine.unit("act2-keeper"))');snap('09-supported-corpse-confirmation');assert page.evaluate('JSON.stringify(HonroApp.engine.unit("act2-keeper"))')==corpse;page.set_viewport_size({'width':390,'height':844});snap('09b-mobile-supported-corpse');page.set_viewport_size({'width':1280,'height':800});next();drain(8)
 # Declared late prerequisite/combat fixtures; motion, support and locks remain real.
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,m=HonroAct23V4Stage18.memory(b);Object.assign(m,{hoistStarted:true,hoistProtected:true,connectionsChecked:true});permit18('18.lift');}""")
 drain(8);assert page.evaluate('use18("18.lift")');snap('10-lift-warning-from-to',{'x':7400,'y':6500,'scale':.33});opportunities();page.evaluate('HonroApp.engine.tick(1)');drain(10)
 assert state()['bell']['lifts']==1 and state()['bell']['offset']==-180
 snap('11-lift-gap-souls',{'x':7160,'y':6500,'scale':.6})
 page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,S=HonroAct23V4Stage18,V=HonroAct23V4;permit18('18.support');const supports=b.terrain.filter(t=>b.honroV4Stage18.supportIds.includes(t.id));for(const hit of S.occupants(b,supports.map(t=>({...t,broken:false})))){const u=e.unit(hit.id);if(u?.side!==1)throw Error('unexpected support occupant');e.hurt(u,999999,e.active.id);}}""")
 assert page.evaluate('use18("18.support")');drain(6);page.evaluate('permit18("18.settle")');assert page.evaluate('use18("18.settle")');assert state()['bell']['segment']['kind']=='translate'
 opportunities();page.evaluate('HonroApp.engine.tick(.45)');mid=state()['bell'];assert 0<mid['offsetX']<32 and mid['offset']==-180
 page.set_viewport_size({'width':390,'height':844});snap('12-mobile-horizontal-midmotion',{'x':7500,'y':6380,'scale':.13});page.set_viewport_size({'width':1280,'height':800});snap('13-horizontal-midmotion',{'x':7500,'y':6380,'scale':.35});resume();assert state()['bell']['offsetX']==mid['offsetX'];assert state()['bell']['segment']['kind']=='translate'
 page.evaluate('HonroApp.engine.tick(.45)');assert state()['bell']['offsetX']==32 and state()['bell']['offset']==-180 and not page.evaluate('HonroAct23V4Stage18.memory(HonroApp.engine.b).settled')
 at('A2.S18.STABILIZE.04');snap('14-real-support-predescent-clearance');page.set_viewport_size({'width':390,'height':844});snap('14b-mobile-predescent-actual-frame');page.set_viewport_size({'width':1280,'height':800});next();drain(3);assert state()['bell']['segment']['kind']=='settle';opportunities();page.evaluate('HonroApp.engine.tick(1)');drain(8)
 assert state()['bell']['reseats']==1 and state()['bell']['offset']==-80 and state()['bell']['offsetX']==32
 page.set_viewport_size({'width':390,'height':844});snap('15-mobile-reseated',{'x':7420,'y':6600,'scale':.13});page.set_viewport_size({'width':1280,'height':800})
 for id in ['18.lock-west','18.lock-east']:
  page.evaluate("""id=>{const a=HonroApp,e=a.engine,b=e.b,V=HonroAct23V4,p=V.marker(b,id);for(const u of b.units)if(V.alive(u)&&u.side===1&&!u.honroObjectiveTarget&&V.near(u,p,450))e.hurt(u,999999,e.active.id);}""",id)
  assert page.evaluate('id=>use18(id)',id)
  if id.endswith('west'):assert not state()['stable']
 assert state()['stable'];assert not page.evaluate('HonroAct23V4.state(HonroApp.engine.b).complete')
 assert page.evaluate('use18("18.souls")');drain(20)
 assert page.evaluate('HonroAct23V4Reviewed18.stable(HonroApp.engine.b)&&HonroAct23V4.state(HonroApp.engine.b).complete')
 assert page.evaluate('HonroApp.profile.record.filter(r=>r.rowId==="A2.S18.JOURNAL.01").length')==1
 assert page.evaluate('HonroAct23V4Reviewed18.memory(HonroApp.engine.b).knocks.length')==1
 snap('16-final-combined-overview',{'x':7400,'y':4950,'scale':.11});terrain=page.evaluate('JSON.stringify(HonroApp.engine.b.terrain)');resume();assert page.evaluate('JSON.stringify(HonroApp.engine.b.terrain)')==terrain
 assert state()['bell']['reseats']==1 and state()['bell']['lifts']==1
 # Independent real lethal interruption of an open living-owner question.
 assert page.evaluate(LAUNCH)==518
 page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,m=HonroAct23V4Stage18.memory(b),q=HonroAct23V4Reviewed18.memory(b);for(const [i,c]of ['archer','mage','knight','occultist'].entries())pose18(c,9480+i*30);Object.assign(m,{brakeLocked:true,rescued:true,rescueSafe:true,rescueDistance:130});const u=e.unit('18.survivor');u.x=9420;u.y=HonroMapEngine.surfaceY(b.terrain,u.x,undefined,'sb-east-gallery-sill').y;q.burialWitness=true;if(!HonroAct23V4ReviewedChapters.apiFor(18).begin(a,'question',['A2.S18.PHASE2.01']))throw Error('question fixture');}""")
 at('A2.S18.PHASE2.01',0);page.evaluate('HonroApp.engine.hurt(HonroApp.engine.unit("act2-keeper"),999999,HonroApp.engine.active.id)');assert not row();drain(8)
 guard=page.evaluate('()=>{const a=HonroApp,b=a.engine.b,api=HonroAct23V4ReviewedChapters.apiFor(18);return{question:api.memory(b).events.question,answer:api.memory(b).events.answer,slot:HonroAct23V4.mem(b).slots["18.reviewed.question"],corpseSpeech:HonroAct23V4Reviewed18.allow(a,api.row("A2.S18.DEATH.01")),optional:HonroJourneyContent.optional({...a.profile,honroBattle:b},18,"knight")};}')
 assert guard['question']['status']=='discarded' and guard['slot']['status']=='cancelled' and not guard.get('answer') and not guard['corpseSpeech'] and not guard['optional']
 assert not errors,errors
 report={'servedSource':served_source,'base':BASE,'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'runtime18SHA256':hashlib.sha256((ROOT/'shared/runtime/act23-v4-reviewed18.js').read_bytes()).hexdigest(),'rows':rows,'captures':captures,'rescue':rescue,'savedHorizontal':mid,'deadQuestionGuard':guard,'pageErrors':errors,'checks':['Exact approved text verified against actual story DOM before every Enter.','Actual keeper pull, resident approach, warning/opportunity gates and real lowering produce burial witness.','Actual brake/extraction and supported survivor walk reach safe region.','Individual keeper answer survives actual localStorage reload; lethal question cancellation blocks following answer and corpse speech.','Actual lift, support preparation, separate horizontal32 saved halfway, predescent row, reseat, separate locks, souls, finite knock and one journal; geometry and one lift/reseat persist on another reload.'],'limits':['Supported hero poses, prior chapter16 knowledge receipt, late hoist/inspection prerequisites, local combat deaths and inspection cameras are declared fixtures.','Simulation is explicitly stepped in the production Engine; this is not continuous normal-input play or full combat balance acceptance.','The separate lethal-interruption case seeds question eligibility as an isolation fixture; it does not claim another witnessed rope/rescue run.','DEATH.01 intentionally held: no actual dying hook. Ritual/open-shot and chapter17 upward-pull optional are conditional and not fabricated.','No build/generated asset/commit/master/deployment change; shared immutable private candidate only.']}
 (OUT/'capture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');browser.close();print('PASS reviewed18 Chromium DOM/Canvas/Enter, real rope/rescue/bell motion, midmotion localStorage, death speech guard and stable geometry; captures need direct visual inspection')
