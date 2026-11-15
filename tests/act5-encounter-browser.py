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
 const row=d.flow[m.step],group=(key)=>b.units.filter(u=>(d.required?.[key]||d.groups[key])?.includes(u.id));
 const pose=(u,p)=>{
  Object.assign(u,p,{vx:0,vy:0,jumping:false,airborne:false});
  delete u.platformDrop;delete u.groundContact;delete u.moveTarget;
 };
 const strike=u=>e.hurt(u,1e5,e.active.id,false,undefined,undefined,'environment');
 if(mode==='state')return {step:m.step,row,field:m.field,counts:b.honroCounters,
  waves:d.waves.map(w=>[w.id,w.key,w.when,m.waves?.[w.id],w.units.length]),
  requiredWaveUnits:d.waves.filter(w=>w.units.some(id=>d.required.reflection?.includes(id))).reduce((n,w)=>n+w.units.length,0),
  active:b.enemyLimit,kills:b.kills,n:b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget).length,
  live:b.units.filter(u=>u.side===1&&!u.dead&&!u.honroObjectiveTarget).length};
 if(mode==='clear'){
  const targets=group(key||row[1]).filter(u=>!u.dead&&u.hp>0);
  targets.forEach(strike);return targets.map(u=>[u.id,u.hp,!!u.dead]);
 }
 if(mode==='clearContest'){
  const contest=d.contest?.[key];
  if(!contest)return;
  const p=d.sites[key];
  b.units.filter(u=>d.groups[contest.group].includes(u.id)&&!u.dead&&u.hp>0&&
   Math.abs(u.x-p.x)<=contest.radius&&Math.abs(u.y-p.y)<=115).forEach(strike);
 }
 if(mode==='occupy'){
  const u=actor?e.heroesAlive().find(v=>v.cls===actor):e.active;
  const point=d.sites[key||row[1]]||d.links.find(link=>link.id===key);
  e.select(u.id);pose(u,{x:point.x,y:point.y});a.updateHUD(true);return e.grounded(u);
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
  e.heroesAlive().slice(0,d.exitParty).forEach((u,i)=>{
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

def wait_for_wave(page, start, when):
    expected=sum(w[-1] for w in start["waves"] if w[2]==when)
    assert expected>0, (when,start["waves"])
    page.wait_for_function("n=>HonroApp.engine.b.honroCounters.spawned===n",arg=expected,timeout=8000)

def complete(page, chapter, alternative=False):
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
            if chapter==44 and not alternative and key=="pass":
                assert act(page,"occupy","a5-cross-0")
                before=page.evaluate("HonroApp.engine.active.y")
                page.locator('[data-context-interact="a5-cross-0"]').click()
                assert page.evaluate("HonroApp.engine.active.y") < before - 350
            assert act(page,"occupy",key)
        elif kind=="pass":
            assert act(page,"clear","rootsUpper" if alternative else "rootsLower")
        elif kind in ("fight","subdue"):
            if chapter==41 and key=="watch":
                page.wait_for_function("""()=>{const b=HonroApp.engine.b;
                  return b.honroState.act5.shelteredGuide||b.units.find(u=>u.id==='a5-guide')?.x>840;
                }""")
            if kind=="fight":
                page.wait_for_function("""key=>{const b=HonroApp.engine.b,d=b.honroMap.act5;
                  return !b.units.some(u=>u.honroAct5Reserve&&(d.required[key]||d.groups[key]).includes(u.id));
                }""",arg=key,timeout=5500)
            affected=act(page,"clear")
            if kind=="subdue":
                assert affected and all(hp>0 and not dead for _,hp,dead in affected)
                wait_for_wave(page,start,"commander")
                assert act(page,"state")["step"]==step
                assert act(page,"clear","armorWave")
        elif kind=="use":
            act(page,"clearContest",key)
            assert act(page,"occupy",key,details[1] if len(details)>1 else None)
            page.locator(f'[data-context-interact="a5-step-{step}"]').click()
        elif kind=="escort":
            if len(details)>1:
                assert act(page,"clear",details[1])
            if chapter==42:
                assert state["counts"]["spawned"]==0
                page.wait_for_function("Number.isInteger(HonroApp.engine.b.honroState.act5.drumStart)")
                if alternative:
                    assert act(page,"clear","drum")
                    page.wait_for_function("HonroApp.engine.b.honroState.act5.beats.drum")
                    skip(page)
                act(page,"hold")
                if not alternative:
                    wait_for_wave(page,start,"drum")
            act(page,"escort")
        elif kind=="hold":
            assert act(page,"occupy",key)
            page.wait_for_function("Number.isInteger(HonroApp.engine.b.honroState.act5.holdStart)")
            act(page,"hold")
        else:
            raise AssertionError(row)
        finish_step(page, step)
        if kind=="escort":
            assert page.evaluate("HonroApp.engine.b.honroState.act5.evacuated.length")==(1 if chapter==41 else 3)
        if chapter==45 and key=="bierApproach":
            wait_for_wave(page,start,"reach")
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
    expected=0 if chapter==42 and alternative else sum(w[-1] for w in start["waves"])
    if chapter==48:
        # This staged sequence can finish before an optional entrance clears.
        assert 0<start["requiredWaveUnits"]<=end["counts"]["spawned"]<=expected,(chapter,end)
    else:
        assert end["counts"]["spawned"]==expected,(chapter,end)
    assert end["live"]>0,(chapter,end)
    return {"stage":chapter,"alternative":alternative,"initial":start["counts"]["initialEnemies"],"spawned":end["counts"]["spawned"],"aliveAtExit":end["live"],"steps":steps}

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
            if chapter in (42,44):
                result=complete(page,chapter,alternative=True)
                results.append(result)
                print(json.dumps(result,ensure_ascii=False),flush=True)
        assert not errors,errors
        Path("_local/reports/act5").mkdir(parents=True,exist_ok=True)
        Path("_local/reports/act5/combat-checkpoints.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
