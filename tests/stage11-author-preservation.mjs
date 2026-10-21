/** Current Stage11 regeneration contract; frozen historical author tests remain intact. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {authorStage11Ravine} from '../tools/map-forge/apply-stage11-ravine.mjs';
const original=JSON.parse(await readFile('shared/data/campaign.json','utf8')),g=await runtime({legacyMaps:false});
const plain=v=>JSON.parse(JSON.stringify(v));
const once=plain(await authorStage11Ravine(structuredClone(original),g)),twice=plain(await authorStage11Ravine(structuredClone(once),g));
assert.deepEqual(once,original,'Current full author preserves approved density entry, every map and all Library art');
assert.deepEqual(twice,original,'Second application remains semantically idempotent');
const wave=p=>p.stages[10].markers.find(m=>m.id==='wave-hold-knots');
assert.equal(wave(once).x,6730);assert.equal(wave(once).y,6736);
console.log(JSON.stringify({pass:true,stages:30,library:'exact',currentWave:wave(once),authorApplications:2}));
