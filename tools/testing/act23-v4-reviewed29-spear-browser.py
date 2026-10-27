"""Actual Chromium native melee/Canvas/keyboard/save. Phase3, other combat
casualties and initial hero poses are fixtures; advance, cost and hits are native."""
import os,json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act23-v4/reviewed29-spear-browser';OUT.mkdir(parents=True,exist_ok=True);BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8770')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':1280,'height':800});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Chapter29Spear');page.evaluate(PAUSE)
 page.evaluate("""async()=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(29);a.stopBattle();a.engine=null;a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<29;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));a.profile=p;a.launch(29);a.turnNotice=null;a.engine.checkEnd=()=>false;Object.assign(a.engine.b,{side:0,phase:'aim'});}""")
 def tick():page.evaluate("""()=>{const a=HonroApp;for(let i=0;i<10&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);}a.updateHUD();}""")
 def finish():
  for _ in range(30):
   if not page.evaluate('!!HonroApp.dialogue'):return
   page.keyboard.press('Enter')
 def at(id):
  row=page.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]');assert row[2]['rowId']==id,row;assert page.locator('#story-line').text_content()==row[1]
 def shot(name):
  page.evaluate("""()=>{const a=HonroApp,u=a.engine.b.units.find(u=>u.id==='stage29-hantaerok');Object.assign(a.scene,{manual:true,storyTween:null,cinematic:null,goalFocus:null,x:u.x-80,y:u.y-65,scale:innerWidth<600?.7:1.1});a.scene.render(a.engine,0,a.selected,a.power,false,0,true);}""");page.screenshot(path=str(OUT/(name+'.png')))
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue();HonroApp.turnNotice=null;HonroApp.engine.checkEnd=()=>false');assert page.evaluate('HonroApp.screen')=='battle'
 tick();finish();page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,V=HonroAct23V4,C=HONRO_CORE,P=HonroAct23V4Stage29,u=b.units.find(u=>u.id===P.bossId);for(const v of b.units)if(v.side===1&&v.id!==P.bossId){v.hp=0;v.dead=true;}for(const[i,h]of V.heroes(b).entries()){const x=200+i*85;Object.assign(h,{x,y:C.topAt(b.terrain.find(t=>t.id==='a3-foundation'),x),vx:0,vy:0,airborne:false,jumping:false,acted:false});}Object.assign(P.memory(b),{phase:3,engaged:true});Object.assign(b,{active:u.id,side:1,phase:'enemy'});Object.assign(u,{fixed:false,acted:false,moveLeft:360});const start=u.x;for(let i=0;i<12;i++)P.tick(a,.025);if(u.x>=start-10)throw Error('native advance missing');const h=V.heroes(b).find(h=>h.cls==='archer');Object.assign(h,{x:u.x-145,y:u.y,vx:0,vy:0,airborne:false,jumping:false,acted:false});Object.assign(b,{active:h.id,side:0,phase:'aim'});}""")
 for _ in range(10):
  tick()
  if page.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId')=='A3.S29.THRUST_WARNING.01':break
  finish()
 at('A3.S29.THRUST_WARNING.01');assert page.evaluate('HonroAct23V4Chapter29Spear.warning(HonroApp)');shot('29-spear-01-native-sector-warning');page.set_viewport_size({'width':390,'height':844});shot('29-spear-02-warning-mobile');page.set_viewport_size({'width':1280,'height':800})
 frozen=page.evaluate('JSON.stringify(HonroAct23V4Chapter29Spear.memory(HonroApp.engine.b).plan)');page.evaluate('()=>{for(let i=0;i<50;i++)HonroApp.engine.tick(.025)}');assert page.evaluate('JSON.stringify(HonroAct23V4Chapter29Spear.memory(HonroApp.engine.b).plan)')==frozen;resume();at('A3.S29.THRUST_WARNING.01');assert page.evaluate('JSON.stringify(HonroAct23V4Chapter29Spear.memory(HonroApp.engine.b).plan)')==frozen;finish()
 result=page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,P=HonroAct23V4Stage29,S=HonroAct23V4Chapter29Spear,u=b.units.find(u=>u.id===P.bossId),h=HonroAct23V4.heroes(b).find(u=>u.cls==='archer'),hp=h.hp,focus=u.focus,cost=e.manaCost(HONRO_CORE.SKILLS[S.ID],u,S.POWER);Object.assign(b,{active:u.id,side:1,phase:'enemy'});u.acted=false;for(let i=0;i<40&&!u.meleeAction;i++)e.tick(.025);if(u.meleeAction?.skill!==S.ID)throw Error('no native spear cast');return{hp,focus,cost,shot:b.shot,attacks:S.memory(b).attacks,loadout:[...u.loadout]};}""");assert result['attacks']==1;shot('29-spear-03-real-native-cast');resume();assert page.evaluate('HonroApp.engine.b.units.find(u=>u.id==="stage29-hantaerok").meleeAction.skill')=='V4_HAN_THRUST'
 proof=page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,u=b.units.find(u=>u.id==='stage29-hantaerok'),h=HonroAct23V4.heroes(b).find(u=>u.cls==='archer');for(let i=0;i<8;i++)e.tick(.025);return{hp:h.hp,focus:u.focus,attacks:HonroAct23V4Chapter29Spear.memory(b).attacks,loadout:u.loadout};}""");assert proof['hp']<result['hp'];assert proof['focus']==result['focus']-result['cost'];assert proof['attacks']==1;assert proof['loadout']==result['loadout'],proof;shot('29-spear-04-actual-hit');assert not errors,errors
 (OUT/'capture.json').write_text(json.dumps({'pageErrors':errors,'before':result,'after':proof,'savedWarning':True,'savedNativeCast':True,'limits':'Actual Chromium canvas, E/Enter/storage, native advance/cost/melee/hit. Phase3, other casualties, initial hero poses are fixtures. Normal boss combat/Pages not claimed.'},ensure_ascii=False,indent=2)+'\n');browser.close()
print('PASS Chromium29 native advance/real spear warning+mobile/pause and reload/native cast reload/focus-paid real hit; pageerror0')
