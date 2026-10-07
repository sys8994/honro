// Historical geometry/story contracts retain their original fixtures. Verify
// this exact approved combat delta before reversing ONLY its changed fields.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const delta=JSON.parse(await readFile(new URL('./fixtures/existence-approved-delta.json',import.meta.url),'utf8'));
const plain=v=>JSON.parse(JSON.stringify(v));
export function beforeExistenceRoster(project){
 const p=plain(project);
 for(const {stage,id,fields} of delta.unitDeltas){
  const st=p.stages.find(s=>s.metadata?.stageId===stage);if(!st)continue;
  const u=st.units.find(u=>u.id===id);assert(u,`Reviewed roster unit ${stage}/${id}`);
  for(const [key,change] of Object.entries(fields)){
   assert.deepEqual(u[key]??null,change.after,`Unreviewed roster change ${stage}/${id}.${key}`);
   if(change.before===null)delete u[key];else u[key]=plain(change.before);
  }
 }
 return p;
}
export function beforeExistenceProfiles(skills){
 const copy=plain(skills);
 for(const {id,before,after} of delta.profiles){
  assert.deepEqual(copy[id].existenceAttack??null,after,`Unreviewed attack ratio ${id}`);
  if(before===null)delete copy[id].existenceAttack;else copy[id].existenceAttack=plain(before);
 }
 return copy;
}
