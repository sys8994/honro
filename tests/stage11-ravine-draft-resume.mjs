/** Preserve the reviewed ravine draft as well as the older public Stage11 save.
 * Controlled partial-state fixture; this is not a normal-play completion. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const f=JSON.parse(await readFile('tests/fixtures/stage11-ravine-draft-save.json','utf8')),g=await runtime({legacyMaps:false}),plain=v=>JSON.parse(JSON.stringify(v));
assert.equal(f.sourceCommit,'4b061b878b820b85facb1164c46aaf6b9b37f656');
for(const name of ['initial','partial']){
 const b=plain(f[name]),before=plain(b),e=new g.HONRO_CORE.Engine(b,()=>{},false),app={engine:e,stage:g.HONRO_CONTENT.stages[10],profile:plain(f.profile),training:false,done:false,event(){},sayLines(){},checkMission(){return false;}};
 assert.equal(b.honroStage11EncounterRevision,1);assert(!b.honroStage11LandscapeRevision);
 for(let i=0;i<2;i++){g.HonroStageRules.sanitizeStageBattle(b);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);assert.deepEqual(plain(b),before,name+' retains all old geometry/art/units/stats/goals/events/progress on repeated Continue');}
 if(name==='partial'){assert.equal(b.honroState.act2.holds['hold-knots'].progress,2);assert.equal(b.honroState.act2.holds['hold-knots'].spawned,3);assert.deepEqual(plain(b.honroState.pendingEvents),['ravine-response-ritual-east-turn']);assert(b.units.find(u=>u.honroProtected).hp<b.units.find(u=>u.honroProtected).maxHp);}
 console.log('PASS reviewed draft '+name+': exact original battle after repeated Continue');
}
