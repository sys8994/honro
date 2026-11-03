/** Explicit single-hero post-boss starting-pose fixture, NOT whole-stage proof.
 * No battle writes after setup; only existing App move/jump/frame controls. */
import assert from 'node:assert/strict';
import {evaluateLegalCast} from './legal-cast.mjs';
import {upperRecoveryGoal} from './upper-recovery-route.mjs';
import {createFinale} from './bootstrap.mjs';
const {app,e,b,C,ops}=await createFinale();ops.ready();assert(ops.select('archer'));const u=e.active;
b.units=b.units.filter(v=>v.id==='archer'||v.honroAct4Resident||v.id==='final40-dock-stair-7');Object.assign(u,{x:2480,y:3600,vx:0,vy:0,jumping:false,airborne:false,acted:false});
const foe=b.units.find(v=>v.side===1);Object.assign(foe,{x:3553.633666365126,y:2400,hp:9,vx:0,vy:0,awake:true});
const start=u.moveLeft,events=[];let frames=0;
const support=()=>e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id;
function tick(n=1){for(let i=0;i<n;i++){ops.frame();frames++;assert(frames<10000);assert.equal(e.active,u,'Unexpected active hero');assert(!u.dead);}}
function settle(){for(let n=0;n<480&&!e.grounded(u);n++)tick();assert(e.grounded(u));}
function refill(){assert(ops.defend(),'App defend rejected');for(let n=0;n<30000&&!app.canInput();n++)tick();assert(b.round<=3,'Registered three-round fixture ceiling');events.push({op:'actual-app-defend',round:b.round,hp:u.hp,move:u.moveLeft});}
function walk(x,air=false){for(let n=0;n<1400&&Math.abs(u.x-x)>20;n++){if(u.moveLeft<=120&&!air)refill();if(app.canInput())ops.move(Math.sign(x-u.x),C.STEP);tick();}if(!air)settle();events.push({op:'walk',goal:x,x:u.x,y:u.y,support:support(),move:u.moveLeft});console.log(events.at(-1));assert(Math.abs(u.x-x)<=20,'Blocked ordinary walk');}
function jumpLand(expected){assert(ops.jump());settle();events.push({op:'jump-land',x:u.x,y:u.y,support:support(),move:u.moveLeft});console.log(events.at(-1));assert.equal(support(),expected);}
for(let n=0;n<4&&support()!=='approved40-coast-west';n++){
 const goal=upperRecoveryGoal(u,{support:support(),foes:[foe],surface:v=>e.contactSurface(v.x,v.y-4,v.y+5)?.t?.id});assert(goal,'Missing support connection');walk(goal.x);
 if(goal.deckJoin){assert(ops.jump());tick(30);walk(2140,true);settle();assert.equal(support(),'approved40-departure-stair');}
 else jumpLand(goal.jumpLanding);
}
walk(3200);
assert.equal(support(),'approved40-coast-west');assert(b.round<=3);assert.equal(b.honroAct4PreviewState.water?.recoveries?.length||0,0);assert.equal(foe.hp,9);let shot;for(const aim of e.shotSeeds(u,C.SKILLS.A01,foe).slice(0,12)){const test=evaluateLegalCast(C,b,u.id,'A01',aim.angle,aim.power);if(test.safe&&test.targets.includes(foe.id)){shot=aim;break;}}assert(shot,'No safe upper-coast shot');const shotRound=b.round;assert(ops.fire('A01',shot.angle,shot.power));for(let n=0;n<30000&&!app.canInput();n++)tick();assert(foe.dead||foe.hp<=0,'Actual App shot failed');events.push({op:'actual-app-upper-foe-cast',shotRound,skill:'A01',...shot});
console.log(JSON.stringify({scope:'Explicit single-hero fixture then ordinary App controls, not natural battle/return acceptance',events,frames,round:b.round,initialMove:start,hp:u.hp,remainingMove:u.moveLeft,foe:{id:foe.id,hp:foe.hp}},null,2));
