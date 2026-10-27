"""Actual Chromium DOM/Canvas/storage. Combat deaths/hero poses are fixtures;
city NPC movement, quest damage, dialogue keys and save/Continue are production."""
import json,os,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act23-v4/reviewed21-browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('HONRO_BASE_URL','http://127.0.0.1:8769')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};}"""
LAUNCH="""async()=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(21);a.stopBattle();a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<=20;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.seen['act2:first-spirit-encounter']=true;p.seen['map-story-v'+HonroStoryContent.version+'-20']=true;a.profile=p;a.launch(21);a.turnNotice=null;return a.engine.b.honroCampaignMapRevision;}"""
TICK="""n=>{const a=HonroApp;for(let i=0;i<n&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);}a.updateHUD();}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':800});errors=[];rows=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def boot():
  page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Chapter21Reviewed');page.evaluate(PAUSE)
 def capture(name,x=None,y=None,scale=.75):
  if x is not None:page.evaluate('p=>{const a=HonroApp,s=a.scene;s.manual=true;s.storyTween=null;s.cinematic=null;s.goalFocus=null;s.x=p.x;s.y=p.y;s.scale=p.scale;s.render(a.engine,0,a.selected,a.power,false,0,true);}',{'x':x,'y':y,'scale':scale})
  page.screenshot(path=str(OUT/(name+'.png')))
 def at(id):
  actual=page.evaluate('({id:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId,text:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[1]})');assert actual['id']==id,actual
  assert page.locator('#story-line').text_content()==actual['text'];assert actual['text']==page.evaluate('id=>HonroAct23V4Chapter21Reviewed.row(id).text',id);rows.append(actual)
 def next():page.keyboard.press('Enter')
 def finish():
  for _ in range(15):
   if not page.evaluate('!!HonroApp.dialogue'):return
   next()
  assert not page.evaluate('!!HonroApp.dialogue')
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"');page.evaluate('HonroApp.turnNotice=null')
 boot();assert page.evaluate(LAUNCH)==421;page.evaluate(TICK,20);at('EDGE.ARRIVALS_21_0');capture('01-structure',3000,2490,.23);resume();at('EDGE.ARRIVALS_21_0');next();page.evaluate(TICK,50);at('A3.S21.INTRO.01');capture('02-cart-guard-armor',2175,2515,.9);next();at('A3.S21.INTRO.02');resume();at('A3.S21.INTRO.02');finish()
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,cart=b.units.find(u=>u.id==='v4.gate-cart');a.engine.hurt(cart,999999,a.engine.heroesAlive()[0].id);Object.assign(b,{side:0,phase:'aim'});}""");page.evaluate(TICK,20);at('A3.S21.CART_STOP.01');next();at('A3.S21.CART_STOP.02');assert page.evaluate('HonroAct23V4Chapter21.memory(HonroApp.engine.b).proof.turn.distance>0');capture('03-stopped-turn',2040,2515,.95);resume();at('A3.S21.CART_STOP.02');finish()
 # Explicit local combat completion and hero guide poses; original NPC physics.
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,V=HonroAct23V4,C=HONRO_CORE;for(const id of b.honroV4CitySpec.localIds){const u=b.units.find(u=>u.id===id);if(V.alive(u))a.engine.hurt(u,999999,a.engine.heroesAlive()[0].id);}for(const[i,u]of V.heroes(b).entries()){const x=220+i*85;Object.assign(u,{x,y:C.topAt(b.terrain.find(t=>t.id==='a3-foundation'),x),vx:0,vy:0,airborne:false,jumping:false,acted:false});}const u=V.heroes(b)[0],p=V.marker(b,'gate-resident');Object.assign(u,{x:p.x-190,y:C.topAt(b.terrain.find(t=>t.id==='a3-foundation'),p.x-190)});b.active=u.id;Object.assign(b,{side:0,phase:'aim'});if(!V.use(a,p))throw Error('actual rescue use');Object.assign(b,{side:0,phase:'aim'});Object.assign(u,{x:220,y:C.topAt(b.terrain.find(t=>t.id==='a3-foundation'),220)});}""")
 saved=False;last=False
 for _ in range(45):
  state=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,V=HonroAct23V4,P=HonroAct23V4City;b.round++;for(let i=0;i<450&&!a.dialogue&&!HonroAct23V4Chapter21.rescued(b);i++){Object.assign(b,{side:0,phase:'aim'});const q=P.memory(b);if(q.pressure.warnSerial!==undefined&&!q.pressure.admitted){b.honroState.actorTurnSerial=q.pressure.warnSerial+1;a.actorBoundary=V.heroes(b)[0].id;}V.tick(a,.025);for(const id of q.pressure.ids||[]){const u=b.units.find(u=>u.id===id);if(V.alive(u))a.engine.hurt(u,999999,V.heroes(b)[0].id);}}a.updateHUD();return{safe:HonroAct23V4Chapter21.rescued(b),distance:P.memory(b).actors['act3-resident']?.distance||0,row:a.dialogue?.lines[a.dialogue.index]?.[2]?.rowId};}""")
  if state.get('row'):
   if state['row']=='A3.S21.LAST_ESCORT.01':
    last=True;at(state['row']);capture('04-last-injured-moving',2270,2520,.8);page.set_viewport_size({'width':390,'height':844});capture('05-last-injured-mobile',2240,2500,.5);page.set_viewport_size({'width':1280,'height':800});resume();at(state['row'])
   finish()
  if not saved and state['distance']>120:
   before=page.evaluate('JSON.stringify(HonroAct23V4City.memory(HonroApp.engine.b).actors)');resume();assert page.evaluate('JSON.stringify(HonroAct23V4City.memory(HonroApp.engine.b).actors)')==before;saved=True
  if state['safe']:break
 assert state['safe'] and saved and last,state
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;for(const[i,u]of HonroAct23V4.heroes(b).entries()){const x=1900+i*65;Object.assign(u,{x,y:HONRO_CORE.topAt(b.terrain.find(t=>t.id==='a3-foundation'),x),vx:0,vy:0,airborne:false,jumping:false,acted:false});}}""");page.evaluate(TICK,20);at('A3.S21.CLEAR.01');next();next();at('A3.S21.CLEAR.03');capture('06-empty-old-current-armor',2210,2520,1.05);resume();at('A3.S21.CLEAR.03');finish();page.evaluate(TICK,20);at('A3.S21.EXIT.01');finish();page.evaluate(TICK,20);assert page.evaluate('!!HonroAct23V4Chapter21Reviewed.journal(HonroApp.profile,21)');capture('07-final-gate-rescue',2200,2470,.65)
 # Real pre-entry observation uses the actual battlefield renderer behind rest.
 page.evaluate("""()=>{const a=HonroApp;a.stopBattle();a.engine=null;a.scene=null;a.profile.honroBattle=null;a.profile.record=[];a.profile.honroJourney={version:1,talked:{}};a.profile.cleared=Object.fromEntries(Array.from({length:20},(_,i)=>[i+1,{visits:1,rounds:1}]));delete a.profile.honroReviewed21RestObservation;HonroRestJourney.showRest(a);}""")
 page.wait_for_function('!!HonroApp.profile.honroReviewed21RestObservation&&!!HonroApp.honroReviewed21RestPreview');capture('08-pre-entry-observation-rest')
 page.locator('[data-action="rest-talk"][data-class="archer"]').click();at('EDGE.OPTIONAL_21_ARCHER_0');next();at('EDGE.OPTIONAL_21_ARCHER_1');page.reload();page.wait_for_function('!!globalThis.HonroApp');page.evaluate(PAUSE);page.evaluate('HonroRestJourney.showRest(HonroApp)');page.wait_for_function('!!HonroApp.dialogue');at('EDGE.OPTIONAL_21_ARCHER_1');next();at('EDGE.OPTIONAL_21_ARCHER_2');finish();capture('09-optional-resumed')
 assert not errors,errors
 (OUT/'capture.json').write_text(json.dumps({'scope':'Actual Chromium DOM/Canvas/Enter and localStorage/Continue. Profile, local enemy deaths, hero positions and round/action serial advances are fixtures. NPC walk uses production physics with no coordinate injection. No normal combat completion claim.','rows':rows,'pageErrors':errors,'savedMovement':saved,'lastInjuredMoving':last},ensure_ascii=False,indent=2)+'\n')
 browser.close()
print('PASS Chromium chapter21 dialogue/turn/physical escort/armour/optional preview and saved cursors; pageerror0')
