import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const expected={'floor-v4':'4a6394c62f3a78ece7de97e8ee61ba7dbd8743cfa79357d83cdeac910e88173d','cliff-v1':'efa050cce5f67de57f5c1495c9a099bf1c21d176f6f3312618f5cd8eda0c9763'};
for(const [part,sha]of Object.entries(expected)){
 const a=JSON.parse(readFileSync(`shared/data/act1/stage05-${part}-candidate.json`,'utf8'));assert.equal(createHash('sha256').update(JSON.stringify(a.vector)).digest('hex'),sha);assert.deepEqual(a.collision,[]);assert.deepEqual(a.bounds,a.reference.bounds);
 // exposedCliff is nested inside canonicalSolid; its unconstrained rectangle
 // is not an independently visible silhouette. Keep the effective clip guard.
 for(const key of ['canonicalSolid','contactInset'])for(const d of a.vector.clips[key]){assert(!/[^MLZ0-9eE+.,\s-]/.test(d));const n=d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g).map(Number);for(let i=0;i<n.length;i+=2){assert(n[i]>=a.bounds.x&&n[i]<=a.bounds.x+a.bounds.w);assert(n[i+1]>=a.bounds.y&&n[i+1]<=a.bounds.y+a.bounds.h);}}
}
console.log('Stage5 effective clip coverage, immutable vectors and non-collision contracts pass.');
