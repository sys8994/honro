import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {applyStage22BuriedBlend,isStage22BuriedPlane} from '../tools/environment/stage22-buried-blend.mjs';
import {applyStage22VerticalArt} from '../tools/environment/stage22-vertical-art.mjs';
import {distantRiver} from '../tools/environment/stage30-ferry-art.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const p=JSON.parse(await readFile(new URL('../shared/data/campaign.json',import.meta.url),'utf8')),original=structuredClone(p);
const s=original.stages.find(s=>s.metadata?.stageId===22),planes=s.design.space.terrainPlanes.filter(isStage22BuriedPlane);assert.equal(planes.length,2);
for(const q of planes){assert.deepEqual(q.buriedEdgeBlend,{side:140,bottom:260});delete q.buriedEdgeBlend;}
// Later Stage30 has one separately verified water asset. Normalize only its
// exact approved bytes for this historical Stage22 baseline comparison.
const baselineExpected=structuredClone(original),waterIndex=baselineExpected.library.findIndex(a=>a.id==='stage30:ferry-distant-channel');
if(hash(baselineExpected.library[waterIndex])==='62cab76995a647715f94429a9c9b5d5d317d8e303d5cd0e2f2f7fcfce2b5990e'){
 const s30=baselineExpected.stages.find(s=>s.metadata?.stageId===30);
 baselineExpected.library[waterIndex]=distantRiver({...s30,terrainBounds:{...s30.terrainBounds,bottom:7100}});
}
assert.equal(hash(baselineExpected),'5e86f718a80baff5bdda8dde55499f427f8fa572749e3b461826c02f52af3b91','Campaign baseline differs beyond two blend fields and exact approved Stage30 asset');
assert.equal(hash(applyStage22BuriedBlend(original)),hash(p));assert.equal(hash(applyStage22BuriedBlend(p)),hash(p));
const rebuilt=applyStage22VerticalArt(structuredClone(original));
assert.deepEqual(rebuilt.stages.find(s=>s.metadata?.stageId===22).design.space.terrainPlanes.filter(isStage22BuriedPlane),p.stages.find(s=>s.metadata?.stageId===22).design.space.terrainPlanes.filter(isStage22BuriedPlane));
console.log(JSON.stringify({campaignOnlyTwoMetadataFields:true,generatorParity:true,fullAuthorTwoPlanesParity:true,campaignHash:hash(p)}));
// Pure flat-color mask: opaque centre/top and transparent buried edges. Other
// planes and chapters never enter the new branch.
const vm=await import('node:vm'),{createCanvas}=await import('@napi-rs/canvas');
const runtime=await readFile(new URL('../shared/runtime/act2-spatial-art.js',import.meta.url),'utf8');
const helper=runtime.slice(runtime.indexOf('function stage22BuriedTile('),runtime.indexOf('function roundedPolygon('));
const g=vm.createContext({document:{createElement:()=>createCanvas(1,1)}});vm.runInContext(helper+';this.tile=stage22BuriedTile',g);
for(const q of p.stages.find(s=>s.metadata?.stageId===22).design.space.terrainPlanes.filter(isStage22BuriedPlane)){
 const t=g.tile(q,{honroStage:22}),c=t.canvas.getContext('2d'),W=t.canvas.width,H=t.canvas.height,alpha=(x,y)=>c.getImageData(x,y,1,1).data[3];
 assert.equal(alpha(Math.floor(W/2),10),255);assert.equal(alpha(Math.floor(W/2),Math.floor(H/2)),255);assert(alpha(0,10)<4);assert(alpha(W-1,10)<4);assert(alpha(Math.floor(W/2),H-1)<4);
 assert.equal(g.tile(q,{honroStage:21}),null);assert.equal(g.tile(q,{honroStage:22,honroCustom:true}),null);assert.equal(g.tile({...q,id:'unrelated'},{honroStage:22}),null);
}
console.log('PASS: Native opaque upper centre / side-bottom fade and stage-ID scope');
// Remove only the new helper/optional branch: prior runtime, including the
// Stage 14 refuge closure repair, must be byte-identical.
let oldRuntime=runtime.slice(0,runtime.indexOf('// Stage 22 buried foundations'))+runtime.slice(runtime.indexOf('function roundedPolygon('));
oldRuntime=oldRuntime.replace(',buriedTile:stage22BuriedTile(p,b)','').replace('for(const p of q.authoredPlanes){if(p.buriedTile){const t=p.buriedTile;c.drawImage(t.canvas,t.x,t.y,t.w,t.h);}else{c.fillStyle=p.fill;c.fill(p.path);}}','for(const p of q.authoredPlanes){c.fillStyle=p.fill;c.fill(p.path);}');
assert.equal(createHash('sha256').update(oldRuntime).digest('hex'),'5238f82fc52f21abd9ecae7b8336e17fc599f0fa071d7673042b2fb9d66e0c56');
console.log('PASS: unrelated runtime text and existing Stage 14 fix preserved');
