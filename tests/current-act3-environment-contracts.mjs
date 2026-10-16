/** Final-only receipt after the already-passed immutable prior approval suite.
 * The v2 correction is independently checked against the same d7 inverse; this
 * does not claim a second full historical campaign replay or a browser clear. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {runtime} from '../game/tests/helpers.mjs';
import {beforeStage5Lake} from './stage5-lake-history-helpers.mjs';
import {beforeQuestProjectProse} from './quest-project-prose-history.mjs';
import {campaignHash as hash,assertCurrentCampaign} from './current-campaign-contract-helpers.mjs';
import {currentRuntimeManifest,currentRuntimeSources} from './current-runtime-contract-helpers.mjs';
import {act3FinalDelta,beforeAct3Campaign,afterAct3Campaign,assertAct3FinalNegatives} from './act3-environment-final-history.mjs';
const normalize=p=>beforeQuestProjectProse(beforeStage5Lake(p)),raw=normalize(JSON.parse(readFileSync('shared/data/campaign.json'))),g=await runtime({legacyMaps:false}),live=normalize(JSON.parse(JSON.stringify(g.HONRO_PROJECT)));
assertCurrentCampaign(raw);assertCurrentCampaign(live,{variant:'runtime'});
for(const [variant,current]of [['raw',raw],['runtime',live]]){const previous=beforeAct3Campaign(current,{variant});assert.equal(previous.library.length,640);assert.deepEqual(afterAct3Campaign(previous,{variant}),current,'Full exact forward/inverse '+variant);}
const negativeControls=assertAct3FinalNegatives({sources:currentRuntimeSources(),raw,runtime:live,manifest:currentRuntimeManifest});
assert.deepEqual(JSON.parse(JSON.stringify(g.HonroMaps.validate(raw))).filter(e=>e.level==='err'),[]);
await import('./act3-final-regeneration.mjs');
mkdirSync('_local/reports/campaign-contracts',{recursive:true});
writeFileSync('_local/reports/campaign-contracts/final-environment.json',JSON.stringify({passed:true,sourceCommit:act3FinalDelta().sourceCommit,supersedes:act3FinalDelta().supersedes,rawSha256:hash(raw),runtimeSha256:hash(live),negativeControls,previousAssets:640,finalAssets:raw.library.length,independentlyRegeneratedStages:10,scope:'Latest raw/runtime exact identity, preserved d7 inverse, mutation negatives and final ten authors. Prior640 independent recipe passed before the narrow v2 correction; browser remains separate.'},null,2)+'\n');
console.log('PASS final environment exact raw/runtime, same640 inverse, '+negativeControls+' mutation negatives and ten independent authors');
