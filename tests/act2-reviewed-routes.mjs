import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertReviewedRouteModes} from './act2-reviewed-route-helpers.mjs';
const p=JSON.parse(readFileSync(new URL('../shared/data/campaign.json',import.meta.url),'utf8'));
assertReviewedRouteModes(p);
const lean={stages:p.stages.filter(s=>s.metadata.stageId>=11&&s.metadata.stageId<=20)};
for(const id of [11,12,13,17,18,19,20]){
 const q=structuredClone(lean);q.stages.find(s=>s.metadata.stageId===id).design.space.routes.find(r=>r.id==='main').defaultJump=true;
 assert.throws(()=>assertReviewedRouteModes(q),/Unrelated mandatory routes remain walk-only/,'Reject unrelated jump allowance '+id);
}
for(const id of [14,15,16])for(const value of [false,undefined]){
 const q=structuredClone(lean),route=q.stages.find(s=>s.metadata.stageId===id).design.space.routes.find(r=>r.id==='main');
 if(value===undefined)delete route.defaultJump;else route.defaultJump=value;
 assert.throws(()=>assertReviewedRouteModes(q),/Exact approved/,'Reject removed or false approved route flag '+id);
}
for(const id of [14,16])for(const mutate of [
 s=>s.terrains[0].points[0].y++,
 s=>s.design.space.routes.find(r=>r.id==='main').anchors[1].x++,
 s=>s.design.space.routes.find(r=>r.id==='main').anchors.reverse(),
 s=>s.design.space.routes.push({id:'unapproved-route',kind:'optional-jump',anchors:[]}),
 s=>s.design.space.routes.find(r=>r.id==='main').playerStepOff=!s.design.space.routes.find(r=>r.id==='main').playerStepOff
]){const q=structuredClone(lean);mutate(q.stages.find(s=>s.metadata.stageId===id));assert.throws(()=>assertReviewedRouteModes(q),/Exact approved (?:layered cavern|cavern expansion)/,'Reject unreviewed layered cavern path/terrain '+id);}
console.log('PASS exact 14/15/16 route modes, seven unrelated jump negatives, six false/missing flags and ten geometry/path mutation negatives');
