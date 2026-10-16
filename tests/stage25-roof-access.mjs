import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {refineRoofAccess25,ROOF25} from '../tools/map-forge/stage25-roof-access.mjs';
const g=await runtime({legacyMaps:false});
// Author only in-memory when run before generator integration.
refineRoofAccess25(g.HONRO_PROJECT,g.HONRO_PROJECT.stages[24]);
const rows=[];
for(const cls of ['archer','mage'])for(const r of ROOF25){
 const {b,e}=battlefield(g,25),u=b.units.find(u=>u.side===0&&u.cls===cls);b.units=[u];b.active=u.id;b.side=0;b.phase='aim';e.checkEnd=()=>false;
 Object.assign(u,{x:r.probeX-90,y:r.floor,vx:0,vy:0,jumping:false,airborne:false,acted:false});
 const hp=u.hp,roof=b.terrain.find(t=>t.id===r.id+':collision:0');assert(roof.oneWay);
 for(let i=0;i<30;i++){e.walk(u,1,1/60);e.integrateBody(u,1/60);}
 assert(u.x>r.probeX-90&&u.y===r.floor,'ordinary approach on original gallery');
 assert(e.jump(u),r.id+' upward jump');let apex=u.y;
 for(let i=0;i<240;i++){e.integrateBody(u,1/60);apex=Math.min(apex,u.y);}
 assert(apex<r.y,`${cls} ${r.id} passes upward through roof`);assert.equal(u.y,r.y,`${cls} lands on roof`);
 const beforeDrop=u.moveLeft;assert(e.drop(u),`${cls} drop accepted`);
 for(let i=0;i<240;i++)e.integrateBody(u,1/60);
 assert.equal(u.y,r.floor,`${cls} returns to same gallery`);assert.equal(u.hp,hp);assert.equal(u.moveLeft,beforeDrop);
 const returnX=u.x;for(let i=0;i<30;i++){e.walk(u,-1,1/60);e.integrateBody(u,1/60);}
 assert(u.x<returnX&&u.y===r.floor,'ordinary exit on original gallery');
 rows.push({cls,roof:r.id,apex,land:r.y,returnY:u.y,totalMovementCost:u.maxMove-u.moveLeft});
}
// From the now-accessible inspection roof, the next required gallery remains
// outside ordinary jump reach. No debug coordinates change during this probe.
for(const cls of ['archer','mage']){
 const {b,e}=battlefield(g,25),u=b.units.find(u=>u.side===0&&u.cls===cls);b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 Object.assign(u,{x:2900,y:4770,vx:0,vy:0,jumping:false,airborne:false});assert(e.jump(u));let apex=u.y;
 for(let i=0;i<240;i++){e.integrateBody(u,1/60);apex=Math.min(apex,u.y);}
 assert(apex>4500);assert.equal(u.y,4770);rows.push({cls,requiredGalleryY:4500,apex,land:u.y});
}
console.log(JSON.stringify({passed:true,mode:'Enemy-free exact geometry fixture; finite jump/drop input; no normal campaign completion claim',rows},null,2));
