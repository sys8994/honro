import {readFile,writeFile} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {createCanvas,loadImage} from '@napi-rs/canvas';
const dir=process.argv[2];assert(dir);const report={scope:'Unoptimized raw d18 material prototype only. Lower non-walk colour transition, not final art or performance acceptance.',views:[]};
for(const view of ['lower','left']){
 const rows=await Promise.all(['candidate','transition'].map(v=>readFile(path.join(dir,`stage32-${v}-${view}.json`),'utf8').then(JSON.parse)));
 for(const r of rows){assert(r.renderPure&&r.firstFramePure);for(const k of ['sourceCanonicalSha256','physicsSha256','battleSha256','vectorSHA','sourcePathHashes','camera','width','height','runtimeSha256'])assert.deepEqual(r[k],rows[0][k],k);}
 assert.equal(rows[0].pngSha256,view==='lower'?'d12510fc955164e70ab890e0a3a2dc7196ce02c2bd8b613cacddf7b53eb4f337':'9c837a7c482f47ef8e21ed290b952e7536be85f6a3adc99b6c39f4714973a90d');assert(rows[1].transitionFills>0);
 const pixels=await Promise.all(['candidate','transition'].map(async v=>{const im=await loadImage(await readFile(path.join(dir,`stage32-${v}-${view}.png`)));const c=createCanvas(1331,763).getContext('2d');c.drawImage(im,0,0);return c.getImageData(0,0,1331,763).data;}));
 let changed=0,protectedChanged=0,max=0,bbox=[1331,763,-1,-1];for(let i=0;i<pixels[0].length;i+=4){let d=0;for(let k=0;k<4;k++)d=Math.max(d,Math.abs(pixels[0][i+k]-pixels[1][i+k]));if(!d)continue;changed++;max=Math.max(max,d);const x=i/4%1331,y=Math.floor(i/4/1331),worldY=rows[0].camera.y+(y-763/2)/rows[0].camera.scale;if(worldY<=1700)protectedChanged++;bbox=[Math.min(bbox[0],x),Math.min(bbox[1],y),Math.max(bbox[2],x),Math.max(bbox[3],y)];}
 report.views.push({view,changed,protectedChanged,max,bbox,productionBuffers:rows[1].cacheStats,cacheBuildMs:rows.map(r=>r.sceneCacheStats.worldBuildMs),protectedWorldYMax:1700,lowestActualWalkWorldY:1342,visualReview:'PENDING'});assert.equal(protectedChanged,0,'Original upper/road/grass pixels changed');assert(changed>0,'No effect');
}
await writeFile(path.join(dir,'comparison.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
