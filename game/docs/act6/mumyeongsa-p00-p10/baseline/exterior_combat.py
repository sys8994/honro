"""Observe native Act 6 approach squads using real movement and round input."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from exterior_audit import open_stage
from native_b import aim
from relay_live_chain import boundary_of, cold_new, ready
from second_pass import FOOT, sample_walk

TRACE = """() => {
  const e=HonroApp.engine,b=e.b;
  const data=window.a6Exterior={shots:[],damage:[],impacts:[],enemyTurns:[],joins:[],queues:[],frames:[],peak:0,
    initialRng:b.rng,seed:b.seed};
  const seen=new Set(),rounds=new Set(),fire=e.fire,hurt=e.hurt,impact=e.impact;
  let previousActive=null;
  const standing=u=>({hp:u.hp,shield:u.shield??0});
  e.fire=function(skill,...rest){
    const u=e.active,accepted=fire.call(this,skill,...rest);
    if(accepted&&u?.side===1)data.shots.push({id:u.id,skill,round:b.round});
    return accepted;
  };
  e.hurt=function(target,amount,id,...rest){
    const enemy=target.side===0&&e.unit(id)?.side===1,before=enemy&&standing(target);
    const out=hurt.call(this,target,amount,id,...rest);
    if(enemy)data.damage.push({id,target:target.id,skill:rest.find(x=>x?.owner===id)?.skill??null,
      before:before.hp,after:target.hp,shieldBefore:before.shield,shieldAfter:target.shield??0,amount,round:b.round});
    return out;
  };
  e.impact=function(projectile,contact,...rest){
    const t=contact?.unit,enemy=t?.side===0&&e.unit(projectile.owner)?.side===1,before=enemy&&standing(t);
    const out=impact.call(this,projectile,contact,...rest);
    if(enemy)data.impacts.push({id:projectile.owner,target:t.id,skill:projectile.skill,
      before,after:standing(t),x:contact.x,y:contact.y,shot:projectile.shot,round:b.round});
    return out;
  };
  const observe=()=>{
    const combat=b.units.filter(u=>u.side===1&&u.loadout.length&&!u.summoned&&!u.honroShotTarget);
    data.peak=Math.max(data.peak,combat.filter(u=>u.hp>0&&!u.dead&&u.awake).length);
    for(const u of combat)if(!seen.has(u.id)){
      seen.add(u.id);
      data.joins.push({id:u.id,role:u.role,source:u.honroSpawnSource??'original',round:b.round,
       x:u.x,y:u.y,grounded:e.grounded(u),surface:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id??null});
    }
    const side=b.side===1;
    if(side&&!rounds.has(b.round)){
      rounds.add(b.round);
      const eligible=new Set(e.combatEnemies());
      const fronts=combat.filter(u=>/^finale-(west-return|east-fault)-/.test(u.id)).map(u=>{
        const plan=e.enemyQueuePriority?.(u);
        return {id:u.id,grounded:e.grounded(u),awake:u.awake,dead:u.dead,eligible:eligible.has(u),
          support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id??null,rangeTier:plan?.tier??null,
          distance:plan?.distance??null,queued:b.queue.includes(u.id)};
      });
      data.queues.push({round:b.round,queue:b.queue.slice(),fronts});
    }
    const action=side&&e.active?.side===1?`${b.round}/${e.active.id}`:null;
    if(action&&action!==previousActive){
      const u=e.active;
      data.enemyTurns.push({id:u.id,round:b.round,phase:b.phase,grounded:e.grounded(u),x:u.x,y:u.y});
    }
    previousActive=action;
  };
  observe();data.initial=data.joins.length;data.limit=b.enemyLimit;
  let prior=performance.now();
  const read=now=>{if(HonroApp.engine!==e)return;data.frames.push(now-prior);prior=now;observe();requestAnimationFrame(read);};
  requestAnimationFrame(read);
}"""

def wait_round(page):
    old=page.evaluate('HonroApp.engine.b.round')
    for _ in range(4):
        if page.evaluate('HonroApp.engine.b.round')>old:
            return
        page.keyboard.press('f')
        page.wait_for_function('r=>HonroApp.engine.b.round>r || HonroApp.canInput()',arg=old,timeout=30000)
        page.wait_for_timeout(200)

def walk(page,target):
    for _ in range(5):
        ready(page,30000)
        p=page.evaluate(FOOT)
        if abs(p['x']-target)<55 and p['grounded']:
            return p
        if p['move']<min(1200,abs(target-p['x'])+80):
            wait_round(page)
            continue
        direction=1 if p['x']<target else -1
        outcome=sample_walk(page,direction,target,3800)
        if not outcome['reached'] and abs(p['x']-outcome['end']['x'])<100:
            page.keyboard.press('Control')
            sample_walk(page,direction,target,1100)
        page.wait_for_timeout(500)
    return page.evaluate(FOOT)

def complete_overlook(browser,page,out,args):
    out['overlook']=[]
    slot=page.locator('[data-act6-qa-lookout]')
    for _ in range(60):
        base.dismiss_dialogue(page)
        ready(page,43000)
        s=page.evaluate("""() => {const e=HonroApp.engine,u=e.active,crest=e.unit('crest-champion');
          return {round:e.b.round,role:u.cls,id:u.id,x:u.x,grounded:e.grounded(u),move:u.moveLeft,
            crest:crest.hp,allThere:e.b.units.filter(v=>v.side===0&&!v.summoned).every(v=>v.x>=6480&&e.grounded(v))};}""")
        if s['round']>17:
            break
        target=6730 if s['role']=='mage' else 6550
        progress=min(target,s['x']+max(0,s['move']*.63-70))
        if progress>s['x']+65:
            m=sample_walk(page,1,progress,6200)
            out['overlook'].append({'walk':m['end'],'actor':s['id']})
            if not m['reached'] and m['end']['x']-s['x']<70:
                page.keyboard.press('Control')
                sample_walk(page,1,progress,1800)
            page.wait_for_timeout(420)
            continue
        if s['allThere'] and s['crest']<=0 and s['role']=='mage' and abs(s['x']-6740)<150:
            slot.click(timeout=6500)
            page.wait_for_function("HonroApp.engine.b.phase==='won'",timeout=7500)
            page.screenshot(path=args.out/'overlook-won.png')
            page.locator('[data-act6-qa-next="52"]').click(timeout=6500)
            page.wait_for_function('HonroApp.engine?.b?.honroStage===52',timeout=12000)
            records=base.saved_bytes(page)
            out['warm52']=page.evaluate(base.SNAPSHOT)
            out['cold52']=cold_new(browser,records,52)
            out['seal']=boundary_of(records)
            return
        if s['crest']>0 and s['x']>6020 and s['role']!='knight':
            spec=page.evaluate("""() => {const e=HonroApp.engine,u=e.active,t=e.unit('crest-champion');
              const skill=({archer:'A02',mage:'M01',occultist:'O04'})[u.cls];
              const sk=HONRO_CORE.SKILLS[skill];if(!sk||!u.loadout.includes(skill))return null;
              const [start,end]=u.facing>0?[-83,88]:[92,265];
              for(const power of [.70,.82,.58,.92,.48,.40])for(let angle=start;angle<=end;angle+=2){
                if(!e.canAfford(sk,u,power))continue;
                if([-.8,0,.8].every(delta=>[0,.028].every(dp=>e.predict(u,sk,angle+delta,power+dp,t,false).unit===t.id)))return {skill,angle,power};
              }return null;}""")
            if spec:
                page.locator(f'[data-action="combat-skill"][data-skill="{spec["skill"]}"]').first.click(timeout=5000)
                aim(page,spec)
                out['overlook'].append({'shot':spec,'before':s})
                continue
        page.keyboard.press('f')
        out['overlook'].append({'wait':s})
        page.wait_for_timeout(200)
    raise AssertionError('The live lookout was not secured within 17 rounds')

def run(browser,args,stage):
    ctx,page=open_stage(browser,stage,False)
    out={'stage':stage,'status':'FAIL','route':[],'errors':[]}
    page.on('pageerror',lambda e:out['errors'].append(str(e)))
    try:
        page.evaluate(TRACE)
        start=page.evaluate('a6Exterior.initial')
        assert start in ({51:range(7,10),52:range(8,11)}[stage]),start
        assert page.evaluate('a6Exterior.limit')=={51:5,52:6}[stage]
        aims={51:(1070,2860,5150),52:(1840,2840,4270)}[stage]
        for i,target in enumerate(aims[:1] if args.opening_only else aims):
            foot=walk(page,target)
            out['route'].append({'target':target,'foot':foot})
            assert abs(foot['x']-target)<180 and foot['grounded'],foot
            page.wait_for_timeout(1300)
            page.screenshot(path=args.out/f'encounters-{stage}-{i}.png')
            for _ in range(args.rounds_per_site):
                wait_round(page)
                ready(page,35000)
        if stage==51 and args.finish_overlook:
            complete_overlook(browser,page,out,args)
        out['status']='PARTIAL' if args.opening_only else 'PASS'
    except (Error,AssertionError) as error:
        out['error']=str(error)[:2200]
    finally:
        out['trace']=page.evaluate('window.a6Exterior??null')
        if out['trace']:
            frames=out['trace'].pop('frames')
            out['frameP95HostMs']=sorted(frames)[int(.95*(len(frames)-1))] if frames else None
        out['final']=page.evaluate(base.SNAPSHOT)
        ctx.close()
    return out

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--build',required=True,type=Path)
    p.add_argument('--out',required=True,type=Path)
    p.add_argument('--stages',type=int,nargs='+',default=[51,52],choices=[51,52])
    p.add_argument('--opening-only',action='store_true')
    p.add_argument('--rounds-per-site',type=int,default=1)
    p.add_argument('--finish-overlook',action='store_true')
    args=p.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
                                   args=['--no-sandbox','--disable-dev-shm-usage'])
        for stage in args.stages:
            result=run(browser,args,stage)
            (args.out/f'encounters-{stage}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
            print(stage,result['status'],result.get('error','')[:200],flush=True)
        browser.close()

if __name__=='__main__':
    main()
