"""Check native D, gallery body physics, and the original 58 hall rites."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import saved_context, seeded_context, storage_hash
from legacy54_live import hold, resume
from native_b import FRAME_DRIVER, aim, wall_trace
from relay_live_chain import ready
from second_pass import sample_walk

MISSION = '[data-act6-qa-lookout]'
D_APPROACH = ['m57-hall-approach','local-07-08-folded-ward-bridge','local-07-08-exact-receiving-slice','a6-c07-stationary-stone-ward']
CONTACTS = """() => {
 const e=HonroApp.engine,b=e.b,C=HONRO_CORE;
 return {stage:b.honroStage,active:e.active?.id,phase:b.phase,round:b.round,side:b.side,shot:b.shot,
  flags:b.honroState?.flags,notice:document.querySelector('#notice')?.textContent,
  actors:b.units.map(u=>{
   const h=e.projectileCollision({x:u.x-2,y:u.y},{x:u.x+2,y:u.y},0,u.id,[],false);
   const v=e.projectileCollision({x:u.x,y:u.y+2},{x:u.x,y:u.y-2},0,u.id,[],false);
   const axis=h?.terrain?.id==='m58-apse-pier'?[u.x-u.h/2,u.y]:
       v?.terrain?.id==='m58-timber-soffit'?[u.x,u.y+u.h/2]:[u.x,u.y-u.h/2];
   const support=h?.terrain?.id==='m58-apse-pier'?h:v?.terrain?.id==='m58-timber-soffit'?v:null;
   return {id:u.id,cls:u.cls,side:u.side,x:u.x,y:u.y,vx:u.vx,vy:u.vy,hp:u.hp,maxHp:u.maxHp,shield:u.shield,r:u.r,h:u.h,
    ammo:u.ammo,loadout:u.loadout,dead:u.dead,actorsMoved:u.acted,move:u.moveLeft,grounded:e.grounded(u),
    family:C.environmentAt(b.physics,...axis,true).gravity,
    contact:support?.terrain?.id??e.contactSurface(u.x,u.y-4,u.y+5)?.t.id??null,normal:support?.n??null};
  }),
  landmarks:b.honroLandmarks?.filter(v=>v.id.startsWith('art-m58')||v.id==='art-mumyeongsa-hall-sill')
   .map(v=>({id:v.id,x:v.x,y:v.y,visual:v.asset.visual?.length}))
 };
}"""
WATCH = """() => {
 const a=HonroApp,e=a.engine,u=e.active,steps=[];
 window.hallBodySteps=steps;
 const frame=()=>{
  if(HonroApp.engine!==e)return;
  const g0=HONRO_CORE.environmentAt(e.b.physics,u.x-u.h/2,u.y,true).gravity;
  const g1=HONRO_CORE.environmentAt(e.b.physics,u.x,u.y+u.h/2,true).gravity;
  steps.push({x:u.x,y:u.y,vx:u.vx,vy:u.vy,wall:g0.x,ceiling:g1.y,grounded:e.grounded(u)});
  if(steps.length<3000)requestAnimationFrame(frame);
 };
 requestAnimationFrame(frame);
}"""

def state(page):
    return page.evaluate(CONTACTS)

def actor(page,cls=None):
    q=state(page)
    return next(u for u in q['actors'] if (u['id']==q['active'] if cls is None else u['cls']==cls and u['side']==0))

def select(page,cls=None,actor_id=None,advance=False):
    def matches(u):
        return u['cls']==cls if actor_id is None else u['id']==actor_id
    for _ in range(5 if advance else 1):
        for _ in range(6):
            if matches(actor(page)):
                return
            page.keyboard.press('Tab')
            page.wait_for_timeout(60)
        if advance:
            page.keyboard.press('f')
            ready(page,28000)
    raise AssertionError(state(page))

def near(page,target,tolerance=24):
    q=actor(page)
    if abs(q['x']-target)>tolerance:
        r=sample_walk(page,1 if q['x']<target else -1,target,3900)
        q=actor(page)
        assert r['reached'] or abs(q['x']-target)<=tolerance, (target,q)
    return q

def expected(page,mission):
    page.wait_for_function("m=>document.querySelector('[data-act6-qa-lookout]')?.dataset.act6Mission===m",
                           arg=mission,timeout=5200)

def mission_click(page,mission,after=None):
    expected(page,mission)
    page.locator(MISSION).click(timeout=4300)
    if after:
        expected(page,after)

def march(page,target,cls=None,actor_id=None,tolerance=27,max_attempts=8):
    for _ in range(max_attempts):
        ready(page,28000)
        select(page,cls,actor_id,advance=True)
        u=actor(page)
        if abs(u['x']-target)<=tolerance and u['grounded']:
            return u
        if u['move']<70:
            page.keyboard.press('f')
            continue
        step=sample_walk(page,1 if target>u['x'] else -1,target,4700)
        if step['reached']:
            page.wait_for_timeout(280)
            if abs(actor(page)['x']-target)<=tolerance and actor(page)['grounded']:
                return actor(page)
        if abs(actor(page)['x']-u['x'])<35 and actor(page)['grounded']:
            foot=actor(page)
            page.keyboard.press('Control')
            try:
                page.wait_for_function('y=>HonroApp.engine.active.y<y-40',arg=foot['y'],timeout=1400)
                sample_walk(page,1 if target>u['x'] else -1,target,680)
                page.wait_for_function('HonroApp.engine.grounded(HonroApp.engine.active)',timeout=2800)
            except Error:
                pass
    raise AssertionError({'target':target,'actor':actor(page),'state':state(page)})

def live_d(browser,out,sodan=False,session=None):
    ctx,page=session if session else (seeded_context(browser,57),None)
    if page is None:
        page=ctx.new_page()
    q={'status':'FAIL','steps':{},'errors':[]}
    steps=q['steps']
    page.on('pageerror',lambda err:q['errors'].append(str(err)))
    try:
        if session is None:
            resume(page,57,True)
        else:
            base.dismiss_dialogue(page)
        steps['initial']=state(page)
        if sodan:
            assert not page.evaluate("HonroApp.engine.skillAllowed(HONRO_CORE.SKILLS.O06,HonroApp.engine.unit('p-occultist'))")
        select(page,'occultist')
        mission_click(page,'warnBell','repairRelay')
        steps['warnBell']=state(page)
        for _ in range(10):
            if page.evaluate("HonroApp.engine.b.terrain.some(t=>t.id==='a6-c07-protective-relay'&&t.hp<t.maxHp)"):
                break
            page.keyboard.press('f')
            ready(page,32000)
        march(page,5016,cls='occultist',tolerance=80)
        mission_click(page,'repairRelay','warnRailing')
        steps['repairRelay']=state(page)
        march(page,3376,cls='knight',tolerance=85)
        mission_click(page,'warnRailing','openRetreat')
        page.wait_for_timeout(1000)
        mission_click(page,'openRetreat','moveRelayToFallback')
        steps['retreat']=state(page)
        march(page,1910,cls='occultist',tolerance=36)
        mission_click(page,'moveRelayToFallback')
        march(page,1970,cls='knight',tolerance=36)
        march(page,2043,cls='archer',tolerance=36)
        mission_click(page,'assistKeeper','receiveKeeperWatch')
        steps['keeperAvailable']=state(page)
        march(page,2028,actor_id='local-07-gwakjin-return-keeper',tolerance=39)
        mission_click(page,'receiveKeeperWatch','reuniteAtWard')
        steps['keeperParked']=state(page)
        march(page,5260,cls='archer',tolerance=11)
        page.keyboard.press('Control')
        page.wait_for_function('HonroApp.engine.active.y<2940',timeout=4200)
        sample_walk(page,1,5372,3700)
        page.wait_for_function("""()=>{const e=HonroApp.engine,u=e.active;return e.grounded(u)&&
          e.contactSurface(u.x,u.y-4,u.y+5)?.t.id==='a6-c07-stationary-stone-ward';}""",timeout=4300)
        steps['archerOnWard']=actor(page)
        for cls,x,tolerance in [('knight',5385,10),('occultist',5285,18)]:
            march(page,x,cls=cls,tolerance=tolerance)
        mission_click(page,'reuniteAtWard')
        page.wait_for_function("!!HonroApp.engine.unit('p-mage')",timeout=4100)
        steps['folded']=state(page)
        if sodan:
            ready(page)
            select(page,'occultist')
            assert page.evaluate("HonroApp.engine.skillAllowed(HONRO_CORE.SKILLS.O06,HonroApp.engine.active)")
            assert not page.evaluate("HonroApp.engine.active.fixed")
            wall_trace(page)
            spec=page.evaluate("""()=>{
              const e=HonroApp.engine,u=e.active,s=HONRO_CORE.SKILLS.O06;
              const foes=new Set(e.b.units.filter(v=>v.side===1&&!v.dead).map(v=>v.id));
              for(const power of [.45,.56,.69,.35,.8])for(let angle=u.facing>0?-83:93;angle<=(u.facing>0?88:264);angle++){
               const a=e.predict(u,s,angle,power,undefined,true);
               if(foes.has(a.unit)&&[-.8,.8].every(d=>e.predict(u,s,angle+d,power+.02,undefined,true).unit===a.unit))return {angle,power};
              }return null;
             }""")
            assert spec,'No real post-reunion O06 trajectory'
            page.locator('[data-action="combat-skill"][data-skill="O06"]').first.click(timeout=5000)
            aim(page,spec)
            page.wait_for_function("nativeWall.some(p=>p.event==='impact'&&p.actor==='p-occultist'&&p.skill==='O06'&&p.target?.startsWith('a6-c07-'))",timeout=12000)
            steps['sodanAfterReunion']=page.evaluate('nativeWall')
            ready(page,30000)
        page.evaluate("window.dOriginals=new Map(HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned).map(u=>[u.id,u]))")
        for cls,x in [('occultist',6200),('knight',6090),('mage',5992),('archer',5872)]:
            select(page,cls,advance=True)
            if actor(page)['contact'] not in D_APPROACH:
                march(page,5260,cls=cls,tolerance=12)
                page.keyboard.press('Control')
                page.wait_for_function("""ids=>{const e=HonroApp.engine,u=e.active;return e.grounded(u)&&
                  ids.includes(e.contactSurface(u.x,u.y-4,u.y+5)?.t.id);}""",arg=D_APPROACH,timeout=5000)
            steps['ramp-'+cls]=actor(page)
            if cls=='archer':
                sample_walk(page,1,x,4200)
            else:
                march(page,x,cls=cls,tolerance=23)
        page.wait_for_function("HonroApp.engine.b.phase==='won'&&HonroApp.done",timeout=7200)
        q['outgoing']=state(page)
        page.screenshot(path=out/'d-live-57.png')
        page.locator('[data-act6-qa-next="58"]').click(timeout=7000)
        page.wait_for_function('HonroApp.engine?.b?.honroStage===58',timeout=12000)
        base.dismiss_dialogue(page)
        q['live']=state(page)
        q['sameObjects']=page.evaluate("""() => {const crew=HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned);
          return crew.length===4&&crew.every(u=>dOriginals.get(u.id)===u);}""")
        assert q['sameObjects'],q['live']
        page.screenshot(path=out/'d-live-58.png')
        saved=base.saved_bytes(page)
        cold=saved_context(browser,saved)
        try:
            fresh=cold.new_page()
            resume(fresh,58,True)
            q['newCold']=state(fresh)
            assert [u for u in q['newCold']['actors'] if u['side']==0]==[u for u in q['live']['actors'] if u['side']==0],q['newCold']
            assert storage_hash(saved)==storage_hash(base.saved_bytes(fresh)),'Stored bytes changed'
            fresh.screenshot(path=out/'d-new-checkpoint-58.png')
        finally:
            cold.close()
        q['status']='PASS'
    except (AssertionError,Error) as err:
        q['error']=str(err)
        if page.evaluate('!!HonroApp.engine'):
            q['last']=state(page)
        page.screenshot(path=out/'d-live-failure.png')
    finally:
        if session is None:
            ctx.close()
    if q['errors']:
        q['status']='FAIL'
    return q

def gallery(browser,out,hz,combat=False):
    ctx=seeded_context(browser,58,init_script=FRAME_DRIVER.replace('HZ',str(hz)))
    page=ctx.new_page()
    q={'hz':hz,'status':'FAIL','errors':[]}
    page.on('pageerror',lambda err:q['errors'].append(str(err)))
    try:
        resume(page,58,True)
        q['seedHash']=storage_hash(base.saved_bytes(page))
        q['initial']=state(page)
        crew=[u for u in q['initial']['actors'] if u['side']==0]
        assert len(crew)==4 and all(u['contact']=='local-lower-08-body' for u in crew),q['initial']
        assert not any(u['id']=='a6-c08-boss' for u in q['initial']['actors']),q['initial']
        page.wait_for_timeout(700)
        page.screenshot(path=out/f'd-cold-{hz}.png')
        if combat:
            march(page,3496,cls='occultist',tolerance=45)
            mission_click(page,'column','threshold')
            march(page,3680,cls='mage',tolerance=40)
            mission_click(page,'threshold')
            base.dismiss_dialogue(page)
            q['manifestation']=page.evaluate("""()=>{const e=HonroApp.engine,C=HONRO_CORE;
              return e.b.units.filter(u=>u.side===1&&u.id.startsWith('a6-c08-')).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,rig:u.honroRigAsset,
                supported:C.validTerrainContactPose(e.b.terrain,u)}));}""")
            assert len(q['manifestation'])==3 and all(u['supported'] for u in q['manifestation']),q['manifestation']
            assert q['manifestation'][0]['rig']=='boss_daedosa' and q['manifestation'][0]['maxHp']==10500,q['manifestation']
            page.screenshot(path=out/f'd-boss-{hz}.png')
        select(page,'mage')
        near(page,3360)
        q['rampPre']=actor(page)
        page.keyboard.press('Control')
        page.wait_for_function("""()=>{const e=HonroApp.engine,u=e.active;
          return e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id.startsWith('m58-');}""",timeout=5400)
        q['ramp']=actor(page)
        page.evaluate(WATCH)
        near(page,4172)
        page.wait_for_function("""()=>{const e=HonroApp.engine,u=e.active;return u.x===4380&&e.grounded(u);}""",timeout=6500)
        q['wall']=actor(page)
        assert q['wall']['family']=={'x':320,'y':0} and q['wall']['normal']=={'x':-1,'y':0},q['wall']
        page.screenshot(path=out/f'd-wall-{hz}.png')
        page.keyboard.press('Control')
        page.wait_for_function("HonroApp.engine.active.vx<0",timeout=1200)
        page.wait_for_function("HonroApp.engine.active.x===4380&&HonroApp.engine.grounded(HonroApp.engine.active)",timeout=4800)
        q['wallJump']=actor(page)
        hold(page,'ArrowRight',"()=>{const e=HonroApp.engine;return e.active.y<2716;}",None,5400)
        page.wait_for_function("HonroApp.engine.active.y===2570&&HonroApp.engine.grounded(HonroApp.engine.active)",timeout=5200)
        q['ceiling']=actor(page)
        assert q['ceiling']['family']=={'x':0,'y':-320} and q['ceiling']['normal']=={'x':0,'y':1},q['ceiling']
        page.screenshot(path=out/f'd-ceiling-{hz}.png')
        if combat:
            q['combat']=combat_from_ceiling(page,out,hz)
            enemies={u['id'] for u in q['manifestation']} | set(page.evaluate("""() => HonroApp.engine.b.units
              .filter(u=>u.side===1&&u.honroSpawnSource).map(u=>u.id)"""))
            assert any(t['event']=='impact' and t['actor']=='p-mage' and t['shot']>0 and
                       t['target'] in enemies and t['after']<t['before'] for t in q['combat']['trace']),q['combat']
            assert not q['errors'] and q['seedHash']==storage_hash(base.saved_bytes(page)),q['errors']
            q['status']='PASS'
            return q
        hold(page,'ArrowLeft',"()=>{const e=HonroApp.engine;return e.active.x<3960;}",None,5400)
        page.wait_for_function("HonroApp.engine.active.y>2662&&HonroApp.engine.grounded(HonroApp.engine.active)",timeout=5200)
        q['dismount']=actor(page)
        traces=page.evaluate('hallBodySteps')
        q['frames']={'count':len(traces),'acceleratingWall':sum(a['vx']>0 and a['wall']==320 and not a['grounded'] for a in traces),
                     'jumpAway':sum(a['vx']<0 and not a['grounded'] for a in traces),
                     'acceleratingCeiling':sum(a['vy']<0 and a['ceiling']==-320 and not a['grounded'] for a in traces)}
        assert all(q['frames'][k]>0 for k in ('acceleratingWall','jumpAway','acceleratingCeiling')),q['frames']
        assert q['dismount']['family']=={'x':0,'y':320},q['dismount']
        assert q['seedHash']==storage_hash(base.saved_bytes(page)), 'Stored bytes changed'
        q['status']='PASS'
    except (AssertionError, Error) as err:
        q['error']=str(err)
        if page.evaluate("!!HonroApp.engine"):
            q['last']=state(page)
        page.screenshot(path=out/f'd-gallery-failure-{hz}.png')
    finally:
        ctx.close()
    if q['errors']:
        q['status']='FAIL'
    return q

def combat_from_ceiling(page,out,hz):
    wall_trace(page)
    best=None
    for x,facing in [(4220,1),(4240,-1),(4290,-1),(4090,1)]:
        if abs(x-actor(page)['x'])>5:
            near(page,x,4)
        if page.evaluate('HonroApp.engine.active.facing')!=facing:
            hold(page,'ArrowRight' if facing>0 else 'ArrowLeft',
                 'dir=>HonroApp.engine.active.facing===dir',facing,1200)
        options=page.evaluate("""()=>{
          const e=HonroApp.engine,u=e.active,results=[];
          for(const id of u.loadout)for(const power of [.74,.65,.83,.56,.46,.9,.39,.95]){
            const sk=HONRO_CORE.SKILLS[id];
            for(let angle=u.facing>0?-84:94;angle<=(u.facing>0?88:264);angle+=2){
              if(!e.canAfford(sk,u,power+.02))continue;
              const pos=e.predict(u,sk,angle,power,undefined,true);
              if(pos.unit&&e.unit(pos.unit)?.side!==1)continue;
              if(!pos.terrain&&!pos.unit)continue;
              const zs=[-.85,0,.85].flatMap(d=>[.006,.022].map(p=>e.predict(u,sk,angle+d,power+p,undefined,true)));
              if(!zs.every(z=>z.unit===pos.unit&&z.terrain===pos.terrain))continue;
              results.push({id,angle,power,x:pos.x,y:pos.y,target:pos.unit??null,terrain:pos.terrain??null,
                weight:(pos.unit?1000:0)+(pos.terrain==='m58-apse-pier'?20:0)-(sk.cost??0)/100});
            }
          }
          return results.sort((a,b)=>b.weight-a.weight).slice(0,2);
        }""")
        best=options[0] if options else None
        if best and best['target']:
            break
    assert best,'No native ceiling projectile could hit an actor or terrain'
    page.locator(f'[data-action="combat-skill"][data-skill="{best["id"]}"]').first.click(timeout=5000)
    aim(page,best)
    page.wait_for_function("nativeWall.some(v=>v.event==='impact'&&v.actor==='p-mage'&&v.shot>0)",timeout=9000)
    page.screenshot(path=out/f'd-combat-{hz}.png')
    return {'candidate':best,'trace':page.evaluate('nativeWall')}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--build',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--rates',type=int,nargs='+',default=[60,120])
    p.add_argument('--case',choices=['gallery','gallery-combat','live-d'],default='gallery')
    p.add_argument('--sodan',action='store_true')
    opts=p.parse_args()
    base.ROOT=opts.build.resolve()
    opts.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
                                   args=['--no-sandbox','--disable-dev-shm-usage'])
        entries=[(f'{opts.case}-{hz}',gallery(browser,opts.out,hz,opts.case=='gallery-combat')) for hz in opts.rates] if opts.case!='live-d' else [('live-d',live_d(browser,opts.out,opts.sodan))]
        for label,result in entries:
            (opts.out/f'{label}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
            print(label,result['status'],result.get('error',''),flush=True)
        browser.close()

if __name__=='__main__':
    main()
