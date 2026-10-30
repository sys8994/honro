import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {legacyStagePayload,stagePayload,mergeShippedWorld,resolveShippedWorld,assertMatchingPayload,checkRelease} from '../tools/stage31/check-release.mjs';
const clone=structuredClone;
const stage={id:'stage-31',metadata:{stageId:31},elements:[{assetId:'shared'}],design:{layers:[{assetIds:['design']}]}};
const campaign={stages:[],library:[{id:'shared',color:'compiled',childAssetId:'dependency'},{id:'dependency',assetId:'shared'}]};
const act4={stages:[stage],library:[{id:'shared',color:'raw-override'},{id:'design'}]};
const shipped=mergeShippedWorld(campaign,act4),pkg=clone(shipped);
assert.equal(stagePayload(shipped).assets.find(a=>a.id==='shared').color,'compiled','Compiled campaign wins shared IDs');
assert.deepEqual(stagePayload(shipped).assets.map(a=>a.id),['dependency','design','shared'],'Design references and cyclic dependency closure are retained');
assertMatchingPayload(shipped,pkg);
for(const id of ['shared','design','dependency']){
 const changed=clone(pkg);changed.library.find(a=>a.id===id).color='changed';
 assert.throws(()=>assertMatchingPayload(shipped,changed),/differs/,'Changed required asset: '+id);
 const missing=clone(pkg);missing.library=missing.library.filter(a=>a.id!==id);
 assert.throws(()=>assertMatchingPayload(shipped,missing),/Missing Stage31 release asset/,'Missing required asset: '+id);
}
const replaced=clone(pkg);replaced.stages[0].id='replacement';assert.throws(()=>assertMatchingPayload(shipped,replaced),/differs/);
assert.throws(()=>stagePayload({...pkg,stages:[]}),/Exactly one/);
assert.throws(()=>stagePayload({...pkg,stages:[stage,clone(stage)]}),/Exactly one/);
const irrelevant=clone(pkg);irrelevant.library.push({id:'unused',color:'anything'});assertMatchingPayload(shipped,irrelevant);
const policy=JSON.parse(await readFile('tools/stage31/release-policy.json'));
assert.equal(policy.legacyUnapprovedSha256,'9a014da58307bd7b076f2d82974b2d02464302e39598cf6dbeb3bd24101b21b7','Historical exception must not be rewritten');
const world=JSON.parse(await readFile('shared/data/act4/world.json'));
const legacyHash=createHash('sha256').update(JSON.stringify(legacyStagePayload(world))).digest('hex');
if(legacyHash===policy.legacyUnapprovedSha256)await checkRelease();
// Optional real candidate integration: validates exact compiled payload and then
// proves that machine/probe success cannot replace still-pending visual reviews.
if(process.argv[2]){
 const worldFile=process.argv[2],packageFile=process.argv[3];
 assert(packageFile,'Supply candidate world and production draft together');
 const candidate=JSON.parse(await readFile(worldFile)),draft=JSON.parse(await readFile(packageFile));
 const resolved=await resolveShippedWorld(candidate);assertMatchingPayload(resolved,draft);
 process.env.HONRO_ACT4_RELEASE='1';
 const {runtime}=await import('../game/tests/helpers.mjs');
 const g=await runtime({legacyMaps:false}),status=g.HonroProductionContract.releaseStatus(draft,'stage-31');
 assert.equal(status.machinePass,true,JSON.stringify(status.issues));
 assert.equal(status.missingProbes.length,0,'All actual declared probes must remain current');
 assert(status.missingReviews.length>0,'The draft must not acquire automatic visual approval');
 assert.equal(status.exportAllowed,false);
 await assert.rejects(checkRelease({worldFile,packageFile}),/실제 검수 미확인\/만료/);
 console.log('Real candidate: exact compiled shared payload matches; machine audit and probes pass; pending reviews still block export.');
}
console.log('Stage31 payload regressions passed: precedence, design/dependency closure, changed/missing assets, replaced stage, and immutable legacy allowance.');
