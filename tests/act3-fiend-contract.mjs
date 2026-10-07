// Fast source-only semantic audit; no engine, renderer or Native dependencies.
import {readFile} from 'node:fs/promises';
import {contractContent,assertFiendContract,assertFiendContractScope} from './act3-fiend-contract-helpers.mjs';
const project=JSON.parse(await readFile('shared/data/campaign.json','utf8')),baseline=JSON.parse(await readFile('tests/fixtures/act3-fiend-semantic-contract.json','utf8')),r=await contractContent(file=>readFile(file,'utf8'));
assertFiendContract(project,r.content,r.balance,r.archetypes,baseline);
assertFiendContractScope(project,r.content,r.balance,r.archetypes,baseline);
console.log('PASS frozen f2e9781 fiend/NPC/mission semantics: approved Act 3 art, terrain defaults and placement may evolve; 18 contract-drift cases are rejected');
