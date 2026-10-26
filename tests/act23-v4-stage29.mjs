import assert from 'node:assert/strict';
import {runtimeCandidate,battlefield} from './act23-v4-helpers.mjs';
// Explicit objective/occupancy fixtures; real Engine collision and walking.
const g=await runtimeCandidate(),P=g.HonroAct23V4Stage29,V=g.HonroAct23V4,C=g.HONRO_CORE;
const plain=v=>JSON.parse(JSON.stringify(v)),down=u=>{u.hp=0;u.dead=true;};
const live=b=>b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0),mem=b=>P.memory(b),make=()=>battlefield(g,29);
const boss=q=>q.e.unit(P.bossId),marker=(q,id)=>q.b.honroMarkers.find(m=>m.id===id);
function aim(q){Object.assign(q.b,{phase:'aim',side:0,active:'p-archer'});Object.assign(q.e.active,{acted:false,vx:0,vy:0,airborne:false,jumping:false});delete q.e.active.meleeAction;delete q.e.active.meleeFollow;}
function at(q,id){aim(q);Object.assign(q.e.active,{x:marker(q,id).x,y:marker(q,id).y});}
function boundary(q){
 const round=q.b.round;
 for(let i=0;i<120;i++){
  P.tick(q.app,0);
  if(q.b.phase==='aim'&&q.b.side===0){if(q.b.round>round)return;q.e.finishAction(true);}
  else if(q.b.phase==='enemy')q.e.finishAction(true);
  else if(q.b.phase==='transition')q.e.switchTeam();
  else q.e.tick(C.STEP);
 }
 assert.fail('bounded actual action/team cycle stalled: '+q.b.phase);
}
function resume(q){const b=plain(q.b),e=new C.Engine(b,()=>{},false),app={...q.app,engine:e,canInput:()=>e.canAct()};g.HonroEncounters.attach(app,e);P.attach(app,e);return{...q,b,e,app};}
function defeatScreen(q){for(const u of live(q.b))if(u.honroStage29Source==='stage29-command-screen')down(u);}
function startCollapse(q){at(q,'stage29-sluice');defeatScreen(q);const blockers=new Set(P.coverBlockers(q.b));for(const u of live(q.b))if(blockers.has(u.id))down(u);P.tick(q.app,0);assert(mem(q.b)['stage29-cover-warning']);assert(!mem(q.b).coverCommitted);}
function reclaim(q){at(q,'stage29-echo');assert.equal(P.use(q.app,marker(q,'stage29-echo')),false);at(q,'stage29-sluice');assert.equal(P.use(q.app,marker(q,'stage29-sluice')),true);assert.equal(mem(q.b).sluiceReclaimed,true);assert.equal(mem(q.b).checkpoints.filter(c=>c.id==='stage29-sluice-reclaimed').length,1);aim(q);}
function echo(q){at(q,'stage29-echo');assert.equal(P.use(q.app,marker(q,'stage29-echo')),true);for(let i=0;i<9;i++)P.tick(q.app,.05);assert(!V.mem(q.b).sceneDone['stage29-echo']);q=resume(q);for(let i=0;i<10;i++)P.tick(q.app,.05);assert.equal(V.mem(q.b).sceneDone['stage29-echo'],true);return q;}
function handoff(q,route){at(q,route==='A'?'route-upper-exit':'route-lower-exit');boundary(q);assert.equal(P.complete(q.b),true);assert.equal(q.b.honroRouteChoice.selectedRoute,route);q.b.phase='won';assert.deepEqual(plain(g.HonroRouteBranches.handoff(q.b)),{fromStage:29,toStage:30,choice:route,revision:1,sourceRun:q.b.session});assert(live(q.b).some(u=>u.id==='a3-29-moonlit-exit-watch-1'));}
{
 const q=make();assert.equal(live(q.b).length,32);assert.equal(q.b.units.filter(u=>u.id.startsWith('a3-29-')).length,27);assert.equal(q.b.honroV4Stage29Waves.reduce((n,s)=>n+s.n,0),11);
 assert.equal(q.b.units.filter(u=>u.honroStage29Required).length,5);assert(q.b.units.filter(u=>u.id.startsWith('stage29-shield-')).every(u=>u.loadout.includes('LS11')&&u.armor>=.26));
 assert(!q.b.honroMarkers.some(m=>['old-seal','hyeonmuk-letter'].includes(m.id)));assert.equal(q.b.honroEvents.length,0);
 for(const id of ['route-upper-exit','route-lower-exit','stage29-sluice','stage29-echo']){at(q,id);assert.equal(P.use(q.app,marker(q,id)),false);}
 at(q,'stage29-sluice');boss(q).hp=boss(q).maxHp*.05;P.tick(q.app,0);for(let i=0;i<5;i++)boundary(q);assert.equal(mem(q.b).phase,1,'HP/time cannot skip the command screen');assert(!mem(q.b)['stage29-cover-warning']);
}
// Counter changes or summon completion cannot stand in for main hero turns.
// Persist one genuinely ended action, then finish the remaining party through
// Engine.finishAction/switchTeam in four-, two- and one-survivor fixtures.
for(const count of [4,2,1]){
 let q=make();const team=q.b.units.filter(u=>u.side===0&&!u.summoned);for(const u of team.slice(count))down(u);startCollapse(q);
 q.b.teamEnds[1]+=8;q.app.actorBoundary='p-archer';P.tick(q.app,0);delete q.app.actorBoundary;assert(!mem(q.b).coverCommitted);
 if(count===4){const summon={...plain(q.e.active),id:'stage29-test-summon',summoned:true,summonActionRound:q.b.round,acted:false};q.b.units.push(summon);q.b.active=summon.id;q.e.finishAction(true);const w=mem(q.b)['stage29-cover-warning'];assert(!w.offered[summon.id]);assert(!w.ended[summon.id]);assert(!mem(q.b).coverCommitted);}
 P.tick(q.app,0);q.e.finishAction(true);const proof=plain(mem(q.b)['stage29-cover-warning']);assert(proof.ended['p-archer']);assert(!mem(q.b).coverCommitted,'proof waits for the next safe boundary');
 q=resume(q);assert.deepEqual(plain(mem(q.b)['stage29-cover-warning']),proof);boundary(q);assert(mem(q.b).coverCommitted);const w=mem(q.b)['stage29-cover-warning'];assert.equal(Object.keys(w.ended).length,count);assert.equal(Object.keys(w.offered).length,count);
}
// A warned collapse retains safe opportunity and occupancy checks after death.
{
 let q=make();startCollapse(q);const warning=plain(mem(q.b)['stage29-cover-warning']);down(boss(q));P.tick(q.app,0);assert.deepEqual(plain(mem(q.b)['stage29-cover-warning']),warning);q=resume(q);
 Object.assign(q.e.active,{x:3100,y:2220});boundary(q);assert(!mem(q.b).coverCommitted);assert(P.coverBlockers(q.b).includes(q.e.active.id));
 at(q,'stage29-sluice');q.b.stakes=[{id:987,x:3100,y:2200,active:true}];boundary(q);assert(!mem(q.b).coverCommitted);assert(P.coverBlockers(q.b).includes('stake:987'));
 q.b.stakes=[];q.b.projectiles=[{id:'occupancy-test',x:3100,y:2100,radius:8}];assert(P.coverBlockers(q.b).includes('projectile:occupancy-test'));P.tick(q.app,0);assert(!mem(q.b).coverCommitted);q.b.projectiles=[];
 const ray=(a,z)=>q.e.projectileCollision(a,z,1,q.e.active.id,[],false);assert.equal(ray({x:2960,y:2110},{x:3240,y:2110})?.terrain.id,'old-door');
 boundary(q);assert.equal(mem(q.b).gateGeometry,'fallen');assert.equal(mem(q.b).phase,1,'death does not jump phases');
 assert.equal(ray({x:2960,y:2110},{x:3240,y:2110}),null);assert.equal(ray({x:2960,y:2200},{x:3240,y:2200})?.terrain.id,'stage29-fallen-door');assert.equal(ray({x:3190,y:2200},{x:3320,y:2200})?.terrain.id,'stage29-fallen-stone');
 for(const list of [q.b.terrain,q.b.honroWorldTerrain].filter(Boolean)){assert(list.find(t=>t.id==='old-door').broken);for(const id of ['stage29-fallen-door','stage29-fallen-stone'])assert.equal(list.find(t=>t.id===id).broken,false);}
 const version=q.b.sceneVersion;for(let i=0;i<4;i++)boundary(q);assert.equal(q.b.sceneVersion,version);assert.equal(mem(q.b).checkpoints.filter(c=>c.id==='stage29-cover-commit').length,1);assert.equal(q.b.units.filter(u=>u.honroSpawnSource).length,0);
}
// Normal phase 3 waits for actual admitted soldiers, then uses real walking.
{
 let q=make();at(q,'stage29-sluice');P.tick(q.app,0);q=resume(q);assert.equal(mem(q.b).phase,1);assert.equal(boss(q).fixed,true);startCollapse(q);boundary(q);assert.equal(mem(q.b).phase,2);q=resume(q);
 boundary(q);assert.equal(mem(q.b).sources['stage29-rear'].admitted,true);boss(q).hp=boss(q).maxHp*.05;
 for(let i=0;i<4;i++)boundary(q);assert.equal(mem(q.b).phase,2,'living command guards prevent advance');assert.equal(boss(q).fixed,true);
 for(const u of live(q.b))if(u.honroStage29Required&&u.id!==P.bossId)down(u);boundary(q);assert.equal(mem(q.b).phase,3);q=resume(q);assert.equal(boss(q).fixed,false);
 for(let i=0;i<5;i++)boundary(q);for(const spec of q.b.honroV4Stage29Waves){assert.equal(mem(q.b).sources[spec.id].admitted,true);assert.equal(q.b.units.filter(u=>u.honroSpawnSource===spec.id).length,spec.n);}
 Object.assign(q.b,{phase:'enemy',side:1,active:P.bossId});Object.assign(boss(q),{acted:false,moveLeft:360,maxMove:360});const x=boss(q).x,move=boss(q).moveLeft;
 for(let i=0;i<18;i++)P.tick(q.app,.05);assert(boss(q).x<x);assert(boss(q).moveLeft<move);assert(mem(q.b).advanceDistance>0);assert.equal(mem(q.b).checkpoints.filter(c=>c.id==='stage29-phase-3').length,1);
 aim(q);q.e.hurt(boss(q),boss(q).maxHp*100,q.e.active.id,false);assert(mem(q.b).death.observed);assert(V.mem(q.b).slots['stage29-boss-defeated']);const death=plain(mem(q.b).death);q=resume(q);P.tick(q.app,0);assert.deepEqual(plain(mem(q.b).death),death);
 const count=q.b.units.length;for(let i=0;i<4;i++)boundary(q);assert.equal(q.b.units.length,count);
 const required=q.b.units.find(u=>u.honroStage29Source==='stage29-rear');q.b.units=q.b.units.filter(u=>u!==required);assert.equal(P.stepSatisfied(q.b,{id:'stage29-cohort'}),false);q.b.units.push(required);
 const source=mem(q.b).sources['stage29-rear'];delete mem(q.b).sources['stage29-rear'];assert.equal(P.stepSatisfied(q.b,{id:'stage29-cohort'}),false);mem(q.b).sources['stage29-rear']=source;
 reclaim(q);q=echo(q);handoff(q,'A');assert(live(q.b).some(u=>u.honroStage29Source==='act3-response-29-2'));
}
// Before collapse starts: stable physical opening, cancelled reserves, no phase jump.
for(const route of ['A','B']){
 let q=make();down(boss(q));P.tick(q.app,0);assert(mem(q.b).earlyKill);assert.equal(mem(q.b).phase,1);assert(!mem(q.b)['stage29-cover-warning']);assert(!V.mem(q.b).slots['stage29-boss-defeated']);
 for(const spec of q.b.honroV4Stage29Waves){const source=mem(q.b).sources[spec.id];assert(source.cancelled);assert.equal(source.admitted,false);assert.deepEqual(plain(source.ids),[]);}
 q=resume(q);boundary(q);assert.equal(mem(q.b).gateGeometry,'stable_open');assert(!mem(q.b).coverCommitted);assert.equal(P.stepSatisfied(q.b,{id:'stage29-cohort'}),false);defeatScreen(q);boundary(q);assert.equal(P.stepSatisfied(q.b,{id:'stage29-cohort'}),true);
 for(const list of [q.b.terrain,q.b.honroWorldTerrain].filter(Boolean)){assert(list.find(t=>t.id==='old-door').broken);for(const id of ['stage29-fallen-door','stage29-fallen-stone'])assert(list.find(t=>t.id===id).broken);}
 const door=q.b.terrain.find(t=>t.id==='old-door');door.broken=false;assert.equal(P.stepSatisfied(q.b,{id:'stage29-cover'}),false);door.broken=true;
 for(let i=0;i<6;i++)boundary(q);assert.equal(q.b.units.length,36);assert.equal(mem(q.b).phase,1);assert.equal(boss(q).hp,0);assert(live(q.b).length>=27);
 for(const phase of [1,2,3])assert(!V.mem(q.b).slots['stage29-phase-'+phase]);
 reclaim(q);q=echo(q);q=resume(q);at(q,'stage29-echo');assert.equal(P.use(q.app,marker(q,'stage29-echo')),false);handoff(q,route);assert(!Object.keys(q.b.honroFieldCargo?.cargo||{}).some(id=>id.includes('hyeonmuk-letter')));
}
// Death between admissions preserves the rear pair and cancels later reserves.
{
 let q=make();startCollapse(q);boundary(q);boundary(q);assert(mem(q.b).sources['stage29-rear'].admitted);assert(!mem(q.b).sources['stage29-vault-echo']?.admitted);down(boss(q));P.tick(q.app,0);q=resume(q);
 assert.equal(mem(q.b).sources['stage29-rear'].admitted,true);assert(mem(q.b).sources['stage29-vault-echo'].cancelled);assert.equal(P.stepSatisfied(q.b,{id:'stage29-cohort'}),false);
 for(const u of live(q.b))if(u.honroStage29Source==='stage29-rear')down(u);boundary(q);assert.equal(P.stepSatisfied(q.b,{id:'stage29-cohort'}),true);assert.equal(mem(q.b).phase,2);assert.equal(q.b.units.filter(u=>u.honroSpawnSource).length,2);
}
console.log('Stage29: real 4/2/1-hero action opportunities with summon/save isolation, cover safety/collision, command-gated phases/walk, stable early opening, reserve cancellation, admitted-only clearance, observed death, sluice, echo resume and A/B handoff passed (Engine fixtures; no normal-play/UI claim).');
