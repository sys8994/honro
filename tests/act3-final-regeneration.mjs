/** Re-run final per-stage authors from the pinned pre-refinement project. */
import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
import{runtime}from'../game/tests/helpers.mjs';
import{applyStage23Refinement}from'../tools/map-forge/apply-stage23-refinement.mjs';
import{refineMaintenance25}from'../tools/map-forge/stage25-maintenance.mjs';
import{applyStage27Depot}from'../tools/map-forge/stage27-depot-revision.mjs';
import{applyStage27Distortion}from'../tools/map-forge/stage27-depot-distortion.mjs';
import{applyStage27WorkingArchitecture}from'../tools/map-forge/stage27-working-architecture.mjs';
import{applyStage28RecordCourt}from'../tools/map-forge/stage28-record-court.mjs';
import{authorStage29Record}from'../tools/map-forge/stage29-record-court.mjs';
import{refineStage30RoofAccess}from'../tools/map-forge/refine-stage30-roof-access.mjs';
import{authorStage21Eupseong}from'../tools/map-forge/stage21-eupseong.mjs';
import{authorStage22Vertical}from'../tools/map-forge/apply-stage22-vertical.mjs';
import{applyStage22VerticalArt}from'../tools/environment/stage22-vertical-art.mjs';
import{authorFamily24}from'../tools/map-forge/stage24-family-compound.mjs';
import{applyWitnessPlace}from'../tools/map-forge/stage26-witness-place.mjs';
const m=JSON.parse(await readFile('game/docs/ACT3_FINAL_INTEGRATION.json')),base=JSON.parse(execFileSync('git',['show',m.baseline+':shared/data/campaign.json'],{maxBuffer:90e6}));
const g=await runtime({legacyMaps:false}),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const authors={21:p=>authorStage21Eupseong(p,g),22:async p=>applyStage22VerticalArt(await authorStage22Vertical(p,g)),24:p=>authorFamily24(p,g),26:p=>applyWitnessPlace(g,p),23:applyStage23Refinement,25:p=>{refineMaintenance25(p,p.stages[24]);return p;},27:p=>applyStage27WorkingArchitecture(applyStage27Distortion(applyStage27Depot(p))),28:applyStage28RecordCourt,29:p=>authorStage29Record(g,p),30:refineStage30RoofAccess};
for(const r of m.sources){assert(authors[r.stage],'Missing final author '+r.stage);const p=await authors[r.stage](structuredClone(base));const reviewed=JSON.parse(execFileSync('git',['show',(r.finalSource||r.source)+':shared/data/campaign.json'],{maxBuffer:90e6}));assert.equal(hash(reviewed.stages[r.stage-1]),r.stageSha256,'Pinned reviewed source '+r.stage);assert.deepEqual(JSON.parse(JSON.stringify(p.stages[r.stage-1])),reviewed.stages[r.stage-1],'Independent author stage '+r.stage+' (object insertion order is not map semantics)');for(const[id,h]of Object.entries(r.assetSha256))assert.equal(hash(p.library.find(a=>a.id===id)),h,'Independent author asset '+id);console.log('PASS independent author',r.stage);}
