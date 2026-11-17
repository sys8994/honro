import assert from 'node:assert/strict';
import {firstRenderContract} from './act4-middle-frame-contract.mjs';
const b={honroAct4PreviewState:{clock:0,visualDrawn:{}},terrain:[{hp:10}]},before=JSON.stringify(b),good=structuredClone(b);good.honroAct4PreviewState.observed={};good.honroAct4PreviewState.signalExposure=0;
assert.deepEqual(firstRenderContract(before,JSON.stringify(good),37),['observed','signalExposure']);
for(const id of [34,38]){assert.deepEqual(firstRenderContract(before,before,id),[]);assert.throws(()=>firstRenderContract(before,JSON.stringify(good),id));}
for(const mutate of [x=>x.honroAct4PreviewState.observed.signal=0,x=>x.honroAct4PreviewState.observed=[],x=>x.honroAct4PreviewState.signalExposure=.1,x=>x.honroAct4PreviewState.clock=1,x=>x.terrain[0].hp=9,x=>x.honroAct4PreviewState.visualDrawn.gesture=0,x=>x.extra=true]){const bad=structuredClone(good);mutate(bad);assert.throws(()=>firstRenderContract(before,JSON.stringify(bad),37));}
const old=structuredClone(good);old.honroAct4PreviewState.observed.existing=2;old.honroAct4PreviewState.signalExposure=.4;assert.deepEqual(firstRenderContract(JSON.stringify(old),JSON.stringify(old),37),[]);assert.throws(()=>firstRenderContract(JSON.stringify(old),JSON.stringify(good),37));
console.log('PASS: exact empty/zero first-frame additions only; other stages and pre-existing state immutable');
