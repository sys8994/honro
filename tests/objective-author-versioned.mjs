import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),copy=x=>JSON.parse(JSON.stringify(x)),R=g.HonroObjectiveRevision;
const source=copy(g.HONRO_PROJECT),before=copy(source),p=copy(R.author(source,{force:true}));
assert.deepEqual(source,before,'Author does not mutate input');
assert.deepEqual(copy(R.author(p,{force:true})),p,'Force author reaches a fixed point');
for(const id of [23,24,25,26,27,28]){
 const map=p.stages[id-1],old=before.stages[id-1],st=g.HONRO_CONTENT.stages[id-1];
 assert.equal(map.initialState.honroWaterworksRevision,[25,27].includes(id)?3:1,'Only C25/27 use the reviewed v3 author');
 assert.deepEqual(map.terrains,old.terrains,'Versioned terrain is never processed through legacy removals');
 assert.deepEqual(map.markers.map(m=>m.id),old.markers.map(m=>m.id),'Versioned marker identity/order stays authored');
 assert.deepEqual(map.initialState.honroAct3Steps,copy(st.steps));
 for(const step of st.steps){const m=map.markers.find(m=>m.id===step.id);assert(m);assert.equal(m.label,step.label);assert.equal(m.requiredClass,step.requiredClass);}
}
for(const saved of g.HONRO_SPLIT_V1.stages){
 const legacy={...copy(p),stages:[copy(saved)]},after=copy(R.author(legacy,{force:true})).stages[0];
 assert.deepEqual(after,copy(saved),'v1 saved canonical author remains fixed: '+saved.metadata.stageId);
}
assert.match(p.stages[22].markers.find(m=>m.id==='dock-exit').label,/지상/);
assert.match(p.stages[23].markers.find(m=>m.id==='garden-exit').label,/지상과 지하/);
console.log('PASS versioned force author: immutable input, v2/v3 marker/source agreement and terrain/order preservation, exact v1 fixed points');
