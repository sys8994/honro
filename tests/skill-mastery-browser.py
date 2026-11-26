"""Production skill detail, compare and permanent training on desktop and touch."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game

OUT = ROOT / "_local/reports/skill-mastery"
OUT.mkdir(parents=True, exist_ok=True)
KEY = "honro-first-act-profile-1"
results = []

with sync_playwright() as pw, serve_game() as origin:
    browser = launch(pw)
    for name, width, height, touch in [("desktop", 1280, 900, False), ("mobile", 390, 844, True)]:
        page = browser.new_page(viewport={"width": width, "height": height}, has_touch=touch)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(origin + "/HONRO.html")
        page.wait_for_function("window.HonroApp && !HonroApp.profileStore.locked")
        page.evaluate("""()=>{
            const a=HonroApp,c=HONRO_CORE,h=a.profile.heroes.archer;
            a.profile.settings.sound=false;a.profile.settings.music=false;a.updateAudio();
            h.xp=c.xpAtLevel(21);Object.assign(h.ranks,{A11:1,A09:8});
            a.showCamp('archer');a.talent('A09');
        }""")

        def press(locator):
            if touch:
                locator.tap()
            else:
                locator.click()

        open_mastery = page.locator("[data-action=mastery-review]")
        assert open_mastery.is_disabled()
        assert "경지 22" in page.locator(".mastery-panel").inner_text()
        before = page.evaluate("k=>localStorage.getItem(k)", KEY)
        press(page.locator("[data-action=mastery-preview][data-mode=mastered]"))
        page.wait_for_function("HonroApp.preview?.variant==='mastered' && HonroApp.preview.metrics.masteryIds.has('A09')")
        assert page.evaluate("k=>localStorage.getItem(k)", KEY) == before
        assert page.evaluate("!HonroApp.profile.heroes.archer.masteries?.length")
        page.screenshot(path=str(OUT / f"{name}-compare.png"))
        press(page.locator("[data-action=mastery-preview][data-mode=base]"))
        page.wait_for_function("HonroApp.preview?.variant==='base' && HonroApp.preview.fired")
        assert page.evaluate("!HonroApp.preview.metrics.masteryIds.size")

        page.evaluate("""()=>{
            HonroApp.profile.heroes.archer.xp=HONRO_CORE.xpAtLevel(22);
            HonroApp.talent('A09');
        }""")
        points = page.evaluate("HONRO_CORE.pointsLeft(HonroApp.profile.heroes.archer,'archer')")
        press(open_mastery)
        confirm = page.locator(".mastery-confirm")
        assert "되돌릴 수 없습니다" in confirm.inner_text()
        page.screenshot(path=str(OUT / f"{name}-confirm.png"))
        press(confirm.locator("[data-action=mastery-cancel]"))
        assert page.evaluate("!HonroApp.profile.heroes.archer.masteries?.length")
        press(open_mastery)
        press(confirm.locator("[data-action=mastery-commit]"))
        assert page.locator("[data-action=rank-minus-detail]").is_disabled()
        assert page.evaluate("HONRO_CORE.pointsLeft(HonroApp.profile.heroes.archer,'archer')") == points - 5
        assert page.evaluate("(k)=>JSON.parse(localStorage.getItem(k)).heroes.archer.masteries", KEY) == ["A09"]

        page.reload()
        page.wait_for_function("HonroApp.profile.heroes.archer.masteries?.includes('A09')")
        page.evaluate("()=>{HonroApp.showCamp('archer');HonroApp.talent('A09');}")
        assert "통달 완료" in page.locator(".mastery-panel").inner_text()
        assert page.locator("[data-action=rank-minus-detail]").is_disabled()
        rect = page.locator(".modal .dialog").bounding_box() or page.locator("#modal .dialog").bounding_box()
        assert rect and rect["width"] <= width and rect["height"] <= height
        assert not errors, errors
        results.append({"display": name, "input": "tap" if touch else "click", "width": width,
                        "unlockLevel": 22, "SP": points - 5, "previewIsolated": True, "coldReload": True})
        print("PASS", name, "tier lock, real comparison, cancel, confirm, SP and reload", flush=True)
        page.close()
    browser.close()

(OUT / "browser.json").write_text(json.dumps(results, ensure_ascii=False, indent=2))
