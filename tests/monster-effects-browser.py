"""Focused browser/mobile A1 fixtures: native renderer, AI and engine inputs.
Actor placement/isolation and prior-stage profile are explicit fixtures, not fullplay.
Run only against an integrated build containing enemyEffects + combat-status signals.
"""
import json, os
from contextlib import nullcontext
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game
OUT=ROOT/'_local/reports/monster-effects-browser';OUT.mkdir(parents=True,exist_ok=True)
SETUP=r'''({stage,offset})=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.close();a.frame=()=>{};a.cancelInput();a.turnNotice=null;
const e=a.engine,b=e.b,id=stage===5?'s5-cave-shade':'s8-15',u=e.unit('p-archer'),k=e.unit(id),x=k.x+offset,s=e.contactSurface(x,k.y-100,k.y+100);if(!s)throw Error('Fixture has no support');
Object.assign(u,{x,y:s.y,vx:0,vy:0,acted:false,shield:0});b.units=b.units.filter(v=>v.side===0||v.honroObjectiveTarget||v.id===id);k.awake=true;k.aggroUntil=999;Object.assign(b,{active:id,queue:[id],side:1,phase:'enemy'});k.acted=false;k.lastAct=b.round;e.refreshActivation();
const tick=(until,max=2400)=>{for(let n=0;n<max&&!until();n++)e.tick(HONRO_CORE.STEP);if(!until())throw Error('Bounded progression failed')};e.enemyAction();tick(()=>!!k.enemyEffectCast);tick(()=>b.side===0&&b.phase==='aim');if(!e.select(u.id))throw Error('Cannot select target');
window.monsterBrowser={stage,id,offset,startX:u.x,startHP:u.hp};a.scene.storyTween=a.scene.goalFocus=a.scene.cinematic=null;a.scene.focusId=null;a.scene.focusUntil=a.scene.speakerUntil=0;a.scene.x=(u.x+k.x)/2;a.scene.y=u.y-130;a.scene.scale=innerWidth<600?.8:1.15;a.scene.manual=true;document.querySelector('#turn-banner').hidden=true;a.updateHUD(true);a.scene.render(e,0,a.selected,a.power,false,0,true);
return {revision:b.honroMonsterEffectsRevision,cast:JSON.parse(JSON.stringify(k.enemyEffectCast)),supported:HONRO_CORE.validTerrainContactPose(b.terrain,u),actors:b.units.map(v=>v.id)};}'''
RESPOND=r'''kind=>{const a=HonroApp,e=a.engine,b=e.b,q=monsterBrowser,u=e.unit('p-archer'),k=e.unit(q.id),c=k.enemyEffectCast;
const tick=(until,max=2400)=>{for(let n=0;n<max&&!until();n++)e.tick(HONRO_CORE.STEP);if(!until())throw Error('Bounded response failed')};
if(kind==='dodge'){e.move(q.offset<0?-1:1,.5);if(Math.abs(u.x-c.impact.x)<=c.radius+u.r)throw Error('Did not leave announced circle');}
if(!e.fire('A01',q.offset<0?170:10,.1))throw Error('Basic fire unavailable');tick(()=>u.acted);
for(let n=0;n<10&&b.side===0;n++){if(e.canAct())e.wait();tick(()=>b.side!==0||b.phase==='aim');}
tick(()=>!!u.enemySoftBind||!!u.enemyPush||!k.enemyEffectCast);a.updateHUD(true);a.scene.render(e,0,a.selected,a.power,false,0,true);
return {hp:u.hp,startHP:q.startHP,x:u.x,startX:q.startX,bind:!!u.enemySoftBind,push:!!u.enemyPush,cast:!!k.enemyEffectCast,actors:b.units.map(v=>v.id)};}'''
rows=[]
with sync_playwright() as pw, (nullcontext(os.environ['HONRO_MONSTER_BASE_URL']) if os.environ.get('HONRO_MONSTER_BASE_URL') else serve_game()) as url:
 browser=launch(pw)
 for mobile in [False,True]:
  context=browser.new_context(viewport={'width':390,'height':844} if mobile else {'width':1440,'height':900},is_mobile=mobile,has_touch=mobile,accept_downloads=True)
  p=context.new_page();errors=[];p.on('pageerror',lambda error:errors.append(str(error)))
  p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=45000)
  for stage,offset,kind in [(5,-160,'hit'),(5,-160,'dodge'),(8,-100,'hit')]:
   name=f"{'mobile' if mobile else 'desktop'}-{stage}-{kind}"
   p.evaluate('''stage=>{const a=HonroApp;a.close();a.stopBattle();const p=HONRO_TOOLS.fresh();for(let n=1;n<stage;n++)p.cleared[n]={visits:1,rounds:5};p.recruited=stage>=6?['archer','mage','knight']:['archer','mage'];p.party=[...p.recruited];p.settings.sound=p.settings.music=false;for(const cls of p.party)p.heroes[cls].xp=HONRO_CORE.xpAtLevel(16);a.profile=a.normalProfile=p;a.launch(stage);}''',stage)
   p.wait_for_function('(stage)=>HonroApp.engine?.b.honroStage===stage',arg=stage,timeout=45000)
   setup=p.evaluate(SETUP,{'stage':stage,'offset':offset});assert setup['revision']==1 and setup['supported'];assert setup['cast']['seen'] and setup['cast']['offered'],setup
   p.screenshot(path=str(OUT/(name+'-warning.png')))
   before=p.evaluate('JSON.stringify(HonroApp.engine.b)');p.evaluate('HonroApp.pause()');p.locator('[data-action="close"]').last.click();assert p.evaluate('JSON.stringify(HonroApp.engine.b)')==before,'Pause/close must not spend response'
   # The real renderer offers an offscreen sign without resetting the warning.
   offscreen=p.evaluate('''()=>{const a=HonroApp,e=a.engine,k=e.unit(monsterBrowser.id),before=JSON.stringify(k.enemyEffectCast),x=a.scene.x;a.scene.x=0;a.scene.render(e,0,a.selected,a.power,false,0,true);const same=JSON.stringify(k.enemyEffectCast)===before;a.scene.x=x;return same;}''');assert offscreen
   result=p.evaluate(RESPOND,kind);assert result['actors']==setup['actors']
   if kind=='hit':assert result['hp']<result['startHP'] and (result['bind'] if stage==5 else result['push']),result
   else:assert result['hp']==result['startHP'] and not result['bind'] and not result['push'],result
   p.screenshot(path=str(OUT/(name+'-resolved.png')))
   # Actual download then normal App Continue (no install of fabricated effect state).
   with p.expect_download() as downloaded:p.evaluate('HonroApp.export()')
   download=downloaded.value;savepath=OUT/(name+'-export.json');download.save_as(str(savepath))
   continued=p.evaluate('''()=>{const a=HonroApp,before=JSON.stringify(a.engine.b);a.continue();return {exact:before===JSON.stringify(a.engine.b),revision:a.engine.b.honroMonsterEffectsRevision};}''');assert continued=={'exact':True,'revision':1},continued
   p.evaluate('''()=>{const a=HonroApp,u=a.engine.unit('p-archer');a.scene.x=u.x;a.scene.y=u.y-130;a.scene.scale=innerWidth<600?.8:1.15;a.scene.manual=true;a.updateHUD(true);a.scene.render(a.engine,0,a.selected,a.power,false,0,true);}''')
   if mobile:
    p.set_viewport_size({'width':844,'height':390});p.evaluate('HonroApp.scene.render(HonroApp.engine,0,HonroApp.selected,HonroApp.power,false,0,true)');p.screenshot(path=str(OUT/(name+'-landscape.png')));p.set_viewport_size({'width':390,'height':844})
   rows.append({'case':name,'setup':setup,'result':result,'continue':continued,'offscreenAcknowledgementStable':offscreen,'pauseExact':True})
  assert not errors,errors;context.close()
 browser.close()
(OUT/'summary.json').write_text(json.dumps({'status':'passed','scope':'Prepared canonical encounter/profile fixtures; browser renderer, public engine fire/move/wait, export and Continue. Not chapter completion, pointer shooting, or human play approval.','rows':rows},ensure_ascii=False,indent=2))
print('PASS monster browser/mobile focused fixtures',OUT)
