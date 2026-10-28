import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createCanvas,Path2D} from '@napi-rs/canvas';
let allocations=0;const g=vm.createContext({Path2D:function(d){allocations++;return new Path2D(d);}});vm.runInContext(readFileSync('shared/map/vector-art.js','utf8'),g);const art=g.HonroVectorArt;
const body={tag:'g',children:['#dd5522','#44aa66','#456789'].map(fill=>({tag:'path',d:'M0 0H100V100H0Z',fill}))};
const full={version:1,viewBox:[0,0,100,100],root:body};
const slices=snap=>({version:1,viewBox:[0,0,100,100],symbols:{body},clips:{left:['M-100 -100H50V200H-100Z'],right:['M50 -100H200V200H50Z']},root:{tag:'g',children:['left','right'].map(clipPath=>({tag:'use',symbol:'body',clipPath,...(snap?{pixelSnapClip:true}:{})}))}});
const plain=slices(false),snapped=slices(true);assert.equal(art.validate(snapped).length,0);
const draw=(vector,scale,rotation=0,shear=false)=>{const c=createCanvas(180,180),ctx=c.getContext('2d');ctx.translate(8.31,7.47);ctx.scale(scale,scale);if(shear)ctx.transform(1,.13,.07,1,0,0);art.draw(ctx,{vector},{x:0,y:0,rotation});return ctx.getImageData(0,0,180,180).data;};
const difference=(a,b)=>a.reduce((n,v,i)=>n+Math.abs(v-b[i]),0);
for(const scale of [.37,.53,.81,1.33]){const reference=draw(full,scale),old=draw(plain,scale),fixed=draw(snapped,scale);assert.ok(difference(reference,old)>0,'fixture must exhibit fractional clip antialias seam');assert.equal(difference(reference,fixed),0,`snapped seam at zoom ${scale}`);console.log(`fractional zoom ${scale}: seam delta ${difference(reference,old)} -> 0`);}
assert.deepEqual(draw(snapped,.73,.12),draw(plain,.73,.12),'rotated CTM uses normal clip');assert.deepEqual(draw(snapped,.73,0,true),draw(plain,.73,0,true),'sheared CTM uses normal clip');
const reflected=structuredClone(snapped);reflected.root.transform=[-1,0,0,1,100,0];const reflectedFull=structuredClone(full);reflectedFull.root={tag:'g',transform:[-1,0,0,1,100,0],children:[body]};assert.deepEqual(draw(reflected,.53),draw(reflectedFull,.53),'axis-aligned reflection snaps consistently');
const reject=(edit)=>{const v=structuredClone(snapped);edit(v);assert.ok(art.validate(v).length);};
reject(v=>v.clips.left=['M0 0L50 20L50 200L0 200Z']);reject(v=>v.clips.left.push('M0 0H1V1H0Z'));reject(v=>v.clips.left=['M0 0H50V200H1Z']);reject(v=>v.clips.left=['M0 0H0V20H0Z']);reject(v=>v.root.children[0].pixelSnapClip=1);reject(v=>delete v.root.children[0].clipPath);
art.prepare(snapped);allocations=0;draw(snapped,.53);draw(snapped,.81);assert.equal(allocations,0,'snapping reuses cached unit rectangle and clip paths');
console.log('PASS strict opt-in rectangular pixel snap, fractional seam removal, reflection, rotation/shear fallback, invalid clip rejection and zero warm allocations');
