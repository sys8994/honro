/** Density-candidate functional checks, never art/browser approval. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {runtimeDigest} from '../stage31/probes.mjs';
const input=process.argv[2]||'_local/reports/density-rollout';
const out=process.argv[3]||'_local/reports/density-qa/entry';
const stages=(process.argv[4]||'31,32,33,34,35,36,37,38,39,40').split(',').map(Number);
assert(stages.every(n=>n>=31&&n<=40));
const hash=x=>createHash('sha256').update(x).digest('hex'),runtime=await runtimeDigest(),rows=[];
await mkdir(out,{recursive:true});
for(const n of stages){
 const source=`${input}/${n}/candidate-project.json`,bytes=await readFile(source),snapshot=`${out}/stage-${n}-project.json`;
 await writeFile(snapshot,bytes);
 execFileSync(process.execPath,['tools/act4-vector-production/smoke-entry-storage.mjs',snapshot,out,'--stage',String(n)],{stdio:'inherit'});
 const row=JSON.parse(await readFile(`${out}/stage-${n}.json`,'utf8'));assert.equal(row.projectSha256,hash(JSON.stringify(JSON.parse(bytes))));assert.equal(row.runtimeSha256,runtime);
 rows.push({...row,source,sourceByteSha256:hash(bytes),sourceStillCurrent:hash(await readFile(source))===hash(bytes)});
}
assert.equal(await runtimeDigest(),runtime,'Runtime changed during run');
for(const row of rows)row.sourceStillCurrent=hash(await readFile(row.source))===row.sourceByteSha256;
const summary={status:'passed',scope:'Independent stage entry and cold deferred Continue with explicit 5MiB UTF16 storage fixture. Actual App/Engine/profile codec; DOM, Canvas, audio, storage and async network loader fixtures. No browser, mobile FPS, art approval, victory or linked campaign claim.',runtimeSha256:runtime,rows};
await writeFile(`${out}/summary.json`,JSON.stringify(summary,null,2));
console.log(JSON.stringify({status:summary.status,stages:rows.map(r=>({stage:r.stage,bytes:r.storedUTF16Bytes,current:r.sourceStillCurrent}))}));
