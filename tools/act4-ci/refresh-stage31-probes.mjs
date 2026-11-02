/** Re-run real Engine inputs and require a fresh normal-UI Stage31 completion
 * before binding new probe results. Historical visual reviews stay historical.
 */
import fs from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {loadPilotRuntime} from '../stage31/pilot-runtime.mjs';
import {runtimeDigest,runProbe} from '../stage31/probes.mjs';
import {resolveManifest,createManifest,stagePayload} from '../stage31/package-manifest.mjs';
const [mode,dir]=process.argv.slice(2);if(!['prepare','attach'].includes(mode)||!dir)throw Error('prepare|attach output-directory');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
await fs.mkdir(dir,{recursive:true});process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false});await loadPilotRuntime(g);
const manifest=await read('tools/stage31/production-package.json'),project=resolveManifest(manifest,g.HONRO_PROJECT),id=manifest.stageId,digest=await runtimeDigest(),fingerprint=g.HonroProductionContract.fingerprint(project,id);
if(mode==='prepare'){
 const payload=stagePayload(project);
 await fs.writeFile('candidate31.json',JSON.stringify({stages:[payload.stage],library:payload.assets}));
 const inputs=await read('tools/stage31/evidence/probes/honro-stage31-input-probes-v4.json');
 const results=inputs.map(p=>({...runProbe(g,project,id,p),runtimeSha256:digest}));
 await fs.writeFile(dir+'/focused-probes.json',JSON.stringify({sourceCommit:process.env.GITHUB_SHA,fingerprint,digest,results},null,2));
 if(results.some(r=>r.result!=='pass'))throw Error('Current runtime Engine probe failure');
 console.log(JSON.stringify(results.map(r=>({id:r.id,result:r.result}))));
}else{
 const focused=await read(dir+'/focused-probes.json'),ui=await read(dir+'/stage31/result.json');
 if(focused.digest!==digest||focused.fingerprint!==fingerprint||!focused.results.every(r=>r.result==='pass')||ui.sourceCommit!==process.env.GITHUB_SHA||!ui.passed||!ui.complete||ui.errors.length||ui.final.phase!=='won'||ui.final.round>20||ui.final.heroes.length!==4||ui.final.heroes.some(u=>u.dead||u.hp<=0))throw Error('Missing current genuine Stage31 completion');
 const events=(await fs.readFile(dir+'/stage31/tactical-v8-events.jsonl','utf8')).trim().split('\n').map(JSON.parse);
 const objective={id:'boarding-objective',kind:'objective',runner:'honro-production-engine-v1',fingerprint,result:'pass',runtimeSha256:digest,scope:ui.scope,sourceRunId:Number(process.env.GITHUB_RUN_ID),sourceCommit:process.env.GITHUB_SHA,observations:[{freshUiResult:ui},...events.filter(e=>JSON.stringify(e).includes('boarding')).slice(-24)]};
 project.production.probeResults[id]=[...focused.results,objective];
 g.HonroProductionContract.assertExport(project,id);
 await fs.writeFile(dir+'/objective-probe.json',JSON.stringify(objective,null,2));
 await fs.writeFile('tools/stage31/production-package.json',JSON.stringify(createManifest(project),null,2)+'\n');
 console.log('Fresh Engine + normal UI objective probes attached; historical visual evidence was not regenerated.');
}
