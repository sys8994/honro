/** Compare original Inkscape SVG traces to native vector importer at 1x. */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadImage,createCanvas} from '@napi-rs/canvas';
const dir=mkdtempSync(join(tmpdir(),'stage6-trace-'));
for(const [name,svg,asset,width] of [
 ['west','tools/stage6-prototype/art-study/terrain-exposure-raw4.svg','tools/stage6-prototype/art-study/terrain-exposure-runtime.json',1919],
 ['east','tools/stage6-prototype/art-study/terrain-east-exposure-raw4.svg','tools/stage6-prototype/art-study/terrain-east-exposure-runtime.json',1942],
]){
 const left=join(dir,name+'-svg.png'),right=join(dir,name+'-asset.png');
 for(const args of [['tools/vector-production/render-svg-target.mjs',svg,left,String(width)],['tools/vector-production/render-asset.mjs',asset,right,String(width)]]){const r=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
 async function pixels(path){const img=await loadImage(readFileSync(path)),canvas=createCanvas(img.width,img.height),ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);return {w:img.width,h:img.height,data:ctx.getImageData(0,0,img.width,img.height).data}}
 const a=await pixels(left),b=await pixels(right);assert.equal(a.w,b.w);assert.equal(a.h,b.h);assert.equal(a.data.length,b.data.length);let changed=0,max=0;for(let i=0;i<a.data.length;i++){const d=Math.abs(a.data[i]-b.data[i]);if(d){changed++;max=Math.max(max,d)}}assert.equal(changed,0,`${name} imported SVG changed ${changed} channels, max ${max}`);console.log(JSON.stringify({name,status:'pass',width:a.w,height:a.h,changedChannels:changed,maxDifference:max,scope:'1x native Canvas SVG-to-vector only, not PNG-to-trace, browser or visual approval'}));
}
