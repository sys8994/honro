/** Reuse the existing stage's ordinary-input policy with the linked entry adapter.
 * This emits a new tape from actual carried state; it never copies completion flags. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {runtimeDigest} from '../stage31/probes.mjs';
import {configureLinkedPolicy} from './linked-policy-adapter.mjs';
const [worldPath,stageText,out,priorPath]=process.argv.slice(2),stage=+stageText,sha=x=>createHash('sha256').update(x).digest('hex');
assert(stage>=31&&stage<=40);const worldBytes=await readFile(worldPath),runtimeSHA256=await runtimeDigest(),prior=priorPath?JSON.parse(await readFile(priorPath)):null;
const policyPath=stage===31?'tools/density-qa/generate31-checkpointed.mjs':stage===32?'tools/density-qa/generate32-checkpointed.mjs':stage===33?'tools/density-qa/generate33-checkpointed.mjs':stage===34?'tools/density-qa/generate34-checkpointed.mjs':stage===36?'tools/stage36-bank-v4/play-inputs.mjs':stage===38?'tools/density-qa/generate38-precise-finisher.mjs':`tools/stage${stage}-production/play-inputs.mjs`;
const original=await readFile(policyPath,'utf8'),base=pathToFileURL(resolve(policyPath)),adapterURL=pathToFileURL(resolve('tools/density-qa/linked-policy-adapter.mjs')).href;
let rewrites=0,source=original.replace(/from\s*(['"])([^'"]+)\1/g,(all,quote,spec)=>{if(spec.endsWith('/app-adapter.mjs')||spec==='./app-adapter.mjs'){rewrites++;return `from '${adapterURL}'`;}return spec.startsWith('.')?`from '${new URL(spec,base).href}'`:all;});assert.equal(rewrites,1,'Exactly one stage-entry adapter must be replaced');
const tickPoint='a.tick();frames++;';assert.equal(source.split(tickPoint).length,2,'Known policy tick instrumentation point required');source=source.replace(tickPoint,tickPoint+'linkedPolicyCheckpoint(inputs,frames,entryBuild);');source=`import {linkedPolicyCheckpoint} from '${adapterURL}';\n`+source;
let omittedInspectionCamera=false;if(stage===36){const line="const active=e.active;if(active){log({op:'camera',x:active.x,y:active.y-100,scale:.6});a.camera(active.x,active.y-100,.6);}";assert(source.includes(line));source=source.replace(line,'/* Use actual ordinary Scene follow; no inspection camera relocation. */');omittedInspectionCamera=true;}
await mkdir(out,{recursive:true});await mkdir(out+'/atomic-linked-prefix',{recursive:true});
configureLinkedPolicy({stage,out,prior,worldSHA256:sha(worldBytes),runtimeSHA256});
const entryBuild=prior?.entryBuild||'campaign-spent-v1';
await writeFile(out+'/policy-receipt.json',JSON.stringify({status:'prepared-not-executed',stage,worldSHA256:sha(worldBytes),runtimeSHA256,entryBuild,previousBoundarySHA256:priorPath?sha(await readFile(priorPath)):null,policyPath,originalPolicySHA256:sha(original),executedPolicySHA256:sha(source),omittedInspectionCamera,scope:'Only entry adapter, checkpoint observer, and stage36 inspection-camera omission differ; ordinary movement/combat/objective policy retained. Generated tape is not a linked pass.'},null,2));
process.argv=[process.execPath,resolve(policyPath),resolve(worldPath),resolve(out),entryBuild];
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
assert.equal(await runtimeDigest(),runtimeSHA256);assert.equal(sha(await readFile(worldPath)),sha(worldBytes));
const result=JSON.parse(await readFile(out+'/result.json'));await writeFile(out+'/policy-completed.json',JSON.stringify({stage,success:result.success,reason:result.reason,frames:result.frames,worldSHA256:sha(worldBytes),runtimeSHA256,tapeSHA256:sha(await readFile(out+'/inputs.json')),scope:'Actual policy-generated inputs from genuine carried entry. Separate linked replay must validate midContinue/outcome/Next and write boundary.'},null,2));
