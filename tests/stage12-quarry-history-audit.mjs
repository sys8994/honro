/** Exact current12 -> d7 -> immutable30 -> immutable18, with negative controls.
 * --self-test uses a clearly synthetic in-memory checkpoint; it never records
 * a review, changes production data or claims actual current-map acceptance. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtimeParts} from '../shared/build.mjs';
import {runtime} from '../game/tests/helpers.mjs';
import {act12Project} from './campaign-scope-helpers.mjs';
import * as Q from './stage8-bier-history-helpers.mjs';
import {beforeEncounterDensityAuthoringSources} from './encounter-density-history-helpers.mjs';
import * as F from './stage30-ferry-history-helpers.mjs';
import * as B from './stage18-bell-history-helpers.mjs';
const {quarryHistoryHash:hash,quarryHistoryPlain:plain}=Q,f=Q.stage12QuarryBefore,selfTest=process.argv.includes('--self-test');
const protectedFixtures={
 'tests/fixtures/stage12-quarry/history-before.json':'a36d06eb65f4235d1c90460785cb76481a6d35cde657203877e2c08640bda531',
 'tests/fixtures/stage12-quarry/before-stage12.json':'324fb650cd7654bcfd8e35662de3b7dfbbab427b9838be85f9151911ef951d18',
 'tests/fixtures/stage30-ferry/history-before.json':'17e77f6a3cbfe305f466d10e8b4ae2a33f0010305aa077f1669938e26f2a98c3',
 'tests/fixtures/stage30-ferry/before-stage30.json':'2515f1806caeb2227d1cc7d3277c9d665f532960e46ee40e81ad4d2cfe6a046b',
 'tests/fixtures/stage30-ferry/history-reviewed.json':'0773a6abc4eea34c652a1c807e375ec0f81c948ebb7497cb4d607e3a58fc8954',
 'tests/fixtures/stage18-bell-before.json':'1441c7fd38521deea70311954e3b24483e55b7f95a6aaaeedc0feea86728d321',
 'tests/fixtures/stage18-bell-history-delta.json':'176dff5b465e9ae63838ce6b98a5265512e527f313ef5fa55ebd5ba614f5f819'
};
for(const [path,digest]of Object.entries(protectedFixtures))assert.equal(hash(await readFile(path,'utf8')),digest,'Immutable historical fixture '+path);
let p=JSON.parse(await readFile('shared/data/campaign.json','utf8')),sources,review;
if(selfTest){
 p=Q.beforeStage23Escort(p); // Exact newer boundary before the synthetic old12 fixture.
 // Construct a fixture, not a production projection. The resulting baseline
 // must still match the original complete d7 hash before any synthetic edit.
 p.stages[11]=plain(Q.stage12QuarryOriginal.stage);p.library=p.library.filter(a=>!a.id.startsWith(f.scope.addedAssetPrefix));assert.equal(hash(p),f.projectSha256);
 sources=Object.fromEntries(await Promise.all(f.runtime.files.map(async row=>[row.path,Object.hasOwn(row,'before')?row.before:await readFile(row.path,'utf8')])));
 sources=Q.beforeStage12QuarryHoldGuideSources(sources);
 Q.beforeStage12QuarryRuntimeSources(sources);
 const ui=Q.stage12QuarryHoldGuideDelta;sources[ui.path]=sources[ui.path].replace(ui.before,ui.after);
 sources['shared/build.mjs']=sources['shared/build.mjs'].replace("'stage30-ferry','objective-guidance'","'stage30-ferry','stage12-quarry','objective-guidance'").replace("'stage30-ferry-art','combat-feedback'","'stage30-ferry-art','stage12-quarry-art','combat-feedback'");
 sources['shared/runtime/terrain-readability.js']=sources['shared/runtime/terrain-readability.js'].replace('G.HonroStage30FerryArt?.omitReadability(group,b)','G.HonroStage30FerryArt?.omitReadability(group,b)||G.HonroStage12QuarryArt?.omitReadability(group,b)');
 const balance=JSON.parse(sources['game/config/balance.json']);balance.stages[11].initialEnemies=32;sources['game/config/balance.json']=JSON.stringify(balance,null,2)+'\n';
 for(const path of f.scope.allowedAddedRuntime)sources[path]='/* Synthetic history-boundary byte fixture. This string is never executed. */\n'+' '.repeat(80)+path;
 const stage=p.stages[11],foes=stage.units.filter(u=>u.team==='enemy');stage.width=11200;stage.height=8000;
 stage.units=[...stage.units.filter(u=>u.team==='player'),...Array.from({length:32},(_,i)=>({...plain(foes[i%foes.length]),id:'sq-self-test-'+i,stageOverrides:{...plain(foes[i%foes.length].stageOverrides),honroAct2Elite:i<7}}))];
 Object.assign(stage.initialState,{honroQuarryRevision:1,honroQuarryRoster:'candidate32e7',honroQuarryPopulationCap:40,honroQuarrySpec:{gateTerrainId:stage.terrains[0].id,entries:{'hold-road-0':{x:100,y:200}}},honroQuarryContent:plain(Q.stage12QuarryOriginal.content)});
 stage.initialState.honroQuarryContent.guide='Synthetic history scope only';
 p.library.push({id:'stage12:quarry-history-self-test',name:'Synthetic scope fixture',collision:[],vector:{root:{type:'svg'},source:'<svg xmlns="http://www.w3.org/2000/svg"/>'}});
 review=Q.createStage12QuarryReview(p,sources,{label:'synthetic-history-boundary-self-test'});
}else{sources=Q.stage12QuarryRuntimeSources();review=Q.stage12QuarryReview();}
const options={review},snapshot=JSON.stringify(p),sourceSnapshot=JSON.stringify(sources),before=Q.beforeStage12Quarry(p,options);
Q.assertStage12QuarryCurrent(p,options);assert.equal(hash(before),f.projectSha256);assert.equal(JSON.stringify(p),snapshot,'Map projection is pure');
assert.deepEqual(Q.beforeStage12Quarry(before,options),before,'Map projection is idempotent');assert.deepEqual(Q.beforeStage12Quarry(act12Project(p),options),act12Project(before),'Full/Act12 agree');
assert.deepEqual(Q.beforeStage12QuarryLibrary(p.library,options),before.library);assert.deepEqual(Q.beforeStage12QuarryLibrary(before.library,options),before.library);
F.assertStage30FerryCurrent(before);assert.equal(hash(F.beforeStage18Bell(before)),B.stage18BellHistoryDelta.beforeProjectSha256);assert.equal(hash(F.beforeStage18Bell(act12Project(before))),B.stage18BellHistoryDelta.beforeAct12ProjectSha256);
const mutations=[
 ['terrain point',p=>p.stages[11].terrains[0].points[0].x++],['enemy position',p=>p.stages[11].units.find(u=>u.team==='enemy').x++],
 ['missing revision',p=>delete p.stages[11].initialState.honroQuarryRevision],['unknown roster',p=>p.stages[11].initialState.honroQuarryRoster='candidate33'],
 ['population cap',p=>p.stages[11].initialState.honroQuarryPopulationCap++],['active limit',p=>p.stages[11].initialState.honroActiveLimit++],
 ['hold rounds',p=>p.stages[11].initialState.honroAct2Steps[2].rounds++],['finite wave',p=>p.stages[11].initialState.honroAct2Steps[2].wave.count++],
 ['clear-all removal',p=>p.stages[11].initialState.honroAct2Steps[3].cohorts='west'],['class gate',p=>p.stages[11].initialState.honroAct2Steps[1].requiredClass='mage'],
 ['saved guide',p=>p.stages[11].initialState.honroQuarryContent.guide+=' drift'],['saved story',p=>p.stages[11].initialState.honroQuarryContent.outro[0][1]+=' drift'],
 ['saved gate',p=>p.stages[11].initialState.honroQuarrySpec.gateTerrainId+=' drift'],['duplicate unit',p=>p.stages[11].units.push(plain(p.stages[11].units[0]))],
 ['other Stage30',p=>p.stages[29].width++],['other Stage18',p=>p.stages[17].width++],['other Stage1',p=>p.stages[0].width++],
 ['old asset',p=>p.library[0].name+=' drift'],['asset reorder',p=>p.library.reverse()],['stage reorder',p=>p.stages.reverse()],
 ['stage duplicate',p=>p.stages.push(plain(p.stages[11]))],['stage alias',p=>p.stages[0].metadata.stageId=12],['stage missing',p=>p.stages.splice(11,1)],
 ['global',p=>p.name+=' drift'],['unscoped asset',p=>p.library.push({id:'unreviewed:asset',collision:[]})]
];
if(review.addedAssets.length)mutations.push(
 ['new asset source',p=>p.library.find(a=>a.id.startsWith(f.scope.addedAssetPrefix)).vector.source+=' '],
 ['new collision',p=>p.library.find(a=>a.id.startsWith(f.scope.addedAssetPrefix)).collision.push({x:0,y:0,w:10,h:10})],
 ['new asset missing',p=>p.library.pop()],['new asset duplicate',p=>p.library.push(plain(p.library.at(-1)))],
 ['historical map with fresh art',p=>p.stages[11]=plain(Q.stage12QuarryOriginal.stage)]
);
for(const [name,mutate]of mutations){const q=plain(p);mutate(q);assert.throws(()=>Q.beforeStage12Quarry(q,options),'Projection must not hide '+name);}
for(const mutate of [r=>r.sourceCommit='unreviewed',r=>r.sourceTree='unreviewed',r=>r.scope.stageIds.push(13),r=>r.stage.units[0].x++]){const r=plain(review);mutate(r);assert.throws(()=>Q.beforeStage12Quarry(p,{review:r}),'Review identity/scope/current snapshot is exact');}
const prior=Q.beforeStage12QuarryRuntimeSources(sources,options);assert.equal(Object.keys(prior).length,126);assert.deepEqual(Q.beforeStage12QuarryRuntimeSources(prior,options),prior);F.beforeStage30FerryRuntimeSources(prior);assert.equal(JSON.stringify(sources),sourceSnapshot,'Runtime projection is pure');
const runtimePaths=['shared/runtime/act2-art.js','shared/runtime/stage12-quarry.js','shared/runtime/stage12-quarry-art.js','shared/build.mjs','shared/runtime/terrain-readability.js','game/config/balance.json','shared/runtime/stage30-ferry.js','shared/runtime/stage18-bell.js','shared/engine/src/engine.ts','shared/map/compiler.js'];
for(const path of runtimePaths)assert.throws(()=>Q.beforeStage12QuarryRuntimeSources({...sources,[path]:sources[path]+' '},options),'Exact runtime byte drift '+path);
assert.throws(()=>Q.beforeStage12QuarryRuntimeSources({...sources,'shared/runtime/unreviewed.js':'x'},options));const missing={...sources};delete missing['shared/runtime/stage12-quarry-art.js'];assert.throws(()=>Q.beforeStage12QuarryRuntimeSources(missing,options));
const ui=Q.stage12QuarryHoldGuideDelta,originalUI=Q.beforeStage12QuarryHoldGuideSource(sources[ui.path]);
assert.equal(originalUI,prior[ui.path],'UI inverse agrees with the complete runtime projection');
const onlyUI=Q.beforeStage12QuarryHoldGuideSources(sources);assert.deepEqual(Object.keys(onlyUI),Object.keys(sources));
for(const [path,source]of Object.entries(sources))if(path!==ui.path)assert.equal(onlyUI[path],source,'UI boundary preserves every other source '+path);
const uiMutations=[
 ['missing current correction',()=>originalUI],['duplicate corrected line',s=>s+'\n'+ui.after],
 ['duplicate original line',s=>s+'\n'+ui.before],['stage condition removed',s=>s.replace('b.honroStage===12&&','')],
 ['custom condition removed',s=>s.replace('!b.honroCustom&&','')],['revision condition widened',s=>s.replace('b.honroQuarryRevision===1','b.honroQuarryRevision>=1')],
 ['fallback changed',s=>s.replace("?'라운드':'턴'","?'라운드':'라운드'")],
 ['legend condition widened',s=>s.replace("b.honroQuarryRevision===1?'실선:","b.honroQuarryRevision>=1?'실선:")],
 ['legend fallback changed',s=>s.replace(":'실선: 방어 범위 / 점선: 적 진입 금지'",":'실선: 방어 범위 / 점선 안에 적이 오면 중단'")],
 ['adjacent one byte',s=>s.replace(ui.after,ui.after+' ')],['unrelated one byte',s=>s+' ']
];
for(const [name,mutate]of uiMutations){const changed=mutate(sources[ui.path]);assert.notEqual(changed,sources[ui.path],name);
 assert.throws(()=>Q.beforeStage12QuarryRuntimeSources({...sources,[ui.path]:changed},options),'Current UI rejects '+name);
 assert.throws(()=>Q.createStage12QuarryReview(p,{...sources,[ui.path]:changed},{label:'rejected UI drift'}),'Recorder rejects '+name);
}
for(const changed of [originalUI+' ',originalUI.replace(ui.before,ui.after),originalUI+'\n'+ui.before])assert.throws(()=>Q.beforeStage12QuarryRuntimeSources({...prior,[ui.path]:changed},options),'Historical original UI remains exact');
const alteredReview=plain(review);delete alteredReview.runtime['shared/build.mjs'];assert.throws(()=>Q.beforeStage12QuarryRuntimeSources(sources,{review:alteredReview}));
const balance=JSON.parse(sources['game/config/balance.json']),content={stages:[{id:1,unchanged:true},plain(Q.stage12QuarryOriginal.content)]};content.stages[1].enemies=balance.stages[11].initialEnemies;
const contentSnapshot=JSON.stringify(content),balanceSnapshot=JSON.stringify(balance),priorContent=Q.beforeStage12QuarryContent(content,options),priorBalance=Q.beforeStage12QuarryBalance(balance,options);
assert.deepEqual(priorContent.stages[1],Q.stage12QuarryOriginal.content);assert.deepEqual(priorBalance.stages[11],Q.stage12QuarryOriginal.balance);assert.deepEqual(priorContent.stages[0],content.stages[0]);
assert.deepEqual(Q.beforeStage12QuarryContent(priorContent,options),priorContent);assert.deepEqual(Q.beforeStage12QuarryBalance(priorBalance,options),priorBalance);assert.equal(JSON.stringify(content),contentSnapshot);assert.equal(JSON.stringify(balance),balanceSnapshot);
for(const mutate of [p=>p.stages[11].initialEnemies++,p=>p.stages[11].maxAlive++,p=>p.stages[11].activeEnemies++,p=>p.stages[11].targetHits++,p=>p.stages.push(plain(p.stages[11]))]){const q=plain(balance);mutate(q);assert.throws(()=>Q.beforeStage12QuarryBalance(q,options));}
for(const mutate of [p=>p.stages[1].enemies++,p=>p.stages[1].beats.sign[0][1]+=' drift',p=>p.stages[1].steps[2].rounds++,p=>p.stages.push(plain(p.stages[1]))]){const q=plain(content);mutate(q);assert.throws(()=>Q.beforeStage12QuarryContent(q,options));}
const plan={stages:[plain(Q.stage12QuarryOriginal.plan)]};assert.deepEqual(Q.beforeStage12QuarryPlan(plan),plan);plan.stages[0].active++;assert.throws(()=>Q.beforeStage12QuarryPlan(plan));
let fingerprintChecks=0,runtimeWrapperChecks=0;
if(!selfTest){
 const historicalAuthors=beforeEncounterDensityAuthoringSources(Q.stage8BierAuthoringSources());for(const [path,digest]of Object.entries(review.authoringSources))assert.equal(hash(String(historicalAuthors[path])),digest,'Reviewed generator source after verified density projection '+path);
 const raw=await runtimeParts({vector:false,render:false}),rawSnapshot=JSON.stringify(raw),rawPrior=Q.beforeStage12QuarryFingerprintParts(raw,{sources,review});assert.equal(hash(rawPrior.join('\n')),f.runtime.beforeFingerprintSha256);assert.equal(JSON.stringify(raw),rawSnapshot);assert.deepEqual(Q.beforeStage12QuarryFingerprintParts(rawPrior,{sources,review}),rawPrior);
 const temple=[...raw.filter(s=>!s.startsWith('globalThis.HONRO_PROJECT=')),...await Promise.all(['main','story','interactions','rest-journey','training'].map(name=>readFile('shared/runtime/'+name+'.js','utf8')))];
 assert.equal(hash(Q.beforeStage18BellFingerprintParts(temple,{sources}).join('\n')),B.stage18BellHistoryDelta.runtime.beforeFingerprintSha256);
 for(const parts of [raw,temple])for(const mutate of [p=>p.push('unreviewed'),p=>p.push(sources['shared/runtime/stage12-quarry.js']),p=>{p[1]+=' ';}]){const q=[...parts];mutate(q);assert.throws(()=>Q.beforeStage12QuarryFingerprintParts(q,{sources,review}));fingerprintChecks++;}
 const g=await runtime({legacyMaps:false}),saved={project:g.HONRO_PROJECT,content:g.HONRO_CONTENT,balance:g.HONRO_BALANCE,plan:g.HonroAct2Plan};assert.equal(hash(g.HONRO_PROJECT),hash(p));
 for(const [fn,expected]of [[Q.withHistoricalStage12,f.projectSha256],[Q.withHistoricalStage30,F.stage30FerryBefore.projectSha256],[Q.withHistoricalStage18,B.stage18BellHistoryDelta.beforeProjectSha256]]){
  fn(g,()=>{assert.equal(typeof g.HonroAct2Plan.forStage,'function','Live plan API survives history scopes');for(const id of [12,18,19])assert.equal(g.HonroAct2Plan.forStage(id),g.HonroAct2Plan.stages[id-11],'Captured plan closure sees projected row '+id);assert.equal(hash(g.HONRO_PROJECT),expected);for(const id of fn===Q.withHistoricalStage18?[12,18,19]:[12])assert.deepEqual(g.HONRO_PROJECT.stages[id-1].design.targetRounds,g.HonroAct2Plan.forStage(id).rounds,'Projected map and plan retain the historical realm contract '+id);assert.deepEqual(plain(g.HONRO_CONTENT.stages[11]),Q.stage12QuarryOriginal.content);assert.deepEqual(plain(g.HONRO_BALANCE.stages[11]),Q.stage12QuarryOriginal.balance);});
  assert.throws(()=>fn(g,()=>{throw Error('restore sentinel');}),/restore sentinel/);
  assert.equal(g.HONRO_PROJECT,saved.project);assert.equal(g.HONRO_CONTENT,saved.content);assert.equal(g.HONRO_BALANCE,saved.balance);assert.equal(g.HonroAct2Plan,saved.plan);runtimeWrapperChecks+=2;
 }
 for(const key of ['HONRO_CONTENT','HONRO_BALANCE','HonroAct2Plan']){const target=g[key].stages,index=key==='HonroAct2Plan'?1:11,original=target[index];target[index]={...plain(original),unreviewed:true};try{assert.throws(()=>Q.withHistoricalStage12(g,()=>assert.fail('Unreviewed semantic state entered callback')));}finally{target[index]=original;}runtimeWrapperChecks++;}
}
const result={passed:true,syntheticBoundarySelfTest:selfTest,currentProductionAccepted:!selfTest,label:review.label,sourceCommit:f.sourceCommit,unchangedMaps:29,unchangedAssets:f.library.length,addedAssets:review.addedAssets.length,protectedFixtureFiles:Object.keys(protectedFixtures).length,projectNegativeControls:mutations.length+4,runtimeNegativeControls:runtimePaths.length+3,holdGuideNegativeControls:uiMutations.length*2+3,holdGuideOriginalSha256:hash(originalUI),semanticNegativeControls:10,fingerprintNegativeControls:fingerprintChecks,runtimeWrapperChecks,beforeProjectSha256:f.projectSha256,afterProjectSha256:hash(p),scope:selfTest?'Synthetic in-memory boundary tests only; no actual current checkpoint or gameplay acceptance.':'Exact current12 -> d7 -> original30 -> original18. Current Engine only. No gameplay, fullplay, visual or browser acceptance.'};
await mkdir('_local/reports/stage12-quarry',{recursive:true});await writeFile('_local/reports/stage12-quarry/'+(selfTest?'history-boundary-self-test':'exact-history')+'.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
