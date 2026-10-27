"""Chromium native boat/crew/passenger/wave-action/save regression. Explicit
combat deaths and hero guide placements are fixtures, never NPC coordinates."""
import pathlib,os,json
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act23-v4/reviewed30-browser';OUT.mkdir(parents=True,exist_ok=True);BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8770')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':1280,'height':800});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Chapter30Reviewed');page.evaluate(PAUSE)
 page.evaluate("""async()=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(30);a.stopBattle();a.engine=null;a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<30;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));a.profile=p;a.launch(30);a.turnNotice=null;const b=a.engine.b,V=HonroAct23V4;for(const u of b.units)if(u.side===1&&!u.honroObjectiveTarget)a.engine.hurt(u,999999,V.heroes(b)[0].id);for(const c of['archer','knight'])a.engine.hurt(V.heroes(b).find(u=>u.cls===c),999999,'fixture');const u=V.heroes(b).find(u=>u.cls==='mage');Object.assign(u,{x:6400,y:6426.666666666667,vx:0,vy:0,jumping:false,airborne:false,acted:false});Object.assign(b,{active:u.id,side:0,phase:'aim'});a.engine.checkEnd=()=>false;Object.assign(a.scene,{manual:true,x:6580,y:6420,scale:.7});}""")
 def tick():page.evaluate("""()=>{const a=HonroApp;for(let i=0;i<100&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);}a.updateHUD();}""")
 def finish():
  for _ in range(30):
   if not page.evaluate('!!HonroApp.dialogue'):return
   page.keyboard.press('Enter')
 def drain():
  for _ in range(15):
   tick()
   if not page.evaluate('!!HonroApp.dialogue'):return
   finish()
 def shot(name,x=6950,y=6350,scale=.7):
  page.evaluate("""p=>{const a=HonroApp;Object.assign(a.scene,{manual:true,storyTween:null,cinematic:null,goalFocus:null,x:p.x,y:p.y,scale:p.scale});a.scene.render(a.engine,0,a.selected,a.power,false,0,true);}""",{'x':x,'y':y,'scale':scale});page.screenshot(path=str(OUT/(name+'.png')))
 def at(id):
  d=page.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]');assert d[2]['rowId']==id,d;assert page.locator('#story-line').text_content()==d[1]
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue();HonroApp.turnNotice=null;HonroApp.engine.checkEnd=()=>false')
 drain();shot('30-01-actual-pier-crew',6510,6410,.75)
 boarding=False;moving=False;returned=False
 for _ in range(90):
  state=page.evaluate("""({boarding,moving})=>{const a=HonroApp,b=a.engine.b,V=HonroAct23V4,P=HonroAct23V4Stage30,I=P.ids;let count=0;const pending=()=>Object.values(P.memory(b).waves).some(w=>!w.admitted);for(let i=0;i<1800&&!P.rescueComplete(b);i++){a.turnNotice=null;if(a.dialogue)return{kind:'story',row:a.dialogue.lines[a.dialogue.index][2].rowId};if(b.side!==0||b.phase!=='aim'||!a.engine.canAct()){a.engine.tick(HONRO_CORE.STEP);V.tick(a,0);}else if(pending())a.engine.wait();else V.tick(a,.025);for(const w of Object.values(P.memory(b).waves))for(const id of w.ids||[]){const u=b.units.find(u=>u.id===id);if(V.alive(u))a.engine.hurt(u,999999,V.heroes(b)[0].id);}const m=P.memory(b);if(m.ready){const mage=V.heroes(b).find(u=>u.cls==='mage');Object.assign(mage,{x:1320,y:5400,vx:0,vy:0,airborne:false,jumping:false});}if(!moving&&m.boat.status==='outbound'&&m.boat.distance>100)return{kind:'moving',m:JSON.stringify(m),actors:JSON.stringify([...I.crew,...I.residents].map(id=>b.units.find(u=>u.id===id)))};}a.updateHUD();return{kind:P.rescueComplete(b)?'safe':'batch',transport:P.memory(b)};}""",{'boarding':boarding,'moving':moving})
  if state['kind']=='story':
   if state['row']=='A3.S30.GUIDE.01':
    at(state['row']);shot('30-02-first-boarding-guide',6590,6410,.85);resume();at(state['row']);boarding=True
   finish()
  elif state['kind']=='moving':
   shot('30-03-moving-hull-passengers');resume();assert page.evaluate('JSON.stringify(HonroAct23V4Stage30.memory(HonroApp.engine.b))')==state['m'];assert page.evaluate('JSON.stringify([...HonroAct23V4Stage30.ids.crew,...HonroAct23V4Stage30.ids.residents].map(id=>HonroApp.engine.b.units.find(u=>u.id===id)))')==state['actors'];moving=True
  elif state['kind']=='safe':break
 assert state['kind']=='safe' and boarding and moving,state
 assert page.evaluate('HonroAct23V4Stage30.memory(HonroApp.engine.b).boat.distance')==1230
 shot('30-04-two-trips-actual-safe',7520,6250,.65);page.set_viewport_size({'width':390,'height':844});shot('30-05-safe-shore-mobile',7530,6240,.35);page.set_viewport_size({'width':1280,'height':800})
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,I=HonroAct23V4Stage30.ids,n=b.units.find(u=>u.id===I.seaman),u=HonroAct23V4.heroes(b).find(u=>u.cls==='mage'),x=n.x+75;Object.assign(u,{x,y:HONRO_CORE.topAt(b.terrain.find(t=>t.id==='sf-east-recovery-shore'),x),vx:0,vy:0,airborne:false,jumping:false,acted:false});Object.assign(b,{active:u.id,side:0,phase:'aim'});a.updateHUD();}""");drain();page.keyboard.press('e');tick();at('A3.S30.THIRTEEN.02');page.keyboard.press('Enter');at('A3.S30.THIRTEEN.03');shot('30-06-living-ferryman-dead-questioner',7440,6290,.6);resume();at('A3.S30.THIRTEEN.03');finish();assert page.evaluate('HonroAct23V4Chapter30Reviewed.memory(HonroApp.engine.b).proof.testimony.presentStatus')=='unknown'
 assert not errors,errors;(OUT/'capture.json').write_text(json.dumps({'pageErrors':errors,'boatDistance':1230,'boardingCursorSave':boarding,'movingHullSave':moving,'limits':'Actual native boat/NPC movement and action/wave admission in Chromium; combat casualties and hero guide locations are fixtures. E/Enter and storage continuation actual. No normal combat/Pages claim.'},ensure_ascii=False,indent=2)+'\n');browser.close()
print('PASS Chromium30 native two trips/actual four disembarked safe/Gwakjin return and rejoin, finite native action wave receipts, hull/passenger and guide save/mobile, living ferryman/dead questioner and saved testimony; pageerror0')
