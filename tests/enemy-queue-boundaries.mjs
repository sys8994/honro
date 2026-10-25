import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x));
const {b,e}=battlefield(g,5),u=b.units.find(u=>u.honroType==='human'),hero=b.units.find(u=>u.side===0);b.units=[u,hero];u.loadout=['LA01','LA02'];u.focus=u.maxFocus;u.cooldowns={};
// A blocked first attack cannot hide an available second offensive skill.
const probe=Object.create(e);probe.b={...b,units:[u,hero]};let predictions=0;
probe.npcShotInReach=()=>true;probe.shotSeeds=()=>[{angle:0,power:1},{angle:40,power:1}];probe.predict=(_u,sk)=>{predictions++;return sk.id==='LA02'?{unit:hero.id,x:hero.x,y:hero.y-hero.h*.5,closest:0}:{terrain:'blocked',x:u.x,y:u.y-100,closest:9999};};
assert.equal(C.rankEnemyQueue(probe,[u])[0].tier,2);assert(predictions<=6);
// Queue work yields under the production frame budget. A partial plan consumes
// no control opportunity and Continue resumes by deterministically replanning.
b.phase='transition';b.side=0;e.checkEnd=()=>false;e.refreshActivation=()=>{};u.awake=true;u.aggroUntil=999;u.stun=1;
e.planningBudget(.00001);e.switchTeam();assert.equal(b.side,0);assert.equal(u.stun,1);
const resumed=plain(b),r=new C.Engine(resumed);r.checkEnd=()=>false;r.refreshActivation=()=>{};
e.planningBudget();r.planningBudget();e.switchTeam();r.switchTeam();assert.deepEqual(plain(resumed.queue),plain(b.queue));assert.equal(u.stun,0);assert.equal(r.unit(u.id).stun,0);
// Both authored reserve wrappers may rotate a useful nearby first opportunity,
// but cannot replace a ready attack with a far/blocked or approach-only actor.
for(const module of [g.HonroEncounterDensity,g.HonroStage22Vertical]){
 const density=module===g.HonroEncounterDensity,queue=['a','b','c','d'],fresh={id:'wave',dead:false,hp:100,lastAct:0,honroDensityBornRound:1,honroVertical22BornRound:1,x:4000,y:1000};
 const actors=[...queue.map(id=>({...fresh,id,honroDensityBornRound:undefined,honroVertical22BornRound:undefined,x:1100})),fresh],scores=new Map(actors.map(a=>[a.id,{tier:2,band:0}]));scores.set('wave',{tier:0,band:12});
 const b={honroStage:density?23:22,honroCustom:false,honroEncounterDensityRevision:1,honroDensityQueueReserve:1,honroVerticalStage22Revision:1,honroVerticalStage22EncounterRevision:1,enemyLimit:4,round:2,queue};
 const e={b,unit:id=>actors.find(a=>a.id===id),combatEnemies:()=>actors,heroesAlive:()=>[{x:1000,y:1000}],enemyQueuePriority:u=>u&&scores.get(u.id)};
 assert.equal(module.reserveQueue(e),queue);scores.set('wave',{tier:1,band:0});assert.equal(module.reserveQueue(e),queue);scores.set('wave',{tier:2,band:9});assert.equal(module.reserveQueue(e),queue);scores.set('wave',{tier:2,band:0});fresh.x=1150;assert.deepEqual(plain(module.reserveQueue(e)),['a','b','c','wave']);
}
console.log('PASS second offensive skill within fixed budget, sliced queue/control/Continue boundaries, both bounded relevant reserve slots');
