"""Focused regressions: a maintained stage-5 ritual and M09 slope arrivals."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT = ROOT / '_local/reports/interaction-hold-gate'
OUT.mkdir(parents=True, exist_ok=True)
checks, errors = [], []

def check(name, ok, detail):
    assert ok, (name, detail)
    checks.append({'name': name, 'detail': detail})
    print('PASS', name, flush=True)

def suite(page, shell):
    page.evaluate(r'''()=>{
      const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();
      window.dismiss=()=>{let n=100;while(a.dialogue&&n--)HonroStory.finish(a);a.turnNotice=null;};
      a.launchMap(HONRO_PROJECT,'stage-5');dismiss();
      const e=a.engine,b=e.b,u=e.heroesAlive().find(u=>u.cls==='mage'),m=b.honroMarkers.find(m=>m.action==='ritual');
      Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,airborne:false,jumping:false,acted:false,loadout:['M01'],focus:1000,maxFocus:1000});
      b.active=u.id;b.phase='aim';a.selected='M01';a.selectedByUnit[u.id]='M01';a.updateHUD(true);
    }''')
    page.locator('#battlecanvas').focus()
    page.locator('#battlecanvas').press('e')
    hold = page.evaluate(r'''()=>{
      const a=HonroApp,e=a.engine,b=e.b,u=e.heroesAlive().find(u=>u.cls==='mage'),m=b.honroMarkers.find(m=>m.action==='ritual');
      dismiss();const started=!!b.honroState.ritual?.active;
      e.impulse(u,20,-15);a.missionTick(0);const beforeMoving=b.honroState.ritual.active;
      for(let i=0;i<120;i++){e.integrateBody(u,1/120);a.missionTick(1/120);}
      const afterHit=b.honroState.ritual.active;
      // Suppress enemy attacks only; exercise normal actor/team/round transitions.
      for(const v of e.alive(1))v.stun=99;
      let ticks=0;for(;ticks<5000&&b.round<3;ticks++){dismiss();if(e.canAct())e.wait();e.tick(1/120);a.missionTick(1/120);}
      dismiss();b.active=u.id;a.updateHUD(true);
      const held=b.honroState.ritual.active,button=document.getElementById('context-interact');
      const noRepeatKey=!button.querySelector('.keycap'),label=HonroObjectives.state(b,a.stage).allTargets.find(t=>t.id===m.id)?.label;
      const saved=structuredClone(b);a.mount(saved);dismiss();a.updateHUD(true);
      const restored=a.engine.b.honroState.ritual.active,fired=a.engine.fire('M01',145,.65);
      return{started,beforeMoving,afterHit,round:b.round,ticks,held,noRepeatKey,label,restored,fired};
    }''')
    check(shell+': one E survives a hit, two real round transitions, reload and an attack',
          all(hold[k] for k in ['started','beforeMoving','afterHit','held','noRepeatKey','restored','fired']) and hold['round']==3 and '유지 중' in hold['label'], hold)
    leave = page.evaluate(r'''()=>{
      const a=HonroApp,e=a.engine,b=e.b,u=e.heroesAlive().find(u=>u.cls==='mage'),m=b.honroMarkers.find(m=>m.action==='ritual');
      u.x=m.x+126;a.missionTick(0);const closed=!b.honroState.ritual.active&&!b.terrain.find(t=>t.id==='waterfall-veil').broken;
      Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,airborne:false,jumping:false,acted:false});b.projectiles=[];b.phase='aim';b.active=u.id;dismiss();
      a.missionTick(0);const staysOff=!b.honroState.ritual.active;
      let repeats=0;const say=a.sayLines.bind(a);a.sayLines=(lines,...rest)=>{repeats+=lines.length;return say(lines,...rest);};
      const used=HonroInteractions.use(a,m);a.sayLines=say;return{closed,staysOff,used,repeats};
    }''')
    check(shell+': leaving closes the veil; restarting does not repeat dialogue', all(leave[k] for k in ['closed','staysOff','used']) and leave['repeats']==0, leave)
    gate = page.evaluate(r'''()=>{
      const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-5');dismiss();const e=a.engine,b=e.b,u=e.heroesAlive().find(u=>u.cls==='mage');
      const m=b.honroMarkers.find(m=>m.action==='ritual'),home=e.surface(2100,2000,b.height);
      Object.assign(u,{x:2100,y:home.y,vx:0,vy:0,airborne:false,jumping:false,acted:false,ranks:{...u.ranks,M09:1},loadout:['M09'],focus:1000,maxFocus:1000});
      b.active=u.id;b.phase='aim';b.side=0;
      // Real cast/impact on the authored receiver slope: no alternative flat arena.
      const fired=e.fire('M09',130,.5),p=b.projectiles[0],floor=e.surface(m.x,m.y-4,m.y+5);
      e.impact(p,{x:m.x,y:floor.y,n:{x:0,y:-1},terrain:floor.t,t:0});
      b.phase='aim';u.acted=false;dismiss();a.updateHUD(true);
      window.gateHome={x:u.x,y:u.y};window.gateTarget={x:m.x,y:floor.y};
      return{fired,count:b.stakes.length,from:!!e.gateCandidate(),slope:HONRO_CORE.terrainSlopeAt(floor.t,m.x,floor.y)};
    }''')
    page.locator('#battlecanvas').focus()
    page.locator('#battlecanvas').press('e')
    arrival = page.evaluate(r'''()=>{const e=HonroApp.engine,u=e.active;return{distance:Math.hypot(u.x-gateTarget.x,u.y-gateTarget.y),grounded:e.grounded(u),again:e.useGate(),x:u.x,y:u.y};}''')
    check(shell+': E traverses an M09 pair onto the actual stage-5 slope', gate['fired'] and gate['count']==2 and gate['from'] and arrival['distance']<1 and arrival['grounded'] and not arrival['again'], {'cast':gate,'arrival':arrival})
    restored = page.evaluate(r'''()=>{const a=HonroApp;a.mount(structuredClone(a.engine.b));dismiss();const e=a.engine;const sameTurn=e.useGate();e.b.round++;a.updateHUD(true);return{sameTurn,candidate:!!e.gateCandidate(),button:document.querySelector('#context-interact button')?.dataset.contextInteract};}''')
    page.locator('#battlecanvas').focus()
    page.locator('#battlecanvas').press('e')
    back = page.evaluate('Math.hypot(HonroApp.engine.active.x-gateHome.x,HonroApp.engine.active.y-gateHome.y)')
    check(shell+': reload preserves the once-per-turn lock; next-turn E returns', not restored['sameTurn'] and restored['candidate'] and restored['button'].startswith('skillGate-') and back<1, {'saved':restored,'distance':back})
    blocked = page.evaluate(r'''()=>{
      const e=HonroApp.engine,b=e.b,u=e.active;b.round++;
      const to=b.stakes.find(s=>Math.abs(s.x-gateTarget.x)<1),wall={id:'gate-test-wall',x:to.x-130,y:to.y-200,w:260,h:400,mat:'rock',hp:99999,maxHp:99999};
      b.terrain.push(wall);b.sceneVersion++;const x=u.x,y=u.y,blocked=!e.useGate()&&u.x===x&&u.y===y;
      wall.broken=true;b.sceneVersion++;const retry=e.useGate();
      b.round=Math.max(...b.stakes.map(s=>s.expires));const expired=!e.gateCandidate()&&!e.useGate();return{blocked,retry,expired};
    }''')
    check(shell+': solid obstruction rejects arrival without consuming use; expired gates reject E', all(blocked.values()), blocked)

with sync_playwright() as p:
    browser=launch(p)
    for shell,filename in [('Game','HONRO.html'),('Workshop','HONRO_WORKSHOP.html')]:
        host=browser.new_page(viewport={'width':1440,'height':900})
        host.on('pageerror',lambda e:errors.append(str(e)))
        host.goto((ROOT/filename).as_uri())
        if shell=='Game':
            host.wait_for_function('window.HonroApp');page=host
        else:
            host.wait_for_function('window.HonroWorkshopAPI');host.click('[data-tab=play]')
            host.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');page=host.frames[1]
        suite(page,shell);host.close()
    browser.close()
check('No browser exceptions',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
