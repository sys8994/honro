"""Targeted Act 5 viewport/physics checks in separate Chromium profiles.

The approach and saved snapshots are prepared. Drop, rope and rush use the
normal controls, and the browser's real physics does the subsequent travel.
"""
import argparse
import json
from contextlib import nullcontext
from pathlib import Path

from browser_support import launch, serve_game
from playwright.sync_api import sync_playwright


SETUP = """async id=>{
 const a=HonroApp,C=HONRO_CORE,p=HonroProfileStore.fresh();
 a.stopBattle();a.close();a.profile=a.normalProfile=p;
 p.party=p.recruited=[...C.CLASS_IDS];
 for(let n=1;n<id;n++)p.cleared[n]={visits:1,rounds:16};
 for(const cls of p.party){
  const h=p.heroes[cls];h.xp=HonroProgression.budget(id).start;
  if(cls==='knight'){
   function train(key){const t=C.TALENT_MAP[key];if(t?.prereq&&!h.ranks[t.prereq])train(t.prereq);C.train(h,key);}
   train('S06');p.loadouts[cls]=['S01','S06'];
  }
  C.autoTrain(h,cls);C.sanitizeLoadout(p,cls);
 }
 Object.assign(p.settings,{sound:false,music:false,speed:1,playerSpeed:1});
 await HonroCampaignLoader.ensureStage(id);a.launch(id);
}"""

POSE = """({cls,x,y})=>{
 const a=HonroApp,e=a.engine,b=e.b,u=e.heroesAlive().find(v=>v.cls===cls);
 const p=HonroMapEngine.surfaceY(b.terrain,x,y);
 if(!p||Math.abs(p.y-y)>105)throw Error('Fixture support missing');
 a.selectHero(u.id);
 Object.assign(u,{x,y:p.y,vx:0,vy:0,airborne:false,jumping:false});
 delete u.moveTarget;delete u.platformDrop;delete u.fallApexY;
 a.scene.x=x;a.scene.y=p.y-125;a.scene.manual=false;
 a.updateHUD(true);
 return {x,y:p.y,hp:u.hp,support:e.contactSurface(x,p.y-4,p.y+4)?.t.id};
}"""

STATE = """cls=>{
 const e=HonroApp.engine,u=e.b.units.find(v=>v.id==='p-'+cls);
 return {x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,support:e.contactSurface(u.x,u.y-3,u.y+3)?.t.id};
}"""

SNAPSHOT = """()=>{
 const a=HonroApp,b=a.engine.b;
 return {session:b.session,round:b.round,active:b.active,design:b.honroMap.act5,
  actors:b.units.map(u=>[u.id,u.hp,u.x,u.y,!!u.dead]),step:b.honroState.act5.step};
}"""


def dismiss_dialogue(page):
    for _ in range(20):
        if page.evaluate("!!HonroApp.dialogue"):
            buttons = page.locator('[data-action="dialogue-skip"],[data-action="dialogue-next"]').first
            buttons.click()
        elif page.evaluate("HonroApp.canInput()"):
            break
        page.wait_for_timeout(120)
    page.wait_for_function("HonroApp.canInput()")


def stage(page, chapter):
    page.evaluate(SETUP, chapter)
    page.wait_for_function("id=>HonroApp.engine?.b.honroStage===id", arg=chapter)
    dismiss_dialogue(page)


def pose(page, cls, x, y):
    return page.evaluate(POSE, {"cls": cls, "x": x, "y": y})


def drop_and_rope(page):
    stage(page, 46)
    assert page.evaluate("""()=>{
      const links=HonroApp.engine.b.honroMap.act5.links;
      return links.length===32&&new Set(links.map(v=>v.label)).size===32&&links.every((a,i)=>links.slice(i+1)
       .every(b=>Math.hypot(a.x-b.x,a.y-b.y)>65));
    }""")
    before = pose(page, "mage", 1315, 1932)
    page.locator("#drop").click()
    page.wait_for_function("""()=>{
      const a=HonroApp,u=a.engine.active;
      return u.cls==='mage'&&u.y>2600&&u.y<2700&&a.engine.grounded(u)&&a.canInput();
    }""")
    lower = page.evaluate(STATE, "mage")
    assert lower["y"] > before["y"]
    page.locator('[data-context-interact="a5-cross-19"]').wait_for()
    page.keyboard.down("KeyD")
    try:
        rope = page.locator('[data-context-interact="a5-cross-20"]')
        page.wait_for_function("HonroApp.engine.active.x>1346 && HonroApp.engine.active.x<1410", timeout=4000)
    finally:
        page.keyboard.up("KeyD")
    rope.wait_for(timeout=4000)
    assert rope.is_enabled()
    page.keyboard.press("KeyE")
    page.wait_for_function("HonroApp.engine.active.y<2000&&HonroApp.engine.grounded(HonroApp.engine.active)")
    after = page.evaluate(STATE, "mage")
    assert after["y"] == before["y"] and after["move"] <= before_move(page) - 150
    eastern = pose(page,"mage",953*4,782*4)
    east_rope=page.locator('[data-context-interact="a5-cross-30"]')
    east_rope.wait_for(timeout=4000)
    assert east_rope.is_enabled()
    page.keyboard.press("KeyE")
    page.wait_for_function("HonroApp.engine.active.y===1948&&HonroApp.engine.grounded(HonroApp.engine.active)")
    east_return=page.evaluate(STATE,"mage")
    assert east_return["support"]=="a5-far-rim" and east_return["hp"]==eastern["hp"]
    return {"drop": lower, "return": after, "eastReturn": east_return}


def before_move(page):
    return page.evaluate("HonroApp.engine.active.maxMove")


def observe_fall(page, cls):
    page.evaluate("""cls=>{
      const e=HonroApp.engine,orig=e.recover.bind(e);
      window.routeRecovery=[];
      e.recover=u=>{
       const fall={x:u.x,y:u.y,hp:u.hp};
       const result=orig(u);
       if(u.id==='p-'+cls)routeRecovery.push({fall,back:{x:u.x,y:u.y,hp:u.hp}});
       return result;
      };
    }""", cls)


def stairs_and_fall(page, chapter):
    stage(page, chapter)
    index, expected = (2, "징검길") if chapter == 49 else (0, "석교")
    crossing = page.evaluate("index=>HonroApp.engine.b.honroMap.act5.links.find(v=>v.id==='a5-cross-'+index)", index)
    pose(page, "knight", crossing["x"], crossing["y"])
    blocked = page.evaluate("""index=>{
      const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(v=>v.id==='a5-cross-'+index);
      return HonroAct5.eligibility(a,m);
    }""", index)
    assert not blocked["ok"] and expected in blocked["reason"], blocked
    x, y, angle = (4021, 4880, 18) if chapter == 49 else (6286, 1976, -10)
    before = pose(page, "knight", x, y)
    page.wait_for_function("x=>HonroApp.engine.b.honroState.act5.safeSupports['p-knight']?.x===x", arg=x)
    observe_fall(page, "knight")
    slot = page.evaluate("HonroApp.engine.active.loadout.indexOf('S06')+1")
    assert slot > 0
    page.keyboard.press(str(slot))
    page.evaluate("angle=>{HonroApp.engine.active.angle=angle;HonroApp.engine.active.facing=1}", angle)
    page.keyboard.down("Space")
    page.wait_for_timeout(1250)
    page.keyboard.up("Space")
    page.wait_for_function("routeRecovery.length===1", timeout=8000)
    result = page.evaluate("routeRecovery[0]")
    after = page.evaluate(STATE, "knight")
    assert result["back"]["hp"] < result["fall"]["hp"]
    assert abs(result["back"]["y"]-before["y"])<10 and before["support"]==after["support"], (before, after, result)
    return {"blocked": blocked["reason"], "from": before, "recovery": result}


def old_snapshot(browser, prior, out):
    fixture = out/"old-46.json"
    if fixture.is_file():
        return json.loads(fixture.read_text(encoding="utf-8"))
    page = browser.new_page()
    page.goto(prior.rstrip("/")+"/HONRO.html?act5-old-route=1",wait_until="domcontentloaded")
    page.wait_for_function("!!window.HonroApp")
    stage(page, 46)
    assert page.evaluate("HonroApp.engine.b.honroMap.act5.encounterVersion===4")
    page.keyboard.down("KeyD")
    page.wait_for_timeout(220)
    page.keyboard.up("KeyD")
    page.evaluate("HonroApp.dirty=true;HonroApp.flushBattleSave()")
    text = page.evaluate("localStorage.getItem('honro-first-act-profile-1')")
    saved = {"text": text, "state": page.evaluate(SNAPSHOT)}
    fixture.write_text(json.dumps(saved,ensure_ascii=False),encoding="utf-8")
    page.close()
    return saved


def continue_old(browser, url, saved):
    page=browser.new_page()
    page.add_init_script(script="localStorage.setItem('honro-first-act-profile-1',"+json.dumps(saved["text"])+");")
    page.goto(url.rstrip("/")+"/HONRO.html?act5-route-resume=1",wait_until="domcontentloaded")
    page.wait_for_function("!!window.HonroApp")
    page.locator('[data-action="continue"]').first.click()
    page.wait_for_function("HonroApp.engine?.b.honroStage===46")
    current=page.evaluate(SNAPSHOT)
    assert current==saved["state"], [k for k in current if current[k]!=saved["state"][k]]
    page.close()
    return current["design"]["encounterVersion"]


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--base")
    parser.add_argument("--prior",default="https://sys8994.github.io/honro")
    parser.add_argument("--skip-save",action="store_true")
    args=parser.parse_args()
    out=Path("_local/reports/act5/recovery")
    out.mkdir(parents=True,exist_ok=True)
    with (nullcontext(args.base) if args.base else serve_game()) as url, sync_playwright() as pw:
        browser=launch(pw)
        page=browser.new_page(viewport={"width":1280,"height":800})
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.goto(url.rstrip("/")+"/HONRO.html?act5-route=1",wait_until="domcontentloaded")
        page.wait_for_function("!!window.HonroApp")
        results={"46":drop_and_rope(page),"49":stairs_and_fall(page,49),"50":stairs_and_fall(page,50)}
        if not args.skip_save:
            results["restoredEncounterVersion"]=continue_old(browser,url,old_snapshot(browser,args.prior,out))
        assert not errors,errors
        print(json.dumps(results,ensure_ascii=False),flush=True)
        (out/("pages.json" if args.base else "local.json")).write_text(json.dumps(results,indent=2,ensure_ascii=False),encoding="utf-8")
        browser.close()
