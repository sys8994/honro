import assert from 'node:assert/strict';
import {dependencyClosure} from '../tools/quantitative-playtest/stage-runtime.mjs';
const library=[{id:'common',texture:'nested'},{id:'unused'},{id:'nested',parent:'common'},{id:'boat'}];
assert.deepEqual(dependencyClosure({elements:[{assetId:'common'}],design:{vectorArrivalBoatAssetId:'boat'}},library).map(a=>a.id),['common','nested','boat']);
assert.throws(()=>dependencyClosure({elements:[{assetId:'missing'}]},library),/Missing required/);
assert.throws(()=>dependencyClosure({design:{vectorDoorAssetId:'missing'}},library),/Missing required/);
assert.deepEqual(library.map(a=>a.id),['common','unused','nested','boat']);
console.log('PASS recursive/cyclic asset closure, native order, dynamic design references, missing-asset fail-closed');
