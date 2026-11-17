import {readFile,writeFile} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {createCanvas,loadImage} from '@napi-rs/canvas';
const dir=process.argv[2];assert(dir);const variants=['direct-candidate-source','candidate','original-colors'],report={scope:'Same raw candidate source only; historical old/new strict failure unresolved; not artwork acceptance',views:[],previousCandidateHashes:'Exact SHA-256 checked against d18 actual Chrome artifact14329687058'};
let canonical=null,physics=null;
for(const view of ['lower','left']){
 const rows=await Promise.all(variants.map(v=>readFile(path.join(dir,`stage32-${v}-${view}.json`),'utf8').then(JSON.parse)));
 for(const r of rows){for(const k of ['renderPure','firstFramePure'])assert.equal(r[k],true);for(const k of ['sourceCanonicalSha256','physicsSha256','battleSha256','vectorSHA','sourcePathHashes','camera','width','height','runtimeSha256'])assert.deepEqual(r[k],rows[0][k],view+': '+k);canonical??=r.sourceCanonicalSha256;physics??=r.physicsSha256;assert.equal(r.sourceCanonicalSha256,canonical);assert.equal(r.physicsSha256,physics);}
 assert.equal(rows[1].pngSha256,view==='lower'?'d12510fc955164e70ab890e0a3a2dc7196ce02c2bd8b613cacddf7b53eb4f337':'9c837a7c482f47ef8e21ed290b952e7536be85f6a3adc99b6c39f4714973a90d','d18 prior candidate PNG changed');
 const pixels=await Promise.all(variants.map(async v=>{const im=await loadImage(await readFile(path.join(dir,`stage32-${v}-${view}.png`)));const c=createCanvas(1331,763).getContext('2d');c.drawImage(im,0,0);return c.getImageData(0,0,1331,763).data;}));
 const comparisons=[];
 for(const [ai,bi]of [[0,2],[2,1],[0,1]]){let changed=0,over2=0,max=0,sum=0;let bbox=[1331,763,-1,-1];for(let i=0;i<pixels[0].length;i+=4){let delta=0;for(let k=0;k<4;k++)delta=Math.max(delta,Math.abs(pixels[ai][i+k]-pixels[bi][i+k]));if(delta){changed++;const x=i/4%1331,y=Math.floor(i/4/1331);bbox=[Math.min(bbox[0],x),Math.min(bbox[1],y),Math.max(bbox[2],x),Math.max(bbox[3],y)];}if(delta>2)over2++;max=Math.max(max,delta);sum+=delta;}comparisons.push({a:variants[ai],b:variants[bi],changed,over2,max,meanMaxChannelDelta:sum/(1331*763),bbox:changed?bbox:null});}
 report.views.push({view,hashes:Object.fromEntries(rows.map(r=>[r.variant,r.pngSha256])),comparisons,manualBodyOnlyROIReview:'Pending; full-view difference counts are not AA classification'});
}
report.sourceCanonicalSha256=canonical;report.physicsSha256=physics;
await writeFile(path.join(dir,'comparison.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
