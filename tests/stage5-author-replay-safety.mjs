/** Actual canonical regeneration and retired writer refusal; no relaxed equality. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {runtime} from '../game/tests/helpers.mjs';
import {authorStage5Waterfall} from '../tools/map-forge/stage5-waterfall.mjs';
const file='shared/data/campaign.json',bytes=await readFile(file),source=JSON.parse(bytes),g=await runtime({legacyMaps:false}),plain=x=>JSON.parse(JSON.stringify(x));
for(const input of [source,plain(g.HONRO_PROJECT)]){
 const before=plain(input),once=plain(authorStage5Waterfall(input,g)),twice=plain(authorStage5Waterfall(once,g));
 assert.deepEqual(input,before,'Pure author leaves input untouched');
 assert.deepEqual(once,before,'All stages, library, and project metadata remain exact');
 assert.deepEqual(twice,once,'Repeated replay remains exact');
 assert.equal(once.stages[4].initialState.honroStage5PaintRevision,undefined);
}
const retired=spawnSync(process.execPath,['tools/map-forge/apply-stage5-waterfall-paint.mjs'],{encoding:'utf8'});
assert.notEqual(retired.status,0);assert.match(retired.stderr,/image-terrain authoring is retired/);
assert.deepEqual(await readFile(file),bytes,'Retired CLI cannot rewrite source bytes');
console.log('PASS canonical and runtime all30 exact twice; pure inputs; retired paint CLI refuses without write');
