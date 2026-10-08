// D is an exact flag layer above immutable C. Apply it once at a current-source
// boundary, never recursively inside the older A/B/C projections.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const openStructureHistoryDelta=JSON.parse(readFileSync(new URL('./fixtures/open-structure-history-delta.json',import.meta.url),'utf8'));
const plain=x=>JSON.parse(JSON.stringify(x));
export const openStructureHash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function unique(items,id,label){
 assert(Array.isArray(items),label+' collection');
 const matches=items.filter(v=>v?.id===id);
 assert.equal(matches.length,1,label+' unique named record');
 return matches[0];
}
function reverse(target,row){
 const label='Exact approved open structure delta '+row.kind+'/'+row.stage+'/'+row.id;
 assert.equal(target.oneWay,row.after.oneWay,label+' oneWay');
 target.oneWay=row.before.oneWay;
 if(row.before.properties){
  assert.deepEqual(Object.keys(target.properties||{}),row.propertyKeysAfter,label+' property keys');
  for(const key of Object.keys(row.before.properties))assert(!Object.hasOwn(target.properties,key),label+' removed '+key);
  const values={...target.properties,...row.before.properties};
  target.properties=Object.fromEntries(row.propertyKeysBefore.map(key=>[key,values[key]]));
 }
}
export function beforeOpenStructureLibrary(library){
 const out=plain(library);
 for(const row of openStructureHistoryDelta.rows.filter(r=>r.kind==='asset'))reverse(unique(out,row.id,'Exact approved open structure asset '+row.id),row);
 return out;
}
export function beforeOpenStructures(project){
 const out=plain(project);
 for(const row of openStructureHistoryDelta.rows){
  const label='Exact approved open structure delta '+row.kind+'/'+row.stage+'/'+row.id;
  const stages=out.stages.filter(s=>s.metadata?.stageId===row.stage);assert.equal(stages.length,1,label+' unique stage');
  const stage=stages[0];assert.equal(stage.id,'stage-'+row.stage,label+' canonical stage');
  if(row.kind==='asset'){
   const instance=unique(stage.elements,row.elementId,label+' instance');assert.equal(instance.assetId,row.id,label+' asset binding');
   reverse(unique(out.library,row.id,label),row);
  }else{assert.equal(row.kind,'terrain',label+' kind');reverse(unique(stage.terrains,row.id,label),row);}
 }
 return out;
}
