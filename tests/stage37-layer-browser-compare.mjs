import {readFile} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const dir=process.argv[2];assert(dir);
const read=async v=>JSON.parse(await readFile(path.join(dir,`stage37-${v}-edge-detail.json`),'utf8'));
const a=await read('baseline');assert.equal(a.pngSha256,'5cb99bdfa77b55b88556a8ab3fdeee8c1cde6a6b595736d530cc2cab53c744b8','Baseline must match independently verified Chrome frame');
for(const v of ['no-basefill','no-clip']){const b=await read(v);for(const k of ['physicsSha256','camera','tideSnapshot','runtimeSha256'])assert.deepEqual(b[k],a[k]);assert.equal(b.sourceUnchanged,true);assert.equal(b.diagnosticOnly,true);console.log(JSON.stringify({variant:v,image:b.pngSha256,physicsUnchanged:true,scope:'Layer isolation only; not a production art fix'}));}
