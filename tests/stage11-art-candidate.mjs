import assert from 'node:assert/strict';
import vm from 'node:vm';
import {runtimeEntries,authorProjectExpression} from '../shared/build.mjs';
import {applyStage11ArtCandidate} from '../tools/act2-vector-production/apply-stage11-candidate.mjs';
const plain=v=>JSON.parse(JSON.stringify(v));process.env.HONRO_ACT2_STAGE11_CANDIDATE='0';
const entries=await runtimeEntries({vector:false,render:false,productionStory:true}),original=plain(entries.find(e=>e.name==='campaign').project),snapshot=JSON.stringify(original),before=original.stages.find(s=>s.metadata?.stageId===11);
assert.strictEqual(applyStage11ArtCandidate(original),original);delete process.env.HONRO_ACT2_STAGE11_CANDIDATE;
const next=applyStage11ArtCandidate(original),after=next.stages.find(s=>s.metadata?.stageId===11),assets=next.library.slice(original.library.length);
assert.equal(assets.length,7);assert(assets.some(a=>a.params.bodyTerrainIds.includes('v4.11.firing-rock')));assert.equal(JSON.stringify(original),snapshot);for(const key of Object.keys(before).filter(k=>k!=='elements'))assert.deepEqual(after[key],before[key]);assert.deepEqual(after.elements.slice(0,before.elements.length),before.elements);assert.equal(after.elements.length,before.elements.length+assets.length);assert.deepEqual(next.stages.filter(s=>s.metadata?.stageId!==11),original.stages.filter(s=>s.metadata?.stageId!==11));assert.deepEqual(next.library.slice(0,original.library.length),original.library);
const altered=plain(original);altered.stages.find(s=>s.metadata?.stageId===11).terrains[0].points[0].y++;assert.throws(()=>applyStage11ArtCandidate(altered),/geometry changed/);
const g=vm.createContext({console,performance,structuredClone,setTimeout,clearTimeout});g.window=g;for(const e of entries)vm.runInContext(e.code,g);
for(const a of assets){assert.deepEqual(Array.from(g.HonroVectorArt.validate(a.vector)),[]);assert.deepEqual(a.collision,[]);assert(a.id.startsWith('act2-traced:stage11-'));assert(!JSON.stringify(a).includes('data:image'));assert(a.vector.clips.canonicalSolid);assert(a.vector.clips.contactInset);}
g.STAGE11_CANDIDATE=next;const authored=vm.runInContext(authorProjectExpression('STAGE11_CANDIDATE'),g),actualBefore=g.HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===11),actualAfter=authored.stages.find(s=>s.metadata?.stageId===11);
const b0=g.HonroMaps.createBattle(actualBefore,g.HONRO_PROJECT),b1=g.HonroMaps.createBattle(actualAfter,authored);g.HonroStageRules.sanitizeStageBattle(b0);g.HonroStageRules.sanitizeStageBattle(b1);
assert.equal(before.terrains.length,31);assert.equal(actualBefore.terrains.length,33);assert.deepEqual(plain(actualAfter.terrains),plain(actualBefore.terrains));assert.deepEqual(plain(b1.terrain),plain(b0.terrain));assert.deepEqual(plain(b1.honroWorldTerrain),plain(b0.honroWorldTerrain));assert.deepEqual(plain(b1.units),plain(b0.units));assert.deepEqual(plain(g.HonroQuestTargets.records(b1)),plain(g.HonroQuestTargets.records(b0)));
for(const key of Object.keys(actualBefore).filter(k=>k!=='elements'))assert.deepEqual(plain(actualAfter[key]),plain(actualBefore[key]));
console.log(JSON.stringify({stage:11,assets:assets.length,preHookTerrains:31,effectiveTerrains:33,geometryWorldActorsCameraStoryAndSceneryPreserved:true,nativeFormat:true,browserAccepted:false,gameplayAccepted:false}));
