"""Actual Chromium UI/render/save; prior facts, combat deaths and hero guides
are fixtures. NPC23 coordinates are never injected;24 departure is native walk."""
import json,os,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act23-v4/reviewed23-24-browser';OUT.mkdir(parents=True,exist_ok=True);BASE=os.environ.get('HONRO_BASE_URL','http://127.0.0.1:8770')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':1280,'height':800});errors=[];rows=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Chapter24Reviewed');page.evaluate(PAUSE)
 def tick(n=100):page.evaluate("""n=>{const a=HonroApp;for(let i=0;i<n&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);if(!a.dialogue)a.engine.stepUnits(.025);}a.updateHUD();}""",n)
 def at(id):
  actual=page.evaluate('({id:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId,text:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[1]})');assert actual['id']==id,actual;assert page.locator('#story-line').text_content()==actual['text'];rows.append(actual)
 def next():page.keyboard.press('Enter')
 def finish():
  for _ in range(20):
   if not page.evaluate('!!HonroApp.dialogue'):return
   next()
  assert not page.evaluate('!!HonroApp.dialogue')
 def shot(name):page.screenshot(path=str(OUT/(name+'.png')))
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"');page.evaluate('HonroApp.turnNotice=null')
 def launch(n):
  assert page.evaluate("""async id=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(id);a.stopBattle();a.engine=null;a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<id;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.seen['act2:first-spirit-encounter']=true;p.seen['map-story-v'+HonroStoryContent.version+'-'+(id-1)]=true;p.honroAct23V4History={revision:1,stages:{21:{run:'fixture-21',reviewedNarrative:{revision:1,rescued:true,proof:{emblem:{emblem:'old-sealed-diamond'}}}},22:{run:'fixture-22',reviewedNarrative:{revision:1,compared:{map:true}}},23:{run:'fixture-23',reviewedNarrative:{revision:1,proof:{goods:{familyCrest:'family-three-petals'},safe:{actor:'act3-carrier'}}}}}};a.profile=p;a.launch(id);a.turnNotice=null;return a.engine.b.honroCampaignMapRevision;}""",n)==400+n
 def pose_marker(id,c='knight',kill=False):
  page.evaluate("""({id,c,kill})=>{const a=HonroApp,b=a.engine.b,V=HonroAct23V4,m=V.marker(b,id),u=V.heroes(b).find(u=>u.cls===c),floor=b.terrain.find(t=>t.id===(b.honroStage===24?'a3-foundation':'sy-ground')),x=b.honroStage===23?2450:m.x;Object.assign(u,{x,y:HONRO_CORE.topAt(floor,x),vx:0,vy:0,airborne:false,jumping:false,acted:false});Object.assign(b,{active:u.id,side:0,phase:'aim'});if(kill)for(const v of b.units)if(v.side===1&&V.alive(v))a.engine.hurt(v,999999,u.id);a.updateHUD();}""",{'id':id,'c':c,'kill':kill})
 launch(23);tick();at('EDGE.ARRIVALS_23_0');shot('23-01-structure');next();tick();at('A3.S23.INTRO.01');shot('23-02-wagon-carrier');resume();at('A3.S23.INTRO.01');finish();pose_marker('dispatch-bundle','archer',True);page.keyboard.press('e');tick();at('A3.S23.ESCORT.01');finish();tick();at('A3.S23.GOODS.01');shot('23-03-goods-tags-family-crest');next();next();at('A3.S23.GOODS.03');resume();at('A3.S23.GOODS.03');finish();saved=False;flag=False
 for _ in range(100):
  state=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,V=HonroAct23V4,C=HONRO_CORE,R=HonroAct23V4Chapter23Reviewed,S=HonroAct23V4Chapter23Facts;b.round++;for(let i=0;i<300&&!a.dialogue&&!S.safe(b);i++){Object.assign(b,{side:0,phase:'aim'});const npc=b.units.find(u=>u.id==='act3-carrier'),heroes=V.heroes(b),choices=[];for(const dx of[155,100,180,240,300,400])for(const t of b.terrain){if(t.broken)continue;for(const f of C.terrainSurfaces(t,npc.x+dx)){if(Math.abs(f.y-npc.y)>=210||Math.abs(f.slope)>1.35)continue;const p={...heroes[0],x:npc.x+dx,y:f.y,vx:0,vy:0,airborne:false,jumping:false};if(C.validTerrainContactPose(b.terrain,p))choices.push({x:p.x,y:p.y,score:Math.abs(dx-155)+Math.abs(f.y-npc.y)*.1});}}choices.sort((x,y)=>x.score-y.score);if(!choices[0])throw Error('guide');Object.assign(heroes[0],choices[0],{vx:0,vy:0,airborne:false,jumping:false,acted:false});for(const[j,u]of heroes.entries())if(j){const x=250+j*85;Object.assign(u,{x,y:C.topAt(b.terrain.find(t=>t.id==='sy-ground'),x),vx:0,vy:0,airborne:false,jumping:false,acted:false});}V.tick(a,.025);if(!a.dialogue)a.engine.stepUnits(.025);}a.updateHUD();return{safe:S.safe(b),distance:R.memory(b).proof.walk?.distance||0,row:a.dialogue?.lines[a.dialogue.index]?.[2]?.rowId};}""")
  if state.get('row'):
   if state['row']=='A3.S23.FLAG.01':flag=True;at(state['row']);shot('23-04-identical-old-banner');page.set_viewport_size({'width':390,'height':844});shot('23-05-banner-mobile');page.set_viewport_size({'width':1280,'height':800})
   if state['row']=='A3.S23.CLEAR.01':at(state['row']);shot('23-06-porter-safe')
   finish()
  if not saved and state['distance']>500:resume();saved=True
  if state['safe']:break
 assert state['safe'] and saved and flag,state
 tick();finish();tick();assert page.evaluate('!!HonroAct23V4Chapter23Reviewed.journal(HonroApp.profile,23)')
 # Actual23 pre-entry field preview: expose bowls only after their Canvas view.
 page.evaluate("""()=>{const a=HonroApp;a.stopBattle();a.engine=null;a.scene=null;a.profile.honroBattle=null;a.profile.honroJourney={version:1,talked:{}};a.profile.cleared=Object.fromEntries(Array.from({length:22},(_,i)=>[i+1,{visits:1,rounds:1}]));delete a.profile.honroReviewed23RestObservation;HonroRestJourney.showRest(a);}""");page.wait_for_function('!!HonroApp.profile.honroReviewed23RestObservation?.goods');shot('23-07-rest-visible-bowls');page.locator('[data-action="rest-talk"][data-class="occultist"]').click();at('EDGE.OPTIONAL_23_OCCULTIST_0');finish()
 launch(24);pose_marker('family-crest');tick();at('EDGE.ARRIVALS_24_0');shot('24-01-house-crest');finish();tick();at('A3.S24.INTRO.01');finish();page.keyboard.press('e');tick();at('A3.S24.CREST.01');finish();pose_marker('shrine-seal','mage',True);page.keyboard.press('e');tick()
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;for(const[c,x]of[['archer',6040],['mage',6100],['knight',6210],['occultist',6270]]){const u=HonroAct23V4.heroes(b).find(u=>u.cls===c);Object.assign(u,{x,y:HONRO_CORE.topAt(b.terrain.find(t=>t.id==='a3-foundation'),x),vx:0,vy:0,airborne:false,jumping:false,acted:false});}}""");tick();at('A3.S24.ENTRY.01');next();next();at('A3.S24.ENTRY.03');shot('24-02-workshop-voice-routes');resume();at('A3.S24.ENTRY.03');finish();tick();at('A3.S24.INTRO.03');finish();tick()
 if page.evaluate('HonroApp.dialogue?.lines[0]?.[2]?.rowId')=='A3.S24.APPROACH_DANGER.01':finish();tick()
 at('A3.S24.SPLIT.01');shot('24-03-all-four-safe-decision');resume();at('A3.S24.SPLIT.01');finish();depart=False;moving=False
 for _ in range(20):
  state=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,V=HonroAct23V4,R=HonroAct23V4Chapter24Reviewed,goals={archer:5735,mage:5825,knight:6505,occultist:6595};for(let i=0;i<50&&!a.dialogue&&!R.memory(b).proof.departure;i++){Object.assign(b,{side:0,phase:'aim'});for(const c of['archer','mage','occultist','knight']){const u=V.heroes(b).find(u=>u.cls===c),x=goals[c];if(Math.abs(u.x-x)>2){const dt=Math.min(.025,Math.abs(x-u.x)/u.walkSpeed);a.engine.walk(u,Math.sign(x-u.x),dt,true);a.engine.integrateBody(u,dt,true);}}V.tick(a,.025);}a.updateHUD();return{depart:!!R.memory(b).proof.departure,distance:R.memory(b).departWalk?.archer?.distance||0,row:a.dialogue?.lines[a.dialogue.index]?.[2]?.rowId};}""")
  if state.get('row')=='A3.S24.DEPART.01':depart=True;at(state['row']);shot('24-04-actual-departure');resume();at(state['row']);finish()
  if not moving and state['distance']>80:resume();moving=True
  if state['depart']:break
 assert depart and moving and state['depart'],state
 at('A3.S24.GUIDE.01');page.set_viewport_size({'width':390,'height':844});shot('24-05-arrived-pairs-mobile');page.set_viewport_size({'width':1280,'height':800});finish();tick();assert page.evaluate('!!HonroAct23V4Chapter24Reviewed.journal(HonroApp.profile,24)');shot('24-06-final-pairs-resource-continuity')
 assert not errors,errors;(OUT/'capture.json').write_text(json.dumps({'scope':'Actual Chromium DOM/Canvas/Enter/E/localStorage. Prior history, combat deaths and hero initial/guide positions are fixtures. NPC23 coordinates never injected.24 departure uses original walk/integrateBody. No normal combat/fullplay claim.','rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2)+'\n');browser.close()
print('PASS Chromium23 NPC route/cargo/banner/rest observation and24 actual split walk/voice/anchors/save; pageerror0')
