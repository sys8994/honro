import {readFile,writeFile} from 'node:fs/promises';
import {applyStage3HanokTerrain} from './stage3-hanok-terrain.mjs';
const file='shared/data/campaign.json',p=JSON.parse(await readFile(file,'utf8'));
applyStage3HanokTerrain(p);await writeFile(file,JSON.stringify(p)+'\n');
console.log('Authored Stage3 intact-hanok ground, roof and approach only');
