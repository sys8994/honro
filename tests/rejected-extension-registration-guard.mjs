import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{spawnSync}from'node:child_process';
const files=['shared/data/terrain-path-registrations.json','shared/data/terrain-path-optimization.json'],before=files.map(f=>readFileSync(f));
for(const n of [3,7]){const r=spawnSync(process.execPath,['tools/act1-vector-production/register-stage'+n+'-extension-optimization.mjs'],{encoding:'utf8'});assert.equal(r.status,1);assert(r.stderr.includes('미채택 확장 등록 중지: Stage'+n));for(let i=0;i<files.length;i++)assert.deepEqual(readFileSync(files[i]),before[i],'Obsolete tool mutated '+files[i]);}
console.log('PASS both rejected extension registration tools fail closed; registry and optimization bytes unchanged.');
