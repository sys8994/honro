/** Independent constrained objective runner; no result synthesis or changed assertions. */
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {runObjectiveProbe,runtimeDigest} from '../stage31/probes.mjs';
const [projectPath,tapePath,out]=process.argv.slice(2);
const p=JSON.parse(await readFile(projectPath)),spec=JSON.parse(await readFile(tapePath))[0],before=await runtimeDigest();
const result=await runObjectiveProbe(p,'stage-31',spec);
assert.equal(await runtimeDigest(),before);
await writeFile(out,JSON.stringify({projectPath,tapePath,runtimeSHA256:before,result},null,2)+'\n');
console.log(result.id,result.result,result.reason||'');assert.equal(result.result,'pass');
