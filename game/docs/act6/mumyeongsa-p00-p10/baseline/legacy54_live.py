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
    hold(page,"Space","power=>HonroApp.charging&&HonroApp.power>=power",target["power"])
    report["input"]=page.evaluate("()=>({angle:HonroApp.engine.active.angle,power:HonroApp.power,shot:HonroApp.engine.b.shot})")
    page.wait_for_function("HonroApp.engine.b.stakes?.some(s=>s.skill==='M09'&&s.y===2930)",timeout=9000)
    return {"target":target,"shot":page.evaluate("HonroApp.engine.b.shot"),
            "stakes":page.evaluate("HonroApp.engine.b.stakes")}

def grounded_length(samples):
    return round(sum(math.dist(a[:2],b[:2]) for a,b in zip(samples,samples[1:]) if a[2] and b[2]),2)

def run(browser,out):
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
        traces["N_walk"]=sample_walk(page,1,538)
        results["N_L"]=chart(page)
        assert results["N_L"]["changed"]
        traces["L_fall"]=sample_walk(page,-1,2450)
        page.wait_for_function("HonroApp.engine.grounded(HonroApp.engine.active)",timeout=3400)
        traces["L_fall"]["landed"]=page.evaluate(FOOT)
        traces["L_sill"]=sample_walk(page,-1,2370)
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
        resume(page,55)
        results["reload55"]=page.evaluate(base.SNAPSHOT)
        results["afterReloadDigest"]=storage_hash(base.saved_bytes(page))
        assert results["afterReloadDigest"]==results["afterLiveDigest"]
        assert all("act6-boundary" in k for k in results["writtenSlots"])
        assert len(results["writtenSlots"])==1
        results["status"]="PASS"
    except (Error,AssertionError) as error:
        results["error"]=str(error) or "Chart/receipt did not advance at the requested contact"
        results["state"]=page.evaluate("()=>({screen:HonroApp.screen,notice:document.querySelector('#notice')?.textContent})")
        if page.evaluate("!!HonroApp.engine"):
            results["stopped"]=page.evaluate(base.SNAPSHOT)
            results["remainingStakes"]=page.evaluate("HonroApp.engine.b.stakes??[]")
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
