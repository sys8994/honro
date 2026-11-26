"""Focused browser checks against the built game; no combat simulation."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from browser_support import launch, serve_game


parser = argparse.ArgumentParser()
parser.add_argument("--out", type=Path, default=Path("_local/reports/campaign-stills"))
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)
DATA = json.loads(Path("shared/campaign-stills/content.json").read_text())
BASE_PROFILE = """()=>{const a=HonroApp;
 a.stopBattle();a.close();a.debugMode=false;a.training=false;a.customMap=null;
 a.profile=HONRO_TOOLS.fresh();a.normalProfile=a.profile;a.persist();a.showTitle();
}"""
SNAP = """()=>JSON.stringify({p:HonroApp.profile,n:HonroApp.normalProfile,store:{...localStorage}})"""


def ready(page):
    page.wait_for_function("!!globalThis.HonroApp", timeout=120000)


def cut_ready(page, ident):
    still = page.locator(f'[data-ending-still="{ident}"]')
    still.wait_for()
    still.locator(".he-still").evaluate("(img)=>img.decode()")
    page.wait_for_function(
        """id=>{const n=document.querySelector('[data-ending-still]');return n?.dataset.endingStill===id
          &&Number(n.querySelector('.he-copy').style.opacity)>.9;}""", arg=ident)
    return still


def advance(page, viewer, touch=False):
    before = (viewer.get_attribute("data-ending-still"), viewer.get_attribute("data-ending-beat"))
    if touch:
        page.touchscreen.tap(25, page.viewport_size["height"] // 2)
    else:
        page.keyboard.press("Space")
    page.wait_for_function(
        """([id,beat])=>{const n=document.querySelector('[data-campaign-stills]');
          return !n||n.dataset.endingStill!==id||n.dataset.endingBeat!==beat;}""",
        arg=list(before)
    )


def capture_cut(page, ident, prefix):
    v = cut_ready(page, ident)
    first = v.locator(".he-still").get_attribute("src")
    assert first
    if not prefix.endswith("rotate"):
        page.screenshot(path=str(args.out / f"{prefix}-{ident}.jpg"), type="jpeg", quality=85)
    return first


with sync_playwright() as p, serve_game() as url:
    browser = launch(p)
    page = browser.new_page(viewport={"width": 1440, "height": 900}, has_touch=True)
    errors, requests = [], []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("request", lambda req: requests.append(req.url))
    page.goto(f"{url}/HONRO.html")
    ready(page)
    assert not any("campaign-still-" in r for r in requests), "stills requested at startup"

    # A new campaign has no record changes before commitment and still enters
    # the ordinary 1-1 journey/rest. The old introductory map scene is replaced.
    page.evaluate(BASE_PROFILE)
    before = page.evaluate(SNAP)
    page.locator('.title-actions [data-action="rest"]').first.click()
    intro = page.locator("#campaign-opening")
    first = capture_cut(page, DATA["opening"][0]["id"], "desktop")
    assert page.evaluate(SNAP) == before
    current_beat = intro.get_attribute("data-ending-beat")
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_function("(src)=>{const i=document.querySelector('#campaign-opening img');return i?.getAttribute('src')!==src&&i.complete&&i.naturalWidth===1080;}", arg=first)
    assert intro.get_attribute("data-ending-beat") == current_beat
    capture_cut(page, DATA["opening"][0]["id"], "mobile")
    for cut in DATA["opening"]:
        if cut["id"] != DATA["opening"][0]["id"]:
            capture_cut(page, cut["id"], "mobile")
        for i, _ in enumerate(cut["beats"]):
            advance(page, intro, touch=i % 2 == 0)
    intro.wait_for(state="detached")
    page.wait_for_function("HonroApp.screen==='rest'&&HonroApp.profile.seen['map-story-v'+HonroStoryContent.version+'-0']")
    assert page.evaluate("Object.keys(HonroApp.profile.cleared).length===0&&HonroApp.profile.seen['rest-interlude-v1-1']")

    # Fresh boots with saved progress skip the prologue. Opening completion
    # also survives a reload before the first chapter is completed.
    page.reload()
    ready(page)
    page.locator('.title-actions [data-action="rest"]').first.click()
    page.wait_for_function("HonroApp.screen==='rest'")
    assert intro.count() == 0

    # Test actual integration hooks with settled outcome fixtures (rather than
    # simulating fights). Each ending is visible in the real debug settings.
    page.evaluate(BASE_PROFILE)
    page.evaluate("""()=>{const a=HonroApp;a.debugMode=true;a.settings('debug');}""")
    debug = page.locator('[data-action="debug-act-ending-preview"]')
    if not debug.count():
        page.locator('[data-action="settings-page"][data-id="records"]').click()
        page.locator('[data-action="settings-page"][data-id="debug"]').click()
    for stage, cuts in DATA["endings"].items():
        snap = page.evaluate(SNAP)
        page.wait_for_function("performance.now()>=(HonroApp.journeyInputAfter||0)")
        page.locator(f'[data-action="debug-act-ending-preview"][data-id="{stage}"]').click()
        viewer = page.locator('#act-ending[data-ending-mode="debug"]')
        viewer.wait_for()
        for index, cut in enumerate(cuts):
            capture_cut(page, cut["id"], "mobile")
            if index != 2:
                for i, _ in enumerate(cut["beats"]):
                    advance(page, viewer, touch=i == 0)
                # Evidence rows may follow neutral authored narration.
                for _ in range(12):
                    if viewer.get_attribute("data-ending-still") != cut["id"]:
                        break
                    advance(page, viewer)
        viewer.locator('[data-ending-action="back"]').click()
        viewer.wait_for(state="detached")
        assert page.evaluate(SNAP) == snap
        assert page.evaluate("HonroApp.settingsPage==='debug'&&HonroApp.modal.classList.contains('open')")
    finale = page.locator('[data-action="debug-act-ending-preview"][data-id="60"]')
    if finale.count():
        finale.click()
        page.wait_for_selector('.he-root[data-ending-still="still_01"]:not([data-campaign-stills])')
        page.keyboard.down("Escape")
        page.wait_for_selector(".he-root", state="detached")
        page.keyboard.up("Escape")

    page.evaluate(BASE_PROFILE)
    page.evaluate("""()=>{const a=HonroApp;
     for(let i=1;i<=10;i++)a.profile.cleared[i]={visits:1,rounds:6};
     if(!HonroActEndings.prepare(a,{honroStage:10,phase:'won'},true))throw Error('No ending prepared');
     a.persist();HonroActEndings.show(a);}""")
    viewer = page.locator('#act-ending[data-ending-mode="completion"]')
    viewer.locator('.he-line').wait_for()
    advance(page, viewer)
    page.wait_for_function("HonroApp.profile.honroActEnding?.stillBeat===1")
    page.reload()
    ready(page)
    page.locator('.title-actions [data-action="rest"]').first.click()
    page.wait_for_selector('#act-ending[data-ending-mode="completion"][data-ending-beat="1"]')
    page.keyboard.down("Escape")
    viewer.wait_for(state="detached")
    page.keyboard.up("Escape")
    assert page.evaluate("HonroApp.profile.cleared[10].visits===1&&HonroApp.profile.seen['act-ending-v1:10']&&!HonroApp.profile.honroActEnding")
    page.evaluate("HonroRestJourney.showBook(HonroApp,10,null,1)")
    snap = page.evaluate(SNAP)
    page.wait_for_function("performance.now()>=(HonroApp.journeyInputAfter||0)")
    page.locator('[data-action="act-ending-replay"][data-id="10"]').click()
    page.locator('#act-ending[data-ending-mode="gallery"]').wait_for()
    page.locator('#act-ending [data-ending-action="back"]').click()
    page.wait_for_function("HonroApp.screen==='journey'&&!HonroApp.endingGallery")
    assert page.evaluate(SNAP) == snap
    assert not errors, errors
    browser.close()
print("PASS: fresh prologue, Stage 1 handoff, rotation, all five act galleries, completion reload/rewards, and replay")
