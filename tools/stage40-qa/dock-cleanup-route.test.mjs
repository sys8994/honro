/** Explicit single-hero post-boss starting-pose fixture, NOT whole-stage proof.
 * No battle writes after setup; only existing App move/jump/frame controls. */
import assert from 'node:assert/strict';
import {evaluateLegalCast} from './legal-cast.mjs';
import {dockCleanupGoal} from './dock-cleanup-route.mjs';
import {createFinale} from './bootstrap.mjs';
const {app,e,b,C,ops}=await createFinale();ops.ready();assert(ops.select('archer'));const u=e.active;
// Explicit pose from observed R18 positions. Full entry resources, single hero:
// route/shot capability only, never a resumed natural R18 or pacing result.
const poses={'final40-dock-left-2':{x:437,y:2698,hp:929},'final40-dock-left-3':{x:560,y:2708,hp:929},'final40-dock-left-4':{x:1081,y:2754,hp:331},'final40-dock-right-3':{x:1801,y:2826,hp:193}};
b.units=b.units.filter(v=>v.id==='archer'||v.honroAct4Resident||poses[v.id]);
Object.assign(u,{x:2774,y:3600,vx:0,vy:0,jumping:false,airborne:false,acted:false});
const foes=b.units.filter(v=>v.side===1);assert.equal(foes.length,4);
for(const v of foes)Object.assign(v,poses[v.id],{vx:0,vy:0,awake:true});
const start=u.moveLeft,events=[];let frames=0;
const support=()=>e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id;
function tick(n=1){for(let i=0;i<n;i++){ops.frame();frames++;assert(frames<10000);assert.equal(e.active,u,'Unexpected active hero');assert(!u.dead);}}
function settle(){for(let n=0;n<480&&!e.grounded(u);n++)tick();assert(e.grounded(u));}
function refill(){assert(ops.defend(),'App defend rejected');for(let n=0;n<30000&&!app.canInput();n++)tick();assert(b.round<=3,'Registered three-round fixture ceiling');events.push({op:'actual-app-defend',round:b.round,hp:u.hp,move:u.moveLeft});}
function walk(x,air=false){for(let n=0;n<1400&&Math.abs(u.x-x)>20;n++){if(u.moveLeft<=120&&!air)refill();if(app.canInput())ops.move(Math.sign(x-u.x),C.STEP);tick();}if(!air)settle();events.push({op:'walk',goal:x,x:u.x,y:u.y,support:support(),move:u.moveLeft});console.log(events.at(-1));assert(Math.abs(u.x-x)<=20,'Blocked ordinary walk');}
function jumpLand(expected){assert(ops.jump());settle();events.push({op:'jump-land',x:u.x,y:u.y,support:support(),move:u.moveLeft});console.log(events.at(-1));assert.equal(support(),expected);}
for(let n=0;n<4&&support()!=='approved40-dock';n++){
 const goal=dockCleanupGoal(u,{support:support(),foes,surface:v=>e.contactSurface(v.x,v.y-4,v.y+5)?.t?.id});assert(goal,'Missing support connection');walk(goal.x);
 if(goal.deckJoin){assert(ops.jump());tick(30);walk(2140,true);settle();assert.equal(support(),'approved40-departure-stair');}
 else jumpLand(goal.jumpLanding);
}
assert.equal(support(),'approved40-dock');assert(b.round<=3);
assert.equal(b.honroAct4PreviewState.water?.recoveries?.length||0,0);
let shot;
for(const foe of foes.filter(v=>!v.dead))for(const aim of e.shotSeeds(u,C.SKILLS.A01,foe).slice(0,12)){
 const test=evaluateLegalCast(C,b,u.id,'A01',aim.angle,aim.power);
 if(test.safe&&test.enemyDamage>0){shot={...aim,target:foe.id,predicted:test};break;}
}
assert(shot,'No safe full-path dock shot');const before=foes.reduce((n,v)=>n+v.hp,0);
assert(ops.fire('A01',shot.angle,shot.power));for(let n=0;n<30000&&!app.canInput();n++){ops.frame();frames++;}
const damage=before-foes.reduce((n,v)=>n+v.hp,0);assert(damage>0,'Actual App cast did no damage');
console.log(JSON.stringify({scope:'POSED single-hero route/full-path cast fixture, not natural completion',events,frames,round:b.round,hp:u.hp,shot,damage},null,2));
