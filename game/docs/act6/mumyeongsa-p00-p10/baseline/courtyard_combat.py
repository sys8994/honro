"""Play the opening of the native courtyard and measure both active fronts."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import seeded_context, storage_hash
from exterior_combat import TRACE
from hall_passage import actor, march, select
from legacy54_live import resume
from native_b import aim, wall_trace
from relay_live_chain import boundary_of, cold_new
from second_pass import sample_walk, touch

K=7800/2172

FORECAST="""goal=>{
 const e=HonroApp.engine,u=e.active,t=goal.actor&&e.unit(goal.actor);
 for(const id of goal.skills){
  const s=HONRO_CORE.SKILLS[id];if(!u.loadout.includes(id))continue;
  const [left,right]=u.facing>0?[-83,88]:[92,265];
  for(const power of [.57,.71,.84,.96,.44,.36,.28,.2])for(let angle=left;angle<=right;angle+=1){
   if(!e.canAfford(s,u,power+.028))continue;
   const match=q=>t?q.unit===t.id:q.terrain===goal.surface&&Math.hypot(q.x-goal.x,q.y-goal.y)<goal.radius;
   const stable=[-.65,0,.65].every(da=>[.003,.021].every(dp=>match(e.predict(u,s,angle+da,power+dp,t??undefined,true))));
   if(stable)return {id,angle,power};
  }
 }
 if(t&&u.cls==='knight'){
  const dx=t.x-u.x,dy=t.y-t.h*.55-(u.y-u.h*.55),s=HONRO_CORE.SKILLS.S03;
  let angle=Math.atan2(-dy,dx)*180/Math.PI;if(angle<-90)angle+=360;
  if(u.loadout.includes(s.id)&&Math.hypot(dx,dy)<=s.radius*1.10+t.r&&e.canAfford(s,u,.95))
    return {id:s.id,angle,power:.95};
 }
 return null;
}"""

def shot(page,goal):
    u=actor(page)
    x=goal.get('x') or page.evaluate('id=>HonroApp.engine.unit(id)?.x',goal.get('actor'))
    if x is None:
        return None
    direction=1 if x>u['x'] else -1
    if page.evaluate('HonroApp.engine.active.facing')!=direction:
        sample_walk(page,direction,u['x']+direction*16,500)
    spec=page.evaluate(FORECAST,goal)
    if not spec:
        return None
    page.locator(f'[data-action="combat-skill"][data-skill="{spec["id"]}"]').first.click(timeout=5500)
    aim(page,spec)
    return spec

def anchor_shot(page,cls,positions,goal,clear_skills,action):
    action['stances']=[]
    for x in positions:
        u=march(page,x,cls=cls,tolerance=40)
        action['stances'].append([u['x'],u['y'],u['contact']])
        spec=shot(page,goal)
        if spec:
            return spec
    nearby=page.evaluate("""() => {const e=HonroApp.engine,u=e.active;
      const dist=v=>Math.hypot(v.x-u.x,v.y-u.y);
      return e.combatEnemies().filter(v=>dist(v)<580).sort((a,c)=>dist(a)-dist(c)).map(x=>x.id);}""")
    for name in nearby[:3]:
        spec=shot(page,{'skills':clear_skills,'actor':name})
        if spec:
            action['clearLane']=name
            return spec
    return None

def finish59(browser,page,args,q):
    wall_trace(page)
    q['actions']=[]
    for _ in range(args.rounds*4):
        base.dismiss_dialogue(page)
        page.wait_for_function('HonroApp.canInput() || HonroApp.done',timeout=52000)
        if page.evaluate('HonroApp.done'):
            break
        u=actor(page)
        result=page.evaluate("""()=>{const e=HonroApp.engine,b=e.b;
          return {round:b.round, progress:{...b.honroState.localFinaleProgress},
           bell:e.unit('qa-bell-shade')?.hp??null,threat:e.unit('qa-immediate-bridge-threat')?.x};}""")
        p=result['progress'];act={'round':result['round'],'actor':u['id'],'before':p}
        q['actions'].append(act)
        if result['round']>args.rounds:
            break
        if u['cls']=='archer' and not p.get('cliff'):
            goal={'skills':['A01'],'surface':'finale-cutout-west-terrace','x':522*K,'y':1871.8947026324342,'radius':32}
            act['shot']=anchor_shot(page,'archer',(1645,1775,1960),goal,['A02','A01'],act)
        elif u['cls']=='archer' and not p.get('approachesSecured'):
            act['westHold']=march(page,1810,cls='archer',tolerance=44)
        elif u['cls']=='mage' and not p.get('mage'):
            goal={'skills':['M01'],'surface':'finale-cutout-near-body','x':1710*K,'y':2291.3294746996403,'radius':28}
            act['shot']=anchor_shot(page,'mage',(5900,6052,6255),goal,['M01','M07'],act)
        elif u['cls']=='knight' and not p.get('bridge'):
            act['guard']=march(page,958*K,cls='knight',tolerance=54)
        elif u['cls']=='knight' and p.get('giant') and not p.get('forepaw'):
            if getattr(args,'forepaw','guard')=='guard':
                act['forepawGuard']=march(page,958*K,cls='knight',tolerance=52)
                if not (getattr(args,'touch',False) and page.locator('button[data-action="defend"]:visible').first.is_visible()):
                    page.keyboard.press('f')
                else:
                    page.locator('button[data-action="defend"]:visible').first.tap(timeout=6500)
                continue
            giant=p['giant']['id']
            target=page.evaluate('id=>HonroApp.engine.unit(id)?.x',giant)
            if target:
                act['forepawApproach']=march(page,target-100,cls='knight',tolerance=33)
                act['shot']=shot(page,{'skills':['S03','S00'],'actor':giant})
        elif u['cls']=='knight' and p.get('activated'):
            target=result['threat']
            march(page,target-105,cls='knight',tolerance=42)
            if abs(actor(page)['x']-target)<182:
                act['shot']=shot(page,{'skills':['S03','S00'],'actor':'qa-immediate-bridge-threat'})
        elif u['cls']=='occultist' and p.get('bell') and not p.get('soul') and not p.get('soulPending'):
            march(page,1490*K,cls='occultist',tolerance=38)
            b=page.locator('[data-act6-mission="markSoulPath"]')
            if b.is_visible():
                b.click(timeout=5000)
                act['interaction']='markSoulPath'
        elif u['cls']=='occultist' and result['bell'] and not p.get('bell'):
            march(page,5390,cls='occultist',tolerance=45)
            act['shot']=shot(page,{'skills':['O06','O04','O01'],'actor':'qa-bell-shade'})
        elif u['cls']=='occultist' and all(p.get(k) for k in ('bridge','bell','soul','cliff','mage')) and not p.get('activated'):
            if p.get('approachesSecured') is False or (p.get('giant') and not p.get('forepaw')):
                act['eastHold']=march(page,1490*K,cls='occultist',tolerance=46)
            else:
                march(page,1755*K,cls='occultist',tolerance=37)
                page.locator('[data-act6-mission="activateGarmjin"]').click(timeout=6000)
                act['interaction']='activateGarmjin'
        if not act.get('shot') and not page.evaluate('HonroApp.done'):
            page.keyboard.press('f')
        page.wait_for_timeout(200)
        if len(q['actions'])%8==0:
            print('round',result['round'],'steps',len(q['actions']),p,flush=True)
    q['finalCourtyard']=page.evaluate("""()=>{const e=HonroApp.engine,b=e.b;
      return {phase:b.phase,round:b.round,waves:b.honroState.localFinaleEdgeWave,progress:b.honroState.localFinaleProgress,
       threat:e.unit('qa-immediate-bridge-threat')?.hp};}""")
    q['precisionShots']=page.evaluate('window.nativeWall??[]')
    assert q['finalCourtyard']['phase']=='won',q['finalCourtyard']['progress']
    page.screenshot(path=args.out/'courtyard-seal-won.png')
    page.locator('[data-act6-qa-next="60"]').click(timeout=6500)
    page.wait_for_function('HonroApp.engine?.b?.honroStage===60',timeout=12000)
    records=base.saved_bytes(page)
    q['new60']=cold_new(browser,records,60)
    q['seal60']=boundary_of(records)

def touch_move(page,context,target):
    here=actor(page)['x']
    if abs(target-here)<20:
        return
    direction=1 if target>here else -1
    session=context.new_cdp_session(page)
    box=page.locator('#joystick').bounding_box()
    assert box
    x,y=box['x']+box['width']/2,box['y']+box['height']/2
    touch(page,session,x,y,'touchStart')
    try:
        touch(page,session,x+35*direction,y,'touchMove')
        page.wait_for_function('([x,d])=>(HonroApp.engine.active.x-x)*d>=0',arg=[target,direction],timeout=5300)
    finally:
        touch(page,session,x+35*direction,y,'touchEnd')

def touch_to_guard(page,context,target=3185):
    card=page.locator('[data-action="select-hero"][data-id="p-knight"]:visible').first
    card.tap(timeout=6500)
    touch_move(page,context,target)

def expose(page,context,mobile,state):
    u=actor(page)
    targets={'knight':3900,'mage':6150,'occultist':5700,'archer':1890}
    target=targets[u['cls']]
    if abs(u['x']-target)>85 and u['move']>120 and u['grounded']:
        boundary=u['x']+max(-780,min(780,target-u['x']))
        try:
            if mobile:
                touch_move(page,context,boundary)
            else:
                sample_walk(page,1 if boundary>u['x'] else -1,boundary,3300)
        except Error:
            state['movementStopped']=True
    state['exposedPose']=actor(page)
    before=page.evaluate('HonroApp.engine.b.shot')
    if mobile:
        fire=page.locator('#fire')
        if fire.is_enabled():
            fire.tap(timeout=3500)
    else:
        page.keyboard.press('Space')
    page.wait_for_timeout(450)
    if before==page.evaluate('HonroApp.engine.b.shot') and page.evaluate('HonroApp.canInput()'):
        state['noRelease']=True
        if mobile:
            page.locator('button[data-action="defend"]:visible').first.tap(timeout=6500)
        else:
            page.keyboard.press('f')

def fight(browser,args,mobile):
    c=seeded_context(browser,59,mobile=mobile)
    page=c.new_page()
    q={'status':'FAIL','interface':'touch' if mobile else 'keyboard','route':f'finish-{args.forepaw}' if args.finish else 'advance' if args.advance else 'defend','errors':[],'turns':[]}
    page.on('pageerror',lambda e:q['errors'].append(str(e)))
    try:
        resume(page,59,True,mobile=mobile)
        q['initialStorageHash']=storage_hash(base.saved_bytes(page))
        page.evaluate(TRACE)
        if mobile:
            touch_to_guard(page,c)
        else:
            select(page,'knight')
            march(page,3225,cls='knight',tolerance=24)
        page.wait_for_function('HonroApp.engine.b.honroState.localReturnGuardAftermath',timeout=4500)
        if args.check_defend:
            if mobile:
                touch_to_guard(page,c,3425)
            else:
                march(page,3440,cls='knight',tolerance=32)
            q['guardPose']=actor(page)
        if args.finish:
            finish59(browser,page,args,q)
            q['status']='PASS'
            return q
        for i in range(args.rounds*4):
            base.dismiss_dialogue(page)
            page.wait_for_function('HonroApp.canInput() || HonroApp.done',timeout=45000)
            state=page.evaluate("""()=>{const {engine:e,done}=HonroApp,b=e.b;
                return {done,round:b.round,phase:b.phase,active:e.active?.id,fronts:b.honroState.localFinaleProgress?.fronts,
                  bridgeDefended:b.honroState.localFinaleProgress?.bridge??false,
                  alive:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length};}""")
            q['turns'].append(state)
            if state['done'] or state['round']>args.rounds:
                break
            if args.advance:
                expose(page,c,mobile,state)
            elif mobile:
                page.locator('button[data-action="defend"]:visible').first.tap(timeout=6500)
            else:
                page.keyboard.press('f')
            page.wait_for_timeout(180)
        q['roundsReached']=q['turns'][-1]['round']
        q['ledger']=page.evaluate('HonroApp.engine.b.honroState.localFinaleEdgeWave')
        assert q['ledger'] and not q['errors']
        if args.check_defend:
            assert any(step['bridgeDefended'] for step in q['turns']),q['turns'][-1]
        q['status']='OBSERVED'
    except (AssertionError,Error) as err:
        q['error']=str(err)[:2500]
    finally:
        q['trace']=page.evaluate('window.a6Exterior??null')
        if q['trace']:
            frames=q['trace'].pop('frames')
            q['frameP95HostMs']=sorted(frames)[int(.95*(len(frames)-1))] if frames else None
        if page.evaluate('!!HonroApp.engine'):
            q['last']=page.evaluate(base.SNAPSHOT)
        page.screenshot(path=args.out/f'court-{q["interface"]}.png')
        c.close()
    return q

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--build',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--rounds',type=int,default=5)
    p.add_argument('--touch',action='store_true')
    p.add_argument('--finish',action='store_true')
    p.add_argument('--forepaw',choices=['guard','strike'],default='guard')
    p.add_argument('--check-defend',action='store_true')
    p.add_argument('--advance',action='store_true')
    args=p.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        with pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']) as browser:
            r=fight(browser,args,args.touch)
    (args.out/'court.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
    print(r['status'],r.get('error','')[:240])

if __name__=='__main__':
    main()
