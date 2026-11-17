import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const a=JSON.parse(readFileSync('shared/data/act1/stage04-body-candidate.json','utf8'));
assert.equal(createHash('sha256').update(JSON.stringify(a.vector)).digest('hex'),'3b3cfea474ec64e5b1c9b1531ea24a8f91cb6904b1be89fc9f86e79fa355ac1c');
assert.deepEqual(a.collision,[]);assert.deepEqual(a.bounds,a.reference.bounds);
for(const paths of Object.values(a.vector.clips))for(const d of paths){assert(!/[^MLZ0-9eE+.,\s-]/.test(d));const n=d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g).map(Number);for(let i=0;i<n.length;i+=2){assert(n[i]>=a.bounds.x&&n[i]<=a.bounds.x+a.bounds.w);assert(n[i+1]>=a.bounds.y&&n[i+1]<=a.bounds.y+a.bounds.h);}}
const zoom=390/6800,rs=2**(Math.floor(Math.log2(zoom*1.25)*4)/4),firstExcluded=512/rs;
assert.equal(firstExcluded,8192);assert(6000+40<firstExcluded);assert(a.bounds.y+a.bounds.h>=firstExcluded);
console.log('Stage4 authored clip coverage and immutable vector/collision contracts pass.');
