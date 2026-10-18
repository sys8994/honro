import {readFile,writeFile} from 'node:fs/promises';
import {applyStage6BrokenBridge} from './stage6-broken-bridge.mjs';
const file='shared/data/campaign.json',p=JSON.parse(await readFile(file,'utf8'));applyStage6BrokenBridge(p);await writeFile(file,JSON.stringify(p)+'\n');console.log('Authored Stage6 bridge and continuous lower road only');
