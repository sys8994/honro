/** Extract a completed --dump-dom diagnostic; no browser or game access. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const [input,out,idText]=process.argv.slice(2),id=Number(idText);
assert(input&&out&&[23,26,29,32,33].includes(id),'Usage: node tests/actual-scene-browser-result.mjs DUMP.html OUTPUT_DIRECTORY STAGE');
const html=await readFile(input,'utf8'),match=html.match(/<pre id="result">([A-Za-z0-9+/=]+)<\/pre>/);
assert(match&&match[1]!=='pending','No completed base64 result (pending/timeout/DOM error)');
const result=JSON.parse(Buffer.from(match[1],'base64').toString('utf8'));
assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.stage,id);
if(id===32){assert.equal(result.tideSnapshot,null);assert.equal(result.appReadyUnresolved,true);}
const view=id===33?'focus-landscape-2':'edge-desktop-2',width=id===33?844:1331,height=id===33?390:763;
if(id===33){assert.deepEqual(result.tideSnapshot,{phase:'low',surface:4095,warningRound:2,highRound:5,lowRound:7});assert.equal(result.appReadyUnresolved,true);}
assert.equal(result.view,view);assert.equal(result.dpr,1);
assert.equal(result.width,width);assert.equal(result.height,height);assert.equal(result.renderPure,true);
assert.equal(result.pendingImages,0);assert.equal(result.imageErrors,0);assert.equal(result.fontStatus,'loaded');
for(const key of ['storage','errors','violations'])assert.deepEqual(result[key],[]);
for(const key of ['runtimeSha256','physicsSha256'])assert.match(result[key],/^[a-f0-9]{64}$/);
assert.match(result.png,/^data:image\/png;base64,/);
const png=Buffer.from(result.png.split(',')[1],'base64');assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),height);
delete result.png;result.pngSha256=createHash('sha256').update(png).digest('hex');
await mkdir(out,{recursive:true});
await writeFile(path.join(out,`stage${id}-${view}.png`),png,{flag:'wx'});
await writeFile(path.join(out,`stage${id}-${view}.json`),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
