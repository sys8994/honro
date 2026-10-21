import {readFile,writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {authorStage5Waterfall} from './stage5-waterfall.mjs';
const file='shared/data/campaign.json',p=JSON.parse(await readFile(file,'utf8')),g=await runtime({legacyMaps:false}),q=authorStage5Waterfall(p,g);
if(JSON.stringify(p.stages.filter(s=>s.id!=='stage-5'))!==JSON.stringify(q.stages.filter(s=>s.id!=='stage-5')))throw Error('Another stage changed');
if(JSON.stringify(p)===JSON.stringify(q))console.log('Stage5 vector waterfall already canonical; source bytes unchanged.');
else {await writeFile(file,JSON.stringify(q)+'\n');console.log('Stage5 vector waterfall authored.');}
