/** Extract a completed --dump-dom diagnostic; no browser or game access. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const [input,out,idText,variant]=process.argv.slice(2),id=Number(idText);
assert(input&&out&&[34,37,38].includes(id),'Usage: node tests/actual-scene-browser-result.mjs DUMP.html OUTPUT_DIRECTORY STAGE');
const html=await readFile(input,'utf8'),match=html.match(/<pre id="result">([A-Za-z0-9+/=]+)<\/pre>/);
assert(match&&match[1]!=='pending','No completed base64 result (pending/timeout/DOM error)');
const result=JSON.parse(Buffer.from(match[1],'base64').toString('utf8'));
if(!result.ok){await mkdir(out,{recursive:true});await writeFile(path.join(out,`stage${id}-${variant}-failure.json`),JSON.stringify(result,null,2)+'\n',{flag:'wx'});}
assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.variant,variant);assert.equal(result.diagnosticOnly,true);assert.equal(result.sourceUnchanged,true);assert.equal(result.stage,id);
if([34,37,38].includes(id)){assert.equal(result.tideSnapshot,null);assert.equal(result.appReadyUnresolved,true);}
const view={34:'focus-desktop-3',37:'edge-detail',38:'edge-desktop-4'}[id];assert.deepEqual(result.camera,{34:{x:6464,y:4336,scale:1331/6800},37:{x:1201,y:1552,scale:.6},38:{x:3456,y:2304,scale:1331/6800}}[id]);assert.equal(result.view,view);assert.equal(result.dpr,1);
assert.equal(result.width,1331);assert.equal(result.height,763);assert.equal(result.renderPure,id!==37);assert.equal(result.renderStableAfterInitialization,true);assert.equal(result.frameCount,4);assert.deepEqual(result.firstRenderInitializations,id===37?['observed','signalExposure']:[]);
assert.equal(result.pendingImages,0);assert.equal(result.imageErrors,0);assert.equal(result.fontStatus,'loaded');
for(const key of ['storage','errors','violations'])assert.deepEqual(result[key],[]);
for(const key of ['runtimeSha256','physicsSha256'])assert.match(result[key],/^[a-f0-9]{64}$/);
assert.match(result.png,/^data:image\/png;base64,/);
const png=Buffer.from(result.png.split(',')[1],'base64');assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
assert.equal(png.readUInt32BE(16),1331);assert.equal(png.readUInt32BE(20),763);
await mkdir(out,{recursive:true});
for(let i=0;i<result.clipMasks.length;i++){const q=result.clipMasks[i],data=Buffer.from(q.png.split(',')[1],'base64');assert.equal(data.readUInt32BE(16),q.width);assert.equal(data.readUInt32BE(20),q.height);q.file=`stage38-${variant}-alpha-mask-${i}.png`;q.sha256=createHash('sha256').update(data).digest('hex');delete q.png;await writeFile(path.join(out,q.file),data,{flag:'wx'});}
if(variant==='single-clip')assert(result.clipMasks.length>0);else assert.equal(result.clipMasks.length,0);
delete result.png;result.pngSha256=createHash('sha256').update(png).digest('hex');
await mkdir(out,{recursive:true});
await writeFile(path.join(out,`stage${id}-${variant}-${view}.png`),png,{flag:'wx'});
await writeFile(path.join(out,`stage${id}-${variant}-${view}.json`),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
