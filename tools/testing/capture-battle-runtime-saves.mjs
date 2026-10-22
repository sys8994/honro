/** Reuse the existing normal-input Stage11 policy, adding only seeded captures.
 * No stage data, HP, enemies, objectives or gameplay are changed. Run on baseline.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const source=await readFile('tests/stage11-ravine-fullplay.mjs','utf8');
const setup='const g=await act1Runtime()',boundary='const sig=JSON.stringify({goal:row.goal';
assert(source.includes(setup)&&source.includes(boundary),'Existing input policy anchors');
const patched=source.replace(setup,'let runtimeSeed=899411;Math.random=()=>((runtimeSeed=Math.imul(runtimeSeed,1664525)+1013904223>>>0)/4294967296);\n'+setup).replace(boundary,"if([1,7,15,16].includes(b.round)){await writeFile(out+'/round'+b.round+'.json',JSON.stringify({profile,b,seed:899411,sourceHash,provenance}));if(b.round===16)process.exit(0);}"+boundary);
const file='tests/.battle-runtime-capture.mjs';
try{await writeFile(file,patched);const result=spawnSync(process.execPath,[file],{stdio:'inherit',env:{...process.env,HONRO_FULLPLAY_OUT:process.env.HONRO_FULLPLAY_OUT||'_local/reports/battle-runtime/current-saves',HONRO_FULLPLAY_ACTION_LIMIT:'500'}});process.exitCode=result.status??1;}
finally{await unlink(file);}
