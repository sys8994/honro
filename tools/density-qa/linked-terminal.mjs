/** Cold reload of a real final40 boundary; no prepared post31 profile or flags. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness} from '../../tests/app-regression-helpers.mjs';
import {runtimeDigest} from '../stage31/probes.mjs';
import {officialWorldIdentity} from './official-world-identity.mjs';
const [projectPath,boundaryPath,out]=process.argv.slice(2),sha=x=>createHash('sha256').update(x).digest('hex'),bytes=await readFile(boundaryPath),boundary=JSON.parse(bytes),projectBytes=await readFile(projectPath);
assert(boundary.success&&boundary.stage===40&&boundary.nextStage===null);assert.equal(boundary.projectSHA256,sha(projectBytes));assert.equal(await runtimeDigest(),boundary.runtimeSHA256);
process.env.HONRO_ACT4_RELEASE='1';const h=await appHarness({productionStory:true}),identity=await officialWorldIdentity(JSON.parse(projectBytes),h.g.HONRO_PROJECT);
for(const[k,v]of Object.entries(boundary.storage))h.storage.set(k,v);const app=h.reload();
assert(!app.customMap&&!app.debugMode&&!app.profile.honroBattle);assert.deepEqual(JSON.parse(JSON.stringify(h.g.HonroAct4Content.state(app.profile))),boundary.proof);
for(let n=31;n<=40;n++)assert(app.profile.cleared[n]&&app.profile.honroAct4.completed[n]?.success);
assert.equal(await runtimeDigest(),boundary.runtimeSHA256);
await writeFile(out,JSON.stringify({success:true,scope:'Cold official App reload of actual40 terminal storage; exact complete Act4 proof and31–40 clears preserved, no active unfinished battle. Not browser/UI or art approval.',identity,runtimeSHA256:boundary.runtimeSHA256,boundarySHA256:sha(bytes),proofRunId:app.profile.honroAct4.runId},null,2));
