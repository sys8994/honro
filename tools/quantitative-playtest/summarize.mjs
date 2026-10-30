/** Include incomplete attempts; never promote truncated logs or budgets to clears. */
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {dirname,join,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {gunzipSync,constants} from 'node:zlib';
import {summarize} from './stats.mjs';
const PROTOCOL_KEYS=['runId','sourceHash','controllerHash','stage','policy','seed','evaluation','cohortIdentity','maxFrames','maxWallSeconds'];
function fixedProtocol(row,start){
 const out={...row,protocolRecorded:true},mismatches=[];
 for(const k of PROTOCOL_KEYS){if(start[k]===undefined){if(row[k]!==undefined)mismatches.push(k);delete out[k];}else{if(row[k]!==undefined&&JSON.stringify(row[k])!==JSON.stringify(start[k]))mismatches.push(k);out[k]=start[k];}}
 if(mismatches.length){out.protocolMismatch=mismatches;out.originalOutcome=row.outcome;out.outcome='error';out.reason='Terminal protocol differs from pre-execution registration: '+mismatches.join(', ');}
 return out;
}
export async function readRun(file){
 if(file.endsWith('.attempt.json')){
  const attempt=JSON.parse(await readFile(file,'utf8'));let log,logReadError;
  try{log=await readRun(join(dirname(file),attempt.runId+'.jsonl.gz'));}catch(error){logReadError=error.code==='ENOENT'?'Raw log missing':String(error.message);}
  let row;
  if(attempt.status!=='finalized')row={...attempt,outcome:'error',reason:attempt.invalidation?.reason??'Started attempt without finalized summary; external termination or incomplete run',round:null};
  else{try{const summary=JSON.parse(await readFile(join(dirname(file),attempt.summary),'utf8')),rows=summary.groups.flatMap(g=>g.runs);if(rows.length!==1||rows[0].runId!==attempt.runId)throw Error('Attempt/summary identity mismatch');row=rows[0];}catch(error){row={...attempt,originalOutcome:attempt.outcome??null,outcome:'error',reason:'Unreadable/mismatched final summary: '+error.message,round:null};}}
  const registration=log?.protocolRecorded?log:attempt.protocolRecorded?attempt:null;
  let merged=registration?fixedProtocol(row,registration):{...attempt,...row,protocolRecorded:false,requestedEvaluation:attempt.evaluation??row.evaluation,evaluation:{kind:'unclassified-missing-start'},cohortIdentity:null,originalOutcome:row.outcome,outcome:'error'};
  if(log?.protocolMismatch){merged.protocolMismatch=log.protocolMismatch;merged.originalOutcome??=row.outcome;merged.outcome='error';merged.reason=log.reason;}
  if(logReadError){merged.originalOutcome??=merged.outcome;merged.outcome='error';merged.reason='Raw log unavailable/corrupt: '+logReadError;merged.logReadError=logReadError;}
  return merged;
 }
 const bytes=await readFile(file),source=file.endsWith('.gz')?gunzipSync(bytes,{finishFlush:constants.Z_SYNC_FLUSH}).toString('utf8'):bytes.toString('utf8');
 const chunks=source.split('\n'),lines=[];
 for(let i=0;i<chunks.length;i++){if(!chunks[i].trim())continue;try{lines.push(JSON.parse(chunks[i]));}catch(error){if(i!==chunks.length-1)throw error;}}
 const start=lines.find(r=>r.type==='run-start'),end=lines.findLast(r=>r.type==='run-end');
 if(!start)return {...end,runId:end?.runId??'unclassified-file:'+basename(file),protocolRecorded:false,requestedEvaluation:end?.evaluation??null,evaluation:{kind:'unclassified-missing-start'},cohortIdentity:null,originalOutcome:end?.outcome??null,outcome:'error',reason:'Missing run-start; original result retained but no pre-execution protocol can be established',round:end?.round??null};
 return fixedProtocol(end?{...start,...end}:{...start,outcome:'error',reason:'Incomplete JSONL/gzip; no terminal record',round:null},start);
}
export async function aggregateFiles(files){const rows=[],ids=new Set();for(const file of files){const row=await readRun(file);if(ids.has(row.runId))throw Error('Duplicate run: '+file);ids.add(row.runId);rows.push(row);}return {...summarize(rows),inputFiles:files};}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href){
 const [output,...args]=process.argv.slice(2);if(!output||!args.length)throw Error('Usage: summarize.mjs summary.json run.jsonl.gz|run.attempt.json ... OR summary.json --attempts directory');
 const files=args[0]==='--attempts'?(await readdir(args[1])).filter(f=>f.endsWith('.attempt.json')).sort().map(f=>join(args[1],f)):args;if(!files.length)throw Error('No runs supplied');
 const result=await aggregateFiles(files);await writeFile(output,JSON.stringify(result,null,2));console.log(JSON.stringify({runs:result.groups.reduce((n,g)=>n+g.started,0),groups:result.groups.length,gate:result.gate}));
}
