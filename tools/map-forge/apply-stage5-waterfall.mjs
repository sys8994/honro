import {readFile,writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {authorStage5Waterfall} from './stage5-waterfall.mjs';
const file='shared/data/campaign.json',p=JSON.parse(await readFile(file,'utf8')),g=await runtime({legacyMaps:false}),q=authorStage5Waterfall(p,g);
if(JSON.stringify(p.stages.filter(s=>s.id!=='stage-5'))!==JSON.stringify(q.stages.filter(s=>s.id!=='stage-5')))throw Error('Another stage changed');
await writeFile(file,JSON.stringify(q,null,2)+'\n');console.log('Stage5 waterfall fresh-entry blockout authored.');
