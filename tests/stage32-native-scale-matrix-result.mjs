import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const [input,out,variant,view]=process.argv.slice(2);
const goldens=JSON.parse(await readFile(new URL('./fixtures/stage32-native-scale-matrix-golden.json',import.meta.url),'utf8')),expected=goldens[view];assert(input&&out&&['candidate','ss2'].includes(variant)&&expected);
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
 assert.equal(r.performanceReport,null);assert.equal(r.ssObservation.inNativeCoverage,0,'SS/native domains unexpectedly overlap');if(variant==='candidate')assert(r.ssObservation.changedWrites>0,'Original SS observation missing');else assert.equal(r.ssObservation.changedWrites,0,'Native helper was unexpectedly instrumented');
 if(variant==='ss2'){assert(r.cacheStats.nativeJunction.calls>0);assert(r.cacheStats.nativeJunction.ms>=0);}
 assert.equal(r.cacheStats.fallbacks,0);if(variant==='direct-candidate-source'){assert(r.drawDiagnostic.directBypasses>0);assert.equal(r.drawDiagnostic.directVectorDraws,r.drawDiagnostic.directBypasses);}assert.equal(r.vectorSHA,'76e4fc6c04fc1f95aa9dcd0d97c9b8294c05cbe0a75169eb53174768f8da7cd1');assert(r.cacheStats.rasterizations>0);if(variant!=='direct-candidate-source')assert(r.cacheStats.hits>0);
 assert.match(r.png,/^data:image\/png;base64,/);const png=Buffer.from(r.png.split(',')[1],'base64');
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),expected.width);assert.equal(png.readUInt32BE(20),expected.height);
 if(r.priorPng){const prior=Buffer.from(r.priorPng.split(',')[1],'base64');r.priorPngSha256=createHash('sha256').update(prior).digest('hex');await writeFile(path.join(out,`stage32-prior-${view}.png`),prior,{flag:'wx'});delete r.priorPng;}
 assert.match(r.bodyOnlyPng,/^data:image\/png;base64,/);const body=Buffer.from(r.bodyOnlyPng.split(',')[1],'base64');assert.equal(body.readUInt32BE(16),expected.width);assert.equal(body.readUInt32BE(20),expected.height);r.bodyOnlyPngSha256=createHash('sha256').update(body).digest('hex');await writeFile(path.join(out,`stage32-body-${variant}-${view}.png`),body,{flag:'wx'});delete r.bodyOnlyPng;
 delete r.png;r.pngSha256=createHash('sha256').update(png).digest('hex');
 await writeFile(path.join(out,`stage32-${variant}-${view}.png`),png,{flag:'wx'});
 await writeFile(path.join(out,`stage32-${variant}-${view}.json`),JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(r));
}catch(e){await writeFile(path.join(out,`stage32-${variant}-${view}-failure.json`),JSON.stringify({error:String(e.stack||e),result:r?{...r,png:undefined}:null},null,2)+'\n',{flag:'wx'});throw e;}


