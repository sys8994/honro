/** Explicit reviewed-current capture. Never updates before8/entry or any older
 * frozen input. A capture is not gameplay, browser or visual acceptance. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {runtimeParts} from '../../shared/build.mjs';
import {authorStage8Bier} from './stage8-bier.mjs';
import * as S from '../../tests/stage8-bier-history-helpers.mjs';
import * as E from '../../tests/stage23-escort-history-helpers.mjs';
const at=process.argv.indexOf('--label'),label=at<0?null:process.argv[at+1];assert(label&&!label.startsWith('--'),'Use --label for an explicitly reviewed complete working checkpoint');
const hash=S.bierHistoryHash,p=JSON.parse(await readFile('shared/data/campaign.json','utf8')),sources=S.stage8BierRuntimeSources();
const protectedInputs=[['tests/fixtures/stage8-bier/history-before.json','68f20d3def9b0cc43f251ce837ef689cdccc4381a99ebb8ae89d0d06ae8e78a6'],['tests/fixtures/stage8-bier/before-stage8.json','52737bf29c30acf61aa234d6f59dfe5b12c830355c93f97f3a68e94d3f870f22'],['tests/fixtures/stage8-bier/entry-ledger.json','a42a481bf1277bef99e6f6ab2eca2b98d94e1a7a3720ae01e1272ab429a2e73f'],...S.stage8BierBefore.protectedFixtures.map(r=>[r.path,r.sha256])];
for(const[path,digest]of protectedInputs)assert.equal(hash(await readFile(path,'utf8')),digest,'Immutable original fixture '+path);
S.assertStage8BierScope(p);S.assertStage8BierRuntimeScope(sources);
const authoringSources=S.stage8BierAuthoringSources();S.assertStage8BierAuthoringScope(authoringSources);
const g=await runtime({legacyMaps:false});assert(g.HonroStage8Bier,'New model must run in the common production bundle');assert.equal(hash(g.HONRO_PROJECT),hash(p),'Production project equals canonical source');
const authored=await authorStage8Bier(p,g,{roster:p.stages[7].initialState.honroStage8BierRoster,art:true});assert.equal(hash(authored),hash(p),'Current generator reproduces every canonical byte');
const provisional=S.createStage8BierReview(p,sources,{label,authoringSources}),priorSources=S.beforeStage8BierRuntimeSources(sources,{review:provisional}),raw=await runtimeParts({vector:false,render:false}),prefix='globalThis.HONRO_PROJECT=HonroObjectiveRevision.author(HonroAct1Roster.author(',suffix='));';
const app=await Promise.all(['main','story','interactions','rest-journey','training'].map(n=>readFile('shared/runtime/'+n+'.js','utf8')));
function project(parts){const added=new Set(S.stage8BierScope.allowedAddedRuntime.map(path=>sources[path].replace(/\r\n/g,'\n')));return parts.flatMap(part=>{if(added.has(part))return[];if(part==='globalThis.HONRO_BALANCE='+sources['game/config/balance.json'].replace(/\r\n/g,'\n')+';')return['globalThis.HONRO_BALANCE='+priorSources['game/config/balance.json'].replace(/\r\n/g,'\n')+';'];if(part.startsWith('globalThis.HONRO_PROJECT=')){assert(part.startsWith(prefix)&&part.endsWith(suffix));return[prefix+JSON.stringify(S.beforeStage8Bier(JSON.parse(part.slice(prefix.length,-suffix.length)),{review:provisional}))+suffix];}return[part];});}
const rawPrior=project(raw),templeCurrent=[...raw.filter(s=>!s.startsWith('globalThis.HONRO_PROJECT=')),...app],templePrior=project(templeCurrent);
assert.equal(hash(rawPrior.join('\n')),S.stage8BierBefore.runtime.beforeFingerprintSha256,'Fixed bf8b108 complete raw-model fingerprint');
E.beforeStage23EscortFingerprintParts(rawPrior,{sources:priorSources});E.beforeStage18BellFingerprintParts(templePrior,{sources:priorSources});
const fingerprints={raw:{current:hash(raw.join('\n')),before:hash(rawPrior.join('\n'))},temple:{current:hash(templeCurrent.join('\n')),before:hash(templePrior.join('\n'))}};
const review=S.createStage8BierReview(p,sources,{label,authoringSources,fingerprints});S.beforeStage8BierFingerprintParts(raw,{sources,review});S.beforeStage8BierFingerprintParts(templeCurrent,{sources,review});
assert.deepEqual(S.stage8BierRuntimeSources(),sources,'Source stability throughout capture');assert.deepEqual(S.stage8BierAuthoringSources(),authoringSources,'Authoring stability throughout capture');assert.equal(hash(JSON.parse(await readFile('shared/data/campaign.json','utf8'))),hash(p));
for(const[path,digest]of protectedInputs)assert.equal(hash(await readFile(path,'utf8')),digest,'Immutable inputs still exact');
const checkOnly=process.argv.includes('--check-only');if(!checkOnly)await writeFile('tests/fixtures/stage8-bier/history-reviewed.json',JSON.stringify(review,null,2)+'\n');
console.log(JSON.stringify({recorded:!checkOnly,checkedLabel:label,sourceCommit:review.sourceCommit,unchangedMaps:29,unchangedAssets:580,newAssets:review.addedAssets.length,baselineSourceFiles:130,currentSourceFiles:Object.keys(sources).length,protectedEarlierFixtures:31,fingerprints,scope:'Exact reviewed-current capture after source and generator checks. No original fixtures updated or historical source executed; no browser/fullplay/visual claim.'},null,2));
