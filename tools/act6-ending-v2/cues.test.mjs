import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cueAt,cuts,names} from '../../shared/act6-ending-replan/cues.mjs';
test('Act 6 ending: nine stills, with longer beats for the denser passages',()=>{
  assert.equal(cuts.length,9);
  assert.equal(cuts.reduce((sum,c)=>sum+c.duration,0),200);
  assert.deepEqual(names,['곽진','박문돌','이만복']);
  const starts=[0,21,42,66,87,112,127,143,165];
  for(const [i,at] of starts.entries()){
    assert.equal(cueAt(at*1000).index,i);
    assert.equal(cueAt(at*1000).beat,0);
    if(i>0)assert.equal(cueAt(at*1000-1).index,i-1);
  }
  assert.equal(cueAt(132000).beat,1);
  assert.equal(cueAt(137000).beat,2);
  assert(Math.abs(cueAt(137000).beatSpan-6.2)<1e-9);
  assert.deepEqual([164999,165000,178999,179000,193999,194000,199999].map(x=>[cueAt(x).index,cueAt(x).beat]),[[7,3],[8,0],[8,0],[8,1],[8,1],[8,2],[8,2]]);
  for(let t=0;t<200000;t+=17){const c=cueAt(t);assert(c.beatSpan>0&&c.beat>=0);assert(c.time>=c.beatStart&&c.time<c.beatStart+c.beatSpan);}
  assert.equal(cueAt(200000),null);
});
