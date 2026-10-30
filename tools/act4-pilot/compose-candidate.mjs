/** Merge explicit immutable art/geometry/roster inputs. Draft only; never release approval. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const [geometryFile,rosterFile,artFile,out='_local/reports/act4-pilot/stage31/composed']=process.argv.slice(2);
assert(geometryFile&&rosterFile&&artFile,'geometry stage, verified roster stage and art-only package are required');
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const inputs=await Promise.all([geometryFile,rosterFile,artFile].map(async path=>{const bytes=await readFile(path,'utf8');return {path,bytesSha256:sha(bytes),value:JSON.parse(bytes)};}));
const [geo,roster,art]=inputs.map(x=>x.value);
assert.equal(geo.id,'stage-31');assert.equal(roster.id,geo.id);assert.equal(art.stageId,geo.id);assert.equal(art.gameplayDataIncluded,false);
assert.equal(sha(roster),art.requiredRosterReference.normalizedStageSHA256,'Do not copy old canonical actor poses into new art');
assert.equal(roster.units.filter(u=>u.team==='enemy').length,34);
for(const key of ['events','objectives'])assert.deepEqual(geo[key],roster[key],`Original ${key} contract`);
assert.deepEqual(geo.design.act4,roster.design.act4,'Original Act4 objective/boarding configuration');
assert.deepEqual(geo.units.filter(u=>u.team!=='enemy'),roster.units.filter(u=>u.team!=='enemy'),'Original party/NPC poses');
const stage=structuredClone(roster);
for(const key of ['terrains','materials','anchors','width','height','playBounds','terrainBounds','terrainDomainVersion'])if(geo[key]!==undefined)stage[key]=structuredClone(geo[key]);
const library=structuredClone(art.library),layers={background:'back',structure:'structural-back',body:'mid',rear:'prop',front:'front'};
const boatIds=new Set(['a4-31-boat-10','a4-31-dock-9']);
const elements=art.placements.filter(e=>!boatIds.has(e.id)).map(e=>{
 assert(layers[e.layer],'Known art layer '+e.layer);
 const p={...structuredClone(e),nativeArtLayer:e.layer,layer:layers[e.layer],depthLayer:'L1',snap:false};
 if(e.layer==='body'){
  assert(e.nativeTerrainIds||e.nativeTerrainId,'Explicit native terrain IDs required; asset names are not geometry');const ids=e.nativeTerrainIds||[e.nativeTerrainId];assert(ids.length&&new Set(ids).size===ids.length);for(const id of ids)assert(stage.terrains.some(t=>t.id===id));p.nativeTerrainIds=[...ids];delete p.nativeTerrainId;
 }
 return p;
});
// Dynamic boat's original approach pose and identity, not static preview's docked pose.
for(const id of boatIds){const e=roster.elements.find(e=>e.id===id);assert(e,'Original boat/dock identity '+id);elements.push(structuredClone(e));}
stage.elements=elements;
stage.design={...stage.design,pilotSkeleton:structuredClone(geo.design.pilotSkeleton),nativeArt:{version:1,coveredTerrainIds:[...new Set(elements.filter(e=>e.nativeArtLayer==='body').flatMap(e=>e.nativeTerrainIds||[e.nativeTerrainId]))],preservePalette:true},nativeArtCandidate:{status:'UNAPPROVED LOCAL QA - RELEASE BLOCKED',artSha256:sha(art),geometrySha256:sha(geo),rosterSha256:sha(roster),remaining:['Final art/collision contact and cover bodies','Actual App whole play and statistics','GUI and public deployment checks']}};
const G={};G.globalThis=G;vm.runInNewContext(await readFile('shared/runtime/act4-pilot-art.js','utf8'),G);G.HonroAct4PilotArt.validateStage(stage,library);
for(const e of elements)assert(library.some(a=>a.id===e.assetId),'Missing paint '+e.assetId);
assert.deepEqual(stage.units,roster.units);assert.deepEqual(stage.encounters,roster.encounters);assert.deepEqual(stage.initialState,roster.initialState);
const project={version:6,activeStageId:stage.id,stages:[stage],library};
await mkdir(out,{recursive:true});
await writeFile(out+'/project.json',JSON.stringify(project));await writeFile(out+'/stage.json',JSON.stringify(stage));await writeFile(out+'/library.json',JSON.stringify(library));
const receipt={status:'UNAPPROVED LOCAL QA - RELEASE BLOCKED',inputs:inputs.map(({path,bytesSha256,value})=>({path,bytesSha256,normalizedSha256:sha(value)})),stageSha256:sha(stage),librarySha256:sha(library),projectSha256:sha(project),enemyCount:34,nativePaintedTerrains:stage.design.nativeArt.coveredTerrainIds,uncoveredTerrains:stage.terrains.filter(t=>!stage.design.nativeArt.coveredTerrainIds.includes(t.id)).map(t=>t.id),boatOriginalPosePreserved:true,actorGameplayExact:true};await writeFile(out+'/receipt.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
