import {beforeCurrentStage11Ravine} from './stage11-ravine-history-helpers.mjs';
import {beforeVerticalWaterworksLibrary} from './vertical-waterworks-history-helpers.mjs';
import {beforeOpenStructureLibrary} from './open-structure-history-helpers.mjs';
import './cavern-library-provenance.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {beforeCavernExpansion,cavernExpansionHistoryDelta as delta} from './cavern-expansion-history-helpers.mjs';
const p=beforeCurrentStage11Ravine(JSON.parse(readFileSync('shared/data/campaign.json','utf8'))),snapshot=JSON.stringify(p),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
function frozen(project){const old=beforeCavernExpansion(project);for(const row of delta.hashes)assert.equal(hash(old.stages.find(s=>s.metadata.stageId===row.stage)),row.beforeSha256,'Complete approved A stage '+row.stage);return old;}
const prior=frozen(p),targets=new Set(delta.hashes.map(r=>r.stage));
assert.deepEqual([...targets],[11,12,13,14,15,16,17,18,19]);
assert.equal(JSON.stringify(p),snapshot,'Projection never mutates production input');
for(const row of delta.hashes)assert.equal(hash(p.stages.find(s=>s.metadata.stageId===row.stage)),row.afterSha256,'Exact reviewed B stage '+row.stage);
for(const st of p.stages)if(!targets.has(st.metadata.stageId))assert.deepEqual(prior.stages.find(s=>s.id===st.id),st,'Unchanged stages including stage20 remain intact');
assert.deepEqual(prior.library,p.library,'Shared artwork is never projected');assert.equal(hash(beforeVerticalWaterworksLibrary(beforeOpenStructureLibrary(p.library))),delta.librarySha256,'Library equals approved public A after exact D/C reversal');
const lean={stages:p.stages,library:[]};
const locate=(project,row)=>{let target=project.stages.find(s=>s.metadata.stageId===row.stage);for(const step of row.path.slice(0,-1))target=typeof step==='object'?target.find(v=>Object.entries(step).every(([k,x])=>v[k]===x)):target[step];const last=row.path.at(-1);return {target,key:typeof last==='object'?target.findIndex(v=>Object.entries(last).every(([k,x])=>v[k]===x)):last};};
for(const row of delta.rows){
 // The later Stage12/16/17/18/19 exact historical-map hashes reject drift before the
 // older path selector. Retain that strict boundary for each named stage only.
 const rejection=row.stage===12?/Exact approved cavern expansion delta|Only an exact historical or reviewed current stage-12 may cross the quarry boundary/:row.stage===16?/Exact approved cavern expansion delta|Only the exact unchanged historical Stage16 may omit the temple marker/:row.stage===17?/Exact approved cavern expansion delta|Only the exact unchanged historical Stage17 may omit the worksite marker/:row.stage===18?/Exact approved cavern expansion delta|Only an exact historical or reviewed current stage-18 may cross the bell boundary/:row.stage===19?/Exact approved cavern expansion delta|Only an exact historical or reviewed current stage-19 may cross the bell boundary/:/Exact approved cavern expansion delta/;
 const q=structuredClone(lean),{target,key}=locate(q,row);target[key]=typeof target[key]==='number'?target[key]+.01:'unapproved drift';
 assert.throws(()=>beforeCavernExpansion(q),rejection,'Reject changed approved path '+row.stage+'/'+JSON.stringify(row.path));
 const removed=structuredClone(lean),r=locate(removed,row);if(Array.isArray(r.target))r.target.splice(r.key,1);else delete r.target[r.key];
 assert.throws(()=>beforeCavernExpansion(removed),rejection,'Reject missing approved path');
}
const mutations=[
 ['enemy HP',q=>q.stages[13].units[0].hp++],
 ['mission radius',q=>q.stages[13].initialState.honroAct2Steps.at(-1).radius=123],
 ['marker position',q=>q.stages[13].markers[0].x++],
 ['stage15 floor',q=>q.stages[14].terrains.find(t=>t.id==='act2-floor').points[0].y++],
 ['stage11 name',q=>q.stages[10].name+=' drift'],
 ['extra terrain',q=>q.stages[15].terrains.push({...structuredClone(q.stages[15].terrains[0]),id:'unapproved-terrain'})]
];
for(const [name,mutate]of mutations){const q=structuredClone(lean);mutate(q);assert.throws(()=>frozen(q),undefined,'Reject unapproved '+name);}
const named=delta.rows.find(r=>r.path.some(k=>typeof k==='object')&&r.hasAfter&&!r.hasBefore),duplicate=structuredClone(lean),{target,key}=locate(duplicate,named);target.push(structuredClone(target[key]));assert.throws(()=>beforeCavernExpansion(duplicate),/unique named record/);
assert.throws(()=>beforeCavernExpansion(prior),/Exact approved cavern expansion delta|Only an exact historical or reviewed current stage-12 may cross the quarry boundary|Only the exact unchanged historical Stage(?:16 may omit the temple|17 may omit the worksite) marker|Only an exact historical or reviewed current stage-(?:18|19) may cross the bell boundary/,'Cannot silently reproject A');
console.log(`PASS B→approved A history: ${delta.rows.length} exact paths and value/removal negatives; nine immutable full-stage hashes; ${mutations.length} unrelated mutation controls; duplicate rejection, purity, unchanged stages and Library`);
