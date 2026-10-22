import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {packJson,unpackJson} from '../shared/json-pool.mjs';
const value=Object.fromEntries(await Promise.all(['narrative-current','narrative-compat-v1','stage-contracts'].map(async name=>[name,JSON.parse(await readFile(`shared/data/${name}.json`,'utf8'))])));
assert.deepEqual(unpackJson(JSON.parse(JSON.stringify(packJson(value)))),value,'All current/legacy payloads restored exactly');
const probe={a:[{x:'same'},-1,0,1,false,true,null,[],{}],b:[{x:'same'},-1,0,1,false,true,null,[],{}],literal:{version:1,nodes:['x'],root:0}};
const restored=unpackJson(packJson(probe));assert.deepEqual(restored,probe);restored.a[0].x='mutated';assert.equal(restored.b[0].x,'same','Dedup must not introduce aliases');
assert.throws(()=>unpackJson({version:1,nodes:[[0,0]],root:0}),/reference/);
console.log('PASS canonical current/compat/contracts deep equality; primitives, nested arrays, independent object identity, invalid cyclic reference');
