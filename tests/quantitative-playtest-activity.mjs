import assert from 'node:assert/strict';
import {EnemyActivity} from '../tools/quantitative-playtest/activity.mjs';
const a=new EnemyActivity(),u={id:'foe',side:1,hp:100,shield:0},v={id:'ally',side:1,hp:90,shield:0};
for(let i=0;i<100;i++)a.begin(u,1,[u,v]);assert.equal(a.summary().maxEnemyPlanningParticipantsPerRound,1);assert.equal(a.summary().maxActingEnemiesPerRound,0);
assert.equal(a.finish(u,1,[u,v]),false);v.hp=100;assert.equal(a.finish(u,1,[u,v]),true);assert.equal(a.summary().maxActingEnemiesPerRound,1);
assert.equal(a.executed(u,1,'fire'),true);assert.equal(a.executed(u,1,'fire'),false);assert.equal(a.executed({id:'hero',side:0},1,'fire'),false);
a.executed(v,1,'movement');assert.equal(a.summary().maxActingEnemiesPerRound,2);assert.deepEqual(a.summary().enemyActivityByRound[0].actors[0].kinds,['observed-support-change','fire']);
console.log('PASS planning retries excluded; accepted fire, real movement and observed support evidence counted once per actor/round');
