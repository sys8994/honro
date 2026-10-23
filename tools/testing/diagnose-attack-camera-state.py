"""Read-only production-source diagnosis. Actual committed web bundle in Chromium.
Flat-arena/turn fixtures, deterministic clock and manual frame stepping: NOT normal
campaign play. Engine.fire, App.releaseCharge, enemy planner, melee and summon code
are real; only input/turn prerequisites and completion guards are fixture state.
"""
import json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import ROOT,launch,serve_game
from playwright.sync_api import sync_playwright
OUT=ROOT/'_local/reports/attack-camera-state';OUT.mkdir(parents=True,exist_ok=True)
INSTALL=r'''()=>{
 const a=HonroApp;window.cameraDiagnosisBase=structuredClone(a.engine.b);a.frame=()=>{};
 window.diagNow=10000;Object.defineProperty(performance,'now',{configurable:true,value:()=>diagNow});
 window.diagSetup=()=>{const a=HonroApp;a.dialogue=null;a.storyCamera=null;a.done=false;a.mount(structuredClone(cameraDiagnosisBase));a.dialogue=null;a.storyCamera=null;a.done=false;a.turnNotice=null;a.lastTurnNotice=null;a.charging=false;a.modal.classList.remove('open');document.getElementById('dialogue-root').innerHTML='';document.body.classList.remove('story-lock');
  const e=a.engine,b=e.b,s=a.scene,C=HONRO_CORE;window.diagCalls=[];window.diagShots=[];
  b.width=12000;b.height=3000;b.honroCamera=undefined;b.terrain=[HonroMapEngine.solid('diag-flat-floor',[[0,900],[12000,900],[12000,3000],[0,3000]])];b.honroWorldTerrain=structuredClone(b.terrain);b.sceneVersion++;b.waters=[];b.drafts=[];b.zones=[];b.projectiles=[];b.volley=undefined;b.honroEvents=[];b.honroMarkers=[];b.honroState.storyQueue=[];b.honroState.deferredStory=[];b.honroStory=null;b.honroState.allyQueue=null;b.honroState.pendingEvents=[];
  const archer=C.makeUnit('archer',0,900,900,{id:'diag-archer',loadout:['A01'],focus:10000,maxFocus:10000,hp:50000,maxHp:50000});
  const knight=C.makeUnit('knight',0,1050,900,{id:'diag-knight',loadout:['S00'],focus:10000,maxFocus:10000,hp:50000,maxHp:50000});
  const occultist=C.makeUnit('occultist',0,700,900,{id:'diag-occultist',loadout:['O12'],focus:10000,maxFocus:10000,hp:50000,maxHp:50000});
  const enemy=C.makeUnit('archer',1,5000,900,{id:'diag-enemy',name:'diagnostic enemy',loadout:['A01'],awake:true,fixed:true,hp:50000,maxHp:50000,focus:10000,maxFocus:10000,aggroUntil:999});
  b.units=[archer,knight,occultist,enemy];b.active=archer.id;b.side=0;b.phase='aim';b.round=1;b.turnAge=0;b.resolveAge=0;b.shot=0;b.shotDamage={};b.reviewDamage={};b.reviewFocus=undefined;b.queue=[];b.summonTurn=undefined;e.checkEnd=()=>false;
  HonroStoryFraming.clear(s);Object.assign(s,{x:200,y:780,scale:.6,manual:false,storyFrozen:false,goalFocus:null,focusUntil:0,speakerUntil:0});HonroReinforcementCamera.prime(s,b);a.selected='A01';
  const focus=s.focusUnit.bind(s);s.focusUnit=(...args)=>{const before={manual:s.manual,blocked:HonroReinforcementCamera.blocksFocus(s)};const out=focus(...args);diagCalls.push({at:diagNow,args,before,after:{manual:s.manual,focus:s.focusId}});return out;};
  const fire=e.fire.bind(e);e.fire=(...args)=>{const before={shot:b.shot,actor:b.active,manual:s.manual,blocked:HonroReinforcementCamera.blocksFocus(s)};const out=fire(...args);diagShots.push({at:diagNow,args,accepted:out,before,after:{shot:b.shot,manual:s.manual,phase:b.phase,projectiles:b.projectiles.length,melee:!!e.active?.meleeAction}});return out;};
  return diagSnap();
 };
 window.diagSnap=()=>{const a=HonroApp,e=a.engine,b=e.b,s=a.scene,now=diagNow,blocked=HonroReinforcementCamera.blocksFocus(s),insert=HonroReinforcementCamera.active(s),p=b.projectiles.find(p=>!p.child)||b.projectiles[0];let owner=insert?'reinforcement':blocked?'manual-grace':s.storyFrame?'storyFrame':s.storyTween?'storyTween':s.goalFocus?'goalFocus':s.manual?'manual':s.speakerId&&now<s.speakerUntil?'speaker':p?'projectile':b.phase==='review'&&b.reviewFocus?'review':s.focusId&&now<s.focusUntil?'focus':'active';return{at:now,phase:b.phase,round:b.round,active:b.active,shot:b.shot,camera:{x:s.x,y:s.y,scale:s.scale,manual:s.manual},owner,blocked,insert,focusId:s.focusId,focusUntil:s.focusUntil,speakerId:s.speakerId,speakerUntil:s.speakerUntil,tween:s.storyTween?.kind||null,frame:s.storyFrame?.camera?.id||null,projectiles:b.projectiles.map(p=>({id:p.id,owner:p.owner,shot:p.shot,x:p.x,y:p.y,age:p.age,child:!!p.child})),melee:b.units.filter(u=>u.meleeAction).map(u=>({id:u.id,...u.meleeAction})),summon:b.summonTurn?structuredClone(b.summonTurn):null,hp:Object.fromEntries(b.units.map(u=>[u.id,u.hp])),calls:structuredClone(diagCalls.slice(-6)),shots:structuredClone(diagShots.slice(-4))};};
 window.diagStep=(ms,simulate=true,notices=false)=>{const a=HonroApp,e=a.engine;const n=Math.ceil(ms/(1000/60));for(let i=0;i<n;i++){diagNow+=ms/n;if(simulate){e.tick(ms/n/2000);e.tick(ms/n/2000);}if(notices)HonroStory.turn(a);a.scene.render(e,ms/n/1000,a.selected,.9,false,simulate?ms/n/1000:0,false);}return diagSnap();};
 window.diagReady=(id='diag-archer',skill='A01',angle=35)=>{const a=HonroApp,e=a.engine,b=e.b,u=e.unit(id);b.projectiles=[];b.volley=undefined;b.summonTurn=undefined;b.phase='aim';b.side=0;b.active=id;b.round++;b.turnAge=0;b.resolveAge=0;b.reviewFocus=undefined;b.reviewDamage={};for(const v of b.units){delete v.meleeAction;delete v.aiMove;}Object.assign(u,{acted:false,focus:10000,maxFocus:10000,cooldowns:{},x:id==='diag-knight'?1050:900,y:900,vx:0,vy:0,airborne:false,angle,facing:1});a.selected=skill;a.turnNotice=null;return diagSnap();};
 window.diagFire=()=>{const a=HonroApp;if(!a.beginCharge())throw Error('fixture charge rejected '+JSON.stringify(diagSnap()));a.chargeAt=diagNow-4500;a.releaseCharge();if(!diagShots.at(-1)?.accepted)throw Error('fixture fire failed');return diagSnap();};
}'''
with serve_game() as url,sync_playwright() as p:
 browser=launch(p);rows=[];errors=[]
 for device,size in [('desktop',{'width':1280,'height':800}),('mobile',{'width':390,'height':844})]:
  context=browser.new_context(viewport=size,has_touch=True);page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url+'/HONRO.html');page.wait_for_function('window.HonroApp',timeout=120000);page.evaluate('''()=>{HonroApp.profile=HONRO_TOOLS.fresh();HonroApp.launch(1);}''');page.wait_for_function('HonroApp.engine?.b.honroStage===1&&HonroApp.dialogue',timeout=120000);page.evaluate(INSTALL);page.wait_for_timeout(40)
  def run(js,arg=None):return page.evaluate(js,arg) if arg is not None else page.evaluate(js)
  def setup():return run('diagSetup()')
  def step(ms,simulate=True,notices=False):return run('q=>diagStep(q.ms,q.simulate,q.notices)',{'ms':ms,'simulate':simulate,'notices':notices})
  def wheel():
   x,y=size['width']*.55,size['height']*.42
   if device=='mobile':
    cdp=context.new_cdp_session(page);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
    for i in range(1,6):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+i*11,'y':y+i*5}]})
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});cdp.detach()
   else:
    page.mouse.move(x,y);page.mouse.wheel(0,100)
   page.wait_for_timeout(40);return run('diagSnap()')
  def row(name,states,**extra):
   rows.append({'device':device,'input':'CDP touch drag' if device=='mobile' else 'browser wheel','case':name,'states':states,**extra});print(device,name,[(x['owner'],x['camera']['manual'],len(x['projectiles']))for x in states],flush=True)
  setup();start=run('diagFire()');end=step(400);assert end['projectiles'] and end['camera']['x']!=start['camera']['x'];row('player-no-manual',[start,end])
  setup();manual=wheel();assert manual['camera']['manual'];start=run('diagFire()');end=step(500);assert not start['camera']['manual'] and end['blocked'] and end['camera']['x']==manual['camera']['x'];row('player-pan-before-fire',[manual,start,end]);page.screenshot(path=str(OUT/f'{device}-pan-before-fire.png'))
  setup();run('diagFire()');step(200);manual=wheel();after=step(2100);assert after['camera']['manual'] and not after['blocked'] and after['camera']['x']==manual['camera']['x'];row('player-pan-during-flight-expired',[manual,after])
  ready=run('diagReady()');start=run('diagFire()');after=step(300);assert not after['camera']['manual'] and after['owner']=='projectile';row('next-player-attack-after-grace',[ready,start,after])
  setup();run('diagFire()');step(100);manual=wheel();run('diagReady()');start=run('diagFire()');after=step(300);assert after['blocked'] and after['camera']['x']==manual['camera']['x'];row('next-player-attack-inside-grace',[manual,start,after])
  setup();run("()=>{const b=HonroApp.engine.b,u=HonroApp.engine.unit('diag-enemy');u.x=2400;u.moveLeft=0;b.phase='enemy';b.side=1;b.active=u.id;b.turnAge=2;HonroStory.turn(HonroApp);HonroApp.engine.planningBudget();}");start=run('diagSnap()');after=step(400);assert after['projectiles'] and not after['camera']['manual'];row('ai-no-manual',[start,after])
  # Actual enemy planner, not a fabricated projectile. No new side notice is
  # requested after pan: represents a later actor within an already-noticed side.
  setup();run("()=>{const b=HonroApp.engine.b,u=HonroApp.engine.unit('diag-enemy');u.x=2400;u.moveLeft=0;b.phase='enemy';b.side=1;b.active=u.id;b.turnAge=2;HonroStory.turn(HonroApp);}");manual=wheel();step(2100,False);run('HonroApp.engine.planningBudget()');before=run('diagSnap()');after=step(400);assert any(s['accepted']for s in after['shots']),after;assert after['camera']['manual'];row('ai-next-actor-after-manual',[manual,before,after])
  # Enemy side transition normally resets manual via focusUnit; grace blocks it.
  setup();manual=wheel();notice=run("()=>{const b=HonroApp.engine.b;b.phase='enemy';b.side=1;b.active='diag-enemy';HonroStory.turn(HonroApp);return diagSnap();}");assert notice['camera']['manual'] and notice['calls'][-1]['before']['blocked'];step(2100,False);notice2=run('()=>{HonroStory.turn(HonroApp);return diagSnap();}');assert notice2['camera']['manual'];forced=run('()=>{HonroStory.turn(HonroApp,true);return diagSnap();}');assert not forced['camera']['manual'];row('turn-notice-grace-and-no-retry',[manual,notice,notice2,forced])
  # Melee uses actual S00, removes its root projectile and starts meleeAction.
  setup();run("diagReady('diag-knight','S00',0)");run("HonroApp.engine.unit('diag-enemy').x=1190");start=run('diagFire()');after=step(260);assert start['melee'] and after['hp']['diag-enemy']<start['hp']['diag-enemy'] and not after['camera']['manual'];row('melee-no-manual-real-hit',[start,after])
  setup();run("diagReady('diag-knight','S00',0)");run("HonroApp.engine.unit('diag-enemy').x=1190");manual=wheel();start=run('diagFire()');after=step(260);assert start['melee'] and not start['projectiles'];assert after['hp']['diag-enemy']<start['hp']['diag-enemy'];assert after['blocked'] and after['camera']['x']==manual['camera']['x'];row('melee-after-pan-real-hit',[manual,start,after])
  # Real summon scheduler and real child bolt; it does not increment b.shot.
  setup();start=run("()=>{const e=HonroApp.engine,b=e.b;e.unit('diag-enemy').x=2500;const u=e.spawnSummon(e.unit('diag-occultist'),'lantern',2000,820,1,1);e.runSummonTurn(u.summonOwner);return diagSnap();}");after=step(80);assert after['projectiles'] and not after['camera']['manual'];row('summon-no-manual',[start,after])
  setup();manual=wheel();step(2100,False);start=run("()=>{const e=HonroApp.engine,b=e.b;e.unit('diag-enemy').x=2500;const u=e.spawnSummon(e.unit('diag-occultist'),'lantern',2000,820,1,1);e.runSummonTurn(u.summonOwner);return diagSnap();}");after=step(80);assert after['projectiles'] and after['summon'] and after['shot']==start['shot'] and after['camera']['manual'];row('summon-next-attack-after-manual',[manual,start,after])
  # Actual reinforcement insertion while old manual mode is set, then new
  # player shot during the insert; a second insert extends/replaces the shot.
  setup();wheel();step(2100,False);run("()=>{const a=HonroApp,b=a.engine.b;const u=HONRO_CORE.makeUnit('archer',1,4200,900,{id:'diag-reinforcement',loadout:['A01'],awake:true,fixed:true,hp:10000,maxHp:10000});b.units.push(u);}");insert=step(20,False);assert insert['insert'];step(600,False);run("HonroApp.engine.b.units.push(HONRO_CORE.makeUnit('archer',1,4600,900,{id:'diag-reinforcement2',loadout:['A01'],awake:true,fixed:true,hp:10000,maxHp:10000}))");step(20,False);step(1100,False);run("diagReady('diag-archer','A01',65)");start=run('diagFire()');after=step(900);assert after['projectiles'] and after['camera']['manual'] and not after['insert'];row('reinforcement-restores-old-manual-over-new-attack',[insert,start,after]);page.screenshot(path=str(OUT/f'{device}-insert-return-over-attack.png'))
  # Actual dialogue open/finish makes a 450ms storyRelease restoring its saved
  # manual mode, even when a new shot already set manual=false.
  setup();wheel();step(2100,False);run("()=>{const a=HonroApp;HonroStory.start(a,[a.stage.story[0]],{title:a.stage.name});HonroStory.finish(a);}");release=run('diagSnap()');assert release['tween']=='static';start=run('diagFire()');after=step(600);assert after['projectiles'] and after['camera']['manual'];row('story-release-restores-old-manual-over-new-attack',[release,start,after])
  context.close()
 assert not errors,errors
 (OUT/'browser.json').write_text(json.dumps({'baseline':'9f7a62739c6c7682850d5991792290de64329fb7','fixture':'Committed production web bundle; flat arena, explicit turn prerequisites, deterministic performance clock, real PC wheel / mobile CDP touch drag, manual Engine.tick/Scene.render. Not normal campaign play. No runtime source edits.','rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2));browser.close();print('PASS diagnosis reproduced current behavior, cases',len(rows),'pageErrors 0')
