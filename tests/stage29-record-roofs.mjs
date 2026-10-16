/** Actual Stage29 roof collision with isolated starting poses; not normal completion. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {isolate,drive} from './tactical-finite-driver.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
for(const cls of C.CLASS_IDS)for(const [id,x,floor,top,left,right]of [['r29-record-vault',2700,2220,2020,2620,2870],['r29-inspection-roof',4970,2760,2560,4830,5110]]){
 const q=battlefield(g,29),{e,b}=q,u=isolate(q,cls);Object.assign(u,{x,y:floor,vx:0,vy:0,airborne:false,jumping:false});
 const t=b.terrain.find(t=>t.id===id);assert(t.oneWay,id);assert(e.grounded(u));
 const approach=drive(g,q,u,[{x:left,y:floor},{x,y:floor}],{automaticDrop:true});assert(approach.passed,JSON.stringify(approach.failure));
 assert(e.jump(u));let minimum=floor;for(let n=0;n<700;n++){e.tick(C.STEP);minimum=Math.min(minimum,u.y);if(n>5&&e.grounded(u))break;}
 assert(minimum<top,`${cls} crossed roof upward`);assert(Math.abs(u.y-top)<1,`${cls} roof landing ${u.y}`);assert(e.canDrop(u));
 assert(e.drop(u));for(let n=0;n<700;n++){e.tick(C.STEP);if(n>30&&e.grounded(u)&&!u.platformDrop)break;}assert(Math.abs(u.y-floor)<1,`${cls} drop ${u.y}`);
 const leave=drive(g,q,u,[{x:right,y:floor}],{automaticDrop:true});assert(leave.passed,JSON.stringify(leave.failure));
 assert.equal(e.projectileCollision({x,y:top+130},{x,y:top-80},0,u.id,[],false),null,'Upward shot passes');
 assert.equal(e.projectileCollision({x,y:top-80},{x,y:top+130},0,u.id,[],false)?.terrain?.id,id,'Downward shot hits top');
 rows.push({cls,roof:id,minimum,landedAt:top,droppedTo:floor,approach:approach.passed,leave:leave.passed,upwardShot:'passes',downwardShot:'hits'});
}
await writeFile('review/stage29/roofs.json',JSON.stringify({passed:true,scope:'Actual fresh stage terrain; isolated single actor positioned on existing floor. Engine jump/drop/move, finite move budgets and projectile collision. No normal-clear claim.',rows},null,2));console.log('PASS',rows.length,'four-class actual roof ascent / landing / drop / approach / exit / shot contracts');
