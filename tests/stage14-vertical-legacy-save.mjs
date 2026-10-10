/** Independent access to the original pre-spatial-redesign R8 save contract.
 * No current-map projection or historical whole-project hash is required.
 * Keep tests/act2-spatial-contracts.mjs and its immutable save fixture intact.
 * This is repeated Engine/attachment preservation, not a normal playthrough. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../game/tests/helpers.mjs';
import {plain,unitContract} from './act2-spatial-contract-helpers.mjs';

const source='tests/fixtures/act2-spatial-legacy-save.json';
const bytes=await readFile(source),saved=JSON.parse(bytes);
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,b=plain(saved.b),st=g.HONRO_CONTENT.stages[13];
assert.equal(b.honroStage,14);assert.equal(b.honroAct2Revision,2);
assert.equal(b.round,8);assert.equal(b.width,8600);assert.equal(b.height,7600);
assert.equal(b.honroVerticalStage14Revision,undefined);
assert.equal(b.honroState.vertical14,undefined);
assert(!g.HonroStage14Vertical.active(b));
assert.equal(b.honroState.act2.holds['hold-refuge'].progress,2);
assert.equal(b.honroState.act2.holds['hold-refuge'].spawned,4);

// These fields and the two attachment assertions are the original R8 contract.
const contract=b=>plain({terrain:b.terrain,waters:b.waters,width:b.width,height:b.height,routePoints:b.routePoints,markers:b.honroMarkers,steps:b.honroAct2Steps,state:b.honroState,items:b.items,heroes:b.heroes,round:b.round,units:b.units.map(u=>({...unitContract(u),x:u.x,y:u.y,dead:u.dead})),honroMap:b.honroMap});
const before=contract(b),e=new C.Engine(b,()=>{},false),app={engine:e,stage:st,profile:plain(saved.profile),training:false,sayLines(){},event(){},checkMission(){return false;}};
g.HonroStageRules.sanitizeStageBattle(b);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);
assert.deepEqual(contract(b),before,'Resume must not replace live geometry or reset progress to the fresh room plan');
const once=contract(b);g.HonroStageRules.sanitizeStageBattle(b);g.HonroAct2.attach(app,e);assert.deepEqual(contract(b),once,'Resume migration must be idempotent');
assert.equal(b.honroState.act2.holds['hold-refuge'].spawned,4);
assert.equal(b.items.heal,1);
assert.equal(b.honroState.vertical14,undefined,'The older saved battle never acquires the fresh14 module state');
await mkdir('_local/reports/vertical-stages',{recursive:true});
await writeFile('_local/reports/vertical-stages/stage14-legacy-r8.json',JSON.stringify({passed:true,source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),round:b.round,hold:plain(b.honroState.act2.holds['hold-refuge']),scope:'Original pre-redesign R8 save fields and repeated production Engine/attachment preservation. No fixture edits, canonical replacement, normal arrival, browser or campaign-completion claim.'},null,2)+'\n');
console.log('PASS preserved old14 R8: original geometry, actors, objectives, progress2/spawned4, heal1 and repeated attachment');
