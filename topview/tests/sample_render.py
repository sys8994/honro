"""Measure one Chromium renderer and compare native arrows in a copy of its battle."""

import argparse
import json
from pathlib import Path
from urllib.parse import urljoin
from native_entry import enter_chapter
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--base", required=True)
parser.add_argument("--out", type=Path, required=True)
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)

# This runs on a clone with the real chapter's collision bodies and actor
# loadout intact. The move to the bridge and the wind toggle are controls.
compare_flight = """() => {
    const live = HonroApp.engine;
    const clone = (power, wind) => {
        const b = structuredClone(live.b), field = b.physics.regions[0];
        const e = new live.constructor(b), u = e.active;
        u.x = field.x + field.w * .5;
        u.y = field.y + field.h * .5 + u.h * .5;
        if (!wind) b.physics.regions = [];
        const skill = HONRO_CORE.SKILLS.A01, angle = 0;
        const predicted = e.predict(u, skill, angle, power);
        const didFire = e.fire(skill.id, angle, power);
        if (!didFire) throw Error('Native bow refused to fire at the bridge');
        const arrow = b.projectiles.find(p => p.owner === u.id);
        const origin = {x:arrow.x, y:arrow.y};
        const budget = arrow.flightRange?.seconds;
        let steps = 0;
        while (b.projectiles.includes(arrow) && steps < 1800) {
            e.stepProjectile(arrow, 1/120); steps++;
        }
        if (b.projectiles.includes(arrow)) throw Error('Timed shot did not resolve');
        return {power,wind,origin,budget,steps,
            predicted:{x:predicted.x,y:predicted.y},
            actual:{x:arrow.x,y:arrow.y},distance:Math.hypot(arrow.x-origin.x,arrow.y-origin.y),
            error:Math.hypot(arrow.x-predicted.x,arrow.y-predicted.y)};
    };
    return [clone(.15, false), clone(.65, false), clone(.15, true), clone(.65, true)];
}"""

# The real HUD supplies each input. A rAF sample records the number of native
# projectiles and scene effects in the frames used to calculate the percentiles.
sample_frames = """(count) => new Promise(resolve => {
    const intervals=[], objects=[]; let last;
    const tick = t => {
        if(last !== undefined) {
            const e=HonroApp.engine;
            intervals.push(t-last);
            objects.push([e.b.projectiles.length,HonroApp.scene.arcFx?.fxs.length ?? HonroApp.scene.effects?.length ?? 0]);
        }
        last=t;
        if(intervals.length < count) return requestAnimationFrame(tick);
        const sorted=intervals.slice().sort((a,b)=>a-b);
        const percentile=p=>+sorted[Math.ceil(p*sorted.length)-1].toFixed(1);
        resolve({frames:count,p50ms:percentile(.50),p95ms:percentile(.95),maxMs:percentile(1),
          projectileFrames:objects.filter(x=>x[0]).length,maxProjectiles:Math.max(...objects.map(x=>x[0])),
          effectFrames:objects.filter(x=>x[1]).length,maxEffects:Math.max(...objects.map(x=>x[1]))});
    };requestAnimationFrame(tick);
})"""

with sync_playwright() as pw:
    import os

    browser = pw.chromium.launch(
        executable_path=os.getenv("CHROMIUM", "/usr/bin/chromium"),
        args=["--no-sandbox", "--disable-dev-shm-usage"],
    )
    page = browser.new_page(
        viewport={"width": 1180, "height": 760}, device_scale_factor=1
    )
    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.goto(args.base)
    page.locator(".honro-title button[data-action=rest]").wait_for()
    to_title = page.evaluate("performance.now()")
    enter_chapter(page)
    page.wait_for_function("!!window.HonroApp?.engine")
    to_battle = page.evaluate("performance.now()")
    while page.locator("[data-action=dialogue-next]:visible").count():
        page.locator("[data-action=dialogue-next]:visible").first.click()
    page.wait_for_function("HonroApp.canInput()")
    log = {
        "browser": browser.version,
        "viewport": [1180, 760],
        "deviceScaleFactor": 1,
        "environment": page.evaluate(
            "()=>({platform:navigator.platform,userAgent:navigator.userAgent})"
        ),
        "pageMsUntilTitleReady": round(to_title),
        "pageMsUntilFirstBattle": round(to_battle),
    }
    log["arrows"] = page.evaluate(compare_flight)
    (args.out / "render.json").write_text(json.dumps(log, ensure_ascii=False, indent=2))
    print(
        "Arrows",
        [(round(r["distance"]), round(r["error"], 4)) for r in log["arrows"]],
        flush=True,
    )
    weak, strong, wind_weak, wind_strong = log["arrows"]
    assert all(s["budget"] > 0 and s["error"] < 0.05 for s in log["arrows"])
    assert strong["distance"] > weak["distance"] + 50
    assert abs(wind_weak["actual"]["y"] - weak["actual"]["y"]) > 1
    page.keyboard.down("d")
    log["moving"] = page.evaluate(sample_frames, 45)
    page.keyboard.up("d")
    for _ in range(7):
        page.locator("[data-zoom=out]").click()
    log["minZoom"] = page.evaluate(sample_frames, 45)
    log["zoom"] = page.evaluate("HonroApp.scene.zoomLevel")
    page.locator("[data-lock]").click()
    enemy = page.evaluate("""()=>{const app=HonroApp,u=app.engine.unit('watch-1-pass-1-1');
        const at=app.engine.damageAim(u),p=app.scene.screenPoint(at.x,at.y);return {x:p.x,y:p.y-26*app.scene.zoomLevel}}""")
    page.mouse.click(enemy["x"], enemy["y"])
    fire = page.locator("#fire").bounding_box()
    page.mouse.move(fire["x"] + fire["width"] / 2, fire["y"] + fire["height"] / 2)
    page.mouse.down()
    log["charge"] = page.evaluate(sample_frames, 42)
    page.mouse.up()
    log["release"] = page.evaluate(sample_frames, 90)
    assert page.evaluate("HonroApp.engine.b.shot") >= 1
    assert log["release"]["effectFrames"] > 0 and log["release"]["projectileFrames"] > 0
    base = page.evaluate("document.baseURI")
    page.goto(urljoin(base, "topview/motions.html"))
    page.locator("#play").click()
    page.wait_for_function(
        "document.querySelector('#play').getAttribute('aria-pressed')==='false'"
    )
    # Exercise every actual selector with the same renderer and images as the field.
    frames = page.evaluate("""async()=>{
        const read=id=>document.getElementById(id),actors=read('actor'),dirs=read('direction'),poses=read('pose');
        const next=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
        let n=0,minimum=Infinity;
        for(const a of actors.options)for(const d of dirs.options)for(const p of poses.options){
          if(a.value==='woodcutter' && (d.value!=='S'||p.value!=='idle'))continue;
          actors.value=a.value;dirs.value=d.value;poses.value=p.value;await next();
          const pixels=ctx.getImageData(91,115,158,122).data;let changed=0;
          for(let i=0;i<pixels.length;i+=4)if(pixels[i]!==48||pixels[i+1]!==58||pixels[i+2]!==48)changed++;
          minimum=Math.min(minimum,changed);n++;
        }
        return {selections:n,minNonBackgroundPixels:minimum};
    }""")
    log["motionInspector"] = frames
    assert frames["selections"] == 8 * 7 * 7 + 1 and frames["minNonBackgroundPixels"] > 12
    page.select_option("#actor", "seolo")
    page.select_option("#direction", "S")
    page.select_option("#pose", "walk")
    page.locator("#step").click()
    page.screenshot(path=str(args.out / "motion-inspector.jpg"), quality=84)
    log["errors"] = errors
    assert not errors, errors
    (args.out / "render.json").write_text(
        json.dumps(log, ensure_ascii=False, indent=2) + "\n"
    )
    print(
        "Frame samples",
        {k: log[k]["p95ms"] for k in ("moving", "minZoom", "charge", "release")},
        flush=True,
    )
    browser.close()
