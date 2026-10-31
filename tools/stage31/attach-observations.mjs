/** Attach genuine probe output only to the exact draft/runtime that produced it.
 * This does not create reviews or turn a partial draft into an export. */
import {readFile,writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {loadPilotRuntime} from './pilot-runtime.mjs';
import {runtimeDigest} from './probes.mjs';
const [draftFile,resultFile,outFile]=process.argv.slice(2);
if(!draftFile||!resultFile||!outFile)throw Error('Usage: attach-observations.mjs draft.json results.json output.json');
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false});await loadPilotRuntime(g);
const draft=JSON.parse(await readFile(draftFile,'utf8')),record=JSON.parse(await readFile(resultFile,'utf8'));
const id=record.stageId,card=draft.production?.cards?.[id],fingerprint=g.HonroProductionContract.fingerprint(draft,id),digest=await runtimeDigest();
if(!card||!Array.isArray(record.results)||!record.results.length)throw Error('Missing declared stage or observations');
const seen=new Set();for(const r of record.results){
 if(seen.has(r.id))throw Error('Duplicate probe ID: '+r.id);seen.add(r.id);
 if(!card.requiredProbes.some(v=>v.id===r.id&&v.kind===r.kind)||r.fingerprint!==fingerprint||r.runtimeSha256!==digest||r.runner!=='honro-production-engine-v1'||r.result!=='pass'||!r.observations?.length)throw Error('Unverified or stale probe: '+r.id);
}
draft.production.probeResults??={};draft.production.probeResults[id]=record.results;
const status=g.HonroProductionContract.releaseStatus(draft,id);
if(status.exportAllowed)throw Error('Partial probe attachment unexpectedly claims release readiness');
await writeFile(outFile,JSON.stringify(draft));
console.log(JSON.stringify({fingerprint,digest,attached:record.results.map(r=>r.id),issues:status.issues.length,missingProbes:status.missingProbes,missingReviews:status.missingReviews,exportAllowed:status.exportAllowed}));
