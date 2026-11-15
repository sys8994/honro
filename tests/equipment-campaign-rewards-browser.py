"""Browser checks for campaign equipment. Act 5 combat/positions are staged;
objective advancement, settlement, UI choices, saves and projectiles are real."""
from argparse import ArgumentParser
from contextlib import nullcontext
import gzip
import json
import runpy

from playwright.sync_api import sync_playwright

from browser_support import ROOT, launch, serve_game


ACT5 = runpy.run_path(str(ROOT / "tests/act5-encounter-browser.py"))
PRIOR_SAVE = r"""({through, cleared})=>{
 const a=HonroApp,C=HONRO_CORE,p=HonroProfileStore.fresh();
 p.settings.sound=false;p.settings.music=false;p.settings.debugMode=false;
 p.recruited=[...C.CLASS_IDS];p.party=[...p.recruited];
 for(let id=1;id<=through;id++)p.cleared[id]={visits:1,rounds:18};
 for(const id of cleared)p.cleared[id]={visits:1,rounds:18};
 for(const cls of p.party){
  const h=p.heroes[cls];h.xp=C.xpAtLevel(25);C.autoTrain(h,cls);C.sanitizeLoadout(p,cls);
 }
 p.equipment.rewardLedger.eq_se_t2_choice={state:'committed',choiceGroup:'cg_se_t2',selectedItemId:'itm_se_04',notified:true};
 p.equipment.rewardLedger.eq_so_t2_choice={state:'pending',choiceGroup:'cg_so_t2',selectedItemId:null,notified:false};
 p.equipment.ownedItemIds=['itm_se_04'];p.equipment.equippedByClass.archer.personal='itm_se_04';
 if(through>=42)p.honroFlags['act5.blackCampCleared']=true;
 const imported=a.profileStore.importText(JSON.stringify(p));
 if(!a.replaceProfile(imported))throw Error(imported.reason);
 a.showCamp('mage');
}"""

CONTINUE_STAGED = r"""async id=>{
 const a=HonroApp;
 a.stopBattle();a.close();
 await HonroCampaignLoader.ensureStage(id);a.launch(id);
}"""

OWNERSHIP = r"""()=>{
 const eq=HonroApp.profile.equipment;
 return {ids:[...eq.ownedItemIds].sort(),ledger:structuredClone(eq.rewardLedger),worn:structuredClone(eq.equippedByClass)};
}"""


def equipment(page):
    return page.evaluate(OWNERSHIP)


def assert_reward(page, event, candidates, selected):
    profile = equipment(page)
    row = profile["ledger"][event]
    assert row["state"] == ("committed" if selected else "pending"), row
    assert row["selectedItemId"] == selected, row
    assert [item for item in profile["ids"] if item in candidates] == ([selected] if selected else []), profile
    assert len(set(profile["ids"])) == len(profile["ids"]), profile


def camp(page, cls="mage"):
    page.evaluate("cls=>HonroApp.showCamp(cls)", cls)
    if not page.locator(".equipment-panel").count():
        page.get_by_role("tab", name="장비", exact=True).click()


def reload_camp(page):
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("!!window.HonroApp")
    assert not page.evaluate("HonroApp.profileStore.locked")
    camp(page)


def open_choice(page, event):
    page.locator(".equipment-unclaimed").click()
    for _ in range(len(equipment(page)["ledger"])):
        if page.evaluate("HonroApp.equipmentChoice") == event:
            return
        page.get_by_role("button", name="다음 물건 묶음").click()
    raise AssertionError(f"Choice {event} did not appear")


def choose(page, event, candidates, decision, tactical_options=False):
    open_choice(page, event)
    assert set(page.locator(".equipment-reward-item").evaluate_all("rows=>rows.map(r=>r.dataset.id)")) == set(candidates)
    assert page.locator(".equipment-confirm").is_disabled()
    if tactical_options:
        assert page.locator(".equipment-reward-item .equipment-effect").count() == len(candidates)
    page.locator(f'.equipment-reward-item[data-id="{decision}"]').click()
    assert page.locator(".equipment-confirm").is_enabled()
    assert_reward(page, event, candidates, None)
    page.locator(".equipment-confirm").click()
    assert_reward(page, event, candidates, decision)


def verify_old_save(page, out):
    page.evaluate(PRIOR_SAVE, {"through": 48, "cleared": []})
    page.wait_for_function("HonroApp.profile.equipment.rewardLedger.eq_da_t4_choice?.state==='pending'")
    assert_reward(page, "eq_co_16", ["itm_co_16"], "itm_co_16")
    assert_reward(page, "eq_da_t4_choice", ["itm_da_07", "itm_da_08"], None)
    assert_reward(page, "eq_se_t2_choice", ["itm_se_03", "itm_se_04"], "itm_se_04")
    assert_reward(page, "eq_so_t2_choice", ["itm_so_03", "itm_so_04"], None)
    worn = equipment(page)["worn"]
    assert worn["archer"]["personal"] == "itm_se_04"
    assert all(slots["common"] is None for slots in worn.values())
    open_choice(page, "eq_da_t4_choice")
    page.locator('.equipment-reward-item[data-id="itm_da_07"]').click()
    page.screenshot(path=out / "legacy-48-choice.png")
    assert_reward(page, "eq_da_t4_choice", ["itm_da_07", "itm_da_08"], None)
    page.get_by_role("button", name="나중에", exact=True).click()
    reload_camp(page)
    assert_reward(page, "eq_da_t4_choice", ["itm_da_07", "itm_da_08"], None)
    choose(page, "eq_da_t4_choice", ["itm_da_07", "itm_da_08"], "itm_da_07")
    reload_camp(page)
    assert_reward(page, "eq_da_t4_choice", ["itm_da_07", "itm_da_08"], "itm_da_07")
    assert not page.evaluate("HonroEquipment.choose(HonroApp,'eq_da_t4_choice','itm_da_08')")
    assert equipment(page)["worn"]["archer"]["personal"] == "itm_se_04"
    assert_reward(page, "eq_se_t2_choice", ["itm_se_03", "itm_se_04"], "itm_se_04")
    assert "itm_co_06" not in equipment(page)["ids"]
    assert "itm_co_07" not in equipment(page)["ids"]
    return {"oldChoice": "itm_se_04", "oldSlotPreserved": True, "backfillChoice": "itm_da_07", "deferReload": True}


def result_rest(page, next_stage):
    page.locator('[data-action="result-continue"]').click()
    page.wait_for_function('HonroApp.screen==="rest"')
    assert page.locator(f'.rest-next[data-id="{next_stage}"]').is_visible()
    page.locator('.rest-fire[data-action="camp"]').click()
    page.wait_for_function('HonroApp.screen==="camp"')


def verify_act5(page):
    complete = ACT5["complete"]
    common = complete(page, 43)
    assert_reward(page, "eq_co_16", ["itm_co_16"], "itm_co_16")
    result_rest(page, 44)
    camp(page, "archer")
    page.locator('.equipment-bag-item[data-id="itm_co_16"]').click()
    page.locator('.equipment-detail-actions [data-action="equipment-equip"]').click()
    assert equipment(page)["worn"]["archer"]["common"] == "itm_co_16"
    mage = complete(page, 48)
    assert_reward(page, "eq_da_t4_choice", ["itm_da_07", "itm_da_08"], None)
    result_rest(page, 49)
    camp(page)
    choose(page, "eq_da_t4_choice", ["itm_da_07", "itm_da_08"], "itm_da_08")
    # Replaying an already awarded chapter uses the same profile and real
    # outcome, but the helper's same staged chapter play.
    setup = complete.__globals__["SETUP"]
    try:
        complete.__globals__["SETUP"] = CONTINUE_STAGED
        complete(page, 48)
    finally:
        complete.__globals__["SETUP"] = setup
    page.locator('[data-action="result-continue"]').click()
    page.wait_for_function('HonroApp.screen==="journey"')
    page.locator('.journey-exit[data-action="rest"]').click()
    page.wait_for_function('HonroApp.screen==="rest"')
    assert page.evaluate("HonroApp.profile.cleared[48].visits") == 2
    assert_reward(page, "eq_da_t4_choice", ["itm_da_07", "itm_da_08"], "itm_da_08")
    assert_reward(page, "eq_co_16", ["itm_co_16"], "itm_co_16")
    return [common, mage]


ARC = r"""async ()=>{
 const a=HonroApp,C=HONRO_CORE;
 await HonroCampaignLoader.ensureStage(49);a.launch(49);
 for(let n=0;a.dialogue&&n<30;n++)HonroStory.finish(a);
 const e=a.engine,b=e.b,mage=e.heroesAlive().find(u=>u.cls==='mage');
 if(!mage?.equipmentIds?.includes('itm_da_08'))throw Error('equipped reward was not copied into next battle');
 // Use actual M03 and the awarded item with repeatable terrain contact.
 // Only arena geometry, aim and the known test skill are prepared.
 Object.assign(mage,{x:650,y:1100,vx:0,vy:0,airborne:false,jumping:false,acted:false,facing:1,
  loadout:['M03'],ranks:{...mage.ranks,M03:Math.max(1,mage.ranks.M03||0)},focus:mage.maxFocus,cooldowns:{}});
 Object.assign(b,{units:[mage],width:2600,height:1500,fields:[],zones:[],waters:[],drafts:[],stakes:[],wind:0,
  active:mage.id,phase:'aim',side:0,projectiles:[]});
 b.terrain=[
  {id:'floor',x:0,y:1100,w:2600,h:400,hp:99999,maxHp:99999,mat:'rock'},
  {id:'wall',x:1050,y:760,w:35,h:340,hp:99999,maxHp:99999,mat:'rock'}
 ];
 b.sceneVersion++;e.invalidateTerrainCollisionIndex?.();e.checkEnd=()=>false;
 const events=[],emit=e.onEvent;e.onEvent=ev=>{events.push(ev);emit(ev);};
 if(!e.fire('M03',25,.7))throw Error('M03 fire rejected');
 for(let i=0;b.projectiles.length&&i<1200;i++)for(const p of [...b.projectiles])e.stepProjectile(p,1/120);
 const signal=events.find(ev=>ev.name==='skillGeometry');
 if(!signal)throw Error('M03 wall geometry was not emitted');
 return {gear:mage.equipmentIds,geometry:JSON.parse(signal.text)};
}"""


def verify_equipped_effect(page):
    camp(page)
    page.locator('.equipment-bag-item[data-id="itm_da_08"]').click()
    page.locator('.equipment-detail-actions [data-action="equipment-equip"]').click()
    assert equipment(page)["worn"]["mage"]["personal"] == "itm_da_08"
    actual = page.evaluate(ARC)
    geometry = actual["geometry"]
    assert abs(geometry["x"]-geometry["impact"]["x"]) <= 1, actual
    assert abs(geometry["y"]-geometry["impact"]["y"]) <= 1, actual
    assert abs(geometry["angle"]) > 2.4, actual
    return actual


LOAD_CHECKPOINT = r"""async profile=>{
 const a=HonroApp;
 profile.settings.sound=false;profile.settings.music=false;profile.settings.debugMode=false;
 const loaded=a.profileStore.importText(JSON.stringify(profile));
 if(!a.replaceProfile(loaded))throw Error(loaded.reason);
 await HonroCampaignLoader.ensureStage(17);
 a.continue();
 return loaded.ok;
}"""

PREPARE_HOIST = r"""()=>{
 const a=HonroApp,e=a.engine,b=e.b;
 const m=b.honroMarkers.find(v=>v.id==='17.hoist'),hoist=e.unit('act2-hoist');
 if(!m||!hoist?.dead||!hoist.honroHoistSpiritAttached)throw Error('historical hoist fixture not restored');
 for(const u of e.heroesAlive()){
  e.select(u.id);
  if(HonroInteractions.eligibility(a,m).ok){a.updateHUD(true);return u.id;}
 }
 throw Error('no hero is eligible to use the historical hoist interaction');
}"""

CHECKPOINT_WIN = r"""()=>{
 const a=HonroApp,e=a.engine;
 if(!HonroAct23V4Reviewed17.separated(e.b))throw Error('separation did not execute');
 // The archived position is before the rest of the chapter. Only that
 // remaining progression is staged, to reach the real result and camp.
 e.b.phase='won';a.outcome(true);
}"""

JUMP_READY = r"""()=>{
 const a=HonroApp,e=a.engine,b=e.b;
 const u=e.heroesAlive().find(x=>x.cls==='knight');
 if(!u?.equipmentIds?.includes('itm_hw_04'))throw Error('selected gear is absent on fresh stage actor');
 if(b.honroEquipmentRewardRevision!==2)throw Error('new battle has no reward revision');
 if(!e.select(u.id)||!e.grounded(u))throw Error('knight cannot make a retested spawn jump');
 return {move:u.moveLeft,cost:e.jumpCost(u),base:e.jumpCost({...u,equipmentIds:[]})};
}"""


def verify_early_choice(page):
    fixture = ROOT / "tests/fixtures/act2-gameplay/stage17-dead-hoist-404/terminal.json.gz"
    with gzip.open(fixture, "rt", encoding="utf-8") as payload:
        profile = json.load(payload)["profile"]
    assert page.evaluate(LOAD_CHECKPOINT, profile)
    page.wait_for_function("HonroApp.engine?.b.honroStage===17")
    skip = ACT5["skip"]
    skip(page)
    page.wait_for_function("HonroApp.canInput()")
    assert "eq_hw_t2_choice" not in equipment(page)["ledger"]
    assert page.evaluate("HonroApp.engine.b.honroEquipmentRewardRevision") is None
    assert page.evaluate(PREPARE_HOIST)
    page.locator('[data-context-interact="17.hoist"]').click()
    page.wait_for_function("HonroAct23V4Reviewed17.separated(HonroApp.engine.b)")
    skip(page)
    page.evaluate(CHECKPOINT_WIN)
    assert_reward(page, "eq_hw_t2_choice", ["itm_hw_03", "itm_hw_04"], None)
    camp(page, "knight")
    choose(page, "eq_hw_t2_choice", ["itm_hw_03", "itm_hw_04"], "itm_hw_04", tactical_options=True)
    page.locator('.equipment-bag-item[data-id="itm_hw_04"]').click()
    page.locator('.equipment-detail-actions [data-action="equipment-equip"]').click()
    assert equipment(page)["worn"]["knight"]["personal"] == "itm_hw_04"
    page.evaluate(CONTINUE_STAGED, 18)
    skip(page)
    page.wait_for_function("HonroApp.canInput()")
    jump = page.evaluate(JUMP_READY)
    assert jump["cost"] < jump["base"] and abs(jump["cost"] / jump["base"] - .85) < .02, jump
    page.keyboard.press("ControlLeft")
    page.wait_for_function("HonroApp.engine.active.jumping")
    after = page.evaluate("HonroApp.engine.active.moveLeft")
    assert abs(jump["move"]-after-jump["cost"]) < .1, (jump,after)
    assert page.evaluate("()=>{const e=HonroApp.engine;return e.jumpCost(e.active);}") == jump["base"]
    return {"choice":"itm_hw_04", "ordinaryJumpCost":jump["cost"], "withoutEquipment":jump["base"]}


def run(base, out, expected_entry=None):
    rows = {}
    with sync_playwright() as playwright:
        browser = launch(playwright)
        normal = browser.new_page(viewport={"width": 1200, "height": 760})
        errors = []
        normal.on("pageerror", lambda error: errors.append(str(error)))
        entry = normal.goto(base + "/HONRO.html?equipment-campaign=1", wait_until="domcontentloaded")
        assert entry and entry.status == 200
        if expected_entry:
            assert expected_entry in normal.content(), "Published runtime differs from local verified build"
        normal.wait_for_function("!!window.HonroApp&&HONRO_ACT5_RELEASE===true")
        rows["newAct5"] = verify_act5(normal)
        rows["equippedCombatEffect"] = verify_equipped_effect(normal)
        print("PASS official Act5 clears 43/48, exclusive repeated settlement and awarded M03 effect", flush=True)
        legacy = browser.new_page(viewport={"width": 1200, "height": 760})
        legacy.on("pageerror", lambda error: errors.append(str(error)))
        legacy.goto(base + "/HONRO.html?equipment-campaign=1", wait_until="domcontentloaded")
        legacy.wait_for_function("!!window.HonroApp")
        rows["priorSave"] = verify_old_save(legacy, out)
        print("PASS old completed save, no autopick, defer/reload, existing choice and equipment preserved", flush=True)
        early = browser.new_page(viewport={"width": 1200, "height": 760})
        early.on("pageerror", lambda error: errors.append(str(error)))
        early.goto(base + "/HONRO.html?equipment-campaign=1", wait_until="domcontentloaded")
        early.wait_for_function("!!window.HonroApp")
        rows["earlyChoiceAndJump"] = verify_early_choice(early)
        print("PASS actual stage17 separation, early explicit choice, equipped normal jump in next battle", flush=True)
        assert not errors, errors
        browser.close()
    return rows


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("--base", help="Use the indicated deployed URL instead of the locally built game")
    options = parser.parse_args()
    out = ROOT / "_local/reports/equipment-campaign-rewards"
    out.mkdir(parents=True, exist_ok=True)
    with (nullcontext(options.base.rstrip("/")) if options.base else serve_game()) as url:
        expected_entry = json.loads((ROOT / "web/manifest.json").read_text(encoding="utf-8"))["gameEntry"] if options.base else None
        evidence = run(url, out, expected_entry)
    (out / "browser.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
