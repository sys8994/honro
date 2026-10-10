import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {assertMigrationHistoryInputs,migrationSources,legacyRuntime,migrate} from './stage8-bier-migration-history-helpers.mjs';
import {stage8BierRuntimeSources,bierHistoryHash} from './stage8-bier-history-helpers.mjs';
const plain=v=>JSON.parse(JSON.stringify(v)),project=JSON.parse(await readFile('shared/data/campaign.json','utf8')),sources=stage8BierRuntimeSources(),migration=migrationSources(),input={project,sources,migration};
assertMigrationHistoryInputs(input);let negatives=0;
for(const change of [b=>b.stages[7].initialEnemies++,b=>b.stages[7].maxAlive++,b=>b.stages[6].initialEnemies++,b=>b.maxLevel++]){const balance=JSON.parse(sources['game/config/balance.json']);change(balance);assert.throws(()=>assertMigrationHistoryInputs({...input,sources:{...sources,'game/config/balance.json':JSON.stringify(balance)}}));negatives++;}
for(const path of ['shared/runtime/progression.js','shared/runtime/mission.js','shared/data/elements.json']){assert.throws(()=>assertMigrationHistoryInputs({...input,sources:{...sources,[path]:sources[path]+' '}}));negatives++;}
for(const path of Object.keys(migration)){assert.throws(()=>assertMigrationHistoryInputs({...input,migration:{...migration,[path]:migration[path]+' '}}));negatives++;}
for(const id of [0,7,29]){const changed=plain(project);changed.stages[id].units[0].x++;assert.throws(()=>assertMigrationHistoryInputs({...input,project:changed}));negatives++;}
const current=await runtime({legacyMaps:false}),currentRow=current.HONRO_BALANCE.stages[7],old=await legacyRuntime();
assert.equal(currentRow.initialEnemies,28,'Current production Stage8 keeps reviewed28');assert.equal(old.HONRO_BALANCE.stages[7].initialEnemies,10,'Only legacy comparison sees original10');
assert.equal(old.HonroProgression.plan(8),old.HONRO_BALANCE.stages[7],'Existing progression closure sees substituted input row');
const authored=await migrate();assert.equal(authored.stages[7].units.filter(u=>u.side===1).length,11,'Legacy constructor again authors ten original enemies plus boss');assert.equal(current.HONRO_BALANCE.stages[7],currentRow);assert.equal(currentRow.initialEnemies,28,'Historical constructor cannot mutate production runtime');
assert.deepEqual(stage8BierRuntimeSources(),sources);assert.deepEqual(migrationSources(),migration);assert.equal(bierHistoryHash(JSON.parse(await readFile('shared/data/campaign.json','utf8'))),bierHistoryHash(project));
await mkdir('_local/reports/stage8-bier',{recursive:true});const result={passed:true,negativeControls:negatives,legacyInitial:11,currentOrdinaryInitial:28,scope:'Current unchanged migration function with exact balance8 input projection only; original tests retain all assertions. No production source or original fixture rewrite.'};await writeFile('_local/reports/stage8-bier/migration-history.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
