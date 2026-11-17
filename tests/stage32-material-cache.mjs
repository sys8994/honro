import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {readWorldSource} from '../tools/act4-source/world-source.mjs';
import {applyAct4HandoffArt} from '../shared/act4-handoff-art.mjs';
const {bytes}=await readWorldSource(),project=await applyAct4HandoffArt(JSON.parse(bytes),{stages:[32]});
const field=project.library.find(a=>a.id==='act4-handoff:32:foundation'),body=project.library.find(a=>a.id==='act4-handoff:32:body-shared-material');
let allocations=0,style='fixture-a';
const g=vm.createContext({Path2D,HONRO_PROJECT:project,HonroVisualStyle:{key:()=>style},document:{createElement:()=>{allocations++;return createCanvas(1,1);}}});
vm.runInContext(await readFile(new URL('../shared/runtime/stage32-foundation-art.js',import.meta.url),'utf8'),g);
const api=g.HonroStage32FoundationArt,cv=createCanvas(320,240),c=cv.getContext('2d'),b={honroStage:32},bBefore=JSON.stringify(b);
const fl={asset:field,x:-5500,y:-1950,scale:1,rotation:0,opacity:1},bl={asset:body,x:0,y:0,scale:1,rotation:0,opacity:1};
c.setTransform(.06,0,0,.06,60,30);c.fillStyle='#123456';c.globalAlpha=.85;
const transform=()=>{const m=c.getTransform();return [m.a,m.b,m.c,m.d,m.e,m.f];},m=transform();
assert.equal(api.draw(c,fl,b),true);assert.equal(api.draw(c,bl,b),true);
assert.deepEqual(transform(),m);// Native canvas's fillStyle getter is stale after restore; verify actual paint.
c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(319,239,1,1);c.fillRect(319,239,1,1);const restored=c.getImageData(319,239,1,1).data;assert(Math.abs(restored[0]-18)<=1&&Math.abs(restored[1]-52)<=1&&Math.abs(restored[2]-86)<=1);c.restore();assert(Math.abs(c.globalAlpha-.85)<.005);
assert.equal(api.stats().rasterizations,1);assert.equal(api.stats().hits,1);assert.equal(allocations,1);assert.equal(api.stats().bytes,320*240*4);
// Opacity applies at paint time; cached field contains raw un-tinted colors.
assert.equal(api.draw(c,{...bl,opacity:.25},b),true);assert.equal(api.stats().rasterizations,1);
c.translate(1,0);api.draw(c,bl,b);assert.equal(api.stats().rasterizations,2);
style='fixture-b';api.draw(c,bl,b);assert.equal(api.stats().rasterizations,3);
cv.width=400;cv.height=300;c.setTransform(.06,0,0,.06,60,30);api.draw(c,bl,b);assert.equal(api.stats().rasterizations,4);assert.equal(api.stats().bytes,400*300*4);assert.equal(allocations,1);
const other=createCanvas(200,100).getContext('2d');other.setTransform(.03,.01,.005,.03,10,20);api.draw(other,bl,b);assert.equal(api.stats().rasterizations,5);assert.equal(allocations,1);assert.equal(api.stats().bytes,200*100*4);
const before=api.stats().rasterizations;
assert.equal(api.draw(c,bl,{honroStage:31}),false);assert.equal(api.draw(c,bl,{honroStage:32,honroCustom:true}),false);assert.equal(api.draw(c,{...bl,asset:{id:'act4-handoff:32:body-joined'}},b),false);assert.equal(api.stats().rasterizations,before);
assert.equal(api.draw(c,{...bl,scale:2},b),false);
const huge={canvas:{width:10000,height:10000},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};assert.equal(api.draw(huge,bl,b),false);assert.equal(allocations,1);assert.equal(api.stats().rasterizations,before);
assert.equal(JSON.stringify(b),bBefore,'Battle/state mutation');
// Source passes through normal vector validation too; long compounds stay joined.
vm.runInContext(await readFile(new URL('../shared/map/vector-art.js',import.meta.url),'utf8'),g);
assert.deepEqual(Array.from(g.HonroVectorArt.validate(field.vector)),[]);
assert.deepEqual(Array.from(g.HonroVectorArt.validate(body.vector)),[]);
const stats=api.stats();api.clear();assert.equal(api.stats().bytes,4);
console.log(JSON.stringify({pass:true,sourceGeometryValid:true,non32Unchanged:true,battlePure:true,oneBuffer:true,stats},null,2));
