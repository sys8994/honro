/** Focused isolated locomotion fixtures; no campaign completion claim. */
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
const rock=(id,x,y,w,h)=>({id,x,y,w,h,mat:'rock',hp:9999,maxHp:9999});
function move(q,u,plan){assert(plan);u.aiMove=plan;let n=0;while(u.aiMove&&n++<500)C.advanceEnemyMove(q.e,u,C.STEP);assert(n<500);}
// Fresh Stage3 reproduces the reported bridge overlap with its actual authored
// terrain and roster, including neighboring flying bodies. Mount never relocates.
{
 const q=battlefield(g,3),target=q.e.heroesAlive()[0];
 for(const u of q.b.units.filter(C.flyingEnemy)){
  const before={x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,spawnX:u.spawnX,spawnY:u.spawnY};
  assert(!C.flightClear(q.e,u,u),'current authored bridge overlap');
  const snapshot=JSON.stringify(q.b),plan=C.planEnemyMove(q.e,u,target);
  assert.equal(JSON.stringify(q.b),snapshot,'planning is read only');assert(plan?.flightEscape);
  move(q,u,plan);assert(C.flightClear(q.e,u,u));assert.equal(u.hp,before.hp);
  const distance=Math.hypot(u.x-before.x,u.y-before.y);assert(distance>0&&distance<=96);
  assert(Math.abs(before.move-u.moveLeft-distance)<1e-6);assert.equal(u.spawnX,before.spawnX);assert.equal(u.spawnY,before.spawnY);
  console.log('PASS Stage3 paid bridge escape',u.id,distance);
 }
}
function arena(terrain=[]){
 const q=battlefield(g,3),u=q.b.units.find(u=>u.honroType==='bat'),target=q.e.heroesAlive()[0];
 Object.assign(u,{x:600,y:700,moveLeft:280,lastAct:undefined,lureRound:undefined});
 Object.assign(target,{x:1000,y:700});
 Object.assign(q.b,{width:2000,height:1400,units:[u,target],terrain,waters:[],zones:[],active:u.id,queue:[u.id],side:1,phase:'enemy',turnAge:1});
 q.b.honroRouteSpec={revision:1};return {...q,u,target};
}
// Flat preferred-range scoring formerly rejected every move. A real failed aim
// must take the bounded fallback even if the ordinary first plan was declined.
{
 const q=arena([rock('ceiling',0,0,2000,615),rock('floor',0,712,2000,688)]);q.e.predict=()=>({x:0,y:0,closest:9999,terrain:'blocked'});q.e.searchShot=function*(){return {angle:0,power:1,score:-100};};
 assert.equal(C.planEnemyMove(q.e,q.u,q.target),undefined);
 q.e.enemyAction();assert(q.u.aiMove);const before=q.u.moveLeft,x=q.u.x;
 move(q,q.u,q.u.aiMove);assert(q.u.x>x);assert(before-q.u.moveLeft<=280);q.e.enemyAction();assert.equal(q.b.phase,'review');for(let i=0;q.b.phase==='review'&&i<400;i++)q.e.tick(C.STEP);assert.notEqual(q.b.phase,'review');assert(q.u.acted);
 console.log('PASS failed attack safely approaches once and finishes its turn');
}
{
 const q=arena([rock('wall',680,0,20,1400)]);
 const plan=C.finishPlanning(C.planEnemyMoveSteps(q.e,q.u,q.target,true));if(plan)move(q,q.u,plan);
 assert(q.u.x+q.u.r+8<680,'thin wall cannot be crossed');
 q.u.honroRouteGuard={x:q.u.x,y:q.u.y,radius:5};assert.equal(C.finishPlanning(C.planEnemyMoveSteps(q.e,q.u,q.target,true)),undefined);
 console.log('PASS thin wall and route defense remain enforced');
}
{
 const q=arena([rock('sealed',0,0,2000,1400)]);q.e.predict=()=>({x:0,y:0,closest:9999,terrain:'sealed'});q.e.searchShot=function*(){return {angle:0,power:1,score:-100};};
 const start={x:q.u.x,y:q.u.y};q.e.enemyAction();assert.deepEqual({x:q.u.x,y:q.u.y},start);assert(!q.u.aiMove);assert.equal(q.b.phase,'review');for(let i=0;q.b.phase==='review'&&i<400;i++)q.e.tick(C.STEP);assert.notEqual(q.b.phase,'review');assert(q.u.acted);
 console.log('PASS fully sealed body finishes normally without teleporting');
}
{
 const q=arena();q.u.honroRouteGuard={x:600,y:700,radius:10};
 q.b.stakes=[{id:1,skill:'M08',side:0,x:450,y:700,owner:q.target.id,rank:1,expires:q.b.round+3}];
 const plan=C.planEnemyMove(q.e,q.u,q.target);assert.equal(plan?.lureStakeId,1);move(q,q.u,plan);assert(q.u.x<600,'lure takes priority over pursuit and route guard');
 console.log('PASS lure retains priority and paid motion');
}

for(const kind of ['no-focus','small-budget']){
 const q=arena([rock('ceiling',0,0,2000,615),rock('floor',0,712,2000,688)]);
 if(kind==='no-focus'){q.u.loadout=['M07'];q.u.focus=0;}else q.u.moveLeft=48;
 q.e.predict=()=>({x:0,y:0,closest:9999,terrain:'blocked'});q.e.searchShot=function*(){return {angle:0,power:1,score:-100};};
 const before=q.u.moveLeft;q.e.enemyAction();assert(q.u.aiMove);move(q,q.u,q.u.aiMove);assert(q.u.x>600);assert(before-q.u.moveLeft<=before);
 console.log('PASS safe paid approach with',kind);
}
