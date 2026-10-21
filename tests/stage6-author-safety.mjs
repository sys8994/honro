import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{spawnSync}from'node:child_process';import{runtime}from'../game/tests/helpers.mjs';import{applyStage6Positioning}from'../tools/map-forge/stage6-positioning.mjs';
const plain=x=>JSON.parse(JSON.stringify(x)),file='shared/data/campaign.json',bytes=await readFile(file),g=await runtime({legacyMaps:false});
for(const original of [JSON.parse(bytes),plain(g.HONRO_PROJECT)]){const once=applyStage6Positioning(plain(original)),twice=applyStage6Positioning(plain(once));assert.deepEqual(twice,once);assert.deepEqual(once.stages.filter((s,i)=>i!==5),original.stages.filter((s,i)=>i!==5));assert.deepEqual(once.library,original.library);}
assert.deepEqual(applyStage6Positioning(plain(g.HONRO_PROJECT)),plain(g.HONRO_PROJECT),'Runtime author replay is exact');
const result=spawnSync(process.execPath,['tools/map-forge/apply-stage6-broken-bridge.mjs'],{encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/image-terrain author retired/);assert.deepEqual(await readFile(file),bytes);
console.log('PASS vector author twice; other29/library unchanged; retired image writer refuses before write');
