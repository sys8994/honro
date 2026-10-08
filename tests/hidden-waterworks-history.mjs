import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
import {beforeHiddenWaterworks,plain} from './act3-fiend-contract-helpers.mjs';
import {beforeOpenStructures} from './open-structure-history-helpers.mjs';
const g=await runtime({legacyMaps:false}),p=plain(g.HONRO_PROJECT),c=plain(g.HONRO_CONTENT),b=plain(g.HONRO_BALANCE),before=JSON.stringify({p,c,b});
const old=beforeHiddenWaterworks(p,c,b);assert.equal(JSON.stringify({p,c,b}),before,'Projection is read-only');
for(let id=1;id<=30;id++)if(id<23||id>28){assert.deepEqual(old.project.stages[id-1],p.stages[id-1]);assert.deepEqual(old.content.stages[id-1],c.stages[id-1]);assert.deepEqual(old.balance.stages[id-1],b.stages[id-1]);}
assert.deepEqual(old.project.library,beforeOpenStructures(p).library,'Projection preserves every asset beyond the exact D flag layer');
let rejected=0;
for(const id of [23,24,25,26,27,28])for(const mutate of [
 q=>q.units.find(u=>u.team==='enemy').id+='-drift',
 q=>q.units.find(u=>u.team==='enemy').stageOverrides.hp=1,
 q=>q.initialState.honroActiveLimit++,
 q=>q.markers[0].action='unapproved',
 q=>q.objectives[0].required=false
]){const q=plain(p);mutate(q.stages[id-1]);assert.throws(()=>beforeHiddenWaterworks(q,c,b));rejected++;}
for(const id of [23,24,25,26,27,28]){const content=plain(c);content.stages[id-1].steps.reverse();assert.throws(()=>beforeHiddenWaterworks(p,content,b));const balance=plain(b);balance.stages[id-1].targetHits++;assert.throws(()=>beforeHiddenWaterworks(p,c,balance));rejected+=2;}
console.log('PASS six exact approved mission/combat projections, untouched other 24 stages/library, '+rejected+' independent mutation rejections');
