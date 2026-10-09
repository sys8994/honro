/** Explicit working-checkpoint capture. Never updates Stage18 golden data. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {authorStage30Ferry} from '../tools/map-forge/apply-stage30-ferry.mjs';
import {createStage30FerryReview,stage30FerryRuntimeSources,ferryHistoryHash as hash} from './stage30-ferry-history-helpers.mjs';
const at=process.argv.indexOf('--label'),label=at>=0?process.argv[at+1]:null;assert(label&&!label.startsWith('--'),'Use --label to identify the reviewed working checkpoint. No automatic approval is implied.');
const p=JSON.parse(await readFile('shared/data/campaign.json','utf8')),g=await runtime({legacyMaps:false});assert(g.HonroStage30Ferry,'The production model bundle must include stage30-ferry before capture');
const authored=await authorStage30Ferry(p,g,{roster:p.stages[29].initialState.honroFerryRoster,art:p.library.some(a=>a.id.startsWith('stage30:ferry-'))});assert.equal(hash(authored),hash(p),'Capture only a campaign exactly reproduced by its current named generator');
const paths=['tools/map-forge/stage30-ferry.mjs','tools/map-forge/stage30-ferry-layout.json','tools/map-forge/apply-stage30-ferry.mjs','tools/environment/stage30-ferry-art.mjs','shared/assets/environment/stage30-ferry-far.svg'],authoringSources=Object.fromEntries(await Promise.all(paths.map(async path=>[path,hash(await readFile(path,'utf8'))]))),review=createStage30FerryReview(p,stage30FerryRuntimeSources(),{label,authoringSources});
await writeFile('tests/fixtures/stage30-ferry/history-reviewed.json',JSON.stringify(review,null,2)+'\n');console.log('Recorded separate ferry checkpoint:',label,'with29 unchanged maps,545 unchanged assets,',review.addedAssets.length,'new assets. Old Stage18 fixtures were not changed.');
