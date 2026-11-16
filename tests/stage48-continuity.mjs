import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {makeAct5} from '../shared/act5-world.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const baseline=JSON.parse(await readFile(new URL('../art/stage48-continuity/preserved-baseline.json',import.meta.url)));
const a=await makeAct5(),asset=a.library.find(x=>x.id==='act5:near:48');
assert.equal(sha(asset.vector),baseline.source48,'authored source vector remains exact');
assert.deepEqual(asset.continuousBody.collision,[],'extension cannot create false collision');
assert.equal(asset.continuousBody.params.silhouetteUnderpaint,false);
assert.equal(asset.sourceNativeClips.length,2);
assert(asset.supportClip.length>0 && asset.supportClip.every(d=>d.startsWith('M')),'native support union has absolute paths');
const seam=JSON.parse(await readFile(new URL('../art/stage48-continuity/source-seam.json',import.meta.url)));
assert(seam.contactMinMargin>=15,'source partition preserves authored contact clearance');
assert(asset.sourceNativeClips.every(d=>d.startsWith('M')),'source clips use true absolute serialization');
if(process.argv.includes('--baseline-all')){
 assert.equal(sha(a.stages),baseline.stages,'all original stage gameplay preserved');
 assert.equal(sha(a.content),baseline.content,'all original story preserved');
 for(const item of a.library.filter(x=>x.id!=='act5:near:48'))assert.equal(sha(item),baseline.otherAssets[item.id],item.id);
}
console.log('stage48 preservation PASS; not visual, browser, or play approval');
