import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime(),C=g.HONRO_CORE;
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name);}
function arena(skill='M07',rank=1){
 const p=C.defaults(),b=C.createBattle(1,p,'practice',{party:['mage'],wind:0,distance:700});
 b.width=3000;b.height=2000;b.terrain=[{id:'floor',x:0,y:1500,w:3000,h:500,mat:'rock',hp:99999,maxHp:99999}];b.units=b.units.filter(u=>u.side===0).slice(0,1);b.fields=[];b.waters=[];b.drafts=[];b.zones=[];
 const u=b.units[0];Object.assign(u,{x:400,y:1500,vx:0,vy:0,ranks:{[skill]:rank,M01:1},loadout:[skill],attack:1,focus:1000,maxFocus:1000,acted:false,armor:0});
 const e=new C.Engine(b),foe=(x=1000,opts={})=>{const t=C.makeUnit('archer',1,x,1500,{id:'foe'+b.units.length,name:'표적',role:'dummy',hp:10000,maxHp:10000,armor:0,fixed:false,loadout:['LA01'],...opts});b.units.push(t);return t;};
 assert(e.fire(skill,0,.3));const shot=b.projectiles[0];e.impact(shot,{x:1000,y:1500,n:{x:0,y:-1},terrain:b.terrain[0],t:0});
 const z=b.stakes[0],tick=()=>C.tickRedesign(e,C.STEP),enemyTurn=t=>{b.side=1;b.phase='enemy';b.active=t.id;};
 return {b,e,u,z,foe,tick,enemyTurn};
}
test('M07 waits for enemy turn; every new entrant, not one global trigger',()=>{
 const a=arena(),first=a.foe(1000,{fixed:true}),second=a.foe(1300,{fixed:true});a.tick();assert.equal(first.hp,10000);
 a.enemyTurn(first);a.tick();assert(first.hp<10000);const hp=first.hp;for(let i=0;i<30;i++)a.tick();assert.equal(first.hp,hp);
 second.x=1000;a.b.active=second.id;a.tick();assert(second.hp<10000);assert.equal(first.hp,hp);
 second.x=1300;a.tick();second.x=1000;a.tick();assert.equal(first.hp,hp);const hp2=second.hp;
 a.b.round++;a.tick();assert(first.hp<hp&&second.hp<hp2);
});
test('M07 splash damage shares the same saved per-enemy ledger',()=>{
 const a=arena(),t=a.foe(1000,{fixed:true}),splash=a.foe(1090,{fixed:true});a.enemyTurn(t);a.tick();assert(splash.hp<10000);const hp=splash.hp;
 const restored=structuredClone(a.b),e=new C.Engine(restored),s=restored.units.find(u=>u.id===splash.id);s.x=1000;C.tickRedesign(e,C.STEP);assert.equal(s.hp,hp);
});
test('M07 overlapping stakes retain independent once-per-enemy damage',()=>{
 const a=arena(),t=a.foe(1000,{fixed:true});a.b.stakes.push({...a.z,id:a.z.id+500,usedRounds:undefined});a.enemyTurn(t);a.tick();assert(a.b.stakes.every(z=>z.usedRounds[t.id]===a.b.round));const hp=t.hp;a.tick();assert.equal(t.hp,hp);
});
test('M08 casting has no immediate pull, damage, or movement loss',()=>{
 const a=arena('M08'),t=a.foe(1000);const before=[t.x,t.y,t.vx,t.vy,t.hp,t.moveLeft];for(let i=0;i<20;i++)a.tick();assert.deepEqual([t.x,t.y,t.vx,t.vy,t.hp,t.moveLeft],before);
});
test('M08 redirects normal movement then binds once at contact',()=>{
 const a=arena('M08',8),t=a.foe(1200);a.enemyTurn(t);const x=t.x,budget=t.moveLeft;
 const plan=C.planEnemyMove(a.e,t,a.u);assert(plan);assert.equal(plan.intent,'유인진목에 이끌림');assert.equal(t.x,x);t.aiMove=plan;
 for(let i=0;i<500&&t.aiMove;i++){C.advanceEnemyMove(a.e,t,C.STEP);a.e.integrateBody(t,C.STEP);a.tick();}
 assert(t.x<x);assert(t.hp<10000);assert.equal(t.moveLeft,0);assert(!t.aiMove);assert(x-t.x<=budget);const hp=t.hp;a.tick();assert.equal(t.hp,hp);
});
test('M08 respects an impassable wall and never teleports',()=>{
 const a=arena('M08',8),t=a.foe(1250);a.b.terrain.push({id:'wall',x:1100,y:1000,w:60,h:500,mat:'rock',hp:99999,maxHp:99999});a.b.sceneVersion++;a.enemyTurn(t);const x=t.x;
 t.aiMove=C.planEnemyMove(a.e,t,a.u);assert.equal(t.x,x);
 for(let i=0;i<500&&t.aiMove;i++){C.advanceEnemyMove(a.e,t,C.STEP);a.e.integrateBody(t,C.STEP);a.tick();}
 assert(t.x>=1160+t.r-10);assert.equal(t.hp,10000);
});
test('M08 boss is never redirected or bound; finite lifetime still expires',()=>{
 const a=arena('M08'),t=a.foe(1000,{boss:1,fixed:true});a.enemyTurn(t);const move=t.moveLeft;a.tick();assert.equal(t.moveLeft,move);assert(t.hp<10000);a.b.round=a.z.expires;a.tick();assert.equal(a.b.stakes.length,0);
});
test('M08 flying enemies use collision-checked flight without extra distance',()=>{
 const a=arena('M08',8),t=a.foe(1180,{fixed:true,honroType:'bat'});t.y=1420;a.enemyTurn(t);const start={x:t.x,y:t.y},budget=t.moveLeft;t.aiMove=C.planEnemyMove(a.e,t,a.u);assert(t.aiMove);assert.equal(t.aiMove.intent,'유인진목에 이끌림');
 for(let i=0;i<500&&t.aiMove;i++){C.advanceEnemyMove(a.e,t,C.STEP);a.tick();}
 assert(t.x<start.x);assert(Math.hypot(t.x-start.x,t.y-start.y)<=budget+.1);assert(t.y<=1492);
});
console.log(`${passed} totem turn tests passed`);
