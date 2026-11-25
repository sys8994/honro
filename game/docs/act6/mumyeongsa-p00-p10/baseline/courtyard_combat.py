"""Play the opening of the native courtyard and measure both active fronts."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import seeded_context
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
            march(page,1645,cls='archer',tolerance=36)
            act['shot']=shot(page,{'skills':['A01'],'surface':'finale-cutout-west-terrace','x':522*K,'y':1871.8947026324342,'radius':32})
        elif u['cls']=='mage' and not p.get('mage'):
            march(page,5900,cls='mage',tolerance=45)
            act['shot']=shot(page,{'skills':['M01'],'surface':'finale-cutout-near-body','x':1710*K,'y':2291.3294746996403,'radius':28})
        elif u['cls']=='knight' and not p.get('bridge'):
            act['guard']=march(page,958*K,cls='knight',tolerance=54)
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

def touch_to_guard(page,context,target=3185):
    card=page.locator('[data-action="select-hero"][data-id="p-knight"]:visible').first
    card.tap(timeout=6500)
    session=context.new_cdp_session(page)
    box=page.locator('#joystick').bounding_box()
    assert box
    x,y=box['x']+box['width']/2,box['y']+box['height']/2
    touch(page,session,x,y,'touchStart')
    try:
        touch(page,session,x+35,y,'touchMove')
        page.wait_for_function('x=>HonroApp.engine.active.x>x',arg=target,timeout=4500)
    finally:
        touch(page,session,x+35,y,'touchEnd')

def fight(browser,args,mobile):
    c=seeded_context(browser,59,mobile=mobile)
    page=c.new_page()
    q={'status':'FAIL','interface':'touch' if mobile else 'keyboard','errors':[],'turns':[]}
    page.on('pageerror',lambda e:q['errors'].append(str(e)))
    try:
        resume(page,59,True,mobile=mobile)
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
            if mobile:
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
    p.add_argument('--check-defend',action='store_true')
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
