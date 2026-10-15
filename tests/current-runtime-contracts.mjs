import {beforeStage5Lake} from './stage5-lake-history-helpers.mjs';
import {beforeLakeManifest,beforeLakeSources,beforeLakeSource} from './stage5-lake-runtime-history.mjs';
import {beforeTempleManifest,beforeTempleSource,beforeTempleSources,assertTempleNegatives} from './temple-testimony-history.mjs';
import {beforeEvidenceManifest,beforeEvidenceSource,beforeEvidenceSources,assertEvidenceNegatives} from './evidence-quests-revision-history.mjs';
import {beforeMaterialManifest,beforeMaterialSource,beforeMaterialSources,assertMaterialNegatives} from './material-graphics-revision-history.mjs';
import {beforeDocumentManifest,beforeDocumentSource,beforeDocumentSources,assertDocumentNegatives} from './document-reader-revision-history.mjs';
import {beforeBodyManifest,beforeBodySource,beforeBodySources,assertBodyNegatives} from './p0-body-revision-history.mjs';
import {beforeCharacterArtManifest,beforeCharacterArtSource,beforeCharacterArtSources,assertCharacterArtNegatives} from './character-art-revision-history.mjs';
import {storyRuntimeDelta,storyRevisionApproval,beforeStorySourceRows,beforeStoryProjectPart} from './act23-story-revision-history.mjs';
import {assertExactStoryJsonNegatives,applyExactStoryJsonDelta} from './exact-story-revision-delta.mjs';
import {SHARED_BEGIN,SHARED_END} from '../shared/playtest-template.mjs';
import {assertExactFollowupDelta,assertExactFollowupDeltaChain} from './ui-followup-source-delta.mjs';
/** Production identity, archive identity and behavior are distinct gates. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {runtimeParts,modelFiles} from '../shared/build.mjs';
import {buildCore} from '../game/engine/build.mjs';
import {runtimeContractHash as hash,currentRuntimeManifest as lakeManifest,currentRuntimeSources,assertCurrentRuntimeSources,assertCurrentRuntimeParts,assertCurrentBuildGraph} from './current-runtime-contract-helpers.mjs';
import {historicalRuntimeSources,historicalRuntimeParts,sourceHistoryInput} from './historical-runtime-inputs.mjs';
import {beforeEncounterDensityRuntimeSources,encounterDensityHistory} from './encounter-density-history-helpers.mjs';
import {beforeStage8BierRuntimeSources,beforeStage8BierFingerprintParts,beforeStage18BellFingerprintParts,stage8BierReview,stage18BellHistoryDelta} from './stage8-bier-history-helpers.mjs';
const liveManifest=beforeLakeManifest(lakeManifest),liveSources=currentRuntimeSources(),archive=historicalRuntimeSources();assertCurrentRuntimeSources(liveSources);
const templeNegatives=assertTempleNegatives(liveManifest,beforeLakeSources(liveSources)),beforeTestimonyManifest=beforeTempleManifest(liveManifest),beforeTestimonySources=beforeTempleSources(beforeLakeSources(liveSources));
const evidenceNegatives=assertEvidenceNegatives(beforeTestimonyManifest,beforeTestimonySources),beforeQuestManifest=beforeEvidenceManifest(beforeTestimonyManifest),beforeQuestSources=beforeEvidenceSources(beforeTestimonySources);
const materialNegatives=assertMaterialNegatives(beforeQuestManifest,beforeQuestSources),beforeGraphicsManifest=beforeMaterialManifest(beforeQuestManifest),beforeGraphicsSources=beforeMaterialSources(beforeQuestSources);
const documentNegatives=assertDocumentNegatives(beforeGraphicsManifest,{...beforeGraphicsSources,'game/src/presentation.css':beforeEvidenceSource('game/src/presentation.css',readFileSync('game/src/presentation.css','utf8'))}),beforeReaderManifest=beforeDocumentManifest(beforeGraphicsManifest),beforeReaderSources=beforeDocumentSources(beforeGraphicsSources);
const bodyNegatives=assertBodyNegatives(beforeReaderManifest,beforeReaderSources),beforeP0Manifest=beforeBodyManifest(beforeReaderManifest),beforeP0Sources=beforeBodySources(beforeReaderSources);
const characterArtNegatives=assertCharacterArtNegatives(beforeP0Manifest,beforeP0Sources);
// Only historical approval proofs below consume the exact reversed art snapshot.
let f=beforeCharacterArtManifest(beforeP0Manifest),sources=beforeCharacterArtSources(beforeP0Sources);
const priorApprovals=f.approvedDeltas.slice(0,-1);assert.deepEqual(f.approvedDeltas.at(-1),storyRuntimeDelta);
assert.equal(storyRuntimeDelta.baseCurrentCommit,'4a601580d1a55d9455c0bb25aeb9db3e7613c529');
assert.equal(storyRuntimeDelta.sourceCommit,'32289215db67589e4dece6742d130dfc6aca4893');
assert.deepEqual(storyRuntimeDelta.sourceChanges.map(change=>change.path),['shared/build.mjs','shared/engine/src/engine.ts','shared/runtime/act3-void.js','shared/runtime/bell-anomaly.js','shared/runtime/main.js','shared/runtime/renderer.js','shared/runtime/stake-crossing.js','shared/runtime/story-anomaly-art.js','shared/runtime/story-canon-v1.js','shared/runtime/world.js']);
assert.deepEqual(storyRuntimeDelta.packagingChanges.map(change=>change.path),['game/build.mjs','game/src/act3-void.css','tools/map-forge/story-anomaly-revision.mjs']);
assert.deepEqual(f.currentCounts,{sources:167,added:34,changed:89,unchanged:44});
const finalDelta=f.approvedDeltas.find(d=>d.kind==='final-waterfall-companion-ai'),bodyDelta=f.approvedDeltas.find(d=>d.kind==='stage5-body-fluid-separation'),uiDelta=f.approvedDeltas.find(d=>d.kind==='compact-ui-title-rest-prop'),titleDelta=f.approvedDeltas.find(d=>d.kind==='title-weathered-ash-vertical-reading'),audioDelta=f.approvedDeltas.find(d=>d.kind==='dialogue-sfx-title-bgm-start'),skillDelta=f.approvedDeltas.find(d=>d.kind==='enemy-prison-and-splitting-reflection'),inspectorDelta=f.approvedDeltas.find(d=>d.kind==='prison-inspection-and-captive-overlays'),combatDelta=f.approvedDeltas.find(d=>d.kind==='sword-area-and-act1-defense'),helpDelta=f.approvedDeltas.find(d=>d.kind==='counter-area-help'),audioP0Delta=f.approvedDeltas.find(d=>d.kind==='audio-touch-first-gain-and-title-subtitle'),restBalanceDelta=f.approvedDeltas.find(d=>d.kind==='rest-panorama-lure-and-support-balance'),questDelta=f.approvedDeltas.find(d=>d.kind==='hostile-quest-targets-and-clear-campaign-dialogue');
assert(finalDelta&&bodyDelta&&uiDelta&&titleDelta&&audioDelta&&skillDelta&&inspectorDelta&&combatDelta&&helpDelta&&audioP0Delta&&restBalanceDelta&&questDelta);assert.equal(finalDelta.sourceChanges.length,20);assert.equal(bodyDelta.sourceChanges.length,5);
assert.deepEqual(finalDelta.afterBuilds,bodyDelta.beforeBuilds);assert.equal(finalDelta.afterCoreSha256,bodyDelta.beforeCoreSha256);
assert.deepEqual(bodyDelta.afterBuilds,uiDelta.beforeBuilds);assert.equal(bodyDelta.afterCoreSha256,uiDelta.beforeCoreSha256);
assert.deepEqual(uiDelta.afterBuilds,titleDelta.beforeBuilds);assert.equal(uiDelta.afterCoreSha256,titleDelta.beforeCoreSha256);
assert.deepEqual(titleDelta.afterBuilds,audioDelta.beforeBuilds);assert.equal(titleDelta.afterCoreSha256,audioDelta.beforeCoreSha256);
assert.deepEqual(audioDelta.afterBuilds,skillDelta.beforeBuilds);assert.equal(audioDelta.afterCoreSha256,skillDelta.beforeCoreSha256);assert.deepEqual(skillDelta.afterBuilds,inspectorDelta.beforeBuilds);assert.deepEqual(inspectorDelta.afterBuilds,combatDelta.beforeBuilds);assert.deepEqual(combatDelta.afterBuilds,helpDelta.beforeBuilds);assert.deepEqual(helpDelta.afterBuilds,audioP0Delta.beforeBuilds);assert.deepEqual(audioP0Delta.afterBuilds,restBalanceDelta.beforeBuilds);assert.deepEqual(restBalanceDelta.afterBuilds,questDelta.beforeBuilds);assert.deepEqual(questDelta.afterBuilds,storyRuntimeDelta.beforeBuilds);assert.equal(skillDelta.afterCoreSha256,inspectorDelta.beforeCoreSha256);assert.equal(inspectorDelta.afterCoreSha256,combatDelta.beforeCoreSha256);assert.equal(combatDelta.afterCoreSha256,helpDelta.beforeCoreSha256);assert.equal(helpDelta.afterCoreSha256,audioP0Delta.beforeCoreSha256);assert.equal(audioP0Delta.afterCoreSha256,restBalanceDelta.beforeCoreSha256);assert.equal(restBalanceDelta.afterCoreSha256,questDelta.beforeCoreSha256);assert.equal(questDelta.afterCoreSha256,storyRuntimeDelta.beforeCoreSha256);assert.notEqual(inspectorDelta.beforeCoreSha256,inspectorDelta.afterCoreSha256);assert.notEqual(audioDelta.beforeCoreSha256,audioDelta.afterCoreSha256);assert.equal(uiDelta.beforeCoreSha256,uiDelta.afterCoreSha256,'Follow-up UI/navigation/art does not change compiled gameplay');
assert.equal(titleDelta.beforeCoreSha256,titleDelta.afterCoreSha256,'Title-only refinement does not change compiled gameplay');
assert.deepEqual(uiDelta.sourceChanges.map(c=>c.path),['shared/runtime/main.js','shared/runtime/rest-journey.js','shared/runtime/story-act1-art.js']);
assert.deepEqual(uiDelta.packagingChanges.map(c=>c.path),['game/build.mjs']);
assert.deepEqual(titleDelta.sourceChanges.map(c=>c.path),['shared/runtime/main.js']);
assert.deepEqual(titleDelta.packagingChanges.map(c=>c.path),['game/src/title.css']);
assert.match(titleDelta.sourceCommit,/^[0-9a-f]{40}$/);assert.equal(titleDelta.baseCurrentCommit,'85cdf1b1e7875e3f4aac1fff350a6f62a9be8305');
assert.equal(priorApprovals.at(-9),titleDelta);assert.equal(priorApprovals.at(-8),audioDelta);assert.equal(hash(priorApprovals.slice(0,-9)),'fb201dffe122dc9283131482e42cdbcfaf99f83426eebcbfebbdcc22b5936d31','Every prior approval and its historical build evidence remains unchanged');
assert.equal(hash(priorApprovals.slice(0,-8)),'d823e0905ee08af639da23180003517c6cc92176e2e2f491a723623dc05cb1ae','Every pre-audio approval including title build evidence is immutable');
assert.deepEqual(audioDelta.sourceChanges.map(c=>c.path),['shared/engine/src/bgm.ts','shared/engine/src/sound-design.ts','shared/runtime/story.js']);
assert.deepEqual(audioDelta.packagingChanges,[]);assert.equal(audioDelta.baseCurrentCommit,'28b829abb3a108f522be9f35aceca4795de637bd');assert.equal(audioDelta.sourceCommit,'3b848ddb72d4dc7ccacfe86c5bf999509868b9c3');

assert.equal(priorApprovals.at(-7),skillDelta);
assert.equal(hash(priorApprovals.slice(0,-7)),'3f2b98b5bce6d50ae5c8c25dc9d57c1b061499d339674f943f485d3e0a3c5dbd','Every pre-skill approval, including audio, is immutable');
assert.equal(skillDelta.beforeApprovedDeltasSha256,'3f2b98b5bce6d50ae5c8c25dc9d57c1b061499d339674f943f485d3e0a3c5dbd');
assert.equal(skillDelta.baseCurrentCommit,'26a53350b9e51d0b45e6441f6ca91250ce3d9cab');
assert.match(skillDelta.sourceCommit,/^[0-9a-f]{40}$/);
assert.deepEqual(skillDelta.sourceChanges.map(c=>c.path),["shared/engine/src/eaterMechanics.ts", "shared/engine/src/enemyAI.ts", "shared/engine/src/engine.ts", "shared/engine/src/existence.ts", "shared/engine/src/occultData.ts", "shared/engine/src/occultMechanics.ts", "shared/engine/src/progression.ts", "shared/engine/src/skillLore.ts", "shared/engine/src/skillMechanics.ts", "shared/engine/src/skillNotes.ts", "shared/engine/src/skillRedesignData.ts", "shared/engine/src/skillVisuals.ts", "shared/engine/src/spBalanceModel.ts", "shared/engine/src/store.ts", "shared/engine/src/types.ts", "shared/engine/src/warriorMechanics.ts", "shared/engine/src/waveReflection.ts", "shared/runtime/act2-art.js", "shared/runtime/act2.js", "shared/runtime/act3-objectives.js", "shared/runtime/actor-vector.js", "shared/runtime/allies.js", "shared/runtime/authored.js", "shared/runtime/main.js", "shared/runtime/objective-guidance.js", "shared/runtime/objectives.js", "shared/runtime/progression.js", "shared/runtime/renderer.js", "shared/runtime/stage11-ravine-encounters.js", "shared/runtime/story.js"],'Exact reviewed skill-only source membership');
assert.deepEqual(skillDelta.packagingChanges,[]);
assert.deepEqual(skillDelta.sourceChanges.filter(c=>c.previousKind===null).map(c=>c.path),['shared/engine/src/eaterMechanics.ts','shared/engine/src/waveReflection.ts']);
assert.equal(hash(skillDelta.beforeEngineFiles),'37a6f1abc98d958fd27b2c2e3e0232a0ad4cfdef765cca2cb3bc8161fc147538');
assert.deepEqual(f.engineFiles,[...skillDelta.beforeEngineFiles,'shared/engine/src/eaterMechanics.ts','shared/engine/src/waveReflection.ts'].sort());
assert.deepEqual(questDelta.beforeModelFiles,skillDelta.beforeModelFiles,'Every prior runtime model registration is unchanged');assert.deepEqual(storyRuntimeDelta.beforeModelFiles,[...questDelta.beforeModelFiles,'quest-targets'],'Only one approved model append');assert.deepEqual(f.engineFiles,questDelta.beforeEngineFiles,'No new compiler source registration');
assert.equal(priorApprovals.at(-6),inspectorDelta);
assert.equal(hash(priorApprovals.slice(0,-6)),'97d66fda218f29302e1f0dc63bcd4bd4952903e79eb6a66417417f812b4645c5','The entire completed skill approval remains immutable');
assert.equal(inspectorDelta.beforeApprovedDeltasSha256,'97d66fda218f29302e1f0dc63bcd4bd4952903e79eb6a66417417f812b4645c5');
assert.equal(inspectorDelta.baseCurrentCommit,'d03915bc5cf213cd56dc5c9a7036e53ebe7bb773');assert.match(inspectorDelta.sourceCommit,/^[a-f0-9]{40}$/);
assert.deepEqual(inspectorDelta.sourceChanges.map(c=>c.path),['shared/engine/src/warriorVisuals.ts','shared/runtime/combat-feedback.js','shared/runtime/unit-info.js']);assert.deepEqual(inspectorDelta.packagingChanges,[]);
assert.deepEqual(inspectorDelta.sourceChanges.map(c=>c.exactEdits.length),[1,1,3]);for(const change of inspectorDelta.sourceChanges)for(const edit of change.exactEdits){assert.equal(edit.before.length,1);assert.equal(edit.after.length,1);}
assert.equal(priorApprovals.at(-5),combatDelta);
assert.equal(hash(priorApprovals.slice(0,-5)),'bd5208b8cc7160bf4eadd1702159b20940ae55ffe989a943a5e9c1eb5fe67e77','Every completed approval and historical build stays immutable');
assert.equal(combatDelta.beforeApprovedDeltasSha256,'bd5208b8cc7160bf4eadd1702159b20940ae55ffe989a943a5e9c1eb5fe67e77');
assert.equal(combatDelta.baseCurrentCommit,'ad9b0c54ca960cb087ece043b18d248343c89a87');assert.match(combatDelta.sourceCommit,/^[a-f0-9]{40}$/);
assert.deepEqual(combatDelta.sourceChanges.map(c=>c.path),["shared/engine/src/warriorData.ts", "shared/engine/src/warriorMechanics.ts", "shared/map/compiler.js", "shared/runtime/act1-roster.js", "shared/runtime/stage-rules.js", "shared/runtime/world.js"]);assert.deepEqual(combatDelta.packagingChanges,[]);
assert.equal(priorApprovals.at(-4),helpDelta);
assert.equal(hash(priorApprovals.slice(0,-4)),'2cf4736d28918ba12e2309caa40e8ea56dc15b87f11a0736fea2c7b2f24b834b','All earlier approvals remain immutable');assert.equal(helpDelta.beforeApprovedDeltasSha256,'2cf4736d28918ba12e2309caa40e8ea56dc15b87f11a0736fea2c7b2f24b834b');
assert.equal(helpDelta.baseCurrentCommit,'c4b4a2d1fdb42e44b84d6f888a7a1f0b3317ab82');assert.match(helpDelta.sourceCommit,/^[a-f0-9]{40}$/);
assert.deepEqual(helpDelta.sourceChanges.map(c=>c.path),['shared/engine/src/progression.ts','shared/engine/src/skillNotes.ts']);assert.deepEqual(helpDelta.packagingChanges,[]);
const counterHelpReplacements=[['근접한 첫 적 1회','전방 범위의 적 모두 · 1회'],['적의 차례에 가까운 첫 적을 한 번 반격합니다.','적의 차례에 적이 가까이 들어오면 전방 범위의 적들을 한 번 반격합니다.']];
for(const [i,change] of helpDelta.sourceChanges.entries()){assert.equal(change.exactEdits.length,1);const edit=change.exactEdits[0];assert.equal(edit.before.length,1);assert.equal(edit.after.length,1);assert.equal(edit.beforeLine,edit.afterLine);const [before,after]=counterHelpReplacements[i];assert.equal(edit.after[0],edit.before[0].replace(before,after),'Only the approved S08 help string changes; numeric formulas and gameplay are exact');}
assert.equal(priorApprovals.at(-3),audioP0Delta);
assert.equal(hash(priorApprovals.slice(0,-3)),'f9233644ac36d9f39f5904a17f3d597f4bf2c1895ca4d587f7daa4e2795ae1ae','All prior approvals and historical builds remain immutable');assert.equal(audioP0Delta.beforeApprovedDeltasSha256,'f9233644ac36d9f39f5904a17f3d597f4bf2c1895ca4d587f7daa4e2795ae1ae');
assert.equal(audioP0Delta.baseCurrentCommit,'5bbf19f745e856db76b26437705c8b9871369d01');assert.equal(audioP0Delta.sourceCommit,'6fbd12640610d94aaa5fa7fa821ad8468bf6b4e7');
assert.deepEqual(audioP0Delta.sourceChanges.map(c=>c.path),["shared/engine/src/bgm.ts", "shared/engine/src/main.ts", "shared/engine/src/sound-design.ts", "shared/runtime/main.js"]);assert.deepEqual(audioP0Delta.packagingChanges,[]);
assert.deepEqual(audioP0Delta.sourceChanges.map(c=>c.exactEdits.length),[3, 5, 6, 2],'Exact audio activation, initial gain, and title subtitle edit membership');
assert.equal(priorApprovals.at(-2),restBalanceDelta);
assert.equal(hash(priorApprovals.slice(0,-2)),'b09272ebc9cedd17d201df050112dec3587e6260abdd31e9eb19af9874127378','All prior approvals including completed P0 and historical builds remain immutable');assert.equal(restBalanceDelta.beforeApprovedDeltasSha256,'b09272ebc9cedd17d201df050112dec3587e6260abdd31e9eb19af9874127378');
assert.equal(restBalanceDelta.baseCurrentCommit,'3f66b70f5bbe446778a21f13a6642ce67b95e8ee');assert.equal(restBalanceDelta.sourceCommit,'edb1606bccca5dfd9ffb5709ae78cd2dc7e8e3fb');
assert.deepEqual(restBalanceDelta.sourceChanges.map(c=>c.path),["shared/engine/src/balance.ts", "shared/engine/src/enemyAI.ts", "shared/engine/src/engine.ts", "shared/engine/src/skillNotes.ts", "shared/engine/src/skillVisuals.ts", "shared/engine/src/totemBehavior.ts", "shared/engine/src/types.ts", "shared/runtime/contribution-xp.js", "shared/runtime/journey-art.js", "shared/runtime/progression.js", "shared/runtime/rest-journey.js", "shared/runtime/unit-info.js"]);assert.deepEqual(restBalanceDelta.packagingChanges.map(c=>c.path),['game/src/journey.css']);
assert.deepEqual(restBalanceDelta.sourceChanges.map(c=>c.exactEdits.length),[1, 4, 11, 1, 2, 2, 2, 3, 3, 5, 6, 1],'Exact approved source edit membership');
assert.equal(priorApprovals.at(-1),questDelta);
assert.equal(hash(priorApprovals.slice(0,-1)),'98822005ec7688561d182bde4d9fc243bc9a1874dd391218c460a7b46a8f3f88','All preceding approvals, history and build evidence remain immutable');assert.equal(questDelta.beforeApprovedDeltasSha256,'98822005ec7688561d182bde4d9fc243bc9a1874dd391218c460a7b46a8f3f88');
assert.equal(questDelta.baseCurrentCommit,'d2f1951e0d0a2fabefbfe2c2b369487338234d07');assert.equal(questDelta.sourceCommit,'75d91c8c16ec82171f9b988fb46bf3926c05ecad');
assert.deepEqual(questDelta.sourceChanges.map(c=>c.path),["shared/build.mjs", "shared/engine/src/art.ts", "shared/engine/src/balance.ts", "shared/engine/src/eaterMechanics.ts", "shared/engine/src/enemyAI.ts", "shared/engine/src/engine.ts", "shared/engine/src/stageRules.ts", "shared/engine/src/types.ts", "shared/map/compiler.js", "shared/map/visual-style.js", "shared/runtime/act2-drama.js", "shared/runtime/act2-spatial-art.js", "shared/runtime/act2.js", "shared/runtime/act3-content.js", "shared/runtime/act3-journey.js", "shared/runtime/act3-objectives.js", "shared/runtime/allies.js", "shared/runtime/authored.js", "shared/runtime/difficulty.js", "shared/runtime/encounters.js", "shared/runtime/journey-content.js", "shared/runtime/main.js", "shared/runtime/mission.js", "shared/runtime/narrative-revision.js", "shared/runtime/objective-guidance.js", "shared/runtime/objective-revision.js", "shared/runtime/objectives.js", "shared/runtime/progression.js", "shared/runtime/quest-target-art.js", "shared/runtime/quest-targets.js", "shared/runtime/stage-rules.js", "shared/runtime/stage18-bell.js", "shared/runtime/stage5-waterfall-art.js", "shared/runtime/stage5-waterfall-geometry.js", "shared/runtime/stage5-waterfall.js", "shared/runtime/stage8-bier.js", "shared/runtime/story-act1-art.js", "shared/runtime/story-content-v0.js", "shared/runtime/story-content.js", "shared/runtime/story-direction.js", "shared/runtime/story-staging.js", "shared/runtime/terrain-space.js", "shared/runtime/unit-info.js"],'Exact reviewed quest and dialogue source membership');assert.deepEqual(questDelta.packagingChanges,[]);
assert.deepEqual(questDelta.sourceChanges.map(c=>c.exactEdits.length),[2, 1, 2, 1, 2, 17, 3, 1, 1, 1, 37, 1, 11, 31, 6, 8, 1, 2, 1, 2, 11, 1, 5, 2, 4, 1, 4, 4, 1, 1, 2, 5, 4, 2, 1, 4, 10, 3, 28, 8, 7, 1, 2],'Exact reviewed edits');assert.deepEqual(questDelta.sourceChanges.filter(c=>c.previousKind===null).map(c=>c.path),['shared/runtime/quest-target-art.js','shared/runtime/quest-targets.js']);
const priorSourceRows=beforeStorySourceRows(f.sourceRows);
for(const change of questDelta.sourceChanges){const index=priorSourceRows.findIndex(r=>r.path===change.path),row=priorSourceRows[index];assert(row);assert.deepEqual(row.provenance.slice(-change.provenance.length),change.provenance);if(change.previousKind===null){assert.equal(row.kind,'added');assert.equal(row.beforeSha256,null);priorSourceRows.splice(index,1);}else{row.provenance.splice(-change.provenance.length);row.sha256=change.previousSha256;row.kind=change.previousKind;}}
assert.equal(hash(priorSourceRows),'d5838e4597ce532884e0c46a80b0d5898f00445c1d62e3793a56bf1ded9cc144','Entire completed second-release source ledger restored');assert.equal(questDelta.beforeSourceRowsSha256,'d5838e4597ce532884e0c46a80b0d5898f00445c1d62e3793a56bf1ded9cc144');assert.deepEqual(priorSourceRows.map(r=>r.path),questDelta.beforeSourceOrder);

for(const change of restBalanceDelta.sourceChanges){const row=priorSourceRows.find(r=>r.path===change.path);assert.deepEqual(row.provenance.slice(-change.provenance.length),change.provenance);row.provenance.splice(-change.provenance.length);row.sha256=change.previousSha256;row.kind=change.previousKind;}
assert.equal(hash(priorSourceRows),'7e486542b009d40b460b1e988a70b44a51c2afd354cfdc7c4ae2dbfbcad9ffb3','Restore the entire reviewed P0 source ledger');assert.equal(restBalanceDelta.beforeSourceRowsSha256,'7e486542b009d40b460b1e988a70b44a51c2afd354cfdc7c4ae2dbfbcad9ffb3');

for(const change of audioP0Delta.sourceChanges){const row=priorSourceRows.find(r=>r.path===change.path);assert.deepEqual(row.provenance.slice(-change.provenance.length),change.provenance);row.provenance.splice(-change.provenance.length);row.sha256=change.previousSha256;row.kind=change.previousKind;}
assert.equal(hash(priorSourceRows),'0e2178cbeb712b642943a4434ee46ea94eb4480545c5f184c6fe76afc98381b2','Reverse only the four exact audio/title source edits to the reviewed counter-help source ledger');assert.equal(audioP0Delta.beforeSourceRowsSha256,'0e2178cbeb712b642943a4434ee46ea94eb4480545c5f184c6fe76afc98381b2');

for(const change of helpDelta.sourceChanges){const row=priorSourceRows.find(r=>r.path===change.path);assert.deepEqual(row.provenance.slice(-change.provenance.length),change.provenance);row.provenance.splice(-change.provenance.length);row.sha256=change.previousSha256;row.kind=change.previousKind;}
assert.equal(hash(priorSourceRows),'67dde0c1991fce8da469ec6c6fdcc7c26514b059f2d0d7b8da3ae09061d777f6','Restore exact reviewed combat source ledger');assert.equal(helpDelta.beforeSourceRowsSha256,'67dde0c1991fce8da469ec6c6fdcc7c26514b059f2d0d7b8da3ae09061d777f6');

for(const change of combatDelta.sourceChanges){const row=priorSourceRows.find(r=>r.path===change.path);assert.deepEqual(row.provenance.slice(-change.provenance.length),change.provenance);row.provenance.splice(-change.provenance.length);row.sha256=change.previousSha256;row.kind=change.previousKind;}
assert.equal(hash(priorSourceRows),'7a5dad04511f13abf4ace8377341b137a99bcc5f7aeaa79471881919511cadc0','Reverse only the exact combat source changes to the prior reviewed source ledger');assert.equal(combatDelta.beforeSourceRowsSha256,'7a5dad04511f13abf4ace8377341b137a99bcc5f7aeaa79471881919511cadc0');

for(const change of inspectorDelta.sourceChanges){const row=priorSourceRows.find(r=>r.path===change.path);assert.deepEqual(row.provenance.slice(-change.provenance.length),change.provenance);row.provenance.splice(-change.provenance.length);row.sha256=change.previousSha256;row.kind=change.previousKind;}
assert.equal(hash(priorSourceRows),'8a54ebab962fe281c16db32b6c3c8603858695245e33456a4d4cdd6f5b5accb2','Restore the exact completed skill source provenance');assert.equal(inspectorDelta.beforeSourceRowsSha256,'8a54ebab962fe281c16db32b6c3c8603858695245e33456a4d4cdd6f5b5accb2');

for(const change of skillDelta.sourceChanges){
 const index=priorSourceRows.findIndex(r=>r.path===change.path),row=priorSourceRows[index];assert(row);assert.deepEqual(row.provenance.slice(-change.provenance.length),change.provenance);
 if(change.previousKind===null){assert.equal(row.kind,'added');assert.equal(row.beforeSha256,null);priorSourceRows.splice(index,1);}
 else {row.provenance.splice(-change.provenance.length);row.sha256=change.previousSha256;row.kind=change.previousKind;}
}
assert.equal(hash(priorSourceRows),'735323d1c5ee30725996903127627daac26a5318d9d77e8e7813adf0226ae641','Exact pre-skill source rows, classification and complete provenance restored');
assert.equal(skillDelta.beforeSourceRowsSha256,'735323d1c5ee30725996903127627daac26a5318d9d77e8e7813adf0226ae641');
assert.deepEqual(priorSourceRows.map(r=>r.path),skillDelta.beforeSourceOrder);

for(const change of audioDelta.sourceChanges){const row=priorSourceRows.find(r=>r.path===change.path);assert.deepEqual(row.provenance.slice(-change.provenance.length),change.provenance);row.provenance.splice(-change.provenance.length);row.sha256=change.previousSha256;if(row.path==='shared/engine/src/bgm.ts')row.kind='unchanged';}
assert.equal(hash(priorSourceRows),'74cca055d1d468828b6ec44a74a769ad265aa0e8fe3347a33f504fd8dd2f7dfa','Every pre-audio source row, classification and provenance remains unchanged');
const priorMain=priorSourceRows.find(r=>r.path==='shared/runtime/main.js');
assert(priorMain.provenance.at(-1).startsWith(titleDelta.sourceCommit+' '));priorMain.provenance.pop();priorMain.sha256=titleDelta.sourceChanges[0].previousSha256;
assert.equal(hash(priorSourceRows),'dc0c03d2a0ae34126fb329a5e17d7c141569cd19725d32ca917d927421f1dd14','All 159 earlier source rows and provenance are preserved behind the one-file title delta');
const titleEdit=titleDelta.sourceChanges[0].exactEdits;assert.equal(titleEdit.length,1);assert.equal(titleEdit[0].beforeLine,titleEdit[0].afterLine);assert.equal(titleEdit[0].before.length,1);assert.equal(titleEdit[0].after.length,1);
const outsideBrand=line=>{const start='<h1 class="title-brand" aria-label="혼로">',end='</h1>';assert.equal(line.split(start).length,2);assert.equal(line.split(end).length,2);return line.slice(0,line.indexOf(start))+line.slice(line.indexOf(end)+end.length);};
assert.equal(outsideBrand(titleEdit[0].before[0]),outsideBrand(titleEdit[0].after[0]),'Only title brand markup changes; navigation, save and action code remains byte-identical');
assert.deepEqual(titleDelta.preservedTitleAssets.map(r=>r.path),['shared/assets/environment/title/hanja-wordmark.png','shared/assets/environment/title/wordmark.png']);
for(const row of titleDelta.preservedTitleAssets)assert.equal(hash(readFileSync(row.path)),row.sha256,'Original approved title image bytes '+row.path);
for(const [index,delta] of [finalDelta,bodyDelta,uiDelta,titleDelta,audioDelta,skillDelta,inspectorDelta,combatDelta,helpDelta,audioP0Delta,restBalanceDelta,questDelta,storyRuntimeDelta].entries())for(const change of delta.sourceChanges){
 const later=[finalDelta,bodyDelta,uiDelta,titleDelta,audioDelta,skillDelta,inspectorDelta,combatDelta,helpDelta,audioP0Delta,restBalanceDelta,questDelta,storyRuntimeDelta].slice(index+1).flatMap(d=>d.sourceChanges).find(c=>c.path===change.path);
 assert.equal(later?later.previousSha256:hash(sources[change.path]),change.sha256);assert.notEqual(change.sha256,change.previousSha256);if(delta!==bodyDelta)assert(change.provenance.length);else assert.match(delta.sourceCommit,/^[0-9a-f]{40}$/);
}
let exactDeltaNegatives=0;
const exactDeltas=[uiDelta,titleDelta,audioDelta,skillDelta,inspectorDelta,combatDelta,helpDelta,audioP0Delta,restBalanceDelta,questDelta,storyRuntimeDelta],exactChanges=exactDeltas.flatMap(d=>[...d.sourceChanges,...d.packagingChanges,...(d.artChanges||[])]);
for(const [index,change] of exactChanges.entries()){
 const live=beforeCharacterArtSource(change.path,beforeBodySource(change.path,beforeDocumentSource(change.path,beforeMaterialSource(change.path,beforeEvidenceSource(change.path,beforeTempleSource(change.path,beforeLakeSource(change.path,readFileSync(change.path,'utf8')))))))),later=exactChanges.slice(index+1).filter(c=>c.path===change.path),source=later.length?assertExactFollowupDeltaChain(live,later):live;
 const previous=assertExactFollowupDelta(source,change);assert.equal(assertExactFollowupDeltaChain(live,[change,...later]),previous,'Prior approval is proved after reversing every subsequent exact refinement');
 for(const mutate of [d=>d.exactEdits[0].afterLine++,d=>d.exactEdits[0].beforeLine++,d=>d.exactEdits[0].before[0]+=' ',d=>d.exactEdits[0].after[0]+=' ',d=>d.exactEdits.pop()]){
  const altered=structuredClone(change);mutate(altered);assert.throws(()=>assertExactFollowupDelta(source,altered),'Exact source delta rejects its own altered edit');exactDeltaNegatives++;
 }
}
const mainChain=exactChanges.filter(c=>c.path==='shared/runtime/main.js');
for(const mutate of [c=>c.reverse(),c=>c.pop(),c=>c[1].previousSha256='0'.repeat(64),c=>c[1].path='shared/runtime/rest-journey.js',c=>c.length=0]){
 const altered=structuredClone(mainChain);mutate(altered);assert.throws(()=>assertExactFollowupDeltaChain(sources['shared/runtime/main.js'],altered),'Reject a broken or reordered exact approval chain');exactDeltaNegatives++;
}
for(const[key,before]of Object.entries(uiDelta.beforeBuilds)){
 const after=uiDelta.afterBuilds[key],expected=before.parts.map(old=>uiDelta.sourceChanges.find(c=>c.previousSha256===old)?.sha256||old);
 assert.deepEqual(after.parts,expected,'Only three explicitly approved source modules may change actual build parts');
 const count=after.parts.filter((h,i)=>h!==before.parts[i]).length,wanted=key==='temple'?2:(after.options.app?2:0)+(after.options.render?1:0);
 assert.equal(count,wanted,'Exact app/render-only module-change count');
}
for(const[key,before]of Object.entries(titleDelta.beforeBuilds)){
 const after=titleDelta.afterBuilds[key],change=titleDelta.sourceChanges[0],expected=before.parts.map(old=>old===change.previousSha256?change.sha256:old);
 assert.deepEqual(after.parts,expected,'Only the explicit title-brand markup changes actual runtime parts');
 assert.equal(after.parts.filter((h,i)=>h!==before.parts[i]).length,key==='temple'||after.options.app?1:0,'One main.js part changes only in app and temple variants');
 assert.deepEqual(after.options,before.options,'Title refinement preserves all actual build options');
}
for(const[key,before]of Object.entries(audioDelta.beforeBuilds)){
 const after=audioDelta.afterBuilds[key],story=audioDelta.sourceChanges.find(c=>c.path==='shared/runtime/story.js');
 const expected=before.parts.map(old=>old===audioDelta.beforeCoreSha256?audioDelta.afterCoreSha256:old===story.previousSha256?story.sha256:old);
 assert.deepEqual(after.parts,expected,'Only compiled audio core and story cue cleanup change runtime parts');
 assert.equal(before.parts.filter(h=>h===audioDelta.beforeCoreSha256).length,1,'Exactly one prior compiled core per variant');
 assert.equal(after.parts.filter((h,i)=>h!==before.parts[i]).length,key==='temple'||after.options.app?2:1,'One compiled core plus optional story source');
 assert.deepEqual(after.options,before.options,'Audio refinement preserves all actual build options');
}

for(const[key,before]of Object.entries(storyRuntimeDelta.beforeBuilds)){
 const d=storyRuntimeDelta,after=d.afterBuilds[key],sha=name=>f.sourceRows.find(row=>row.path==='shared/runtime/'+name+'.js').sha256;
 const expected=before.parts.map(value=>value===d.beforeCoreSha256?d.afterCoreSha256:value===d.projectPart.previousSha256?d.projectPart.sha256:d.sourceChanges.find(change=>change.previousSha256===value)?.sha256||value);
 for(const[anchor,names,required]of [['quest-targets',['story-canon-v1','bell-anomaly','act3-void'],true],['quest-target-art',['story-anomaly-art'],!!after.options?.render]]){
  const at=expected.indexOf(sha(anchor));assert.equal(expected.filter(value=>value===sha(anchor)).length,required?1:0);
  if(required)expected.splice(at+1,0,...names.map(sha));
  for(const name of names)assert.equal(after.parts.filter(value=>value===sha(name)).length,required?1:0);
 }
 assert.deepEqual(after.parts,expected,'Only exact story/core/project substitutions and approved module insertions '+key);assert.deepEqual(after.options,before.options);
}
assert.deepEqual(f.modelFiles,[...storyRuntimeDelta.beforeModelFiles,'story-canon-v1','bell-anomaly','act3-void']);assert.deepEqual(f.engineFiles,storyRuntimeDelta.beforeEngineFiles);
for(const[key,before]of Object.entries(questDelta.beforeBuilds)){
 const after=questDelta.afterBuilds[key],expected=before.parts.map(h=>h===questDelta.projectPart.previousSha256?questDelta.projectPart.sha256:h===questDelta.beforeCoreSha256?questDelta.afterCoreSha256:questDelta.sourceChanges.find(c=>c.previousSha256===h)?.sha256||h),sha=p=>f.sourceRows.find(r=>r.path==='shared/runtime/'+p+'.js').sha256;
 for(const[anchor,added,required]of [['stage5-waterfall','quest-targets',true],['narrative-art','quest-target-art',!!after.options?.render]]){const index=expected.indexOf(sha(anchor));assert.equal(expected.filter(h=>h===sha(anchor)).length,required?1:0,'Exact approved insertion anchor '+key+'/'+anchor);if(required)expected.splice(index+1,0,sha(added));assert.equal(after.parts.filter(h=>h===sha(added)).length,required?1:0,'New module occurs once only where authorized '+key+'/'+added);}
 assert.deepEqual(after.parts,expected,'Only reviewed replacements and exact two ordered insertions '+key);assert.deepEqual(after.options,before.options);assert.equal(before.parts.filter(h=>h===questDelta.beforeCoreSha256).length,1);assert.equal(after.parts.filter(h=>h===questDelta.afterCoreSha256).length,1);
}
for(const[key,before]of Object.entries(restBalanceDelta.beforeBuilds)){
 const after=restBalanceDelta.afterBuilds[key],expected=before.parts.map(h=>h===restBalanceDelta.beforeCoreSha256?restBalanceDelta.afterCoreSha256:restBalanceDelta.sourceChanges.find(c=>c.previousSha256===h)?.sha256||h);
 assert.deepEqual(after.parts,expected,'Only reviewed rest, progression and compiled combat parts change: '+key);assert.deepEqual(after.options,before.options);
 assert.equal(before.parts.filter(h=>h===restBalanceDelta.beforeCoreSha256).length,1);assert.equal(after.parts.filter(h=>h===restBalanceDelta.afterCoreSha256).length,1);
}
for(const[key,before]of Object.entries(audioP0Delta.beforeBuilds)){
 const after=audioP0Delta.afterBuilds[key],main=audioP0Delta.sourceChanges.find(c=>c.path==='shared/runtime/main.js');
 const expected=before.parts.map(h=>h===audioP0Delta.beforeCoreSha256?audioP0Delta.afterCoreSha256:h===main.previousSha256?main.sha256:h);
 assert.deepEqual(after.parts,expected,'Only the reviewed compiled audio core and optional main app runtime change: '+key);assert.deepEqual(after.options,before.options);
 assert.equal(before.parts.filter(h=>h===audioP0Delta.beforeCoreSha256).length,1);assert.equal(after.parts.filter(h=>h===audioP0Delta.afterCoreSha256).length,1);
 assert.equal(after.parts.filter((h,i)=>h!==before.parts[i]).length,key==='temple'||after.options.app?2:1,'One core plus optional main source');
}
for(const[key,before]of Object.entries(helpDelta.beforeBuilds)){
 const after=helpDelta.afterBuilds[key];assert.deepEqual(after.parts,before.parts.map(h=>h===helpDelta.beforeCoreSha256?helpDelta.afterCoreSha256:h),'Only compiled core containing the two help strings changes: '+key);assert.deepEqual(after.options,before.options);assert.equal(after.parts.filter((h,i)=>h!==before.parts[i]).length,1);
}
for(const[key,before]of Object.entries(combatDelta.beforeBuilds)){
 const after=combatDelta.afterBuilds[key],expected=before.parts.map(h=>h===combatDelta.beforeCoreSha256?combatDelta.afterCoreSha256:combatDelta.sourceChanges.find(c=>c.previousSha256===h)?.sha256||h);
 assert.deepEqual(after.parts,expected,'Only the reviewed combat core and four runtime modules may change: '+key);assert.deepEqual(after.options,before.options);
 assert.equal(before.parts.filter(h=>h===combatDelta.beforeCoreSha256).length,1);assert.equal(after.parts.filter(h=>h===combatDelta.afterCoreSha256).length,1);
}
for(const[key,before]of Object.entries(inspectorDelta.beforeBuilds)){
 const after=inspectorDelta.afterBuilds[key];assert.deepEqual(after.parts,before.parts.map(h=>h===inspectorDelta.beforeCoreSha256?inspectorDelta.afterCoreSha256:inspectorDelta.sourceChanges.find(c=>c.previousSha256===h)?.sha256||h),'Exact captive UI/core part substitution');assert.equal(after.parts.filter((h,i)=>h!==before.parts[i]).length,1+(key==='temple'?0:Number(after.options.render)+Number(after.options.app)),'One compiled visual core plus optional feedback and inspector');assert.deepEqual(after.options,before.options);
}
for(const[key,before]of Object.entries(skillDelta.beforeBuilds)){
 const after=skillDelta.afterBuilds[key],expected=before.parts.map(old=>old===skillDelta.beforeCoreSha256?skillDelta.afterCoreSha256:[...skillDelta.sourceChanges,...skillDelta.artChanges].find(c=>c.previousSha256===old)?.sha256||old);
 assert.deepEqual(after.parts,expected,'Only exact reviewed source parts and compiled core change: '+key);
 assert.equal(before.parts.filter(h=>h===skillDelta.beforeCoreSha256).length,1,'One prior compiled core');
 assert.equal(after.parts.filter(h=>h===skillDelta.afterCoreSha256).length,1,'One final compiled core');
 assert.deepEqual(after.options,before.options,'All existing build variants and options preserved');
}

assert.deepEqual(skillDelta.artChanges.map(c=>c.path),['shared/assets/actors/actors.runtime.js','shared/assets/actors/summon_eater.animation.json','shared/assets/actors/summon_eater.rig.json','shared/assets/actors/summon_eater.svg','tools/actor-forge/anatomy.mjs','tools/actor-forge/spirits.mjs']);
const actorDelta=skillDelta.artChanges[0],actorNow=beforeCharacterArtSource(actorDelta.path,beforeBodySource(actorDelta.path,beforeMaterialSource(actorDelta.path,readFileSync(actorDelta.path,'utf8')))),actorBefore=assertExactFollowupDelta(actorNow,actorDelta);
const actorData=text=>{const prefix='// Generated by tools/actor-forge/build.mjs.\nglobalThis.HONRO_ACTORS=';assert(text.startsWith(prefix)&&text.endsWith(';\n'));return JSON.parse(text.slice(prefix.length,-2));};
const oldActors=actorData(actorBefore),newActors=actorData(actorNow);assert.deepEqual(Object.keys(newActors.assets),Object.keys(oldActors.assets));for(const id of Object.keys(oldActors.assets))if(id!=='summon_eater')assert.deepEqual(newActors.assets[id],oldActors.assets[id],'Every other actor remains exact: '+id);
for(const delta of f.approvedDeltas.filter(d=>d.exactAddedText)){assert.equal(delta.path,'shared/runtime/narrative-revision.js');const source=assertExactFollowupDeltaChain(sources[delta.path],questDelta.sourceChanges.filter(c=>c.path===delta.path));assert.equal(source.split(delta.exactAddedText).length,2);assert.equal(hash(source.replace(delta.exactAddedText,'')),delta.beforeSha256,'Exact approved creation-default source delta');assert.equal(hash(source),delta.afterSha256);for(const change of delta.buildChanges){assert.equal(finalDelta.beforeBuilds[change.variant].parts[change.index],delta.afterSha256);assert.equal(finalDelta.beforeBuilds[change.variant].sha256,change.afterSha256);assert.equal(f.variants[change.variant].parts.filter(h=>h===hash(sources[delta.path])).length,1,'Reviewed current binding source occurs exactly once in final build');}}
assert.equal(Object.keys(sources).length,f.currentCounts.sources);assert.equal(Object.keys(archive).length,133);
assert.deepEqual(Object.keys(archive).sort(),Object.keys(encounterDensityHistory.runtime).sort());
for(const[path,row]of Object.entries(encounterDensityHistory.runtime))assert.equal(hash(archive[path]),row.afterSha256,'Original source byte identity '+path);
for(const[k,n]of Object.entries(f.currentCounts).filter(([key])=>key!=='sources'))assert.equal(f.sourceRows.filter(r=>r.kind===k).length,n);
// All current identity, packaging, build and negative gates use live bytes.
f=lakeManifest;sources=liveSources;
assert.deepEqual(Object.keys(archive).filter(p=>!Object.hasOwn(sources,p)),[],'No historical source removed');
for(const row of f.sourceRows){if(row.kind==='unchanged'){assert.equal(hash(sources[row.path]),hash(archive[row.path]));assert.equal(row.sha256,row.beforeSha256);}else{assert(row.provenance.length>0);for(const entry of row.provenance)assert.match(entry,/^[0-9a-f]{40} .+/);assert.notEqual(row.sha256,row.beforeSha256);}if(row.beforeSha256)assert.equal(hash(archive[row.path]),row.beforeSha256);}
for(const row of f.packagingSources){assert.equal(hash(beforeLakeSource(row.path,readFileSync(row.path,'utf8'))),row.sha256,'Exact packaging dependency '+row.path);assert.match(row.provenance,/^[0-9a-f]{40} .+/);}
assertCurrentBuildGraph({modelFiles,engineFiles:readdirSync('shared/engine/src').filter(p=>p.endsWith('.ts')).sort().map(p=>'shared/engine/src/'+p),core:await buildCore()});
const partNegatives=[],builds=[];let currentRaw;
for(const[key,row]of Object.entries(f.variants)){if(key==='temple')continue;const parts=await runtimeParts(row.options);assertCurrentRuntimeParts(parts,{variant:key});if(key==='v0r0a0')currentRaw=parts;
 for(const[id,mutate]of [['missing',p=>p.splice(1,1)],['extra',p=>p.push('unexpected')],['duplicate',p=>p.push(p[0])],['reorder',p=>p.reverse()],['core-byte',p=>p[2]+=' '],['inline-project',p=>{const i=p.findIndex(s=>s.startsWith('globalThis.HONRO_PROJECT='));p[i]+=' ';}]]){const p=[...parts];mutate(p);assert.throws(()=>assertCurrentRuntimeParts(p,{variant:key}),key+'/'+id);partNegatives.push(key+'/'+id);}
 const projectParts=parts.filter(s=>s.startsWith('globalThis.HONRO_PROJECT='));assert.equal(projectParts.length,1);assert(projectParts[0].startsWith(storyRuntimeDelta.projectPart.prefix));
 if(['v1r1a0','v1r1a1'].includes(key)){const file=key==='v1r1a0'?'HONRO_WORKSHOP.html':'HONRO.html',html=readFileSync(file,'utf8'),bundle=(key==='v1r1a0'?SHARED_BEGIN+parts.slice(0,-1).join('\n')+SHARED_END+'\n'+parts.at(-1):parts.join('\n')).replace(/<\/script/gi,'<\\/script');assert.equal(html.split(bundle).length,2,'Exactly one current complete ordered production bundle in '+file);}
 builds.push({variant:key,parts:parts.length,sha256:hash(parts.join('\n'))});
}
const temple=[...currentRaw.filter(s=>!s.startsWith('globalThis.HONRO_PROJECT=')),...['main','story','interactions','rest-journey','training'].map(n=>sources['shared/runtime/'+n+'.js'])];assertCurrentRuntimeParts(temple,{variant:'temple'});
// Archive byte checking is explicit. Never feed these fingerprints to a current
// gameplay-completion identity assertion, and never execute archived JavaScript.
assert.deepEqual(sourceHistoryInput(sources),archive);assert.equal(Object.keys(beforeStage8BierRuntimeSources(archive)).length,130);assert.deepEqual(beforeEncounterDensityRuntimeSources(sources),beforeEncounterDensityRuntimeSources(archive));
const archiveChecks=[];for(const variant of ['raw','temple']){const parts=historicalRuntimeParts({variant}),before=beforeStage8BierFingerprintParts(parts,{sources:archive});assert.equal(hash(before.join('\n')),stage8BierReview().fingerprints[variant].before);if(variant==='temple')assert.equal(hash(beforeStage18BellFingerprintParts(parts,{sources:archive}).join('\n')),stage18BellHistoryDelta.runtime.beforeFingerprintSha256);
 for(const mutate of [p=>p.reverse(),p=>p.push(p[0]),p=>p.splice(1,1),p=>p[1]+=' ']){const p=[...parts];mutate(p);assert.throws(()=>beforeStage8BierFingerprintParts(p,{sources:archive}));}archiveChecks.push({variant,sha256:hash(parts.join('\n')),beforeStage8Sha256:hash(before.join('\n'))});}
assert.throws(()=>beforeStage8BierFingerprintParts(currentRaw,{sources}),'Current behavior identity must NOT silently become an old gameplay fingerprint');
let sourceNegatives=0;for(const row of f.sourceRows){const changed={...sources,[row.path]:sources[row.path]+' '};assert.throws(()=>assertCurrentRuntimeSources(changed));assert.throws(()=>sourceHistoryInput(changed));const missing={...sources};delete missing[row.path];assert.throws(()=>assertCurrentRuntimeSources(missing));assert.throws(()=>sourceHistoryInput(missing));sourceNegatives+=4;}
assert.throws(()=>assertCurrentRuntimeSources({...sources,'shared/engine/src/unreviewed.ts':'export const injected=true;'}));assert.throws(()=>assertCurrentRuntimeSources(Object.fromEntries(Object.entries(sources).reverse())));
assert.throws(()=>assertCurrentBuildGraph({modelFiles:[...modelFiles,modelFiles[0]],engineFiles:f.engineFiles,core:'invalid'}));assert.throws(()=>assertCurrentBuildGraph({modelFiles,engineFiles:[...f.engineFiles,'shared/engine/src/injected.ts'],core:'invalid'}));
for(const path of Object.keys(archive)){assert.throws(()=>beforeStage8BierRuntimeSources({...archive,[path]:archive[path]+' '}),'Archive byte '+path);const missing={...archive};delete missing[path];assert.throws(()=>beforeStage8BierRuntimeSources(missing),'Archive membership '+path);sourceNegatives+=2;}

const projectProof=questDelta.projectPart;
assert.deepEqual(projectProof.changes.map(c=>c.path),[["stages", 11, "initialState", "honroQuarryContent", "beats", "rock-pin", 0, 1], ["stages", 11, "initialState", "honroQuarryContent", "beats", "sign", 5, 1], ["stages", 11, "initialState", "honroQuarryContent", "outro", 1, 1], ["stages", 13, "initialState", "honroVerticalStage14Content", "beats", "family-lower", 0, 1], ["stages", 13, "initialState", "honroVerticalStage14Content", "beats", "family-lower", 1, 1]]);
function reverseQuestProjectPart(part,proof=projectProof){assert.equal(hash(part),proof.sha256);assert(part.startsWith(proof.prefix)&&part.endsWith(proof.suffix));const obj=JSON.parse(part.slice(proof.prefix.length,-proof.suffix.length));for(const c of proof.changes){const parent=c.path.slice(0,-1).reduce((o,k)=>o[k],obj),key=c.path.at(-1);assert.equal(typeof c.before,'string');assert.equal(typeof c.after,'string');assert.equal(parent[key],c.after);parent[key]=c.before;}const restored=proof.prefix+JSON.stringify(obj)+proof.suffix;assert.equal(hash(restored),proof.previousSha256);return restored;}
const lakeProject=currentRaw.find(p=>p.startsWith('globalThis.HONRO_PROJECT=')), projectPrefix=storyRuntimeDelta.projectPart.prefix,projectSuffix=storyRuntimeDelta.projectPart.suffix;const questProject=projectPrefix+JSON.stringify(beforeStage5Lake(JSON.parse(lakeProject.slice(projectPrefix.length,-projectSuffix.length))))+projectSuffix;const priorQuestProject=beforeStoryProjectPart(questProject);reverseQuestProjectPart(priorQuestProject);
let storyProjectNegatives=0;
const storyProject=JSON.parse(questProject.slice(storyRuntimeDelta.projectPart.prefix.length,-storyRuntimeDelta.projectPart.suffix.length));
for(const row of storyRevisionApproval.campaign.stages.filter(row=>row.variant==='project')){
 const before=applyExactStoryJsonDelta(storyProject.stages[row.stageId-1],row,{reverse:true});storyProjectNegatives+=assertExactStoryJsonNegatives(before,row);
}
let questProjectNegatives=0;
for(let i=0;i<projectProof.changes.length;i++){const bad=structuredClone(projectProof);bad.changes[i].before+='UNAPPROVED';assert.throws(()=>reverseQuestProjectPart(priorQuestProject,bad));questProjectNegatives++;}
const unrelated=JSON.parse(priorQuestProject.slice(projectProof.prefix.length,-projectProof.suffix.length));unrelated.stages[0].units[0].x+=1;const badPart=projectProof.prefix+JSON.stringify(unrelated)+projectProof.suffix;assert.throws(()=>reverseQuestProjectPart(badPart,{...projectProof,sha256:hash(badPart)}),'Even repinned project mutation cannot alter unrelated geometry');questProjectNegatives++;
mkdirSync('_local/reports/runtime-contracts',{recursive:true});writeFileSync('_local/reports/runtime-contracts/contracts.json',JSON.stringify({passed:true,currentSources:f.currentCounts.sources,archiveSources:133,priorSources:130,added:f.currentCounts.added,changed:f.currentCounts.changed,unchanged:f.currentCounts.unchanged,sourceNegatives,exactDeltaNegatives,characterArtNegatives,bodyNegatives,documentNegatives,materialNegatives,evidenceNegatives,templeNegatives,questProjectNegatives,storyProjectNegatives,partNegatives,builds,archiveChecks,currentGameplayFingerprintIsNotProjected:true,scope:'Actual current build identity and explicit nonexecuted archive byte identity. Current behavior/completed-run compatibility is a separate gate, not waived.'},null,2)+'\n');console.log('PASS current'+f.currentCounts.sources+' provenance/9 builds/twoHTML, immutable133→130 and old fingerprints; '+sourceNegatives+' source negatives, '+partNegatives.length+' current part negatives; '+exactDeltaNegatives+' exact edit negatives; '+characterArtNegatives+' character-art approval negatives; '+bodyNegatives+' P0 approval negatives; '+documentNegatives+' document presentation negatives');
