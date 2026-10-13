/** Exact frozen pre-waterfall input facade. Only for historical contracts. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {authorStage5Waterfall} from '../tools/map-forge/stage5-waterfall.mjs';
const text=readFileSync(new URL('./fixtures/stage5-waterfall/before-stage5.json',import.meta.url),'utf8');
const frozen=JSON.parse(text),clone=v=>JSON.parse(JSON.stringify(v));
export const stage5WaterfallBeforeHash=createHash('sha256').update(text).digest('hex');
assert.equal(stage5WaterfallBeforeHash,'483ee2642fcda9a7f49815d83cccbcf82583a57c3711eaa683ed5fddaf9ab439','The original stage5 fixture is immutable');
export function beforeStage5Waterfall(input,g){const p=clone(input),s=p.stages.find(s=>s.id==='stage-5');if(!s?.initialState?.honroStage5WaterfallRevision)return p;
 assert.equal(s.initialState.honroStage5WaterfallRevision,1,'Unknown revision is never silently projected');
 const baseline=clone(p);baseline.stages[baseline.stages.findIndex(s=>s.id==='stage-5')]=clone(frozen);const authored=authorStage5Waterfall(baseline,g).stages.find(s=>s.id==='stage-5');assert.deepEqual(s,clone(authored),'Only the exact current exact author delta may be removed for historical tests');
 p.stages[p.stages.findIndex(s=>s.id==='stage-5')]=clone(frozen);return p;}
