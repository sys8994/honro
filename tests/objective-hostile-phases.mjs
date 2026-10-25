import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,plain=v=>JSON.parse(JSON.stringify(v)),O=g.HonroObjectives;
for(const id of [3,5,7]){
 const {b,st}=battlefield(g,id);if(id===3)b.honroState.ledger=true;if(id===5)for(const t of g.HonroQuestTargets.records(b).filter(t=>t.honroSeal)){t.broken=true;const u=b.units.find(u=>u.id===t.id);if(u){u.dead=true;u.hp=0;}}if(id===7)b.honroState.rescuedCount=3;
 b.teamEnds=[0,0];b.round=1;b.side=0;
 assert(O.state(b,st).objectiveReady);O.updateSettlement(b,st,true);assert(!O.state(b,st).complete);
 b.teamEnds[0]++;b.side=1;assert(!O.state(b,st).complete,'Player End Turn is no protection');
 b.teamEnds[1]++;assert(!O.state(b,st).complete,'One hostile phase is insufficient');O.updateSettlement(b,st,true);assert.equal(b.honroState.objectiveSettlement.progress,1);
 const saved=JSON.stringify(b),resumed=plain(b);new C.Engine(resumed);O.updateSettlement(resumed,st,true);assert.equal(resumed.honroState.objectiveSettlement.progress,1,'Continue cannot add credit');
 resumed.round++;resumed.teamEnds[0]++;assert(!O.state(resumed,st).complete);resumed.teamEnds[1]++;assert(O.state(resumed,st).complete);O.updateSettlement(resumed,st,true);assert.equal(resumed.honroState.objectiveSettlement.progress,2);
 // Completing inside a hostile phase requires two subsequent full phases.
 const partial=plain(JSON.parse(saved));delete partial.honroState.objectiveSettlement;delete partial.honroState.objectiveReadyRound;partial.teamEnds=[1,0];partial.side=1;O.updateSettlement(partial,st,true);partial.teamEnds[1]++;assert.equal(O.settlement(partial,st).progress,0);partial.teamEnds[1]++;assert.equal(O.settlement(partial,st).progress,1);partial.teamEnds[1]++;assert(O.state(partial,st).complete);
 const ended=plain(partial);delete ended.honroState.objectiveSettlement;delete ended.honroState.objectiveReadyRound;ended.phase='transition';ended.teamEnds=[1,1];O.updateSettlement(ended,st,true);ended.teamEnds[1]++;assert.equal(O.settlement(ended,st).progress,1,'An already ended hostile phase must not skip the next full phase');ended.teamEnds[1]++;assert(O.state(ended,st).complete);
 // Existing completion and already earned legacy progress are never revoked.
 const old=plain(b);delete old.honroState.objectiveSettlement;old.honroState.objectiveReadyRound=1;old.round=id===7?3:2;O.updateSettlement(old,st,true);assert(O.state(old,st).complete);
 if(id===7){delete old.honroState.objectiveSettlement;old.round=2;O.updateSettlement(old,st,true);assert.equal(old.honroState.objectiveSettlement.progress,1);assert(!O.state(old,st).complete);}
}
// Warned, safe, finite response using production spawning, not mocked admission.
{
 const {b,e,app,st}=battlefield(g,3),ledger=b.honroMarkers.find(m=>m.type==='ledger');b.honroState.ledger=true;b.units=b.units.filter(u=>u.side===0||u.honroObjectiveTarget);for(const u of e.heroesAlive()){u.x=ledger.x;u.y=ledger.y;}app.actorBoundary=b.active;b.honroState.actorTurnSerial=1;
 O.updateSettlement(b,st,true);g.HonroMission.reinforceHold(app,false);assert(b.honroState.habitatHold.warning);assert.equal(b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget).length,0);
 b.honroState.actorTurnSerial++;g.HonroMission.reinforceHold(app,false);const spawned=b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget);assert(spawned.length>0&&spawned.length<=3);assert.equal(b.honroState.habitatHold.remaining,6-spawned.length);
 const rank=C.rankEnemyQueue(e,e.combatEnemies());assert(rank.some(p=>p.tier>0),'Response has a legal shot or real approach to the protected group');
 for(const u of spawned)assert(e.heroesAlive().every(h=>Math.hypot(h.x-u.x,h.y-u.y)>100));
 b.honroState.habitatHold.remaining=0;const count=b.units.length;for(let i=0;i<5;i++){b.round++;b.honroState.actorTurnSerial++;g.HonroMission.reinforceHold(app,true);}assert.equal(b.units.length,count);
}
console.log('PASS two full hostile phases, partial phase exclusion, Continue, legacy earned/completed states, warned finite reachable hold response');
