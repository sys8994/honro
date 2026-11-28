"""Miss with the native bow until defeat, then retry using the visible result button."""

import argparse, json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--base", required=True)
parser.add_argument("--out", type=Path, required=True)
args = parser.parse_args()
p = args.out
p.mkdir(parents=True, exist_ok=True)
log = {"rounds": [], "errors": []}
out = p / "exposed-and-retry.json"
with sync_playwright() as pw:
    b = pw.chromium.launch(
        executable_path=os.getenv("CHROMIUM", "/usr/bin/chromium"),
        args=["--no-sandbox"],
    )
    pg = b.new_page(viewport={"width": 1180, "height": 760})
    pg.on("pageerror", lambda e: log["errors"].append(str(e)))
    pg.goto(args.base)
    pg.locator("#tv-start").click()
    pg.wait_for_function("!!window.HonroApp?.engine")
    log["environment"] = pg.evaluate(
        """()=>{const e=HonroApp.engine,region=e.b.physics.regions[0];const advance=(x,y)=>{const p={x,y,vx:250,vy:0,wind:0,gravityScale:1,drag:0,skill:'A01'};for(let i=0;i<30;i++)Object.assign(p,e.advanceProjectile(p,1/120));return {dx:p.x-x,dy:p.y-y,vx:p.vx,vy:p.vy}};return {id:region.id,sector:advance(region.x+region.w/2,region.y+region.h/2),calm:advance(400,400)}}"""
    )
    assert (
        log["environment"]["sector"]["dy"] > 3
        and abs(log["environment"]["calm"]["dy"]) < 1e-8
    )
    out.write_text(json.dumps(log, ensure_ascii=False, indent=2))
    print("wind", log["environment"], flush=True)
    start = time.monotonic()
    prev = None
    aimed = False
    while time.monotonic() - start < 170:
        ui = pg.evaluate(
            """()=>{const a=HonroApp,b=a.engine.b,u=b.units.find(o=>o.id==='p-archer');return {round:b.round,phase:b.phase,hp:u.hp,done:a.done,dialogue:!!a.dialogue,can:a.canInput()&&!HonroStory.turnPaused(a)}}"""
        )
        if ui["done"]:
            break
        if ui["dialogue"]:
            btn = pg.locator("[data-action=dialogue-next]:visible")
            if btn.count():
                btn.first.click()
        elif ui["can"] and (ui["round"], ui["hp"]) != prev:
            prev = (ui["round"], ui["hp"])
            log["rounds"].append(prev)
            out.write_text(json.dumps(log, ensure_ascii=False, indent=2))
            if not aimed:
                pg.locator("[data-lock]").click()
                q = pg.evaluate(
                    "()=>{const a=HonroApp,u=a.engine.active;return a.scene.screenPoint(u.x-520,u.y-u.h*.5+210)}"
                )
                pg.mouse.click(q["x"], q["y"])
                aimed = True
            rect = pg.locator("#fire").bounding_box()
            pg.mouse.move(rect["x"] + rect["width"] / 2, rect["y"] + rect["height"] / 2)
            pg.mouse.down()
            pg.wait_for_timeout(260)
            pg.mouse.up()
        pg.wait_for_timeout(120)
    log["last"] = ui
    if ui["done"] and ui["phase"] == "lost":
        pg.screenshot(path=str(p / "defeat.jpg"), quality=82)
        pg.locator("[data-action=retry]:visible").first.click()
        pg.wait_for_function("HonroApp.engine.b.phase!=='lost' && !HonroApp.done")
        log["retry"] = pg.evaluate(
            "()=>({stage:HonroApp.engine.b.honroStage,topview:HonroApp.engine.b.honroTopview,round:HonroApp.engine.b.round,hp:HonroApp.engine.b.units.find(o=>o.id==='p-archer').hp,clear:!!HonroApp.profile.cleared[1]})"
        )
    print(log["last"], log.get("retry"), flush=True)
    out.write_text(json.dumps(log, ensure_ascii=False, indent=2))
    b.close()
    assert (
        log.get("retry") == dict(stage=1, topview=1, round=1, hp=365, clear=False)
        and not log["errors"]
    ), log
