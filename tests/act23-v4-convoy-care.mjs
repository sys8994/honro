/** Stage20 care: original runtime/Engine, explicit supported actor/combat poses. */
import assert from 'node:assert/strict';
import {runtimeCandidate,battlefield,plain} from './act23-v4-helpers.mjs';
const g=await runtimeCandidate(),V=g.HonroAct23V4,P=g.HonroAct23V4Act3,C=g.HONRO_CORE;
const pose=(q,u,x)=>Object.assign(u,{x,y:g.HonroMapEngine.surfaceY(q.b.terrain,x,undefined,'act2-floor').y,vx:0,vy:0,airborne:false,jumping:false,acted:false});
function make(){const q=battlefield(g,20),r=V.mem(q.b);for(const u of q.b.units)if(u.side===1){u.dead=true;u.hp=0;}for(const s of V.steps(q.b)){if(s.id==='escort-mid')break;r.done[s.id]=true;}r.convoyStarted=true;r.ringRemoved=true;for(const h of V.heroes(q.b))pose(q,h,7000);pose(q,q.e.unit('objective'),4000);pose(q,q.e.unit('convoy-mason'),5000);pose(q,q.e.unit('convoy-gilchan'),4900);q.b.active=V.heroes(q.b)[0].id;return q;}
function resume(q){const b=plain(q.b),e=new C.Engine(b,()=>{},true),app={...q.app,engine:e};V.prepare(b,q.p);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);V.bindApp(app,e);return{...q,b,e,app};}
function tick(q,n=1){for(let i=0;i<n;i++){Object.assign(q.b,{side:0,phase:'aim'});V.tick(q.app,.025);q.e.stepUnits(.025);}}
let q=make(),u=q.e.unit('objective');q.e.hurt(u,20,'fixture');assert(u.hp<u.maxHp);tick(q);let care=P.convoyCare(q.b);assert.equal(care.injured.status,'waiting-support');const stopped=u.x;tick(q,40);assert.equal(u.x,stopped);assert(!V.satisfied(q.b,V.steps(q.b).find(s=>s.id==='hold-convoy')));assert.equal(V.state(q.b).targets[0].id,'20.injured-support');const state=V.state(q.b);assert.equal(g.HonroObjectiveGuide.enhance(q.b,g.HONRO_CONTENT.stages[19],state),state,'generic guide must not replace candidate machine guidance with old escort prose');
q=resume(q);u=q.e.unit('objective');assert.equal(P.convoyCare(q.b).injured.status,'waiting-support');const h=V.heroes(q.b)[0];pose(q,h,u.x+110);tick(q,8);care=P.convoyCare(q.b);assert.equal(care.injured.supportId,h.id);assert(u.x>stopped);assert(care.injured.supportedDistance>0);const distance=care.injured.supportedDistance;
const budget=u.moveLeft;q=resume(q);u=q.e.unit('objective');assert.equal(u.moveLeft,budget,'Continue cannot refill spent NPC movement');assert.equal(P.convoyCare(q.b).injured.supportId,h.id);assert.equal(P.convoyCare(q.b).injured.supportedDistance,distance);pose(q,q.e.unit(h.id),7000);tick(q);const left=u.x;tick(q,30);assert.equal(u.x,left);assert.equal(P.convoyCare(q.b).injured.status,'waiting-support');
const replacement=V.heroes(q.b)[1];pose(q,replacement,u.x+110);q.e.unit(h.id).dead=true;q.e.unit(h.id).hp=0;tick(q,4);assert.equal(P.convoyCare(q.b).injured.supportId,replacement.id);assert(P.convoyCare(q.b).injured.joins>=2);console.log('PASS20 real hurt stops injury; proximity support walks; separation/death release; waiting/joined snapshot and replacement');
// Physical join/baggage at the authored rest: poses are explicit, elapsed
// animation and ownership transitions are production, no success flags forged.
q=make();u=q.e.unit('objective');q.e.hurt(u,20,'fixture');pose(q,u,5110);pose(q,V.heroes(q.b)[0],5210);pose(q,q.e.unit('convoy-mason'),5105);pose(q,q.e.unit('convoy-gilchan'),5200);tick(q,8);care=P.convoyCare(q.b);assert.equal(care.baggage.status,'handoff');assert.equal(care.baggage.owner,'convoy-mason');const elapsed=care.baggage.elapsed;q=resume(q);assert.equal(P.convoyCare(q.b).baggage.elapsed,elapsed);tick(q,30);care=P.convoyCare(q.b);assert.equal(care.baggage.status,'carried');assert.equal(care.baggage.owner,'convoy-gilchan');assert.equal(care.baggage.transfers,1);assert(V.mem(q.b).slots['20.gilchan-baggage'].status==='done');tick(q,40);assert.equal(care.baggage.transfers,1);assert(!P.careReady(q.b),'static rest pose cannot fabricate supported travel');console.log('PASS20 physical close baggage handoff resumes and transfers same item exactly once; static flags cannot replace care travel');
// Interrupted handoff uses real impulse/gravity, then production escort walking.
// Only heroes are guided with supported pose fixtures after the initial setup.
for(const saveAt of ['none','air','separated']){
 q=make();pose(q,q.e.unit('convoy-mason'),5105);pose(q,q.e.unit('convoy-gilchan'),5200);tick(q,8);let bag=P.convoyCare(q.b).baggage;assert.equal(bag.status,'handoff');assert(Math.abs(bag.elapsed-.2)<1e-8);const item=bag.id;
 q.e.impulse(q.e.unit('convoy-gilchan'),350,-160);q.e.stepUnits(.025);assert(!q.e.grounded(q.e.unit('convoy-gilchan')));
 if(saveAt==='air'){q=resume(q);tick(q,2);const b=P.convoyCare(q.b).baggage;assert.equal(b.owner,'convoy-mason');assert.equal(b.transfers,0);assert(b.elapsed<=.2,'air separation cannot advance the handoff');}
 // Deliberately defer mission ticks until grounded to also exercise a saved
 // old handoff snapshot with physically separated, otherwise healthy actors.
 for(let i=0;i<1000&&!q.e.grounded(q.e.unit('convoy-gilchan'));i++)q.e.stepUnits(.025);
 const father=q.e.unit('convoy-mason'),son=q.e.unit('convoy-gilchan');assert(C.validTerrainContactPose(q.b.terrain,son));assert(son.x-father.x>180);if(saveAt==='separated')q=resume(q);
 tick(q);bag=P.convoyCare(q.b).baggage;assert.equal(bag.status,'with-mason');assert.equal(bag.owner,'convoy-mason');assert.equal(bag.id,item);assert.equal(bag.elapsed,0);assert.equal(bag.transfers,0);assert(!q.e.unit('convoy-mason').honroScenePose&&!q.e.unit('convoy-gilchan').honroScenePose);q=resume(q);assert.equal(P.convoyCare(q.b).baggage.status,'with-mason');
 const from=q.e.unit('convoy-gilchan').x;let rejoined=false;
 for(let i=0;i<500&&P.convoyCare(q.b).baggage.status!=='carried';i++){
  const s=q.e.unit('convoy-gilchan'),h=V.heroes(q.b)[0];pose(q,h,s.x-110);if(i&&i%240===0)q.b.round++;tick(q);
  const b=P.convoyCare(q.b).baggage;if(b.status==='handoff'&&!rejoined){assert(V.near(q.e.unit('convoy-mason'),s,180));assert(s.x<from-100,'actual escort reapproach');rejoined=true;q=resume(q);}else if(!rejoined){assert.equal(b.owner,'convoy-mason');assert.equal(b.transfers,0);}
 }
 bag=P.convoyCare(q.b).baggage;assert(rejoined);assert.equal(bag.id,item);assert.equal(bag.status,'carried');assert.equal(bag.owner,'convoy-gilchan');assert.equal(bag.transfers,1);assert.equal(V.mem(q.b).slots['20.gilchan-baggage'].status,'done');q=resume(q);tick(q,80);assert.equal(P.convoyCare(q.b).baggage.transfers,1);console.log('PASS20 handoff impulse/air separation, '+saveAt+' save, same-item recovery, physical reapproach, joined resume and single transfer');
}
// Only stage20 candidate advances; old candidate live battles restart through
// the existing growth-preserving contract. Normal build remains untouched.
assert.equal(V.mapRevision(20),320);assert.equal(V.mapRevision(19),219);q.b.honroCampaignMapRevision=220;assert(g.HonroCampaignMapRevision.obsolete(q.b));const p=plain(q.p);p.honroBattle=plain(q.b);const before=plain(p.heroes);assert(g.HonroCampaignMapRevision.discard(p));assert.equal(p.honroMapRestart,20);assert.equal(p.honroBattle,null);assert.deepEqual(plain(p.heroes),before);console.log('PASS20 candidate220 resets only obsolete live battle to320, retaining profile growth');
