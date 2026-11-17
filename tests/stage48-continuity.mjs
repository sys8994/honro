import assert from 'node:assert/strict';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {terrain} from '../shared/data/act5/terrain.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {makeAct5} from '../shared/act5-world.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const baseline=JSON.parse(await readFile(new URL('../art/stage48-continuity/latest-master-baseline.json',import.meta.url)));
const a=await makeAct5(),asset=a.library.find(x=>x.id==='act5:near:48');
assert.equal(sha(asset.vector),baseline.source48,'authored source vector remains exact');
assert.deepEqual(asset.continuousBody.collision,[],'extension cannot create false collision');
assert.equal(asset.continuousBody.params.silhouetteUnderpaint,false);
assert.equal(asset.sourceNativeClips.length,2);
assert(asset.supportClip.length>0 && asset.supportClip.every(d=>d.startsWith('M')),'native support union has absolute paths');
const seam=JSON.parse(await readFile(new URL('../art/stage48-continuity/source-seam.json',import.meta.url)));
assert.equal(asset.sourceSeam,seam.clip,'active source partition matches checked data');
assert(seam.contactMinMargin>=15,'source partition preserves authored contact clearance');
assert(asset.sourceNativeClips.every(d=>d.startsWith('M')),'source clips use true absolute serialization');
const masks=JSON.parse(await readFile(new URL('../art/stage48-continuity/composition-v12.json',import.meta.url)));
assert.deepEqual(asset.compositionMasks,masks,'runtime uses checked native partitions');
for(const [key,file]of [['continuousBody','stage48-continuous-v11-bleed.json'],['jointBody','stage48-joint-v12.json']]){
 const expected=JSON.parse(await readFile(new URL('../shared/assets/environment/act5/'+file,import.meta.url)));
 assert.deepEqual(asset[key],expected,'active '+key+' provenance');assert.deepEqual(asset[key].collision,[]);
}
const ctx=createCanvas(1,1).getContext('2d'),paths=Object.fromEntries(['body','joint','source'].map(k=>[k,new Path2D(masks[k].join(' '))]));
const support=JSON.parse(await readFile(new URL('../art/stage48-continuity/support-mask-v9.json',import.meta.url))),hole=new Path2D(support.originalHoles.join(' '));let holeChecks=0,contactChecks=0;
for(let y=450;y<660;y+=3)for(let x=900;x<1450;x+=3)if(ctx.isPointInPath(hole,x,y)&&[-1,1].every(d=>ctx.isPointInPath(hole,x+d,y)&&ctx.isPointInPath(hole,x,y+d))){
 assert(!ctx.isPointInPath(paths.body,x,y),'deep mask must not close original tunnel');assert(!ctx.isPointInPath(paths.joint,x,y),'joint mask must not close original tunnel');holeChecks++;
}
assert(holeChecks>100,'tunnel interior sampled');
for(const [,ps]of terrain[7].lines)for(let i=1;i<ps.length;i++)for(let t=0;t<=1;t+=.1){const x=(ps[i-1][0]*(1-t)+ps[i][0]*t)*1.5,y=(ps[i-1][1]*(1-t)+ps[i][1]*t)*1.5+5;assert(ctx.isPointInPath(paths.source,x,y),'authored contact remains in original mask');contactChecks++;}
console.log({holeChecks,contactChecks,scope:'native geometry partitions, not gameplay/browser'});
if(process.argv.includes('--baseline-all')){
 assert.equal(sha(a.stages),baseline.stages,'all original stage gameplay preserved');
 assert.equal(sha(a.content),baseline.content,'all original story preserved');
 for(const item of a.library.filter(x=>x.id!=='act5:near:48'))assert.equal(sha(item),baseline.otherAssets[item.id],item.id);
}
console.log('stage48 preservation PASS; not visual, browser, or play approval');
