/** Production export gate. Draft import never implies approval. */
import vm from 'node:vm';
import path from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const [command='audit',file,stageId='stage-31',destination]=process.argv.slice(2),g=await runtime({legacyMaps:false}),P=g.HonroProductionContract;
const project=file?JSON.parse(await readFile(file,'utf8')):JSON.parse(JSON.stringify(g.HONRO_PROJECT));
if(command==='seed'){
 const draft=P.begin(project,stageId);await mkdir('_local/reports/stage31-direct',{recursive:true});const out=destination||'_local/reports/stage31-direct/production-draft.json';await writeFile(out,JSON.stringify(draft,null,2)+'\n');console.log(out);
}else if(command==='audit'){
 const report=P.releaseStatus(project,stageId);console.log(JSON.stringify(report,null,2));process.exitCode=report.exportAllowed?0:2;
}else if(command==='export'){
 if(!file||!destination)throw Error('Usage: contract.mjs export draft.json stage-31 output.json');
 const report=P.assertExport(project,stageId),base=path.dirname(path.resolve(file));
 // A typed filename or forged hash is not a screenshot: verify actual bytes.
 for(const review of project.production.reviews[stageId])if(review.fingerprint===report.fingerprint)for(const evidence of review.evidence){const target=path.resolve(base,evidence.path);if(!target.startsWith(base+path.sep))throw Error('Evidence must be inside the review package');const bytes=await readFile(target),hash=createHash('sha256').update(bytes).digest('hex');if(hash!==evidence.sha256)throw Error('Evidence hash mismatch: '+evidence.path);}
 const output={...project,productionReceipt:{version:1,stageId,fingerprint:report.fingerprint,sourceSha256:createHash('sha256').update(P.source(project,stageId)).digest('hex'),machineChecks:'pass',humanReviews:'recorded-not-automatically-approved'}};
 await writeFile(destination,JSON.stringify(output,null,2)+'\n');console.log('Validated production package:',destination);
}else throw Error('Commands: seed, audit, export');
