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
const finalDelta=f.approvedDeltas.find(d=>d.kind==='final-waterfall-companion-ai'),bodyDelta=f.approvedDeltas.find(d=>d.kind==='stage5-body-fluid-separation'),uiDelta=f.approvedDeltas.find(d=>d.kind==='compact-ui-title-rest-prop'),titleDelta=f.approvedDeltas.find(d=>d.kind==='title-weathered-ash-vertical-reading'),audioDelta=f.approvedDeltas.find(d=>d.kind==='dialogue-sfx-title-bgm-start');
assert(finalDelta&&bodyDelta&&uiDelta&&titleDelta&&audioDelta);assert.equal(finalDelta.sourceChanges.length,20);assert.equal(bodyDelta.sourceChanges.length,5);
assert.deepEqual(finalDelta.afterBuilds,bodyDelta.beforeBuilds);assert.equal(finalDelta.afterCoreSha256,bodyDelta.beforeCoreSha256);
assert.deepEqual(bodyDelta.afterBuilds,uiDelta.beforeBuilds);assert.equal(bodyDelta.afterCoreSha256,uiDelta.beforeCoreSha256);
assert.deepEqual(uiDelta.afterBuilds,titleDelta.beforeBuilds);assert.equal(uiDelta.afterCoreSha256,titleDelta.beforeCoreSha256);
assert.deepEqual(titleDelta.afterBuilds,audioDelta.beforeBuilds);assert.equal(titleDelta.afterCoreSha256,audioDelta.beforeCoreSha256);
assert.deepEqual(audioDelta.afterBuilds,f.variants);assert.equal(audioDelta.afterCoreSha256,f.coreSha256);assert.notEqual(audioDelta.beforeCoreSha256,audioDelta.afterCoreSha256);assert.equal(uiDelta.beforeCoreSha256,uiDelta.afterCoreSha256,'Follow-up UI/navigation/art does not change compiled gameplay');
assert.equal(titleDelta.beforeCoreSha256,titleDelta.afterCoreSha256,'Title-only refinement does not change compiled gameplay');
assert.deepEqual(uiDelta.sourceChanges.map(c=>c.path),['shared/runtime/main.js','shared/runtime/rest-journey.js','shared/runtime/story-act1-art.js']);
assert.deepEqual(uiDelta.packagingChanges.map(c=>c.path),['game/build.mjs']);
assert.deepEqual(titleDelta.sourceChanges.map(c=>c.path),['shared/runtime/main.js']);
assert.deepEqual(titleDelta.packagingChanges.map(c=>c.path),['game/src/title.css']);
assert.match(titleDelta.sourceCommit,/^[0-9a-f]{40}$/);assert.equal(titleDelta.baseCurrentCommit,'85cdf1b1e7875e3f4aac1fff350a6f62a9be8305');
assert.equal(f.approvedDeltas.at(-2),titleDelta);assert.equal(f.approvedDeltas.at(-1),audioDelta);assert.equal(hash(f.approvedDeltas.slice(0,-2)),'fb201dffe122dc9283131482e42cdbcfaf99f83426eebcbfebbdcc22b5936d31','Every prior approval and its historical build evidence remains unchanged');
assert.equal(hash(f.approvedDeltas.slice(0,-1)),'d823e0905ee08af639da23180003517c6cc92176e2e2f491a723623dc05cb1ae','Every pre-audio approval including title build evidence is immutable');
assert.deepEqual(audioDelta.sourceChanges.map(c=>c.path),['shared/engine/src/bgm.ts','shared/engine/src/sound-design.ts','shared/runtime/story.js']);
assert.deepEqual(audioDelta.packagingChanges,[]);assert.equal(audioDelta.baseCurrentCommit,'28b829abb3a108f522be9f35aceca4795de637bd');assert.equal(audioDelta.sourceCommit,'3b848ddb72d4dc7ccacfe86c5bf999509868b9c3');
const priorSourceRows=structuredClone(f.sourceRows);
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
for(const [index,delta] of [finalDelta,bodyDelta,uiDelta,titleDelta,audioDelta].entries())for(const change of delta.sourceChanges){
 const later=[finalDelta,bodyDelta,uiDelta,titleDelta,audioDelta].slice(index+1).flatMap(d=>d.sourceChanges).find(c=>c.path===change.path);
 assert.equal(later?later.previousSha256:hash(sources[change.path]),change.sha256);assert.notEqual(change.sha256,change.previousSha256);if(delta!==bodyDelta)assert(change.provenance.length);else assert.match(delta.sourceCommit,/^[0-9a-f]{40}$/);
}
let exactDeltaNegatives=0;
const exactDeltas=[uiDelta,titleDelta,audioDelta],exactChanges=exactDeltas.flatMap(d=>[...d.sourceChanges,...d.packagingChanges]);
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
for(const delta of f.approvedDeltas.filter(d=>d.exactAddedText)){assert.equal(delta.path,'shared/runtime/narrative-revision.js');const source=sources[delta.path];assert.equal(source.split(delta.exactAddedText).length,2);assert.equal(hash(source.replace(delta.exactAddedText,'')),delta.beforeSha256,'Exact approved creation-default source delta');assert.equal(hash(source),delta.afterSha256);for(const change of delta.buildChanges){assert.equal(finalDelta.beforeBuilds[change.variant].parts[change.index],delta.afterSha256);assert.equal(finalDelta.beforeBuilds[change.variant].sha256,change.afterSha256);assert.equal(f.variants[change.variant].parts.filter(h=>h===delta.afterSha256).length,1,'Unchanged binding source occurs exactly once in final build');}}
assert.equal(Object.keys(sources).length,159);assert.equal(Object.keys(archive).length,133);
assert.deepEqual(Object.keys(archive).sort(),Object.keys(encounterDensityHistory.runtime).sort());
for(const[path,row]of Object.entries(encounterDensityHistory.runtime))assert.equal(hash(archive[path]),row.afterSha256,'Original source byte identity '+path);
for(const[k,n]of [['added',26],['changed',75],['unchanged',58]])assert.equal(f.sourceRows.filter(r=>r.kind===k).length,n);
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
mkdirSync('_local/reports/runtime-contracts',{recursive:true});writeFileSync('_local/reports/runtime-contracts/contracts.json',JSON.stringify({passed:true,currentSources:159,archiveSources:133,priorSources:130,added:26,changed:75,unchanged:58,sourceNegatives,exactDeltaNegatives,partNegatives,builds,archiveChecks,currentGameplayFingerprintIsNotProjected:true,scope:'Actual current build identity and explicit nonexecuted archive byte identity. Current behavior/completed-run compatibility is a separate gate, not waived.'},null,2)+'\n');console.log('PASS current159 provenance/8 builds/twoHTML, immutable133→130 and old fingerprints; '+sourceNegatives+' source negatives, '+partNegatives.length+' current part negatives; '+exactDeltaNegatives+' exact edit negatives');
