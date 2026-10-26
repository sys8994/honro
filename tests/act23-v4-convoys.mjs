/** Focused route regression, NOT normal combat/fullplay.
 * Enemy/other NPC actors are omitted. Combat/story prerequisites are explicit
 * fixtures. Heroes are continuously placed on real supported surfaces ahead of
 * the convoy, so leadership availability cannot disguise NPC route failures.
 * NPC positions are never placed after initialization: only Engine.walk and
 * Engine.integrateBody may write them. NPC maxMove is unchanged, and one new
 * round is supplied per six seconds; no per-frame movement refills occur.
 */
import assert from 'node:assert/strict';
import {runtimeCandidate,battlefield} from './act23-v4-helpers.mjs';

// Stage28 now uses the city wrapper's reserved probe/commit mover and is
// covered by act23-v4-city.mjs, including physical route and exact resume.
const g=await runtimeCandidate(),V=g.HonroAct23V4,C=g.HONRO_CORE;
const DT=1/60,TICKS_PER_ROUND=360,MAX_ROUNDS=24,rows=[];
const numeric=v=>Number.isFinite(v)?+v.toFixed(6):v;
const near=(u,p,r=100)=>Math.abs(u.y-p.y)<=150&&Math.hypot(u.x-p.x,(u.y-p.y)*.75)<=r;
function supportedLeader(q,hero,npc,offset){
 const choices=[];
 for(const dx of [offset,100,180,240,300,400]){
  const x=npc.x+dx;
  for(const t of q.b.terrain){if(t.broken)continue;for(const f of C.terrainSurfaces(t,x)){
   if(Math.abs(f.y-npc.y)>=210||Math.abs(f.slope)>1.35)continue;
   const pose={...hero,x,y:f.y,vx:0,vy:0,airborne:false,jumping:false};
   if(C.validTerrainContactPose(q.b.terrain,pose))choices.push({x,y:f.y,score:Math.abs(dx-offset)+Math.abs(f.y-npc.y)*.1});
  }}
 }
 choices.sort((a,b)=>a.score-b.score);const p=choices[0];
 if(!p)return false;
 Object.assign(hero,{x:p.x,y:p.y,vx:0,vy:0,airborne:false,jumping:false,fixed:false,acted:false});delete hero.moveTarget;delete hero.aiMove;
 return true;
}
function fixture(stage){
 const q=battlefield(g,stage),root=V.mem(q.b),spec=q.b.honroV4FireEvacuation;
 const ids=stage===20?q.b.honroV4Convoy:stage===23?['act3-carrier']:[spec.guard,...spec.ids];
 q.b.units=q.b.units.filter(u=>u.side===0||ids.includes(u.id)||stage===20&&u.id==='20.town-refugee');q.b.side=0;q.b.phase='aim';q.app.dialogue=null;
 if(stage===20){root.done['20.ring']=true;root.ringRemoved=true;root.done['clear-mouth']=true;root.done.escort=true;root.convoyStarted=true;}
 if(stage===23){root.done['dispatch-bundle']=true;root.carrierStarted=true;}
 if(stage===28)for(const id of ['fire-screen','water-release','party-reunion'])V.completeStep(q.app,V.steps(q.b).find(s=>s.id===id));
 const audit={externalPositionWrites:0,recoveries:0,walkCalls:0,physicsCalls:0,leaderWrites:0,leaderMissing:0,roundCosts:{},budgetViolations:[]};
 let allowed=0;
 for(const id of ids){const u=q.e.unit(id);for(const axis of ['x','y']){let value=u[axis];Object.defineProperty(u,axis,{enumerable:true,configurable:true,get(){return value;},set(next){if(!allowed)audit.externalPositionWrites++;value=next;}});}}
 for(const method of ['walk','integrateBody']){const original=q.e[method].bind(q.e);q.e[method]=function(u,...args){
  const owns=ids.includes(u.id),before=u.moveLeft;if(owns){allowed++;audit[method==='walk'?'walkCalls':'physicsCalls']++;}
  let result;try{result=original(u,...args);}finally{if(owns)allowed--;}
  if(owns&&method==='walk'){
   const key=q.b.round+':'+u.id,cost=Math.max(0,before-u.moveLeft);audit.roundCosts[key]=(audit.roundCosts[key]||0)+cost;
   if(audit.roundCosts[key]>u.maxMove+.02)audit.budgetViolations.push({key,cost:audit.roundCosts[key],maxMove:u.maxMove});
  }
  return result;
 };}
 const recover=q.e.recover.bind(q.e);q.e.recover=function(u,...args){if(ids.includes(u.id))audit.recoveries++;return recover(u,...args);};
 return{...q,ids,audit,root,spec};
}
function destination(q,id,goal){const index=q.ids.indexOf(id);if(q.b.honroStage===28)return{x:q.spec.destination.x-index*80,y:q.spec.destination.y};const p=V.marker(q.b,goal);return{x:p.x-index*65,y:p.y};}
function goal(q){if(q.b.honroStage===28)return'evacuation';return V.current(q.b)?.id;}
function admitted(q,key){return q.b.honroStage===28?!!q.root.evacuationSafe:!!(q.b.honroStage===20?q.root.convoyGoals:q.root.carrierGoals)?.[key];}
function snapshot(q){return q.ids.map(id=>{const u=q.e.unit(id);return{id,x:numeric(u.x),y:numeric(u.y),hp:u.hp,maxMove:u.maxMove,moveLeft:numeric(u.moveLeft),distance:numeric(u.honroV4Distance||0),fixed:u.fixed,support:q.e.contactSurface(u.x,u.y-4,u.y+5)?.t.id||null,validContact:C.validTerrainContactPose(q.b.terrain,u),waypoint:q.root.escortWaypoints?.[(goal(q)||'')+':'+id]??null};});}
function run(stage){
 const q=fixture(stage),milestones=[],failures=[],starts=snapshot(q);let stagnant=0,previous='',lastGoal=goal(q),ticks=0;
 for(;ticks<MAX_ROUNDS*TICKS_PER_ROUND;ticks++){
  if(ticks&&ticks%TICKS_PER_ROUND===0){q.b.round++;q.b.teamEnds[0]++;q.b.teamEnds[1]++;}
  const currentGoal=goal(q);
  for(const [i,h]of V.heroes(q.b).entries()){
   const npc=q.e.unit(q.ids[i%q.ids.length]);q.audit.leaderWrites++;
   if(!supportedLeader(q,h,npc,140+(i%2)*30))q.audit.leaderMissing++;
  }
  // Production gravity settles ordinary falling bodies even while V.safe
  // pauses the mission loop. No actor position is repaired by the fixture.
  V.tick(q.app,DT);q.e.stepUnits(DT);
  if(admitted(q,currentGoal)){
   if(!milestones.some(m=>m.goal===currentGoal)){
    const actors=snapshot(q),at=actors.every(u=>near(q.e.unit(u.id),destination(q,u.id,currentGoal),stage===28?100:90)&&u.validContact);
    milestones.push({goal:currentGoal,round:q.b.round,ticks,atPhysicalGate:at,actors});
    if(!at)failures.push({kind:'premature-safe-gate',goal:currentGoal,actors,targets:q.ids.map(id=>({id,...destination(q,id,currentGoal)}))});
    if(stage===20&&currentGoal==='escort-mid'){
     // The defense/combat outcome is outside this locomotion test. Unlock only
     // its explicit later escort phase, without moving or replenishing NPCs.
     q.root.done['hold-convoy']=true;q.root.done['clear-pass']=true;
    }
   }
   if(stage===20&&currentGoal==='escape'){
    const p=V.marker(q.b,'20.outside'),u=V.heroes(q.b).find(u=>u.cls==='knight');Object.assign(u,{x:p.x-140,y:g.HonroMapEngine.surfaceY(q.b.terrain,p.x-140,undefined,'act2-floor').y,vx:0,vy:0,acted:false,airborne:false,jumping:false});Object.assign(q.b,{active:u.id,side:0,phase:'aim'});
    assert(V.use(q.app,p));for(let i=0;i<22;i++){q.b.phase='aim';q.b.side=0;V.tick(q.app,.05);}assert(q.root.outsideProof?.timeGapReady&&q.root.outsideProof?.townCrisisReady);assert(V.state(q.b).complete);assert.equal(q.root.slots['20.current-town-crisis.required'].context.source,'20.town-refugee');
   }
   if(stage===28||currentGoal===(stage===20?'escape':'dock-exit'))break;
  }
  if(q.ids.some(id=>!V.alive(q.e.unit(id)))){failures.push({kind:'actor-lost',goal:currentGoal,actors:snapshot(q)});break;}
  const pose=snapshot(q).map(u=>u.x+':'+u.y).join('|');
  stagnant=pose===previous&&goal(q)===lastGoal?stagnant+1:0;previous=pose;lastGoal=goal(q);
  // Three complete movement-budget rounds distinguish a real stall from an
  // exhausted actor waiting for the next legitimate round refill.
  if(stagnant>=TICKS_PER_ROUND*3){failures.push({kind:'stalled-three-rounds',goal:goal(q),actors:snapshot(q),engineBusy:q.e.settleBusy(),rootSafe:V.safe(q.app)});break;}
 }
 if(ticks===MAX_ROUNDS*TICKS_PER_ROUND)failures.push({kind:'round-budget-timeout',goal:goal(q),actors:snapshot(q)});
 const finalGoal=stage===28?'evacuation':stage===20?'escape':'dock-exit';
 if(!admitted(q,finalGoal))failures.push({kind:'safe-gate-not-admitted',goal:finalGoal,actors:snapshot(q)});
 const row={stage,passed:failures.length===0,fixture:'combat prerequisites supplied; actual terrain unchanged; continuously supported hero leadership; NPC movement/physics only; original NPC maxMove refreshed only by runtime once per six-second round',rounds:q.b.round,ticks,starts,milestones,failures,final:snapshot(q),audit:q.audit};
 rows.push(row);console.log(JSON.stringify(row));
 assert.equal(q.audit.externalPositionWrites,0,'No fixture/runtime teleport of NPC '+stage);
 assert.equal(q.audit.budgetViolations.length,0,'No per-frame refill or excess NPC budget '+stage);
}
for(const stage of [20,23])run(stage);
const failed=rows.filter(row=>!row.passed);
console.log(JSON.stringify({stages:rows.map(r=>({stage:r.stage,passed:r.passed})),scope:'physical convoy route regression only; no combat/fullplay/browser/art claim'}));
assert.equal(failed.length,0,'Convoy route failures: '+failed.map(row=>row.stage+':'+row.failures.map(f=>f.kind+'@'+f.goal).join(',')).join('; '));
