"""Built Chromium + production App fixtures, not a normal campaign clear."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch,serve_game,ROOT
OUT=ROOT/'_local/reports/combat-damage/browser';OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,ok,data=None):
 assert ok,(name,data)
 checks.append({'name':name,'data':data});print('PASS',name,flush=True)
with sync_playwright() as pw,serve_game() as url:
 browser=launch(pw);p=browser.new_page(viewport={'width':1280,'height':800});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp')
 before=p.evaluate('''async()=>{const a=HonroApp,C=HONRO_CORE;await HonroCampaignLoader.ensureStage(1);a.profile.settings.sound=false;a.profile.settings.music=false;a.launch(1);for(let i=0;a.dialogue&&i<80;i++)HonroStory.finish(a);const e=a.engine,b=e.b,u=b.units.find(v=>v.side===0&&v.cls==='archer');b.active=u.id;b.side=0;b.phase='aim';u.acted=false;a.modal.classList.add('open');const ally=C.makeUnit('knight',2,u.x+160,u.y,{id:'damage-browser-ally',honroAlly:true,fixed:true,hp:500,maxHp:500,armor:.2,shield:10});b.units.push(ally);u.critChance=0;const rng=b.rng,index=b.damageSequence.index,pred=e.predict(u,C.SKILLS.A01,15,.6);if(b.rng!==rng||b.damageSequence.index!==index)throw Error('prediction consumed RNG');if(!e.fire('A01',15,.6))throw Error('actual engine fire rejected');const shot=b.projectiles[0];a.profile.honroBattle=structuredClone(b);a.persist();return {sequence:structuredClone(b.damageSequence),roll:shot.damageRoll,attackSide:shot.attackSide,shot:shot.shot,focus:u.focus,shots:b.shots,active:b.active,profile:JSON.stringify([a.profile.heroes,a.profile.loadouts,a.profile.cleared])};}''')
 check('actual mounted Engine.fire consumes one buffered value and freezes firing coalition',before['sequence']['index']==1 and before['attackSide']==0,before)
 p.reload();p.wait_for_function('window.HonroApp')
 resumed=p.evaluate('''()=>{const a=HonroApp;a.continue();a.modal.classList.add('open');const b=a.engine.b,shot=b.projectiles[0];return{sequence:b.damageSequence,roll:shot.damageRoll,attackSide:shot.attackSide,shot:shot.shot,focus:a.engine.active.focus,shots:b.shots,active:b.active,profile:JSON.stringify([a.profile.heroes,a.profile.loadouts,a.profile.cleared])}}''')
 check('real localStorage reload/Continue preserves pending roll/index/action/resource/reward profile',before==resumed,{'before':before,'after':resumed})
 result=p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,shot=b.projectiles[0],ally=e.unit('damage-browser-ally'),control=new C.Engine(structuredClone(b)),ct=control.unit(ally.id);control.random=e.random=()=>.99;control.friendlyFireMultiplier=()=>1;const sh=ct.shield,hp=ct.hp;control.hurt(ct,shot.damage,shot.owner,true,shot,{x:ally.x,y:ally.y-ally.h*.5});const baseline=hp-ct.hp+sh-ct.shield,oldhp=ally.hp,oldsh=ally.shield; e.hurt(ally,shot.damage,shot.owner,true,shot,{x:ally.x,y:ally.y-ally.h*.5});const loss=oldhp-ally.hp+oldsh-ally.shield; a.modal.classList.remove('open');a.screen='battle';a.updateHUD(true);return{baseline,loss,ratio:loss/baseline,index:b.damageSequence.index,roll:shot.damageRoll,report:b.honroReport.other.friendly,hp:ally.hp,shield:ally.shield}}''')
 check('built actual ally HP+shield and report agree with single final 30%',abs(result['ratio']-.3)<1e-8 and result['index']==1 and abs(result['report']['damage']+result['report']['shield']-result['loss'])<1e-8,result)
 p.screenshot(path=str(OUT/'continued-attack.png'))
 # Visible skill detail is covered by native clicks in visible-skill-damage-variance-browser.py.
 check('production skill icon markup still has no SVG fallback',p.evaluate("!HONRO_CORE.icon('skill:A01').includes('<svg')"))
 p.goto(url+'/HONRO_WORKSHOP.html');p.wait_for_function('window.HonroWorkshopAPI')
 check('built Workshop basic entry',p.evaluate('!!window.HonroWorkshopAPI'))
 check('no Chromium page errors',not errors,errors);browser.close()
(OUT/'checks.json').write_text(json.dumps({'checks':checks,'errors':errors,'limits':['Production App/Engine with an explicit allied target fixture; not a campaign clear or physical device test.']},ensure_ascii=False,indent=2))
