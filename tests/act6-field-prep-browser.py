"""Trusted inputs in the normal campaign, seeded from isolated Act 6 receipts."""
import argparse
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

p = argparse.ArgumentParser()
p.add_argument("--build", type=Path, default=Path.cwd())
p.add_argument("--chromium", default="/usr/bin/chromium")
p.add_argument("--out", type=Path, default=Path("_local/reports/act6-field-prep"))
p.add_argument("--stage", type=int, choices=[55,57,59], required=True)
p.add_argument("--mastery", action="store_true", help="Check the signed mastery choice at the Stage 58 threshold")
o = p.parse_args()
root=o.build.resolve()
o.out.mkdir(parents=True,exist_ok=True)
sys.path.insert(0, str(root / "game/docs/act6/mumyeongsa-p00-p10/baseline"))
import browser as base
base.ROOT=root
from cold_resume import seeded_context

SAVE = """()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k==='honro-first-act-profile-1'||k.startsWith('honro-campaign-act6-boundary-v2:')))"""
ROSTER="""()=>Object.fromEntries(HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned).map(
 u=>[u.cls,Object.fromEntries(['id','loadout','equipmentIds','hp','focus','shield','maxHp','maxFocus','fixed'].map(k=>[k,u[k]??null]))]))"""

def no_refill(before,after):
    assert list(before)==list(after)
    for role,row in before.items():
        assert after[role]["id"]==row["id"]
        for k in ("hp","focus"):
            assert after[role][k]<=row[k],(role,k,row,after[role])
        assert after[role]["shield"]==row["shield"]

def enter(page,stage):
    page.goto(base.BASE+"HONRO.html",wait_until="domcontentloaded")
    page.wait_for_function("!!window.HonroApp")
    base.action(page,"rest").click()
    page.wait_for_function("HonroApp.screen==='rest' && !HonroApp.dialogue")
    page.locator(f'[data-act6-boundary-resume="{stage}"]').click()
    page.wait_for_function(f'HonroApp.engine?.b.honroStage==={stage}')
    base.dismiss_dialogue(page)

def choose(page,id,role,item,roster):
    button=page.locator(f'[data-act6-field-prep="{id}"]')
    button.click()
    modal=page.locator('.open .act6-threshold-prep')
    assert sorted(modal.locator('summary').all_text_contents())==sorted(roster)
    page.screenshot(path=o.out/f"stage-{id}-prep.png")
    line=modal.locator('details').filter(has_text=role)
    if line.get_attribute('open') is None:
        line.locator('summary').click()
    line.get_by_label('전용 장비').select_option(item)
    return modal.locator('[data-prep-apply]')

def check55(page):
    enter(page,55)
    before=page.evaluate(ROSTER)
    saved=page.evaluate(SAVE)
    assert 'mage' not in before and before['occultist']['fixed']
    choose(page,55,'설오','itm_se_02',['설오','휘겸']).click()
    after=page.evaluate(ROSTER)
    assert after['archer']['equipmentIds']==['itm_se_02']
    assert after['occultist']==before['occultist']
    assert not page.evaluate("HonroApp.engine.select('p-occultist')")
    no_refill(before,after)
    assert page.evaluate(SAVE)==saved
    page.keyboard.down('ArrowRight')
    try:
        page.wait_for_function("HonroApp.engine.active.x>HonroApp.engine.active.spawnX+4")
    finally:
        page.keyboard.up('ArrowRight')
    page.locator('[data-act6-field-prep="55"]').wait_for(state='hidden')

def check59(page):
    enter(page,59)
    before=page.evaluate(ROSTER)
    saved=page.evaluate(SAVE)
    assert page.locator('[data-act6-field-prep="59"]').count()==0
    # Induce a genuine engine defeat without asking a tester to lose a full fight.
    page.evaluate("""()=>{
      const a=HonroApp,e=a.engine;
      for(const u of e.b.units.filter(v=>v.side===0&&!v.summoned))e.hurt(u,1e8,'fixture-enemy',true,undefined,{x:u.x,y:u.y-u.h/2},'normal');
      e.checkEnd();
    }""")
    page.wait_for_function("HonroApp.done&&HonroApp.engine.b.phase==='lost'")
    choose(page,59,'담허','itm_da_02',['설오','휘겸','소단','담허']).click()
    page.wait_for_function("HonroApp.screen==='rest'&&!HonroApp.dialogue")
    assert page.evaluate(SAVE)==saved
    page.locator('[data-act6-boundary-resume="59"]').click()
    page.wait_for_function("HonroApp.engine?.b.honroStage===59&&!HonroApp.done")
    base.dismiss_dialogue(page)
    after=page.evaluate(ROSTER)
    assert after['mage']['equipmentIds']==['itm_da_02']
    no_refill(before,after)
    assert page.locator('[data-act6-field-prep="59"]').count()==0
    assert page.evaluate(SAVE)==saved

def check57(browser):
    ctx=seeded_context(browser,57,mobile=False)
    page=ctx.new_page()
    page.on("pageerror",lambda e: print("PAGEERROR",e,flush=True))
    page.on("console",lambda msg: print("CONSOLE",msg.text,flush=True) if msg.type in ("warning","error") else None)
    enter(page,57)
    page.evaluate("""()=>{
      const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE;
      function place(cls,x,support){
        const u=b.units.find(u=>u.side===0&&(u.id===cls||u.cls===cls));
        const row=support?b.terrain.filter(t=>t.id===support):b.terrain.filter(t=>!t.broken&&!t.questTarget);
        if(!u)throw Error('actor '+cls);
        const candidates=row.map(t=>[t,C.topAt(t,x)]).filter(([t,y])=>Number.isFinite(y)&&C.validTerrainContactPose(b.terrain,{...u,x,y}));
        candidates.sort((a,b)=>b[1]-a[1]);
        if(!candidates.length)throw Error('support '+cls+' x'+x+' '+support);
        const [t,y]=candidates[0];
        Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false,acted:false,moveLeft:u.maxMove,moving:0});
        if(!e.grounded(u))throw Error('ground '+cls+' '+t.id);
        return [u,t.id];
      }
      function take(cls,x,support){
        const [u,t]=place(cls,x,support);
        Object.assign(b,{side:0,phase:'aim',active:u.id,projectiles:[]});
        return [u.x,u.y,t];
      }
      window.place=place;window.take=take;
    }""")
    def mission(id):
        btn=page.locator(f'[data-act6-mission="{id}"]')
        btn.click(timeout=5000)
        base.dismiss_dialogue(page)
        print(id,page.locator('[data-act6-qa-lookout]').get_attribute('data-act6-mission'),flush=True)
    t=lambda code: print(code,page.evaluate(code),flush=True)
    t("take('occultist',5016)")
    mission("warnBell")
    page.evaluate("()=>{const e=HonroApp.engine,r=e.b.terrain.find(u=>u.id==='a6-c07-protective-relay');e.damageTerrain(r,30,0,'fixture-pressure');}")
    mission("repairRelay")
    t("take('knight',3424)")
    mission("warnRailing")
    page.wait_for_timeout(1200)
    mission("openRetreat")
    t("take('occultist',1910,'local-lower-07-west')")
    mission("moveRelayToFallback")
    t("place('knight',1970,'local-lower-07-west')[1]")
    t("take('archer',2043,'local-lower-07-west')")
    mission("assistKeeper")
    t("take('local-07-gwakjin-return-keeper',2028,'local-lower-07-west')")
    mission("receiveKeeperWatch")
    t("place('occultist',5340,'a6-c07-stationary-stone-ward')[1]")
    t("place('archer',5360,'a6-c07-stationary-stone-ward')[1]")
    t("take('knight',5385,'a6-c07-stationary-stone-ward')")
    mission("reuniteAtWard")
    for role,x in dict(archer=5872,mage=5992,knight=6090,occultist=6200).items():
        t(f"place('{role}',{x},'local-07-08-exact-receiving-slice')[1]")
    page.wait_for_function("HonroApp.engine.b.phase==='won'&&HonroApp.done")
    before=page.evaluate(ROSTER)
    save=page.evaluate(SAVE)
    sel=choose(page,58,'담허','itm_da_02',['설오','휘겸','소단','담허'])
    if o.mastery:
        # Capture only the new signed field. The campaign slot, original actors
        # and previous terminal receipt all retain their original bytes.
        modal=page.locator(".open .act6-threshold-prep")
        mage=modal.locator("details").filter(has_text="담허")
        mage.get_by_label("통달할 기예").select_option("M01")
        mage.get_by_role("button",name="통달 시연").click()
        page.wait_for_function("HonroApp.preview?.variant==='mastered' && HonroApp.preview.metrics.masteryIds.has('M01')")
        assert page.evaluate(SAVE)==save
        page.screenshot(path=o.out/"stage-58-mastery-preview.png")
        mage.get_by_role("button",name="통달 확정").click()
        page.wait_for_function("HonroApp.engine.b.heroes.mage.masteries?.includes('M01')")
        committed=page.evaluate(SAVE)
        key=next(k for k in committed if k.startswith("honro-campaign-act6-boundary"))
        before_body=json.loads(save[key])["honroAct6ChapterBoundary"]["body"]
        after_body=json.loads(committed[key])["honroAct6ChapterBoundary"]["body"]
        assert after_body.pop("fieldMasteries")=={"mage":["M01"]}
        assert before_body==after_body
        assert committed["honro-first-act-profile-1"]==save["honro-first-act-profile-1"]
        save=committed
    sel.click()
    after=page.evaluate(ROSTER);no_refill(before,after)
    assert after['mage']['equipmentIds']==['itm_da_02'],after
    assert page.evaluate(SAVE)==save
    page.locator('[data-act6-qa-next="58"]').click()
    page.wait_for_function("HonroApp.engine?.b.honroStage===58")
    base.dismiss_dialogue(page)
    warm=page.evaluate(ROSTER)
    if o.mastery:
        no_refill(dict(sorted(after.items())),dict(sorted(warm.items())))
        assert warm["mage"]["equipmentIds"]==after["mage"]["equipmentIds"]
        assert page.evaluate("HonroApp.engine.b.heroes.mage.masteries?.includes('M01')")
    else:
        assert warm['mage']==after['mage'],(warm,after)
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function("!!window.HonroApp")
    base.action(page,"rest").click()
    page.wait_for_function("HonroApp.screen==='rest' && !HonroApp.dialogue")
    page.locator('[data-act6-boundary-resume="58"]').click()
    page.wait_for_function("HonroApp.engine?.b.honroStage===58")
    base.dismiss_dialogue(page)
    cold=page.evaluate(ROSTER)
    assert warm==cold,(warm,cold)
    if o.mastery:
        assert page.evaluate("HonroApp.engine.b.heroes.mage.masteries?.includes('M01')")
        assert page.evaluate("HONRO_CORE.levelOf(HonroApp.engine.b.heroes.mage)")==30
    page.screenshot(path=o.out/"stage-58-resumed.png")
    print("Warm and cold 58 agree; roster proof accepted",flush=True)

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=o.chromium,args=['--no-sandbox','--single-process','--no-zygote','--disable-gpu'])
    if o.stage==57:
        check57(browser)
        print("Act 6 chapter 7 to 8 native prep and warm/cold entry: passed",flush=True)
        browser.close()
        sys.exit(0)
    ctx=seeded_context(browser,o.stage,mobile=True)
    page=ctx.new_page()
    page.on('pageerror',lambda e: print('PAGEERROR',e,flush=True))
    page.on('console',lambda c: print('CONSOLE',c.text,flush=True) if c.type=='warning' else None)
    (check55 if o.stage==55 else check59)(page)
    print(f"Act 6 chapter {o.stage-50} normal path: passed", flush=True)
    browser.close()
