import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const [input,out,variant,view]=process.argv.slice(2);
const goldens=JSON.parse(await readFile(new URL('./fixtures/stage32-internal-boundary-golden.json',import.meta.url),'utf8')),expected=goldens[view];assert(input&&out&&['candidate','ss2'].includes(variant)&&expected);
await mkdir(out,{recursive:true});
let r;
try{
 const html=await readFile(input,'utf8'),m=html.match(/<pre id="result">([A-Za-z0-9+/=]+)<\/pre>/);assert(m,'No completed result');
 r=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
 assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.stage,32);assert.equal(r.variant,variant);assert.equal(r.view,view);
 assert.deepEqual(r.camera,expected.camera);assert.equal(r.width,expected.width);assert.equal(r.height,expected.height);assert.equal(r.dpr,1);
 for(const k of ['renderPure','firstFramePure','appReadyUnresolved'])assert.equal(r[k],true,k);
 assert.equal(r.tideSnapshot,null);assert.equal(r.pendingImages,0);assert.equal(r.imageErrors,0);assert.equal(r.fontStatus,'loaded');
 for(const k of ['storage','errors','violations'])assert.deepEqual(r[k],[]);
 for(const k of ['runtimeSha256','sourceCanonicalSha256','physicsSha256','vectorSHA','battleSha256'])assert.match(r[k],/^[a-f0-9]{64}$/);
 assert.equal(r.performanceReport,null); // New declared gray scope overlaps SS; retain and report that overlap, do not remove SS.
if(variant==='candidate')assert(r.ssObservation.changedWrites>0,'Original SS observation missing');else assert.equal(r.ssObservation.changedWrites,0,'Native helper was unexpectedly instrumented');
 if(variant==='ss2'){const active=r.imagePlanes.some(v=>v.assetId==='act4-handoff:32:body-shared-material'&&v.matrix[0]>=.05);assert.equal(r.cacheStats.nativeJunction.prepareCalls,active?1:0);if(active)assert(r.cacheStats.nativeJunction.calls>0);else assert.equal(r.cacheStats.nativeJunction.calls,0);assert.equal(r.cacheStats.nativeJunction.staticBytes,26782);assert(r.cacheStats.nativeJunction.ms>=0);}
 assert.equal(r.cacheStats.fallbacks,0);if(variant==='direct-candidate-source'){assert(r.drawDiagnostic.directBypasses>0);assert.equal(r.drawDiagnostic.directVectorDraws,r.drawDiagnostic.directBypasses);}assert.equal(r.vectorSHA,'76e4fc6c04fc1f95aa9dcd0d97c9b8294c05cbe0a75169eb53174768f8da7cd1');assert(r.cacheStats.rasterizations>0);if(variant!=='direct-candidate-source')assert(r.cacheStats.hits>0);
 for(const [i,g]of (r.gateProbes||[]).entries()){for(const k of ['png','footprint']){assert.match(g[k],/^data:image\/png;base64,/);const bytes=Buffer.from(g[k].split(',')[1],'base64');assert.equal(bytes.readUInt32BE(16),expected.width);assert.equal(bytes.readUInt32BE(20),expected.height);g[k+'SHA256']=createHash('sha256').update(bytes).digest('hex');await writeFile(path.join(out,`stage32-gate-${variant}-${view}-${i}-${k}.png`),bytes,{flag:'wx'});delete g[k];}}
 assert.match(r.paintFootprintPng,/^data:image\/png;base64,/);const footprint=Buffer.from(r.paintFootprintPng.split(',')[1],'base64');r.paintFootprintSHA256=createHash('sha256').update(footprint).digest('hex');await writeFile(path.join(out,`stage32-footprint-${variant}-${view}.png`),footprint,{flag:'wx'});delete r.paintFootprintPng;
 assert.match(r.png,/^data:image\/png;base64,/);const png=Buffer.from(r.png.split(',')[1],'base64');
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),expected.width);assert.equal(png.readUInt32BE(20),expected.height);
 if(r.priorPng){const prior=Buffer.from(r.priorPng.split(',')[1],'base64');r.priorPngSha256=createHash('sha256').update(prior).digest('hex');await writeFile(path.join(out,`stage32-prior-${view}.png`),prior,{flag:'wx'});delete r.priorPng;}
 assert.match(r.bodyOnlyPng,/^data:image\/png;base64,/);const body=Buffer.from(r.bodyOnlyPng.split(',')[1],'base64');assert.equal(body.readUInt32BE(16),expected.width);assert.equal(body.readUInt32BE(20),expected.height);r.bodyOnlyPngSha256=createHash('sha256').update(body).digest('hex');await writeFile(path.join(out,`stage32-body-${variant}-${view}.png`),body,{flag:'wx'});delete r.bodyOnlyPng;
 const terrain=Buffer.from(r.terrainUnionPng.split(',')[1],'base64');assert.equal(terrain.readUInt32BE(16),expected.width);assert.equal(terrain.readUInt32BE(20),expected.height);r.terrainUnionSHA=createHash('sha256').update(terrain).digest('hex');await writeFile(path.join(out,`stage32-terrain-${variant}-${view}.png`),terrain,{flag:'wx'});delete r.terrainUnionPng;
 const directSupport=Buffer.from(r.directSeamSupportPng.split(',')[1],'base64');assert.equal(directSupport.readUInt32BE(16),expected.width);assert.equal(directSupport.readUInt32BE(20),expected.height);r.directSeamSupportSHA=createHash('sha256').update(directSupport).digest('hex');await writeFile(path.join(out,`stage32-direct-seam-support-${variant}-${view}.png`),directSupport,{flag:'wx'});delete r.directSeamSupportPng;
 for(const m of r.exactBlitSupport.outputs){const bytes=Buffer.from(m.png.split(',')[1],'base64');m.sha256=createHash('sha256').update(bytes).digest('hex');await writeFile(path.join(out,`stage32-blit-${variant}-${view}-${m.mode}.png`),bytes,{flag:'wx'});delete m.png;}
 assert(r.actualBlits&&Array.isArray(r.actualBlits.rows));for(const tile of r.actualBlits.tiles){const bytes=Buffer.from(tile.png.split(',')[1],'base64');tile.pngSHA256=createHash('sha256').update(bytes).digest('hex');await writeFile(path.join(out,`stage32-tile-${variant}-${view}-${tile.id}.png`),bytes,{flag:'wx'});delete tile.png;}
 delete r.png;r.pngSha256=createHash('sha256').update(png).digest('hex');
 await writeFile(path.join(out,`stage32-${variant}-${view}.png`),png,{flag:'wx'});
 await writeFile(path.join(out,`stage32-${variant}-${view}.json`),JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(r));
}catch(e){await writeFile(path.join(out,`stage32-${variant}-${view}-failure.json`),JSON.stringify({error:String(e.stack||e),result:r?{...r,png:undefined}:null},null,2)+'\n',{flag:'wx'});throw e;}


