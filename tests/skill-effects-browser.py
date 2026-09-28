"""Actual shared game scenes: repeat input, contact crescent, preview contrast and timed effects."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'reports/skill-effects';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];measurements={}
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)
SETUP=r'''()=>{
 const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();
 window.effectArena=(id='M15',rank=8)=>{
  a.trainingClass=C.SKILLS[id].cls;a.trainingSkill=id;a.trainingRanks[id]=rank;a.trainingPassives={};a.launch(1,true,id);a.done=false;a.turnNotice=null;a.dialogue=null;
  const e=a.engine,b=e.b,u=e.active;Object.assign(b,{width:2600,height:1500,wind:0,fields:[],waters:[],drafts:[],zones:[],stakes:[],honroMarkers:[],honroSurfaceZones:[],honroLandmarks:[]});
  b.terrain=[{id:'floor',x:0,y:1100,w:2600,h:400,hp:99999,maxHp:99999,mat:'rock'}];b.units=[u];Object.assign(u,{x:400,y:1100,spawnX:400,spawnY:1100,vx:0,vy:0,airborne:false,jumping:false,acted:false,attack:1,ranks:{[C.baseSkill(u.cls)]:1,[id]:rank},loadout:[id],focus:1000,maxFocus:1000,cooldowns:{},angle:35});
  b.phase='aim';b.active=u.id;b.rng=194512;b.sceneVersion++;a.selected=id;Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,x:980,y:960,scale:.9});a.scene.arcFx.fxs=[];
  window.effectEvents=[];const emit=e.onEvent;e.onEvent=ev=>{effectEvents.push(ev);emit(ev);};a.updateHUD(true);
  const foe=(x=760,extra={})=>{const v=C.makeUnit('archer',1,x,1100,{id:'target'+b.units.length,name:'허상',role:'dummy',fixed:true,h:92,hp:20000,maxHp:20000,armor:0,loadout:['LA01'],...extra});b.units.push(v);return v;};return{e,b,u,foe};
 };
 window.prepareEffect=(id)=>{const a=HonroApp,C=HONRO_CORE,{e,b,u,foe}=effectArena(id);const angle=id==='M03'?0:35,power=.65;u.angle=angle;u.lastPower=power;
  if(id==='M03')foe(620);else if(id==='M04'){foe(900);foe(1100);foe(1000,{y:960,spawnY:960});}else foe(1050);
  u.ranks.MP04=8;const prediction=e.predict(u,C.SKILLS[id],angle,power);window.effectPrediction=prediction;a.scene.render(e,0,id,power,false,0);
  return {prediction,angle,power};
 };
 window.resolveToEffect=(id)=>{const a=HonroApp,e=a.engine;const expected=['M04','M05'].includes(id)?'lightningBolt':'skillGeometry';e.fire(id,e.active.angle,.65);for(let i=0;i<1800&&!effectEvents.some(ev=>ev.name===expected);i++)for(const q of [...e.b.projectiles])if(e.b.projectiles.includes(q))e.stepProjectile(q,1/120);const event=effectEvents.find(ev=>ev.name===expected);return event;};
 window.effectFrame=(age)=>{const a=HonroApp;for(const f of a.scene.arcFx.fxs)f.age=age;a.scene.render(a.engine,0,'',.65,false,0);};
}'''
def repeats(page,shell):
    page.evaluate(SETUP)
    for id in ['M15','A99']:
        before=page.evaluate('''id=>{const {b,u}=effectArena(id);if(id==='A99')u.ranks.AP03=8;return b.session;}''',id)
        for i in range(2):
            page.locator('#fire').dispatch_event('pointerdown',{'pointerId':1,'button':0,'isPrimary':True});page.wait_for_timeout(130);page.locator('#fire').dispatch_event('pointerup',{'pointerId':1,'button':0,'isPrimary':True})
            state=page.evaluate('''()=>{const a=HonroApp,e=a.engine,shot=e.b.shot;for(let i=0;i<2400&&e.b.phase!=='aim';i++)e.tick(1/120);a.updateHUD(true);return{shot,phase:e.b.phase,ready:a.canInput(),cooldown:e.cooldownLeft(e.active,a.selected),retreat:!!e.active.retreat,session:e.b.session,rank:e.active.ranks[a.selected]};}''')
            check(shell+f': {id} shot {i+1} re-arms without refresh',state['shot']==i+1 and state['ready'] and state['cooldown']==0 and not state['retreat'] and state['session']==before and state['rank']==8,state)

with sync_playwright() as p:
    browser=launch(p);page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)));page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp');repeats(page,'Game')
    for id in ['M03','M15','M04','M05']:
        plan=page.evaluate('prepareEffect',id)
        if id in ['M03','M15']:page.screenshot(path=str(OUT/f'guide-{id}.png'))
        ev=page.evaluate('resolveToEffect',id);check(f'Game: {id} creates actual effect',bool(ev),ev)
        if id=='M03':check('Game: contact crescent guide matches impact geometry',json.loads(ev['text'])==plan['prediction']['geometry'])
        for age in [.08,.3,.65,.95]:
            page.evaluate('effectFrame',age);page.screenshot(path=str(OUT/f'effect-{id}-{int(age*100):02d}.png'))
    # Distinct preview styling and actual effect appearance on identical transparent canvases.
    contrast=page.evaluate('''()=>{const C=HONRO_CORE,{e,u}=effectArena('M14'),s=C.SKILLS.M14;u.x=360;u.y=340;u.h=80;u.angle=0;u.ranks.MP04=8;const g=e.predict(u,s,0,.05).geometry;
     const cv=document.createElement('canvas');cv.width=720;cv.height=650;const c=cv.getContext('2d'),sum=()=>{const data=c.getImageData(0,0,720,650).data;let n=0;for(let i=3;i<data.length;i+=4)n+=data[i];return n;};C.drawRedesignGuide(c,e,u,s,.05);const preview=sum();c.clearRect(0,0,720,650);C.drawInkGeometry(c,g,.3);const active=sum();return{preview,active,ratio:active/preview};}''')
    check('Preview is substantially fainter than the active ink effect',contrast['ratio']>3,contrast)
    # The real Scene receives 4x simulation dt while the visible effect keeps wall-clock time.
    durations=page.evaluate('''()=>{const C=HONRO_CORE,a=HonroApp,rows=[];for(const speed of [1,4])for(const kind of ['skillGeometry','inkImpact','lightningBolt']){
     const {e,u}=effectArena('M15');a.scene.arcFx.fxs=[];a.scene.event({type:'fx',name:kind,x:900,y:700,x2:900,y2:1100,size:40,text:JSON.stringify(C.skillGeometry(C.SKILLS.M15,8,900,900,0))});const f=a.scene.arcFx.fxs[0];for(let i=0;i<36;i++)a.scene.render(e,1/60,'',.6,false,speed/60);const at600={age:f.age,present:a.scene.arcFx.fxs.includes(f)};const paused=f.age;a.scene.render(e,0,'',.6,false,0);const pausePreserved=f.age===paused;for(let i=0;i<24;i++)a.scene.render(e,1/60,'',.6,false,speed/60);rows.push({kind,speed,life:f.life,at600,expired:!a.scene.arcFx.fxs.includes(f),pausePreserved});}return rows;}''')
    check('Waves and lightning linger past 0.6 s and end within 1 s at both 1x and 4x',all(r['at600']['present'] and abs(r['at600']['age']-.6)<1e-6 and r['expired'] and r['pausePreserved'] for r in durations),durations)
    # The main loop reaches the next real fire without a reset click (not just a direct engine call).
    page.evaluate("{const a=HonroApp;a.trainingClass='mage';a.trainingSkill='M15';a.profile.settings.playerSpeed=4;a.launch(1,true,'M15');a.frame=Object.getPrototypeOf(a).frame;a.prev=performance.now();requestAnimationFrame(t=>a.frame(t));}")
    for i in range(2):
        page.locator('#fire').dispatch_event('pointerdown',{'pointerId':1,'button':0,'isPrimary':True});page.wait_for_timeout(130);page.locator('#fire').dispatch_event('pointerup',{'pointerId':1,'button':0,'isPrimary':True});page.wait_for_function("HonroApp.engine.b.phase==='aim'&&HonroApp.canInput()&&HonroApp.engine.cooldownLeft(HonroApp.engine.active,'M15')===0")
    check('Actual animation loop supports two consecutive capstone casts',page.evaluate('HonroApp.engine.b.shot')==2);page.evaluate('HonroApp.frame=()=>{}')
    page.close()
    editor=browser.new_page(viewport={'width':1440,'height':900});editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI');snapshot=editor.evaluate('HonroWorkshopAPI.exportProject()');editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1];play.on('pageerror',lambda e:errors.append(str(e)));repeats(play,'Workshop')
    for id in ['M03','M15','M05']:
        play.evaluate('prepareEffect',id);ev=play.evaluate('resolveToEffect',id);play.evaluate('effectFrame',.3);check('Workshop: '+id+' uses shared contact/ink/lightning effect',bool(ev));editor.screenshot(path=str(OUT/f'workshop-{id}.png'))
    editor.click('#stopPlay');check('Workshop authored map unchanged',editor.evaluate('HonroWorkshopAPI.exportProject()')==snapshot);browser.close()
check('No browser exceptions',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors,'contrast':contrast,'durations':durations},ensure_ascii=False,indent=2),encoding='utf-8')
