import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {gzipSync} from 'node:zlib';
import {readRun,aggregateFiles} from '../tools/quantitative-playtest/summarize.mjs';
const dir=await mkdtemp(join(tmpdir(),'honro-logs-')),start={type:'run-start',runId:'one',sourceHash:'x',stage:31,policy:'advance',seed:1,maxFrames:600,maxWallSeconds:180,evaluation:{kind:'mechanics-calibration'},controllerHash:'v6'},end={...start,type:'run-end',outcome:'timeout',round:1};
try{
 const log=join(dir,'one.jsonl.gz');await writeFile(log,gzipSync(JSON.stringify(start)+'\n'+JSON.stringify(end)+'\n'));assert.equal((await readRun(log)).outcome,'timeout');assert.equal((await readRun(log)).maxFrames,600);
 const missing=join(dir,'missing-start.jsonl.gz');await writeFile(missing,gzipSync(JSON.stringify({...end,runId:'missing-start',outcome:'clear'})+'\n'));const unknown=await readRun(missing);assert.equal(unknown.evaluation.kind,'unclassified-missing-start');assert.equal(unknown.originalOutcome,'clear');assert.equal(unknown.protocolRecorded,false);
 const partial=join(dir,'partial.jsonl.gz');await writeFile(partial,gzipSync(JSON.stringify({...start,runId:'partial'})+'\n{"type":"run-en').subarray(0,-8));assert.equal((await readRun(partial)).outcome,'error');
 const attempt=join(dir,'killed.attempt.json');await writeFile(attempt,JSON.stringify({...start,runId:'killed',status:'started-not-finalized',protocolRecorded:true}));assert.equal((await readRun(attempt)).outcome,'error');
 const summary=join(dir,'one.summary.json'),finalAttempt=join(dir,'one.attempt.json');await writeFile(summary,JSON.stringify({groups:[{runs:[{runId:'one',sourceHash:'x',stage:31,policy:'advance',seed:1,outcome:'timeout',round:1}]}]}));await writeFile(finalAttempt,JSON.stringify({runId:'one',status:'finalized',summary:'one.summary.json'}));assert.equal((await readRun(finalAttempt)).maxFrames,600);
 const result=await aggregateFiles([log,partial,attempt]);assert.equal(result.groups[0].started,3);assert.equal(result.groups[0].counts.error,2);assert.equal(result.groups[0].counts.timeout,1);assert.equal(result.groups[0].clearRateAll,0);await assert.rejects(aggregateFiles([log,log]),/Duplicate/);
 console.log('PASS gzip, truncated gzip, external termination failure denominators and duplicate rejection');
}finally{await rm(dir,{recursive:true});}
