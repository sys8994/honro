"""Play the native Daedosa chamber and walk all four bodies across R."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import saved_context, seeded_context, storage_hash
from exterior_combat import TRACE
from hall_passage import actor, combat_from_ceiling, march, mission_click, near, select, state
from legacy54_live import hold, resume
from mobile_seams import POINTER_EVENTS, move as touch_move
from native_b import aim, wall_trace
from relay_live_chain import boundary_of
from return_gate import ROOM, proceed
from second_pass import sample_walk

TARGETS="""() => {
 const e=HonroApp.engine,b=e.b,major=b.units.filter(u=>['a6-c08-boss','a6-c08-expansion-node'].includes(u.id));
 return {round:b.round,phase:b.phase,side:b.side,shot:b.shot,major:major.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead})),
  state:b.honroDaedosa?.phase,mark:b.honroDaedosa?.mark,exposed:b.honroDaedosa?.exposed,flags:b.honroState?.flags};
}"""
CANDIDATE="""(priorities=[]) => {
 const e=HonroApp.engine,b=e.b,u=e.active,C=HONRO_CORE,opts=[];
 const possible=b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0);
 const weight=t=>priorities?.includes(t.id)?10:t.id==='a6-c08-expansion-node'?6:t.id==='a6-c08-boss'?5:1;
 for(const id of u.loadout){
  const sk=C.SKILLS[id],effect=e.effective(sk,u);
  if(!sk||!effect||effect.damage<=0||['M10','M07','M08','M09'].includes(id))continue;
  if(sk.martial&&sk.branch==='sword'){
   const power=.9,org=e.damageAim(u,.5);
   if(!e.canAfford(sk,u,power+.02))continue;
   for(const t of possible){
    const hit=e.damageAim(t,.5),dx=hit.x-org.x,dy=hit.y-org.y;
    let angle=-Math.atan2(dy,dx)*180/Math.PI;
    if(angle< -85)angle+=360;
    const radius=sk.radius*(1+power*.23);
    if(Math.sign(dx)!==u.facing||Math.hypot(dx,dy)>radius+t.r||e.collision(org,hit,1,u.id,[],false))continue;
    opts.push({id,angle,power,target:t.id,score:Math.min(t.hp,effect.damage*1.3)*weight(t)});
   }
   continue;
  }
  for(const power of [.97,.89,.80,.72,.62,.52,.42,.34,.24]){
   if(!e.canAfford(sk,u,power+.014))continue;
   const tryAim=(a,p)=>e.predict(u,sk,a,p,undefined,true);
   const sign=Math.sign(u.facing);
   for(let angle=sign>0?-81:93;angle<(sign>0?87:263);angle+=3){
    const p=tryAim(angle,power);
    const t=possible.find(v=>v.id===p.unit);
    if(!t)continue;
    const durable=[[-1.3,.0],[0,.015],[1.3,.025]].every(([a,k])=>tryAim(angle+a,power+k).unit===t.id);
    if(!durable)continue;
    const score=Math.min(t.hp+Math.max(0,t.shield),effect.damage*(1+power*.28))*weight(t);
    opts.push({id,angle,power,score,target:t.id,x:p.x,y:p.y});
   }
  }
 }
 return opts.sort((a,b)=>b.score-a.score)[0]??null;
}"""
MENDING="""() => {
 const e=HonroApp.engine,u=e.active,skill=HONRO_CORE.SKILLS.M10;
 if(u.hp>=u.maxHp*.72||!u.loadout.includes('M10')||!e.canAfford(skill,u,.5)||
    e.b.stakes?.some(s=>s.skill==='M10'&&Math.abs(s.x-u.x)<100))return null;
 for(const power of [.27,.36,.45,.56,.65])for(let i=0;i<14;i++){
  const angle=u.facing>0?86-i*2:94+i*2;
  const hit=(a,p)=>{const z=e.predict(u,skill,a,p,undefined,true);
   return z.terrain&&Math.abs(z.x-u.x)<100&&Math.abs(z.y-u.y)<44;};
  if([-.8,0,.8].every(d=>[0,.025].every(p=>hit(angle+d,power+p))))return {id:'M10',angle,power};
 }
 return null;
}"""

def action_ready(page):
    for _ in range(10):
        base.dismiss_dialogue(page)
        page.wait_for_function("""()=>{const a=HonroApp,e=a.engine;return a.dialogue||a.done||
           e.b.phase==='aim'&&e.b.side===0&&a.canInput();}""",timeout=42000)
        if not page.evaluate('!!HonroApp.dialogue'):
            return
    raise AssertionError('Dialogue did not finish')

def foes_moved(page):
    return page.evaluate(TARGETS)

def escape_mark(actor,mark,desired,boss):
    if not mark:
        return desired
    x=actor['x']
    if mark['kind']=='great':
        return 3295 if x<4560 else 5705
    if mark['kind']=='tether' and mark['target']==actor['id']:
        return boss['x']+(800 if x>=boss['x'] else -800)
    if mark['kind'] in ('band','zone') and mark['x0']-35<=x<=mark['x1']+35:
        return mark['x1']+95 if x>=(mark['x0']+mark['x1'])*.5 else mark['x0']-95
    circles=mark.get('circles',[])
    if mark['kind'] in ('circle','swap'):
        circles=[mark]
    for spot in circles:
        if abs(x-spot['x'])<spot['r']+44:
            return spot['x']+(spot['r']+92)*(1 if x>=spot['x'] else -1)
    return desired

def lower_turn(page,report,guard_fronts=False):
    action_ready(page)
    before=actor(page)
    cfg=foes_moved(page)
    if before['dead']:
        return False
    prime=next((u for key in ('a6-c08-expansion-node','a6-c08-boss') for u in cfg['major'] if u['id']==key and not u['dead']),None)
    boss=next(u for u in cfg['major'] if u['id']=='a6-c08-boss')
    covered=[turn['plan']['target'] for turn in report['turns']
             if turn.get('bossPhase')==cfg['state'] and turn.get('plan') and
             turn['plan'].get('target') in turn.get('recentGroundThreats',[])] if guard_fronts=='ceiling' else []
    fronts=page.evaluate("""covered=>{
        const e=HonroApp.engine,c=e.active;
        const rows=a6Exterior.damage.filter(d=>d.round>=e.b.round-1&&d.id&&
          !['a6-c08-boss','a6-c08-expansion-node'].includes(d.id));
        const units=[...new Set(rows.map(d=>d.id))].filter(id=>!covered.includes(id)).map(id=>e.unit(id)).filter(u=>u&&!u.dead&&
          Math.hypot(u.x-c.x,u.y-c.y)<1050);
        return units.sort((a,b)=>Math.abs(a.x-c.x)-Math.abs(b.x-c.x)).map(u=>({id:u.id,x:u.x,y:u.y}));
    }""",covered) if guard_fronts and not cfg['exposed'] and (not prime or 'node' not in prime['id']) else []
    ledger=page.locator('[data-act6-qa-lookout][data-act6-mission="ledger"]')
    if ledger.count() and (cfg.get('mark') or {}).get('kind')!='great' and abs(before['x']-4464)<=before['move']*.87:
        sample_walk(page,1 if before['x']<4464 else -1,4464,4200)
        seated=actor(page)
        if abs(seated['x']-4464)<65 and seated['grounded'] and seated['contact']=='local-lower-08-body':
            ledger.click(timeout=4400)
            proof=foes_moved(page)
            if proof['flags'].get('localLedgerCounterSpent'):
                report.setdefault('ledgerUse',[]).append({'round':proof['round'],'foot':seated,'flags':proof['flags']})
                cfg=proof
    tactical=fronts[0] if fronts else prime or boss
    desired=tactical['x']+{'archer':305,'mage':185,'occultist':525,'knight':65}[before['cls']]
    safe=escape_mark(before,cfg.get('mark'),desired,boss)
    avoiding=safe!=desired
    desired=safe
    if abs(before['x']-desired)>45:
        sample_walk(page,1 if desired>before['x'] else -1,desired,5200)
    action_ready(page)
    current=actor(page)
    intended=1 if tactical['x']>current['x'] else -1
    if page.evaluate('HonroApp.engine.active.facing')!=intended:
        sample_walk(page,intended,current['x']+13*intended,450)
    threats=[u['id'] for u in fronts]
    options=page.evaluate(MENDING)
    if current['hp']>=current['maxHp']*.46:
        options=options or page.evaluate(CANDIDATE,threats)
    if not options and not avoiding and current['move']>115:
        other=tactical['x']-{'archer':185,'mage':135,'occultist':280,'knight':85}[before['cls']]
        if abs(other-current['x'])>65:
            sample_walk(page,1 if other>current['x'] else -1,other,4800)
            action_ready(page)
            current=actor(page)
            want=1 if tactical['x']>current['x'] else -1
            if page.evaluate('HonroApp.engine.active.facing')!=want:
                sample_walk(page,want,current['x']+13*want,450)
            options=page.evaluate(MENDING) or page.evaluate(CANDIDATE,threats)
    plan={'round':cfg['round'],'actor':before['id'],'from':[before['x'],before['y']],
          'feet':[current['x'],current['y']],'targets':cfg['major'],'plan':options}
    if guard_fronts:
        plan['recentGroundThreats']=threats
        plan['bossPhase']=cfg['state']
    if options:
        s=options['id']
        page.locator(f'[data-action="combat-skill"][data-skill="{s}"]').first.click(timeout=5200)
        aim(page,options)
        page.wait_for_function('s=>HonroApp.engine.b.shot>s',arg=cfg['shot'],timeout=5200)
    else:
        page.keyboard.press('f')
    report['turns'].append(plan)
    if len(report['turns'])%8==0:
        print('round',cfg['round'],'actions',len(report['turns']),[(u['id'],u['hp']) for u in cfg['major']],
              'party',[(u['id'],round(u['hp'])) for u in state(page)['actors'] if u['side']==0],flush=True)
    return True

def all_once_east(page,report,limit=100,guard_fronts=False):
    marked=set()
    for _ in range(limit):
        action_ready(page)
        q=foes_moved(page)
        if page.evaluate('HonroApp.done'):
            raise AssertionError(state(page))
        heroes=[u for u in state(page)['actors'] if u['side']==0 and u['x']>3705 and u['grounded']]
        marked.update(u['id'] for u in heroes)
        if len(q['major'])==2 and all(u['dead'] and u['hp']==0 for u in q['major']) and len(marked)==4:
            report['allFourEast']=sorted(marked)
            return
        if len(q['major'])==2 and all(u['dead'] for u in q['major']):
            u=actor(page)
            if u['id'] not in marked and u['x']<3705:
                sample_walk(page,1,3790,4200)
            page.locator('[data-act6-qa-return]').click(timeout=5500)
        else:
            lower_turn(page,report,guard_fronts)
    raise AssertionError({'major':foes_moved(page),'actorsEast':sorted(marked),'turns':len(report['turns'])})

def open_from_ceiling(page,out,report):
    select(page,'mage')
    near(page,3360)
    page.keyboard.press('Control')
    page.wait_for_function("""()=>{const e=HonroApp.engine,u=e.active;
      return e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id.startsWith('m58-');}""",timeout=5400)
    near(page,4172)
    page.wait_for_function('HonroApp.engine.active.x===4380&&HonroApp.engine.grounded(HonroApp.engine.active)',timeout=6500)
    wall=actor(page)
    assert wall['family']=={'x':320,'y':0} and wall['normal']=={'x':-1,'y':0},wall
    hold(page,'ArrowRight','HonroApp.engine.active.y<2716',None,5400)
    page.wait_for_function('HonroApp.engine.active.y===2570&&HonroApp.engine.grounded(HonroApp.engine.active)',timeout=5200)
    footing=actor(page)
    assert footing['family']=={'x':0,'y':-320} and footing['normal']=={'x':0,'y':1},footing
    combat=combat_from_ceiling(page,out,'opening')
    assert any(row['event']=='impact' and row['actor']=='p-mage' and row['target'] and row['after']<row['before']
               for row in combat['trace']),combat
    report['upperOpening']={'wall':wall,'ceiling':footing,'combat':combat}
    for _ in range(8):
        action_ready(page)
        if actor(page)['cls']=='mage':
            break
        lower_turn(page,report)
    assert actor(page)['cls']=='mage'
    hold(page,'ArrowLeft','HonroApp.engine.active.x<3960',None,5400)
    page.wait_for_function('HonroApp.engine.active.y>2662&&HonroApp.engine.grounded(HonroApp.engine.active)',timeout=5200)
    report['upperOpening']['dismount']=actor(page)
    assert report['upperOpening']['dismount']['family']=={'x':0,'y':320}


def touch_send_r(context,page,report):
    page.evaluate(POINTER_EVENTS)
    for cls,target in (('archer',3075),('occultist',3010),('knight',3140),('mage',3240)):
        identity=actor(page,cls)['id']
        for _ in range(5):
            action_ready(page)
            if actor(page)['id']==identity:
                break
            select_control=page.locator(f'[data-action="select-hero"][data-id="{identity}"]:visible').first
            if select_control.count() and select_control.is_enabled():
                select_control.tap(timeout=3200)
                if actor(page)['id']==identity:
                    break
            page.locator('[data-act6-qa-return]').tap(timeout=4400)
        who=actor(page)
        assert who['id']==identity,who
        if who['x']<=3260:
            touch_move(context,page,1,'HonroApp.engine.active.x>=3340')
        touch_move(context,page,-1,'x=>HonroApp.done||HonroApp.engine.active.x<=x',target,timeout=13000)
        landed=actor(page)
        assert landed['grounded'] and landed['contact']=='local-lower-08-body',landed
        report['returnRoute'].append(landed)
    report['returnTouches']=page.evaluate('seamTouches')
    assert len(report['returnTouches'])>=8 and all(v['trusted'] and v['type']=='touch' for v in report['returnTouches'])
    page.wait_for_function("HonroApp.done&&HonroApp.engine.b.phase==='won'",timeout=8000)


def place_return_stake(page,mobile):
    foot=march(page,3680,cls='mage',tolerance=30)
    if foot['contact']!='local-lower-08-body':
        assert page.evaluate('HonroApp.engine.canDrop()'),foot
        if mobile:
            page.locator('[data-action="drop"]:visible').first.tap(timeout=5500)
        else:
            page.keyboard.press('Alt')
        page.wait_for_function("""()=>{const e=HonroApp.engine,u=e.active;
            return e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id==='local-lower-08-body';
        }""",timeout=8000)
    foot=actor(page)
    assert foot['grounded'] and foot['contact']=='local-lower-08-body',foot
    mission_click(page,'stake')
    page.wait_for_function("HonroApp.engine.b.honroState.flags['place(correctedInnerStake)']",timeout=5000)
    return foot


def play(browser,out,turns,session=None,pressure=False,tactic='ground',rng=None,touch_return=False):
    ctx,page=session if session else (seeded_context(browser,58,mobile=touch_return),None)
    if page is None:
        page=ctx.new_page()
    q={'status':'FAIL','turns':[],'errors':[]}
    page.on('pageerror',lambda err:q['errors'].append(str(err)))
    try:
        if session is None:
            resume(page,58,True,mobile=touch_return)
        else:
            base.dismiss_dialogue(page)
        if rng is not None:
            page.evaluate('seed=>{HonroApp.engine.b.rng=seed;}',rng)
            q['controlledRng']=rng
        if pressure or tactic in ('ground-guard','ceiling-counter'):
            page.evaluate(TRACE)
        march(page,3496,cls='occultist',tolerance=45)
        mission_click(page,'column','threshold')
        march(page,3680,cls='mage',tolerance=40)
        mission_click(page,'threshold')
        wall_trace(page)
        if tactic in ('ceiling','ceiling-counter'):
            open_from_ceiling(page,out,q)
        all_once_east(page,q,turns,guard_fronts='ceiling' if tactic=='ceiling-counter' else tactic=='ground-guard')
        q['winTargets']=foes_moved(page)
        q['signatureHistory']=page.evaluate("HonroApp.engine.b.honroDaedosa?.history??[]")
        q['correctedStakeFoot']=place_return_stake(page,touch_return)
        q['returnRoute']=[]
        page.evaluate("window.rOriginals=new Map(HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned).map(u=>[u.id,u]))")
        if touch_return:
            touch_send_r(ctx,page,q)
        else:
            for cls,x in [('archer',3075),('occultist',3010),('knight',3140)]:
                action_ready(page)
                try:
                    end=march(page,x,cls=cls,tolerance=22,max_attempts=5)
                except AssertionError:
                    end=actor(page,cls)
                    if not 2840<=end['x']<=3248 or not end['grounded'] or end['contact']!='local-lower-08-body':
                        raise
                q['returnRoute'].append(end)
            select(page,'mage',advance=True)
            hold(page,'ArrowLeft',"()=>HonroApp.done&&HonroApp.engine.b.phase==='won'",None,7500)
            q['returnRoute'].append(actor(page))
        q['outgoing']=page.evaluate(ROOM)
        page.screenshot(path=out/'r-source-58.png')
        next_chapter=page.locator('[data-act6-qa-next="59"]')
        (next_chapter.tap if touch_return else next_chapter.click)(timeout=6200)
        page.wait_for_function("HonroApp.engine?.b?.honroStage===59",timeout=12000)
        base.dismiss_dialogue(page)
        q['liveSameObjects']=page.evaluate('HonroApp.engine.b.units.every(u=>rOriginals.get(u.id)===u)')
        q['live']=page.evaluate(ROOM)
        assert q['liveSameObjects'] and q['live']['pending'],q['live']
        saved=base.saved_bytes(page)
        q['storageHash']=storage_hash(saved)
        signed=boundary_of(saved)
        q['checkpoint59']=signed
        assert signed['from']==58 and signed['to']==59 and len(signed['custody']['returnGate']['actors'])==4,signed
        q['routeReceipt']=signed['custody']['returnGate']
        exists={u['id']:u for u in q['outgoing']['actors']}
        keys=('x','y','hp','focus','shield','loadout','equipment','grounded','gravity')
        assert q['live']['landmark']==q['outgoing']['landmark'] and all(
            all(u[k]==exists[u['id']][k] for k in keys) for u in q['live']['actors']),q['live']
        page.screenshot(path=out/'r-live-59.png')
        cold=saved_context(browser,saved)
        try:
            fresh=cold.new_page()
            resume(fresh,59,True)
            q['cold']=page.evaluate(ROOM)
            assert q['cold']['actors']==q['live']['actors'] and q['cold']['landmark']==q['live']['landmark'],q['cold']
            proceed(fresh,out,q,'new-checkpoint')
            assert q['storageHash']==storage_hash(base.saved_bytes(fresh)), 'Reading changed stored bytes'
        finally:
            cold.close()
        q['status']='PASS'
    except (AssertionError,Error) as err:
        q['error']=str(err)[:5000]
        if page.evaluate('!!HonroApp.engine'):
            q['last']=state(page)
        page.screenshot(path=out/'r-live-failure.png')
    finally:
        q['projectileTrace']=page.evaluate('window.nativeWall??[]')
        if pressure or tactic in ('ground-guard','ceiling-counter'):
            q['encounters']=page.evaluate('window.a6Exterior??null')
            if q['encounters']:
                frames=q['encounters'].pop('frames')
                q['hostP95']=sorted(frames)[int(.95*(len(frames)-1))] if frames else None
        if session is None:
            ctx.close()
    if q['errors']:
        q['status']='FAIL'
    return q

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--build',type=Path,required=True)
    p.add_argument('--pressure',action='store_true')
    p.add_argument('--tactic',choices=('ground','ground-guard','ceiling','ceiling-counter'),default='ground')
    p.add_argument('--rng',type=int)
    p.add_argument('--touch-return',action='store_true')
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--turns',type=int,default=100)
    opts=p.parse_args()
    base.ROOT=opts.build.resolve()
    opts.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
                                   args=['--no-sandbox','--disable-dev-shm-usage'])
        q=play(browser,opts.out,opts.turns,pressure=opts.pressure,tactic=opts.tactic,rng=opts.rng,touch_return=opts.touch_return)
        (opts.out/'r-live.json').write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n')
        print(q['status'],q.get('error',''),flush=True)
        browser.close()

if __name__=='__main__':
    main()
