import assert from 'node:assert/strict';
import {runtimeCandidate,battlefield} from './act23-v4-helpers.mjs';

const g=await runtimeCandidate(),P=g.HonroAct23V4Stage29,V=g.HonroAct23V4,C=g.HONRO_CORE;
const plain=v=>JSON.parse(JSON.stringify(v));
const down=u=>{u.hp=0;u.dead=true;};
const live=b=>b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0);
const mem=b=>P.memory(b);
const boundary=q=>{q.b.honroState.actorTurnSerial=(q.b.honroState.actorTurnSerial||0)+1;q.b.teamEnds[1]++;q.b.round++;q.app.actorBoundary=q.b.units.find(u=>u.side===0&&!u.dead).id;P.tick(q.app,0);delete q.app.actorBoundary;};
const make=()=>battlefield(g,29);
function flush(q){let clearedBeforePressure=false;
 for(let i=0;i<18;i++){
  // Defeat the command cohort and the single ambient door occupant required
  // to vacate the collapse sweep. Remote ambient/route guards stay alive.
  const blockers=new Set(P.coverBlockers(q.b));for(const u of live(q.b))if(u.honroStage29Required||blockers.has(u.id))down(u);
  boundary(q);const allAdmitted=q.b.honroV4Stage29Waves.every(w=>mem(q.b).sources[w.id]?.admitted);
  if(P.stepSatisfied(q.b,{id:'stage29-cohort'})&&!allAdmitted)clearedBeforePressure=true;
  if(allAdmitted&&!live(q.b).some(u=>u.honroStage29Required))break;
 }
 assert(clearedBeforePressure,'optional route-pressure admission does not gate the command objective');
 assert(!live(q.b).some(u=>u.honroStage29Required));assert(live(q.b).some(u=>u.id==='a3-29-moonlit-exit-watch-1'),'unrelated exit guard remains alive');assert.equal(Object.keys(mem(q.b).sources).length,5);
}
function echo(q){const u=q.e.active,m=q.b.honroMarkers.find(m=>m.id==='stage29-echo');Object.assign(u,{x:m.x,y:m.y});assert.equal(P.use(q.app,m),true);assert.equal(V.mem(q.b).sceneDone?.['stage29-echo'],undefined);for(let i=0;i<19;i++)P.tick(q.app,.05);assert.equal(V.mem(q.b).sceneDone['stage29-echo'],true);assert.equal(mem(q.b).echo.done,true);}
function resume(q){const b=plain(q.b),e=new C.Engine(b,()=>{},false),app={...q.app,engine:e};P.attach(app,e);return{...q,b,e,app};}

// Authored candidate retains the large map's actual roster and both exits.
{
 const q=make();assert.equal(q.b.units.filter(u=>u.side===1).length,32);assert.equal(q.b.honroV4Stage29Waves.reduce((n,s)=>n+s.n,0),11);
 assert.equal(q.b.units.filter(u=>u.id.startsWith('a3-29-')).length,27);
 assert.equal(q.b.units.filter(u=>u.id.startsWith('stage29-shield-')).length,2);
 assert(q.b.units.filter(u=>u.id.startsWith('stage29-shield-')).every(u=>u.loadout.includes('LS11')&&u.armor>=.26));
 assert.equal(q.b.units.filter(u=>u.id.startsWith('stage29-upper-')).length,2);
 assert.equal(q.b.units.filter(u=>u.honroStage29Required).length,5);assert(q.b.units.filter(u=>u.id.startsWith('a3-29-')).every(u=>!u.honroStage29Required));
 assert.equal(q.b.honroV4Stage29Waves.filter(s=>s.required).reduce((n,s)=>n+s.n,0),4);
 assert(!q.b.honroMarkers.some(m=>['old-seal','hyeonmuk-letter'].includes(m.id)));
 assert(!q.b.honroAct3Steps.some(s=>['old-seal','hyeonmuk-letter'].includes(s.id)));
 assert.equal(q.b.honroEvents.length,0);
 assert.equal(P.complete(q.b),false);
 for(const id of ['route-upper-exit','route-lower-exit']){const m=q.b.honroMarkers.find(m=>m.id===id);Object.assign(q.e.active,{x:m.x,y:m.y});q.app.actorBoundary=q.e.active.id;assert.equal(P.use(q.app,m),false);assert(!q.b.honroRouteChoice?.selectedRoute);}
}

// Full swept area, including a hero, a stake and a projectile, blocks the
// atomic commit. These are explicit occupancy fixtures, not combat completion.
{
 const q=make(),u=q.e.active;for(const v of live(q.b))down(v);P.tick(q.app,0);
 const version=q.b.sceneVersion;Object.assign(u,{x:3100,y:2220});boundary(q);assert(!mem(q.b).coverCommitted);assert(P.coverBlockers(q.b).includes(u.id));
 Object.assign(u,{x:2800,y:2220});q.b.stakes=[{id:987,x:3100,y:2200,active:true}];boundary(q);assert(!mem(q.b).coverCommitted);assert(P.coverBlockers(q.b).includes('stake:987'));
 q.b.stakes=[];q.b.projectiles=[{id:'occupancy-test',x:3100,y:2100,radius:8}];boundary(q);assert(!mem(q.b).coverCommitted);
 q.b.projectiles=[];
 const ray=(a,z)=>q.e.projectileCollision(a,z,1,u.id,[],false);
 assert.equal(ray({x:2960,y:2110},{x:3240,y:2110})?.terrain.id,'old-door');
 boundary(q);assert.equal(mem(q.b).coverCommitted,true);assert(q.b.sceneVersion>version);const committedVersion=q.b.sceneVersion;
 assert.equal(ray({x:2960,y:2110},{x:3240,y:2110}),null,'upper vault shot opens');
 assert.equal(ray({x:2960,y:2200},{x:3240,y:2200})?.terrain.id,'stage29-fallen-door','fallen wood really blocks a low shot');
 for(const list of [q.b.terrain,q.b.honroWorldTerrain].filter(Boolean)){assert.equal(list.find(t=>t.id==='old-door').broken,true);assert.equal(list.find(t=>t.id==='stage29-fallen-door').broken,false);}
 for(let i=0;i<4;i++)boundary(q);assert.equal(q.b.sceneVersion,committedVersion,'topology commits once');assert.equal(mem(q.b).checkpoints.filter(c=>c.id==='stage29-cover-commit').length,1);
}

// Each phase survives Engine JSON resume. Phase 3 advances through the real
// walking primitive, consuming the existing movement budget and collision.
{
 let q=make(),u=q.b.units.find(u=>u.id===P.bossId);q.e.active.x=2800;q.e.active.y=2220;P.tick(q.app,0);assert.equal(mem(q.b).phase,1);q=resume(q);u=q.b.units.find(u=>u.id===P.bossId);
 assert.equal(u.fixed,true);for(const v of live(q.b))if(v.id!==u.id)down(v);u.hp=u.maxHp*.65;P.tick(q.app,0);boundary(q);assert.equal(mem(q.b).phase,2);q=resume(q);u=q.b.units.find(u=>u.id===P.bossId);
 assert.equal(mem(q.b).coverCommitted,true);u.hp=u.maxHp*.3;P.tick(q.app,0);assert.equal(mem(q.b).phase,3);q=resume(q);u=q.b.units.find(u=>u.id===P.bossId);
 Object.assign(q.b,{phase:'enemy',side:1,active:u.id});Object.assign(u,{acted:false,moveLeft:360,maxMove:360});const x=u.x,move=u.moveLeft;
 for(let i=0;i<18;i++)P.tick(q.app,.05);assert(u.x<x,'boss physically walks forward');assert(u.moveLeft<move,'walk uses normal move budget');assert(mem(q.b).advanceDistance>0);
 assert.equal(mem(q.b).checkpoints.filter(c=>c.id==='stage29-phase-3').length,1);
}

// A flank kill cannot resurrect or lock the boss behind phases. The commanded
// cohort, physical echo and either route remain mandatory; ambient guards do not.
for(const route of ['A','B']){
 let q=make();down(q.b.units.find(u=>u.id===P.bossId));P.tick(q.app,0);assert.equal(mem(q.b).earlyKill,true);assert.equal(P.complete(q.b),false);
 assert(!V.mem(q.b).slots?.['stage29-phase-1']);q=resume(q);flush(q);
 assert.equal(mem(q.b).phase,3);assert.equal(mem(q.b).checkpoints.filter(c=>c.id==='stage29-boss-death').length,1);
 assert.equal(q.b.units.filter(u=>u.honroSpawnSource&&u.honroStage29Source).length,11);
 for(const w of q.b.honroV4Stage29Waves){assert.equal(q.b.units.filter(u=>u.honroSpawnSource===w.id).length,w.n);assert.equal(mem(q.b).checkpoints.filter(c=>c.id==='stage29-source:'+w.id).length,1);}
 const count=q.b.units.length;for(let i=0;i<8;i++)boundary(q);assert.equal(q.b.units.length,count,'finite cohorts never respawn');
 const initial=q.b.units.find(u=>u.id==='stage29-upper-0'),wave=q.b.units.find(u=>u.honroStage29Source==='stage29-rear');
 for(const required of [initial,wave]){q.b.units=q.b.units.filter(u=>u!==required);assert.equal(P.stepSatisfied(q.b,{id:'stage29-cohort'}),false,'missing commanded member cannot count as defeated');q.b.units.push(required);}
 const admission=mem(q.b).sources['stage29-rear'];delete mem(q.b).sources['stage29-rear'];assert.equal(P.stepSatisfied(q.b,{id:'stage29-cohort'}),false,'absent source cannot count as defeated');mem(q.b).sources['stage29-rear']=admission;
 assert.equal(P.complete(q.b),false);echo(q);q=resume(q);assert.equal(P.use(q.app,q.b.honroMarkers.find(m=>m.id==='stage29-echo')),false);
 const m=q.b.honroMarkers.find(m=>m.id===(route==='A'?'route-upper-exit':'route-lower-exit'));Object.assign(q.b,{phase:'aim',side:0});Object.assign(q.e.active,{x:m.x,y:m.y});boundary(q);
 assert.equal(P.complete(q.b),true);assert.equal(q.b.honroRouteChoice.selectedRoute,route);q.b.phase='won';const handoff=g.HonroRouteBranches.handoff(q.b);assert.equal(handoff.toStage,30);assert.equal(handoff.choice,route);assert.equal(handoff.sourceRun,q.b.session);
 assert(live(q.b).some(u=>u.id==='a3-29-moonlit-exit-watch-1'));assert(live(q.b).some(u=>u.honroStage29Source==='act3-response-29-2'),'unrelated finite route-pressure cohort may also remain alive');
 assert(!V.mem(q.b).slots?.['stage29-phase-2']);assert(!V.mem(q.b).slots?.['stage29-phase-3']);
 assert(!Object.keys(q.b.honroFieldCargo?.cargo||{}).some(id=>id.includes('hyeonmuk-letter')));
}
console.log('Stage29 Phase A: roster, route gates, collision/occupancy, three-phase resume, real walk, early kill, finite waves, command-only clearance, echo and A/B handoff with living ambient guards passed (model/Engine fixtures; no real UI claim).');
