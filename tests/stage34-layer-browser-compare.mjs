import {readFile} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const dir=process.argv[2];assert(dir);
const read=async v=>JSON.parse(await readFile(path.join(dir,`stage34-${v}-focus-desktop-3.json`),'utf8'));
const a=await read('baseline');assert.equal(a.pngSha256,'58748898e6baa2b9195fb57ab0eb7124c1185f7f74dda7bb1732aee3472248bc','Baseline must match independently verified Chrome frame');
for(const v of ['no-basefill','no-clip']){const b=await read(v);for(const k of ['physicsSha256','camera','tideSnapshot','runtimeSha256'])assert.deepEqual(b[k],a[k]);assert.equal(b.sourceUnchanged,true);assert.equal(b.diagnosticOnly,true);console.log(JSON.stringify({variant:v,image:b.pngSha256,physicsUnchanged:true,scope:'Layer isolation only; not a production art fix'}));}
