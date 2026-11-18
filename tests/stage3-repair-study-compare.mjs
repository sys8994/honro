import {readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';import path from 'node:path';
const dir=process.argv[2],rows=[];
for(const view of ['portrait-bl','desktop-br','pier-close','terrain-close']){
 const get=async variant=>JSON.parse(await readFile(path.join(dir,`stage3-${variant}-${view}.json`),'utf8'));
 const a=await get('baseline'),b=await get('candidate');assert(a.ok&&b.ok);assert.deepEqual(a.camera,b.camera);assert.equal(a.physicsSha256,b.physicsSha256);assert(a.renderPure&&b.renderPure);rows.push({view,physicsExact:true,cameraExact:true,renderPure:true});
}
await writeFile(path.join(dir,'study-contract.json'),JSON.stringify({rows,scope:'Visual study ONLY. No production registration, no save migration, no deployment, no art acceptance.'},null,2));
