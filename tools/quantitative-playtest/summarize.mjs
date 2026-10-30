/** Include incomplete attempts; never promote truncated logs or budgets to clears. */
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {gunzipSync,constants} from 'node:zlib';
import {summarize} from './stats.mjs';
export async function readRun(file){
 if(file.endsWith('.attempt.json')){
  const attempt=JSON.parse(await readFile(file,'utf8'));
  if(attempt.status!=='finalized')return {...attempt,outcome:'error',reason:'Started attempt without finalized summary; external termination or incomplete run',round:null};
  const result=JSON.parse(await readFile(join(dirname(file),attempt.summary),'utf8')),rows=result.groups.flatMap(g=>g.runs);
  if(rows.length!==1||rows[0].runId!==attempt.runId)throw Error('Attempt/summary identity mismatch: '+file);return rows[0];
 }
 const bytes=await readFile(file),source=file.endsWith('.gz')?gunzipSync(bytes,{finishFlush:constants.Z_SYNC_FLUSH}).toString('utf8'):bytes.toString('utf8');
 const chunks=source.split('\n'),lines=[];
 for(let i=0;i<chunks.length;i++){if(!chunks[i].trim())continue;try{lines.push(JSON.parse(chunks[i]));}catch(error){if(i!==chunks.length-1)throw error;}}
 const start=lines.find(r=>r.type==='run-start'),end=lines.findLast(r=>r.type==='run-end');
 if(!start)throw Error('Missing run-start; include persisted .attempt.json instead: '+file);
 return end??{...start,outcome:'error',reason:'Incomplete JSONL/gzip; no terminal record',round:null};
}
export async function aggregateFiles(files){const rows=[],ids=new Set();for(const file of files){const row=await readRun(file);if(ids.has(row.runId))throw Error('Duplicate run: '+file);ids.add(row.runId);rows.push(row);}return {...summarize(rows),inputFiles:files};}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href){
 const [output,...args]=process.argv.slice(2);if(!output||!args.length)throw Error('Usage: summarize.mjs summary.json run.jsonl.gz|run.attempt.json ... OR summary.json --attempts directory');
 const files=args[0]==='--attempts'?(await readdir(args[1])).filter(f=>f.endsWith('.attempt.json')).sort().map(f=>join(args[1],f)):args;if(!files.length)throw Error('No runs supplied');
 const result=await aggregateFiles(files);await writeFile(output,JSON.stringify(result,null,2));console.log(JSON.stringify({runs:result.groups.reduce((n,g)=>n+g.started,0),groups:result.groups.length,gate:result.gate}));
}
