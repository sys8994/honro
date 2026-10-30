/** Immutable per-run input copy; source edits later do not rewrite evidence. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeDigest} from '../stage31/probes.mjs';
const [source='_local/reports/density-rollout',out,sourceName='candidate-project.json']=process.argv.slice(2);
assert(out&&out.startsWith('_local/'),'Explicit ignored output directory required');
try{await stat(out+'/manifest.json');throw Error('Existing freeze must not be overwritten');}catch(e){if(e.code!=='ENOENT')throw e;}
const hash=x=>createHash('sha256').update(x).digest('hex'),rows=[],runtime=await runtimeDigest();
for(let n=31;n<=40;n++){const file=`${source}/${n}/${sourceName}`,buffer=await readFile(file),dest=`${out}/${n}/candidate-project.json`;await mkdir(`${out}/${n}`,{recursive:true});await writeFile(dest,buffer);rows.push({stage:n,source:file,file:dest,bytes:buffer.length,sourceByteSha256:hash(buffer),projectSha256:hash(JSON.stringify(JSON.parse(buffer)))});}
for(const row of rows)assert.equal(hash(await readFile(row.source)),row.sourceByteSha256,'Source changed while freezing');assert.equal(await runtimeDigest(),runtime);
await writeFile(out+'/manifest.json',JSON.stringify({createdUTC:new Date().toISOString(),runtimeSha256:runtime,scope:'Immutable isolated candidates for functional and cost checks; no art or browser approval.',rows},null,2));console.log(out+'/manifest.json');
