/** Boss-phase starting-pose fixture. Ordinary enemies/other heroes are omitted
 * explicitly; thereafter only App movement/jump/frame controls are used. */
import assert from 'node:assert/strict';
import {createFinale} from './bootstrap.mjs';
const actions=[],{C,app,e,b,ops}=await createFinale({record:a=>actions.push(a)});assert(ops.ready());assert(ops.select('mage'));const u=e.active;
b.units=b.units.filter(v=>v.id==='mage'||v.honroAct4FinaleBoss||v.honroAct4Resident);Object.assign(u,{x:2480,y:3600,vx:0,vy:0,jumping:false,airborne:false,acted:false});const start=u.moveLeft;let frames=0,jumps=0;const samples=[];
for(const goal of [2350,2140,1850]){if(goal===2140){assert(ops.jump(),'ordinary pre-join jump unavailable');jumps++;for(let n=0;n<30;n++){ops.frame();frames++;}}let stalled=0;for(let n=0;n<1400&&u===e.active&&u.moveLeft>100&&Math.abs(u.x-goal)>20;n++){
 const old=u.x;if(app.canInput())ops.move(Math.sign(goal-u.x),C.STEP);ops.frame();frames++;if(frames%20===0)samples.push({frame:frames,x:u.x,y:u.y,vx:u.vx,vy:u.vy,support:e.contactSurface(u.x,u.y-8,u.y+10)?.t.id,recovering:u.honroAct4Recovering});stalled=Math.abs(u.x-old)<.01?stalled+1:0;
 // The single pre-join jump is registered; no retry jumps in this fixture.
 }if(goal===2140){for(let n=0;n<480&&!e.grounded(u)&&u===e.active;n++){ops.frame();frames++;}assert.equal(e.contactSurface(u.x,u.y-8,u.y+10)?.t.id,'approved40-departure-stair','join landing failed');}assert(Math.abs(u.x-goal)<=20,'Blocked retreat to '+goal+' at '+u.x+','+u.y);}
for(let n=0;n<480&&!e.grounded(u)&&u===e.active;n++){ops.frame();frames++;}
console.log('route-samples',JSON.stringify(samples));console.log('water',JSON.stringify(b.honroAct4PreviewState?.water));
console.log('settled-candidate',JSON.stringify({x:u.x,y:u.y,grounded:e.grounded(u),hp:u.hp,active:e.active?.id,round:b.round}));
const surface=e.contactSurface(u.x,u.y-8,u.y+10)?.t.id;assert.equal(surface,'approved40-departure-stair');assert(u.y<b.honroAct4Design.tide.high-50);assert(u.hp>0);console.log(JSON.stringify({scope:'One-hero boss-phase fixture, not party combat proof',x:u.x,y:u.y,surface,spent:start-u.moveLeft,hp:u.hp,frames,jumps,actions},null,2));
