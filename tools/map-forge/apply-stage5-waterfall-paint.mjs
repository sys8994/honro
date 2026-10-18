import {readFile,writeFile} from 'node:fs/promises';
import {applyStage5WaterfallPaint} from './stage5-waterfall-paint.mjs';
const file='shared/data/campaign.json',p=JSON.parse(await readFile(file,'utf8'));
applyStage5WaterfallPaint(p);await writeFile(file,JSON.stringify(p)+'\n');console.log('Authored only Stage5 west pine/receiver geometry and grounded encounter positions');
