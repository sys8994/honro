import assert from 'node:assert/strict';import {coastFlankGoal as goal} from './coast-flank-route.mjs';
const u={id:'mage',cls:'mage',x:2157,y:2112,moveLeft:2728,r:24},target={id:'enemy',x:2449,y:2191,hp:248,support:'approved40-coast-west'},a={support:target.support,foes:[target],heroes:[],surface:v=>v.support||(v.x>=180&&v.x<=3600&&v.y===2259?target.support:'other'),terrains:[{id:target.support,x:180,w:3420}],topAt:(_,x)=>x<3200?2259:NaN};
assert.equal(goal(u,a).x,2729);assert.equal(goal(u,{...a,heroes:[{id:'archer',x:2729,y:2259,hp:100,r:24}]}).x,2889);
assert.equal(goal(u,{...a,foes:[{...target,dead:true,hp:0}]}),null);assert.equal(goal({...u,moveLeft:200},a),null);assert.equal(goal({...u,cls:'knight'},a),null);assert.equal(goal(u,{...a,support:'approved40-dock'}),null);assert.equal(goal(u,{...a,topAt:()=>NaN}),null);
console.log('Current foe, support, movement budget and occupied-goal fixtures passed. No gameplay claim.');

// Production topAt returns a finite clamped height beyond3600; reject it.
assert.equal(goal(u,{...a,foes:[{...target,x:3289}],heroes:[{id:'archer',x:3569,y:2259,hp:100,r:24}],topAt:()=>2259}),null);
assert.equal(goal(u,{...a,surface:v=>v.support||'overlapping-other-support'}),null);
