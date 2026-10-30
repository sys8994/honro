import assert from 'node:assert/strict';
import {CONTRACT,objective,foesFor,movementGoal,previewAim,selectSkill,engagementDistance} from '../tools/quantitative-playtest/policy.mjs';
const u={id:'archer',x:100,y:500,h:70,facing:1};
const b={units:[{id:'a4-wreck',side:1,hp:999,x:120,y:500},{id:'guard',side:1,hp:10,x:300,y:500}],terrain:[],honroAct4Design:{rescue:{anchor:{x:400,y:500},net:{x:600,y:550},exit:900}},honroAct4PreviewState:{}};
assert.equal(foesFor(b,u,39,{left:0,right:400,top:0,bottom:700})[0].id,'guard');assert.equal(objective(b,u,39).kind,'stabilize');
b.honroAct4PreviewState.exitStable={};assert.equal(objective(b,u,39).kind,'release-net');b.honroAct4PreviewState.netOpen={};assert.equal(objective(b,u,39).x,800);
assert.equal(movementGoal(b,u,b.units[1],39,'gimmick').kind,'rescue-exit');
let calls=0;const e={predict(actor,skill,angle,power){calls++;return {points:[{x:angle*10,y:500-power*100}],x:0,y:0};}};
const shot=previewAim(e,u,{}, {...u,x:350},()=>.5);assert.equal(calls,25);assert.equal(shot.angle,35);assert(shot.power>=.15&&shot.power<=.98);assert.equal(CONTRACT.maxCombatRounds,20);
console.log('PASS optional boss exclusion, rescue objective progression, fixed preview budget and uncertainty bounds');

const knight={cls:'knight',loadout:['S00','S06']},skills={S00:{mode:'melee',radius:180},S06:{mode:'warriorWind'}},engine={skillAllowed:()=>true,canAfford:()=>true,cooldownLeft:()=>0};assert.equal(selectSkill(engine,knight,skills,'ranged-hold'),'S06');assert.equal(selectSkill(engine,knight,skills,'advance'),'S00');assert.equal(engagementDistance('advance',knight,skills.S00),144);assert.equal(selectSkill({...engine,canAfford:s=>s.mode==='melee'},knight,skills,'ranged-hold'),'S00');

assert.deepEqual(foesFor(b,u,39,{left:0,right:200,top:0,bottom:700}),[],'offscreen guard and optional wreck are not targets');
assert.deepEqual(foesFor(b,u,39,{left:0,right:400,top:0,bottom:700},()=>false),[],'production-hidden actors are not targets');
assert.deepEqual(foesFor(b,u,39),[],'missing viewport fails closed');
const party=['archer','mage','knight','occultist'].map((cls,i)=>({id:cls,cls,side:0,hp:100,r:20,x:i*100,y:100}));
const dock={units:party,terrain:[],honroAct4Design:{boarding:{deckX:6000,deckY:3900,deckW:450,boardX1:6025,boardX2:6425}},honroAct4PreviewState:{boat:{phase:'approach'}}};
const goals=party.map(v=>objective(dock,v,31));assert(goals.every(p=>p.y===3900&&p.x>6025&&p.x<6425&&p.source==='authored-boarding'));assert.equal(new Set(goals.map(p=>p.x)).size,4);
dock.terrain.push({id:'a4-boat-deck',x:6000,y:3920,w:450});assert.equal(objective(dock,party[0],31).y,3920);assert.equal(objective(dock,party[0],31).source,'observed-boat-deck');
assert.equal(objective({units:party},party[0],31).kind,'objective-unavailable');
