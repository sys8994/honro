"""Act 1 site integration checkpoints. Positions used for objective tests are fixtures."""
import json
from pathlib import Path
from browser_support import launch, serve_game
from playwright.sync_api import sync_playwright

SETUP = """async stage=>{
 const a=HonroApp,C=HONRO_CORE,p=HonroProfileStore.fresh();
 a.stopBattle();a.close();a.profile=p;a.normalProfile=p;
 Object.assign(p.settings,{difficulty:'story',music:false,sound:false,speed:4,playerSpeed:2});
 p.recruited=stage===3?['archer','mage']:['archer','mage','knight'];p.party=[...p.recruited];
 for(let id=1;id<stage;id++)p.cleared[id]={visits:1,rounds:7};
 for(const cls of p.party){const h=p.heroes[cls];h.xp=HonroProgression.budget(stage).start;C.autoTrain(h,cls);C.sanitizeLoadout(p,cls);}
 await HonroCampaignLoader.ensureStage(stage);a.launch(stage);
 const b=a.engine.b;
 return {width:b.width,height:b.height,count:b.honroCounters.initialEnemies,revision:b.honroCampaignMapRevision,
  waves:b.honroEvents.map(e=>[e.id,HonroEncounters.spawnCount(e.action)]),
  actors:b.units.filter(u=>u.side!==1).map(u=>[u.id,u.x,u.y,u.hp]),far:b.honroMap.act1Site.far};
}"""
STATE = """()=>{
 const a=HonroApp,b=a.engine.b,s=b.honroState;
 return {id:b.honroStage,round:b.round,ends:b.teamEnds[1],ledger:!!s.ledger,rescued:s.rescuedCount||0,
  phase:b.phase,spawned:b.honroCounters.spawned,v:b.honroCampaignMapRevision,pending:s.pendingEvents,events:s.eventLog,
  actors:b.units.filter(u=>u.side!==1).map(u=>[u.id,Math.round(u.x),Math.round(u.y),u.hp]),failure:a.lastError};
}"""

def skip(page):
    page.evaluate("()=>{for(let i=0;HonroApp.dialogue&&i<32;i++)HonroStory.finish(HonroApp)}")

def ready(page):
    for _ in range(6):
        skip(page)
        if page.evaluate("!!HonroApp.canInput()"): return
        page.wait_for_timeout(350)
    page.wait_for_function("HonroApp.canInput()",timeout=12000)

def pose_at_marker(page, marker):
    assert page.evaluate("""id=>{
     const a=HonroApp,e=a.engine,b=e.b,m=b.honroMarkers.find(v=>v.id===id),u=e.active;
     const p=HonroObjectives.interactionTarget(b,m);if(!p)return false;
     const x=p.x-85,y=HonroWorld.top(b,x,p.y,m.support);
     Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false});
     delete u.platformDrop;delete u.groundContact;
     a.scene.manual=true;a.scene.x=x;a.scene.y=y-240;
     const guards=HonroObjectives.rescueGuards(b,m);
     if(guards.length&&HonroInteractions.eligibility(a,m).ok)throw Error('Rescue available under pressure: '+id);
     for(const guard of guards)e.hurt(guard,1e5,u.id,false,undefined,undefined,'environment');
     a.updateHUD(true);return e.grounded(u);
    }""", marker), marker
    page.locator(f'[data-context-interact="{marker}"]').click(timeout=7000)

def save_and_resume(page, chapter):
    page.evaluate("HonroApp.dirty=true;HonroApp.flushBattleSave()")
    before=page.evaluate(STATE)
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("!!globalThis.HonroApp",timeout=90000)
    page.evaluate("HonroApp.continue()")
    page.wait_for_function("n=>HonroApp.engine?.b?.honroStage===n",arg=chapter)
    after=page.evaluate(STATE)
    assert (before["ledger"],before["rescued"],before["v"])==(after["ledger"],after["rescued"],after["v"])
    assert before["actors"]==after["actors"],(before,after)
    return after

def complete(page, stage, out):
    entry=page.evaluate(SETUP, stage)
    ready(page)
    assert entry["revision"]==(5 if stage==3 else 4)
    assert entry["count"]==(13 if stage==3 else 20)
    assert sum(row[1] for row in entry["waves"])==(3 if stage==3 else 6)
    page.wait_for_function("HonroApp.scene.environmentStats?.authoredFar?.includes(HonroApp.engine.b.honroMap.act1Site.far)")
    page.screenshot(path=out/f"stage-{stage}-entry.png")
    before=page.evaluate("HonroApp.engine.active.x")
    page.keyboard.down("d");page.wait_for_timeout(160);page.keyboard.up("d")
    assert page.evaluate("HonroApp.engine.active.x")>before
    if stage==3:
        pose_at_marker(page,"ledger")
        skip(page)
        saved=save_and_resume(page,stage)
        assert saved["ledger"]
    else:
        pose_at_marker(page,"resident-marker-1")
        ready(page)
        pose_at_marker(page,"resident-marker-2")
        skip(page)
        saved=save_and_resume(page,stage)
        assert saved["rescued"]==2
        ready(page)
        pose_at_marker(page,"resident-marker-3")
    for _ in range(96):
        skip(page)
        if page.locator(".result-title").count(): break
        if page.evaluate("!!HonroApp.canInput()"):
            page.keyboard.press("f")
        page.wait_for_timeout(180)
    page.wait_for_selector(".result-title",timeout=12000)
    end=page.evaluate(STATE)
    assert end["phase"]=="won",end
    assert end["ends"]-saved["ends"]>=2,(saved,end)
    if stage==3:
        assert end["ledger"] and end["spawned"]==3,end
    else:
        assert end["rescued"]==3,end
    return {"stage":stage,"entry":entry,"resumed":saved,"end":end}

if __name__=="__main__":
    output=Path("_local/reports/act1-sites")
    output.mkdir(parents=True,exist_ok=True)
    with serve_game() as url,sync_playwright() as pw:
        browser=launch(pw)
        page=browser.new_page(viewport={"width":1280,"height":800})
        page.goto(url+"/HONRO.html",wait_until="domcontentloaded")
        page.wait_for_function("!!globalThis.HonroApp",timeout=90000)
        for stage in (3,7):
            result=complete(page,stage,output)
            (output/f"stage-{stage}-checkpoints.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
            print(stage,result["entry"]["count"],result["end"],flush=True)
