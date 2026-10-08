import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertReviewedRouteModes} from './act2-reviewed-route-helpers.mjs';
const p=JSON.parse(readFileSync(new URL('../shared/data/campaign.json',import.meta.url),'utf8'));
assertReviewedRouteModes(p);
const lean={stages:p.stages.filter(s=>s.metadata.stageId>=11&&s.metadata.stageId<=20)};
for(const id of [11,12,13,14,16,17,18,19,20]){
 const q=structuredClone(lean);q.stages.find(s=>s.metadata.stageId===id).design.space.routes.find(r=>r.id==='main').defaultJump=true;
 assert.throws(()=>assertReviewedRouteModes(q),/Unrelated mandatory routes remain walk-only/,'Reject unrelated jump allowance '+id);
}
for(const value of [false,undefined]){
 const q=structuredClone(lean),route=q.stages.find(s=>s.metadata.stageId===15).design.space.routes.find(r=>r.id==='main');
 if(value===undefined)delete route.defaultJump;else route.defaultJump=value;
 assert.throws(()=>assertReviewedRouteModes(q),/Exact approved forest\/cavern delta/,'Reject removed or false approved route flag');
}
console.log('PASS approved route modes: exact chapter 15 basic-jump mode, nine unrelated jump negatives, false/missing flag rejection');
