import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {beforeGuardianScene,guardianSceneDelta} from './guardian-scene-history-helpers.mjs';
const project=JSON.parse(readFileSync('shared/data/campaign.json','utf8')),snapshot=JSON.stringify(project),prior=beforeGuardianScene(project);
assert.equal(JSON.stringify(project),snapshot,'Historical projection does not mutate current maps');
{const p=structuredClone(project);p.library.find(a=>a.id===guardianSceneDelta.addedAsset.id).name+=' drift';assert.throws(()=>beforeGuardianScene(p),/Exact approved guardian asset/);}
for(const row of guardianSceneDelta.rows){
 const p=structuredClone(project);let target=p.stages.find(s=>s.metadata.stageId===row.stage);
 for(const key of row.path.slice(0,-1))target=target[key];
 const key=row.path.at(-1);target[key]=typeof target[key]==='number'?target[key]+.01:'unapproved';
 assert.throws(()=>beforeGuardianScene(p),/Exact approved guardian scene/,'Reject drift at '+row.path.join('/'));
}
for(const id of ['altar-step-1','altar-step-2','altar-step-3','altar-platform']){
 const p=structuredClone(project);p.stages[9].terrains.find(t=>t.id===id).points[0].x++;
 assert.throws(()=>beforeGuardianScene(p),/only exact guardian bough geometry/);
}
for(const id of [9,10]){
 const p=structuredClone(project),m=p.stages[id-1];m.units[0].x+=19;m.units[0].stageOverrides={...m.units[0].stageOverrides,hp:17};
 const q=beforeGuardianScene(p).stages[id-1];assert.equal(q.units[0].x,m.units[0].x);assert.equal(q.units[0].stageOverrides.hp,17,'Unapproved gameplay changes stay visible to frozen parent comparison');
}
for(let i=0;i<30;i++)if(i!==8&&i!==9)assert.deepEqual(prior.stages[i],project.stages[i],'Unrelated maps are untouched');
console.log('PASS Exact guardian scene delta: 15 scene paths, four branches, no mutation, unrelated maps and gameplay remain visible');
