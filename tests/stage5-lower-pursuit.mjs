import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {runtime} from '../game/tests/helpers.mjs';

// Exact saved input boundaries from fullplay-clearance. The first branch keeps
// all bodies; the second explicitly isolates an open lane, not encounter play.
const fixture=JSON.parse(gunzipSync(await readFile(new URL('./fixtures/stage5-waterfall/lower-pursuit-r7.json.gz',import.meta.url))));
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
const action=g.HONRO_PROJECT.stages[4].events.find(e=>e.id==='lower-beasts').action;
assert.deepEqual(Array.from(action.pursuitSupports),['valley-floor','stage5-ritual-stone']);
function load(snapshot){
 const b=structuredClone(snapshot.battle),e=new C.Engine(b);
 e.checkEnd=()=>false;
 g.HonroStage5Positioning.assignPursuit({engine:e},action,b.units.filter(u=>u.honroSpawnSource==='lower-beasts'));
 return e;
}
const crowded=load(fixture.snapshot),rear=crowded.unit('event-16');
assert.equal(C.targetFor(crowded,rear).id,'p-mage');
const blocked=C.planEnemyMove(crowded,rear,C.targetFor(crowded,rear));
assert.ok(!blocked||blocked.path.at(-1).x>=rear.x,'a healthy blocked pursuer must not retreat into oscillation');
for(const u of crowded.b.units.filter(u=>u.honroSpawnSource==='lower-beasts')){
 const p=C.planEnemyMove(crowded,u,C.targetFor(crowded,u));
 for(const step of p?.path||[])assert.ok(action.pursuitSupports.includes(crowded.surface(step.x,step.y-4,step.y+4)?.t.id),'waypoint must use the lower authored route');
}
const restored=new C.Engine(JSON.parse(JSON.stringify(crowded.b)));
assert.deepEqual(Array.from(restored.unit(rear.id).honroPursuitSupports),Array.from(action.pursuitSupports));
assert.equal(C.targetFor(restored,restored.unit(rear.id)).id,'p-mage');

const e=load(fixture.contactSnapshot),b=e.b,u=e.unit('event-21'),start=u.x,fires=[],rows=[];
b.units=b.units.filter(v=>v.id===u.id||v.side===0||v.honroObjectiveTarget);
const fire=e.fire.bind(e);
e.fire=(...args)=>{const r=fire(...args);if(b.active===u.id&&r)fires.push({round:b.round,skill:args[0]});return r;};
for(let opportunity=0;opportunity<4&&!fires.length;opportunity++){
 const x=u.x,move=u.moveLeft;
 Object.assign(b,{side:1,active:u.id,phase:'enemy',queue:[u.id]});
 for(let tick=0;tick<1800&&!u.acted;tick++)e.tick(C.STEP);
 assert.ok(u.acted,'normal AI must finish within a bounded opportunity');
 assert.ok(u.x>=x-1,'unobstructed lower pursuit must progress without alternating retreats');
 assert.ok(u.moveLeft>=0&&u.moveLeft<=move,'movement must spend its normal budget');
 rows.push({round:b.round,x:u.x,y:u.y,moveLeft:u.moveLeft});
 if(!fires.length)e.newRound();
}
assert.ok(u.x>start+900,'actual body must traverse the undercut');
assert.ok(fires.some(f=>f.skill==='HBM03'),'normal melee AI must obtain an attack opportunity');
console.log(JSON.stringify({scope:'Saved-boundary regression; open-lane branch omits unrelated enemy bodies, retains actual hero/selected actor state. Not a full encounter win.',rows,fires}));
console.log('stage5 lower pursuit: PASS');
