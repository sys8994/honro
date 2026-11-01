import assert from 'node:assert/strict';
import {createManifest,resolveManifest,payloadSha256} from '../tools/stage31/package-manifest.mjs';
const world={stages:[{id:'stage-31',metadata:{stageId:31},elements:[{assetId:'rock'}]},
 {id:'stage-3',metadata:{stageId:3}}],library:[{id:'rock',vector:{path:'M 1 2'}},{id:'other'}],
 production:{version:1,cards:{'stage-31':{intent:'test only',referenceStages:['stage-3']}},reviews:{'stage-31':[]},probeResults:{'stage-31':[]}}};
const m=createManifest(world),p=resolveManifest(m,world);
assert.equal(payloadSha256(p),payloadSha256(world));
assert.equal(p.library,world.library);assert.equal(p.stages,world.stages);
assert.deepEqual(p.production,world.production);
assert(!('library' in m));assert(!('stages' in m));
assert.equal(m.production.reviews['stage-31'].length,0); // no fabricated pass
for(const mutate of [w=>w.stages[0].elements[0].x=2,w=>w.library[0].vector.path='M 9 9']){
 const altered=structuredClone(world);mutate(altered);assert.throws(()=>resolveManifest(m,altered),/does not match/);
}
assert.throws(()=>resolveManifest({...m,stageId:'stage-32'},world),/does not match/);
assert.throws(()=>resolveManifest({...m,production:{}},world),/card is missing/);
assert.equal(resolveManifest(world,world),world);
console.log('Stage31 metadata-only evidence: identity, unchanged gates, no duplicated assets passed');
