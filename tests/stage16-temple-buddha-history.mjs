/** Art-only exactness and same-gameplay evidence, separate from the47-round run. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtime} from '../game/tests/helpers.mjs';
import {act12Project} from './campaign-scope-helpers.mjs';
import {beforeStage16BuddhaRefinement} from './stage16-temple-buddha-refinement-history-helpers.mjs';
import {assertStage16BuddhaCurrent,beforeStage16Buddha,beforeStage16BuddhaLibrary,stage16BuddhaDelta as f} from './stage16-temple-buddha-history-helpers.mjs';
import {buddhaHash as hash,templeGameplayFingerprints,templeBattleContract,templeFullplayGameplayProjectSha256,templeFullplayGameplayRuntimeSha256} from './stage16-temple-buddha-contract-helpers.mjs';
const p=beforeStage16BuddhaRefinement(JSON.parse(readFileSync('shared/data/campaign.json','utf8'))),snapshot=JSON.stringify(p);
const original=JSON.parse(readFileSync('tests/fixtures/stage16-temple-history-delta.json','utf8'));
assert.equal(f.assets.length,1);assert.equal(f.elements.length,1);assert.equal(f.libraryOrderBefore.length,539);
assert.equal(f.beforeProjectSha256,original.afterProjectSha256,'The original completed temple fixture remains the exact predecessor');
assert.equal(f.beforeStageSha256,original.afterStageSha256);assert.equal(f.beforeLibrarySha256,original.afterLibrarySha256);
assertStage16BuddhaCurrent(p);
const prior=beforeStage16Buddha(p,{unrelated:true});assert.equal(hash(prior),f.beforeProjectSha256);
assert.equal(JSON.stringify(p),snapshot,'Buddha projection never mutates its source');
assert.deepEqual(beforeStage16Buddha(prior),prior,'The already-projected boundary is stable');
assert.deepEqual(beforeStage16BuddhaLibrary(p.library),prior.library);
const scoped=act12Project(p);assertStage16BuddhaCurrent(scoped);assert.deepEqual(beforeStage16Buddha(scoped),act12Project(prior));
const onlyArt=structuredClone(p);onlyArt.stages[15].elements=prior.stages[15].elements;onlyArt.library=prior.library;
assert.deepEqual(onlyArt,prior,'Every non-element Stage16 field, every other map and all global data stay exact');
const changes=[
 q=>q.stages[15].elements.find(e=>e.id===f.elements[0].id).x++,
 q=>q.stages[15].elements.reverse(),
 q=>q.stages[15].elements.push(structuredClone(f.elements[0])),
 q=>q.stages[15].elements=q.stages[15].elements.filter(e=>e.id!==f.elements[0].id),
 q=>q.stages[15].terrains[0].points[0].x++,
 q=>q.stages[15].units[0].x++,
 q=>q.stages[15].initialState.honroAct2Steps.find(s=>s.kind==='hold').rounds++,
 q=>q.stages[15].units.find(u=>u.id==='resident-1').x++,
 q=>q.stages[0].terrains[0].points[0].x++,
 q=>q.stages.reverse(),
 q=>q.stages.pop(),
 q=>q.library[0].name+=' drift',
 q=>q.library.find(a=>a.id===f.assets[0].id).collision.push([{x:0,y:0},{x:10,y:0},{x:0,y:10}]),
 q=>q.library.find(a=>a.id===f.assets[0].id).name+=' drift',
 q=>q.library.reverse(),
 q=>q.library.pop(),
 q=>q.library.push(structuredClone(f.assets[0])),
 q=>q.library.push({...structuredClone(f.assets[0]),id:'stage16:temple-stone-buddha-unreviewed'})
];
for(const mutate of changes){const q=structuredClone(p);mutate(q);assert.throws(()=>assertStage16BuddhaCurrent(q),'Reject unreviewed art, collision, gameplay, map or order change');}
assert.throws(()=>assertStage16BuddhaCurrent(prior),'The old source cannot masquerade as the new art revision');
const g=await runtime({legacyMaps:false});assert.equal(hash(beforeStage16BuddhaRefinement(g.HONRO_PROJECT)),hash(p),'Runtime and source agree after the exact later-art boundary');
const fingerprints=await templeGameplayFingerprints(g);assert.deepEqual(fingerprints,f.gameplayFingerprints);
assert.equal(fingerprints.project,templeFullplayGameplayProjectSha256);assert.equal(fingerprints.runtime,templeFullplayGameplayRuntimeSha256);
const saved=g.HONRO_PROJECT,current=templeBattleContract(g,p),old=templeBattleContract(g,prior);
assert.deepEqual(current,old,'Actual terrain/units/markers/events/initialState/protected NPCs/rules/resources/growth stay exact');
assert.equal(hash(current),f.battleContractSha256,'Same compiled battle as the reviewed art-only capture');assert.equal(g.HONRO_PROJECT,saved);
console.log(`PASS exact Buddha art-only layer: one collision-free asset/element, original539 asset values/order, other29 maps, pure full/Act12 reversal, ${changes.length+1} mutation/presence guards, unchanged47-round gameplay fingerprints and actual battle structures. This is not a second fullplay.`);
