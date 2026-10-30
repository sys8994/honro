/** Isolated source candidate only. Missing stage units stop the assembly; never silently ship old art. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir}from'node:fs/promises';
import{createHash}from'node:crypto';
import{gzipSync}from'node:zlib';
import vm from'node:vm';
import{runtimeDigest}from'../stage31/probes.mjs';
const runtimeBefore=await runtimeDigest();
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex'),records=[];
async function read(f,expected){const raw=await readFile(f,'utf8');if(expected)assert.equal(hash(raw),expected,'Input file drift: '+f);records.push({path:f,sha256:hash(raw),bytes:Buffer.byteLength(raw)});return JSON.parse(raw);}
const [out='_local/reports/act4-silhouette-integrated',input='tools/act4-silhouette-review/integration-inputs.json',flag]=process.argv.slice(2),partial=flag==='--diagnostic-partial',plan=await read(input),pending=plan.stages.filter(s=>s.kind==='pending');
assert(partial||pending.length===0,'Missing final scoped stage units: '+pending.map(s=>s.stage+': '+s.reason).join('; '));
const campaign=await read('shared/data/campaign.json'),world=await read('shared/data/act4/world.json'),campaignBefore=JSON.stringify(campaign),worldBefore=JSON.stringify(world),sourceBase=new Map([...campaign.library,...world.library].map(a=>[a.id,a]));
process.env.HONRO_ACT4_RELEASE='1';const {runtime}=await import('../../game/tests/helpers.mjs');const compiledContext=await runtime({legacyMaps:false,productionStory:true}),compiled=structuredClone(compiledContext.HONRO_PROJECT),compiledCampaignStages=compiled.stages.filter(s=>s.metadata.stageId<=30),campaignIdsForProof=new Set(campaign.library.map(a=>a.id)),compiledCampaignAssets=compiled.library.filter(a=>campaignIdsForProof.has(a.id)),base=new Map(compiled.library.map(a=>[a.id,a])),library=new Map(base),stages=new Map(compiled.stages.map(s=>[s.id,s])),imported=[];
for(const spec of plan.stages.filter(s=>s.kind!=='pending')){
 let stage,assets,repairs=[];
 if(spec.kind==='scoped'){
  const d=await read(spec.file);stage=d.stage;assets=d.ownedAssets;assert.equal(d.conflictingSharedAssets?.length||0,0);
  for(const r of d.expectedSharedAssets){const id=r.id||r.assetId;assert(base.has(id),'Missing shared dependency '+id);assert.equal(hash(sourceBase.get(id)),r.sha256,'Shared source dependency drift '+id);assert.deepEqual(base.get(id),sourceBase.get(id),'Scoped dependency changed by actual build authoring '+id);}
 }else{
  const m=await read(spec.manifest),d=m.stages.find(s=>s.stageId===`stage-${spec.stage}`);assert(d);
  stage=await read(d.stageFile,d.stageSha256);assets=await read(d.assetFile,d.assetFileSha256);assert.deepEqual(assets.map(a=>a.id).sort(),d.assetIds.slice().sort());repairs=d.metadataRepairs||[];
 }
 assert.equal(stage.metadata.stageId,spec.stage);assert.equal(stage.id,`stage-${spec.stage}`);
 for(const a of assets){if(library.has(a.id))assert.deepEqual(library.get(a.id),a,'Scoped input cannot overwrite another owner/shared ID: '+a.id);else library.set(a.id,a);}
 for(const r of repairs){assert.equal(r.assetId,'s38v:contact-surface');assert.equal(r.field,'reference.heightM');assert.equal(r.value,5000/60);const a=structuredClone(library.get(r.assetId));assert(a&&a.reference.bounds.h===5000);a.reference.heightM=r.value;library.set(a.id,a);}
 stages.set(stage.id,stage);imported.push({stage:spec.stage,assetIds:assets.map(a=>a.id),metadataRepairs:repairs});
}
const scaleRepairs=await read('tools/act4-silhouette-review/scale-metadata-repairs.json');
for(const r of scaleRepairs.repairs){const a=library.get(r.assetId);assert(a&&!sourceBase.has(a.id),'Metadata repair must be a new Act4-owned asset');assert.deepEqual(a.reference,r.before,'Metadata source changed, rederive explicit repair');assert.equal(hash(a.vector),r.vectorSHA256);a.reference=structuredClone(r.after);assert.equal(hash(a.vector),r.vectorSHA256);}
const p={...compiled,library:[...library.values()],stages:[...stages.values()],activeStageId:'stage-31'};
assert.deepEqual(p.stages.filter(s=>s.metadata.stageId<=30),compiledCampaignStages,'Acts1–3 compiled stages changed');
for(const a of compiledCampaignAssets)assert.deepEqual(library.get(a.id),a,'Compiled campaign asset changed '+a.id);
// Complete library validation includes UNUSED definitions. No pruning may hide bad schema.
const g={};vm.createContext(g);for(const f of ['shared/map/vector-art.js','shared/map/environment.js'])vm.runInContext(await readFile(f,'utf8'),g);
const libraryErrors=Array.from(g.HonroEnvironment.validate({library:p.library,stages:[]}));assert.deepEqual(libraryErrors,[],'Complete library reference/vector schema failed');
const act4Project={...p,stages:p.stages.filter(s=>s.metadata.stageId>=31)},act4StrictErrors=Array.from(compiledContext.HonroMaps.validate(act4Project)).filter(e=>e.level==='err');assert.deepEqual(act4StrictErrors,[],'Act4 public instance-aware map/schema validation failed');
const fullErrors=Array.from(compiledContext.HonroMaps.validate(p)).filter(e=>e.level==='err'),baselineErrors=Array.from(compiledContext.HonroMaps.validate(compiled)).filter(e=>e.level==='err');const newFullErrors=fullErrors.filter(e=>!baselineErrors.some(b=>b.text===e.text));assert.deepEqual(newFullErrors,[],'New full-project schema errors');

const missing=[];function refs(v,path){if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){if((k==='assetId'||k.endsWith('AssetId'))&&typeof x==='string'&&!library.has(x))missing.push({path:path+'.'+k,id:x});else if(x&&typeof x==='object')refs(x,path+'.'+k);}}
p.stages.forEach(s=>refs(s,s.id));const baselineMissing=[];function baselineRefs(v,path){if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){if((k==='assetId'||k.endsWith('AssetId'))&&typeof x==='string'&&!base.has(x))baselineMissing.push({path:path+'.'+k,id:x});else if(x&&typeof x==='object')baselineRefs(x,path+'.'+k);}}compiledCampaignStages.forEach(s=>baselineRefs(s,s.id));const newMissing=missing.filter(x=>!baselineMissing.some(b=>b.path===x.path&&b.id===x.id));assert.deepEqual(newMissing,[],'New unresolved configured asset references');
const campaignIds=new Set(campaign.library.map(a=>a.id)),candidateWorld={...world,stages:p.stages.filter(s=>s.metadata.stageId>=31),library:p.library.filter(a=>!campaignIds.has(a.id))};
assert.equal(JSON.stringify(campaign),campaignBefore);assert.equal(JSON.stringify(world),worldBefore);
assert.equal(await runtimeDigest(),runtimeBefore,'Runtime changed during source assembly');
await mkdir(out,{recursive:true});await writeFile(out+'/project.json',JSON.stringify(p));await writeFile(out+'/world-unpruned.json',JSON.stringify(candidateWorld));await writeFile(out+'/assembly.json',JSON.stringify({runtimeSHA256:runtimeBefore,status:partial?'DIAGNOSTIC PARTIAL, NOT ALL STAGES REDESIGNED':'all source units assembled; visual/gameplay/release gates separate',pending,inputs:records,imported,campaignSourceSHA256:hash(campaignBefore),compiledCampaignStagesSHA256:hash(compiledCampaignStages),compiledCampaignAssetsSHA256:hash(compiledCampaignAssets),compiledCampaignPreserved:true,productionStory:true,baseWorldSHA256:hash(worldBefore),projectSHA256:hash(p),worldSHA256:hash(candidateWorld),libraryAssetCount:p.library.length,worldBytes:Buffer.byteLength(JSON.stringify(candidateWorld)),worldGzipBytes:gzipSync(JSON.stringify(candidateWorld)).length,completeLibraryValidationErrors:libraryErrors,act4StrictErrors,baselineUnchangedFullProjectErrors:fullErrors,scaleMetadataRepairs:scaleRepairs.repairs,unchangedCampaignExternalSelectors:baselineMissing,newMissingSelectors:newMissing,sourceFilesMutated:false,productionApproval:false},null,2));console.log(JSON.stringify({out,pending:pending.map(s=>s.stage),stages:imported.map(s=>s.stage),worldSHA256:hash(candidateWorld)}));
