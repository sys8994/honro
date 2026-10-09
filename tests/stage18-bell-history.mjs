import {beforeStage30Ferry,beforeStage30FerryRuntimeSources,beforeStage30FerryFingerprintParts,withHistoricalStage18} from './stage30-ferry-history-helpers.mjs';
/** Exact current18/19 audit before all immutable older history projections. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {runtimeParts} from '../shared/build.mjs';
import {act12Project} from './campaign-scope-helpers.mjs';
import {bellHistoryHash as hash,bellHistoryPlain as plain,stage18BellBefore as old,stage18BellHistoryDelta as f,assertStage18BellCurrent,beforeStage18Bell,beforeStage18BellLibrary,stage18BellRuntimeSources,assertStage18BellRuntimeSources,beforeStage18BellFingerprintParts} from './stage18-bell-history-helpers.mjs';
import {templeBattleContract} from './stage16-temple-buddha-contract-helpers.mjs';
const p=beforeStage30Ferry(JSON.parse(readFileSync('shared/data/campaign.json','utf8'))),snapshot=JSON.stringify(p),before=beforeStage18Bell(p);
assert.equal(f.sourceCommit,old.sourceCommit);assert.equal(f.sourceCommit,'7b9713e23287292269dde6ae359acb7b35a8571f');assertStage18BellCurrent(p);assert.equal(hash(before),f.beforeProjectSha256);assert.equal(JSON.stringify(p),snapshot,'Source is never mutated');assert.deepEqual(beforeStage18Bell(before),before,'Historical boundary is idempotent');
assert.deepEqual(beforeStage18BellLibrary(p.library),before.library);assert.deepEqual(beforeStage18BellLibrary(before.library),before.library);
assert.equal(before.library.length,540,'Original540-asset historical project remains intact');assert.equal(p.library.length,540+f.addedAssets.length);assert.equal(before.stages.length,30);assert.deepEqual(before.stages.map(s=>s.id),p.stages.map(s=>s.id));
assert.deepEqual(p.stages.filter(s=>![18,19].includes(s.metadata.stageId)),before.stages.filter(s=>![18,19].includes(s.metadata.stageId)),'All28 unrelated complete maps stay exact');
assert.deepEqual(before.stages.filter(s=>[18,19].includes(s.metadata.stageId)),old.stages,'Immutable original18/19');
assert.deepEqual({...p,stages:[],library:[]},{...before,stages:[],library:[]},'All project globals remain exact');
const scoped=act12Project(p);assertStage18BellCurrent(scoped);assert.deepEqual(beforeStage18Bell(scoped),act12Project(before),'Full/Act12 projection agrees');assert.deepEqual(beforeStage18Bell(beforeStage18Bell(scoped)),act12Project(before),'Act12 idempotence');assert.deepEqual(beforeStage18BellLibrary(scoped.library),act12Project(before).library);
const mutations=[
 ['18 route',q=>q.stages[17].routes[1].x++],
 ['18 enemy',q=>q.stages[17].units.find(u=>u.team==='enemy').x++],
 ['18 objective',q=>q.stages[17].initialState.honroAct2Steps[0].label+=' drift'],
 ['19 ritual round',q=>q.stages[18].initialState.honroAct2Steps.find(s=>s.kind==='hold').rounds++],
 ['19 resident HP',q=>{const u=q.stages[18].units.find(u=>u.kind==='object:civilian');assert(u);u.stageOverrides.hp=(u.stageOverrides.hp||1)+1;}],
 ['old16 Buddha',q=>q.library.find(a=>a.id.includes('stone-buddha')).vector.source+=' '],
 ['old asset',q=>q.library[0].name+=' drift'],
 ['new bell SVG point',q=>{const a=q.library.find(a=>a.id==='stage18:bell-hollow-body');const source=a.vector.source;a.vector.source=source.replace(/(<path\b[^>]*\bd="M\s*)(-?\d+(?:\.\d+)?)/,(_,prefix,x)=>prefix+(Number(x)+1));assert.notEqual(a.vector.source,source,'Mutation changes an actual SVG path coordinate');}],
 ['stage reorder',q=>q.stages.reverse()],
 ['stage duplicate',q=>q.stages.push(plain(q.stages[17]))],
 ['stage missing',q=>q.stages.splice(17,1)],
 ['library reorder',q=>q.library.reverse()],
 ['library duplicate',q=>q.library.push(plain(q.library.at(-1)))],
 ['library missing',q=>q.library.pop()],
 ['global',q=>q.name=(q.name||'')+' drift'],
 ['18 revision removal',q=>delete q.stages[17].initialState.honroBellRevision],
 ['19 revision removal',q=>delete q.stages[18].initialState.honroBellRevision],
 ['both revision removal',q=>{delete q.stages[17].initialState.honroBellRevision;delete q.stages[18].initialState.honroBellRevision;}],
 ['mixed new18/old19',q=>q.stages[18]=plain(old.stages[1])],
 ['mixed old18/new19',q=>q.stages[17]=plain(old.stages[0])],
 ['old maps with new art',q=>{q.stages[17]=plain(old.stages[0]);q.stages[18]=plain(old.stages[1]);}]
];
for(const [label,mutate]of mutations){const q=plain(p);mutate(q);assert.throws(()=>assertStage18BellCurrent(q),'Reject current '+label);assert.throws(()=>beforeStage18Bell(q),'Never hide '+label+' with an old fixture');}
for(const id of [18,19]){const q=plain(before);q.stages[id-1].routes[0].x++;assert.throws(()=>beforeStage18Bell(q),'Historical Stage'+id+' must also remain exact');}
for(const mutate of [q=>q.reverse(),q=>q.pop(),q=>q[0].name+=' drift',q=>q.push(plain(q.at(-1)))]){const q=plain(p.library);mutate(q);assert.throws(()=>beforeStage18BellLibrary(q),'Library-only boundary rejects drift');}
const sources=beforeStage30FerryRuntimeSources(stage18BellRuntimeSources());assertStage18BellRuntimeSources(sources);
const runtimeMutations=['shared/runtime/act2.js','shared/runtime/objective-guidance.js','shared/runtime/terrain-readability.js','shared/runtime/stage18-bell.js','shared/engine/src/warriorMechanics.ts','shared/engine/src/engine.ts','shared/runtime/stage16-temple.js'];
for(const path of runtimeMutations){const changed={...sources,[path]:sources[path]+' '};assert.throws(()=>assertStage18BellRuntimeSources(changed),'Reject even one runtime-hook character '+path);}
const allParts=await runtimeParts({vector:false,render:false}),fingerprintParts=beforeStage30FerryFingerprintParts([...allParts.filter(s=>!s.startsWith('globalThis.HONRO_PROJECT=')),...['main','story','interactions','rest-journey','training'].map(f=>readFileSync('shared/runtime/'+f+'.js','utf8'))]),inputSnapshot=JSON.stringify(fingerprintParts);
assert.equal(hash(beforeStage18BellFingerprintParts(fingerprintParts,{sources}).join('\n')),f.runtime.beforeFingerprintSha256);assert.equal(JSON.stringify(fingerprintParts),inputSnapshot,'Historical fingerprint conversion is pure');assert.throws(()=>beforeStage18BellFingerprintParts([...fingerprintParts,' '],{sources}),'No unknown runtime part');const changedParts=[...fingerprintParts];changedParts[1]+=' ';assert.throws(()=>beforeStage18BellFingerprintParts(changedParts,{sources}),'No unreviewed compiled core');
const g=await runtime({legacyMaps:false});assert.equal(hash(beforeStage30Ferry(g.HONRO_PROJECT)),hash(p),'Production runtime/source exact current agreement after verified ferry projection');const saved=g.HONRO_PROJECT,saved18=g.HONRO_CONTENT.stages[17],saved19=g.HONRO_CONTENT.stages[18];
withHistoricalStage18(g,()=>{assert.equal(hash(g.HONRO_PROJECT),hash(before));for(const row of f.runtime.stages){assert.deepEqual(plain(g.HONRO_CONTENT.stages[row.id-1]),row.before.content);const q=battlefield(g,row.id);g.HonroAct2.attach(q.app,q.e);assert(!g.HonroStage18Bell.active(q.b),'Only the historical audit sees an unmarked old battle');}});
assert.equal(g.HONRO_PROJECT,saved);assert.equal(g.HONRO_CONTENT.stages[17],saved18);assert.equal(g.HONRO_CONTENT.stages[18],saved19);
for(const id of [18,19])for(const [name,values,index]of [['content',g.HONRO_CONTENT.stages,id-1],['plan',g.HonroAct2Plan.stages,id-11],['balance',g.HONRO_BALANCE.stages,id-1]]){const savedValue=values[index];values[index]={...plain(savedValue),unreviewedField:true};try{assert.throws(()=>withHistoricalStage18(g,()=>assert.fail('Unreviewed runtime entered historical audit')),/Exact reviewed current Stage/,'Reject runtime '+id+' '+name+' drift');}finally{values[index]=savedValue;}assert.equal(g.HONRO_PROJECT,saved);}
assert.throws(()=>withHistoricalStage18(g,()=>{throw Error('restore sentinel');}),/restore sentinel/);assert.equal(g.HONRO_PROJECT,saved);assert.equal(g.HONRO_CONTENT.stages[17],saved18);
// Keep using the actual new engine for the current16 compiled-battle contract.
const temple=JSON.parse(readFileSync('tests/fixtures/stage16-temple-buddha-art-delta.json','utf8')),current16=templeBattleContract(g,p),prior16=templeBattleContract(g,before);assert.deepEqual(current16,prior16);assert.equal(hash(current16),temple.battleContractSha256,'Current16 battle retains the original47-round contract');assert.equal(g.HONRO_PROJECT,saved);
const report={passed:true,checkpoint:f.checkpoint,sourceCommit:f.sourceCommit,unchangedMaps:28,unchangedAssets:540,addedAssets:f.addedAssets.length,projectNegativeControls:mutations.length+2,libraryNegativeControls:4,runtimeNegativeControls:runtimeMutations.length+8,beforeProjectSha256:f.beforeProjectSha256,afterProjectSha256:f.afterProjectSha256,beforeRuntimeSha256:f.runtime.beforeFingerprintSha256,afterRuntimeSha256:f.runtime.afterFingerprintSha256,currentStage16BattleSha256:hash(current16),scope:'Exact current->historical boundary only; no current18 gameplay/fullplay or browser claim.'};mkdirSync('_local/reports/stage18-bell/history',{recursive:true});writeFileSync('_local/reports/stage18-bell/history/exact-delta.json',JSON.stringify(report,null,2)+'\n');console.log('PASS Stage18/19 exact history:28 maps/540 old assets/globals preserved; current+historical/full+Act12/pure+idempotent; '+(report.projectNegativeControls+report.libraryNegativeControls+report.runtimeNegativeControls)+' mutation guards; exact runtime reversal and current16 compiled battle. '+f.checkpoint);
