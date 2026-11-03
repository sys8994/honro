/** Restore byte-exact genuine CI evidence; never mint or rewrite an attestation.
 * check-release.mjs must still verify current payload/runtime and visual hashes.
 */
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const file='tools/stage31/evidence/measured-reuse/41508193400-package.json';
const bytes=await fs.readFile(file),sha256=createHash('sha256').update(bytes).digest('hex');
if(sha256!=='89fb4b5754f5c6bb2eeb2e7563ab177830224a4e5f56e056241fe87a274833a6')throw Error('Captured Stage31 package bytes changed');
const p=JSON.parse(bytes),rows=p.production.probeResults[p.stageId],objective=rows.find(r=>r.id==='boarding-objective');
if(p.stageId!=='stage-31'||!objective||objective.sourceRunId!==41508193400||objective.sourceCommit!=='ff45acbdfb1f0039ce26bfbcb83d89e3df395f4b'||rows.some(r=>r.result!=='pass'||r.runtimeSha256!=='9a8ece786de541bd12a863c3c3f2cf08c30381b437edd66dadfe07c702c957be'))throw Error('Unexpected genuine evidence provenance');
await fs.writeFile('tools/stage31/production-package.json',bytes);
console.log(JSON.stringify({sourceRunId:41508193400,sourceArtifactId:13174560385,sourceCommit:objective.sourceCommit,packageSha256:sha256,measuredRuntimeSha256:objective.runtimeSha256,scope:'Exact captured package restored; current production gate still required.'}));
