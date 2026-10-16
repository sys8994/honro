/** Actual Stage27 roofs, ordinary body solver inputs. Prepared starting poses;
 * no terrain edits or altered jump parameters; not normal stage completion. */
import assert from 'node:assert/strict';import{mkdir,writeFile}from'node:fs/promises';import{runtime,battlefield}from'../game/tests/helpers.mjs';import{traverse}from'./act1-spatial-test-helpers.mjs';
const g=await runtime({legacyMaps:false}),rows=[];
for(const cls of['archer','mage'])for(const[id,x,floor]of[['loading-office-roof',2720,4250],['far-passage-roof',7350,4400],['ledger-room-roof',1780,2600]]){
 const{b,e}=battlefield(g,27),u=b.units.find(u=>u.side===0&&u.cls===cls),roof=b.terrain.find(t=>t.id===id+':collision:0');assert(roof?.oneWay);assert.equal(roof.y,floor-180);
 Object.assign(u,{x:x-120,y:floor,vx:0,vy:0,airborne:false,jumping:false,acted:false});b.active=u.id;const count=b.units.length,hp=u.hp;
 const into=traverse(g,b,e,u,[{x,y:floor}],{jump:false});assert(into.passed,JSON.stringify(into));assert(e.jump(u));let peak=u.y,passed=false;
 for(let n=0;n<480;n++){e.integrateBody(u,1/120);peak=Math.min(peak,u.y);passed||=u.y<roof.y;if(n>45&&e.grounded(u))break;}
 assert(passed);assert(Math.abs(u.y-roof.y)<.1,'lands on top of the same one-way roof');assert.equal(u.hp,hp);
 assert(e.drop(),'down+jump action available');for(let n=0;n<480;n++)e.integrateBody(u,1/120);assert(Math.abs(u.y-floor)<.1,'returns to original working floor');assert.equal(u.hp,hp);
 const out=traverse(g,b,e,u,[{x:x+120,y:floor}],{jump:false});assert(out.passed);assert.equal(b.units.length,count);rows.push({cls,id,approach:into.passed,upwardPass:true,roofLanding:roof.y,dropLanding:u.y,exit:out.passed,hpPreserved:true,peak});
}
// The intermediate eave must not make the mandatory third Jinmok link optional.
for(const cls of['archer','mage']){const{b,e}=battlefield(g,27),u=b.units.find(u=>u.side===0&&u.cls===cls);Object.assign(u,{x:7000,y:4220,vx:0,vy:0,airborne:false,jumping:false,acted:false});b.active=u.id;assert(e.jump(u));let peak=u.y;for(let n=0;n<240;n++){e.walk(u,-1,1/120);e.integrateBody(u,1/120);peak=Math.min(peak,u.y);}assert(peak>3950+30,'roof launch cannot reach the third Jinmok landing floor');rows.push({cls,kind:'third-link-not-bypassed',peak,requiredFloor:3950});}
await mkdir('review/stage27/working',{recursive:true});await writeFile('review/stage27/working/roof-access.json',JSON.stringify({scope:'Prepared geometry probes; actual default jump/drop/ordinary walking, full enemy roster retained',rows},null,2));console.log('PASS Stage27 6 roof approach/up-pass/top-land/down-drop/exit probes plus2 no-bypass probes');
