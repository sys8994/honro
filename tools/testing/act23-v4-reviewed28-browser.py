"""Actual Chromium28 controls/dialogue/save and native injured convoy. Combat
casualties, hero guide poses/round replenishment and prior evidence are fixtures."""
import pathlib,os,json
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act23-v4/reviewed28-browser';OUT.mkdir(parents=True,exist_ok=True);BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8770')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':1280,'height':800});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Chapter28Reviewed');page.evaluate(PAUSE)
 page.evaluate("""async()=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(28);a.stopBattle();a.engine=null;a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<28;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.honroAct23V4History={revision:1,stages:{25:{run:'fixture25',reviewedNarrative:{proof:{goods:{items:['metal']}}}},26:{run:'fixture26',reviewedNarrative:{proof:{casting:{items:['metal']},testimony:{source:'ancestor-letter'}}}}}};a.profile=p;a.launch(28);a.turnNotice=null;for(const u of a.engine.b.units)if(u.side===1&&!u.honroObjectiveTarget)a.engine.hurt(u,999999,'fixture');}""")
 def tick(n=100):page.evaluate("""n=>{const a=HonroApp;for(let i=0;i<n&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);}a.updateHUD();}""",n)
 def finish():
  for _ in range(30):
   if not page.evaluate('!!HonroApp.dialogue'):return
   page.keyboard.press('Enter')
 def drain():
  for _ in range(12):
   tick(1)
   if not page.evaluate('!!HonroApp.dialogue'):return
   finish()
 def at(id):
  line=page.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]');assert line[2]['rowId']==id,line;assert page.locator('#story-line').text_content()==line[1]
 def shot(name,x=6650,y=2460,scale=.65):
  page.evaluate("""p=>{const a=HonroApp;Object.assign(a.scene,{manual:true,storyTween:null,cinematic:null,goalFocus:null,x:p.x,y:p.y,scale:p.scale});a.scene.render(a.engine,0,a.selected,a.power,false,0,true);}""",{'x':x,'y':y,'scale':scale});page.screenshot(path=str(OUT/(name+'.png')))
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue();HonroApp.turnNotice=null')
 def use(id,c):
  page.evaluate("""({id,c})=>{const a=HonroApp,b=a.engine.b,p=HonroAct23V4.marker(b,id),u=HonroAct23V4.heroes(b).find(u=>u.cls===c),x=p.x-190;Object.assign(u,{x,y:HONRO_CORE.topAt(b.terrain.find(t=>t.id==='a3-foundation'),x),vx:0,vy:0,airborne:false,jumping:false,acted:false});Object.assign(b,{active:u.id,side:0,phase:'aim'});a.updateHUD();}""",{'id':id,'c':c});page.keyboard.press('e');tick()
 drain();use('fire-screen','knight');drain();use('water-release','archer');drain();assert not page.evaluate('!!HonroAct23V4Chapter28Reviewed.memory(HonroApp.engine.b).proof.reunion')
 page.evaluate("""()=>{const b=HonroApp.engine.b,p=HonroAct23V4.marker(b,'party-reunion');for(const[i,u]of HonroAct23V4.heroes(b).entries()){const x=p.x-120+i*80;Object.assign(u,{x,y:HONRO_CORE.topAt(b.terrain.find(t=>t.id==='a3-foundation'),x),vx:0,vy:0,airborne:false,jumping:false});}}""");tick();at('A3.S28.REUNION.01');shot('28-01-four-real-grounded-reunion',3500,2290,.8);finish();drain();page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;a.engine.hurt(HonroAct23V4.heroes(b).find(u=>u.cls==='knight'),999999,'fixture');for(const[i,u]of HonroAct23V4.heroes(b).entries()){const x=200+i*80;Object.assign(u,{x,y:HONRO_CORE.topAt(b.terrain.find(t=>t.id==='a3-foundation'),x),vx:0,vy:0,airborne:false,jumping:false});}}""")
 saved=False
 for _ in range(70):
  state=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;b.round++;for(let i=0;i<350&&!a.dialogue&&!HonroAct23V4City.evacuationSafe(b);i++){Object.assign(b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);}a.updateHUD();return{safe:HonroAct23V4City.evacuationSafe(b),distance:HonroAct23V4City.memory(b).actors['v4.fire-resident-1']?.distance||0};}""");finish()
  if not saved and state['distance']>100:shot('28-02-native-injured-escort',4500,2400,.75);resume();saved=True
  if state['safe']:break
 assert state['safe'] and saved,state
 use('petition-record','mage');drain();assert not page.evaluate('!!HonroAct23V4Chapter28Reviewed.memory(HonroApp.engine.b).proof.packet')
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,u=HonroAct23V4.heroes(b).find(u=>u.cls==='mage');Object.assign(u,{x:6600,y:2590,vx:0,vy:0,airborne:false,jumping:false});Object.assign(a.scene,{manual:true,x:6800,y:2460,scale:.65});a.scene.render(a.engine,0,a.selected,a.power,false,0,true);}""");tick();at('A3.S28.DOC.APPROVAL');assert not page.evaluate('HonroApp.dialogue.lines.some(l=>l[0]==="휘겸")');shot('28-03-living-guard-shared-records');page.keyboard.press('Enter');at('A3.S28.DOC.EXECUTION');resume();at('A3.S28.DOC.EXECUTION');page.set_viewport_size({'width':390,'height':844});shot('28-04-record-mobile',6670,2450,.35);page.set_viewport_size({'width':1280,'height':800});finish()
 page.evaluate("""()=>{const b=HonroApp.engine.b,u=HonroAct23V4.heroes(b).find(u=>u.cls==='mage');Object.assign(u,{x:6350,y:2590,vx:0,vy:0,airborne:false,jumping:false});b.round++;}""")
 for _ in range(12):
  tick(100);finish()
  if page.evaluate('!!HonroAct23V4Chapter28Reviewed.journal(HonroApp.profile,28)'):break
 assert page.evaluate('!!HonroAct23V4Chapter28Reviewed.memory(HonroApp.engine.b).proof.departure');assert page.evaluate('!!HonroAct23V4Chapter28Reviewed.journal(HonroApp.profile,28)');assert page.evaluate('HonroAct23V4City.evacuationSafe(HonroApp.engine.b)');shot('28-05-actual-current-convoy-departure');assert not errors,errors;(OUT/'capture.json').write_text(json.dumps({'pageErrors':errors,'nativeNpcSave':saved,'limits':'Actual E/Enter/DOM/Canvas/localStorage and native injured convoy. Combat deaths, hero guide positions/round budgets and prior facts are fixtures; no normal combat/Pages claim.'},ensure_ascii=False,indent=2)+'\n');browser.close()
print('PASS Chromium28 two physical devices/actual four-person reunion/native injured escort/save; dead Knight and safe living Gwakjin share one record packet at actual location; saved document/mobile and native convoy departure before journal; pageerror0')
