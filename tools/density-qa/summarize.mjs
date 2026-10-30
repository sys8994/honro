/** Bind functional evidence to one frozen project; never relabel prior runs. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [projectFile,reportRoot,out]=process.argv.slice(2),read=async p=>JSON.parse(await readFile(p)),hash=x=>createHash('sha256').update(x).digest('hex'),source=await readFile(projectFile),byteHash=hash(source),projectHash=hash(JSON.stringify(JSON.parse(source))),entry=await read(reportRoot+'/final-combined-entry/summary.json'),rows=[];
assert([byteHash,projectHash].includes(entry.projectSha256));
for(let n=31;n<=40;n++){
 const c=await read(`${reportRoot}/final-cost/stage-${n}.json`);assert.equal(c.projectSha256,projectHash);let replay=null;
 try{replay=await read(`${reportRoot}/final-replays/stage${n}${n===40?'/result.json':'.json'}`);}catch(e){if(e.code!=='ENOENT')throw e;}
 if(replay){assert([byteHash,projectHash].includes(replay.projectSha256||replay.fingerprint),'Replay project mismatch '+n);assert.equal(replay.runtimeSha256,entry.runtimeSha256,'Replay runtime mismatch '+n);assert(replay.success,'Failed replay '+n);assert(replay.resume?.length,'No actual Continue evidence '+n);}
 const e=entry.rows.find(r=>r.stage===n);assert(e);
 rows.push({stage:n,entrySaveColdContinue:'passed',storedUTF16Bytes:e.storedUTF16Bytes,exactWholeSnapshotCodec:e.exactWholeSnapshotCodec,referencedAssetJSONBytes:c.referencedAssetJSONBytes,maxExpandedNodes:c.maxExpandedNodes,maxDepth:c.maxDepth,maxPathChars:c.maxPathChars,maxClipPathChars:c.maxClipPathChars,duplicateReferencedDefinitions:c.exactDefinitionDuplicatesExceptIdName,fullplay:replay?{status:'passed',frames:replay.frame??replay.frames,resume:replay.resume,scope:replay.scope,verifierSha256:replay.verifierSha256}:null});
}
const result={projectFile,projectByteSHA256:byteHash,projectSHA256:projectHash,runtimeSHA256:entry.runtimeSha256,allTenReplaysComplete:rows.every(r=>r.fullplay),scope:'Frozen-project independent prepared-stage entry and recorded ordinary-input functional checks. DOM/audio/network loader and storage quota fixtures; Native Canvas adapters except stage31/35 no-render adapters. Stage40 valid prior-proof fixture is not linked campaign history. No browser HUD, mobile FPS, art approval, publication or deployment claim. Referenced-asset bytes are per-stage and must not be summed as deduplicated download payload.',rows};
await mkdir(out.substring(0,out.lastIndexOf('/')),{recursive:true});await writeFile(out,JSON.stringify(result,null,2));console.log(JSON.stringify({projectHash,allTenReplaysComplete:result.allTenReplaysComplete,completedReplays:rows.filter(r=>r.fullplay).map(r=>r.stage)}));
