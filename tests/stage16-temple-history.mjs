import {beforeEncounterDensity} from './encounter-density-history-helpers.mjs';
import {beforeStage16Buddha} from './stage16-temple-buddha-history-helpers.mjs';
/** Exact history projection, independent of current gameplay/traversal tests. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {act12Project} from './campaign-scope-helpers.mjs';
import {assertStage16TempleCurrent,beforeCurrentStage16Temple,beforeStage16TempleLibrary,beforeStage16TempleUnitContracts,beforeStage16TempleContent,beforeStage16TemplePlan,beforeStage16TempleBalance,withHistoricalStage16,stage16TempleBefore as before,stage16TempleDelta as delta,templeHash as hash} from './stage16-temple-history-helpers.mjs';
import {semanticContent,unitContract,plain} from './act2-spatial-contract-helpers.mjs';

const p=beforeStage16Buddha(JSON.parse(readFileSync('shared/data/campaign.json','utf8'))),snapshot=JSON.stringify(p);
assertStage16TempleCurrent(p);
assert.equal(hash(p),delta.afterProjectSha256,'Complete current reviewed temple source');
assert.equal(hash(before.stage),delta.beforeStageSha256,'Immutable pre-temple map');
const prior=beforeCurrentStage16Temple(p,{unrelated:true});
assert.equal(hash(prior),delta.beforeProjectSha256,'Complete original thirty-map project recovered');
assert.equal(JSON.stringify(p),snapshot,'Historical projection is pure');
assert.deepEqual(beforeCurrentStage16Temple(prior),prior,'Exact original boundary is stable');
assert.deepEqual(beforeStage16TempleLibrary(p.library),prior.library,'Independent Library projection matches project projection');
const scoped=act12Project(p);assertStage16TempleCurrent(scoped);
assert.deepEqual(beforeCurrentStage16Temple(scoped),act12Project(prior),'Exact Act12 projection preserves all original maps and art');
for(let index=0;index<p.stages.length;index++)if(index!==15)assert.deepEqual(prior.stages[index],p.stages[index],'Preserved map '+(index+1));
const unchanged=structuredClone(p);unchanged.stages[15]=prior.stages[15];unchanged.library=prior.library;
assert.deepEqual(unchanged,prior,'No project fields outside Stage16 and dedicated artwork change');

for(const row of delta.paths){
 const q=structuredClone(p);let target=q.stages[15];for(const key of row.path.slice(0,-1))target=target[key];
 target[row.path.at(-1)]='unreviewed';
 assert.throws(()=>beforeCurrentStage16Temple(q),/Exact reviewed (?:current Stage16 map|temple (?:current|geometry) marker)/,'Reject changed temple path '+row.path.join('/'));
}
const mutations=[
 q=>q.stages[15].units[0].hp++,
 q=>q.stages[15].initialState.honroAct2Steps.find(step=>step.kind==='hold').rounds++,
 q=>delete q.stages[15].initialState.honroTempleVersion,
 q=>q.stages[0].terrains[0].points[0].x++,
 q=>q.stages[10].units[0].x++,
 q=>q.stages.reverse(),
 q=>q.stages.pop(),
 q=>q.stages.push(structuredClone(q.stages[15])),
 q=>q.library[0].name+=' drift',
 q=>q.library.reverse(),
 q=>q.library.pop(),
 q=>q.library.push(structuredClone(q.library.at(-1))),
 q=>q.library.push({...structuredClone(q.library.at(-1)),id:'stage16:temple-unreviewed'})
];
for(const mutate of mutations){const q=structuredClone(p);mutate(q);assert.throws(()=>assertStage16TempleCurrent(q),'Reject unreviewed map, gameplay, membership, original/new art or ordering');}
for(const asset of delta.addedAssets){const q=structuredClone(p);q.library.find(candidate=>candidate.id===asset.id).name+=' drift';assert.throws(()=>beforeCurrentStage16Temple(q),'Reject changed temple artwork '+asset.id);}
for(const mutate of [q=>q.stages[15].units[0].x++,q=>q.stages[15].initialState.honroAct2GeometryRevision++,q=>q.library.push(structuredClone(p.library.at(-1)))]){const q=structuredClone(prior);mutate(q);assert.throws(()=>beforeCurrentStage16Temple(q),'An unmarked historical map must be exact and cannot retain new artwork');}

const g=await runtime({legacyMaps:false}),currentProject=g.HONRO_PROJECT;
const current=()=>{g.HONRO_PROJECT=beforeEncounterDensity(currentProject);let q;try{q=battlefield(g,16);}finally{g.HONRO_PROJECT=currentProject;}g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);return q;};
const aq=current();
assert.deepEqual(beforeStage16TempleUnitContracts(aq.b.units.map(unitContract)),delta.unitContracts.before);
assert.deepEqual(beforeStage16TempleContent(semanticContent(aq.st)),delta.semanticContent.before);
assert.deepEqual(beforeStage16TemplePlan(g.HonroAct2Plan.stages[5]),delta.plan.before);
assert.deepEqual(delta.plan.after,delta.content.after.act2Plan,'Full runtime content and explicit plan agree');
assert.deepEqual(delta.plan.before,delta.content.before.act2Plan,'Historical runtime content and explicit plan agree');
assert.deepEqual(beforeStage16TempleBalance(g.HONRO_BALANCE).stages[15],delta.balance.before);
for(const [value,project] of [[delta.unitContracts.after,beforeStage16TempleUnitContracts],[delta.semanticContent.after,beforeStage16TempleContent]]){const mutated=structuredClone(value);if(Array.isArray(mutated))mutated[0].hp++;else mutated.enemies++;assert.throws(()=>project(mutated),'Unreviewed stats/content cannot be projected away');}
const planDrift=structuredClone(delta.plan.after);planDrift.initial++;assert.throws(()=>beforeStage16TemplePlan(planDrift),'Unreviewed encounter plan cannot be projected away');
const drift=structuredClone(plain(g.HONRO_BALANCE));drift.stages[15].initialEnemies++;assert.throws(()=>beforeStage16TempleBalance(drift),'Unreviewed balance cannot be projected away');
const savedContent=g.HONRO_CONTENT.stages[15],savedPlan=g.HonroAct2Plan.stages[5],savedBalance=g.HONRO_BALANCE.stages[15];
const q=withHistoricalStage16(g,current);
assert.equal(g.HONRO_PROJECT,currentProject,'Runtime wrapper restores current canonical source');
assert.equal(g.HONRO_CONTENT.stages[15],savedContent);assert.equal(g.HonroAct2Plan.stages[5],savedPlan);assert.equal(g.HONRO_BALANCE.stages[15],savedBalance);
assert.equal(q.b.width,before.stage.width);assert.equal(q.b.height,before.stage.height);
assert.deepEqual(plain(q.st),delta.content.before,'Historical runtime restores original content and planning');
assert.deepEqual(plain(q.b.units.map(unitContract)),delta.unitContracts.before,'Historical runtime restores original roster, bodies and XP distribution');
assert(!q.b.honroTempleVersion,'Historical runtime must not opt into fresh temple encounter rules');
assert.equal(g.HonroStage16Temple.active(q.b),false,'New temple defense hook rejects the immutable old Stage16');
assert.throws(()=>withHistoricalStage16(g,()=>{throw Error('intentional fixture failure');}),/intentional fixture failure/);
assert.equal(g.HONRO_PROJECT,currentProject,'Runtime wrapper restores source after a failing audit');
assert.equal(g.HONRO_CONTENT.stages[15],savedContent);assert.equal(g.HonroAct2Plan.stages[5],savedPlan);assert.equal(g.HONRO_BALANCE.stages[15],savedBalance);
for(const [name,values,index] of [['content',g.HONRO_CONTENT.stages,15],['plan',g.HonroAct2Plan.stages,5],['balance',g.HONRO_BALANCE.stages,15]]){
 const saved=values[index];values[index]={...plain(saved),unreviewedField:true};
 try{assert.throws(()=>withHistoricalStage16(g,()=>assert.fail('Unreviewed runtime must not be used')),/Exact Stage16 runtime/,'Reject runtime '+name+' drift before historical setup');}
 finally{values[index]=saved;}
 assert.equal(g.HONRO_PROJECT,currentProject,'Rejected runtime '+name+' drift preserves source');
}
console.log(`PASS exact Stage16 history: ${delta.paths.length} reviewed paths, ${delta.addedAssets.length} additive assets, full/Act12 map and art order, pure/idempotent projection, mutation guards and old-encounter isolation`);
