/** Verify the visual-only underlay cannot change pixels near physical road. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {applyStage6ArtPreview} from '../tools/stage6-prototype/art-preview.mjs';
import {floor} from '../tools/stage6-prototype/author.mjs';
const input=JSON.parse(readFileSync('shared/data/campaign.json'));
const art=applyStage6ArtPreview(input).library.find(x=>x.id==='stage06-prototype:continuous-body-v1');
const baseline=structuredClone(art), before=baseline.vector.root.children.length;
baseline.vector.root.children=baseline.vector.root.children.filter(x=>x.transform?.[0]!==2.7);
assert.equal(before-baseline.vector.root.children.length,1,'exactly one protected underlay');
const runtime={Path2D};vm.createContext(runtime);vm.runInContext(readFileSync('shared/map/vector-art.js','utf8'),runtime);
const scale=.5,W=1300,H=900,originY=1550;
function render(asset){const c=createCanvas(W,H),ctx=c.getContext('2d');ctx.scale(scale,scale);ctx.translate(0,-originY);runtime.HonroVectorArt.draw(ctx,asset,{x:0,y:0});return ctx.getImageData(0,0,W,H).data}
const noop=structuredClone(art);noop.vector.root.children.find(x=>x.transform?.[0]===2.7).children=[];const a=render(art),b=render(baseline),c=render(noop);let checked=0,diff=0,max=0,self=0,underNoOp=0,first=[];
for(let px=0;px<W;px++){const x=(px+.5)/scale,py=Math.round((floor(x)-originY)*scale);for(let y=Math.max(0,py-2);y<Math.min(H,py+25);y++){let i=(y*W+px)*4;for(let k=0;k<4;k++){let d=Math.abs(a[i+k]-b[i+k]);if(d){diff++;max=Math.max(max,d);if(first.length<5)first.push([px,y,k,d])}if(b[i+k]!==c[i+k])self++;if(a[i+k]!==c[i+k])underNoOp++}checked++}}
console.log(JSON.stringify({status:underNoOp?'FAIL':'diagnostic',scope:'native Canvas pixels in roughly 4 above to 50 world units below unchanged road, scale .5; not browser, aesthetics or gameplay',pixels:checked,changedChannels:diff,maxDifference:max,noOpVsRemoved:self,underlayVsNoOp:underNoOp,first}));

if(underNoOp)process.exitCode=1;
