/** Reusable, bounded Stage31 checks through the original constrained runners.
 * No art approval, export, state mutation, generated wins or fixture actor poses. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../../game/tests/helpers.mjs';
import {runProbe,runObjectiveProbe,runtimeDigest} from '../stage31/probes.mjs';
const [draft,out]=process.argv.slice(2);if(!out)throw Error('Usage: verify-gates.mjs draft.json output-directory');
process.env.HONRO_ACT4_RELEASE='1';await mkdir(out,{recursive:true});
const project=JSON.parse(await readFile(draft,'utf8')),g=await runtime({legacyMaps:false}),runtimeSha256=await runtimeDigest(),results=[],inputs=[];
for(const name of ['route','shot','enemy','objective']){const path=`tests/fixtures/stage31-production/${name}-inputs.json`,bytes=await readFile(path);inputs.push({path,sha256:createHash('sha256').update(bytes).digest('hex')});for(const spec of JSON.parse(bytes)){
 const result=spec.kind==='objective'?await runObjectiveProbe(project,'stage-31',spec):runProbe(g,project,'stage-31',spec);
 results.push({...result,runtimeSha256});console.log(result.id,result.result);await writeFile(out+'/probe-results.json',JSON.stringify({version:1,stageId:'stage-31',inputs,results},null,2)+'\n');
}}
assert.equal(await runtimeDigest(),runtimeSha256,'Runtime changed during verification; rerun against stable source');
assert(results.every(r=>r.result==='pass'),'One or more real input checks failed; no export approval');
console.log('All declared input checks passed; art review and release remain separate.');
