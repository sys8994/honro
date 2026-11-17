import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
// Registration-only regression. Immutable approved paths, fills and clips must not change.
const expected={body:'207b2b642024ca77f12dd8cbb3351891388e59e7ac30b35cde63711d526e7565',rear:'9adb17e67fc68a00a42ca00951ea6073d120a2b35f722882bfe6ec72b85e1856'};
for(const part of ['body','rear']){
 const a=JSON.parse(readFileSync(`shared/data/act1/stage02-${part}-candidate.json`,'utf8'));
 assert.equal(createHash('sha256').update(JSON.stringify(a.vector)).digest('hex'),expected[part]);
 assert.deepEqual(a.collision,[]);assert.deepEqual(a.bounds,a.reference.bounds);
 const box=a.bounds, paths=a.vector.clips[part==='body'?'extendedSolid':'canonicalRear'];
 for(const d of paths){assert(!/[^MLZ0-9eE+.,\s-]/.test(d));const n=d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g).map(Number);for(let i=0;i<n.length;i+=2){assert(n[i]>=box.x&&n[i]<=box.x+box.w);assert(n[i+1]>=box.y&&n[i+1]<=box.y+box.h);}}
 // The first tile rejected by the prior 4500-height registration contains opaque art.
 const width=1331,zoom=width/6800,rs=2**(Math.floor(Math.log2(zoom*1.25)*4)/4),tileTop=2*512/rs;
 assert(4500+40<tileTop);assert(box.y+box.h+40>=tileTop);
}
console.log('Stage2 art bounds cover authored clips; vector hashes and non-collision contract unchanged.');
