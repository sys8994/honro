import {beforeCurrentStage16Temple} from './stage16-temple-history-helpers.mjs';
/** Exact history projection, independent of current gameplay/traversal tests. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {act12Project} from './campaign-scope-helpers.mjs';
import {assertStage17WorksiteCurrent,beforeCurrentStage17Worksite,beforeStage17WorksiteLibrary,beforeStage17WorksiteUnitContracts,beforeStage17WorksiteContent,beforeStage17WorksiteBalance,withHistoricalStage17,stage17WorksiteBefore as before,stage17WorksiteDelta as delta,worksiteHash as hash} from './stage17-worksite-history-helpers.mjs';
import {semanticContent,unitContract,plain} from './act2-spatial-contract-helpers.mjs';

const p=beforeCurrentStage16Temple(JSON.parse(readFileSync('shared/data/campaign.json','utf8'))),snapshot=JSON.stringify(p);
assertStage17WorksiteCurrent(p);
assert.equal(hash(p),delta.afterProjectSha256,'Complete current reviewed worksite source');
assert.equal(hash(before.stage),delta.beforeStageSha256,'Immutable pre-worksite map');
const prior=beforeCurrentStage17Worksite(p,{unrelated:true});
assert.equal(hash(prior),delta.beforeProjectSha256,'Complete original thirty-map project recovered');
assert.equal(JSON.stringify(p),snapshot,'Historical projection is pure');
assert.deepEqual(beforeCurrentStage17Worksite(prior),prior,'Exact original boundary is stable');
assert.deepEqual(beforeStage17WorksiteLibrary(p.library),prior.library,'Independent Library projection matches project projection');
const scoped=act12Project(p);assertStage17WorksiteCurrent(scoped);
assert.deepEqual(beforeCurrentStage17Worksite(scoped),act12Project(prior),'Exact Act12 projection preserves all original maps and art');
for(let index=0;index<p.stages.length;index++)if(index!==16)assert.deepEqual(prior.stages[index],p.stages[index],'Preserved map '+(index+1));
const unchanged=structuredClone(p);unchanged.stages[16]=prior.stages[16];unchanged.library=prior.library;
assert.deepEqual(unchanged,prior,'No project fields outside Stage17 and dedicated artwork change');

for(const row of delta.paths){
 const q=structuredClone(p);let target=q.stages[16];for(const key of row.path.slice(0,-1))target=target[key];
 target[row.path.at(-1)]='unreviewed';
 assert.throws(()=>beforeCurrentStage17Worksite(q),/Exact reviewed (?:current Stage17 map|worksite (?:current|geometry) marker)/,'Reject changed worksite path '+row.path.join('/'));
}
const mutations=[
 q=>q.stages[16].units[0].hp++,
 q=>q.stages[16].initialState.honroAct2Steps.find(step=>step.kind==='hold').rounds++,
 q=>delete q.stages[16].initialState.honroWorksiteVersion,
 q=>q.stages[0].terrains[0].points[0].x++,
 q=>q.stages[10].units[0].x++,
 q=>q.stages.reverse(),
 q=>q.stages.pop(),
 q=>q.stages.push(structuredClone(q.stages[16])),
 q=>q.library[0].name+=' drift',
 q=>q.library.reverse(),
 q=>q.library.pop(),
 q=>q.library.push(structuredClone(q.library.at(-1))),
 q=>q.library.push({...structuredClone(q.library.at(-1)),id:'stage17:worksite-unreviewed'})
];
for(const mutate of mutations){const q=structuredClone(p);mutate(q);assert.throws(()=>assertStage17WorksiteCurrent(q),'Reject unreviewed map, gameplay, membership, original/new art or ordering');}
for(const asset of delta.addedAssets){const q=structuredClone(p);q.library.find(candidate=>candidate.id===asset.id).name+=' drift';assert.throws(()=>beforeCurrentStage17Worksite(q),'Reject changed worksite artwork '+asset.id);}
for(const mutate of [q=>q.stages[16].units[0].x++,q=>q.stages[16].initialState.honroAct2GeometryRevision++,q=>q.library.push(structuredClone(p.library.at(-1)))]){const q=structuredClone(prior);mutate(q);assert.throws(()=>beforeCurrentStage17Worksite(q),'An unmarked historical map must be exact and cannot retain new artwork');}

const g=await runtime({legacyMaps:false}),currentProject=g.HONRO_PROJECT;
const current=()=>{const q=battlefield(g,17);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);return q;};
const aq=current();
assert.deepEqual(beforeStage17WorksiteUnitContracts(aq.b.units.map(unitContract)),delta.unitContracts.before);
assert.deepEqual(beforeStage17WorksiteContent(semanticContent(aq.st)),delta.semanticContent.before);
assert.deepEqual(beforeStage17WorksiteBalance(g.HONRO_BALANCE).stages[16],delta.balance.before);
for(const [value,project] of [[delta.unitContracts.after,beforeStage17WorksiteUnitContracts],[delta.semanticContent.after,beforeStage17WorksiteContent]]){const mutated=structuredClone(value);if(Array.isArray(mutated))mutated[0].hp++;else mutated.enemies++;assert.throws(()=>project(mutated),'Unreviewed stats/content cannot be projected away');}
const drift=structuredClone(plain(g.HONRO_BALANCE));drift.stages[16].initialEnemies++;assert.throws(()=>beforeStage17WorksiteBalance(drift),'Unreviewed balance cannot be projected away');
const savedContent=g.HONRO_CONTENT.stages[16],savedPlan=g.HonroAct2Plan.stages[6],savedBalance=g.HONRO_BALANCE.stages[16];
const q=withHistoricalStage17(g,current);
assert.equal(g.HONRO_PROJECT,currentProject,'Runtime wrapper restores current canonical source');
assert.equal(g.HONRO_CONTENT.stages[16],savedContent);assert.equal(g.HonroAct2Plan.stages[6],savedPlan);assert.equal(g.HONRO_BALANCE.stages[16],savedBalance);
assert.equal(q.b.width,before.stage.width);assert.equal(q.b.height,before.stage.height);
assert.deepEqual(plain(q.st),delta.content.before,'Historical runtime restores original content and planning');
assert.deepEqual(plain(q.b.units.map(unitContract)),delta.unitContracts.before,'Historical runtime restores original roster, bodies and XP distribution');
assert(!q.b.honroWorksiteVersion,'Historical battle does not opt into the new defense');
assert.equal(g.HonroStage17Worksite.active(q.b),false,'New defense hook rejects the immutable old Stage17');
assert.throws(()=>withHistoricalStage17(g,()=>{throw Error('intentional fixture failure');}),/intentional fixture failure/);
assert.equal(g.HONRO_PROJECT,currentProject,'Runtime wrapper restores source after a failing audit');
console.log(`PASS exact Stage17 history: ${delta.paths.length} reviewed paths, ${delta.addedAssets.length} additive assets, full/Act12 map and art order, pure/idempotent projection, mutation guards and old-defense isolation`);
