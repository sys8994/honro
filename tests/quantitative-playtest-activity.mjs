import assert from 'node:assert/strict';
import {EnemyActivity,acceptedDrop,hitObservation} from '../tools/quantitative-playtest/activity.mjs';
const a=new EnemyActivity(),u={id:'foe',side:1,hp:100,shield:0},v={id:'ally',side:1,hp:90,shield:0};
for(let i=0;i<100;i++)a.begin(u,1,[u,v]);assert.equal(a.summary().maxEnemyPlanningParticipantsPerRound,1);assert.equal(a.summary().maxActingEnemiesPerRound,0);
assert.equal(a.finish(u,1,[u,v]),false);v.hp=100;assert.equal(a.finish(u,1,[u,v]),true);assert.equal(a.summary().maxActingEnemiesPerRound,1);
assert.equal(a.executed(u,1,'fire'),true);assert.equal(a.executed(u,1,'fire'),false);assert.equal(a.executed({id:'hero',side:0},1,'fire'),false);
a.executed(v,1,'movement');assert.equal(a.summary().maxActingEnemiesPerRound,2);assert.deepEqual(a.summary().enemyActivityByRound[0].actors[0].kinds,['observed-support-change','fire']);
console.log('PASS planning retries excluded; accepted fire, real movement and observed support evidence counted once per actor/round');

const prepare={phase:'prepare',elapsed:0,originY:400,contacts:[{id:'one-way',edge:0}]};
assert(acceptedDrop(undefined,prepare));assert(!acceptedDrop(prepare,prepare));assert(!acceptedDrop(undefined,undefined));assert(!acceptedDrop(undefined,{...prepare,phase:'fall'}));assert(!acceptedDrop(undefined,{...prepare,contacts:[]}));
console.log('PASS free grounded drop prepare transition accepted exactly once; rejected/no-state drops excluded');

const attacker={id:'hero',x:10,y:20,attack:100,ranks:{A01:1}},target={facing:-1,armor:.3};
const hit=hitObservation({unit:()=>attacker,b:{shot:8}},[target,42,'hero',true,{skill:'A01',skillRank:1,shot:7,damageRoll:.95},{x:30,y:40}]);
assert.equal(hit.skill,'A01');assert.equal(hit.shot,7);assert.equal(hit.direct,true);assert.deepEqual(hit.source,{x:30,y:40});attacker.ranks.A01=2;assert.equal(hit.ownerState.ranks.A01,1);assert(!('critical' in hit));
console.log('PASS passive hit provenance snapshots, production-only critical evidence');
