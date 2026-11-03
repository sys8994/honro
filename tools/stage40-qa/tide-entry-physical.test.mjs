/** Explicit observed-R13 starting-pose/tide fixture, not normal-stage evidence. */
import assert from 'node:assert/strict';
import {createFinale} from './bootstrap.mjs';
import {finaleDeckGoal} from './role-route-deck.mjs';
const actions=[],{app,e,b,C,ops}=await createFinale({record:a=>actions.push(a)});ops.ready();assert(ops.select('mage'));const u=e.active;
b.units=b.units.filter(v=>v.id==='mage'||v.honroAct4FinaleBoss||v.honroAct4Resident);Object.assign(u,{x:2192.552601980562,y:2891.6967053465983,vx:0,vy:0,jumping:false,airborne:false,acted:false});b.round=13;Object.assign(b.honroAct4PreviewState.tide,{phase:'high',surface:3412.5,warningRound:9,highRound:13,lowRound:15,started:true,warned:true});
const startHp=u.hp,startMove=u.moveLeft,surface=v=>e.contactSurface(v.x,v.y-4,v.y+5)?.t?.id;const goal=finaleDeckGoal(u,{b,support:surface(u),foes:b.units.filter(v=>v.side===1),surface});assert.equal(goal.kind,'visible-tide-no-descent');assert(!goal.drop);
for(let n=0;n<300&&Math.abs(u.x-goal.x)>20;n++){if(app.canInput())ops.move(Math.sign(goal.x-u.x),C.STEP);ops.frame();}for(let n=0;n<120;n++)ops.frame();
assert.equal(surface(u),'approved40-dock');assert.equal(u.hp,startHp);assert.equal(b.honroAct4PreviewState.water?.recoveries?.length||0,0);assert(!actions.some(a=>a.operation==='drop'));
console.log(JSON.stringify({scope:'Explicit pose/tide fixture followed by ordinary App movement; no full-stage claim',goal,x:u.x,y:u.y,hp:u.hp,moveSpent:startMove-u.moveLeft,round:b.round,tide:b.honroAct4PreviewState.tide.phase,recoveries:0},null,2));
