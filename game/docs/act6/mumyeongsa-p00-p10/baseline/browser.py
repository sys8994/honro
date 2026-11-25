"""Read-only baseline of the shipped HONRO.html through the trusted debug UI."""
import argparse
import hashlib
import json
import mimetypes
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

from playwright.sync_api import Error, sync_playwright

ROOT = Path(__file__).resolve().parents[5]
ORIGIN = "https://sys8994.github.io"
BASE = f"{ORIGIN}/honro/"
ACTION = '[data-action="{}"]'

SNAPSHOT = """() => {
  const {engine:e,scene:s,stageId,dialogue,profileStore}=HonroApp, b=e.b;
  const coords=(u)=>[u.x,u.y].map(x=>+x.toFixed(2));
  const unit = u => {
    const surface=e.contactSurface(u.x,u.y-4,u.y+5)?.t;
    return {id:u.id,cls:u.cls,side:u.side,level:u.level??null,hp:u.hp,maxHp:u.maxHp,loadout:u.loadout,pos:coords(u),
      h:u.h,r:u.r,awake:u.awake,dead:u.dead,airborne:!!u.airborne,grounded:e.grounded(u),
      validContact:HONRO_CORE.validTerrainContactPose(b.terrain,u),support:surface?.id??null,
      fixed:!!u.fixed,objective:!!u.honroObjectiveTarget,role:u.role??u.honroGrotesque??null,
      summoned:!!u.summoned,ally:!!u.honroAlly};
  };
  return {stageId,honroStage:b.honroStage,mode:b.mode,authoredId:b.honroAuthoredId,round:b.round,
    phase:b.phase,side:b.side,shot:b.shot,rng:b.rng??null,active:e.active?.id??null,dialogue:!!dialogue,
    isolatedStore:profileStore.original().ok===false,play:[b.width,b.height],terrainBounds:b.honroTerrainBounds??null,
    playBounds:b.honroPlayBounds??null,camera:s?{x:s.x,y:s.y,zoom:s.zoom??null}:null,
    gravity:b.physics?.gravity??null,
    fieldFlags:(b.physics?.regions??[]).map(f=>({id:f.id,gravity:f.gravity??null,projectileOnly:!!f.projectileOnly})),
    terrain:b.terrain.map(t=>({id:t.id,vertices:t.vertices?.length??null,oneWay:!!t.oneWay})),
    worldTerrain:(b.honroWorldTerrain??[]).map(t=>({id:t.id,vertices:t.vertices?.length??null})),
    enemies:e.combatEnemies().map(v=>v.id),units:b.units.map(unit)};
}"""

TRACE = """() => {
  const {engine:e}=HonroApp, b=e.b, events=[], known=new Set();
  window.act6BaselineEvents=events;
  const observe=()=>{
    const actors=e.combatEnemies().map(u=>u.id);
    const roster=b.units.filter(u=>u.side===1&&!u.summoned&&!u.honroAlly&&!u.honroObjectiveTarget);
    const add=roster.filter(u=>!known.has(u.id)).map(u=>u.id);
    for(const id of add)known.add(id);
    const last=events.findLast(x=>x.type==='sample');
    if(add.length||last?.round!==b.round||last?.side!==b.side||last?.phase!==b.phase||
       JSON.stringify(last?.active)!==JSON.stringify(actors)){
      events.push({type:'sample',round:b.round,side:b.side,phase:b.phase,active:actors,newIds:add});
    }
  };
  const fire=e.fire, hurt=e.hurt;
  e.fire=function(...args){
    const u=e.active, ok=fire.apply(this,args);
    if(ok&&u?.side===1)events.push({type:'fire',round:b.round,owner:u.id,skill:args[0]});
    return ok;
  };
  e.hurt=function(target,amount,owner,...rest){
    const before=target.hp+target.shield;
    const out=hurt.call(this,target,amount,owner,...rest);
    const loss=before-target.hp-target.shield;
    if(target.side===0&&e.unit(owner)?.side===1&&loss>0)
      events.push({type:'hit',round:b.round,owner,target:target.id,loss});
    return out;
  };
  observe();
  const frame=()=>{if(HonroApp.engine===e){observe();requestAnimationFrame(frame);}};
  requestAnimationFrame(frame);
}"""

def local_route(route):
    rel = unquote(urlsplit(route.request.url).path.removeprefix("/honro/"))
    path = ROOT / (rel or "index.html")
    if path.is_file():
        content_type = mimetypes.guess_type(path)[0] or "application/octet-stream"
        route.fulfill(path=str(path), content_type=content_type)
    else:
        route.fulfill(status=404, body="Pinned checkout has no such file")

def action(page, name, tail=""):
    return page.locator(ACTION.format(name)+tail).first

def dismiss_dialogue(page):
    for _ in range(30):
        if not page.evaluate("!!HonroApp.dialogue"):
            return
        skip = action(page, "dialogue-skip")
        if skip.is_visible() and skip.is_enabled():
            skip.click(timeout=2000)
        else:
            page.keyboard.press("Enter")
        page.wait_for_timeout(100)

def saved_bytes(page):
    return page.evaluate("""() => Object.fromEntries(Object.keys(localStorage)
      .filter(k=>k.startsWith('honro-')).sort().map(k=>[k,localStorage.getItem(k)]))""")

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()

def trustable_input(page):
    return page.evaluate("""HonroApp.screen==='battle' && !HonroApp.dialogue &&
      HonroApp.engine?.b?.phase==='aim' && HonroApp.engine?.active?.side===0 &&
      !HonroApp.modal.classList.contains('open')""")

def legacy_chart_start(page, out):
    before = page.evaluate(SNAPSHOT)
    page.keyboard.down("ArrowRight")
    try:
        page.wait_for_function("HonroApp.engine.active.x >= 550", timeout=1600)
    finally:
        page.keyboard.up("ArrowRight")
    page.wait_for_timeout(120)
    at_mark = page.evaluate(SNAPSHOT)
    page.locator("[data-act6-qa-lookout]").click(timeout=3000)
    notice = page.locator('#notice').text_content()
    if at_mark["play"][0] == page.evaluate("HonroApp.engine.b.width"):
        return {"start":before,"atMark":at_mark,"status":"FAIL","notice":notice}
    page.wait_for_function("HonroApp.engine.b.width===3000 && HonroApp.engine.grounded(HonroApp.engine.active)",
                           timeout=3500)
    result = page.evaluate(SNAPSHOT)
    page.screenshot(path=out/"legacy-54-N-to-L.png")
    return {"start":before,"atMark":at_mark,"landed":result,"status":"PASS"}

def walk_to(page, actor_id, x):
    if page.evaluate("HonroApp.engine.active.id") != actor_id:
        action(page,"select-hero",f'[data-id="{actor_id}"]').click(timeout=3500)
    page.wait_for_function("id=>HonroApp.engine.active?.id===id",arg=actor_id,timeout=3000)
    page.keyboard.down("ArrowRight")
    try:
        page.wait_for_function("x=>HonroApp.engine.active.x>=x",arg=x,timeout=2600)
    finally:
        page.keyboard.up("ArrowRight")
    page.wait_for_timeout(160)
    return page.evaluate(SNAPSHOT)

def open_fights(page, stage):
    if stage == 58:
        poses = [walk_to(page,"p-occultist",3460)]
        page.locator("[data-act6-qa-lookout]").click(timeout=3000)
        dismiss_dialogue(page)
        poses.append(walk_to(page,"p-mage",3610))
        page.locator("[data-act6-qa-lookout]").click(timeout=3000)
        page.wait_for_function("!!HonroApp.engine.unit('a6-c08-boss')",timeout=3500)
    else:
        poses = [walk_to(page,"p-knight",3210)]
        page.wait_for_function("!!HonroApp.engine.unit('qa-upper-ridge-leaper')",timeout=3500)
    return {"status":"PASS","poses":poses,"result":page.evaluate(SNAPSHOT)}

def capture(browser, stage, out, defense_rounds, chart_start, fight_start):
    ctx = browser.new_context(viewport={"width": 1440, "height": 960})
    ctx.route("**/*", lambda route: local_route(route) if route.request.url.startswith(BASE) else route.abort())
    page = ctx.new_page()
    errors, warnings, requests = [], [], []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda msg: warnings.append(msg.text) if msg.type in ("error", "warning") else None)
    page.on("response", lambda res: requests.append([res.status, urlsplit(res.url).path]) if res.status >= 400 else None)
    data = {"stage": stage, "status": "FAIL", "errors": errors, "warnings": warnings, "httpErrors": requests}
    try:
        page.goto(BASE+"HONRO.html", wait_until="domcontentloaded")
        page.wait_for_function("window.HonroApp && !document.querySelector('[data-startup-title]')", timeout=15000)
        action(page, "settings").click(timeout=4000)
        action(page, "settings-page", '[data-id="records"]').click(timeout=4000)
        action(page, "settings-page", '[data-id="debug"]').click(timeout=4000)
        page.locator("#debug-mode-setting").click(timeout=4000)
        page.wait_for_function('HonroApp.screen==="rest" && HonroApp.debugMode', timeout=8000)
        dismiss_dialogue(page)
        page.wait_for_timeout(500)
        action(page, "journey-book").click(timeout=5000)
        action(page, "journey-act", '[data-id="6"]').click(timeout=5000)
        action(page, "journey-select", f'[data-id="{stage}"]').click(timeout=5000)
        page.wait_for_timeout(500)
        store_before = saved_bytes(page)
        action(page, "journey-travel", f'[data-id="{stage}"]').click(timeout=5000)
        page.wait_for_function("id => HonroApp.engine?.b?.honroStage===id && !!HonroApp.scene",
                               arg=stage, timeout=14000)
        data["entry"] = page.evaluate(SNAPSHOT)
        page.evaluate(TRACE)
        dismiss_dialogue(page)
        page.wait_for_timeout(600)
        data["settled"] = page.evaluate(SNAPSHOT)
        page.screenshot(path=out / f"stage-{stage}.png", timeout=6000)
        if chart_start and stage == 54:
            try:
                data["legacyChartStart"] = legacy_chart_start(page, out)
            except Error as error:
                data["legacyChartStart"] = {"status":"FAIL","error":str(error),"state":page.evaluate(SNAPSHOT)}
        if fight_start and stage in (58,59):
            try:
                data["fightStart"] = open_fights(page, stage)
            except Error as error:
                data["fightStart"] = {"status":"FAIL","error":str(error),"state":page.evaluate(SNAPSHOT),
                                      "notice":page.locator('#notice').text_content()}
        data["input"] = []
        if trustable_input(page):
            for key, hold, released in (("ArrowRight", 320, 180), ("Control", 80, 850)):
                before = page.evaluate(SNAPSHOT)
                page.keyboard.down(key)
                page.wait_for_timeout(hold)
                mid = page.evaluate(SNAPSHOT)
                page.keyboard.up(key)
                page.wait_for_timeout(released)
                after = page.evaluate(SNAPSHOT)
                data["input"].append({"key":key,"before":before,"held":mid,"after":after})
        start = data["entry"]["round"]
        data["defendInputs"] = 0
        for _ in range(defense_rounds*7):
            if stage == 60 or page.evaluate("HonroApp.engine?.b?.round") >= start+defense_rounds:
                break
            dismiss_dialogue(page)
            try:
                page.wait_for_function("""() => HonroApp.dialogue || ['won','lost'].includes(HonroApp.engine?.b?.phase)
                  || (HonroApp.engine?.b?.phase==='aim' && HonroApp.engine?.active?.side===0)""", timeout=5000)
            except Error:
                break
            if trustable_input(page):
                page.keyboard.press("f")
                data["defendInputs"] += 1
                page.wait_for_timeout(300)
            elif page.evaluate("['won','lost'].includes(HonroApp.engine?.b?.phase)"):
                break
        data["end"] = page.evaluate(SNAPSHOT)
        data["trace"] = page.evaluate("window.act6BaselineEvents")
        store_after = saved_bytes(page)
        data["save"] = {"keys":sorted(store_before),"before":digest(store_before),"after":digest(store_after),
                        "unchanged":store_before==store_after}
        data["status"] = "PASS"
    except Error as error:
        data["error"] = str(error)
        data["screen"] = page.evaluate("""() => ({screen:window.HonroApp?.screen,
          debug:window.HonroApp?.debugMode, text:document.body.innerText.slice(0,450)})""")
        page.screenshot(path=out / f"failure-{stage}.png", timeout=5000)
    finally:
        ctx.close()
    return data

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--stage", type=int, nargs="+", default=range(51,61))
    parser.add_argument("--defense-rounds", type=int, default=3)
    parser.add_argument("--chart-start", action="store_true")
    parser.add_argument("--fight-start", action="store_true")
    parser.add_argument("--browser", default="/usr/bin/chromium")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=args.browser, headless=True,
                                              args=["--no-sandbox","--disable-dev-shm-usage"])
        for stage in args.stage:
            result = capture(browser, stage, args.out, args.defense_rounds, args.chart_start, args.fight_start)
            result["chromium"] = browser.version
            (args.out / f"stage-{stage}.json").write_text(json.dumps(result, ensure_ascii=False,indent=2)+"\n")
            print(stage, result["status"], result.get("error",""), flush=True)
        browser.close()

if __name__ == "__main__":
    main()
