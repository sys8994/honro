/** Bind a report to the exact inputs observed before and after its own run. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
export function snapshot(n,dir){return JSON.parse(execFileSync('python3',['tools/act4-claude/provenance.py',String(n),dir],{encoding:'utf8'}));}
export async function writeReport(file,data,before,n,dir){
 const runId=process.env.ACT4_PROBE_RUN_ID;
 if(!runId){await writeFile(file,data);return;}
 const after=snapshot(n,dir);
 if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Probe inputs changed during execution; report cannot be bound.');
 await writeFile(file,data);
 await writeFile(file+'.binding.json',JSON.stringify({version:1,runId,inputs:after,reportSha256:createHash('sha256').update(data).digest('hex')},null,2));
}
