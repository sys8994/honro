// Never rerun combat just to collect evidence. A clear applies only to the exact
// current geometry/unit placement fingerprint. Missing, stale, lost and budget-
// limited traces remain separate states; no report promotes them to a pass.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {act1Runtime,combatFingerprint,hash,reportRoot} from './act1-spatial-test-helpers.mjs';
const g=await act1Runtime(),out=reportRoot(),rows=[];
const legalActions=new Set(['heal','ward','interact','fire-seal','focus','fire','defend']);
for(let id=1;id<=10;id++){
 const fingerprint=combatFingerprint(g.HONRO_PROJECT.stages[id-1]);let trace,bytes;
 try{bytes=await readFile(`${out}/normal-combat/stage-${id}.json`,'utf8');trace=JSON.parse(bytes);}catch(error){if(error.code!=='ENOENT')throw error;}
 const actionsValid=Array.isArray(trace?.actions)&&trace.actions.length>0&&trace.actions.every(a=>legalActions.has(a?.action));
 const status=!trace?'missing':trace.stage!==id?'invalid-stage':trace.fingerprint!==fingerprint?'stale':!actionsValid?'invalid-actions':trace.phase==='won'?'passed':trace.phase==='lost'?'lost':'inconclusive';
 rows.push({stage:id,status,currentFingerprint:fingerprint,traceFingerprint:trace?.fingerprint,phase:trace?.phase,round:trace?.round,actions:trace?.actions?.length,actionsValid,actionLabels:actionsValid?[...new Set(trace.actions.map(a=>a.action))].sort():undefined,evidenceSha256:bytes?hash(bytes):undefined,seconds:trace?.seconds,file:trace?`${out}/normal-combat/stage-${id}.json`:null});
 console.log(status.toUpperCase(),id,trace?.round||'');
}
await mkdir(out,{recursive:true});await writeFile(`${out}/normal-combat-evidence.json`,JSON.stringify({scope:'Normal native-engine bot traces; no human difficulty, browser controls or rendered-art approval',rows},null,2)+'\n');if(rows.some(r=>r.status!=='passed'))process.exitCode=1;
