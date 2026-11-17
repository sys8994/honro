import {readFile} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const dir=process.argv[2];assert(dir);
for(const view of ['focus-landscape-2','left-ridge','bottom-desktop','bottom-portrait']){
 const read=async v=>JSON.parse(await readFile(path.join(dir,`stage33-${v}-${view}.json`),'utf8'));
 const a=await read('baseline'),b=await read('candidate');
 for(const k of ['physicsSha256','camera','tideSnapshot','width','height'])assert.deepEqual(b[k],a[k],view+': '+k);
 assert(b.materialStats,'Missing compositor evidence');assert.equal(b.materialStats.fallbacks,0,JSON.stringify(b.materialStats));assert(b.materialStats.rasterizations>0);assert(b.materialStats.peakBytes<=8388608*4);
 assert.notEqual(a.pngSha256,b.pngSha256,'No actual art difference: '+view);
 console.log(JSON.stringify({view,physicsUnchanged:true,baselineImage:a.pngSha256,candidateImage:b.pngSha256,stats:b.materialStats,visualReview:'PENDING manual image inspection'}));
}
