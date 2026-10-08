// Immutable, path-by-path reversal of the reviewed forest/cavern authoring.
// Call before older scene/roster/objective projections. No entire stage or
// gameplay category is omitted; unchanged fields remain visible to old hashes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
export const forestCavernHistoryDelta=JSON.parse(readFileSync(new URL('./fixtures/forest-cavern-history-delta.json',import.meta.url),'utf8'));
const selector=key=>key!==null&&typeof key==='object';
const label=row=>`Exact approved forest/cavern delta ${row.stage}/${row.path.map(k=>selector(k)?JSON.stringify(k):k).join('/')}`;
function keyAt(target,key,message){
 if(!selector(key))return key;
 assert(Array.isArray(target),message+' named collection');
 const entries=Object.entries(key);assert.equal(entries.length,1,message+' one selector');
 const [[field,value]]=entries,indexes=target.flatMap((v,i)=>v?.[field]===value?[i]:[]);
 assert.equal(indexes.length,1,message+' unique named record');return indexes[0];
}
export function beforeForestCavernTopology(project,{stages=forestCavernHistoryDelta.hashes.map(r=>r.stage)}={}){
 const out=structuredClone(project);
 for(const row of forestCavernHistoryDelta.rows){
  if(!stages.includes(row.stage))continue;
  const message=label(row),maps=out.stages.filter(s=>s.metadata?.stageId===row.stage);
  assert.equal(maps.length,1,message+' unique canonical stage');let target=maps[0];
  for(const step of row.path.slice(0,-1)){const key=keyAt(target,step,message);assert(target!==null&&typeof target==='object'&&Object.hasOwn(target,key),message+' parent exists');target=target[key];}
  const last=row.path.at(-1),key=keyAt(target,last,message);
  assert.equal(Object.hasOwn(target,key),row.hasAfter,message+' field presence');
  if(row.hasAfter)assert.deepEqual(target[key],row.after,message+' current value');
  if(row.hasBefore)target[key]=structuredClone(row.before);
  else if(selector(last))target.splice(key,1);
  else delete target[key];
 }
 return out;
}
