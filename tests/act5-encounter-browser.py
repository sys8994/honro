import json
import os
from pathlib import Path
from browser_support import launch, serve_game
from playwright.sync_api import sync_playwright

# Build HONRO_ACT5_RELEASE=1. These are independent browser checkpoints.
# Combat tests inject damage; a result here is not a pacing run.
SETUP = """async id=>{
 const a=HonroApp;
 a.stopBattle();a.close();a.profile=HonroProfileStore.fresh();a.normalProfile=a.profile;
 a.profile.recruited=[...HONRO_CORE.CLASS_IDS];a.profile.party=[...a.profile.recruited];
 for(let i=1;i<id;i++)a.profile.cleared[i]={visits:1,rounds:18};
 for(const cls of a.profile.party){const h=a.profile.heroes[cls];h.xp=HONRO_CORE.xpAtLevel(25);HONRO_CORE.autoTrain(h,cls);HONRO_CORE.sanitizeLoadout(a.profile,cls);}
 await HonroCampaignLoader.ensureStage(id);a.launch(id);
}"""
ACT = """({mode,key,actor})=>{
 const a=HonroApp,e=a.engine,b=e.b,d=b.honroMap.act5,m=b.honroState.act5;
 const row=d.flow[m.step],group=(key)=>b.units.filter(u=>d.groups[key]?.includes(u.id));
 const pose=(u,p)=>{
  Object.assign(u,p,{vx:0,vy:0,jumping:false,airborne:false});
  delete u.platformDrop;delete u.groundContact;delete u.moveTarget;
 };
 const strike=u=>e.hurt(u,1e5,e.active.id,false,undefined,undefined,'environment');
 if(mode==='state')return {step:m.step,row,field:m.field,counts:b.honroCounters,
  waves:d.waves.map(w=>[w.id,w.key,w.when,m.waves?.[w.id],w.units.length]),
  active:b.enemyLimit,kills:b.kills,n:b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget).length};
 if(mode==='clear'){
  const targets=group(key||row[1]).filter(u=>!u.dead&&u.hp>0);
  targets.forEach(strike);return targets.map(u=>[u.id,u.hp,!!u.dead]);
 }
 if(mode==='occupy'){
  const u=actor?e.heroesAlive().find(v=>v.cls===actor):e.active;
  e.select(u.id);pose(u,d.sites[key||row[1]]);a.updateHUD(true);return e.grounded(u);
 }
 if(mode==='escort'){
  const p=d.sites[row[1]];
  b.units.filter(u=>u.honroAct5Escort).forEach((u,i)=>{
   const x=p.x-220-i*25;
   pose(u,{x,y:HonroMapEngine.surfaceY(b.terrain,x,p.y).y});
  });
  pose(e.active,p);
 }
 if(mode==='hold')b.teamEnds[1]++;
 if(mode==='exit'){
  const p=d.sites.exit;
  e.heroesAlive().forEach((u,i)=>{
   const x=p.x-72+48*i;
   pose(u,{x,y:HonroMapEngine.surfaceY(b.terrain,x,p.y).y});
  });
 }
}"""

def act(page, mode, key=None, actor=None):
    return page.evaluate(ACT, {"mode":mode,"key":key,"actor":actor})

def skip(page):
    page.evaluate("()=>{for(let i=0;HonroApp.dialogue&&i<12;i++)HonroStory.finish(HonroApp)}")

def finish_step(page, old):
    page.wait_for_function("step=>HonroApp.engine.b.honroState.act5.step>step", arg=old, timeout=8000)
    skip(page)

def complete(page, chapter):
    page.evaluate(SETUP, chapter)
    skip(page)
    page.wait_for_function("HonroApp.canInput()")
    start=act(page,"state")
    declared=page.evaluate("id=>HONRO_CONTENT.stages[id-1]",chapter)
    assert start["active"]==declared["active"]
    assert start["counts"]["initialEnemies"]==declared["enemies"]
    assert start["counts"]["spawned"]==0 and start["n"]==declared["enemyBudget"]
    before=page.evaluate("HonroApp.engine.active.x")
    page.keyboard.down("d")
    page.wait_for_timeout(170)
    page.keyboard.up("d")
    assert page.evaluate("HonroApp.engine.active.x") > before
    steps=[]
    while row:=act(page,"state").get("row"):
        state=act(page,"state")
        step=state["step"]
        kind,key,*details=row
        page.wait_for_function("HonroApp.canInput()")
        if kind=="reach":
            assert act(page,"occupy",key)
        elif kind=="pass":
            assert act(page,"clear","rootsLower")
        elif kind in ("fight","subdue"):
            if kind=="fight":
                page.wait_for_function("""key=>{const b=HonroApp.engine.b,d=b.honroMap.act5;
                  return !b.units.some(u=>u.honroAct5Reserve&&d.groups[key].includes(u.id));
                }""",arg=key,timeout=5500)
            affected=act(page,"clear")
            if kind=="subdue":
                assert affected and all(hp>0 and not dead for _,hp,dead in affected)
        elif kind=="use":
            assert act(page,"occupy",key,details[1] if len(details)>1 else None)
            page.locator(f'[data-context-interact="a5-step-{step}"]').click()
        elif kind=="escort":
            act(page,"escort")
        elif kind=="hold":
            assert act(page,"occupy",key)
            page.wait_for_function("Number.isInteger(HonroApp.engine.b.honroState.act5.holdStart)")
            act(page,"hold")
        else:
            raise AssertionError(row)
        finish_step(page, step)
        if chapter==45 and key=="bierApproach":
            page.wait_for_function("HonroApp.engine.b.honroCounters.spawned===5")
            page.evaluate("HonroApp.dirty=true;HonroApp.flushBattleSave()")
            saved=act(page,"state")
            page.reload(wait_until="domcontentloaded")
            page.wait_for_function("!!globalThis.HonroApp",timeout=90000)
            page.evaluate("HonroApp.continue()")
            page.wait_for_function("HonroApp.engine?.b.honroStage===45")
            skip(page)
            assert act(page,"state")==saved
        steps.append((kind,key))
    act(page,"exit")
    page.wait_for_function("HonroApp.engine.b.phase==='won'")
    skip(page)
    page.wait_for_selector(".result-title")
    assert page.locator(".result-title").inner_text()=="길이 열렸다"
    assert page.evaluate("(id)=>!!HonroApp.profile.cleared[id]",chapter)
    end=act(page,"state")
    assert end["counts"]["spawned"]==sum(w[-1] for w in start["waves"]),(chapter,end)
    return {"stage":chapter,"initial":start["counts"]["initialEnemies"],"spawned":end["counts"]["spawned"],"steps":steps}

if __name__=="__main__":
    with serve_game() as url, sync_playwright() as pw:
        browser=launch(pw)
        page=browser.new_page(viewport={"width":1024,"height":670})
        errors=[]
        page.on("pageerror",lambda error:errors.append(str(error)))
        page.goto(url+"/HONRO.html",wait_until="domcontentloaded")
        page.wait_for_function("!!globalThis.HonroApp",timeout=90000)
        ids=[int(n) for n in os.environ.get("HONRO_ACT5_CHECK","41,42,43,44,45,46,47,48,49,50").split(",")]
        results=[]
        for chapter in ids:
            result=complete(page,chapter)
            results.append(result)
            print(json.dumps(result,ensure_ascii=False),flush=True)
        assert not errors,errors
        Path("_local/reports/act5").mkdir(parents=True,exist_ok=True)
        Path("_local/reports/act5/combat-checkpoints.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
