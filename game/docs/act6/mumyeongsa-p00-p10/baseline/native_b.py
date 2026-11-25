"""Play the canonical Damheo route and test the first shared B contact."""
import argparse
import json
import math
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import saved_context, seeded_context
from legacy54_live import hold, play54, resume, walk_nudge
from relay_live_chain import boundary_of, cold_new
from second_pass import FOOT, sample_walk, touch

GUARD='mumyeongsa-b-wall-guard'
FRAME_DRIVER="""(hz=>{
 let id=0,next=performance.now()+1000/hz,queue=new Map();
 window.nativeFrames=[];
 window.requestAnimationFrame=cb=>{queue.set(++id,cb);return id;};
 window.cancelAnimationFrame=n=>queue.delete(n);
 function tick(){
   const now=performance.now(),calls=queue;queue=new Map();nativeFrames.push(now);
   for(const cb of calls.values())cb(now);
   next=Math.max(next+1000/hz,now+1);setTimeout(tick,Math.max(0,next-performance.now()));
 }
 setTimeout(tick,1000/hz);
})(HZ)"""
POSE="""() => {
 const e=HonroApp.engine,u=e.active,b=e.b;
 const a=b.units.find(u=>u.cls==='mage'&&u.side===0);
 const gravity=HONRO_CORE.environmentAt(b.physics,a.x-a.h*.5,a.y,true).gravity;
 const actionReason=document.querySelector('#combat-action-reason')?.textContent??null;
 return {stage:b.honroStage,round:b.round,phase:b.phase,active:u.id,gravity,enemyLimit:b.enemyLimit,queue:b.queue,actionReason,
   actors:b.units.map(v=>{
     const wall=gravity.x!==0&&e.grounded(v)&&e.projectileCollision({x:v.x-2,y:v.y},{x:v.x+2,y:v.y},0,v.id,[],false);
     const embedded=gravity.x!==0&&b.terrain.some(t=>!t.oneWay&&HONRO_CORE.terrainRectIntersects(t,v.x-v.h+.1,v.y-v.r+.1,v.h-.2,v.r*2-.2,.1));
     return {id:v.id,x:v.x,y:v.y,vx:v.vx,vy:v.vy,hp:v.hp,dead:v.dead,embedded,
        grounded:e.grounded(v),support:wall?.terrain?.id??e.contactSurface(v.x,v.y-4,v.y+5)?.t.id??null};
   })};
}"""
DUMMY_MASKS="""() => {
 const b=HonroApp.engine.b;
 const asset=b.honroLandmarks.find(v=>v.asset?.id==='mumyeongsa-broken-rail').asset;
 const key=points=>JSON.stringify(points.map(p=>[p.x,p.y]).sort(([x,y],[a,z])=>x-a||y-z));
 const paint=new Set(asset.visual.map(p=>key(p.points)));
 const side=t=>t.id.startsWith('b-dummy-');
 return b.honroWorldTerrain.filter(side).map(t=>{
  const points=HONRO_CORE.poly(t),play=b.terrain.find(s=>s.id===t.id);
  const mask=key(points);
  return {id:t.id,points,exactPaint:paint.has(mask),exactCollision:!!play&&key(HONRO_CORE.poly(play))===mask};
 });
}"""

def aim(page,spec,world=False):
    for _ in range(4):
        state=page.evaluate("()=>({angle:HonroApp.engine.active.angle,facing:HonroApp.engine.active.facing})")
        delta=spec['angle']-state['angle']
        if abs(delta)<.8:
            break
        increase=delta>0
        up=increase==(world or state['facing']>=0)
        hold(page,"ArrowUp" if up else "ArrowDown",
             "([want,inc])=>inc?HonroApp.engine.active.angle>=want-.55:HonroApp.engine.active.angle<=want+.55",
             [spec['angle'],increase],4500)
    hold(page,"Space","power=>HonroApp.charging&&HonroApp.power>=power",spec["power"],4000)
    return spec

def m09_hall(page):
    walk_nudge(page,2627,-1)
    page.locator('[data-action="combat-skill"][data-skill="M09"]').first.click(timeout=5000)
    spec=page.evaluate("""() => {
      const e=HonroApp.engine,u=e.active,s=HONRO_CORE.SKILLS.M09;
      const hit=(a,p)=>{const z=e.predict(u,s,a,p,undefined,true);return z.terrain==='upper-threshold-footing'&&z.x>=2458&&z.x<=2592;};
      for(const power of [.62,.74,.50,.86,.38])for(let angle=95;angle<=260;angle++){
        if([-.9,0,.9].every(d=>[0,.025].every(k=>hit(angle+d,power+k))))return {angle,power};
      }
      return null;
    }""")
    assert spec,'No supported M09 forecast in the upper room'
    aim(page,spec)
    page.wait_for_function("HonroApp.engine.b.stakes?.some(s=>s.skill==='M09'&&s.shot>0&&s.x>=2450&&s.x<=2600)",timeout=9000)
    page.wait_for_function("HonroApp.canInput()",timeout=18000)
    return {"input":spec,"stakes":page.evaluate("HonroApp.engine.b.stakes")}

def wall_trace(page):
    page.evaluate("""() => {
      const e=HonroApp.engine, fire=e.fire, impact=e.impact, walk=e.walk,tick=e.tick,results=[];
      window.nativeWall=results;
      window.nativeSolverSteps=new Set();window.nativeWallWalk=[];
      e.tick=function(dt){nativeSolverSteps.add(dt);return tick.call(this,dt);};
      e.walk=function(u,...args){
        const x=u.x,y=u.y,grounded=e.grounded(u),result=walk.call(this,u,...args);
        if(result&&u.x===x&&u.y!==y)nativeWallWalk.push({id:u.id,x,y,to:u.y,grounded});
        return result;
      };
      e.fire=function(id,angle,power,...args){
        const u=e.active, k=HONRO_CORE.SKILLS[id],p=e.predict(u,k,angle,power,undefined,true);
        const q=fire.call(this,id,angle,power,...args),live=e.b.projectiles.find(v=>v.shot===e.b.shot&&v.owner===u.id);
        if(q)results.push({event:'fire',skill:id,angle,power,actor:u.id,grounded:e.grounded(u),x:u.x,y:u.y,
          prediction:{x:p.x,y:p.y,unit:p.unit??null,terrain:p.terrain??null},
          shot:e.b.shot,gravity:live?e.acceleration(live):null});
        return q;
      };
      e.impact=function(p,h){
        const before=h?.unit?.hp,shieldBefore=h?.unit?.shield,result=impact.call(this,p,h);
        results.push({event:'impact',skill:p.skill,actor:p.owner,target:h?.unit?.id??null,
          terrain:h?.terrain?.id??null,x:h?.x,y:h?.y,normal:h?.n,radius:p.radius,
          shot:p.shot,before,after:h?.unit?.hp,shieldBefore,shieldAfter:h?.unit?.shield});
        return result;
      };
    }""")

def walk_fork(page,start,face,branch_end,join,obstacle=None):
    before=sample_walk(page,1,start,7500)
    assert before['reached'],before['end']
    page.keyboard.press('Control')
    page.wait_for_function("""id=>{
      const e=HonroApp.engine,u=e.active;
      return e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id===id;
    }""",arg=face,timeout=5000)
    landing=page.evaluate(FOOT)
    if obstacle:
        stop=sample_walk(page,1,obstacle,4500)
        assert stop['reached'],stop['end']
        page.keyboard.press('Control')
    branch=sample_walk(page,1,branch_end,4800)
    assert branch['reached'],branch['end']
    page.wait_for_function("HonroApp.engine.grounded(HonroApp.engine.active)",timeout=4000)
    end=sample_walk(page,1,join,4800)
    assert end['reached'] and end['end']['grounded'],end['end']
    return {'entry':before['end'],'branch':landing,'end':branch['end'],'join':end['end']}

def touch_probe(browser,out,stage,records=None):
    ctx=saved_context(browser,records,mobile=True) if records else seeded_context(browser,stage,mobile=True)
    try:
        page=ctx.new_page()
        resume(page,stage,True,mobile=True)
        page.wait_for_function('HonroApp.canInput()')
        touch_id=ctx.new_cdp_session(page)
        page.evaluate("""() => {
          window.act6Touches=[];
          for(const type of ['pointerdown','pointerup'])document.addEventListener(type,event=>{
            const control=event.target.closest('#joystick,#jump');
            if(control)act6Touches.push({type,trusted:event.isTrusted,pointer:event.pointerType,control:control.id});
          },true);
        }""")
        first=page.evaluate(POSE)
        pad=page.locator('#joystick').bounding_box()
        x,y=pad['x']+pad['width']/2,pad['y']+pad['height']/2
        touch(page,touch_id,x,y,'touchStart')
        touch(page,touch_id,x+28,y,'touchMove')
        page.wait_for_timeout(350)
        touch(page,touch_id,x+28,y,'touchEnd')
        step=page.evaluate(POSE)
        assert step['actors'][0]['y']<first['actors'][0]['y'] if stage==54 else step['actors'][0]['x']>first['actors'][0]['x']
        page.locator('#jump').tap(timeout=5000)
        page.wait_for_function('HonroApp.engine.active.jumping',timeout=3000)
        jump=page.evaluate(POSE)
        page.wait_for_function('HonroApp.engine.grounded(HonroApp.engine.active)',timeout=4400)
        land=page.evaluate(POSE)
        events=page.evaluate('act6Touches')
        assert len(events)>=4 and all(r['trusted'] and r['pointer']=='touch' for r in events)
        page.screenshot(path=out/f'native-{stage}-touch.png')
        return {'first':first,'step':step,'jump':jump,'land':land,'events':events}
    finally:
        ctx.close()

def finish_wall(page,report,spirit=False):
    wall_trace(page)
    page.keyboard.press('Control')
    page.wait_for_function("HonroApp.engine.active.jumping",timeout=2500)
    report['jump']=page.evaluate(POSE)
    page.wait_for_function("HonroApp.engine.grounded(HonroApp.engine.active)",timeout=4000)
    report['reland']=page.evaluate(POSE)
    foot=page.evaluate('HonroApp.engine.active.y')
    hold(page,'ArrowRight','y=>HonroApp.engine.active.y<y',foot-15,3600)
    page.keyboard.press('f')
    page.wait_for_function("nativeWall.some(v=>v.event==='fire'&&v.actor==='mumyeongsa-b-wall-guard')",timeout=17000)
    page.wait_for_function("HonroApp.canInput()",timeout=16000)
    if spirit:
        page.locator('[data-act6-sodan-spirit]').click(timeout=6000)
        page.wait_for_function("nativeWall.some(v=>v.event==='impact'&&v.actor==='p-occultist'&&v.skill==='O06'&&v.target==='mumyeongsa-b-wall-guard')",timeout=12000)
        page.wait_for_function("HonroApp.canInput()",timeout=20000)
        report['spirit54']=page.evaluate("nativeWall.filter(v=>v.actor==='p-occultist')")
        assert page.evaluate("!HonroApp.engine.b.units.some(u=>u.id==='p-occultist') && !HonroApp.engine.b.projectiles.length")
    report['attacks']=[]
    for _ in range(8):
        if page.evaluate(f"HonroApp.engine.unit('{GUARD}').dead"):
            break
        spec=page.evaluate("""target=>{
          const a=HonroApp,e=a.engine,u=e.active,v=e.unit(target),s=HONRO_CORE.SKILLS.M01;
          const angles=[...Array.from({length:55},(_,i)=>48+i*2),...Array.from({length:89},(_,i)=>-86+i*4)];
          for(const power of [.78,.65,.9,.52,.39])for(const angle of angles){
            if([-.8,0,.8].every(d=>[0,.025].every(k=>e.predict(u,s,angle+d,power+k,v,false).unit===target)))
              return {angle,power};
          }
          return null;
        }""",GUARD)
        if not spec:
            foot=page.evaluate('HonroApp.engine.active.y')
            if foot<425:
                hold(page,'ArrowLeft','y=>HonroApp.engine.active.y>=y',foot+60,3400)
            else:
                hold(page,'ArrowRight','y=>HonroApp.engine.active.y<=y',foot-60,3400)
            continue
        page.keyboard.press('1')
        report['attacks'].append(aim(page,spec,world=True))
        page.wait_for_function("HonroApp.canInput()",timeout=20000)
    assert page.evaluate(f"HonroApp.engine.unit('{GUARD}').dead")
    try:
        hold(page,'ArrowRight',"HonroApp.engine.b.width===3200",None,3400)
    except Error:
        page.keyboard.press('Control')
        page.wait_for_function('HonroApp.engine.active.x<3155',timeout=3600)
        report['bypass']=page.evaluate(POSE)
        hold(page,'ArrowRight',"HonroApp.engine.b.width===3200",None,10800)
    report['ordinary54']=page.evaluate(POSE)
    assert report['ordinary54']['gravity']=={'x':0,'y':320}

def run(browser,out,hz,forks=False,mobile=False,spirit=False,spirit53=False,session=None,on_54=None,touch_c=False):
    ctx,page=session if session else (seeded_context(browser,53,mobile=touch_c,init_script=FRAME_DRIVER.replace('HZ',str(hz))),None)
    if page is None:
        page=ctx.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('console',lambda line:errors.append(line.text) if line.type in ('warning','error') else None)
    report={'status':'FAIL','requestHz':hz,'errors':errors,'walk':[]}
    try:
        if session is None:
            resume(page,53,True,mobile=touch_c)
        else:
            base.dismiss_dialogue(page)
        page.wait_for_function("HonroApp.canInput()")
        normal=base.saved_bytes(page)['honro-first-act-profile-1']
        report['start']=page.evaluate(POSE)
        page.evaluate("window.originalDamheo=HonroApp.engine.active")
        page.screenshot(path=out/'native-53-start.png')
        if forks:
            report['fork53']=[walk_fork(page,866,'library-balcony',1390,1490,1010),
                               walk_fork(page,1720,'sanctuary-beam',2140,2270)]
            assert all(x['join']['support']=='south' for x in report['fork53'])
        for target in ((2540,2660) if forks else (770,1150,1600,2010,2540,2660)):
            seg=sample_walk(page,1,target,5000)
            assert seg['reached'],seg['end']
            seg['length']=sum(math.dist(a[:2],b[:2]) for a,b in zip(seg['points'],seg['points'][1:]) if a[2] and b[2])
            report['walk'].append(seg)
            if spirit53 and target==1150:
                wall_trace(page)
                page.locator('[data-act6-sodan-spirit]').click(timeout=6000)
                page.wait_for_function("""nativeWall.some(v=>v.event==='impact'&&v.actor==='p-occultist'&&v.skill==='O06'&&v.target&&v.after<v.before)""",timeout=15000)
                page.wait_for_function('HonroApp.canInput()',timeout=26000)
                report['spirit53']=page.evaluate("nativeWall.filter(v=>v.actor==='p-occultist')")
        assert sum(q['length'] for q in report['walk'])>1.8*90.46
        page.screenshot(path=out/'native-53-upper-rail.png')
        page.locator('[data-act6-qa-lookout]').click(timeout=3000)
        page.wait_for_function("HonroApp.engine.active.y<600",timeout=3500)
        report['m09']=m09_hall(page)
        report['bank']=sample_walk(page,1,2940,6000)
        page.wait_for_function("HonroApp.engine.active.x===3240&&HonroApp.canInput()",timeout=5000)
        report['wall53']=page.evaluate(POSE)
        report['dummies53']=page.evaluate(DUMMY_MASKS)
        page.screenshot(path=out/'native-53-b-wall.png')
        hold(page,'ArrowRight',"HonroApp.engine?.b.honroStage===54",None,11000)
        report['live54']=page.evaluate(POSE)
        report['dummies54']=page.evaluate(DUMMY_MASKS)
        assert report['dummies53']==report['dummies54'] and len(report['dummies54'])==4
        assert all(q['exactPaint'] and q['exactCollision'] for q in report['dummies54'])
        assert page.evaluate("HonroApp.engine.active===originalDamheo"),'Found a replacement Damheo object'
        record=base.saved_bytes(page)
        if on_54:
            on_54(54)
        report['to54']=boundary_of(record)
        report['newContext54']=cold_new(browser,record,54)
        page.wait_for_function("HonroApp.engine.b.units.every(u=>HonroApp.engine.grounded(u))",timeout=6000)
        report['guardContact']=page.evaluate(POSE)
        assert all(u['grounded'] and u['support']=='b-inner-jamb' and not u['embedded'] for u in report['guardContact']['actors'])
        assert not report['guardContact']['actionReason'].startswith('지형에 걸림')
        page.screenshot(path=out/'native-54-both-contact.png')
        finish_wall(page,report,spirit)
        page.screenshot(path=out/'native-54-foothill.png')
        report['wallTrace']=page.evaluate('window.nativeWall')
        report['wallWalk']=page.evaluate('window.nativeWallWalk')
        wall_hits=[row for row in report['wallTrace'] if row['event']=='impact' and row['target'] and row['actor']!='p-occultist']
        wall_fires={row['shot']:row for row in report['wallTrace'] if row['event']=='fire' and row['actor']!='p-occultist'}
        assert {'p-mage',GUARD}<={row['target'] for row in wall_hits}
        assert all(row['grounded'] and row['gravity']['x']>0 for row in wall_fires.values())
        for hit in wall_hits:
            prediction=wall_fires[hit['shot']]['prediction']
            assert prediction['unit']==hit['target'] and math.dist((prediction['x'],prediction['y']),(hit['x'],hit['y']))<2
        damaging={row['target'] for row in wall_hits if row['after']<row['before'] or row['shieldAfter']<row['shieldBefore']}
        assert {'p-mage',GUARD}<=damaging,wall_hits
        expected={GUARD} if spirit else {'p-mage',GUARD}
        assert expected<={row['id'] for row in report['wallWalk'] if row['grounded']}
        if page.locator('[data-act6-qa-lookout]').is_disabled():
            if forks:
                report['fork54']=[walk_fork(page,705,'gallery-outer-balcony',948,1015),
                                  walk_fork(page,1120,'gallery-observation-beam',1343,1413)]
                assert all(x['join']['support']=='foothill' for x in report['fork54'])
            reports=[]
            if not forks:
                reports.append(sample_walk(page,1,1395,10000))
            reports.append(sample_walk(page,-1,550,8000))
            report['gallery']=reports
            assert all(r['reached'] for r in report['gallery'])
            assert page.locator('[data-act6-qa-lookout]').is_enabled()
        play54(page,out,report,touch_context=ctx if touch_c else None)
        after=base.saved_bytes(page)
        report['ordinarySaveUnchanged']=after['honro-first-act-profile-1']==normal
        assert report['ordinarySaveUnchanged']
        report['to55']=boundary_of(after)
        report['newContext55']=cold_new(browser,after,55)
        if mobile:
            report['touch53']=touch_probe(browser,out,53)
            report['touch54']=touch_probe(browser,out,54,record)
        report['status']='PASS'
    except (Error,AssertionError) as error:
        report['error']=str(error)
        if page.evaluate("!!HonroApp.engine"):
            report['last']=page.evaluate(POSE)
            page.screenshot(path=out/'native-b-failure.png')
    finally:
        report['attackTrace']=page.evaluate("window.nativeWall??[]")
        report['clock']=page.evaluate("""()=>{
          const delta=nativeFrames.slice(1).map((t,i)=>t-nativeFrames[i]).sort((a,b)=>a-b);
          return {medianMs:delta[Math.floor(delta.length/2)],solverSteps:[...window.nativeSolverSteps??[]]};
        }""")
        if session is None:
            ctx.close()
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build',required=True,type=Path)
    parser.add_argument('--out',required=True,type=Path)
    parser.add_argument('--hz',type=int,choices=[60,120],default=60)
    parser.add_argument('--forks',action='store_true')
    parser.add_argument('--mobile',action='store_true')
    parser.add_argument('--touch-c',action='store_true')
    parser.add_argument('--spirit',action='store_true')
    parser.add_argument('--spirit53',action='store_true')
    args=parser.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        with pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']) as browser:
            result=run(browser,args.out,args.hz,args.forks,args.mobile,args.spirit,args.spirit53,touch_c=args.touch_c)
    (args.out/'native-b.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(result['status'],result.get('error',''),flush=True)
    raise SystemExit(0 if result['status']=='PASS' else 1)
