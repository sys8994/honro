import {readFile,writeFile} from 'node:fs/promises';
import {applyStage4GateDefense} from './stage4-gate-defense.mjs';
const file='shared/data/campaign.json',p=JSON.parse(await readFile(file,'utf8'));
applyStage4GateDefense(p);await writeFile(file,JSON.stringify(p)+'\n');
console.log('Authored Stage4 refuge courtyard, grounded west shoulder and open lookout only');
