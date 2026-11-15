"""Browser automation through the regular battle engine with no in-battle fixture edits."""
import json
from pathlib import Path
import runpy
import sys
import time
from browser_support import launch, serve_game
from playwright.sync_api import sync_playwright

SETUP = runpy.run_path(str(Path(__file__).with_name("act1-sites-browser.py")))["SETUP"]

RUN = """({seconds,limit})=>{
 const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE;
 const s=b.honroState,stage=b.honroStage,dt=1/120,scale=stage===3?3.23:3.13;
 const metrics=globalThis.siteRun??={events:[],samples:[],seen:new Map()};
 const point=(x,y)=>({x:x*scale,y:y*scale});
 const log=(act,v)=>metrics.events.push([b.round,e.active?.id,act,v]);
 const stop=performance.now()+seconds*1000;
 const heroes=()=>e.heroesAlive();
 const near=(u,p,dx=66,dy=55)=>Math.abs(u.x-p.x)<dx&&Math.abs(u.y-p.y)<dy;
 const skip=()=>{for(let j=0;a.dialogue&&j<24;j++)HonroStory.finish(a);};
 function frame(d=0){
  if(d&&e.canAct())e.move(d,dt);
  e.tick(dt);
  if(!a.dialogue)a.missionTick(dt);
  a.startQueuedStory();
 }
 function aim(u,guards){
  const priority=new Set(guards.map(v=>v.id));
  const foes=e.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<840)
   .sort((v,w)=>Number(priority.has(w.id))-Number(priority.has(v.id))||Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y)).slice(0,2);
  const kit=u.loadout.map(id=>C.SKILLS[id]).filter(sk=>sk?.damage>0&&!sk.passive&&e.skillAllowed(sk,u)&&e.canAfford(sk,u));
  let best;
  for(const foe of foes)for(const sk of kit)for(const q of e.shotSeeds(u,sk,foe).slice(0,4)){
   const score=C.shotViable(e,u,sk,foe,q.angle,q.power);
   if(!score.ok||score.risk>1.1)continue;
   const net=score.net+(priority.has(foe.id)&&score.hit.unit===foe.id?70:0);
   if(!best||net>best.net)best={...q,id:sk.id,net,target:foe.id};
  }
  if(!best||!e.fire(best.id,best.angle,best.power))return false;
  log(best.id,best.target);return true;
 }
 function route(u,p){
  const x=u.x/scale,y=u.y/scale;
  if(stage===3){
   if(y<600&&x<335)return x<283?point(305,536):point(375,479);
   if(x>805&&x<880&&y<512)return point(903,540);
   if(x>=1090&&x<1205&&y<575)return point(1207,572);
   if(y>650&&x<1130)return x<1025?point(1038,693):point(1120,598);
   return p;
  }
  const yTarget=p.y/scale;
  if(yTarget<420&&y>=647&&y<714&&x>834)return point(927,677);
  if(yTarget>850&&x<270)return p;
  if(yTarget<735&&y>860&&x<492)return x<448?point(465,911):point(514,856);
  if(yTarget<735&&y>800&&x<730)return point(x<515?556:710,x<515?830:811);
  if(yTarget<735&&y>685&&x<1000){
   const steps=[[779,820],[835,797],[884,767],[929,729],[973,706],[1000,676]];
   const step=steps.find(step=>step[1]<y-8);
   if(step)return point(...step);
  }
  if(yTarget<420&&y>356){
   const steps=[[924,627],[927,582],[945,536],[929,491],[947,446],[925,400],[926,350]];
   const step=steps.find(step=>step[1]<y-8);
   if(step)return point(...step);
  }
  return p;
 }
 while(performance.now()<stop&&!['won','lost'].includes(b.phase)&&b.round<=limit){
  skip();
  if(!e.canAct()){
   for(let j=0;j<100&&!e.canAct()&&!a.dialogue&&!['won','lost'].includes(b.phase);j++)frame();
   continue;
  }
  const marks=b.honroMarkers.filter(m=>(stage===3?m.action==='ledger':m.action==='rescue')&&!m.collected);
  const targets=marks.map(m=>[m,HonroObjectives.interactionTarget(b,m)]).filter(row=>row[1]);
  const dst=targets[0],at=dst?.[1];
  const ready=heroes().filter(u=>!u.acted&&!u.airborne);
  const u=at?ready.sort((v,w)=>Math.hypot(v.x-at.x,(v.y-at.y)*.9)-Math.hypot(w.x-at.x,(w.y-at.y)*.9))[0]:e.active;
  if(!u||u!==e.active&&!e.select(u.id)){e.wait();frame();continue;}
  const key=[b.round,u.id,Math.floor(u.x/90),Math.floor(u.y/60),marks.length].join();
  if(!metrics.seen.has(key))metrics.samples.push([b.round,u.id,Math.round(u.x),Math.round(u.y),Math.round(u.hp),marks.length]);
  const tries=(metrics.seen.get(key)||0)+1;metrics.seen.set(key,tries);
  if(u.hp/u.maxHp<.36&&b.items.heal&&e.item('heal')){log('heal');continue;}
  if(dst&&HonroInteractions.eligibility(a,dst[0]).ok&&HonroInteractions.use(a,dst[0])){log('interact',dst[0].id);continue;}
  if(stage===7&&at){
   const ascending=at.y<1250?'site-stairs-1':'site-stairs-0';
   const marker=b.honroMarkers.find(v=>v.id===ascending);
   if(marker&&at.y<u.y-120&&HonroInteractions.eligibility(a,marker).ok&&HonroInteractions.use(a,marker)){
    log('stairs',marker.id);continue;
   }
  }
  const p=at&&route(u,at);
  if(p&&u.moveLeft>25&&tries<9){
   const dx=p.x-u.x,dy=p.y-u.y;
   const direction=Math.abs(dx)>25?Math.sign(dx):0;
   if(dy<-60&&Math.abs(dx)<325&&e.grounded(u)&&!u.jumping&&e.jump(u))log('jump');
   const start=u.x,prev=u.y;
   for(let i=0;i<84&&e.canAct()&&!a.dialogue;i++){
    const go=Math.abs(p.x-u.x)>23?Math.sign(p.x-u.x):0;
    frame(go);
    if(near(u,p)&&e.grounded(u))break;
   }
   if(Math.abs(start-u.x)>8||Math.abs(prev-u.y)>8)continue;
   if(direction&&e.grounded(u)&&!u.jumping&&e.jump(u)){frame(direction);log('jump');continue;}
  }
  if(aim(u,dst?HonroObjectives.rescueGuards(b,dst[0]):[]))continue;
  if(a.canInput())a.defend();else e.wait();
  frame();
 }
 skip();
 if(['won','lost'].includes(b.phase)&&!a.done){a.outcome();skip();}
 return {phase:b.phase,round:b.round,kills:b.kills,spawned:b.honroCounters.spawned,ledger:!!s.ledger,rescues:s.rescuedCount||0,
  party:heroes().map(u=>[u.id,u.hp,Math.round(u.x),Math.round(u.y)]),settlement:a.profile.cleared[stage]||null,
  skills:metrics.events,samples:metrics.samples,events:s.eventLog,error:a.lastError};
}"""

if __name__=="__main__":
    out=Path("_local/reports/act1-sites")
    out.mkdir(parents=True,exist_ok=True)
    with serve_game() as url, sync_playwright() as pw:
        browser=launch(pw)
        for stage in map(int,sys.argv[1:] or (3,7)):
            page=browser.new_page(viewport={"width":1100,"height":730})
            page.goto(url+"/HONRO.html",wait_until="domcontentloaded")
            page.wait_for_function("!!globalThis.HonroApp",timeout=90000)
            start=page.evaluate(SETUP,stage)
            elapsed=time.monotonic()
            while True:
                result=page.evaluate(RUN,{"seconds":3,"limit":16 if stage==7 else 12})
                (out/f"stage-{stage}-new-run.json").write_text(json.dumps({"entry":start,"result":result},ensure_ascii=False,indent=2),encoding="utf-8")
                if result["phase"] in ("won","lost") or result["round"]>(16 if stage==7 else 12) or time.monotonic()-elapsed>85:break
            print(stage,{k:result[k] for k in ("phase","round","kills","spawned","ledger","rescues","party")},flush=True)
            page.close()
