/** Historical refinement checks after the exact current crowned fallback guard. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtime} from '../game/tests/helpers.mjs';
import {act12Project} from './campaign-scope-helpers.mjs';
import {beforeStage16BuddhaCrownedFallback} from './stage16-temple-buddha-crowned-fallback-helpers.mjs';
import {beforeStage16BuddhaAscetic} from './stage16-temple-buddha-ascetic-history-helpers.mjs';
import {stage16BuddhaRefinementDelta as f,assertStage16BuddhaRefinementCurrent,beforeStage16BuddhaRefinement,beforeStage16BuddhaRefinementLibrary} from './stage16-temple-buddha-refinement-history-helpers.mjs';
import {buddhaHash as hash,templeGameplayFingerprints,templeBattleContract} from './stage16-temple-buddha-contract-helpers.mjs';
const previous=JSON.parse(readFileSync('tests/fixtures/stage16-temple-buddha-art-delta.json','utf8'));
assert.equal(f.beforeProjectSha256,previous.afterProjectSha256);assert.equal(f.beforeLibrarySha256,previous.afterLibrarySha256);
assert.deepEqual(f.beforeAsset,previous.assets[0],'First-art fixture remains unchanged');
assert.equal(f.libraryOrder.length,540);assert.equal(f.stages.length,30);assert.notDeepEqual(f.beforeAsset,f.afterAsset);
const p=beforeStage16BuddhaAscetic(beforeStage16BuddhaCrownedFallback(JSON.parse(readFileSync('shared/data/campaign.json','utf8')))),snapshot=JSON.stringify(p);
assertStage16BuddhaRefinementCurrent(p);
const prior=beforeStage16BuddhaRefinement(p,{unrelated:true});assert.equal(hash(prior),f.beforeProjectSha256);
assert.equal(JSON.stringify(p),snapshot,'Pure exact projection');assert.deepEqual(beforeStage16BuddhaRefinement(prior),prior,'Projected boundary stays stable');
assert.deepEqual(p.stages,prior.stages,'All30 complete stages and Buddha placement are unchanged');
assert.deepEqual(beforeStage16BuddhaRefinementLibrary(p.library),prior.library);
assert.deepEqual(p.library.filter(a=>a.id!==f.assetId),prior.library.filter(a=>a.id!==f.assetId),'All539 other asset values and order are unchanged');
const scoped=act12Project(p);assertStage16BuddhaRefinementCurrent(scoped);assert.deepEqual(beforeStage16BuddhaRefinement(scoped),act12Project(prior));
const changes=[
 q=>q.library.find(a=>a.id===f.assetId).name+=' drift',
 q=>q.library.find(a=>a.id===f.assetId).collision.push([{x:0,y:0},{x:1,y:0},{x:0,y:1}]),
 q=>q.library.find(a=>a.id===f.assetId).bounds.w++,
 q=>q.library[0].name+=' drift',
 q=>q.library.reverse(),
 q=>q.library.pop(),
 q=>q.library.push(structuredClone(f.afterAsset)),
 q=>q.stages[15].elements.find(e=>e.assetId===f.assetId).x++,
 q=>q.stages[15].terrains[0].points[0].x++,
 q=>q.stages[15].units[0].x++,
 q=>q.stages[15].initialState.honroAct2Steps.find(s=>s.kind==='hold').rounds++,
 q=>q.stages[15].units.find(u=>u.id==='resident-1').x++,
 q=>q.stages[0].terrains[0].points[0].x++,
 q=>q.stages.reverse(),
 q=>q.stages.pop(),
 q=>q.name=(q.name||'')+' drift'
];
for(const mutate of changes){const q=structuredClone(p);mutate(q);assert.throws(()=>assertStage16BuddhaRefinementCurrent(q),'Reject every unreviewed artwork, collision, stage, gameplay or order mutation');}
assert.throws(()=>assertStage16BuddhaRefinementCurrent(prior),'First artwork cannot masquerade as reviewed refinement');
const g=await runtime({legacyMaps:false});assert.equal(hash(beforeStage16BuddhaAscetic(beforeStage16BuddhaCrownedFallback(g.HONRO_PROJECT))),hash(p));
assert.deepEqual(await templeGameplayFingerprints(g),f.gameplayFingerprints);assert.deepEqual(f.gameplayFingerprints,previous.gameplayFingerprints);
const saved=g.HONRO_PROJECT,current=templeBattleContract(g,p);
assert.deepEqual(current,templeBattleContract(g,prior),'Actual terrain/actors/markers/events/initialState/protected NPCs/rules/resources/growth remain exact');
assert.equal(hash(current),f.battleContractSha256);assert.equal(f.battleContractSha256,previous.battleContractSha256);assert.equal(g.HONRO_PROJECT,saved);
console.log(`PASS historical exact Buddha refinement (current crowned fallback audited first): one collision-free asset value, all30 maps/placement and539 other assets unchanged, pure full/Act12 reversal, ${changes.length+1} mutation guards, same47-round gameplay fingerprints and actual compiled battle. No second fullplay.`);
