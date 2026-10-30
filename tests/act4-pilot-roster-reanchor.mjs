/** A terrain reanchor must not silently redesign the encounter or its budget. */
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const base=JSON.parse(await readFile('tools/act4-pilot/layouts/stage31-roster.json')),next=JSON.parse(await readFile('tools/act4-pilot/layouts/stage31-roster-v4.json'));
for(const k of ['total','elites','midbosses','enemyActionLimit','roles','cells','pockets'])assert.deepEqual(next[k],base[k],k+' changed during geometry-only reanchor');
for(const k of ['layoutSHA256','stageSHA256','stageCanonicalSHA256'])assert.match(next[k],/^[a-f0-9]{64}$/);
assert.equal(next.stageCanonicalSHA256,'820afd2767fbf275692ef80c02ed8da59424e86bba0aabc21b1a11d6a0f4552f');
console.log('PASS geometry-only roster reanchor invariant; not native placement/play evidence');
