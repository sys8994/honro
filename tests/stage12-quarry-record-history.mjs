/** Explicit working-checkpoint capture. Never updates any original, 18 or 30
 * golden fixture. A label is provenance, not gameplay or visual approval. */
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {authorStage12Quarry} from '../tools/map-forge/apply-stage12-quarry.mjs';
import {createStage12QuarryReview,stage12QuarryRuntimeSources,quarryHistoryHash as hash} from './stage12-quarry-history-helpers.mjs';
const at=process.argv.indexOf('--label'),label=at>=0?process.argv[at+1]:null;
assert(label&&!label.startsWith('--'),'Use --label to identify the reviewed working checkpoint. No automatic approval is implied.');
const p=JSON.parse(await readFile('shared/data/campaign.json','utf8')),g=await runtime({legacyMaps:false}),stage=p.stages.find(s=>s.id==='stage-12');
assert(g.HonroStage12Quarry,'The production model bundle must include stage12-quarry before capture');
const authored=await authorStage12Quarry(p,g,{roster:stage.initialState.honroQuarryRoster,art:p.library.some(a=>a.id.startsWith('stage12:quarry-'))});
assert.equal(hash(authored),hash(p),'Capture only a campaign exactly reproduced by its current named generator');assert.equal(hash(g.HONRO_PROJECT),hash(p),'Production bundle must reproduce the same canonical campaign');
const required=['tools/map-forge/stage12-quarry-geometry.mjs','tools/map-forge/apply-stage12-quarry.mjs'];
const optional=['tools/environment/stage12-quarry-art.mjs','shared/assets/environment/stage12-quarry-far.svg'];
const paths=[...required];for(const path of optional){try{await access(path);paths.push(path);}catch(error){if(error.code!=='ENOENT')throw error;}}
const authoringSources=Object.fromEntries(await Promise.all(paths.map(async path=>[path,hash(await readFile(path,'utf8'))])));
const review=createStage12QuarryReview(p,stage12QuarryRuntimeSources(),{label,authoringSources});
await writeFile('tests/fixtures/stage12-quarry/history-reviewed.json',JSON.stringify(review,null,2)+'\n');
console.log('Recorded separate quarry checkpoint:',label,'with 29 unchanged maps, 560 unchanged assets,',review.addedAssets.length,'new assets. Original Stage12 and Stage30/18 fixtures remain unchanged.');
