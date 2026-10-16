/** Isolated stage22 review author. Existing live battles keep their saved map. */
import {readFile,writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {authorStage22Vertical} from './apply-stage22-vertical.mjs';
import {applyStage22VerticalArt} from '../environment/stage22-vertical-art.mjs';
const input=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const g=await runtime({legacyMaps:false}),p=applyStage22VerticalArt(await authorStage22Vertical(input,g));
if(JSON.stringify(input.stages.filter(s=>s.metadata.stageId!==22))!==JSON.stringify(p.stages.filter(s=>s.metadata.stageId!==22)))throw Error('Unrelated stage changed');
for(const key of ['initialState','units','markers','events','anchors'])if(JSON.stringify(input.stages[21][key])!==JSON.stringify(p.stages[21][key]))throw Error('Stage22 preserved contract changed: '+key);
await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');
console.log('Stage22 review authored; other29 and all objectives/actors/events exact.');
