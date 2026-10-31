/** Exact byte equality without constructing a potentially enormous assertion diff. */
import assert from 'node:assert/strict';
export function assertExactBytes(actual,expected,label){
 assert.equal(actual.length,expected.length,`${label}: byte length differs`);
 if(actual.equals(expected))return;
 let first=-1,different=0,maxDelta=0;
 for(let i=0;i<actual.length;i++){const delta=Math.abs(actual[i]-expected[i]);if(delta){if(first<0)first=i;different++;if(delta>maxDelta)maxDelta=delta;}}
 assert.fail(`${label}: ${different}/${actual.length} bytes differ; first index ${first} (actual ${actual[first]}, expected ${expected[first]}), max delta ${maxDelta}`);
}
