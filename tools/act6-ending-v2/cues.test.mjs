import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cueAt,cuts,names} from '../../shared/act6-ending-replan/cues.mjs';
test('Ending gives each line room and keeps credits and the final pause distinct',()=>{
 assert.equal(cuts.length,10);
 assert.deepEqual(names,['곽진','박문돌','이만복']);
 let start=0;
 for(const [index,cut] of cuts.entries()){
  let at=0;
  assert.equal(cut.beatEnds.at(-1),cut.duration);
  for(const [beat,end] of cut.beatEnds.entries()){
   assert(end-at>=6.5);
   const cue=cueAt((start+at)*1000);
   assert.equal(cue.index,index);assert.equal(cue.beat,beat);
   assert.equal(cue.beatSpan,end-at);
   assert.equal(cueAt((start+end)*1000-1).beat,beat);
   at=end;
  }
  start+=cut.duration;
 }
 assert(start>245);
 assert.deepEqual(cuts.slice(-2).map(c=>c.id),['still_08','final']);
 assert.equal(cueAt(start*1000),null);
 assert.deepEqual(cuts.at(-1).beatEnds,[6.5,24,31]);
});
