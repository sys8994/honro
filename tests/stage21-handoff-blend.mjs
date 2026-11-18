/** Composition-only contract: no new art, bounds, contact or collision. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {applyStage21HandoffBlend} from '../tools/environment/stage21-handoff-blend.mjs';
const hash=a=>createHash('sha256').update(JSON.stringify(a)).digest('hex');
const a=JSON.parse(await readFile(new URL('../shared/assets/environment/act3-handoff/stage21-bedrock.json',import.meta.url),'utf8'));
assert.equal(a.params.blendFace,true);
assert.deepEqual(a.params.edgeFade,[[0,170],[6150,6400]]);
const original=structuredClone(a);delete original.params.blendFace;delete original.params.edgeFade;
assert.equal(hash(original),'49ad5b99a99d2808cac52f01f2879efe5029b69b67b7b36031eba662a765654a');
assert.equal(hash(a.vector),'1032fff44fd58103cb91b730d1d0cfd2e5c976033ba1657411653f0c681fd8cd');
assert.deepEqual(applyStage21HandoffBlend(original),a);
assert.deepEqual(applyStage21HandoffBlend(a),a);
assert.throws(()=>applyStage21HandoffBlend({...a,id:'act3-handoff:22:lower-court'}));
console.log(JSON.stringify({stage:21,paramsOnly:true,sourceVectorPreserved:true,generatorParity:true,idempotent:true,originalHash:hash(original),candidateHash:hash(a),vectorHash:hash(a.vector)}));
// A gradient transformed by shear has covector (inverse matrix row 2),
// not the direction obtained by transforming two vertical endpoints.
for(const [u0,v0,x0,y0]of a.params.contactMapping.slice(0,-1)){
 const i=a.params.contactMapping.findIndex(p=>p[0]===u0),[u1,v1,x1,y1]=a.params.contactMapping[i+1];
 const A=(x1-x0)/(u1-u0),B=(y1-y0-(v1-v0)*2.65)/(u1-u0),D=2.65;
 for(const density of [.72,1.15]){
  const m={a:A*density,b:B*density,c:0,d:D*density,e:(x0-A*u0)*density,f:(y0-B*u0-v0*D)*density};
  const det=m.a*m.d-m.b*m.c,qx=-m.b/det,qy=m.a/det,n=qx*qx+qy*qy;
  const px=m.e,py=m.d*617+m.f,dx=31*qx/n,dy=31*qy/n;
  for(const u of [u0,(u0+u1)/2,u1])for(const v of [v0,617,625,648,650]){
   const x=m.a*u+m.c*v+m.e,y=m.b*u+m.d*v+m.f;
   const t=((x-px)*dx+(y-py)*dy)/(dx*dx+dy*dy);
   assert(Math.abs(t-(v-617)/31)<1e-10,'Affine source-y gradient invariant');
  }
 }
}
console.log('PASS: source-y gradient covector, all 16 contact strips × 2 densities × 15 source probes');
// Execute old/new tile compositors for all nine other handoff chapters. Their
// branch and resulting pixels must be unchanged (including existing defects).
const {createCanvas,Path2D,DOMMatrix}=await import('@napi-rs/canvas');
const vm=await import('node:vm');
const runtime=await readFile(new URL('../shared/runtime/act3-handoff-art.js',import.meta.url),'utf8');
const start=runtime.indexOf(' // Stage 21: resolve'),end=runtime.indexOf(" ctx.globalCompositeOperation='destination-in';\n const fade=",start);
assert(start>=0&&end>start);
const legacy=runtime.slice(0,start)+runtime.slice(end);
assert.equal(createHash('sha256').update(legacy).digest('hex'),'65f7ddb49092c782f1176c10c3c7e566396b60b92ee6ebee8ab25a8781deafda');
const vectorRuntime=await readFile(new URL('../shared/map/vector-art.js',import.meta.url),'utf8');
function compositor(text){const g=vm.createContext({Path2D,DOMMatrix,document:{createElement:()=>createCanvas(1,1)}});g.G=g;g.paths=new WeakMap();vm.runInContext(vectorRuntime,g);vm.runInContext(text.slice(text.indexOf('function strips('),text.indexOf('\nS.landmark='))+'\nG.test={strips,faceTile};',g);return g.test;}
const old=compositor(legacy),updated=compositor(runtime);
for(const [id,piece]of [[22,'lower-court'],[23,'quay-west'],[24,'garden-foundation'],[25,'entry-masonry'],[26,'kiln-foundation'],[27,'west-quay-masonry'],[28,'office-foundation'],[29,'west-bank'],[30,'granite-cape']]){
 const asset=JSON.parse(await readFile(new URL(`../shared/assets/environment/act3-handoff/stage${id}-${piece}.json`,import.meta.url),'utf8'));
 for(const density of [.72,1.15]){
  const x=old.faceTile(asset,old.strips(asset)[0],density),y=updated.faceTile(asset,updated.strips(asset)[0],density);
  assert.equal(x.top,y.top);assert.equal(x.height,y.height);
  assert.deepEqual(x.canvas.getContext('2d').getImageData(0,0,x.canvas.width,x.canvas.height).data,y.canvas.getContext('2d').getImageData(0,0,y.canvas.width,y.canvas.height).data);
 }
}
console.log('PASS: other nine chapters, first contact tile × two densities, byte-identical Native RGBA');
