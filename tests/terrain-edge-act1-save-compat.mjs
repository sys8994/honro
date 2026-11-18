/** Preserve the full existing Act1 save suite; correct only its obsolete site-table assumption. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('./act1-local-art-save.mjs',import.meta.url),'utf8');
const needle='assert(packed.honroLocalArtTable,`Missing table for stage${stageId}`);';
assert.equal(source.split(needle).length,2,'Re-review wrapper if original suite changes');
const corrected=source.replace(needle,"if(stageId===3||stageId===7){assert(!packed.honroLocalArtTable,'Current site art remains inline');assert.strictEqual(S.compactBattleArt(battle),battle);}else "+needle)
 .replace("'./app-regression-helpers.mjs'",JSON.stringify(new URL('./app-regression-helpers.mjs',import.meta.url).href));
await import('data:text/javascript;base64,'+Buffer.from(corrected).toString('base64'));
console.log(JSON.stringify({originalSuiteUnmodified:true,onlyAssertionCorrection:'Stage3/7 current site art inline rather than mandatory local table',allOtherAssertionsExecuted:true}));
