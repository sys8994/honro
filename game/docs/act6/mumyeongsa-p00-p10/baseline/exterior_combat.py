"""Observe native Act 6 approach squads using real movement and round input."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from exterior_audit import open_stage
from relay_live_chain import ready
from second_pass import FOOT, sample_walk

TRACE = """() => {
  const e=HonroApp.engine,b=e.b;
  const data=window.a6Exterior={shots:[],damage:[],joins:[],queues:[],frames:[],peak:0};
  const seen=new Set(),rounds=new Set(),fire=e.fire,hurt=e.hurt;
  e.fire=function(skill,...rest){
    const u=e.active,accepted=fire.call(this,skill,...rest);
    if(accepted&&u?.side===1)data.shots.push({id:u.id,skill,round:b.round});
    return accepted;
  };
  e.hurt=function(target,amount,id,...rest){
    const before=target.hp,out=hurt.call(this,target,amount,id,...rest);
    if(target.side===0&&target.hp<before&&e.unit(id)?.side===1)
      data.damage.push({id,target:target.id,before,after:target.hp,round:b.round});
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
    if(b.side===1&&!rounds.has(b.round)){rounds.add(b.round);data.queues.push({round:b.round,queue:b.queue.slice()});}
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
