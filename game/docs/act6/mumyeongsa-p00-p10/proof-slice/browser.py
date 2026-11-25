"""Test B threshold contact and stock projectiles through trusted Game controls."""
import argparse
import json
import math
import sys
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"baseline"))
import browser as baseline
from second_pass import enter

FRAME_DRIVER = """(hz => {
  let handle=0, queue=new Map(), times=[];
  window.bProofFrames=times;
  window.requestAnimationFrame=cb=>{queue.set(++handle,cb);return handle;};
  window.cancelAnimationFrame=id=>queue.delete(id);
  let next=performance.now()+1000/hz;
  function frame(){
    const now=performance.now();
    times.push(now);
    const calls=queue;queue=new Map();
    for(const cb of calls.values())cb(now);
    next=Math.max(next+1000/hz,now+1);
    setTimeout(frame,Math.max(0,next-performance.now()));
  }
  setTimeout(frame,1000/hz);
})(HZ)"""

OBSERVE = """() => {
  const e=HonroApp.engine,b=e.b,events=[];
  window.bProofShots=events;
  const fire=e.fire,impact=e.impact,tick=e.tick,walk=e.walk;
  window.bProofWalks=[];
  window.bProofTicks=[];
  e.tick=function(dt){bProofTicks.push(dt);return tick.call(this,dt);};
  e.walk=function(u,...args){
    const x=u.x,y=u.y,grounded=e.grounded(u),success=walk.call(this,u,...args);
    if(success&&b.honroBProof.chapter===54)bProofWalks.push({id:u.id,grounded,x,y,after:[u.x,u.y]});
    return success;
  };
  e.fire=function(id,angle,power,...rest){
    const actor=e.active;
    const prediction=e.predict(actor,HONRO_CORE.SKILLS[id],angle,power,undefined,true);
    const fired=fire.call(this,id,angle,power,...rest);
    if(fired){
      const p=b.projectiles.find(u=>u.owner===actor.id&&u.shot===b.shot);
      events.push({type:'fire',id,owner:actor.id,angle,power,shot:b.shot,grounded:e.grounded(actor),
        prediction:{x:prediction.x,y:prediction.y,unit:prediction.unit??null,terrain:prediction.terrain??null},
        start:p&&{x:p.x,y:p.y,vx:p.vx,vy:p.vy,gravity:e.acceleration(p)}});
    }
    return fired;
  };
  e.impact=function(p,h){
    const before=h?.unit?.hp;
    const result=impact.call(this,p,h);
    events.push({type:'impact',id:p.skill,owner:p.owner,shot:p.shot,x:h?.x,y:h?.y,
      hit:h?.unit?.id??null,terrain:h?.terrain?.id??null,normal:h?.n??null,
      hpBefore:before??null,hpAfter:h?.unit?.hp??null});
    return result;
  };
}"""

POSES = """() => {
  const e=HonroApp.engine,b=e.b;
  return {phase:b.phase,round:b.round,shot:b.shot,chapter:b.honroBProof.chapter,
    units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,vx:u.vx,vy:u.vy,h:u.h,r:u.r,
      grounded:e.grounded(u),hp:u.hp,move:u.moveLeft,jumping:u.jumping,
      embedded:e.honroBBodyEmbedded(u)??false,
      gravity:HONRO_CORE.environmentAt(b.physics,e.damageAim(u).x,e.damageAim(u).y,true).gravity}))};
}"""

def hold_until(page,key,expression,timeout=4500,arg=None):
    page.keyboard.down(key)
    try:
        page.wait_for_function(expression,timeout=timeout,arg=arg)
    finally:
        page.keyboard.up(key)

def aim_and_fire(page,target,require_terrain=False):
    wish=page.evaluate("""([target,terrain])=>{
      const a=HonroApp,e=a.engine,u=e.active,k=HONRO_CORE.SKILLS.M01;
      const goal=e.unit(target);
      for (const power of [.65,.75,.82,.92]) for(let angle=65;angle<=135;angle+=2){
        const span=[-2,0,2].every(offset=>{
          const p=e.predict(u,k,angle+offset,power,goal,false);
          return terrain?p.terrain==='b-inner-jamb'&&!p.unit:p.unit===target;
        });
        if(span)return {angle,power};
      }
      return null;
    }""",[target,require_terrain])
    if not wish:
        raise AssertionError("No accessible angle in the observed scene")
    for _ in range(5):
        angle=page.evaluate("HonroApp.engine.active.angle")
        delta=wish["angle"]-angle
        if abs(delta)<1.5:
            break
        up=delta>0
        hold_until(page,"ArrowUp" if up else "ArrowDown",
                   "([want,up])=>up?HonroApp.engine.active.angle>=want-0.8:HonroApp.engine.active.angle<=want+0.8",
                   timeout=3100,arg=[wish["angle"],up])
    hold_until(page,"Space","power=>HonroApp.charging&&HonroApp.power>=power",timeout=2500,arg=wish["power"])
    return wish

def run(browser,out,hz,viewport):
    ctx,page,old,errors=enter(browser,53,init_script=FRAME_DRIVER.replace("HZ",str(hz)),proof=True,viewport=viewport)
    proof={"requestHz":hz,"viewport":viewport,"errors":errors}
    try:
        page.evaluate(OBSERVE)
        proof["before"]=page.evaluate(POSES)
        page.screenshot(path=out/f"b-{hz}-entry.png")
        hold_until(page,"ArrowRight","HonroApp.engine.active.x>=460",timeout=4000)
        page.wait_for_function("HonroApp.engine.b.honroBProof.gravityContacts.length===1",timeout=4500)
        proof["firstLand"]=page.evaluate(POSES)
        hold_until(page,"ArrowRight","HonroApp.engine.b.honroBProof.chapter===54",timeout=5000)
        page.wait_for_function("HonroApp.engine.b.honroBProof.gravityContacts.length>=2",timeout=3500)
        proof["seam"]=page.evaluate("HonroApp.engine.b.honroBProof.crossing")
        proof["bothLanded"]=page.evaluate(POSES)
        page.screenshot(path=out/f"b-{hz}-landed.png")
        hold_until(page,"Control","HonroApp.engine.active.x<745",timeout=1200)
        proof["jump"]=page.evaluate(POSES)
        page.wait_for_function("HonroApp.engine.grounded(HonroApp.engine.active)",timeout=4000)
        proof["reLand"]=page.evaluate(POSES)
        page.screenshot(path=out/f"b-{hz}-reland.png")
        proof["playerAim"]=aim_and_fire(page,"b-wall-guard")
        page.wait_for_function("bProofShots.some(o=>o.type==='impact'&&o.owner==='p-mage')",timeout=10000)
        page.screenshot(path=out/f"b-{hz}-impact.png")
        page.wait_for_function("bProofShots.some(o=>o.type==='impact'&&o.owner==='b-wall-guard')",timeout=18000)
        page.wait_for_function("HonroApp.engine.b.phase==='aim' && HonroApp.engine.active.id==='p-mage'",timeout=18000)
        proof["wallAim"]=aim_and_fire(page,"b-wall-guard",require_terrain=True)
        page.wait_for_function("""bProofShots.some(o=>o.type==='impact'&&o.owner==='p-mage'&&o.terrain==='b-inner-jamb')""",
                               timeout=10000)
        proof["end"]=page.evaluate(POSES)
        proof["status"]="PASS"
    except (Error,AssertionError) as error:
        proof["status"]="FAIL"
        proof["error"]=str(error)
        proof["end"]=page.evaluate(POSES)
        page.screenshot(path=out/f"b-{hz}-failure.png")
    finally:
        proof["shots"]=page.evaluate("bProofShots")
        proof["tangentialWalk"]=page.evaluate("bProofWalks")
        proof["contacts"]=page.evaluate("HonroApp.engine.b.honroBProof.gravityContacts")
        proof["clock"]=page.evaluate("""() => {
          const deltas=bProofFrames.slice(1).map((t,i)=>t-bProofFrames[i]).slice(-300).sort((a,b)=>a-b);
          return {medianFrameMs:deltas[Math.floor(deltas.length/2)],frames:deltas.length,solverDt:[...new Set(bProofTicks)]};
        }""")
        proof["normalSaveUnchanged"]=old==baseline.saved_bytes(page)
        if proof["status"]=="PASS":
            try:
                assert proof["firstLand"]["units"][0]["gravity"]=={"x":320,"y":0}
                assert proof["before"]["units"][0]["gravity"]=={"x":0,"y":320}
                assert proof["seam"]["heroSameObject"] and proof["seam"]["before"]["support"]==proof["seam"]["after"]["support"]
                assert proof["seam"]["before"]["x"]==proof["seam"]["after"]["x"]==760
                assert abs(proof["seam"]["before"]["y"]-proof["seam"]["after"]["y"])<=4
                assert all(u["grounded"] and u["gravity"]=={"x":320,"y":0} for u in proof["bothLanded"]["units"])
                assert all(not u["embedded"] for u in proof["bothLanded"]["units"])
                assert not proof["jump"]["units"][0]["grounded"] and proof["reLand"]["units"][0]["grounded"]
                hit=[x for x in proof["shots"] if x["type"]=="impact" and x["hit"]]
                assert {x["hit"] for x in hit}=={"p-mage","b-wall-guard"}
                assert all(e["hpBefore"]>e["hpAfter"] for e in hit)
                shots=[x for x in proof["shots"] if x["type"]=="fire"]
                assert all(x["grounded"] and x["start"]["gravity"]["x"]>0 for x in shots)
                for shot in shots:
                    actual=next(x for x in proof["shots"] if x["type"]=="impact" and x["shot"]==shot["shot"])
                    predicted=shot["prediction"]
                    assert math.dist([predicted["x"],predicted["y"]],[actual["x"],actual["y"]])<=4
                assert any(w["id"]=="b-wall-guard" and w["grounded"] and w["x"]==w["after"][0]
                           for w in proof["tangentialWalk"])
                assert proof["normalSaveUnchanged"] and not proof["errors"]
            except AssertionError as error:
                proof["status"]="FAIL"
                proof["error"]=str(error) or "Contact, impact, or protected save assertion failed"
        ctx.close()
    return proof

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build",type=Path,required=True)
    parser.add_argument("--out",type=Path,required=True)
    parser.add_argument("--hz",type=int,nargs="+",default=[60,120])
    parser.add_argument("--viewport",type=int,nargs=2,default=[1024,720])
    args=parser.parse_args()
    baseline.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    failed=False
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(executable_path="/usr/bin/chromium",headless=True,
            args=["--no-sandbox","--disable-dev-shm-usage"])
        for hz in args.hz:
            try:
                proof=run(browser,args.out,hz,dict(zip(("width","height"),args.viewport)))
            except Error as error:
                proof={"status":"FAIL","error":str(error),"requestHz":hz}
            proof["chromium"]=browser.version
            (args.out/f"b-{hz}.json").write_text(json.dumps(proof,ensure_ascii=False,indent=2)+"\n")
            print(hz,proof["status"],proof.get("error",""),flush=True)
            failed |= proof["status"]!="PASS"
        browser.close()
    if failed:
        sys.exit(1)

if __name__=="__main__":
    main()
