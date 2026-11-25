"""Walk, place a real old M09, and write/reopen the real 54→55 checkpoint."""
import argparse
import json
import math
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import seeded_context, storage_hash
from second_pass import FOOT, chart, sample_walk

def resume(page,stage,fresh=False):
    if fresh:
        page.goto(base.BASE+"HONRO.html",wait_until="domcontentloaded")
    else:
        page.reload(wait_until="domcontentloaded")
    page.wait_for_function("window.HonroApp && !document.querySelector('[data-startup-title]')",timeout=13000)
    base.action(page,"rest").click(timeout=6000)
    page.wait_for_function("HonroApp.screen==='rest' && !HonroApp.dialogue",timeout=10000)
    page.locator(f'[data-act6-boundary-resume="{stage}"]').click(timeout=6000)
    page.wait_for_function("stage=>HonroApp.engine?.b?.honroStage===stage",arg=stage,timeout=10000)
    base.dismiss_dialogue(page)

def hold(page,key,condition,arg,timeout=3600):
    page.keyboard.down(key)
    try:
        page.wait_for_function(condition,arg=arg,timeout=timeout)
    finally:
        page.keyboard.up(key)

def m09(page,report):
    skill=page.locator('[data-action="combat-skill"][data-skill="M09"]')
    skill.first.click(timeout=3600)
    target=page.evaluate("""() => {
      const e=HonroApp.engine,u=e.active,k=HONRO_CORE.SKILLS.M09;
      const fits=[];
      for (const power of [.75,.64,.53,.42,.28,.82]) for(let aim=91;aim<=106;aim+=.25){
        const p=e.predict(u,k,aim,power,undefined,true);
        const contact=e.contactSurface(p.x,p.y-6,p.y+13);
        if(p.terrain==='mid-contact'&&p.x>=2290&&p.x<=2312&&contact?.y===2930)
          fits.push({aim,power,x:p.x,y:p.y,score:Math.abs(p.x-2304)+Math.abs(aim-91)*3});
      }
      return fits.sort((a,b)=>a.score-b.score)[0]??null;
    }""")
    if not target:
        raise AssertionError("No native left relay trajectory at this contact")
    report["target"]=target
    pose=page.evaluate("()=>({angle:HonroApp.engine.active.angle,facing:HonroApp.engine.active.facing})")
    diff=target["aim"]-pose["angle"]
    if abs(diff)>1.5:
        up=(diff>0)==(pose["facing"]>0)
        hold(page,"ArrowUp" if up else "ArrowDown",
             "([angle,increase])=>increase?HonroApp.engine.active.angle>=angle-.8:HonroApp.engine.active.angle<=angle+.8",
             [target["aim"],diff>0])
    for _ in range(4):
        angle=page.evaluate('HonroApp.engine.active.angle')
        if abs(angle-target['aim'])<=.23:
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
    aim_power=page.evaluate("""() => {
      const e=HonroApp.engine,u=e.active,k=HONRO_CORE.SKILLS.M09;
      for (const power of [.74,.71,.77,.68,.64,.59,.81]){
        if([0,.01,.022].every(delta=>{
          const p=e.predict(u,k,u.angle,power+delta,undefined,true);
          return p.terrain==='mid-contact'&&p.x>=2300&&p.x<=2312;
        }))return power;
      }return null;
    }""")
    if aim_power is None:
        raise AssertionError('Positioned angle does not give a stable relay tip')
    hold(page,"Space","power=>HonroApp.charging&&HonroApp.power>=power",aim_power)
    report["input"]=page.evaluate("()=>({angle:HonroApp.engine.active.angle,power:HonroApp.power,shot:HonroApp.engine.b.shot})")
    page.wait_for_function("HonroApp.engine.b.stakes?.some(s=>s.skill==='M09'&&s.x<2325)",timeout=9000)
    return {"target":target,"shot":page.evaluate("HonroApp.engine.b.shot"),
            "stakes":page.evaluate("HonroApp.engine.b.stakes")}

def grounded_length(samples):
    return round(sum(math.dist(a[:2],b[:2]) for a,b in zip(samples,samples[1:]) if a[2] and b[2]),2)

def walk_nudge(page,target,direction):
    box=page.locator('#joystick').bounding_box()
    x=box['x']+box['width']*.5
    y=box['y']+box['height']*.5
    page.mouse.move(x,y)
    page.mouse.down()
    try:
        page.mouse.move(x+direction*14,y)
        page.wait_for_function('([x,d])=>(HonroApp.engine.active.x-x)*d>=0',arg=[target,direction],timeout=3500,polling=10)
    finally:
        page.mouse.up()
    page.wait_for_timeout(120)

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
        traces["N_walk"]=sample_walk(page,1,510)
        x=page.evaluate('HonroApp.engine.active.x')
        if not 548<=x<=554:
            walk_nudge(page,550,1 if x<550 else -1)
        results["N_nudge"]=page.evaluate(FOOT)
        results["N_L"]=chart(page)
        assert results["N_L"]["changed"]
        page.keyboard.press('Control')
        traces["L_fall"]=sample_walk(page,-1,2387,limit=2700)
        page.wait_for_function("HonroApp.engine.grounded(HonroApp.engine.active)",timeout=3400)
        traces["L_fall"]["landed"]=page.evaluate(FOOT)
        at=page.evaluate(FOOT)
        if at['x']>2362:
            walk_nudge(page,2360,-1)
        results['L_nudge']={"before":at,"after":page.evaluate(FOOT)}
        results["L_C"]=chart(page)
        assert results["L_C"]["changed"]
        results["C_L"]=chart(page)
        assert results["C_L"]["changed"]
        results["relayAttempt"]={}
        results["relay"]=m09(page,results["relayAttempt"])
        page.screenshot(path=out/"legacy54-m09.png")
        page.wait_for_function("HonroApp.engine.b.phase==='aim' && HonroApp.engine.grounded(HonroApp.engine.active)",timeout=8500)
        traces["L_exit"]=sample_walk(page,-1,2324,1600)
        page.wait_for_function("HonroApp.engine.b.phase==='won'",timeout=5000)
        results["won"]=page.evaluate(base.SNAPSHOT)
        page.locator('[data-act6-qa-next="55"]').click(timeout=5000)
        page.wait_for_function("HonroApp.engine?.b?.honroStage===55",timeout=10000)
        results["live55"]=page.evaluate(base.SNAPSHOT)
        page.screenshot(path=out/"legacy54-live55.png")
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
