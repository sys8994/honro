/** Metadata-only release preparation. Never approves reviews or manufactures probes. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runtime} from '../../game/tests/helpers.mjs';
import {stagePayload,assertMatchingPayload,resolveShippedWorld} from '../stage31/check-release.mjs';
import {runtimeDigest} from '../stage31/probes.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const worldPath='shared/data/act4/world.json',projectPath='_local/reports/act4-silhouette-final-qa/project-pruned.json',packagePath='tools/stage31/production-package.json';
const wb=await fs.readFile(worldPath),pb=await fs.readFile(projectPath);
assert.equal(hash(wb),'1e7939fe0f9fd6cd8be0202807f0db74f7ed7958a212d480aa73d3e7ce72f0d4');
assert.equal(hash(pb),'7956c4ea8a2dde9afc583ecac1d9908a67203eb9397859fdff613850e6cbdd93');
const p=JSON.parse(pb),world=JSON.parse(wb),old=await read(packagePath),id='stage-31',card=structuredClone(old.production.cards[id]);
const s=p.stages.find(s=>s.id===id),used=new Set(s.elements.map(e=>e.assetId));
const byId=new Map(p.library.map(a=>[a.id,a]));
const refs=new Set(p.stages.filter(s=>card.referenceStages.includes(s.id)).flatMap(s=>[...(s.elements||[]),...(s.environment?.placements||[])].map(e=>e.assetId)));
card.assetExceptions=card.assetExceptions.filter(e=>used.has(e.assetId));
for(const assetId of used){if(refs.has(assetId)||card.assetExceptions.some(e=>e.assetId===assetId))continue;const a=byId.get(assetId),q=a.params||{};let reason;
 if(q.technicalContinuation)reason='Technical off-play BODY continuation registered to the exact native bank edge depth layers, avoiding a material seam; shares '+q.collisionSource+' classification, no independent collision.';
 else if(q.semanticLayer==='BODY')reason='Actual Inkscape source-authored blue-dawn bank silhouette, restrained internal planes; protected native outline is registered to '+q.collisionSource+' and is the authored physical contour, not a painted fake route.';
 else if(q.semanticLayer==='SURFACE')reason='Actual Inkscape wooden-route surface fitted to the existing '+q.collisionSource+'; preserves its physical platform, separates support art from standable surface.';
 else if(q.paletteRevision)reason='Stage31-only palette clone of '+q.paletteRevision.sourceId+': '+q.paletteRevision.role+'. Native outline and original collision preserved; other stages retain original assets.';
 else if(assetId==='a4-silhouette:quay-cargo-v1')reason='Reusable actual Inkscape cargo concept trace replaces only Act4 quay cargo artwork; original instance placement and collision-free decorative role retained; scale metadata covers actual .6 placement without scaling physics.';
 else throw Error('Unreviewed provenance reason required for '+assetId);
 card.assetExceptions.push({assetId,reason});}
card.budget.rationale='Current authored Stage31 has 13 enemies in four purpose groups, active limit 6, zero elites and no finite reinforcements. The existing low channel, short upper boardwalk, rising bank and landing groups are preserved while artwork is replaced. Their actual effectiveness requires the declared fresh probes and final play review; this card is not a pass.';
const stages=p.stages.filter(s=>[id,...card.referenceStages].includes(s.id));
const ids=new Set();function scan(v){if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){if((k==='assetId'||k.endsWith('AssetId'))&&typeof x==='string')ids.add(x);else if((k==='assetIds'||k.endsWith('AssetIds'))&&Array.isArray(x))for(const a of x){assert.equal(typeof a,'string');ids.add(a);}else if(x&&typeof x==='object')scan(x);}}
for(const st of stages)scan(st);for(const aid of ids){assert(byId.has(aid),'Missing asset '+aid);scan(byId.get(aid));}
const out={...p,stages,library:p.library.filter(a=>ids.has(a.id)),production:{version:1,cards:{[id]:card},reviews:{[id]:[]},probeResults:{[id]:[]}}};
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false}),P=g.HonroProductionContract,status=P.releaseStatus(out,id);assert.equal(status.machinePass,true,JSON.stringify(status.issues));assert.equal(status.exportAllowed,false);assert.equal(status.missingReviews.length,4);assert.equal(status.missingProbes.length,9);
assertMatchingPayload(await resolveShippedWorld(world),out);
const fp=P.fingerprint(out,id),test=structuredClone(out);test.production.reviews[id]=[{pending:true}];test.production.probeResults[id]=[{pending:true}];assert.equal(P.fingerprint(test,id),fp);
const report={status:'design-card-frozen-evidence-pending',worldSha256:hash(wb),projectSha256:hash(pb),runtimeSha256:await runtimeDigest(),stage31TransitivePayloadSha256:hash(JSON.stringify(stagePayload(out))),fingerprint:fp,stages:stages.map(s=>s.id),assetCount:out.library.length,machinePass:status.machinePass,missingReviews:status.missingReviews,missingProbes:status.missingProbes,reviewCriteria:P.reviewCriteria,reviewViews:P.reviewViews,reviewerPolicy:'Record actual assistant reviewer /root and evidence scope. No user or human approval is claimed or required by this schema. Pending evidence is not a pass.',identityPolicy:'Separate production package metadata only. Frozen world/project bytes remain unchanged. Card participates in contract fingerprint; reviews and probeResults do not. Transitive payload SHA and runtime SHA supplement the direct-asset contract fingerprint.'};
await fs.writeFile(packagePath,JSON.stringify(out));await fs.writeFile('tools/stage31/release-binding-plan.json',JSON.stringify(report,null,2)+'\n');
assert.equal(hash(await fs.readFile(worldPath)),hash(wb));assert.equal(hash(await fs.readFile(projectPath)),hash(pb));console.log(JSON.stringify({...report,reviewCriteria:undefined,reviewViews:undefined},null,2));
