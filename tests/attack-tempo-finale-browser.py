"""Real App attack timing, cooperation/save transitions and ritual visuals in both shells."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/attack-tempo-finale';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)

def suite(page,owner,shell):
    page.evaluate('''()=>{const a=HonroApp;window.nativeFrame=a.frame.bind(a);a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();for(let i=1;i<=10;i++)a.profile.cleared[i]=true;window.dismiss=()=>{let n=100;while(a.dialogue&&n--)HonroStory.finish(a);a.turnNotice=null;};}''')
    for side in ['enemy','ally']:
        data=page.evaluate('''async side=>{const a=HonroApp,C=HONRO_CORE;a.launchMap(HONRO_PROJECT,'stage-1');dismiss();const e=a.engine,b=e.b;
          Object.assign(b,{width:4000,height:2000,terrain:[{id:'floor',x:0,y:1500,w:4000,h:500,mat:'rock',hp:99999,maxHp:99999}],waters:[],drafts:[],fields:[],zones:[],honroEvents:[],honroMarkers:[],honroLandmarks:[],wind:0,turnAge:0});b.sceneVersion++;b.honroState.deferredStory=[];b.honroState.storyQueue=[];
          const u=C.makeUnit('mage',side==='enemy'?1:2,700,1500,{id:'shooter',fixed:true,lastAct:b.round,loadout:['M01'],focus:999,honroAlly:side==='ally',allyRole:'daoist'}),t=C.makeUnit('archer',side==='enemy'?0:1,1450,1500,{id:'target',fixed:true,hp:1000,maxHp:1000});b.units=[u,t];
          if(side==='ally')b.units.push(C.makeUnit('archer',0,200,1500,{id:'hero'}));b.active=u.id;b.side=side==='enemy'?1:0;b.phase=side;e.checkEnd=()=>false;
          if(side==='ally')b.honroState.allyQueue={ids:[u.id],index:0,returnActive:'hero',phase:'act',elapsed:0,started:false,targetId:t.id};
          HonroStory.turn(a,true);const paused=HonroStory.turnPaused(a);a.prev=performance.now();a.acc=0;let probes=0,frames=0,maxFrame=0;const predict=e.predict.bind(e);e.predict=(...args)=>{probes++;return predict(...args);};const realRAF=window.requestAnimationFrame,start=performance.now();
          while(!b.projectiles.length&&frames<12){await new Promise(realRAF);const now=performance.now();window.requestAnimationFrame=()=>0;try{nativeFrame(now);}finally{window.requestAnimationFrame=realRAF;}maxFrame=Math.max(maxFrame,performance.now()-now);frames++;}
          return{paused,frames,ms:performance.now()-start,maxFrame,probes,projectiles:b.projectiles.length,power:u.lastPower,error:a.lastError||null};}''',side)
        check(shell+': '+side+' fires promptly through the native App frame with a nonblocking banner',not data['paused'] and data['frames']<=4 and data['projectiles']>0 and not data['error'],data)
    data=page.evaluate('''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-10');dismiss();const e=a.engine,b=e.b,s=e.unit('boss');b.honroEvents=[];b.honroState.deferredStory=[];b.honroState.receivers=2;for(const m of b.honroMarkers)if(m.action==='receiver')m.collected=true;Object.assign(s,{x:4300,fixed:true,hp:s.maxHp*.4});a.updateHUD(true);return{x:s.x};}''')
    page.locator('[data-action=defend]').click()
    data=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b;let ticks=0;while(!a.dialogue&&ticks++<3000)e.tick(1/120);const s=e.unit('boss');return{dialogue:!!a.dialogue,x:s.x,y:s.y,hp:s.hp,max:s.maxHp,shield:s.shield,name:s.name,guide:a.dialogue?.lines.find(l=>l[0]==='안내')?.[1],sources:b.honroState.finaleSites,wave:b.honroState.finaleWaves[0]};}''')
    check(shell+': ending the actor places mortal Sodan at the central dais and explains the ritual',data['dialogue'] and data['x']==2500 and data['y']==2180 and data['hp']==656 and data['max']==820 and data['shield']==0 and '금빛 혼불' in data['guide'],data)
    data=page.evaluate('''()=>{const a=HonroApp;dismiss();const e=a.engine,b=e.b,s=e.unit('boss');s.hp=200;b.honroState.coopHold=2;window.ritualSave=structuredClone(b);a.mount(structuredClone(ritualSave));dismiss();a.missionTick(0);const after=a.engine.unit('boss');a.updateHUD(true);return{hp:after.hp,max:after.maxHp,x:after.x,hold:a.engine.b.honroState.coopHold,roster:document.getElementById('allied-roster').textContent};}''')
    check(shell+': save/resume retains wounds, position, progress and the Sodan ally label',data['hp']==200 and data['max']==820 and data['x']==2500 and data['hold']==2 and '소단' in data['roster'],data)
    data=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,s=a.engine.unit('boss'),scene=a.scene,c=scene.ctx;Object.assign(scene,{manual:true,x:2550,y:2480,scale:.34,storyTween:null,goalFocus:null,focusId:null});
      const before=JSON.stringify(b),texts=[],curve=c.quadraticCurveTo,text=c.fillText;let curves=0;c.quadraticCurveTo=function(...args){curves++;return curve.apply(this,args);};c.fillText=function(t,...args){texts.push(t);return text.call(this,t,...args);};scene.finaleRitual(c,b);c.quadraticCurveTo=curve;c.fillText=text;
      const times=[];for(let i=0;i<90;i++){const start=performance.now();scene.render(a.engine,1/60,'',.5,false,0);times.push(performance.now()-start);}times.sort((a,b)=>a-b);a.updateHUD(true);
      return{curves,texts,unchanged:before===JSON.stringify(b),p95:times[Math.floor(times.length*.95)],sources:b.honroState.finaleSites,wave:b.honroState.finaleWaves[0].units.map(id=>{const u=a.engine.unit(id);return{source:u.honroSpawnSource,x:u.spawnX,y:u.spawnY,distance:Math.abs(u.spawnX-s.x)};})};}''')
    check(shell+': both halls and receiving stones show a moving ritual without mutating the battle',data['curves']==6 and data['unchanged'] and sum('원혼을 받는 중'==s for s in data['texts'])==2 and sum('들림 출몰' in s for s in data['texts'])==2 and all(u['distance']>450 for u in data['wave']),data)
    owner.screenshot(path=str(OUT/(shell+'-ritual-overview.png')))
    page.evaluate('''()=>{const a=HonroApp,s=a.engine.unit('boss');Object.assign(a.scene,{x:s.x,y:s.y-110,scale:.9,manual:true});a.scene.render(a.engine,0,'',.5,false,0);}''')
    owner.screenshot(path=str(OUT/(shell+'-ritual-detail.png')))

with sync_playwright() as p:
    browser=launch(p)
    for shell in ['Game','Workshop']:
        owner=browser.new_page(viewport={'width':1440,'height':900});owner.on('pageerror',lambda e:errors.append(str(e)))
        owner.goto((ROOT/('HONRO.html' if shell=='Game' else 'HONRO_WORKSHOP.html')).as_uri())
        if shell=='Workshop':
            owner.click('[data-tab=play]');owner.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');page=owner.frames[1]
        else:page=owner
        suite(page,owner,shell);owner.close()
    browser.close()
check('No uncaught browser errors',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
