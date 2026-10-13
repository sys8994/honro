/** A reviewable exact line edit, never an automatic hash acceptance. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function assertExactFollowupDelta(current,change){
 assert.equal(hash(current),change.sha256,'Approved current file '+change.path);
 assert(change.exactEdits.length,'Explicit source changes required');
 const lines=current.split('\n');let last=Infinity;
 for(const edit of [...change.exactEdits].reverse()){
  assert(Number.isInteger(edit.beforeLine)&&edit.beforeLine>=0);assert(Number.isInteger(edit.afterLine)&&edit.afterLine>=0);
  assert(edit.afterLine+edit.after.length<=last,'Nonoverlapping ordered edits');last=edit.afterLine;
  assert.deepEqual(lines.slice(edit.afterLine,edit.afterLine+edit.after.length),edit.after,'Exact reviewed postimage');
  lines.splice(edit.afterLine,edit.after.length,...edit.before);
 }
 const previous=lines.join('\n');assert.equal(hash(previous),change.previousSha256,'Reconstruct the entire prior approved source');
 for(const edit of [...change.exactEdits].reverse()){
  assert.deepEqual(lines.slice(edit.beforeLine,edit.beforeLine+edit.before.length),edit.before,'Exact reviewed preimage');
  lines.splice(edit.beforeLine,edit.before.length,...edit.after);
 }
 assert.equal(lines.join('\n'),current,'Exact delta is reversible without dropping unrelated bytes');
 return previous;
}
