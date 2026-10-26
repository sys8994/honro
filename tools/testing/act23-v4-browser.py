"""Private Phase A Canvas review. Explicit entry/pose fixtures, not fullplay."""
import json, os, pathlib, time
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/reports/act23-v4/browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('HONRO_BASE_URL','http://127.0.0.1:8765')
LAUNCH="""async id=>{
 const app=HonroApp;app.reviewPaused=true;await HonroCampaignLoader.ensureStage(id);app.stopBattle();app.close();
 const p=HonroProfileStore.fresh();p.revision=13;p.seen['act2:first-spirit-encounter']=true;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];
 for(let n=1;n<=30;n++)p.cleared[n]={visits:1,rounds:1};for(const cls of p.recruited)HONRO_CORE.grantXP(p.heroes[cls],HONRO_CORE.xpAtLevel(16));
 app.profile=p;app.debugMode=false;app.launch(id);app.turnNotice=null;app.lastTurnNotice=`${app.engine.b.round}:player`;return true;
}"""
SETUP="""()=>{const app=HonroApp,frame=app.frame;app.reviewPaused=true;app.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(now=>this.frame(now));}else frame.call(this,t);};}"""
VIEW="""mode=>{const app=HonroApp,b=app.engine.b,sc=app.scene,m=HonroAct23V4.marker(b,HonroAct23V4.current(b)?.id)||b.units.find(u=>u.side===0);sc.manual=true;sc.cinematic=null;sc.goalFocus=null;sc.storyTween=null;sc.focusUntil=0;sc.cameraIntent=null;
 if(mode==='structure'){sc.x=b.width/2;sc.y=b.height*.56;sc.scale=Math.min(1280/b.width,800/b.height)*.92;}
 else {sc.x=m.x;sc.y=m.y-160;sc.scale=mode==='detail'?.72:.64;}
 sc.render(app.engine,0,app.selected,app.power,false,0,true);return{requested:mode,camera:{x:sc.x,y:sc.y,scale:sc.scale},stage:b.honroStage,revision:b.honroAct23V4Revision,objective:HonroAct23V4.current(b)?.id,actors:b.units.length,dialogue:!!app.dialogue};}"""
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('HONRO_BROWSER','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 context=browser.new_context(viewport={'width':1280,'height':800},device_scale_factor=1)
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4',timeout=120000)
 assert page.evaluate('HONRO_ACT23_V4_PHASE_A===true'),'private candidate build required'
 page.evaluate(SETUP);rows=[]
 for stage in ([] if os.environ.get('HONRO_STATE_ONLY')=='1' or os.environ.get('HONRO_CARE_ONLY')=='1' else range(11,31)):
  page.evaluate(LAUNCH,stage);page.wait_for_function('n=>HonroApp.engine?.b.honroStage===n&&HonroApp.screen==="battle"',arg=stage,timeout=120000)
  assert page.evaluate('HonroApp.engine.b.honroAct23V4Revision===1')
  for mode in ['structure','detail','mobile']:
   page.set_viewport_size({'width':390,'height':844} if mode=='mobile' else {'width':1280,'height':800});page.wait_for_timeout(120)
   state=page.evaluate(VIEW,mode);assert not state['dialogue'];state['viewport']=page.viewport_size;state['file']=f'{stage:02d}-{mode}.png';page.locator('#battlecanvas').screenshot(path=str(OUT/state['file']));rows.append(state)
  if stage in [14,16,17,18,29,30]:
   page.set_viewport_size({'width':1280,'height':800});page.evaluate(VIEW,'detail')
   page.evaluate('HonroApp.reviewPaused=false');page.wait_for_timeout(450)
   before=page.evaluate('({x:HonroApp.engine.active.x,y:HonroApp.engine.active.y})');page.keyboard.down('ArrowRight');page.wait_for_timeout(220);page.keyboard.up('ArrowRight');page.evaluate('HonroApp.reviewPaused=true');after=page.evaluate('({x:HonroApp.engine.active.x,y:HonroApp.engine.active.y})');assert after['x']>before['x'],(stage,before,after);rows.append({'stage':stage,'action':'ArrowRight 220ms after real turn-notice pause','before':before,'after':after,'scope':'short actual keyboard movement; no chapter win claim'})
  print('captured',stage,flush=True)
 # Isolated state/placement fixtures qualify the changed mechanics. The
 # production movement, topology commits and Canvas drawing remain real.
 def state(stage,name,code,x,y,scale=.45):
  proof=page.evaluate(code) if code else None
  page.set_viewport_size({'width':1280,'height':800})
  page.evaluate('p=>{const a=HonroApp,s=a.scene;a.updateHUD(true);s.manual=true;s.cinematic=null;s.goalFocus=null;s.storyTween=null;s.focusUntil=0;s.cameraIntent=null;s.x=p.x;s.y=p.y;s.scale=p.scale;s.render(a.engine,0,a.selected,a.power,false,0,true);}',{'x':x,'y':y,'scale':scale})
  file=f'{stage}-{name}.png';page.locator('#battlecanvas').screenshot(path=str(OUT/file));rows.append({'stage':stage,'state':name,'proof':proof,'file':file,'scope':'qualified placement/combat fixture; actual production topology/movement and Canvas'})
 if os.environ.get('HONRO_CARE_ONLY')=='1':
  page.evaluate(LAUNCH,20)
  setup20="""()=>{const a=HonroApp,e=a.engine,b=e.b,V=HonroAct23V4,r=V.mem(b),floor=x=>HonroMapEngine.surfaceY(b.terrain,x,undefined,'act2-floor').y;for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}for(const s of V.steps(b)){if(s.id==='escort-mid')break;r.done[s.id]=true;}r.convoyStarted=true;r.ringRemoved=true;for(const h of V.heroes(b))Object.assign(h,{x:7000,y:floor(7000),vx:0,vy:0,airborne:false,jumping:false,acted:false});const u=e.unit('objective');Object.assign(u,{x:4000,y:floor(4000),vx:0,vy:0,airborne:false,jumping:false});e.hurt(u,20,'fixture');V.tick(a,.025);if(HonroAct23V4Act3.convoyCare(b).injured.status!=='waiting-support')throw Error('care wait');return HonroAct23V4Act3.convoyCare(b);}"""
  state(20,'injured-waiting',setup20,4100,3720,.8)
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(SETUP);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"')
  assert page.evaluate('HonroAct23V4Act3.convoyCare(HonroApp.engine.b).injured.status==="waiting-support"')
  join20="""()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.unit('objective'),h=HonroAct23V4.heroes(b)[0],from=u.x;for(let i=0;i<20;i++){const x=u.x+110;Object.assign(h,{x,y:HonroMapEngine.surfaceY(b.terrain,x,undefined,'act2-floor').y,vx:0,vy:0,airborne:false,jumping:false,acted:false});b.active=h.id;b.side=0;b.phase='aim';HonroAct23V4.tick(a,.025);e.stepUnits(.025);}const q=HonroAct23V4Act3.convoyCare(b);if(q.injured.status!=='supported'||u.x<=from)throw Error(JSON.stringify(q));return{from,to:u.x,care:q};}"""
  state(20,'injured-supported',join20,4180,3700,.8)
  bag20="""()=>{const a=HonroApp,e=a.engine,b=e.b;for(const[id,x]of[['convoy-mason',5105],['convoy-gilchan',5200]])Object.assign(e.unit(id),{x,y:HonroMapEngine.surfaceY(b.terrain,x,undefined,'act2-floor').y,vx:0,vy:0,airborne:false,jumping:false});for(let i=0;i<12;i++){b.phase='aim';b.side=0;HonroAct23V4.tick(a,.025);e.stepUnits(.025);}const q=HonroAct23V4Act3.convoyCare(b);if(q.baggage.status!=='handoff')throw Error(JSON.stringify(q));return q.baggage;}"""
  state(20,'baggage-handoff',bag20,5160,3550,.9)
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(SETUP);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"')
  assert page.evaluate('HonroAct23V4Act3.convoyCare(HonroApp.engine.b).baggage.status==="handoff"')
  state(20,'baggage-carried',"""()=>{const a=HonroApp;for(let i=0;i<25;i++){a.engine.b.phase='aim';a.engine.b.side=0;HonroAct23V4.tick(a,.025);a.engine.stepUnits(.025);}const q=HonroAct23V4Act3.convoyCare(a.engine.b);if(q.baggage.status!=='carried'||q.baggage.owner!=='convoy-gilchan'||q.baggage.transfers!==1)throw Error(JSON.stringify(q));return q.baggage;}""",5160,3550,.9)
  context.close();browser.close();assert not errors,errors
  (OUT/'care-capture.json').write_text(json.dumps({'scope':'Supported poses/combat fixture; original care motion, actual Canvas and browser localStorage/Continue','rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2)+'\n')
  print('PASS actual20 Canvas care wait/join, bag handoff/carried and two browser reload/Continue boundaries',flush=True);raise SystemExit(0)
 page.evaluate(LAUNCH,13);state(13,'inside-latch-work-shelves',None,4400,3800,.7)
 if os.environ.get('HONRO_ART_SINGLE')=='13':
  context.close();browser.close();print('PASS focused13 work-shelf Canvas capture',flush=True);raise SystemExit(0)
 page.evaluate(LAUNCH,14)
 state(14,'hypnosis-warning',"""()=>{const a=HonroApp,e=a.engine,b=e.b,V=HonroAct23V4,B=HonroAct23V4Act2,A=HonroAct23V4Act2Scenes;for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}V.mem(b).done['14.door-threat']=V.mem(b).done['14.house']=true;B.memory(b).houseOpen=true;for(let i=0;i<300&&!A.memory(b).hypnosisWarning;i++){b.phase='aim';b.side=0;V.tick(a,.025);e.stepUnits(.025);}const q=A.memory(b);if(!q.hypnosisWarning)throw Error(JSON.stringify(q));return{warning:q.hypnosisWarning,walk:q.walks['14.hypnosis']};}""",3150,2450,.8)
 page.evaluate(LAUNCH,16)
 ready16="""id=>{const a=HonroApp,e=a.engine,b=e.b,V=HonroAct23V4,p=V.marker(b,id),u=e.heroesAlive().find(u=>u.cls===(id==='16.disciple'?'occultist':'mage'));Object.assign(u,{x:p.x,y:p.y,vx:0,vy:0,airborne:false,jumping:false,acted:false});Object.assign(b,{active:u.id,side:0,phase:'aim'});a.turnNotice=null;a.lastTurnNotice=`${b.round}:player`;a.done=false;a.dialogue=null;return V.current(b).id;}"""
 for id in ['16.elder','16.disciple']:
  assert page.evaluate(ready16,id)==id;page.keyboard.press('e');assert page.evaluate('id=>!!HonroAct23V4.mem(HonroApp.engine.b).done[id]',id)
 page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,V=HonroAct23V4;for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}for(const[i,u]of e.heroesAlive().entries())Object.assign(u,{x:2450-i*100,y:5045,vx:0,vy:0,airborne:false,jumping:false,acted:false});const u=e.heroesAlive().find(u=>u.cls==='archer');Object.assign(u,{x:3300,y:4920});b.active=u.id;for(let i=0;i<300&&!V.mem(b).done['16.safe'];i++){b.phase='aim';b.side=0;V.tick(a,.05);e.stepUnits(.05);}if(!V.mem(b).done['16.safe'])throw Error('16 physical recovery failed');}""")
 page.evaluate(ready16,'16.testimony');page.evaluate('HonroAct23V4.tick(HonroApp,.05)')
 assert page.evaluate('HonroAct23V4.mem(HonroApp.engine.b).slots["16.testimony.required"].status')=='pending'
 state(16,'physical-recovery',None,2850,4900,.8)
 page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(SETUP);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"')
 assert page.evaluate('HonroAct23V4.mem(HonroApp.engine.b).slots["16.testimony.required"].status')=='pending'
 page.evaluate(ready16,'16.testimony');page.keyboard.press('e')
 assert page.evaluate('HonroAct23V4.mem(HonroApp.engine.b).slots["16.testimony.required"].status')=='done'
 rows.append({'stage':16,'action':'real E elder/disciple; pending-slot save + browser reload/Continue; real E acknowledgment','status':'passed','scope':'explicit actor placement; original root, Interactions DOM key handler and localStorage'})
 print('PASS actual DOM16 E/pending save/reload/Continue/acknowledgment',flush=True)
 # The void entrance uses the real DOM overlay, controls, native actor Canvas,
 # persistent transient recovery and original witness contract, with empty text.
 def prepare27():
  page.evaluate(LAUNCH,27)
  page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,z=b.honroMap.act3.crossings.at(-1).landing;for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}for(const[i,u]of b.units.filter(u=>u.side===0).entries())Object.assign(u,{x:(z.left+z.right)/2-60+i*120,y:z.y,vx:0,vy:0,airborne:false,jumping:false,acted:false});b.side=0;b.phase='aim';a.turnNotice=null;a.lastTurnNotice=`${b.round}:player`;b.honroAct3Void.recovered=true;window.voidBefore=structuredClone(b.units);window.voidRound=b.round;window.voidEnds=JSON.stringify(b.teamEnds);a.reviewPaused=false;}""")
 prepare27();assert page.evaluate('HonroAct3Void.begin(HonroApp)');page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="VOID"')
 assert page.locator('.honro-void-measure').count()==2;assert page.locator('.honro-void-text:not(.honro-void-measure)').inner_text()==''
 page.screenshot(path=str(OUT/'27-void-empty-slots.png'))
 page.keyboard.press('Enter');page.wait_for_timeout(150);page.keyboard.press('Enter');page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="RESOLVED"')
 assert page.evaluate('!HonroAct3Void.blocked(HonroApp)&&!HonroApp.root.inert&&!document.querySelector(".honro-void-scene")&&HonroApp.engine.b.honroVoidWitness===true&&HonroApp.profile.honroStoryEvents["act3-void-v1"]===true')
 assert page.evaluate('HonroApp.engine.b.round===voidRound&&JSON.stringify(HonroApp.engine.b.teamEnds)===voidEnds')
 rows.append({'stage':27,'action':'actual DOM void entry; two empty far/near slots; Enter/Enter return','status':'passed','scope':'deep-gallery pose/combat fixture; actual overlay/native actor, world-clock and witness'})
 prepare27();assert page.evaluate('HonroAct3Void.begin(HonroApp)');page.wait_for_timeout(280)
 assert page.evaluate('HonroAct3Void.blocked(HonroApp)&&HonroApp.profile.honroBattle.honroAct3Void.state==="FALLING"')
 page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(SETUP);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"')
 assert page.evaluate('HonroApp.engine.b.honroAct3Void.state==="READY"&&HonroApp.engine.b.honroAct3Void.recovered&&!HonroAct3Void.blocked(HonroApp)&&!HonroApp.root.inert&&!document.querySelector(".honro-void-scene")')
 assert page.evaluate('HonroAct3Void.begin(HonroApp)');page.evaluate('HonroApp.reviewPaused=false');page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="VOID"');page.locator('.honro-void-skip').click();page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="RESOLVED"')
 rows.append({'stage':27,'action':'FALLING localStorage save; browser reload/Continue safe READY recovery; reentry/skip/return','status':'passed','scope':'actual DOM/storage and unchanged map revision'})
 print('PASS actual DOM27 entry/return and transient reload/reentry/return',flush=True)
 page.evaluate(LAUNCH,17);state(17,'shaft-workers',None,8680,4430,.7)
 page.evaluate(LAUNCH,18)
 state(18,'bell-before',None,7040,6790,.4)
 qualify18="""()=>{const a=HonroApp,e=a.engine,b=e.b,S=HonroAct23V4Stage18,m=S.memory(b);for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}m.threat.started=m.threat.lowered=m.brakeLocked=m.connectionsChecked=m.rescued=m.rescueSafe=m.hoistStarted=m.hoistProtected=true;m.extraction={actorId:'p-occultist',spiritId:'18.survivor-spirit'};Object.assign(e.unit('18.survivor-spirit'),{dead:true,hp:0});HonroStage18Bell.shift(b,-40);m.bell.offset=-40;m.bell.status='braked';S.cleanupDeath(a);S.begin(a,'lift',-180);for(const id of m.bell.segment.heroes)m.bell.segment.opportunities[id]=1;a.actorBoundary=e.active.id;S.transition(a);a.actorBoundary=null;if(m.bell.status!=='moving')throw Error(JSON.stringify(m));return{offset:m.bell.offset,status:m.bell.status};}"""
 state(18,'lift-0',qualify18,7040,6790,.4)
 state(18,'lift-045',"()=>{HonroApp.engine.tick(.45);return HonroAct23V4Stage18.memory(HonroApp.engine.b).bell;}",7040,6790,.4)
 state(18,'bell-lifted',"()=>{HonroApp.engine.tick(.45);const m=HonroAct23V4Stage18.memory(HonroApp.engine.b);if(!m.liftDone)throw Error('not lifted');return m.bell;}",7040,6790,.4)
 settle18="""()=>{const a=HonroApp,e=a.engine,b=e.b,S=HonroAct23V4Stage18,m=S.memory(b);for(const list of[b.terrain,b.honroWorldTerrain])for(const t of list||[])if(b.honroV4Stage18.supportIds.includes(t.id))t.broken=false;m.supportReady=true;S.begin(a,'settle',-80,32);for(const id of m.bell.segment.heroes)m.bell.segment.opportunities[id]=1;a.actorBoundary=e.active.id;S.transition(a);a.actorBoundary=null;if(m.bell.status!=='moving')throw Error(JSON.stringify(m));return m.bell;}"""
 state(18,'reseat-0',settle18,7040,6790,.4)
 state(18,'reseat-045',"()=>{HonroApp.engine.tick(.45);return HonroAct23V4Stage18.memory(HonroApp.engine.b).bell;}",7040,6790,.4)
 state(18,'bell-settled',"()=>{HonroApp.engine.tick(.45);const m=HonroAct23V4Stage18.memory(HonroApp.engine.b);if(!m.settled||m.bell.offsetX!==32)throw Error('not reseated');return m.bell;}",7040,6790,.4)
 page.evaluate(LAUNCH,29)
 state(29,'cover-before',None,3250,2150,.75)
 cover29="""()=>{const a=HonroApp,e=a.engine,b=e.b,S=HonroAct23V4Stage29;for(const h of e.heroesAlive()){h.x=2650-e.heroesAlive().indexOf(h)*60;h.y=2220;}for(const u of b.units)if(u.id!==S.bossId&&(u.honroStage29Required||S.coverBlockers(b).includes(u.id))){u.dead=true;u.hp=0;}S.tick(a,0);for(const h of e.heroesAlive()){Object.assign(b,{active:h.id,side:0,phase:'aim'});h.acted=false;S.tick(a,0);e.finishAction(true);}Object.assign(b,{active:e.heroesAlive()[0].id,side:0,phase:'aim'});e.active.acted=false;a.actorBoundary=e.active.id;S.tick(a,0);a.actorBoundary=null;if(!S.memory(b).coverCommitted)throw Error(JSON.stringify(S.memory(b)));return{phase:S.memory(b).phase,cover:S.memory(b).coverCommitted};}"""
 state(29,'cover-after',cover29,3250,2150,.75)
 walk29="""()=>{const a=HonroApp,e=a.engine,b=e.b,S=HonroAct23V4Stage29,m=S.memory(b),u=e.unit(S.bossId);for(let r=0;r<4;r++){for(const h of e.heroesAlive()){Object.assign(b,{active:h.id,side:0,phase:'aim'});h.acted=false;S.tick(a,0);e.finishAction(true);}Object.assign(b,{active:e.heroesAlive()[0].id,side:0,phase:'aim'});e.active.acted=false;a.actorBoundary=e.active.id;S.tick(a,0);a.actorBoundary=null;for(const v of b.units)if(v.id!==u.id&&v.honroStage29Required){v.dead=true;v.hp=0;}S.tick(a,0);}if(m.phase!==3)throw Error(JSON.stringify(m));b.phase='enemy';b.side=1;b.active=u.id;u.acted=false;u.moveLeft=u.maxMove=360;const x=u.x;for(let i=0;i<18;i++)S.tick(a,.05);if(!(u.x<x))throw Error('boss did not walk');return{phase:m.phase,from:x,to:u.x};}"""
 state(29,'boss-advance',walk29,3850,2100,.75)
 echo29="""()=>{const a=HonroApp,e=a.engine,b=e.b,S=HonroAct23V4Stage29,u=e.heroesAlive()[0];e.hurt(e.unit(S.bossId),999999,u.id);S.tick(a,0);const lock=b.honroMarkers.find(p=>p.id==='stage29-sluice');Object.assign(b,{active:u.id,side:0,phase:'aim'});Object.assign(u,{x:lock.x,y:lock.y,acted:false,vx:0,vy:0});if(!S.use(a,lock))throw Error('sluice');Object.assign(b,{active:u.id,side:0,phase:'aim'});u.acted=false;const p=b.honroMarkers.find(p=>p.id==='stage29-echo');u.x=p.x;u.y=p.y;if(!S.use(a,p))throw Error('echo');for(let i=0;i<9;i++)S.tick(a,.05);return S.memory(b).echo;}"""
 state(29,'stake-gesture',echo29,2860,2150,.9)
 page.evaluate(LAUNCH,30)
 ferry30="""()=>{const a=HonroApp,e=a.engine,b=e.b,S=HonroAct23V4Stage30;for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}b.phase='aim';b.side=0;S.memory(b).ready=true;const u=e.active;u.x=6400;u.y=6426.666666666667;S.evacuation(a,.025);u.x=1320;u.y=5400;for(let i=0;i<12000&&S.memory(b).boat.status!=='outbound';i++)S.evacuation(a,.025);for(let i=0;i<100;i++)S.evacuation(a,.025);const m=S.memory(b);if(m.boat.status!=='outbound')throw Error(JSON.stringify(m));return{status:m.boat.status,x:m.boat.x,passengers:m.boat.manifest,rescued:m.rescued};}"""
 state(30,'ferry-crossing',ferry30,6860,6530,.9)
 landed30="""()=>{const a=HonroApp,S=HonroAct23V4Stage30;for(let i=0;i<16000&&S.memory(a.engine.b).rescued.length<4;i++)S.evacuation(a,.025);const m=S.memory(a.engine.b);if(m.rescued.length!==4)throw Error(JSON.stringify(m));return{status:m.boat.status,distance:m.boat.distance,rescued:m.rescued};}"""
 state(30,'ferry-landed',landed30,7440,6500,.9)
 context.close();browser.close()
 result={'scope':'Actual Chromium/production Canvas; level16 cleared-profile entry and camera fixtures; three distinct views; short key movement, no fullplay/normal-balance claim.','browser':'system Chromium','rows':rows,'pageErrors':errors,'base':BASE}
 (OUT/('state-capture.json' if os.environ.get('HONRO_STATE_ONLY')=='1' else 'capture.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');assert not errors,errors
 print('PASS requested candidate entries/views and changed-state Canvas fixtures; scope disclosed')
