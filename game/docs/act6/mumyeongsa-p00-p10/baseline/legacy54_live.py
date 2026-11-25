"""Walk, place a real old M09, and write/reopen the real 54→55 checkpoint."""
import argparse
import json
import math
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import seeded_context, storage_hash
from second_pass import FOOT, chart, sample_walk

def resume(page,stage,fresh=False,mobile=False):
    if fresh:
        page.goto(base.BASE+"HONRO.html",wait_until="domcontentloaded")
    else:
        page.reload(wait_until="domcontentloaded")
    page.wait_for_function("window.HonroApp && !document.querySelector('[data-startup-title]')",timeout=13000)
    def enter(button):
        (button.tap if mobile else button.click)(timeout=6000)
    enter(base.action(page,"rest"))
    page.wait_for_function("HonroApp.screen==='rest' && !HonroApp.dialogue",timeout=10000)
    enter(page.locator(f'[data-act6-boundary-resume="{stage}"]'))
    page.wait_for_function("stage=>HonroApp.engine?.b?.honroStage===stage",arg=stage,timeout=10000)
    base.dismiss_dialogue(page)

def hold(page,key,condition,arg,timeout=3600):
    page.keyboard.down(key)
    try:
        page.wait_for_function(condition,arg=arg,timeout=timeout)
    finally:
        page.keyboard.up(key)

def m09(page,report,attempt=0):
    for _ in range(3):
        pose=page.evaluate(FOOT)
        if 2336<=pose['x']<=2340 and page.evaluate('HonroApp.engine.active.facing')<0:
            break
        if pose['x']<2341:
            walk_nudge(page,2341,1,9)
        walk_nudge(page,2339,-1,9)
    skill=page.locator('[data-action="combat-skill"][data-skill="M09"]')
    skill.first.click(timeout=3600)
    candidates=page.evaluate("""() => {
      const e=HonroApp.engine,u=e.active,k=HONRO_CORE.SKILLS.M09,results=[];
      const lands=p=>p.terrain==='mid-contact'&&p.x>=2305&&p.x<=u.x-25&&Math.abs(p.y-2924)<1e-7;
      for(let aim=90.625;aim<=109;aim+=.125)for(const power of [.42,.46,.50,.54,.58,.62,.66,.70,.74,.75,.78,.82]){
        const at=q=>e.predict(u,k,aim,power+q,undefined,true),p=at(0);
        if(lands(p)){
          const stable=[.008,.015,.022,.03].filter(q=>lands(at(q))).length;
          results.push({aim,power,x:p.x,y:p.y,score:stable*2-Math.abs(p.x-2309.5)*.25});
        }
      }
      const seen=new Set();
      return results.sort((a,b)=>b.score-a.score).filter(p=>{
        if(seen.has(p.aim))return false;
        seen.add(p.aim);return true;
      }).slice(0,10);
    }""")
    if not candidates:
        raise AssertionError("No native left relay trajectory at this contact")
    aim_power=None
    for target in candidates:
        pose=page.evaluate("()=>({angle:HonroApp.engine.active.angle,facing:HonroApp.engine.active.facing})")
        diff=target["aim"]-pose["angle"]
        if abs(diff)>1.5:
            up=(diff>0)==(pose["facing"]>0)
            hold(page,"ArrowUp" if up else "ArrowDown",
                 "([angle,increase])=>increase?HonroApp.engine.active.angle>=angle-.8:HonroApp.engine.active.angle<=angle+.8",
                 [target["aim"],diff>0])
        for _ in range(4):
            angle=page.evaluate('HonroApp.engine.active.angle')
            if abs(angle-target['aim'])<=.09:
                break
            box=page.locator('#joystick').bounding_box()
            x=box['x']+box['width']*.5
            y=box['y']+box['height']*.5
            increase=angle<target['aim']
            sign=1 if increase==(pose['facing']<0) else -1
            page.mouse.move(x,y)
            page.mouse.down()
            try:
                page.mouse.move(x,y+sign*9)
                page.wait_for_function('([a,up])=>up?HonroApp.engine.active.angle>=a:HonroApp.engine.active.angle<=a',
                                       arg=[target['aim'],increase],polling=8,timeout=1500)
            finally:
                page.mouse.up()
        aim_power=page.evaluate("""([attempt,candidate]) => {
          const e=HonroApp.engine,u=e.active,k=HONRO_CORE.SKILLS.M09;
          const choices=Array.from({length:201},(_,i)=>.42+i*.002);
          choices.sort((a,b)=>Math.abs(a-candidate)-Math.abs(b-candidate));
          if(attempt>0) choices.splice(0,4);
          for (const power of choices){
            if([0,.01,.02,.028].every(delta=>{
              const p=e.predict(u,k,u.angle,power+delta,undefined,true);
              return p.terrain==='mid-contact'&&p.x>=2305&&p.x<=u.x-25&&Math.abs(p.y-2924)<1e-7;
            }))return power;
          }
          return null;
        }""",[attempt,target['power']])
        if aim_power is not None:
            break
    if aim_power is None:
        raise AssertionError('Positioned angles do not give a stable relay tip')
    report["target"]=target
    before=page.evaluate('HonroApp.engine.b.shot')
    page.keyboard.down('Space')
    try:
        page.wait_for_function("""min=>{
          const a=HonroApp,e=a.engine,u=e.active;
          if(!a.charging||a.power<min-.04)return false;
          return [0,.018,.033].every(d=>{
            const p=e.predict(u,HONRO_CORE.SKILLS.M09,u.angle,Math.min(1,a.power+d),undefined,true);
            return p.terrain==='mid-contact'&&p.x>=2305&&p.x<=u.x-25&&Math.abs(p.y-2924)<1e-7;
          });
        }""",arg=aim_power,polling=7,timeout=3500)
    finally:
        page.keyboard.up('Space')
    report["input"]=page.evaluate("()=>({angle:HonroApp.engine.active.angle,power:HonroApp.power,shot:HonroApp.engine.b.shot})")
    report['released']=report['input']['shot']>before
    page.wait_for_function("HonroApp.engine.b.stakes?.some(s=>s.skill==='M09'&&s.shot===HonroApp.engine.b.shot&&s.x<2325)",timeout=9000)
    return {"target":target,"shot":page.evaluate("HonroApp.engine.b.shot"),
            "stakes":page.evaluate("HonroApp.engine.b.stakes")}

def grounded_length(samples):
    return round(sum(math.dist(a[:2],b[:2]) for a,b in zip(samples,samples[1:]) if a[2] and b[2]),2)

def walk_nudge(page,target,direction,distance=14):
    box=page.locator('#joystick').bounding_box()
    x=box['x']+box['width']*.5
    y=box['y']+box['height']*.5
    page.mouse.move(x,y)
    page.mouse.down()
    try:
        page.mouse.move(x+direction*distance,y)
        page.wait_for_function("([x,d])=>HonroApp.engine.b.phase==='won'||(HonroApp.engine.active.x-x)*d>=0",
                               arg=[target,direction],timeout=3500,polling=10)
    finally:
        page.mouse.up()
    page.wait_for_timeout(120)

EAVE_POSE="""() => {
 const a=HonroApp,e=a.engine,u=e.active,b=e.b,k=HONRO_CORE;
 const gravity=k.environmentAt(b.physics,u.x,u.y+u.h/2,true).gravity;
 const ceiling=e.projectileCollision({x:u.x,y:u.y+2},{x:u.x,y:u.y-2},0,u.id,[],false);
 const floor=e.contactSurface(u.x,u.y-3,u.y+4);
 return {stage:b.honroStage,id:u.id,x:u.x,y:u.y,vx:u.vx,vy:u.vy,gravity,grounded:e.grounded(u),
   support:gravity.y<0?ceiling?.terrain?.id??null:floor?.t.id??null,
   normal:gravity.y<0?ceiling?.n??null:floor?{x:0,y:-1}:null,play:[b.width,b.height],
   health:u.hp,focus:u.focus,loadout:u.loadout,equipment:u.equipmentState,
   others:b.units.filter(v=>v!==u&&!v.dead).map(v=>({id:v.id,x:v.x,y:v.y}))};
}"""

def watch_eave(page):
    page.evaluate("""() => {
      const a=HonroApp,e=a.engine,u=e.active,key='mumyeongsa-torn-eave';
      window.eaveFlight=[];
      const watch=()=>{
        if(a.engine!==e||e.b.phase==='won')return;
        if(e.b.terrain.some(t=>t.id==='c-eave-soffit')){
          const field=e.b.physics.regions.some(v=>v.id===key);
          const gravity=HONRO_CORE.environmentAt(e.b.physics,u.x,u.y+(field?1:-1)*u.h/2,true).gravity;
          if(window.eaveFlight.length<950)eaveFlight.push({x:u.x,y:u.y,vy:u.vy,gravity,grounded:e.grounded(u)});
        }
        requestAnimationFrame(watch);
      };
      requestAnimationFrame(watch);
    }""")

def walk_eave(page,out,receiving=False,suffix='',touch_context=None):
    direction='receive' if receiving else 'send'
    page.wait_for_selector(f'[data-act6-torn-eave="{direction}"]',timeout=4500)
    first=page.evaluate(EAVE_POSE)
    if not receiving:
        page.wait_for_function("HonroApp.engine.grounded(HonroApp.engine.active)",timeout=4500)
    page.wait_for_function('HonroApp.canInput()',timeout=5500)
    ceiling=page.evaluate(EAVE_POSE)
    assert ceiling['y']==900 and ceiling['grounded'] and ceiling['support']=='c-eave-soffit'
    assert ceiling['gravity']=={'x':0,'y':-320} and ceiling['normal']=={'x':0,'y':1}
    page.screenshot(path=out/f'eave-{direction}{suffix}-ceiling.png')
    if receiving:
        watch_eave(page)
        hold(page,'ArrowRight',"!HonroApp.engine.b.physics.regions.some(s=>s.id==='mumyeongsa-torn-eave')",None,5500)
        page.wait_for_function("!document.querySelector('[data-act6-torn-eave=receive]')",timeout=5500)
    elif touch_context is not None:
        from mobile_seams import POINTER_EVENTS, move
        page.evaluate(POINTER_EVENTS)
        move(touch_context,page,1,"HonroApp.engine.b.phase==='won'",timeout=8500)
    else:
        hold(page,'ArrowRight',"HonroApp.engine.b.phase==='won'",None,6500)
    exit_pose=page.evaluate(EAVE_POSE)
    if receiving:
        assert [exit_pose['x'],exit_pose['y']]==[928,1136] and exit_pose['support']=='A-upper-veranda',exit_pose
        assert exit_pose['gravity']=={'x':0,'y':320} and exit_pose['grounded'],exit_pose
        assert not ceiling['others'],ceiling
        others={u['id']:u['x'] for u in exit_pose['others']}
        original={'draft-pressure-0':1936,'draft-pressure-1':3456,'draft-pressure-2':5872}
        opening={'a6-56-opening-1':1512,'a6-56-opening-2':2545}
        assert others==original or others=={**original,**opening},exit_pose
    else:
        assert exit_pose['x']==736 and exit_pose['y']==900 and exit_pose['grounded'],exit_pose
    page.screenshot(path=out/f'eave-{direction}{suffix}-exit.png')
    flight=page.evaluate('window.eaveFlight??[]')
    moving=[q for q in flight if q['vy']>0] if receiving else [q for q in flight if q['vy']<0]
    proof={'entry':first,'ceiling':ceiling,'exit':exit_pose,'moving':moving}
    if touch_context is not None:
        proof['touches']=page.evaluate('seamTouches')
        assert len(proof['touches'])>=2 and all(e['trusted'] and e['type']=='touch' for e in proof['touches'])
    return proof

def play54(page,out,results,touch_context=None):
    traces=results.setdefault("traces",{})
    page.wait_for_function('HonroApp.canInput() && HonroApp.engine.grounded(HonroApp.engine.active)',timeout=3500)
    if page.evaluate('HonroApp.engine.active.x')<510:
        traces["N_walk"]=sample_walk(page,1,510)
    x=page.evaluate('HonroApp.engine.active.x')
    for _ in range(4):
        if 547<=x<=552:
            break
        walk_nudge(page,549,1 if x<549 else -1,10)
        x=page.evaluate('HonroApp.engine.active.x')
    page.wait_for_function('HonroApp.engine.grounded(HonroApp.engine.active)',timeout=3000)
    if page.evaluate('HonroApp.engine.active.moveLeft')<520:
        round_id=page.evaluate('HonroApp.engine.b.round')
        page.keyboard.press('f')
        page.wait_for_function('round=>HonroApp.engine.b.round>round&&HonroApp.canInput()',arg=round_id,timeout=12000)
    results["N_nudge"]=page.evaluate(FOOT)
    results["N_L"]=chart(page)
    assert results["N_L"]["changed"],results['N_L']['notice']
    page.keyboard.press('Control')
    traces["L_fall"]=sample_walk(page,-1,2387,limit=2700)
    page.wait_for_function("HonroApp.engine.grounded(HonroApp.engine.active)",timeout=3400)
    traces["L_fall"]["landed"]=page.evaluate(FOOT)
    start=page.evaluate(FOOT)
    for _ in range(4):
        at=page.evaluate(FOOT)
        if 2356<=at['x']<=2362:
            break
        walk_nudge(page,2359,1 if at['x']<2359 else -1,10)
    results['L_nudge']={"before":start,"after":page.evaluate(FOOT)}
    results["L_C"]=chart(page)
    assert results["L_C"]["changed"],results['L_C']['notice']
    results["C_L"]=chart(page)
    assert results["C_L"]["changed"],results['C_L']['notice']
    results['previousRelayAttempts']=[]
    watch_eave(page)
    for attempt in range(3):
        results["relayAttempt"]={}
        try:
            results["relay"]=m09(page,results["relayAttempt"],attempt)
        except Error as error:
            results['previousRelayAttempts'].append({**results['relayAttempt'],'error':str(error),'pose':page.evaluate(FOOT)})
            page.wait_for_function('HonroApp.canInput()&&HonroApp.engine.grounded(HonroApp.engine.active)',timeout=12000)
            hit=page.evaluate("""()=>{const b=HonroApp.engine.b;return b.stakes?.some(s=>s.skill==='M09'&&s.shot===b.shot&&s.x<2325)?
              {shot:b.shot,stakes:b.stakes}:null;}""")
            if not hit:
                if attempt==2:
                    raise
                continue
            results['relay']=hit
        page.screenshot(path=out/"legacy54-m09.png")
        page.wait_for_function("HonroApp.engine.b.phase==='aim' && HonroApp.engine.grounded(HonroApp.engine.active)",timeout=8500)
        traces["L_exit"]=sample_walk(page,-1,2330,1600)
        if page.evaluate("HonroApp.engine.b.phase==='aim'&&HonroApp.engine.active.x>2324"):
            walk_nudge(page,2318,-1,10)
        try:
            page.wait_for_function("HonroApp.engine.b.phase==='won'||document.querySelector('[data-act6-torn-eave=send]')",timeout=2200)
            break
        except Error:
            results['previousRelayAttempts'].append({**results['relayAttempt'],'stakes':results['relay']['stakes'],'exit':traces['L_exit']['end']})
            if attempt==2:
                raise
            walk_nudge(page,2336,1,10)
    if page.locator('[data-act6-torn-eave="send"]').count():
        results['eave54']=walk_eave(page,out,touch_context=touch_context)
    results["won"]=page.evaluate(base.SNAPSHOT)
    advance=page.locator('[data-act6-qa-next="55"]')
    (advance.tap if touch_context is not None else advance.click)(timeout=5000)
    page.wait_for_function("HonroApp.engine?.b?.honroStage===55",timeout=10000)
    results["live55"]=page.evaluate(base.SNAPSHOT)
    page.screenshot(path=out/"legacy54-live55.png")

def run(browser,out,after_live=None):
    context=seeded_context(browser,54)
    page=context.new_page()
    results={"status":"FAIL","traces":{},"errors":[],"warnings":[]}
    traces=results["traces"]
    page.on("pageerror",lambda e:results["errors"].append(str(e)))
    page.on("console",lambda m:results["warnings"].append(m.text) if m.type=="warning" else None)
    try:
        resume(page,54,True)
        results["start"]=page.evaluate(base.SNAPSHOT)
        before=base.saved_bytes(page)
        play54(page,out,results)
        after=base.saved_bytes(page)
        results["writtenSlots"]=[k for k in after if before.get(k)!=after[k]]
        results["afterLiveDigest"]=storage_hash(after)
        assert all("act6-boundary" in k for k in results["writtenSlots"])
        assert len(results["writtenSlots"])==1
        if after_live:
            after_live(page,results,after)
        else:
            resume(page,55)
            results["reload55"]=page.evaluate(base.SNAPSHOT)
            results["afterReloadDigest"]=storage_hash(base.saved_bytes(page))
            assert results["afterReloadDigest"]==results["afterLiveDigest"]
        results["status"]="PASS"
    except (Error,AssertionError) as error:
        results["error"]=str(error) or "Chart/receipt did not advance at the requested contact"
        results["state"]=page.evaluate("()=>({screen:HonroApp.screen,notice:document.querySelector('#notice')?.textContent})")
        if page.evaluate("!!HonroApp.engine"):
            results["stopped"]=page.evaluate(base.SNAPSHOT)
            results["remainingStakes"]=page.evaluate("HonroApp.engine.b.stakes??[]")
        if 'before' in locals():
            results['saveUnchangedAtStop']=before==base.saved_bytes(page)
        page.screenshot(path=out/"legacy54-stopped.png")
    finally:
        results["groundedArclength"]={key:grounded_length(w["points"]) for key,w in traces.items() if w["points"]}
        context.close()
    return results

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build",type=Path,required=True)
    parser.add_argument("--out",type=Path,required=True)
    args=parser.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path="/usr/bin/chromium",headless=True,
            args=["--no-sandbox","--disable-dev-shm-usage"])
        result=run(browser,args.out)
        result["chromium"]=browser.version
        (args.out/"legacy54-live.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
        print(result["status"],result.get("error",""))
        browser.close()

if __name__=="__main__":
    main()
