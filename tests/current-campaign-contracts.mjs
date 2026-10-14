import {applyStoryAnomalyEnvironment} from '../tools/map-forge/story-anomaly-revision.mjs';
import {storyRevisionApproval} from './act23-story-revision-history.mjs';
import {applyExactStoryJsonDelta,assertExactStoryJsonNegatives} from './exact-story-revision-delta.mjs';
import {beforeQuestProjectProse} from './quest-project-prose-history.mjs';
import {authorStage5Waterfall} from '../tools/map-forge/stage5-waterfall.mjs';
import {beforeApprovedWaterfall} from './approved-waterfall-contract-helpers.mjs';
import{runtime}from'../game/tests/helpers.mjs';import{readFileSync,mkdirSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';import{authorStage14Vertical}from'../tools/map-forge/apply-stage14-vertical.mjs';import{authorStage22Vertical}from'../tools/map-forge/apply-stage22-vertical.mjs';import{applyStage22VerticalArt}from'../tools/environment/stage22-vertical-art.mjs';import{authorAct23QuestRedesign}from'../tools/map-forge/act23-quest-redesign.mjs';import{applyCityTacticalRoutes}from'../tools/map-forge/city-tactical-routes.mjs';import{applyStage9And13Tactical}from'../tools/map-forge/stage9-13-tactical.mjs';import{applyTacticalCityResponses}from'../tools/map-forge/tactical-city-responses.mjs';import{applyTacticalWaveWarnings}from'../tools/map-forge/tactical-wave-warnings.mjs';import{refineStage18BellArt}from'../tools/environment/refine-stage18-bell-art.mjs';
import assert from 'node:assert/strict';
import {campaignHash as hash,currentCampaignManifest as f,assertCurrentCampaign,assertCurrentCampaignLibrary,scopeCampaign} from './current-campaign-contract-helpers.mjs';
import {historicalCampaign,campaignHistoryInput,campaignHistoryLibrary} from './historical-campaign-inputs.mjs';
import {beforeEncounterDensity} from './encounter-density-history-helpers.mjs';
import {beforeStage8BierLibrary} from './stage8-bier-history-helpers.mjs';
const raw=JSON.parse(readFileSync('shared/data/campaign.json')),old=historicalCampaign();
assertCurrentCampaign(raw);assert.equal(raw.stages.length,30);assert.equal(raw.library.length,640);
assert.deepEqual(f.changedStageIds,[5,9,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]);
assert.deepEqual(raw.stages.filter((s,i)=>hash(s)!==hash(old.stages[i])).map(s=>s.metadata.stageId),f.changedStageIds);
assert.deepEqual(raw.library.filter(a=>!old.library.some(b=>b.id===a.id)).map(a=>a.id),f.addedAssetIds);assert.equal(f.addedAssetIds.length,54);
assert.deepEqual(old.library.filter(a=>!raw.library.some(b=>b.id===a.id)),[],'No original asset deletion');
assert.deepEqual(old.library.filter(a=>hash(a)!==hash(raw.library.find(b=>b.id===a.id))).map(a=>a.id),['stage18:bell-hollow-body']);
const bell=JSON.parse(JSON.stringify(refineStage18BellArt(structuredClone(old))));assert.deepEqual(raw.library.find(a=>a.id==='stage18:bell-hollow-body'),bell.library.find(a=>a.id==='stage18:bell-hollow-body'),'Only reviewed bell source regenerates the original asset delta');
const retainedBytes=readFileSync('tests/fixtures/campaign-contracts/retained-assets.json');assert.equal(hash(retainedBytes),f.retainedAssetsSha256);const retained=JSON.parse(retainedBytes);
assert.deepEqual(retained.map(r=>r.id),['stage14:vertical-home-family','stage14:vertical-home-river','stage14:vertical-household-rock-market','quest-redesign:hammer','quest-redesign:bowl']);for(const r of retained){assert.equal(hash(r.asset),r.sha256);assert.deepEqual(raw.library.find(a=>a.id===r.id),r.asset,'Retained original authored asset '+r.sourceCommit+'/'+r.id);}
const g=await runtime({legacyMaps:false}),liveRuntime=JSON.parse(JSON.stringify(g.HONRO_PROJECT));assertCurrentCampaign(liveRuntime,{variant:'runtime'});assert.deepEqual(JSON.parse(JSON.stringify(g.HonroMaps.validate(raw))).filter(e=>e.level==='err'),[]);
const waterfallDelta=f.approvedDeltas.find(d=>d.kind==='stage5-waterfall');assert(waterfallDelta);const bodyDelta=f.approvedDeltas.find(d=>d.kind==='stage5-body-fluid-separation');assert(bodyDelta);assert.equal(hash(readFileSync(bodyDelta.author)),bodyDelta.authorSha256);assert.equal(hash(readFileSync(bodyDelta.priorFixture)),bodyDelta.priorFixtureSha256);for(const row of bodyDelta.rows){assert.equal(row.beforeStageSha256,waterfallDelta.rows.find(r=>r.variant===row.variant).afterStageSha256);assert.equal(row.afterStageSha256,f[row.variant].stages[4].sha256);}assert.equal(hash(readFileSync(waterfallDelta.originalFixture)),waterfallDelta.originalFixtureSha256);assert.deepEqual([waterfallDelta.addedAssets,waterfallDelta.removedAssets,waterfallDelta.changedAssets],[0,0,0]);
const preWaterfall=beforeApprovedWaterfall(raw,g);assert.deepEqual(preWaterfall.stages[4],old.stages[4],'Original stage5 agrees with immutable1973 checkpoint');
for(const mutate of [p=>p.stages[4].units[0].hp++,p=>p.stages[4].terrains[0].points[0].x++,p=>p.stages[4].initialState.honroStage5WaterfallRevision++,p=>p.stages[4].terrains.reverse()]){const p=structuredClone(raw);mutate(p);assert.throws(()=>beforeApprovedWaterfall(p,g),'Unapproved waterfall changes must fail');}
// Replay every later map author from the original checkpoint, not from current
// target maps. The five retired editable assets remain separately immutable.
let made=await authorStage14Vertical(historicalCampaign(),g);made=applyStage22VerticalArt(await authorStage22Vertical(made,g));made=await authorAct23QuestRedesign(made);made=applyCityTacticalRoutes(made);made=applyStage9And13Tactical(made);made=applyTacticalCityResponses(made);made=applyTacticalWaveWarnings(made);made=refineStage18BellArt(made);made=JSON.parse(JSON.stringify(authorStage5Waterfall(made,g)));
for(const r of retained){assert(!made.library.some(a=>a.id===r.id),'Explicitly retired author output, not overriding current output');made.library.push(structuredClone(r.asset));}
// Preserve insertion order from the actual sequential authored releases. These
// explicit permutations cannot conceal membership or value drift. Current raw
// ordering is independently pinned above, including every terrain and asset.
const reorder=(values,ids,label)=>{assert.equal(new Set(values.map(v=>v.id)).size,values.length,label+' unique');assert.deepEqual(values.map(v=>v.id).sort(),[...ids].sort(),label+' exact membership');return ids.map(id=>values.find(v=>v.id===id));};
made.stages[14].terrains=reorder(made.stages[14].terrains,f.stage15TerrainOrder,'15 terrain source order');made.library=reorder(made.library,f.raw.library.map(a=>a.id),'Historical asset insertion order');
made=beforeQuestProjectProse(JSON.parse(JSON.stringify(g.HonroStoryCanonV1.author(g.HonroBellAnomaly.author(applyStoryAnomalyEnvironment(made))))));
for(let i=0;i<30;i++)assert.deepEqual(made.stages[i],raw.stages[i],'Independent current source recipe reproduces complete stage '+(i+1));assert.deepEqual(made.library,raw.library,'Independent authors plus exact retained originals reproduce all640 assets');assert.deepEqual({...made,stages:[],library:[]},{...raw,stages:[],library:[]});
for(const scope of ['full','act12']){const current=scopeCampaign(raw,scope),historic=historicalCampaign({scope});assert.deepEqual(campaignHistoryInput(current,{scope}),historic);assert.deepEqual(campaignHistoryLibrary(current.library,{scope}),historic.library);assert.deepEqual(beforeStage8BierLibrary(current.library,{scope}),beforeStage8BierLibrary(historic.library,{scope}));assert.deepEqual(campaignHistoryInput(historic,{scope}),historic);const projected=beforeEncounterDensity(historic);assert.equal(hash(projected),scope==='full'?'d3a326b89d61c79968be75e452c81043071588db8d8755fe4b2d8c6b1647c39d':JSON.parse(readFileSync('tests/fixtures/encounter-density/history-delta.json')).beforeAct12Sha256);}
let storyJsonNegatives=0;
for(const row of storyRevisionApproval.campaign.stages.filter(row=>row.variant!=='project')){
 const current=beforeQuestProjectProse(row.variant==='raw'?raw:liveRuntime).stages[row.stageId-1];
 const before=applyExactStoryJsonDelta(current,row,{reverse:true});storyJsonNegatives+=assertExactStoryJsonNegatives(before,row);
 for(const change of row.changes){
  if(row.stageId===12&&JSON.stringify(change.path)===JSON.stringify(['initialState','honroQuarryContent','beats','sign',2,1])){
   assert.equal(change.kind,'field');assert.equal(change.beforePresent,true);assert.equal(change.afterPresent,true);
   assert.equal(change.before,'돌림진이네. 발걸음을 제자리로 돌리는 법이지. 이 획은 내가 배운 것과 같은 뿌리야.');
   assert.equal(change.after,'돌림진이네. 사람이 길을 틀어놓은 진이지. 이 획은 내가 배운 것과 같은 뿌리야.');continue;
  }
  if(row.stageId===14&&JSON.stringify(change.path)===JSON.stringify(['initialState','honroVerticalStage14Content','beats','family-mid'])){
   assert.equal(change.kind,'splice');assert.equal(change.beforeIndex,5);assert.equal(change.afterIndex,5);assert.deepEqual(change.before,[]);
   assert.deepEqual(change.after,[['중층 주민','요새는 늘 밟던 돌에서도 발을 헛디뎌요. 등잔을 가까이 대면 돌은 제자리에 있는데.']]);continue;
  }
  assert.equal(change.kind,'field');assert.equal(change.beforePresent,false,'Campaign changes are additions only');
  assert((change.path[0]==='initialState'&&['honroStoryCanonRevision','honroBellAnomalyRevision','honroStoryAnomalyRevision','honroStoryAnomalyEnvironment','honroAct3Void'].includes(change.path[1])&&change.path.length===2)||(row.stageId===27&&JSON.stringify(change.path)===JSON.stringify(['design','act3','voidEncounter'])),'Only reviewed story-entry metadata; no map/quest/combat changes');
 }
 const changed=structuredClone(current);changed.units[0].hp++;
 assert.throws(()=>applyExactStoryJsonDelta(changed,{...row,afterSha256:hash(changed)},{reverse:true}),'Repinned HP changes cannot be hidden by story metadata inverse');storyJsonNegatives++;
}
const negatives=[];for(const[id,mutate]of[
 ['remove-original-asset',p=>p.library.shift()],['remove-added-asset',p=>p.library.pop()],['change-original-asset',p=>p.library[0].name+=' drift'],['change-added-asset',p=>p.library.at(-1).name+=' drift'],['change-bell',p=>p.library.find(a=>a.id==='stage18:bell-hollow-body').vector.source+=' drift'],['reorder-assets',p=>p.library.reverse()],['duplicate-asset',p=>p.library.push(structuredClone(p.library[0]))],['change-untouched-stage',p=>p.stages[0].width++],['change-approved-stage',p=>p.stages[13].width++],['remove-chapter',p=>p.stages.pop()],['reorder-chapters',p=>p.stages.reverse()],['change-global',p=>p.name+=' drift']
]){const p=structuredClone(raw);mutate(p);assert.throws(()=>assertCurrentCampaign(p),id);assert.throws(()=>campaignHistoryInput(p),id+' cannot be hidden by history selection');if(id.includes('asset')||id==='change-bell')assert.throws(()=>beforeStage8BierLibrary(p.library),id+' cannot be hidden by the library boundary');negatives.push(id);}
const corrupt=historicalCampaign();corrupt.stages[0].width++;assert.throws(()=>beforeEncounterDensity(corrupt),'Historical mutation still rejected');assert.throws(()=>campaignHistoryLibrary(raw.library,{scope:'guess'}));assert.throws(()=>campaignHistoryLibrary(raw.library,{scope:'act12'}),'Full cannot masquerade as Act12');
mkdirSync('_local/reports/campaign-contracts',{recursive:true});writeFileSync('_local/reports/campaign-contracts/current-and-history.json',JSON.stringify({passed:true,historicalCommit:f.historicalCommit,historicalSha256:hash(old),currentSha256:hash(raw),chapters:30,assets:640,added:54,removed:0,changedOriginalAssets:['stage18:bell-hollow-body'],changedStageIds:f.changedStageIds,retainedAssets:retained.map(({asset,...r})=>r),reproducedStages:30,negativeControls:negatives,storyJsonNegatives,scope:'Current canonical whole-map/source replay and unchanged historical data boundaries. Runtime-source/fingerprint validators remain independent and unchanged; no browser or normal-play acceptance.'},null,2)+'\n');console.log('PASS independently regenerated30 current maps/640 assets,54 exact additions,1 source-derived bell update,immutable1973f07 history and12 dual-boundary negative controls');
