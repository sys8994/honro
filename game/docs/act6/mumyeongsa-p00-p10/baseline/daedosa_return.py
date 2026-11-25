"""Play the native Daedosa chamber and walk all four bodies across R."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import saved_context, seeded_context, storage_hash
from hall_passage import actor, march, mission_click, select, state
from legacy54_live import hold, resume
from native_b import aim, wall_trace
from relay_live_chain import boundary_of
from return_gate import ROOM, proceed
from second_pass import sample_walk

TARGETS="""() => {
 const e=HonroApp.engine,b=e.b,major=b.units.filter(u=>['a6-c08-boss','a6-c08-expansion-node'].includes(u.id));
 return {round:b.round,phase:b.phase,side:b.side,shot:b.shot,major:major.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead})),
  state:b.honroDaedosa?.phase,mark:b.honroDaedosa?.mark,flags:b.honroState?.flags};
}"""
CANDIDATE="""() => {
 const e=HonroApp.engine,b=e.b,u=e.active,C=HONRO_CORE,opts=[];
 const possible=b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0);
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
    const weight=t.id==='a6-c08-expansion-node'?6:t.id==='a6-c08-boss'?5:1;
    opts.push({id,angle,power,target:t.id,score:Math.min(t.hp,effect.damage*1.3)*weight});
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
    const weight=t.id==='a6-c08-expansion-node'?6:t.id==='a6-c08-boss'?5:1;
    const score=Math.min(t.hp+Math.max(0,t.shield),effect.damage*(1+power*.28))*weight;
    opts.push({id,angle,power,score,target:t.id,x:p.x,y:p.y});
   }
  }
 }
 return opts.sort((a,b)=>b.score-a.score)[0]??null;
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

def lower_turn(page,report):
    action_ready(page)
    before=actor(page)
    cfg=foes_moved(page)
    if before['dead']:
        return False
    prime=next((u for key in ('a6-c08-expansion-node','a6-c08-boss') for u in cfg['major'] if u['id']==key and not u['dead']),None)
    boss=next(u for u in cfg['major'] if u['id']=='a6-c08-boss')
    desired=(prime or boss)['x']+{'archer':305,'mage':185,'occultist':525,'knight':65}[before['cls']]
    desired=escape_mark(before,cfg.get('mark'),desired,boss)
    if abs(before['x']-desired)>45:
        sample_walk(page,1 if desired>before['x'] else -1,desired,5200)
    action_ready(page)
    current=actor(page)
    intended=1 if (prime or boss)['x']>current['x'] else -1
    if page.evaluate('HonroApp.engine.active.facing')!=intended:
        sample_walk(page,intended,current['x']+13*intended,450)
    options=None
    if current['hp']>=current['maxHp']*.46:
        options=page.evaluate(CANDIDATE)
    plan={'round':cfg['round'],'actor':before['id'],'from':[before['x'],before['y']],
          'feet':[current['x'],current['y']],'targets':cfg['major'],'plan':options}
    if options:
        s=options['id']
        page.locator(f'[data-action="combat-skill"][data-skill="{s}"]').first.click(timeout=5200)
        aim(page,options)
        page.wait_for_function('s=>HonroApp.engine.b.shot>s',arg=cfg['shot'],timeout=5200)
    else:
        page.keyboard.press('f')
    report['turns'].append(plan)
    if len(report['turns'])%8==0:
        print('round',cfg['round'],'actions',len(report['turns']),[(u['id'],u['hp']) for u in cfg['major']],flush=True)
    return True

def all_once_east(page,report,limit=100):
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
            lower_turn(page,report)
    raise AssertionError({'major':foes_moved(page),'actorsEast':sorted(marked),'turns':len(report['turns'])})

def play(browser,out,turns,session=None):
    ctx,page=session if session else (seeded_context(browser,58),None)
    if page is None:
        page=ctx.new_page()
    q={'status':'FAIL','turns':[],'errors':[]}
    page.on('pageerror',lambda err:q['errors'].append(str(err)))
    try:
        if session is None:
            resume(page,58,True)
        else:
            base.dismiss_dialogue(page)
        march(page,3496,cls='occultist',tolerance=45)
        mission_click(page,'column','threshold')
        march(page,3680,cls='mage',tolerance=40)
        mission_click(page,'threshold')
        wall_trace(page)
        all_once_east(page,q,turns)
        q['winTargets']=foes_moved(page)
        march(page,3680,cls='mage',tolerance=40)
        mission_click(page,'stake')
        q['returnRoute']=[]
        page.evaluate("window.rOriginals=new Map(HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned).map(u=>[u.id,u]))")
        for cls,x in [('archer',3075),('occultist',3010),('knight',3140)]:
            action_ready(page)
            end=march(page,x,cls=cls,tolerance=22)
            q['returnRoute'].append(end)
        select(page,'mage',advance=True)
        hold(page,'ArrowLeft',"()=>HonroApp.done&&HonroApp.engine.b.phase==='won'",None,7500)
        q['returnRoute'].append(actor(page))
        q['outgoing']=page.evaluate(ROOM)
        page.screenshot(path=out/'r-source-58.png')
        page.locator('[data-act6-qa-next="59"]').click(timeout=6200)
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
        if session is None:
            ctx.close()
    if q['errors']:
        q['status']='FAIL'
    return q

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--build',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--turns',type=int,default=100)
    opts=p.parse_args()
    base.ROOT=opts.build.resolve()
    opts.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
                                   args=['--no-sandbox','--disable-dev-shm-usage'])
        q=play(browser,opts.out,opts.turns)
        (opts.out/'r-live.json').write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n')
        print(q['status'],q.get('error',''),flush=True)
        browser.close()

if __name__=='__main__':
    main()
