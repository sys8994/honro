import {beforeRavineCompletion} from './stage11-ravine-completion-history-helpers.mjs';
import {beforeStage11RavineFinish} from './stage11-ravine-finish-history-helpers.mjs';
/** Current Stage11 is an exact bounded layer above immutable public D. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertStage11RavineCurrent,beforeStage11RavineProject,stage11RavineBefore as before,stage11RavineDelta as delta,ravineHash as hash} from './stage11-ravine-history-helpers.mjs';
const p=beforeRavineCompletion(JSON.parse(readFileSync('shared/data/campaign.json','utf8'))),snapshot=JSON.stringify(p);
assertStage11RavineCurrent(p);assert.equal(hash(beforeStage11RavineFinish(p)),delta.afterProjectSha256,'Complete frozen first-ravine source after exact final-art reversal');
const prior=beforeStage11RavineProject(p,{unrelated:true});assert.equal(hash(prior),before.projectSha256,'Complete immutable D project restored, including all30 maps and all492 assets/order');
assert.equal(JSON.stringify(p),snapshot,'Projection leaves source untouched');
for(const row of delta.paths){
 const q=structuredClone(p);let target=q.stages[10];for(const key of row.path.slice(0,-1))target=target[key];const key=row.path.at(-1);
 if(row.hasAfter)target[key]=typeof target[key]==='number'?target[key]+.01:'unreviewed';else target[key]='unreviewed addition';
 assert.throws(()=>beforeStage11RavineProject(q),/Exact (?:reviewed current Stage11 map|ravine current marker)/,'Changed approved path remains rejected '+row.path.join('/'));
}
for(const mutate of [q=>q.stages[10].units[0].hp++,q=>q.stages[10].initialState.honroAct2Steps[3].rounds++,q=>q.stages[0].terrains[0].points[0].x++,q=>q.stages[11].units[0].x++,q=>q.library[0].name+=' drift',q=>q.library.reverse(),q=>q.library.push(structuredClone(q.library.at(-1))),q=>q.stages.push(structuredClone(q.stages[10]))]){
 const q=structuredClone(p);mutate(q);assert.throws(()=>assertStage11RavineCurrent(q),'Unapproved gameplay, another map, art, order or duplicate remains rejected');
}
for(const asset of delta.addedAssets){const q=structuredClone(p);q.library.find(a=>a.id===asset.id).name+=' drift';assert.throws(()=>beforeStage11RavineProject(q));}
console.log(`PASS exact Stage11 -> immutable D: ${delta.paths.length} reviewed paths, ${delta.addedAssets.length} additive assets, all29 unrelated maps/full project/order, mutation and purity guards`);
