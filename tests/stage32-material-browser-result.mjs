/** Stage32-only completed Chrome DOM extractor. Not public UI/play acceptance. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const [input,out,variant,view]=process.argv.slice(2);
const cameras={overview:{x:0,y:2252.8,scale:1331/6800},lower:{x:1689.6,y:1900,scale:.6},left:{x:320,y:1650,scale:.6},right:{x:3200,y:1650,scale:.6}};
assert(input&&out&&['baseline','candidate'].includes(variant)&&cameras[view],'Usage: node tests/stage32-material-browser-result.mjs DUMP.html OUTPUT_DIRECTORY baseline|candidate overview|lower|left|right');
const html=await readFile(input,'utf8'),match=html.match(/<pre id="result">([A-Za-z0-9+/=]+)<\/pre>/);
assert(match&&match[1]!=='pending','No completed result');
const r=JSON.parse(Buffer.from(match[1],'base64').toString('utf8'));
if(r.ok!==true){
 await mkdir(out,{recursive:true});const failedBase=`stage32-${variant}-${view}.failed`,diagnostic={...r};delete diagnostic.png;
 if(typeof r.png==='string'&&/^data:image\/png;base64,/.test(r.png)){
  const failedPng=Buffer.from(r.png.split(',')[1],'base64');
  if(failedPng.subarray(0,8).toString('hex')==='89504e470d0a1a0a'){
   await writeFile(path.join(out,failedBase+'.png'),failedPng,{flag:'wx'});
   diagnostic.failurePngSha256=createHash('sha256').update(failedPng).digest('hex');
  }
 }
 await writeFile(path.join(out,failedBase+'.json'),JSON.stringify(diagnostic,null,2)+'\n',{flag:'wx'});
 assert.equal(r.ok,true,JSON.stringify(diagnostic)); // Preserve failure exit status after evidence capture.
}
assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.stage,32);assert.equal(r.variant,variant);assert.equal(r.view,view);
assert.deepEqual(r.requestedCamera,{name:view,...cameras[view]});
for(const k of ['x','y','scale'])assert(Number.isFinite(r.camera[k]),'Invalid constrained camera');
assert.equal(r.width,1331);assert.equal(r.height,763);assert.equal(r.dpr,1);assert.equal(r.seed,3910);assert.equal(r.time,2);
assert.equal(r.tideSnapshot,null);assert.equal(r.appReadyUnresolved,true);assert.equal(r.renderPure,true);
assert.equal(r.pendingImages,0);assert.equal(r.imageErrors,0);assert.equal(r.fontStatus,'loaded');
for(const key of ['storage','errors','violations'])assert.deepEqual(r[key],[]);
for(const key of ['runtimeSha256','physicsSha256'])assert.match(r[key],/^[a-f0-9]{64}$/);
assert(r.cacheStats&&typeof r.cacheStats==='object','Material cache stats missing');assert.equal(r.cacheStats.fallbacks,0);if(variant==='candidate')assert(r.cacheStats.rasterizations>0&&r.cacheStats.hits>0,'Candidate shared material not exercised');assert(r.sceneCacheStats&&typeof r.sceneCacheStats==='object');
assert.match(r.png,/^data:image\/png;base64,/);const png=Buffer.from(r.png.split(',')[1],'base64');
assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),1331);assert.equal(png.readUInt32BE(20),763);
delete r.png;r.pngSha256=createHash('sha256').update(png).digest('hex');
await mkdir(out,{recursive:true});const base=`stage32-${variant}-${view}`;
// If the peer already exists, verify the comparison has identical physics and constrained camera.
try{const peer=JSON.parse(await readFile(path.join(out,`stage32-${variant==='baseline'?'candidate':'baseline'}-${view}.json`),'utf8'));assert.equal(r.physicsSha256,peer.physicsSha256);assert.deepEqual(r.camera,peer.camera);assert.equal(r.runtimeSha256,peer.runtimeSha256);}catch(e){if(e.code!=='ENOENT')throw e;}
await writeFile(path.join(out,base+'.png'),png,{flag:'wx'});await writeFile(path.join(out,base+'.json'),JSON.stringify(r,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(r));
