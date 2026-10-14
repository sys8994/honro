/** Exact, reversible review data. This does not normalize arbitrary new content
 * and never supplies a historical fingerprint to current gameplay execution. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const storyDeltaHash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
function parentAt(value,path){
 let at=value;
 for(const key of path){assert(at&&typeof at==='object'&&own(at,key),'Exact delta path '+JSON.stringify(path));at=at[key];}
 return at;
}

/** JSON leaf replacements/additions and exact ordered array spans. Every input
 * and output is pinned in full; unrelated HP, geometry, prose or order survives
 * the inverse and therefore cannot be hidden behind a new acceptance hash. */
export function applyExactStoryJsonDelta(input,proof,{reverse=false}={}){
 const from=reverse?'after':'before',to=reverse?'before':'after';
 assert.equal(storyDeltaHash(input),proof[from+'Sha256'],'Exact '+from+' JSON identity');
 const spans=new Map();
 for(const change of proof.changes.filter(change=>change.kind==='splice')){
  const key=JSON.stringify(change.path),prior=spans.get(key)||{shift:0,end:0};
  assert(Number.isInteger(change.beforeIndex)&&change.beforeIndex>=prior.end,'Ordered nonoverlapping original array spans');
  assert.equal(change.afterIndex,change.beforeIndex+prior.shift,'Exact original/postimage array coordinates');
  spans.set(key,{shift:prior.shift+change.after.length-change.before.length,end:change.beforeIndex+change.before.length});
 }
 const output=structuredClone(input),changes=reverse?[...proof.changes].reverse():proof.changes;
 for(const change of changes){
  assert(Array.isArray(change.path)&&change.path.length,'Explicit JSON path');
  if(change.kind==='splice'){
   // Forward spans run left to right after earlier insertions; reverse spans
   // run right to left. Both therefore use the reviewed postimage coordinate.
   const values=parentAt(output,change.path),index=change.afterIndex;
   assert(Array.isArray(values));assert(Number.isInteger(index)&&index>=0);
   assert.deepEqual(values.slice(index,index+change[from].length),change[from],'Exact reviewed array span');
   values.splice(index,change[from].length,...structuredClone(change[to]));
  }else{
   assert.equal(change.kind,'field');
   const parent=parentAt(output,change.path.slice(0,-1)),key=change.path.at(-1);
   assert.equal(own(parent,key),change[from+'Present'],'Exact reviewed field presence');
   if(change[from+'Present'])assert.deepEqual(parent[key],change[from],'Exact reviewed field value');
   if(own(change,from+'KeyIndex')&&change[from+'Present'])assert.equal(Object.keys(parent).indexOf(String(key)),change[from+'KeyIndex'],'Exact field insertion order');
   if(change[to+'Present']){
    if(!change[from+'Present']){
     const index=change[to+'KeyIndex'],entries=Object.entries(parent);
     assert(Number.isInteger(index)&&index>=0&&index<=entries.length,'Reviewed new field position');
     entries.splice(index,0,[key,structuredClone(change[to])]);
     for(const existing of Object.keys(parent))delete parent[existing];
     Object.assign(parent,Object.fromEntries(entries));
    }else parent[key]=structuredClone(change[to]);
   }else delete parent[key];
  }
 }
 assert.equal(storyDeltaHash(output),proof[to+'Sha256'],'Reconstruct the complete '+to+' JSON identity');
 return output;
}

/** A scoped campaign is still validated stage by stage. Unchanged stages are
 * checked by the existing manifest; changed stages must reverse exactly. */
export function reverseExactStoryStages(project,rows,{variant='raw'}={}){
 assert(['raw','runtime','project'].includes(variant));
 const output=structuredClone(project);
 for(const row of rows.filter(row=>row.variant===variant)){
  const index=output.stages.findIndex(stage=>stage.metadata?.stageId===row.stageId);
  if(index<0)continue;
  output.stages[index]=applyExactStoryJsonDelta(output.stages[index],row,{reverse:true});
 }
 return output;
}

export function assertExactStoryJsonNegatives(input,proof){
 const output=applyExactStoryJsonDelta(input,proof),reverse=applyExactStoryJsonDelta(output,proof,{reverse:true});
 assert.deepEqual(reverse,input,'Exact JSON delta roundtrip');let count=0;
 for(const mutate of [p=>p.changes.pop(),p=>p.beforeSha256='0'.repeat(64),p=>p.afterSha256='0'.repeat(64),p=>p.changes[0].path.push('unapproved')]){
  const changed=structuredClone(proof);mutate(changed);assert.throws(()=>applyExactStoryJsonDelta(input,changed));count++;
 }
 for(const [kind,key]of [['splice','beforeIndex'],['field','afterKeyIndex']]){
  const at=proof.changes.findIndex(change=>change.kind===kind&&Number.isInteger(change[key]));
  if(at>=0){const changed=structuredClone(proof);changed.changes[at][key]++;assert.throws(()=>applyExactStoryJsonDelta(input,changed));count++;}
 }
 // Even repinning an unrelated mutation's input must fail the immutable output.
 const changed=structuredClone(output);changed.__unreviewed=true;
 assert.throws(()=>applyExactStoryJsonDelta(changed,{...proof,afterSha256:storyDeltaHash(changed)},{reverse:true}));
 return count+1;
}
