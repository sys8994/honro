/** Authoring metadata tests only. Synthetic catalogs are never playable maps. */
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {ROOT,loadFoundationInputs,validateCampaignCatalog,validateAct3Draft} from '../tools/map-forge/act3-foundation.mjs';

const production=await loadFoundationInputs();
const {catalog,draft,nextAct}=await loadFoundationInputs(ROOT,{baseline:true});
const baseline=JSON.stringify(catalog),checks=[];
const test=(name,fn)=>{fn();checks.push(name);};
test('Explicit preproduction baseline retains 20 matching chapters',()=>assert.deepEqual(validateCampaignCatalog(catalog).stageIds,Array.from({length:20},(_,i)=>i+1)));
test('Historical outline remains inactive and cannot retrospectively grant production approval',()=>{
 assert.equal(nextAct.id,3);assert.equal(nextAct.available,false);
 assert.equal(validateAct3Draft(draft,catalog.project,{baseline:true}).implemented,false);
});
test('Audit leaves all current stage, map, asset, balance and journey records byte-equivalent',()=>assert.equal(JSON.stringify(catalog),baseline));

// This fixture contains catalog rows only. Values are intentionally neutral;
// they are not proposed levels, layouts, missions or campaign content.
const extended=structuredClone(catalog);
for(let id=21;id<=30;id++){
 extended.stages.push({id,act:3,actStage:id-20,requires:[id-1]});
 extended.balance.push({id,entryLevel:1,exitLevel:1});
 extended.project.stages.push({id:'synthetic-'+id,metadata:{stageId:id}});
 extended.places.push({stageId:id});
}
extended.acts.push({id:3,first:21,last:30});
test('Read-only catalog validator accepts complete synthetic 21–30 coverage',()=>assert.equal(validateCampaignCatalog(extended).stageIds.length,30));
test('Synthetic extension preserves all original 20 rows and shared assets',()=>{
 for(const key of ['stages','balance','places'])assert.deepEqual(extended[key].slice(0,20),catalog[key]);
 assert.deepEqual(extended.project.stages.slice(0,20),catalog.project.stages);
 assert.deepEqual(extended.project.library,catalog.project.library);
 assert.equal(JSON.stringify(catalog),baseline);
});
const rejectCatalog=(name,mutate,pattern)=>test(name,()=>{const value=structuredClone(extended);mutate(value);assert.throws(()=>validateCampaignCatalog(value),pattern);});
rejectCatalog('Duplicate chapter',v=>v.stages[21].id=21,/duplicate/);
rejectCatalog('Missing chapter/index hole',v=>v.stages.splice(21,1),/indexing/);
rejectCatalog('Missing growth row',v=>v.balance.pop(),/Balance/);
rejectCatalog('Invalid growth range',v=>v.balance[20].exitLevel=NaN,/growth/);
rejectCatalog('Missing canonical map',v=>v.project.stages.pop(),/Canonical/);
rejectCatalog('Duplicate canonical map',v=>v.project.stages[21].metadata.stageId=21,/duplicate/);
rejectCatalog('Missing journey place',v=>v.places.pop(),/Journey/);
rejectCatalog('Overlapping act ranges',v=>v.acts[2].first=20,/mismatch|partition/);
rejectCatalog('Missing act coverage',v=>v.acts.pop(),/partition/);
rejectCatalog('Wrong act identity',v=>v.stages[20].act=2,/mismatch/);
rejectCatalog('Wrong local chapter',v=>v.stages[20].actStage=2,/mismatch/);
rejectCatalog('Missing prerequisite',v=>v.stages[20].requires=[99],/prerequisite/);
rejectCatalog('Self prerequisite',v=>v.stages[20].requires=[21],/prerequisite/);
rejectCatalog('Duplicate prerequisite',v=>v.stages[20].requires=[20,20],/duplicate/);
test('Complete production catalog covers all 30 slots and leaves Act 4 unavailable',()=>{assert.deepEqual(validateCampaignCatalog(production.catalog).stageIds,Array.from({length:30},(_,i)=>i+1));assert.equal(production.nextAct.id,4);assert.equal(production.nextAct.available,false);assert.equal(validateAct3Draft(draft,production.catalog.project).implemented,false);});
for(const kind of ['map','asset'])test('Actual draft '+kind+' IDs cannot leak into active content',()=>{const p=structuredClone(production.catalog.project);if(kind==='map')p.stages[20].id='draft-act3-city';else p.library.push({id:'draft:archive',tags:['act3-draft']});assert.throws(()=>validateAct3Draft(draft,p),/leaked/);});
test('Renaming a draft map without promoting authored design is rejected',()=>{const p=structuredClone(production.catalog.project);p.stages[20].design.draft={};assert.throws(()=>validateAct3Draft(draft,p),/leaked/);});
for(const [key,value] of [['campaignEnabled',true],['status','approved']])test('Reject unreviewed draft '+key,()=>assert.throws(()=>validateAct3Draft({...draft,[key]:value},catalog.project,{baseline:true}),/inactive/));
test('Reject silently chosen map concept',()=>assert.throws(()=>validateAct3Draft({...draft,decisions:{...draft.decisions,mapConcept:'A'}},{stages:[],library:[]}),/null/));
test('Reject draft pretending to be a canonical map',()=>{const copy=structuredClone(draft);copy.stages[0].canonicalStage={};assert.throws(()=>validateAct3Draft(copy,{stages:[],library:[]}),/geometry/);});

// Inspect the actual source trees and explicit shared builder. The preflight,
// scaffold and tests must not become production input merely by existing.
async function scan(dir){for(const entry of await readdir(path.join(ROOT,dir),{withFileTypes:true})){
 const file=path.join(dir,entry.name);
 if(entry.isDirectory())await scan(file);
 else if(entry.isFile()&&/\.(?:js|mjs|ts|json|html)$/.test(file)){
  const text=await readFile(path.join(ROOT,file),'utf8');
  assert(!/act3-(?:draft|foundation)/.test(text),'Draft tooling referenced by production source: '+file);
 }
}}
for(const dir of ['shared/runtime','shared/map','shared/data','shared/engine/src','workshop/src','game/src','game/config'])await scan(dir);
assert(!/act3-(?:draft|foundation)/.test(await readFile(path.join(ROOT,'shared/build.mjs'),'utf8')));
checks.push('No draft tooling reference in production source or shared bundle manifest');
console.log('PASS '+checks.length+' Act 3 foundation checks; catalog scope and draft isolation only; not gameplay, browser or normal-play proof');
