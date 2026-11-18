import {readFile} from 'node:fs/promises';import {createCanvas,loadImage} from '@napi-rs/canvas';import path from 'node:path';import assert from 'node:assert/strict';
const dir=process.argv[2];assert(dir);
for(const view of ['focus-landscape-2','left-ridge','bottom-desktop','bottom-portrait']){
 const read=async v=>JSON.parse(await readFile(path.join(dir,`stage33-${v}-${view}.json`),'utf8'));
 const a=await read('baseline'),b=await read('candidate');
 for(const k of ['physicsSha256','camera','tideSnapshot','width','height'])assert.deepEqual(b[k],a[k],view+': '+k);
 assert(b.materialStats,'Missing compositor evidence');assert.equal(b.materialStats.fallbacks,0,JSON.stringify(b.materialStats));if(view==='left-ridge')assert.equal(b.materialStats.rasterizations,0);else assert(b.materialStats.rasterizations>0);assert(b.materialStats.peakBytes<=8388608*4);
 if(view==='left-ridge')assert.equal(a.pngSha256,b.pngSha256,'Protected detail must retain exact original pixels');else assert.notEqual(a.pngSha256,b.pngSha256,'No actual art difference: '+view);
 const pixels=async variant=>{const image=await loadImage(await readFile(path.join(dir,`stage33-${variant}-${view}.png`)));const c=createCanvas(a.width,a.height).getContext('2d');c.drawImage(image,0,0);return c.getImageData(0,0,a.width,a.height).data;};
 const pa=await pixels('baseline'),pb=await pixels('candidate');let corePixels=0,coreChanged=0,coreMaxDelta=0;
 for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){const X=(x+.5-a.width/2)/a.camera.scale+a.camera.x,Y=(y+.5-a.height/2)/a.camera.scale+a.camera.y;if(X< -2990||Y>5090)continue;corePixels++;let delta=0;for(let k=0;k<4;k++)delta=Math.max(delta,Math.abs(pa[(y*a.width+x)*4+k]-pb[(y*a.width+x)*4+k]));if(delta)coreChanged++;coreMaxDelta=Math.max(coreMaxDelta,delta);}
 assert.equal(coreMaxDelta,0,view+': protected core changed '+JSON.stringify({corePixels,coreChanged,coreMaxDelta}));
 console.log(JSON.stringify({view,physicsUnchanged:true,corePixels,coreChanged,coreMaxDelta,baselineImage:a.pngSha256,candidateImage:b.pngSha256,stats:b.materialStats,visualReview:'PENDING manual image inspection'}));
}
