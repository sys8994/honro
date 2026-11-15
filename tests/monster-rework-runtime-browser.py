"""Checked real game rendering, input and serialized warnings at staged positions."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch, serve_game
import sys

INIT = """async ([id,kind])=>{
 const a=HonroApp,p=HonroProfileStore.fresh();
 p.settings.difficulty='story';p.settings.music=false;p.settings.sound=false;
 p.recruited=HonroStageRules.stageParty(id);p.party=[...p.recruited];
 for(let i=1;i<id;i++)p.cleared[i]={visits:1,rounds:12};
 for(const cls of p.party){
  const h=p.heroes[cls];h.xp=HonroProgression.budget(id).start;HONRO_CORE.autoTrain(h,cls);HONRO_CORE.sanitizeLoadout(p,cls);
 }
 a.stopBattle();a.close();a.profile=p;a.normalProfile=p;
 await HonroCampaignLoader.ensureStage(id);a.launch(id);
 for(let i=0;i<30&&a.dialogue;i++)HonroStory.finish(a);
 const e=a.engine,b=e.b,u=b.units.find(v=>v.honroMonsterSpecies===kind);
 return {revision:b.honroMonsterReworkRevision,id:u?.id,n:b.honroCounters.initialEnemies};
}"""
WARN = """kind=>{
 const a=HonroApp,e=a.engine,b=e.b,u=b.units.find(v=>v.honroMonsterSpecies===kind),h=e.heroesAlive()[0];
 const origin={x:u.x,y:u.y-u.h*.44};
 let placed=false;
 for(const dx of [-210,210,-252,252,-294,294,-336,336]){
  const x=u.x+dx;
  const y=HonroMapEngine.surfaceY(b.terrain,x,u.y)?.y;
  if(y==null||Math.abs(y-u.y)>180)continue;
  const pos={x,y:y-h.h*.44};
  if(e.collisionTerrain(origin,pos,0).some(t=>!t.broken&&HONRO_CORE.segmentTerrain(origin,pos,t,0)))continue;
  Object.assign(h,{x,y,vx:0,vy:0,airborne:false,jumping:false});
  delete h.groundContact;delete h.platformDrop;
  if(!e.grounded(h))continue;
  placed=true;break;
 }
 if(!placed)return {error:'ground'};
 u.honroTargetId=h.id;u.honroTargetUntil=b.round;
 Object.assign(b,{active:u.id,side:1,phase:'enemy',queue:[u.id],turnAge:0});
 Object.assign(u,{lastAct:b.round,acted:false,awake:true});
 const after=e.enemyActionSteps();let guard=0;while(!after.next().done&&guard++<2000){}
 const w=u.honroMonsterWindup;
 if(!w)return {error:'windup',actor:u.id,intent:u.intent,active:e.active?.id,range:Math.round(Math.hypot(h.x-u.x,h.y-u.y))};
 Object.assign(b,{active:h.id,side:0,phase:'aim',turnAge:0});h.acted=false;h.moveLeft=h.maxMove;
 Object.assign(a.scene,{x:(h.x+u.x)*.5,y:(h.y+u.y)*.5-120,manual:true});
 a.updateHUD(true);
 return {id:u.id,hero:h.id,radius:w.radius,x:w.impact.x,y:w.impact.y,serial:w.serial};
}"""

def stage(page, origin, out, chapter, kind, resume=False):
    page.goto(origin+'/HONRO.html?monster=review',wait_until='domcontentloaded')
    page.wait_for_function('!!globalThis.HonroApp',timeout=90000)
    result=page.evaluate(INIT,[chapter,kind])
    assert result['revision']==1 and result['id'],result
    page.wait_for_function('!HonroApp.dialogue && HonroApp.canInput()',timeout=90000)
    warning=page.evaluate(WARN,kind)
    assert 'error' not in warning, warning
    page.wait_for_function("id=>HonroApp.engine.unit(id).honroMonsterWindup?.seen",arg=warning['id'])
    page.screenshot(path=out/f'stage-{chapter}-{kind}.png')
    if resume:
        page.evaluate('HonroApp.dirty=true;HonroApp.flushBattleSave()')
        page.reload(wait_until='domcontentloaded')
        page.wait_for_function('!!globalThis.HonroApp',timeout=90000)
        page.evaluate('HonroApp.continue()')
        page.wait_for_function('id=>HonroApp.engine?.b.honroStage===id',arg=chapter)
        saved=page.evaluate("""id=>{const w=HonroApp.engine.unit(id).honroMonsterWindup;return [w.serial,w.radius,w.impact.x,w.impact.y]}""",warning['id'])
        assert saved==[warning[k] for k in ('serial','radius','x','y')],saved
    print(chapter,kind,result['n'],'displayed', 'and resumed' if resume else '',flush=True)

def run(origin):
    out=Path('_local/reports/monster-forge')
    out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        b=launch(p)
        for chapter,kind,save in ((4,'geuseundae',True),(12,'eoduksini',False),(33,'mulgwishin',False)):
            page=b.new_page(viewport={'width':1280,'height':800})
            errors=[]
            page.on('pageerror',lambda message:errors.append(str(message)))
            stage(page,origin,out,chapter,kind,save)
            assert not errors,errors
            page.close()

if __name__=='__main__':
    if len(sys.argv)>1: run(sys.argv[1].rstrip('/'))
    else:
        with serve_game() as origin: run(origin)
