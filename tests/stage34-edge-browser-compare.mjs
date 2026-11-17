import {readFile} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {createCanvas,loadImage} from '@napi-rs/canvas';
const out=process.argv[2];for(const view of ['desktop','portrait','landscape']){
 const read=async v=>JSON.parse(await readFile(path.join(out,`stage34-${v}-${view}.json`),'utf8')),a=await read('baseline'),b=await read('candidate');for(const k of ['sourceSha256','camera','physicsSha256','runtimeSha256','width','height'])assert.deepEqual(b[k],a[k]);if(view==='desktop')assert.equal(a.pngSha256,'58748898e6baa2b9195fb57ab0eb7124c1185f7f74dda7bb1732aee3472248bc');
 const pixels=async v=>{const im=await loadImage(await readFile(path.join(out,`stage34-${v}-${view}.png`))),c=createCanvas(a.width,a.height).getContext('2d');c.drawImage(im,0,0);return c.getImageData(0,0,a.width,a.height).data;},pa=await pixels('baseline'),pb=await pixels('candidate');
 const bands=[];assert.equal(b.edgeStats.tiles.length,b.edgeStats.eligibleTiles);
 for(const t of b.edgeStats.tiles){const [sx,skx,sky,sy,tx,ty]=t.m;assert(sx>0&&sy>0&&skx===0&&sky===0);assert.equal(t.right,7680*sx+tx);assert.equal(t.bottom,5888*sy+ty);
  const eligible=(v,N)=>{const n=Math.floor(v),f=v-n;return n>=0&&n<N&&f>1e-7&&1-f>1e-7;};assert.equal(t.hasColumn,eligible(t.right,t.W));assert.equal(t.hasRow,eligible(t.bottom,t.H));
  // A changed cache pixel has a one-pixel linear reconstruction kernel on
  // either side of its centre. Trace that exact support to final screen space.
  if(t.hasColumn){const q=Math.floor(t.right);bands.push({axis:'x',min:((q-.5-tx)/sx-a.camera.x)*a.camera.scale+a.width/2,max:((q+1.5-tx)/sx-a.camera.x)*a.camera.scale+a.width/2});}
  if(t.hasRow){const q=Math.floor(t.bottom);bands.push({axis:'y',min:((q-.5-ty)/sy-a.camera.y)*a.camera.scale+a.height/2,max:((q+1.5-ty)/sy-a.camera.y)*a.camera.scale+a.height/2});}
 }
 let changed=0,outside=0,maxDelta=0;for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){const i=(y*a.width+x)*4;let d=0;for(let k=0;k<4;k++)d=Math.max(d,Math.abs(pa[i+k]-pb[i+k]));if(d){changed++;maxDelta=Math.max(d,maxDelta);if(!bands.some(q=>{const p=(q.axis==='x'?x:y)+.5;return p>=q.min-1e-9&&p<=q.max+1e-9;}))outside++;}}
 assert.equal(outside,0,'Changed pixels outside exact traced cache-kernel support');if(view==='desktop'){assert(changed>0);assert(b.edgeStats.draws>0);}if(!b.edgeStats.draws){assert.equal(bands.length,0);assert.equal(changed,0,'Already pixel-aligned caches must be exact no-op');}
 assert(b.edgeStats.peakBytes<=4*(a.width+a.height),'Unexpected strip memory');console.log(JSON.stringify({view,changed,outsideKernelSupport:outside,maxDelta,bands,physicsUnchanged:true,sourceUnchanged:true,edgeStats:b.edgeStats,visualAcceptance:'pending'}));
}
