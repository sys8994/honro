"""Browser regression for the optional monster speech receiver and saved once flag.

This uses authored spawn data and the game renderer. The event and camera are
fixtures so the test covers reception, display and reload independent of combat.
"""
import os

from browser_support import launch, serve_game
from playwright.sync_api import sync_playwright


SETUP = """async () => {
 const a=HonroApp,p=HonroProfileStore.fresh();
 a.stopBattle();
 a.close();
 a.profile=a.normalProfile=p;
 p.recruited=['archer','mage','knight'];
 p.party=[...p.recruited];
 Object.assign(p.settings,{music:false,sound:false});
 for(let stage=1;stage<4;stage++)p.cleared[stage]={visits:1,rounds:7};
 await HonroCampaignLoader.ensureStage(4);
 a.launch(4);
 return a.engine.b.honroMonsterReworkRevision;
}"""

SIGNAL = """({visible,legacy,fallen}) => {
 const a=HonroApp,e=a.engine,b=e.b;
 const actor=b.units.find(u=>u.honroMonsterSpecies==='geuseundae');
 const speaker=b.units.find(u=>u.side===0&&u.cls==='mage');
 if(!actor||!speaker)return false;
 const original={revision:b.honroMonsterReworkRevision,hp:speaker.hp};
 Object.assign(a.scene,{manual:true,x:actor.x+(visible?0:100000),y:actor.y-actor.h/2,scale:.65});
 // This ensures the intended speaker witnesses the same enemy as the camera.
 Object.assign(speaker,{x:actor.x-140,y:actor.y});
 if(legacy)delete b.honroMonsterReworkRevision;
 if(fallen)speaker.hp=0;
 e.emit('monsterPattern',{id:actor.id,kind:'geuseundae',phase:'windup'});
 b.honroMonsterReworkRevision=original.revision;
 speaker.hp=original.hp;
 return true;
}"""


def ready(page):
    for _ in range(8):
        page.evaluate("()=>{for(let i=0;HonroApp.dialogue&&i<32;i++)HonroStory.finish(HonroApp)}")
        if page.evaluate("!!HonroApp.canInput()"):
            return
        page.wait_for_timeout(300)
    page.wait_for_function("HonroApp.canInput()", timeout=12000)


def check(url, browser):
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.goto(url + "/HONRO.html", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_function("!!globalThis.HonroApp", timeout=90000)
    assert page.evaluate(SETUP) == 1
    ready(page)

    seen = "HonroApp.engine.b.honroState.monsterObservations"
    for signal in (
        {"visible": False},
        {"visible": True, "legacy": True},
        {"visible": True, "fallen": True},
    ):
        assert page.evaluate(SIGNAL, signal)
        assert page.evaluate(f"!{seen}?.pending && !{seen}?.seen.length")

    assert page.evaluate(SIGNAL, {"visible": True})
    bark = page.locator('#banter[data-monster-observation="geuseundae:windup"]')
    bark.wait_for(state="visible", timeout=4000)
    assert "몸을 부풀리는군" in bark.inner_text()
    assert page.evaluate("!HonroApp.dialogue")
    assert page.evaluate(f"{seen}.seen") == ["geuseundae:windup"]
    assert page.evaluate(SIGNAL, {"visible": True})
    assert page.evaluate(f"!{seen}.pending && {seen}.seen.length===1")

    page.evaluate("HonroApp.dirty=true;HonroApp.flushBattleSave()")
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("!!globalThis.HonroApp", timeout=90000)
    page.evaluate("HonroApp.continue()")
    page.wait_for_function("HonroApp.engine?.b?.honroStage===4", timeout=15000)
    ready(page)
    assert page.evaluate(f"{seen}.seen") == ["geuseundae:windup"]
    assert page.evaluate(SIGNAL, {"visible": True})
    assert page.evaluate(f"!{seen}.pending")
    assert not bark.count()
    page.close()


if __name__ == "__main__":
    with serve_game() as local_url, sync_playwright() as playwright:
        browser = launch(playwright)
        check(os.environ.get("HONRO_STORY_CHECK_URL", local_url).rstrip("/"), browser)
        print("Monster observation shown once, nonblocking, with old-save, visibility, speaker and reload guards")
