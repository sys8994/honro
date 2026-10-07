import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

export const caveBatRevision=JSON.parse(readFileSync(new URL('./fixtures/act2-cave-bat-delta.json',import.meta.url),'utf8'));

// Reconstruct only the explicitly reviewed cave species changes for historical
// whole-map hashes. All other authored data still has to match the old fixture.
export function beforeCaveBatRevision(project){
 for(const row of caveBatRevision.rows){
  const map=project.stages.find(s=>s.metadata.stageId===row.id);
  assert(map,'Reviewed cave roster stage '+row.id);
  for(const change of row.kinds){
   const unit=map.units.find(u=>u.id===change.id);
   assert(unit,'Reviewed cave unit '+change.id);
   assert.equal(unit.kind,change.after,'Exact reviewed bat kind '+change.id);
   unit.kind=change.before;
  }
 }
 return project;
}
