/** Historical revision3 art-only audit after the exact crowned fallback guard. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {runtime} from '../game/tests/helpers.mjs';
import {act12Project} from './campaign-scope-helpers.mjs';
import {compileSVG} from '../tools/environment/build-act2-art.mjs';
import {beforeStage16BuddhaCrownedFallback} from './stage16-temple-buddha-crowned-fallback-helpers.mjs';
import {stage16BuddhaAsceticDelta as f,assertStage16BuddhaAsceticCurrent,beforeStage16BuddhaAscetic,beforeStage16BuddhaAsceticLibrary} from './stage16-temple-buddha-ascetic-history-helpers.mjs';
import {beforeStage16BuddhaRefinement} from './stage16-temple-buddha-refinement-history-helpers.mjs';
import {beforeStage16Buddha} from './stage16-temple-buddha-history-helpers.mjs';
import {buddhaHash as hash,buddhaPlain as plain,templeGameplayFingerprints,templeBattleContract} from './stage16-temple-buddha-contract-helpers.mjs';
const previous=JSON.parse(readFileSync('tests/fixtures/stage16-temple-buddha-refinement-delta.json','utf8'));
const first=JSON.parse(readFileSync('tests/fixtures/stage16-temple-buddha-art-delta.json','utf8'));
assert.equal(f.beforeProjectSha256,previous.afterProjectSha256);assert.equal(f.beforeLibrarySha256,previous.afterLibrarySha256);
assert.deepEqual(f.beforeAsset,previous.afterAsset,'The immutable revision2 fixture is the exact predecessor');
assert.equal(f.libraryOrder.length,540);assert.equal(f.stages.length,30);assert.notDeepEqual(f.beforeAsset,f.afterAsset);
const p=beforeStage16BuddhaCrownedFallback(JSON.parse(readFileSync('shared/data/campaign.json','utf8'))),snapshot=JSON.stringify(p);
assertStage16BuddhaAsceticCurrent(p);
const prior=beforeStage16BuddhaAscetic(p,{unrelated:true});assert.equal(hash(prior),f.beforeProjectSha256);
assert.equal(JSON.stringify(p),snapshot,'Pure exact projection');assert.deepEqual(beforeStage16BuddhaAscetic(prior),prior,'Revision2 boundary stays stable');
assert.deepEqual(p.stages,prior.stages,'All30 complete stages and Buddha placement are unchanged');
assert.deepEqual(beforeStage16BuddhaAsceticLibrary(p.library),prior.library);
assert.deepEqual(p.library.filter(a=>a.id!==f.assetId),prior.library.filter(a=>a.id!==f.assetId),'All539 other asset values and order are unchanged');
const scoped=act12Project(p);assertStage16BuddhaAsceticCurrent(scoped);assert.deepEqual(beforeStage16BuddhaAscetic(scoped),act12Project(prior));
const before=f.beforeAsset,after=f.afterAsset;
const flatten=node=>[node,...(node.children||[]).flatMap(flatten)];
const oldNodes=flatten(before.vector.root),newNodes=flatten(after.vector.root);
const node=(asset,id)=>{const rows=flatten(asset.vector.root).filter(n=>n.id===id);assert.equal(rows.length,1,'Unique reviewed vector node '+id);return rows[0];};
assert.equal(before.params.artRevision,2);assert.equal(after.params.artRevision,3);
assert.equal(before.params.nodeCount,67);assert.equal(after.params.nodeCount,67);assert.equal(oldNodes.length,67);assert.equal(newNodes.length,67);
assert.deepEqual(newNodes.map(n=>[n.tag,n.id]),oldNodes.map(n=>[n.tag,n.id]),'All67 nodes preserve topology and drawing order');
assert.deepEqual(plain(compileSVG(after.vector.source)),after.vector,'Editable SVG and native vector are exact');
assert.deepEqual(plain(compileSVG(before.vector.source)),before.vector,'Immutable revision2 SVG still compiles exactly; current crowned source is audited separately');
const restoredArt=structuredClone(after);
for(const id of ['neck-three-dimensional-mass','great-stone-face'])Object.assign(node(restoredArt,id),structuredClone(node(before,id)));
restoredArt.vector.source=before.vector.source;restoredArt.params.artRevision=before.params.artRevision;
assert.deepEqual(restoredArt,before,'Only face/neck vector groups and artRevision change; rock, shoulders, robe, hand, bounds/reference/anchor and collision stay exact');
const protectedNodes=['one-hand-emerging-from-rock','palm-relief-shadow','palm-crease','left-long-ear','left-ear-hollow','left-ear-fold','right-long-ear','right-ear-hollow','right-ear-catch'];
for(const id of protectedNodes)assert.deepEqual(node(after,id),node(before,id),'Unchanged hand/ear path '+id);
assert.equal(node(after,'large-broad-face').d.split('L')[0],node(before,'large-broad-face').d.split('L')[0],'Original cranial rise and upper head silhouette stay exact');
const changedNodes=newNodes.filter(n=>n.id&&n.tag!=='g'&&hash(n)!==hash(node(before,n.id))).map(n=>n.id);
assert(changedNodes.length>0);assert.deepEqual(after.collision,[]);
const changes=[
 q=>q.library.find(a=>a.id===f.assetId).name+=' drift',
 q=>q.library.find(a=>a.id===f.assetId).collision.push([{x:0,y:0},{x:1,y:0},{x:0,y:1}]),
 q=>q.library.find(a=>a.id===f.assetId).bounds.w++,
 q=>q.library.find(a=>a.id===f.assetId).reference.foot.x++,
 q=>node(q.library.find(a=>a.id===f.assetId),'palm-crease').d+='Z',
 q=>q.library.find(a=>a.id===f.assetId).vector.source+=' ',
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
for(const mutate of changes){const q=structuredClone(p);mutate(q);assert.throws(()=>assertStage16BuddhaAsceticCurrent(q),'Reject every unreviewed artwork, collision, stage, gameplay or order mutation');}
assert.throws(()=>assertStage16BuddhaAsceticCurrent(prior),'Revision2 cannot masquerade as reviewed revision3');
const firstArt=beforeStage16BuddhaRefinement(p,{unrelated:true});assert.equal(hash(firstArt),first.afterProjectSha256);
assert.deepEqual(beforeStage16BuddhaAscetic(firstArt),firstArt,'Original first-art boundary remains stable');
assert.equal(hash(beforeStage16Buddha(p,{unrelated:true})),first.beforeProjectSha256,'New outer layer preserves the full earlier history chain');
const g=await runtime({legacyMaps:false});assert.equal(hash(beforeStage16BuddhaCrownedFallback(g.HONRO_PROJECT)),hash(p),'Runtime passes the exact crowned fallback guard before historical projection');
const fingerprints=await templeGameplayFingerprints(g);assert.deepEqual(fingerprints,f.gameplayFingerprints);assert.deepEqual(f.gameplayFingerprints,previous.gameplayFingerprints);
const saved=g.HONRO_PROJECT,current=templeBattleContract(g,p);
assert.deepEqual(current,templeBattleContract(g,prior),'Actual terrain/actors/markers/events/initialState/protected NPCs/rules/resources/growth remain exact');
assert.equal(hash(current),f.battleContractSha256);assert.equal(f.battleContractSha256,previous.battleContractSha256);assert.equal(g.HONRO_PROJECT,saved);
const out='_local/reports/stage16-temple/buddha-ascetic';mkdirSync(out,{recursive:true});
writeFileSync(out+'/exact-delta.json',JSON.stringify({passed:true,scope:'Historical immutable revision3 asset/history/gameplay audit after exact crowned fallback guard. Current source is revision1. No second fullplay, browser or aggregate verification.',beforeSourceCommit:f.beforeSourceCommit,afterSourceCommit:f.afterSourceCommit,beforeProjectSha256:f.beforeProjectSha256,afterProjectSha256:f.afterProjectSha256,unchangedMaps:30,unchangedOtherAssets:539,unchangedNodeCount:67,changedNodes,protectedNodes,negativeControls:changes.length+1,gameplayFingerprints:fingerprints,battleContractSha256:hash(current)},null,2)+'\n');
console.log(`PASS historical exact ascetic Buddha (current crowned fallback audited first): ${changedNodes.length} face/neck paths,67 nodes, all30 maps/placement and539 other assets unchanged; hand/ears/cranial rise/body/bounds/collision preserved; ${changes.length+1} mutation guards; pure full/Act12 history and same47-round gameplay fingerprints/compiled battle. No second fullplay.`);
