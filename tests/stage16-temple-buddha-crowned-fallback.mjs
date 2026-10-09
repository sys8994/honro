import {beforeStage18Bell} from './stage30-ferry-history-helpers.mjs';
/** Forward fallback only: original crowned artwork, unchanged maps and gameplay.
 * No aggregate, normal combat, Continue, browser or fullplay rerun. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {runtime} from '../game/tests/helpers.mjs';
import {act12Project} from './campaign-scope-helpers.mjs';
import {compileSVG} from '../tools/environment/build-act2-art.mjs';
import {createStage16TempleStoneBuddha} from '../tools/environment/stage16-temple-buddha-art.mjs';
import {stage16BuddhaCrownedFallback as f,stage16BuddhaCrownedFirst as first,stage16BuddhaCrownedPrior as previous,assertStage16BuddhaCrownedFallbackCurrent,beforeStage16BuddhaCrownedFallback} from './stage16-temple-buddha-crowned-fallback-helpers.mjs';
import {assertStage16BuddhaAsceticCurrent} from './stage16-temple-buddha-ascetic-history-helpers.mjs';
import {beforeStage16BuddhaRefinement} from './stage16-temple-buddha-refinement-history-helpers.mjs';
import {beforeStage16Buddha} from './stage16-temple-buddha-history-helpers.mjs';
import {buddhaHash as hash,buddhaPlain as plain,templeGameplayFingerprints,templeBattleContract,templeFullplayGameplayProjectSha256,templeFullplayGameplayRuntimeSha256} from './stage16-temple-buddha-contract-helpers.mjs';
const p=beforeStage18Bell(JSON.parse(readFileSync('shared/data/campaign.json','utf8'))),snapshot=JSON.stringify(p);
const asset=assertStage16BuddhaCrownedFallbackCurrent(p),prior=beforeStage16BuddhaCrownedFallback(p);
assert.equal(first.afterSourceCommit,f.restoredFromSourceCommit);
assert.equal(hash(readFileSync('tools/environment/stage16-temple-buddha-art.mjs','utf8')),f.restoredRecipeSha256,'Current source recipe is byte-exact dbef41ce crowned first art');
assert.deepEqual(plain(createStage16TempleStoneBuddha()),asset,'The current source regenerates the exact restored first artwork');
assert.deepEqual(plain(compileSVG(asset.vector.source)),asset.vector,'Restored editable SVG and native vector are exact');
assert.equal(asset.params.artRevision,1);assert.equal(asset.params.nodeCount,79);
const flatten=node=>[node,...(node.children||[]).flatMap(flatten)];
assert.equal(flatten(asset.vector.root).length,79,'Original crowned topology is restored');
assert.equal(JSON.stringify(p),snapshot,'Historical projection never mutates current source');
assertStage16BuddhaAsceticCurrent(prior);
assert.equal(hash(prior),previous.afterProjectSha256);assert.equal(hash(p),first.afterProjectSha256);
assert.notDeepEqual(prior.library.find(a=>a.id===f.assetId),asset,'Fallback actually replaces the rejected revision3 value');
assert.equal(p.stages.length,30);assert.deepEqual(p.stages,prior.stages,'All30 complete maps and the Buddha placement remain unchanged');
assert.equal(p.library.length,540);
const other=project=>project.library.filter(a=>a.id!==f.assetId);
assert.equal(other(p).length,539);assert.deepEqual(other(p),other(prior),'All539 other assets retain exact values and order');
assert.deepEqual({...p,library:prior.library},prior,'Every non-library global field is unchanged');
assert.deepEqual(p.library.map(a=>a.id),prior.library.map(a=>a.id),'No library insertion, removal or reordering');
assert.deepEqual(beforeStage16BuddhaRefinement(prior,{unrelated:true}),p,'Existing immutable history independently recovers the same first artwork');
assert.equal(hash(beforeStage16Buddha(p,{unrelated:true})),first.beforeProjectSha256,'Original completed-temple history remains reachable');
const scoped=act12Project(p);assertStage16BuddhaCrownedFallbackCurrent(scoped);
assert.deepEqual(beforeStage16BuddhaCrownedFallback(scoped),act12Project(prior),'Full and Act12 projections agree exactly');
const changes=[
 q=>q.library.find(a=>a.id===f.assetId).name+=' drift',
 q=>q.library.find(a=>a.id===f.assetId).collision.push([{x:0,y:0},{x:1,y:0},{x:0,y:1}]),
 q=>q.library.find(a=>a.id===f.assetId).bounds.w++,
 q=>q.library.find(a=>a.id===f.assetId).reference.foot.x++,
 q=>q.library.find(a=>a.id===f.assetId).params.artRevision++,
 q=>q.library.find(a=>a.id===f.assetId).vector.source+=' ',
 q=>q.library.find(a=>a.id===f.assetId).vector.root.children[0].children.reverse(),
 q=>q.library[0].name+=' drift',
 q=>q.library.reverse(),
 q=>q.library.pop(),
 q=>q.library.push(structuredClone(asset)),
 q=>q.stages[15].elements.find(e=>e.assetId===f.assetId).x++,
 q=>q.stages[15].elements.find(e=>e.assetId===f.assetId).scale++,
 q=>q.stages[15].terrains[0].points[0].x++,
 q=>q.stages[15].units[0].x++,
 q=>q.stages[15].initialState.honroAct2Steps.find(s=>s.kind==='hold').rounds++,
 q=>q.stages[15].units.find(u=>u.id==='resident-1').x++,
 q=>q.stages[0].terrains[0].points[0].x++,
 q=>q.stages.reverse(),
 q=>q.stages.pop(),
 q=>q.name=(q.name||'')+' drift'
];
for(const mutate of changes){
 const q=structuredClone(p);mutate(q);
 assert.throws(()=>assertStage16BuddhaCrownedFallbackCurrent(q),'Reject every unreviewed current fallback mutation');
 assert.throws(()=>beforeStage16BuddhaCrownedFallback(q),'Never hide source drift by substituting a historical fixture');
}
for(const historical of [previous.beforeAsset,previous.afterAsset]){
 const q=structuredClone(p);q.library[q.library.findIndex(a=>a.id===f.assetId)]=structuredClone(historical);
 assert.throws(()=>assertStage16BuddhaCrownedFallbackCurrent(q),'Rejected refinement/ascetic artwork cannot masquerade as crowned fallback');
}
const g=await runtime({legacyMaps:false});assert.equal(hash(beforeStage18Bell(g.HONRO_PROJECT)),hash(p),'Actual runtime uses the exact restored project');
const fingerprints=await templeGameplayFingerprints(g);
assert.deepEqual(fingerprints,first.gameplayFingerprints);assert.deepEqual(fingerprints,previous.gameplayFingerprints);
assert.equal(fingerprints.project,templeFullplayGameplayProjectSha256);assert.equal(fingerprints.runtime,templeFullplayGameplayRuntimeSha256);
const saved=g.HONRO_PROJECT,current=templeBattleContract(g,p),old=templeBattleContract(g,prior);
assert.deepEqual(current,old,'Actual compiled terrain/actors/markers/events/initialState/protected NPCs/rules/resources/growth are unchanged');
assert.equal(hash(current),first.battleContractSha256);assert.equal(hash(current),previous.battleContractSha256);assert.equal(g.HONRO_PROJECT,saved);
const out='_local/reports/stage16-temple/buddha-fallback';mkdirSync(out,{recursive:true});
writeFileSync(out+'/exact-delta.json',JSON.stringify({passed:true,scope:'Focused forward art fallback/history/gameplay identity only. No aggregate, normal-combat, Continue, browser or fullplay rerun.',...f,beforeProjectSha256:previous.afterProjectSha256,afterProjectSha256:hash(p),restoredArtRevision:1,restoredNodeCount:79,unchangedMaps:30,unchangedOtherAssets:539,negativeControls:changes.length+2,gameplayFingerprints:fingerprints,battleContractSha256:hash(current)},null,2)+'\n');
console.log(`PASS exact crowned Buddha fallback: byte-exact first-art recipe and79-node asset; all30 maps/placement and539 other assets unchanged; ${changes.length+2} mutation guards; preserved revision2/revision3 history; same47-round gameplay fingerprints and actual compiled battle. No new combat or Continue run.`);
