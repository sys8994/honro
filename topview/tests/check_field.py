"""Exercise lock, concurrent touch and camera bounds using the normal chapter UI."""

import argparse, json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--base", required=True)
parser.add_argument("--out", type=Path, required=True)
parser.add_argument("--edited-map", type=Path)
a = parser.parse_args()
a.out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as driver:
    browser = driver.chromium.launch(
        executable_path=os.getenv("CHROMIUM", "/usr/bin/chromium"),
        args=["--no-sandbox", "--disable-dev-shm-usage"],
    )
    page = browser.new_page(
        viewport={"width": 844, "height": 480}, is_mobile=True, has_touch=True
    )
    cdp = page.context.new_cdp_session(page)
    log = {"errors": []}
    page.on("pageerror", lambda e: log["errors"].append(str(e)))
    if a.edited_map:
        page.route(
            "**/topview/data/yeonmok.json",
            lambda r: r.fulfill(path=a.edited_map, content_type="application/json"),
        )
    page.goto(a.base)
    page.locator("#tv-start").tap(timeout=18000)
    page.wait_for_function("!!HonroApp.engine")
    for i in range(20):
        n = page.locator("[data-action=dialogue-next]:visible")
        if not n.count():
            break
        n.first.tap()
    page.wait_for_function("HonroApp.canInput()")

    def state():
        return page.evaluate(
            """()=>{const a=HonroApp,e=a.engine,u=e.active;return {x:u.x,y:u.y,move:u.moveLeft,focus:u.focus,angle:u.angle,shot:e.b.shot,round:e.b.round,locked:!!e.b.tvMoveLocked,path:u.tvPath?.length||0,charge:a.charging}}"""
        )

    def touch(kind, *contacts):
        cdp.send(
            "Input.dispatchTouchEvent",
            {
                "type": kind,
                "touchPoints": [{"id": i, "x": x, "y": y} for i, x, y in contacts],
            },
        )

    def center(selector):
        r = page.locator(selector).bounding_box()
        return r["x"] + r["width"] / 2, r["y"] + r["height"] / 2

    def same(x, y, keys):
        assert all(x[k] == y[k] for k in keys), (x, y)

    lock = page.locator("[data-lock]")
    lock.tap()
    before = state()
    assert before["locked"]
    sx, sy = center("#joystick")
    fx, fy = center("#fire")
    touch("touchStart", (1, sx, sy))
    touch("touchMove", (1, sx - 17, sy + 11))
    page.wait_for_timeout(160)
    aim1 = state()
    assert aim1["angle"] != before["angle"]
    same(before, aim1, ["x", "y", "move", "shot", "focus"])
    touch("touchStart", (1, sx - 17, sy + 11), (2, fx, fy))
    touch("touchMove", (1, sx + 19, sy + 10), (2, fx, fy))
    page.wait_for_timeout(330)
    aim2 = state()
    assert aim2["charge"] and aim2["angle"] != aim1["angle"]
    same(before, aim2, ["x", "y", "move", "shot", "focus"])
    page.screenshot(path=str(a.out / "locked-touch.jpg"), quality=84)
    touch("touchCancel")
    page.wait_for_timeout(100)
    cancel = state()
    assert not cancel["charge"]
    same(before, cancel, ["x", "y", "move", "shot", "focus"])
    log["twoFinger"] = {
        "before": before,
        "direction1": aim1,
        "direction2WhileCharging": aim2,
        "cancel": cancel,
    }
    page.keyboard.press("l")
    assert not state()["locked"]
    goal = page.evaluate(
        """()=>{const a=HonroApp,u=a.engine.active;return a.scene.screenPoint(u.x+570,u.y-u.h/2+70)}"""
    )
    page.touchscreen.tap(goal["x"], goal["y"])
    page.wait_for_function("!!HonroApp.engine.active.tvPath?.length")
    lock.tap()
    paused = state()
    assert paused["locked"] and not paused["path"]
    lock.tap()
    page.wait_for_timeout(170)
    same(paused, state(), ["x", "y", "move", "path"])
    log["cancelledWalk"] = paused
    log["cameras"] = []
    for width, height in [(1180, 760), (844, 480), (390, 844)]:
        page.set_viewport_size({"width": width, "height": height})
        page.wait_for_timeout(100)
        for zoom in ["out", "in"]:
            for _ in range(8):
                page.locator(f"[data-zoom={zoom}]").tap()
            mini = page.locator("#minimap").bounding_box()
            for label, x, y in [
                ("NW", 0.01, 0.01),
                ("NE", 0.99, 0.01),
                ("SW", 0.01, 0.99),
                ("SE", 0.99, 0.99),
                ("N", 0.5, 0.01),
                ("S", 0.5, 0.99),
                ("W", 0.01, 0.5),
                ("E", 0.99, 0.5),
            ]:
                page.touchscreen.tap(
                    mini["x"] + mini["width"] * x, mini["y"] + mini["height"] * y
                )
                page.wait_for_timeout(90)
                view = page.evaluate(
                    """()=>{const s=HonroApp.scene,r=s.canvas.getBoundingClientRect();return {z:s.zoomLevel,tl:s.world(0,0),br:s.world(r.width,r.height),w:HonroApp.engine.b.width,h:HonroApp.engine.b.height}}"""
                )
                assert (
                    min(view["tl"].values()) >= -0.001
                    and view["br"]["x"] <= view["w"] + 0.001
                    and view["br"]["y"] <= view["h"] + 0.001
                ), view
                if "W" in label:
                    assert abs(view["tl"]["x"]) < 0.01, (label, view)
                if "E" in label:
                    assert abs(view["br"]["x"] - view["w"]) < 0.01, (label, view)
                if "N" in label:
                    assert abs(view["tl"]["y"]) < 0.01, (label, view)
                if "S" in label:
                    assert abs(view["br"]["y"] - view["h"]) < 0.01, (label, view)
                log["cameras"].append(
                    {
                        "width": width,
                        "height": height,
                        "zoom": zoom,
                        "corner": label,
                        **view,
                    }
                )
                if len(label) == 2 and zoom == "out":
                    page.locator("#battlecanvas").screenshot(
                        path=str(a.out / f"{width}-{label}.jpg"), quality=72
                    )
    # A sandboxed copy created by the real Tiled GUI can be supplied to compare the same cell in the game.
    log["authoringSample"] = page.evaluate(
        """async()=>{const data=await (await fetch(new URL('topview/data/yeonmok.json',document.baseURI))).json(),{terrainSpace}=await import(new URL('topview/src/terrain.mjs',document.baseURI)),s=terrainSpace(data),p={x:7.5*s.cell,y:22.5*s.cell};HonroApp.scene.centerAt(p.x,p.y);return {cell:[7,22],material:data.terrain[22*data.width+7],walkable:s.legal(p,8),arrowClear:s.legal(p,3,true),props:data.objects.length,anchors:Object.keys(data.anchors).length}}"""
    )
    page.wait_for_timeout(90)
    page.locator("#battlecanvas").screenshot(
        path=str(a.out / "authoring-cell.jpg"), quality=84
    )
    assert log["authoringSample"]["walkable"] == (not bool(a.edited_map)), log[
        "authoringSample"
    ]
    assert not log["errors"], log["errors"]
    (a.out / "field.json").write_text(
        json.dumps(log, ensure_ascii=False, indent=2) + "\n"
    )
    browser.close()
