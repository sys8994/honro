import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {readWorldSource} from '../tools/act4-source/world-source.mjs';
import {applyAct4HandoffArt} from '../shared/act4-handoff-art.mjs';
const v1=await readFile(new URL('./fixtures/stage32-material-v1.js',import.meta.url),'utf8'),current=await readFile(new URL('./fixtures/stage32-narrow-aa-v3-candidate.js',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(current).digest('hex'),'8737653d61f4ff380a4994cdd892caf0344e9fc5d627c9ab7ba49473b98dafd2');
const {bytes}=await readWorldSource(),project=await applyAct4HandoffArt(JSON.parse(bytes),{stages:[32]});
const field=project.library.find(a=>a.id==='act4-handoff:32:foundation'),body=project.library.find(a=>a.id==='act4-handoff:32:body-shared-material');
function setup(source){const canvases=[];let style='a';const g=vm.createContext({Path2D,performance,HONRO_PROJECT:project,HonroVisualStyle:{key:()=>style},document:{createElement:()=>{const c=createCanvas(1,1);canvases.push(c);return c;}}});vm.runInContext(source,g);return{g,api:g.HonroStage32FoundationArt,canvases,style:v=>style=v};}
const now=setup(current),old=setup(v1),fl={asset:structuredClone(field),x:-5500,y:-1950,scale:1,rotation:0,opacity:1},bl={asset:structuredClone(body),x:0,y:0,scale:1,rotation:0,opacity:1};
const battle={honroStage:32,honroLandmarks:[fl,bl]},before=JSON.stringify(battle);
const pixels=c=>Buffer.from(c.getImageData(0,0,c.canvas.width,c.canvas.height).data),matrix=c=>{const m=c.getTransform();return[m.a,m.b,m.c,m.d,m.e,m.f];};
function drawPair(transform,alpha=1,opacity=1,w=320,h=240){
 const rows=[old,now].map(s=>{const c=createCanvas(w,h).getContext('2d');c.fillStyle='#123456';c.fillRect(0,0,w,h);c.setTransform(...transform);c.globalAlpha=alpha;const m=matrix(c);assert(s.api.draw(c,fl,battle));assert(s.api.draw(c,{...bl,opacity},battle));assert.deepEqual(matrix(c),m);assert(Math.abs(c.globalAlpha-alpha)<.005);return c;});return rows;
}
for(const [m,alpha,opacity]of [[[.06,0,0,.06,60,30],.85,1],[[.06,0,0,.06,60,30],1,.25],[[.03,.01,.005,.03,10,20],1,1]]){
 const [a,b]=drawPair(m,alpha,opacity);assert.deepEqual(pixels(b),pixels(a),'Unsupported paint state must retain exact original rendering');
}
const c=createCanvas(516,516).getContext('2d');c.setTransform(.6,0,0,.6,0,-800);c.fillStyle='#123456';c.globalAlpha=1;
const m=matrix(c);assert(now.api.draw(c,fl,battle));assert(now.api.draw(c,bl,battle));assert.deepEqual(matrix(c),m);assert.equal(c.globalAlpha,1);
c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(515,515,1,1);c.fillRect(515,515,1,1);const paint=c.getImageData(515,515,1,1).data;assert(Math.abs(paint[0]-18)<=1&&Math.abs(paint[1]-52)<=1&&Math.abs(paint[2]-86)<=1);c.restore();
let stats=now.api.stats();assert(stats.transition.fills>0);assert(stats.transition.boundaryPasses>0);assert.equal(now.canvases.length,8);assert.equal(stats.transition.allocations,3);
const exactBytes=()=>now.canvases.reduce((n,c)=>n+c.width*c.height*4,0);assert.equal(stats.totalLogicalBytes,exactBytes());assert(stats.transition.bytes<=3*stats.transition.maxPixels*4);
const raster=stats.rasterizations;now.api.draw(c,bl,battle);assert.equal(now.api.stats().rasterizations,raster);c.translate(1,0);now.api.draw(c,bl,battle);assert.equal(now.api.stats().rasterizations,raster+1);now.style('b');now.api.draw(c,bl,battle);assert.equal(now.api.stats().rasterizations,raster+2);
c.canvas.width=400;c.canvas.height=300;c.setTransform(.06,0,0,.06,60,30);now.api.draw(c,bl,battle);assert.equal(now.api.stats().rasterizations,raster+3);assert.equal(now.api.stats().totalLogicalBytes,exactBytes());assert.equal(now.canvases.length,8);
const cap=createCanvas(1100,1000).getContext('2d');cap.setTransform(.06,0,0,.06,60,30);now.api.draw(cap,bl,battle);assert.equal(now.api.stats().transition.lastSkip,'transition-pixel-cap');assert.equal(now.canvases.length,8);
const count=now.api.stats().rasterizations;assert.equal(now.api.draw(c,bl,{honroStage:31}),false);assert.equal(now.api.draw(c,bl,{honroStage:32,honroCustom:true}),false);assert.equal(now.api.draw(c,{...bl,asset:{id:'act4-handoff:32:body-joined'}},battle),false);assert.equal(now.api.draw(c,{...bl,scale:2},battle),false);
assert.equal(now.api.draw({canvas:{width:10000,height:10000},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})},bl,battle),false);assert.equal(now.api.stats().rasterizations,count);assert.equal(JSON.stringify(battle),before);
vm.runInContext(await readFile(new URL('../shared/map/vector-art.js',import.meta.url),'utf8'),now.g);assert.deepEqual(Array.from(now.g.HonroVectorArt.validate(field.vector)),[]);assert.deepEqual(Array.from(now.g.HonroVectorArt.validate(body.vector)),[]);
stats=now.api.stats();now.api.clear();assert.equal(now.api.stats().totalLogicalBytes,32);assert.equal(exactBytes(),32);assert.equal(now.api.stats().supersample.readbackBytes,0);assert.equal(now.api.stats().supersample.scratchBytes,8);assert(now.canvases.every(c=>c.width===1&&c.height===1));
assert.equal(now.api.testBoxMean,undefined);assert.equal(stats.supersample.factor,2);assert(stats.supersample.calls>0);assert.equal(stats.supersample.skips,0);assert(stats.supersample.peakLogicalBytes<=24*1024*1024);console.log(JSON.stringify({passed:true,scope:'New eight-canvas experimental contract, source/state/paint fallback/cache/cap/clear checks. Production source is checked directly. Historical1/4/5 expectations are preserved in prior CI and not silently weakened.',stats},null,2));

assert.equal(stats.supersample.emptyStripes+stats.supersample.highRasterStripes,stats.supersample.stripes);

assert.equal(now.api.stats().narrow.readbackBytes,0);assert.equal(now.api.stats().narrow.scratchBytes,8);assert(stats.narrow.calls>0);assert(Number.isFinite(stats.combinedPeakLogicalBytes)&&stats.combinedPeakLogicalBytes>0);
