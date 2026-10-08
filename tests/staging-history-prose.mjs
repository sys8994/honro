import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {beforeStagingProse} from './staging-history-helpers.mjs';
const delta=JSON.parse(await readFile(new URL('./fixtures/staging-prose-delta.json',import.meta.url),'utf8'));
const fixture={id:9,...delta.after,objective:'receiver',enemyLimit:6},clone=v=>JSON.parse(JSON.stringify(v));
assert.deepEqual(beforeStagingProse(fixture),{...fixture,...delta.before});
for(const key of Object.keys(delta.after)){const bad=clone(fixture);bad[key].push(['설오','unapproved']);assert.throws(()=>beforeStagingProse(bad));}
const changed={...fixture,enemyLimit:99};assert.equal(beforeStagingProse(changed).enemyLimit,99,'Non-prose changes remain visible to the parent frozen comparison');
assert.deepEqual(beforeStagingProse({id:8,story:[['설오','unchanged']]}),{id:8,story:[['설오','unchanged']]});
assert.deepEqual(fixture,{id:9,...delta.after,objective:'receiver',enemyLimit:6},'No input mutation');
console.log('PASS Historical entrance projection accepts only the exact approved three fields and preserves every other delta');
