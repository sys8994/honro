import './cavern-expansion-history.mjs';
import assert from 'node:assert/strict';
import {beforeCavernExpansion} from './cavern-expansion-history-helpers.mjs';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {beforeForestCavernTopology,forestCavernHistoryDelta as delta} from './forest-cavern-history-helpers.mjs';
const p=beforeCavernExpansion(JSON.parse(readFileSync('shared/data/campaign.json','utf8'))),snapshot=JSON.stringify(p),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const prior=beforeForestCavernTopology(p),targets=new Set(delta.hashes.map(r=>r.stage));
function frozen(project){const old=beforeForestCavernTopology(project);for(const row of delta.hashes)assert.equal(hash(old.stages.find(s=>s.metadata.stageId===row.stage)),row.beforeSha256,'Complete pre-authoring stage '+row.stage);return old;}
frozen(p);assert.equal(JSON.stringify(p),snapshot,'Pure projection leaves source untouched');
for(const row of delta.hashes)assert.equal(hash(p.stages.find(s=>s.metadata.stageId===row.stage)),row.afterSha256,'Exact reviewed authored source '+row.stage);
for(const st of p.stages)if(!targets.has(st.metadata.stageId))assert.deepEqual(prior.stages.find(s=>s.id===st.id),st,'Other stages remain intact');
assert.deepEqual(prior.library,p.library,'All shared artwork remains intact');
const lean={stages:p.stages,library:[]};
const locate=(project,row)=>{let target=project.stages.find(s=>s.metadata.stageId===row.stage);for(const step of row.path.slice(0,-1))target=typeof step==='object'?target.find(v=>Object.entries(step).every(([k,x])=>v[k]===x)):target[step];const last=row.path.at(-1);return {target,key:typeof last==='object'?target.findIndex(v=>Object.entries(last).every(([k,x])=>v[k]===x)):last};};
for(const row of delta.rows){
 const q=structuredClone(lean),{target,key}=locate(q,row);
 target[key]=typeof target[key]==='number'?target[key]+.01:'unapproved drift';
 assert.throws(()=>beforeForestCavernTopology(q),/Exact approved forest\/cavern delta/,'Reject changed approved path '+row.stage+'/'+JSON.stringify(row.path));
 const removed=structuredClone(lean),r=locate(removed,row);if(Array.isArray(r.target))r.target.splice(r.key,1);else delete r.target[r.key];
 assert.throws(()=>beforeForestCavernTopology(removed),/Exact approved forest\/cavern delta/,'Reject missing approved path');
}
const mutations=[
 ['stage7 old terrain shape',q=>q.stages[6].terrains.find(t=>t.id==='root-reentry').points[0].x++],
 ['stage7 terrain durability',q=>q.stages[6].terrains.find(t=>t.id==='tier-low').properties.hp++],
 ['stage7 NPC position',q=>q.stages[6].units.find(u=>u.id.startsWith('resident-')).x++],
 ['stage7 moved enemy health',q=>q.stages[6].units.find(u=>u.id==='foe-0').hp++],
 ['stage7 objective',q=>q.stages[6].objectives[0].description='unapproved'],
 ['stage7 marker position',q=>q.stages[6].markers[0].x++],
 ['stage15 floor geometry',q=>q.stages[14].terrains.find(t=>t.id==='act2-floor').points[0].y++],
 ['stage15 enemy cohort',q=>q.stages[14].units.find(u=>u.id==='a2-enemy-7').cohort='unapproved'],
 ['stage15 clue identity',q=>q.stages[14].initialState.honroCaveHangingClue.id='unapproved'],
 ['stage15 mission',q=>q.stages[14].initialState.honroAct2Steps[0].radius++],
 ['stage9 unrelated hall material',q=>q.stages[8].elements.find(e=>e.id==='a1-scene-9-east-hall').material='unapproved'],
 ['stage1 untouched old point',q=>q.stages[0].terrains[0].points[0].y++],
 ['unapproved extra branch',q=>q.stages[6].terrains.push({...structuredClone(q.stages[6].terrains.at(-1)),id:'fc7-unapproved'})]
];
for(const [name,mutate]of mutations){const q=structuredClone(lean);mutate(q);assert.throws(()=>frozen(q),undefined,'Frozen comparison rejects '+name);const projected=beforeForestCavernTopology(q);assert.notEqual(hash(projected.stages),hash(prior.stages),'Unapproved difference is never discarded: '+name);}
const duplicate=structuredClone(lean);duplicate.stages[6].terrains.push(structuredClone(duplicate.stages[6].terrains.find(t=>t.id==='fc7-west-watch')));assert.throws(()=>beforeForestCavernTopology(duplicate),/unique named record/);
assert.throws(()=>beforeForestCavernTopology(prior),/Exact approved forest\/cavern delta/,'A missing current revision cannot silently skip projection');
console.log(`PASS exact forest/cavern history: ${delta.rows.length} approved paths with value/removal negatives, ${mutations.length} unrelated-drift controls, 9 original full-stage hashes, purity and unchanged shared art; no old fixture rewrite`);
