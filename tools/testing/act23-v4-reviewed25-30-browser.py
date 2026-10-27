"""Actual Chromium DOM/Canvas/keyboard/storage. Explicit combat, hero placement
and prior-history fixtures; native NPC physics and void transition only."""
import os,json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act23-v4/reviewed25-30-browser';OUT.mkdir(parents=True,exist_ok=True);BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8770')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':1280,'height':800});errors=[];rows=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def boot():
  page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Chapter30Reviewed');page.evaluate(PAUSE)
 def launch(n):
  assert page.evaluate("""async n=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(n);a.stopBattle();a.engine=null;a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<n;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.honroAct23V4History={revision:1,stages:{25:{run:'fixture25',reviewedNarrative:{proof:{goods:{items:['metal']}}}},26:{run:'fixture26',reviewedNarrative:{proof:{casting:{items:['metal']},testimony:{source:'ancestor-letter'}}}},28:{run:'fixture28',reviewedNarrative:{proof:{packet:{source:'orders'}}}},29:{run:'fixture29',reviewedNarrative:{proof:{trace:{mage:true}}}}}};a.profile=p;a.launch(n);a.turnNotice=null;Object.assign(a.engine.b,{side:0,phase:'aim'});return a.engine.b.honroCampaignMapRevision;}""",n)==n+400
 def tick(n=100):page.evaluate("""n=>{const a=HonroApp;for(let i=0;i<n&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);}a.updateHUD();}""",n)
 def finish():
  for _ in range(35):
   if not page.evaluate('!!HonroApp.dialogue'):return
   page.keyboard.press('Enter')
  assert not page.evaluate('!!HonroApp.dialogue')
 def drain():
  for _ in range(15):
   tick(1)
   if not page.evaluate('!!HonroApp.dialogue'):return
   finish()
 def at(id):
  d=page.evaluate('({id:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId,text:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[1]})');assert d['id']==id,d;assert page.locator('#story-line').text_content()==d['text'];rows.append(d)
 def shot(name,x=None,y=None,scale=.75):
  if x is not None:page.evaluate("""p=>{const a=HonroApp,s=a.scene;Object.assign(s,{manual:true,storyTween:null,cinematic:null,goalFocus:null,x:p.x,y:p.y,scale:p.scale});s.render(a.engine,0,a.selected,a.power,false,0,true);}""",{'x':x,'y':y,'scale':scale})
  page.screenshot(path=str(OUT/(name+'.png')))
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue();HonroApp.turnNotice=null')
 def use(id,c):
  page.evaluate("""({id,c})=>{const a=HonroApp,b=a.engine.b,V=HonroAct23V4,p=V.marker(b,id),u=V.heroes(b).find(u=>u.cls===c),x=p.x-190;Object.assign(u,{x,y:HONRO_CORE.topAt(b.terrain.find(t=>t.id==='a3-foundation'),x),vx:0,vy:0,airborne:false,jumping:false,acted:false});Object.assign(b,{active:u.id,phase:'aim',side:0});a.updateHUD();}""",{'id':id,'c':c});page.keyboard.press('e');tick()
 boot();launch(26);drain();page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,V=HonroAct23V4;for(const u of b.units)if(u.side===1&&!u.honroObjectiveTarget)a.engine.hurt(u,999999,V.heroes(b)[0].id);const k=V.heroes(b).find(u=>u.cls==='knight');Object.assign(k,{x:4580,y:2150,vx:0,vy:0,airborne:false,jumping:false,acted:false});}""");drain();shot('26-01-workshop-structure',4760,2010,.8);use('hidden-latch','knight');drain();use('artisan-resident','occultist');at('A3.S26.RESCUE.01');resume();at('A3.S26.RESCUE.01');finish()
 page.evaluate("""()=>{const b=HonroApp.engine.b;for(const[i,u]of HonroAct23V4.heroes(b).entries()){const x=u.cls==='knight'?5280:200+i*80;Object.assign(u,{x,y:HONRO_CORE.topAt(b.terrain.find(t=>t.id==='a3-foundation'),x),vx:0,vy:0,airborne:false,jumping:false});}}""")
 for _ in range(30):
  tick(160)
  if page.evaluate('HonroApp.dialogue?.lines[0]?.[2]?.rowId')=='A3.S26.TESTIMONY.01':break
  finish()
 at('A3.S26.TESTIMONY.01');page.keyboard.press('Enter');at('A3.S26.TESTIMONY.02');assert page.locator('[data-reviewed-document-row="A3.S26.DOC.TESTIMONY"]').count()==1;shot('26-02-one-quoted-document',5080,2070,.9);page.set_viewport_size({'width':390,'height':844});shot('26-03-document-mobile',5080,2080,.5);page.set_viewport_size({'width':1280,'height':800});resume();at('A3.S26.TESTIMONY.02');assert page.locator('[data-reviewed-document-row]').count()==1;finish()
 launch(27);drain();page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,z=b.honroMap.act3.voidEncounter.trigger,u=HonroAct23V4.heroes(b).find(u=>u.cls==='archer'),x=(z.left+z.right)/2,y=HonroMapEngine.surfaceY(b.terrain,x,z.y).y;Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false});if(!HonroAct3Void.begin(a))throw Error('real void entry');for(let i=0;i<40;i++)HonroAct3Void.frame(a,.05);}""");assert page.locator('.honro-void-text[role="status"]').text_content()==page.evaluate('HonroApp.honroVoidSession.lines[0].text');shot('27-01-private-solo');page.set_viewport_size({'width':390,'height':844})
 for i in range(9):
  text=page.evaluate('HonroApp.honroVoidSession.lines[HonroApp.honroVoidSession.line].text');assert page.locator('.honro-void-text[role="status"]').text_content()==text;rows.append({'void':i,'text':text})
  if i==4:shot('27-02-time-question-mobile')
  page.wait_for_timeout(140);page.keyboard.press('Enter')
 page.evaluate('()=>{for(let i=0;i<9;i++)HonroAct3Void.frame(HonroApp,.05)}');assert page.evaluate('HonroApp.engine.b.honroAct3Void.state')=='RESOLVED';tick();at('EDGE.SCENES_27_VOID_RETURNLINES_0');shot('27-03-actual-return');finish();drain();assert page.evaluate('HonroApp.profile.honroReviewedPrivate["설오"][0].rowId')=='A3.S27.JOURNAL.PRIVATE';assert not page.evaluate('HonroApp.profile.record.some(r=>r.rowId==="A3.S27.JOURNAL.PRIVATE")');page.set_viewport_size({'width':1280,'height':800})
 launch(29);drain();page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,u=b.units.find(u=>u.id==='stage29-hantaerok'),k=HonroAct23V4.heroes(b).find(u=>u.cls==='knight');Object.assign(k,{x:2780,y:2220,vx:0,vy:0,airborne:false,jumping:false});Object.assign(a.scene,{manual:true,x:u.x,y:u.y-100,scale:.8});a.engine.hurt(u,999999,k.id);Object.assign(b,{side:0,phase:'aim'});}""");tick();at('A3.S29.DEFEAT.01');shot('29-01-observed-empty-armour-banner',3500,2150,.9);resume();at('A3.S29.DEFEAT.01');finish();assert not page.evaluate('HonroAct23V4Chapter29Reviewed.lineAllowed(HonroApp,"한태록",HonroAct23V4Chapter29Reviewed.lines(["A3.S29.INTRO.01"],"intro")[0][2])')
 page.evaluate("""()=>{const a=HonroApp;for(const u of HonroAct23V4.heroes(a.engine.b))a.engine.hurt(u,999999,'fixture');a.checkMission(a.engine);a.outcome();}""");at('A3.S29.GUIDE.FAIL');shot('29-02-real-failure-snapshot-guide');finish();page.locator('[data-action="retry"]').click();page.wait_for_function('HonroApp.screen==="battle"');assert page.evaluate('HonroAct23V4.heroes(HonroApp.engine.b).length')==4;assert page.evaluate('HonroApp.engine.b.units.find(u=>u.id==="stage29-hantaerok").hp>0');assert not page.evaluate('HonroApp.engine.b.terrain.find(t=>t.id==="old-door").broken');shot('29-03-actual-retry-restored-start')
 assert not errors,errors;(OUT/'capture.json').write_text(json.dumps({'limits':'Actual Chromium UI/canvas/keyboard/save; foes, hero guide poses/prior facts are fixtures.26 NPC walk/27 solo transition/29 native observed damage are production.30 full boat remains model-only in this browser unit.','rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2)+'\n');browser.close()
print('PASS Chromium26 native rescue/single document quotation and save/mobile;27 exact9 private solo rows/actual return/private journal;29 observed boss death/empty armour/bent flag/save and actual all-hero failure/guide/full retry; pageerror0')
