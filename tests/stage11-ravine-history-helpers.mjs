import {beforeRavineCompletion,beforeRavineCompletionLibrary,beforeCompletionUnits,beforeCompletionContent,beforeCompletionBalance} from './stage11-ravine-completion-history-helpers.mjs';
import {beforeCurrentStage17Worksite,beforeStage17WorksiteBalance,withHistoricalStage17,historicalStage17Runtime} from './stage17-worksite-history-helpers.mjs';
import {beforeStage11RavineFinish,beforeStage11RavineFinishLibrary} from './stage11-ravine-finish-history-helpers.mjs';
/** Exact current-ravine -> immutable public Stage11 historical projection.
 * Current values are asserted before reversal; no stage, roster or gameplay
 * category is simply skipped. Unrelated maps and original art remain visible. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const stage11RavineBefore=JSON.parse(readFileSync(new URL('./fixtures/stage11-ravine-before.json',import.meta.url),'utf8'));
export const stage11RavineDelta=JSON.parse(readFileSync(new URL('./fixtures/stage11-ravine-history-delta.json',import.meta.url),'utf8'));
export const ravineHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));
function map11(project){const maps=project.stages.filter(s=>s.metadata?.stageId===11);assert.equal(maps.length,1,'Exact ravine delta needs one Stage11');assert.equal(maps[0].id,'stage-11');return maps[0];}
export function assertStage11RavineCurrent(project,{unrelated=true,library=true}={}){
 project=beforeStage11RavineFinish(beforeRavineCompletion(project));const st=map11(project);assert.equal(st.initialState?.honroRavineVersion,stage11RavineDelta.afterRavineVersion,'Exact ravine current marker');
 assert.equal(ravineHash(st),stage11RavineDelta.afterStageSha256,'Exact reviewed current Stage11 map');
 if(unrelated)for(const before of stage11RavineBefore.otherStages){const matches=project.stages.filter(s=>s.id===before.id);if(!matches.length)continue;assert.equal(matches.length,1,'No duplicate '+before.id);assert.equal(ravineHash(matches[0]),before.sha256,'Unchanged original map '+before.id);}
 if(library&&Array.isArray(project.library)){
  const additions=stage11RavineDelta.addedAssets,ids=new Set(additions.map(a=>a.id));
  for(const expected of additions){const matches=project.library.filter(a=>a.id===expected.id);assert.equal(matches.length,1,'Exact ravine asset '+expected.id);assert.deepEqual(plain(matches[0]),expected,'Exact ravine artwork '+expected.id);}
  const original=project.library.filter(a=>!ids.has(a.id)),scoped=original.length!==stage11RavineBefore.libraryIds.length,expectedIds=scoped?stage11RavineBefore.libraryIds.filter(id=>!id.startsWith('a3-')):stage11RavineBefore.libraryIds;
  assert.equal(ravineHash(original),scoped?stage11RavineDelta.beforeAct12LibrarySha256:stage11RavineBefore.librarySha256,'Original assets and order unchanged in exact full/Act12 scope');
  assert.deepEqual(plain(project.library.map(a=>a.id)),[...expectedIds,...additions.map(a=>a.id)],'Only exact additive ravine art in reviewed order');
 }
 return st;
}
export function beforeStage11RavineProject(project,{unrelated=false,library=true}={}){
 const out=beforeStage11RavineFinish(beforeRavineCompletion(project)),st=map11(out);
 if(!st.initialState?.honroRavineVersion){assert.equal(ravineHash(st),stage11RavineBefore.stageSha256,'Only the exact unchanged public Stage11 may omit the ravine marker');return out;}
 assertStage11RavineCurrent(out,{unrelated,library});
 for(const row of stage11RavineDelta.paths){
  const label='Exact ravine approved path '+row.path.join('/');let target=st;
  for(const key of row.path.slice(0,-1)){assert(target&&Object.hasOwn(target,key),label+' parent');target=target[key];}
  const key=row.path.at(-1);assert.equal(Object.hasOwn(target,key),row.hasAfter,label+' presence');
  if(row.hasAfter)assert.deepEqual(target[key],row.after,label+' after value');
  if(row.hasBefore)target[key]=plain(row.before);else delete target[key];
 }
 // Reversing additions/removals can change object insertion order; restore only
 // original key order after requiring exact values for every key.
 assert.deepEqual(st,stage11RavineBefore.stage,'Complete immutable Stage11 values after the bounded delta');
 out.stages[out.stages.findIndex(s=>s.id==='stage-11')]=plain(stage11RavineBefore.stage);
 if(library&&out.library){const ids=new Set(stage11RavineDelta.addedAssets.map(a=>a.id));out.library=out.library.filter(a=>!ids.has(a.id));}
 return out;
}
export function beforeStage11RavineUnitContracts(units){units=beforeCompletionUnits(units);assert.deepEqual(plain(units),stage11RavineDelta.unitContracts.after,'Exact reviewed new Stage11 roster/stats/cohorts');return plain(stage11RavineDelta.unitContracts.before);}
export function beforeStage11RavineContent(content){content=beforeCompletionContent(content);assert.deepEqual(plain(content),stage11RavineDelta.semanticContent.after,'Exact reviewed Stage11 content delta');return plain(stage11RavineDelta.semanticContent.before);}
export function beforeStage11RavineBalance(balance){const out=beforeCompletionBalance(beforeStage17WorksiteBalance(balance)),p=out.stages.find(s=>s.id===11);assert.deepEqual(p,stage11RavineDelta.balance.after,'Exact reviewed Stage11 planning delta');out.stages[out.stages.findIndex(s=>s.id===11)]=plain(stage11RavineBefore.balance);return out;}
export function withHistoricalStage11(g,fn){
 return withHistoricalStage17(g,()=>{
 const saved={project:g.HONRO_PROJECT,content:g.HONRO_CONTENT.stages[10],plan:g.HonroAct2Plan.stages[0],balance:g.HONRO_BALANCE.stages[10]};
 // A historical test must still validate the complete current replacement and
 // bounded deltas before it exercises the old immutable contracts.
 assertStage11RavineCurrent(saved.project);
 try{
  g.HONRO_PROJECT=beforeStage11RavineProject(saved.project);
  g.HONRO_CONTENT.stages[10]=plain(stage11RavineBefore.content);
  g.HonroAct2Plan.stages[0]=g.HONRO_CONTENT.stages[10].act2Plan;
  g.HONRO_BALANCE.stages[10]=plain(stage11RavineBefore.balance);
  return fn();
 }finally{
  g.HONRO_PROJECT=saved.project;g.HONRO_CONTENT.stages[10]=saved.content;
  g.HonroAct2Plan.stages[0]=saved.plan;g.HONRO_BALANCE.stages[10]=saved.balance;
 }
 });
}

export function beforeStage11RavineLibrary(library){
 const out=beforeStage11RavineFinishLibrary(beforeRavineCompletionLibrary(library)),assets=stage11RavineDelta.addedAssets,ids=new Set(assets.map(a=>a.id));
 if(!out.some(a=>ids.has(a.id)))return out;
 for(const asset of assets){const found=out.filter(a=>a.id===asset.id);assert.equal(found.length,1,'Exact ravine Library addition '+asset.id);assert.deepEqual(found[0],asset,'Exact ravine Library addition '+asset.id);}
 return out.filter(a=>!ids.has(a.id));
}
export function beforeCurrentStage11Ravine(project){
 project=beforeCurrentStage17Worksite(project);
 return project.stages?.some(s=>s.metadata?.stageId===11&&s.initialState?.honroRavineVersion)?beforeStage11RavineProject(project,{unrelated:false,library:!!project.library?.length}):structuredClone(project);
}
// Explicit setup for preserved old Stage11/17 and current unrelated chapters.
// Fresh ravine/worksite suites never call this historical runtime function.
export function historicalStage11Runtime(g){
 historicalStage17Runtime(g);
 assertStage11RavineCurrent(g.HONRO_PROJECT);
 g.HONRO_PROJECT=beforeStage11RavineProject(g.HONRO_PROJECT);
 g.HONRO_CONTENT.stages[10]=plain(stage11RavineBefore.content);
 g.HonroAct2Plan.stages[0]=g.HONRO_CONTENT.stages[10].act2Plan;
 g.HONRO_BALANCE.stages[10]=plain(stage11RavineBefore.balance);
 return g;
}
