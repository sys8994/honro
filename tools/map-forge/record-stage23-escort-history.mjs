/** Explicit reviewed-current capture. Original23/entry and all22 older fixture
 * files remain immutable. A capture is not normal-play or browser approval. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {runtimeParts} from '../../shared/build.mjs';
import {authorStage23LoadingYard} from './stage23-loading-yard.mjs';
import * as S from '../../tests/stage23-escort-history-helpers.mjs';
import * as Q from '../../tests/stage12-quarry-history-helpers.mjs';
const at=process.argv.indexOf('--label'),label=at<0?null:process.argv[at+1];assert(label&&!label.startsWith('--'),'Use --label with an explicitly reviewed working checkpoint');
const hash=S.escortHistoryHash,p=JSON.parse(await readFile('shared/data/campaign.json','utf8')),sources=S.stage23EscortRuntimeSources();
S.assertStage23EscortScope(p);S.assertStage23EscortRuntimeScope(sources);
const g=await runtime({legacyMaps:false});assert(g.HonroStage23Escort,'New runtime must be in the common production model bundle');assert.equal(hash(g.HONRO_PROJECT),hash(p),'Production project equals canonical source');
const authored=await authorStage23LoadingYard(g,p,{roster:p.stages[22].initialState.honroEscortYardRoster,art:true});assert.equal(hash(authored),hash(p),'Current generator must reproduce every canonical byte');
const paths=[...S.stage23EscortBefore.authoringSources.map(row=>row.path),...S.stage23EscortScope.allowedAddedAuthoring],authoringSources=Object.fromEntries(await Promise.all(paths.map(async path=>[path,hash(await readFile(path,'utf8'))])));
const provisional=S.createStage23EscortReview(p,sources,{label,authoringSources}),priorSources=S.beforeStage23EscortRuntimeSources(sources,{review:provisional}),raw=await runtimeParts({vector:false,render:false}),prefix='globalThis.HONRO_PROJECT=HonroObjectiveRevision.author(HonroAct1Roster.author(',suffix='));';
const temple=parts=>[...parts.filter(s=>!s.startsWith('globalThis.HONRO_PROJECT='))];
const app=await Promise.all(['main','story','interactions','rest-journey','training'].map(n=>readFile('shared/runtime/'+n+'.js','utf8')));
function project(parts){const added=new Set(S.stage23EscortScope.allowedAddedRuntime.map(path=>sources[path].replace(/\r\n/g,'\n')));return parts.flatMap(part=>{if(added.has(part))return[];if(part==='globalThis.HONRO_BALANCE='+sources['game/config/balance.json'].replace(/\r\n/g,'\n')+';')return['globalThis.HONRO_BALANCE='+priorSources['game/config/balance.json'].replace(/\r\n/g,'\n')+';'];if(part.startsWith('globalThis.HONRO_PROJECT=')){assert(part.startsWith(prefix)&&part.endsWith(suffix));return[prefix+JSON.stringify(S.beforeStage23Escort(JSON.parse(part.slice(prefix.length,-suffix.length)),{review:provisional}))+suffix];}return[part];});}
const rawPrior=project(raw),templeCurrent=[...temple(raw),...app],templePrior=project(templeCurrent);
// The older immutable complete fingerprints independently certify that the
// recorder's new projection did not merely bless unrelated source drift.
Q.beforeStage12QuarryFingerprintParts(rawPrior,{sources:priorSources});Q.beforeStage18BellFingerprintParts(templePrior,{sources:priorSources});
const fingerprints={raw:{current:hash(raw.join('\n')),before:hash(rawPrior.join('\n'))},temple:{current:hash(templeCurrent.join('\n')),before:hash(templePrior.join('\n'))}};
const review=S.createStage23EscortReview(p,sources,{label,authoringSources,fingerprints});S.beforeStage23EscortFingerprintParts(raw,{sources,review});S.beforeStage23EscortFingerprintParts(templeCurrent,{sources,review});
const checkOnly=process.argv.includes('--check-only');if(!checkOnly)await writeFile('tests/fixtures/stage23-escort-history-reviewed.json',JSON.stringify(review,null,2)+'\n');console.log(JSON.stringify({recorded:!checkOnly,checkedLabel:label,sourceCommit:review.sourceCommit,unchangedMaps:29,unchangedAssets:S.stage23EscortBefore.library.length,newAssets:review.addedAssets.length,sourceFiles:Object.keys(sources).length,fingerprints,scope:'Exact reviewed-current capture. No original fixtures updated, no historical code executed, no browser/fullplay claim.'},null,2));
