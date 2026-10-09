/** Canonical-authoring repair only. The settled19 activation field was already
 * frozen as {}; no live map, runtime, battle or saved payload is rewritten. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {authorStage18Bell} from '../tools/map-forge/apply-stage18-bell.mjs';
import {stage12QuarryRuntimeSources,beforeStage12QuarryHoldGuideSources,quarryHistoryHash as hash,quarryHistoryPlain as plain,stage12QuarryBefore} from './stage23-escort-history-helpers.mjs';
const p=JSON.parse(await readFile('shared/data/campaign.json','utf8')),g=await runtime({legacyMaps:false});
// Quarry12 is a separate active workstream. Protect every inherited runtime
// source outside its three frozen shared-file exceptions against d7 directly.
// The separately exact single-line quarry UI inverse runs before those hashes.
const rawSources=stage12QuarryRuntimeSources(),sources=beforeStage12QuarryHoldGuideSources(rawSources),protectedRuntime=stage12QuarryBefore.runtime.files.filter(row=>!stage12QuarryBefore.scope.allowedChangedRuntime.includes(row.path));
for(const [path,source]of Object.entries(rawSources))if(path!=='shared/runtime/act2-art.js')assert.equal(sources[path],source,'UI inverse preserves other source '+path);
const sourceHashes=Object.fromEntries(protectedRuntime.map(row=>{assert.equal(hash(sources[row.path]),row.sha256,'Exact inherited runtime '+row.path);return[row.path,row.sha256];}));
const protectedHashes={
 'tests/fixtures/stage18-bell-before.json':'1441c7fd38521deea70311954e3b24483e55b7f95a6aaaeedc0feea86728d321',
 'tests/fixtures/stage18-bell-history-delta.json':'176dff5b465e9ae63838ce6b98a5265512e527f313ef5fa55ebd5ba614f5f819',
 'tests/fixtures/act2-spatial-legacy-save.json':'0e55b45873a7b1ba00cccbe4e743e7db26627a987ff9f96309d9f7a46c82b8ab'
};
for(const [path,digest]of Object.entries(protectedHashes))assert.equal(hash(await readFile(path,'utf8')),digest,'Exact pre-existing map/save fixture '+path);
const maps=Object.fromEntries([18,19].map(id=>[id,p.stages.find(s=>s.metadata.stageId===id)]));
for(const id of [18,19])assert.equal(hash(maps[id]),stage12QuarryBefore.stages.find(s=>s.id==='stage-'+id).sha256,'Entire live Stage'+id+' remains the exact pre-quarry map');
assert(Object.hasOwn(maps[19].initialState,'honroBellActivation'),'The frozen canonical19 already has an activation field');assert.deepEqual(maps[19].initialState.honroBellActivation,{});
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const cases=[];
// This is the old recipe's omission. Only the missing field is restored; the
// maps must reproduce the existing canonical project, including18. The art
// author separately repacks its Library additions; the existing full-recipe
// test retains its strict Library-order assertion rather than hiding that.
const missing=plain(p);delete missing.stages[18].initialState.honroBellActivation;
const repaired=await authorStage18Bell(missing,g,{art:true});assert(Object.hasOwn(repaired.stages[18].initialState,'honroBellActivation'),'Missing19 activation must be recreated');assert.deepEqual(plain(repaired.stages[18].initialState.honroBellActivation),{});assert.equal(hash(stable({...repaired,library:[]})),hash(stable({...p,library:[]})),'Absent19 activation reproduces all complete canonical maps and globals');const assetsById=library=>library.slice().sort((a,b)=>a.id.localeCompare(b.id));assert.equal(hash(stable(assetsById(repaired.library))),hash(stable(assetsById(p.library))),'Every asset value and ID is retained');
cases.push({name:'missing19 activation restores exact existing maps and asset values',passed:true,stage19StableSha256:hash(stable(repaired.stages[18]))});
const repeated=await authorStage18Bell(plain(repaired),g,{art:true});assert.equal(hash(stable(repeated)),hash(stable(repaired)),'Repeated authoring output is idempotent, including Library order');cases.push({name:'repeated canonical authoring remains exact',passed:true});
const marked=plain(p),marker={preserveAuthoredState:73};marked.stages[18].initialState.honroBellActivation=marker;
const preserved=await authorStage18Bell(marked,g,{art:true});assert.deepEqual(plain(preserved.stages[18].initialState.honroBellActivation),marker,'Explicit authoring state is never reset');
preserved.stages[18].initialState.honroBellActivation={};assert.equal(hash(stable(preserved)),hash(stable(repaired)),'No other field changes in the explicit-state control');cases.push({name:'explicit19 activation remains untouched',passed:true});
const disk=JSON.parse(await readFile('shared/data/campaign.json','utf8'));for(const id of [18,19])assert.equal(hash(disk.stages[id-1]),hash(maps[id]),'No production map write for Stage'+id);
const afterRawSources=stage12QuarryRuntimeSources();assert.deepEqual(afterRawSources,rawSources,'Raw runtime remains untouched by the input-only UI inverse');const afterSources=beforeStage12QuarryHoldGuideSources(afterRawSources);for(const [path,digest]of Object.entries(sourceHashes))assert.equal(hash(afterSources[path]),digest,'Inherited runtime source remains exact '+path);
for(const [path,digest]of Object.entries(protectedHashes))assert.equal(hash(await readFile(path,'utf8')),digest,'Old map/save fixture remains untouched '+path);
const report={passed:true,baselineCommit:stage12QuarryBefore.sourceCommit,canonicalStageHashes:Object.fromEntries([18,19].map(id=>[id,hash(maps[id])])),inheritedRuntimeFilesExactD7:Object.keys(sourceHashes).length,oldMapAndSaveFixtureHashes:protectedHashes,cases,scope:'Generator-only exact reproduction of an already frozen empty Stage19 field. No canonical map/runtime/save edits; actual old18/19 Continue is also covered by stage18-bell-app-resume.mjs.'};
await mkdir('_local/reports/stage18-bell',{recursive:true});await writeFile('_local/reports/stage18-bell/authoring-preservation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
