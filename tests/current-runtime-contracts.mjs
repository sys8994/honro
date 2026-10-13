import {SHARED_BEGIN,SHARED_END} from '../shared/playtest-template.mjs';
import {assertExactFollowupDelta,assertExactFollowupDeltaChain} from './ui-followup-source-delta.mjs';
/** Production identity, archive identity and behavior are distinct gates. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {runtimeParts,modelFiles} from '../shared/build.mjs';
import {buildCore} from '../game/engine/build.mjs';
import {runtimeContractHash as hash,currentRuntimeManifest as f,currentRuntimeSources,assertCurrentRuntimeSources,assertCurrentRuntimeParts,assertCurrentBuildGraph} from './current-runtime-contract-helpers.mjs';
import {historicalRuntimeSources,historicalRuntimeParts,sourceHistoryInput} from './historical-runtime-inputs.mjs';
import {beforeEncounterDensityRuntimeSources,encounterDensityHistory} from './encounter-density-history-helpers.mjs';
import {beforeStage8BierRuntimeSources,beforeStage8BierFingerprintParts,beforeStage18BellFingerprintParts,stage8BierReview,stage18BellHistoryDelta} from './stage8-bier-history-helpers.mjs';
const sources=currentRuntimeSources(),archive=historicalRuntimeSources();assertCurrentRuntimeSources(sources);
const finalDelta=f.approvedDeltas.find(d=>d.kind==='final-waterfall-companion-ai'),bodyDelta=f.approvedDeltas.find(d=>d.kind==='stage5-body-fluid-separation'),uiDelta=f.approvedDeltas.find(d=>d.kind==='compact-ui-title-rest-prop'),titleDelta=f.approvedDeltas.find(d=>d.kind==='title-weathered-ash-vertical-reading'),audioDelta=f.approvedDeltas.find(d=>d.kind==='dialogue-sfx-title-bgm-start'),skillDelta=f.approvedDeltas.find(d=>d.kind==='enemy-prison-and-splitting-reflection'),inspectorDelta=f.approvedDeltas.find(d=>d.kind==='prison-inspection-and-captive-overlays'),combatDelta=f.approvedDeltas.find(d=>d.kind==='sword-area-and-act1-defense'),helpDelta=f.approvedDeltas.find(d=>d.kind==='counter-area-help');
assert(finalDelta&&bodyDelta&&uiDelta&&titleDelta&&audioDelta&&skillDelta&&inspectorDelta&&combatDelta&&helpDelta);assert.equal(finalDelta.sourceChanges.length,20);assert.equal(bodyDelta.sourceChanges.length,5);
assert.deepEqual(finalDelta.afterBuilds,bodyDelta.beforeBuilds);assert.equal(finalDelta.afterCoreSha256,bodyDelta.beforeCoreSha256);
assert.deepEqual(bodyDelta.afterBuilds,uiDelta.beforeBuilds);assert.equal(bodyDelta.afterCoreSha256,uiDelta.beforeCoreSha256);
assert.deepEqual(uiDelta.afterBuilds,titleDelta.beforeBuilds);assert.equal(uiDelta.afterCoreSha256,titleDelta.beforeCoreSha256);
assert.deepEqual(titleDelta.afterBuilds,audioDelta.beforeBuilds);assert.equal(titleDelta.afterCoreSha256,audioDelta.beforeCoreSha256);
assert.deepEqual(audioDelta.afterBuilds,skillDelta.beforeBuilds);assert.equal(audioDelta.afterCoreSha256,skillDelta.beforeCoreSha256);assert.deepEqual(skillDelta.afterBuilds,inspectorDelta.beforeBuilds);assert.deepEqual(inspectorDelta.afterBuilds,combatDelta.beforeBuilds);assert.deepEqual(combatDelta.afterBuilds,helpDelta.beforeBuilds);assert.deepEqual(helpDelta.afterBuilds,f.variants);assert.equal(skillDelta.afterCoreSha256,inspectorDelta.beforeCoreSha256);assert.equal(inspectorDelta.afterCoreSha256,combatDelta.beforeCoreSha256);assert.equal(combatDelta.afterCoreSha256,helpDelta.beforeCoreSha256);assert.equal(helpDelta.afterCoreSha256,f.coreSha256);assert.notEqual(inspectorDelta.beforeCoreSha256,inspectorDelta.afterCoreSha256);assert.notEqual(audioDelta.beforeCoreSha256,audioDelta.afterCoreSha256);assert.equal(uiDelta.beforeCoreSha256,uiDelta.afterCoreSha256,'Follow-up UI/navigation/art does not change compiled gameplay');
assert.equal(titleDelta.beforeCoreSha256,titleDelta.afterCoreSha256,'Title-only refinement does not change compiled gameplay');
assert.deepEqual(uiDelta.sourceChanges.map(c=>c.path),['shared/runtime/main.js','shared/runtime/rest-journey.js','shared/runtime/story-act1-art.js']);
assert.deepEqual(uiDelta.packagingChanges.map(c=>c.path),['game/build.mjs']);
assert.deepEqual(titleDelta.sourceChanges.map(c=>c.path),['shared/runtime/main.js']);
assert.deepEqual(titleDelta.packagingChanges.map(c=>c.path),['game/src/title.css']);
assert.match(titleDelta.sourceCommit,/^[0-9a-f]{40}$/);assert.equal(titleDelta.baseCurrentCommit,'85cdf1b1e7875e3f4aac1fff350a6f62a9be8305');
assert.equal(f.approvedDeltas.at(-6),titleDelta);assert.equal(f.approvedDeltas.at(-5),audioDelta);assert.equal(hash(f.approvedDeltas.slice(0,-6)),'fb201dffe122dc9283131482e42cdbcfaf99f83426eebcbfebbdcc22b5936d31','Every prior approval and its historical build evidence remains unchanged');
assert.equal(hash(f.approvedDeltas.slice(0,-5)),'d823e0905ee08af639da23180003517c6cc92176e2e2f491a723623dc05cb1ae','Every pre-audio approval including title build evidence is immutable');
assert.deepEqual(audioDelta.sourceChanges.map(c=>c.path),['shared/engine/src/bgm.ts','shared/engine/src/sound-design.ts','shared/runtime/story.js']);
assert.deepEqual(audioDelta.packagingChanges,[]);assert.equal(audioDelta.baseCurrentCommit,'28b829abb3a108f522be9f35aceca4795de637bd');assert.equal(audioDelta.sourceCommit,'3b848ddb72d4dc7ccacfe86c5bf999509868b9c3');

assert.equal(f.approvedDeltas.at(-4),skillDelta);
assert.equal(hash(f.approvedDeltas.slice(0,-4)),'3f2b98b5bce6d50ae5c8c25dc9d57c1b061499d339674f943f485d3e0a3c5dbd','Every pre-skill approval, including audio, is immutable');
assert.equal(skillDelta.beforeApprovedDeltasSha256,'3f2b98b5bce6d50ae5c8c25dc9d57c1b061499d339674f943f485d3e0a3c5dbd');
assert.equal(skillDelta.baseCurrentCommit,'26a53350b9e51d0b45e6441f6ca91250ce3d9cab');
assert.match(skillDelta.sourceCommit,/^[0-9a-f]{40}$/);
assert.deepEqual(skillDelta.sourceChanges.map(c=>c.path),["shared/engine/src/eaterMechanics.ts", "shared/engine/src/enemyAI.ts", "shared/engine/src/engine.ts", "shared/engine/src/existence.ts", "shared/engine/src/occultData.ts", "shared/engine/src/occultMechanics.ts", "shared/engine/src/progression.ts", "shared/engine/src/skillLore.ts", "shared/engine/src/skillMechanics.ts", "shared/engine/src/skillNotes.ts", "shared/engine/src/skillRedesignData.ts", "shared/engine/src/skillVisuals.ts", "shared/engine/src/spBalanceModel.ts", "shared/engine/src/store.ts", "shared/engine/src/types.ts", "shared/engine/src/warriorMechanics.ts", "shared/engine/src/waveReflection.ts", "shared/runtime/act2-art.js", "shared/runtime/act2.js", "shared/runtime/act3-objectives.js", "shared/runtime/actor-vector.js", "shared/runtime/allies.js", "shared/runtime/authored.js", "shared/runtime/main.js", "shared/runtime/objective-guidance.js", "shared/runtime/objectives.js", "shared/runtime/progression.js", "shared/runtime/renderer.js", "shared/runtime/stage11-ravine-encounters.js", "shared/runtime/story.js"],'Exact reviewed skill-only source membership');
assert.deepEqual(skillDelta.packagingChanges,[]);
assert.deepEqual(skillDelta.sourceChanges.filter(c=>c.previousKind===null).map(c=>c.path),['shared/engine/src/eaterMechanics.ts','shared/engine/src/waveReflection.ts']);
assert.equal(hash(skillDelta.beforeEngineFiles),'37a6f1abc98d958fd27b2c2e3e0232a0ad4cfdef765cca2cb3bc8161fc147538');
assert.deepEqual(f.engineFiles,[...skillDelta.beforeEngineFiles,'shared/engine/src/eaterMechanics.ts','shared/engine/src/waveReflection.ts'].sort());
assert.deepEqual(f.modelFiles,skillDelta.beforeModelFiles,'Runtime model registration is unchanged');
assert.equal(f.approvedDeltas.at(-3),inspectorDelta);
assert.equal(hash(f.approvedDeltas.slice(0,-3)),'97d66fda218f29302e1f0dc63bcd4bd4952903e79eb6a66417417f812b4645c5','The entire completed skill approval remains immutable');
assert.equal(inspectorDelta.beforeApprovedDeltasSha256,'97d66fda218f29302e1f0dc63bcd4bd4952903e79eb6a66417417f812b4645c5');
assert.equal(inspectorDelta.baseCurrentCommit,'d03915bc5cf213cd56dc5c9a7036e53ebe7bb773');assert.match(inspectorDelta.sourceCommit,/^[a-f0-9]{40}$/);
assert.deepEqual(inspectorDelta.sourceChanges.map(c=>c.path),['shared/engine/src/warriorVisuals.ts','shared/runtime/combat-feedback.js','shared/runtime/unit-info.js']);assert.deepEqual(inspectorDelta.packagingChanges,[]);
assert.deepEqual(inspectorDelta.sourceChanges.map(c=>c.exactEdits.length),[1,1,3]);for(const change of inspectorDelta.sourceChanges)for(const edit of change.exactEdits){assert.equal(edit.before.length,1);assert.equal(edit.after.length,1);}
assert.equal(f.approvedDeltas.at(-2),combatDelta);
assert.equal(hash(f.approvedDeltas.slice(0,-2)),'bd5208b8cc7160bf4eadd1702159b20940ae55ffe989a943a5e9c1eb5fe67e77','Every completed approval and historical build stays immutable');
assert.equal(combatDelta.beforeApprovedDeltasSha256,'bd5208b8cc7160bf4eadd1702159b20940ae55ffe989a943a5e9c1eb5fe67e77');
assert.equal(combatDelta.baseCurrentCommit,'ad9b0c54ca960cb087ece043b18d248343c89a87');assert.match(combatDelta.sourceCommit,/^[a-f0-9]{40}$/);
assert.deepEqual(combatDelta.sourceChanges.map(c=>c.path),["shared/engine/src/warriorData.ts", "shared/engine/src/warriorMechanics.ts", "shared/map/compiler.js", "shared/runtime/act1-roster.js", "shared/runtime/stage-rules.js", "shared/runtime/world.js"]);assert.deepEqual(combatDelta.packagingChanges,[]);
assert.equal(f.approvedDeltas.at(-1),helpDelta);
assert.equal(hash(f.approvedDeltas.slice(0,-1)),'2cf4736d28918ba12e2309caa40e8ea56dc15b87f11a0736fea2c7b2f24b834b','All earlier approvals remain immutable');assert.equal(helpDelta.beforeApprovedDeltasSha256,'2cf4736d28918ba12e2309caa40e8ea56dc15b87f11a0736fea2c7b2f24b834b');
assert.equal(helpDelta.baseCurrentCommit,'c4b4a2d1fdb42e44b84d6f888a7a1f0b3317ab82');assert.match(helpDelta.sourceCommit,/^[a-f0-9]{40}$/);
assert.deepEqual(helpDelta.sourceChanges.map(c=>c.path),['shared/engine/src/progression.ts','shared/engine/src/skillNotes.ts']);assert.deepEqual(helpDelta.packagingChanges,[]);
const counterHelpReplacements=[['근접한 첫 적 1회','전방 범위의 적 모두 · 1회'],['적의 차례에 가까운 첫 적을 한 번 반격합니다.','적의 차례에 적이 가까이 들어오면 전방 범위의 적들을 한 번 반격합니다.']];
for(const [i,change] of helpDelta.sourceChanges.entries()){assert.equal(change.exactEdits.length,1);const edit=change.exactEdits[0];assert.equal(edit.before.length,1);assert.equal(edit.after.length,1);assert.equal(edit.beforeLine,edit.afterLine);const [before,after]=counterHelpReplacements[i];assert.equal(edit.after[0],edit.before[0].replace(before,after),'Only the approved S08 help string changes; numeric formulas and gameplay are exact');}
const priorSourceRows=structuredClone(f.sourceRows);
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
for(const [index,delta] of [finalDelta,bodyDelta,uiDelta,titleDelta,audioDelta,skillDelta,inspectorDelta,combatDelta,helpDelta].entries())for(const change of delta.sourceChanges){
 const later=[finalDelta,bodyDelta,uiDelta,titleDelta,audioDelta,skillDelta,inspectorDelta,combatDelta,helpDelta].slice(index+1).flatMap(d=>d.sourceChanges).find(c=>c.path===change.path);
 assert.equal(later?later.previousSha256:hash(sources[change.path]),change.sha256);assert.notEqual(change.sha256,change.previousSha256);if(delta!==bodyDelta)assert(change.provenance.length);else assert.match(delta.sourceCommit,/^[0-9a-f]{40}$/);
}
let exactDeltaNegatives=0;
const exactDeltas=[uiDelta,titleDelta,audioDelta,skillDelta,inspectorDelta,combatDelta,helpDelta],exactChanges=exactDeltas.flatMap(d=>[...d.sourceChanges,...d.packagingChanges,...(d.artChanges||[])]);
for(const [index,change] of exactChanges.entries()){
 const live=readFileSync(change.path,'utf8'),later=exactChanges.slice(index+1).filter(c=>c.path===change.path),source=later.length?assertExactFollowupDeltaChain(live,later):live;
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
const actorDelta=skillDelta.artChanges[0],actorNow=readFileSync(actorDelta.path,'utf8'),actorBefore=assertExactFollowupDelta(actorNow,actorDelta);
const actorData=text=>{const prefix='// Generated by tools/actor-forge/build.mjs.\nglobalThis.HONRO_ACTORS=';assert(text.startsWith(prefix)&&text.endsWith(';\n'));return JSON.parse(text.slice(prefix.length,-2));};
const oldActors=actorData(actorBefore),newActors=actorData(actorNow);assert.deepEqual(Object.keys(newActors.assets),Object.keys(oldActors.assets));for(const id of Object.keys(oldActors.assets))if(id!=='summon_eater')assert.deepEqual(newActors.assets[id],oldActors.assets[id],'Every other actor remains exact: '+id);
for(const delta of f.approvedDeltas.filter(d=>d.exactAddedText)){assert.equal(delta.path,'shared/runtime/narrative-revision.js');const source=sources[delta.path];assert.equal(source.split(delta.exactAddedText).length,2);assert.equal(hash(source.replace(delta.exactAddedText,'')),delta.beforeSha256,'Exact approved creation-default source delta');assert.equal(hash(source),delta.afterSha256);for(const change of delta.buildChanges){assert.equal(finalDelta.beforeBuilds[change.variant].parts[change.index],delta.afterSha256);assert.equal(finalDelta.beforeBuilds[change.variant].sha256,change.afterSha256);assert.equal(f.variants[change.variant].parts.filter(h=>h===delta.afterSha256).length,1,'Unchanged binding source occurs exactly once in final build');}}
assert.equal(Object.keys(sources).length,161);assert.equal(Object.keys(archive).length,133);
assert.deepEqual(Object.keys(archive).sort(),Object.keys(encounterDensityHistory.runtime).sort());
for(const[path,row]of Object.entries(encounterDensityHistory.runtime))assert.equal(hash(archive[path]),row.afterSha256,'Original source byte identity '+path);
for(const[k,n]of [['added', 28], ['changed', 83], ['unchanged', 50]])assert.equal(f.sourceRows.filter(r=>r.kind===k).length,n);
assert.deepEqual(Object.keys(archive).filter(p=>!Object.hasOwn(sources,p)),[],'No historical source removed');
for(const row of f.sourceRows){if(row.kind==='unchanged'){assert.equal(hash(sources[row.path]),hash(archive[row.path]));assert.equal(row.sha256,row.beforeSha256);}else{assert(row.provenance.length>0);for(const entry of row.provenance)assert.match(entry,/^[0-9a-f]{40} .+/);assert.notEqual(row.sha256,row.beforeSha256);}if(row.beforeSha256)assert.equal(hash(archive[row.path]),row.beforeSha256);}
for(const row of f.packagingSources){assert.equal(hash(readFileSync(row.path)),row.sha256,'Exact packaging dependency '+row.path);assert.match(row.provenance,/^[0-9a-f]{40} .+/);}
assertCurrentBuildGraph({modelFiles,engineFiles:readdirSync('shared/engine/src').filter(p=>p.endsWith('.ts')).sort().map(p=>'shared/engine/src/'+p),core:await buildCore()});
const partNegatives=[],builds=[];let currentRaw;
for(const[key,row]of Object.entries(f.variants)){if(key==='temple')continue;const parts=await runtimeParts(row.options);assertCurrentRuntimeParts(parts,{variant:key});if(key==='v0r0a0')currentRaw=parts;
 for(const[id,mutate]of [['missing',p=>p.splice(1,1)],['extra',p=>p.push('unexpected')],['duplicate',p=>p.push(p[0])],['reorder',p=>p.reverse()],['core-byte',p=>p[2]+=' '],['inline-project',p=>{const i=p.findIndex(s=>s.startsWith('globalThis.HONRO_PROJECT='));p[i]+=' ';}]]){const p=[...parts];mutate(p);assert.throws(()=>assertCurrentRuntimeParts(p,{variant:key}),key+'/'+id);partNegatives.push(key+'/'+id);}
 const projectParts=parts.filter(s=>s.startsWith('globalThis.HONRO_PROJECT='));assert.equal(projectParts.length,1);assert(projectParts[0].startsWith('globalThis.HONRO_PROJECT=HonroStage2Airborne.author(HonroNarrativeRevision.author(HonroObjectiveRevision.author(HonroAct1Roster.author('));
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
mkdirSync('_local/reports/runtime-contracts',{recursive:true});writeFileSync('_local/reports/runtime-contracts/contracts.json',JSON.stringify({passed:true,currentSources:161,archiveSources:133,priorSources:130,added:28,changed:83,unchanged:50,sourceNegatives,exactDeltaNegatives,partNegatives,builds,archiveChecks,currentGameplayFingerprintIsNotProjected:true,scope:'Actual current build identity and explicit nonexecuted archive byte identity. Current behavior/completed-run compatibility is a separate gate, not waived.'},null,2)+'\n');console.log('PASS current161 provenance/9 builds/twoHTML, immutable133→130 and old fingerprints; '+sourceNegatives+' source negatives, '+partNegatives.length+' current part negatives; '+exactDeltaNegatives+' exact edit negatives');
