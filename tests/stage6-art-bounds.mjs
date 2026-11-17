import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runtimeEntries} from '../shared/build.mjs';

// Inspect the final production author chain, not the superseded traced asset.
// Baselines were captured before the registration-only edit. The full Stage6
// contract includes terrain, units, objectives, events, camera and placements.
const project=(await runtimeEntries({vector:false,render:false,productionStory:true})).find(p=>p.project).project;
const stage=project.stages.find(s=>s.metadata?.stageId===6);
const asset=project.library.find(a=>a.id==='stage06-prototype:continuous-body-v1');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
assert(stage&&asset);
assert(stage.elements.some(e=>e.assetId===asset.id));
assert(!stage.elements.some(e=>e.id==='act1-stage06-traced-body'));
assert.equal(hash(stage),'538bdd2ff5f3e6ce5234c5ef8a0841850c4b448c2578d3ac3afae7b961689c64');
assert.equal(hash(asset.vector),'fe6f15ea32b3ba6e1550d6c49d3dcad4d2b615fc76baa86b5e62b025a61a3136');
assert.deepEqual(asset.vector.viewBox,[-4000,1500,14600,5500]);
assert.deepEqual(asset.collision,[]);
assert.deepEqual(asset.bounds,{x:-6000,y:1500,w:18600,h:26300});
assert.deepEqual(asset.reference.bounds,asset.bounds);
for(const d of asset.vector.clips.road){
 assert(!/[^MLZ0-9eE+.,\s-]/.test(d));
 const ns=d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g).map(Number),b=asset.bounds;
 for(let i=0;i<ns.length;i+=2){assert(ns[i]>=b.x&&ns[i]<=b.x+b.w);assert(ns[i+1]>=b.y&&ns[i+1]<=b.y+b.h);}
}
const zoom=390/6800,rs=2**(Math.floor(Math.log2(zoom*1.25)*4)/4),tileTop=512/rs;
assert.equal(tileTop,8192);
assert(7000+40<tileTop);
assert(asset.bounds.y+asset.bounds.h>=tileTop);
console.log('Stage6 final production bounds cover the authored road; vector, viewBox, collision and full stage contract remain unchanged.');
