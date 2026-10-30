import assert from'node:assert/strict';import{sampleSupport}from'./support-visibility-sampling.mjs';
const full=sampleSupport([[0,0],[100,0]],()=>true);assert.equal(full.keptLength,100);assert.deepEqual(full.parts,[[[0,0],[100,0]]]);
const gap=sampleSupport([[0,0],[100,0]],x=>x<40||x>60);assert.equal(gap.keptLength,80);assert.equal(gap.parts.length,2);assert.equal(gap.transitions,2);
const split=sampleSupport([[0,0],[20,0],[100,0]],x=>x<40||x>60);assert.deepEqual(split.parts,gap.parts);assert.equal(split.keptLength,gap.keptLength);
const empty=sampleSupport([[0,0],[100,0]],()=>false);assert.equal(empty.keptLength,0);assert.equal(empty.parts.length,0);
console.log('PASS deterministic full/gap/empty/subdivision mask fixtures; not an Engine or visual pass');
