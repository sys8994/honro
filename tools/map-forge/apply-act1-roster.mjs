/** Reproduce the default Act 1 roster without modifying combat budgets or Act 2+. */
import {readFile,writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
const file='shared/data/campaign.json',project=JSON.parse(await readFile(file,'utf8'));
const later=JSON.stringify(project.stages.slice(10));
const g=await runtime({legacyMaps:false});g.HonroAct1Roster.author(project);
if(later!==JSON.stringify(project.stages.slice(10)))throw Error('Act 1 roster changed a later act');
await writeFile(file,JSON.stringify(project,null,2)+'\n');
console.log('Act 1 possessed roster authored; later acts and combat budgets preserved.');
