// Isolated production-engine recoil fixtures; not a normal campaign playthrough.
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,base=battlefield(g,11).b;
const solid=(id,x,y,w,h,extra={})=>({id,x,y,w,h,mat:'rock',hp:99999,maxHp:99999,indestructible:true,...extra});
function arena(kind='bat'){
 const b=structuredClone(base),hero=C.makeUnit('archer',0,150,600,{id:'hero',loadout:['A05'],ranks:{A05:1},focus:9999,maxFocus:9999});
 const u=C.makeUnit('mage',1,500,400,{id:'flyer',honroType:kind,fixed:true,h:80,r:25,hp:9999,maxHp:9999});
 Object.assign(b,{active:hero.id,side:0,phase:'aim',width:1600,height:1000,units:[hero,u],terrain:[],waters:[],zones:[],fields:[],stakes:[],drafts:[],projectiles:[],wind:0});
 const e=new C.Engine(b);e.checkEnd=()=>false;return {b,e,u,hero};
}
let cases=0;function check(name,fn){fn();cases++;console.log('PASS',name);}
check('Bat, crow and lantern receive small push, pull, and vertical recoil without gravity or spending movement',()=>{
 for(const kind of ['bat','crow','lantern'])for(const [vx,vy] of [[280,-130],[-250,-95],[0,-330],[1e6,1e6]]){
  const {e,u}=arena(kind),start={x:u.x,y:u.y,moveLeft:u.moveLeft,hp:u.hp};e.impulse(u,vx,vy);
  assert(Math.hypot(u.x-start.x,u.y-start.y)>0,kind+' recoils');assert(Math.abs(u.x-start.x)<=48.001);assert(Math.abs(u.y-start.y)<=24.001);
  if(vx)assert.equal(Math.sign(u.x-start.x),Math.sign(vx));assert.equal(u.fixed,true);assert.equal(u.vx,0);assert.equal(u.vy,0);assert.equal(u.moveLeft,start.moveLeft);assert.equal(u.hp,start.hp);
  const pose={x:u.x,y:u.y};for(let i=0;i<120;i++)e.stepUnits(C.STEP);assert.deepEqual({x:u.x,y:u.y},pose,'no gravity or continued drift');
 }
});
check('Thin walls, ceiling, floor, map edges, other actors and polygon terrain stop the full body',()=>{
 for(const [name,terrain,vx,vy] of [
  ['thin wall',[solid('wall',545,0,1,1000)],280,0],
  ['ceiling',[solid('ceiling',0,302,1600,1)],0,-330],
  ['floor',[solid('floor',0,420,1600,1)],0,330],
  ['one-way flight obstruction',[solid('platform',0,420,1600,1,{oneWay:true})],0,330],
  ['polygon wall',[solid('polygon',545,0,1,1000,{vertices:[{x:545,y:0},{x:546,y:0},{x:546,y:1000},{x:545,y:1000}]})],280,0]
 ]){const {e,b,u}=arena();b.terrain=terrain;e.impulse(u,vx,vy);assert(C.flightClear(e,u,u),name+' legal final body');assert(Math.abs(u.x-500)<13&&Math.abs(u.y-400)<13,name+' stopped before wall');}
 for(const [x,y,vx,vy] of [[35,400,-500,0],[1565,400,500,0],[500,102,0,-500],[500,990,0,500]]){
  const {e,u}=arena();Object.assign(u,{x,y});e.impulse(u,vx,vy);assert(C.flightClear(e,u,u),'map bounds');
 }
 const {e,b,u}=arena();b.units.push(C.makeUnit('knight',1,575,400,{id:'other',h:80,r:25}));e.impulse(u,280,0);assert(C.flightClear(e,u,u));assert(u.x<=515);
});
check('Concave cave air is not treated as the polygon bounding mass',()=>{
 const {e,b,u}=arena();b.terrain=[solid('cave',400,100,300,600,{vertices:[{x:400,y:100},{x:700,y:100},{x:700,y:700},{x:650,y:700},{x:650,y:180},{x:450,y:180},{x:450,y:700},{x:400,y:700}]})];
 assert(C.flightClear(e,u,u),'clear body inside cave opening');e.impulse(u,280,-130);assert(u.x>500);assert(C.flightClear(e,u,u));
});
check('Stationary bosses, NPCs, dead enemies and floating summons remain immune',()=>{
 for(const patch of [{boss:1},{honroType:'gate',boss:1},{honroType:'bier'},{side:2,honroAlly:true},{dead:true},{summonFloating:true}]){
  const {e,u}=arena();Object.assign(u,patch);const before=JSON.stringify(u);e.impulse(u,280,-130);assert.equal(JSON.stringify(u),before);
 }
 const {e,u}=arena();const before=JSON.stringify(u);assert.equal(C.knockbackFlyingEnemy(e,u,NaN,Infinity),false);assert.equal(JSON.stringify(u),before);
});
check('Actual A05 direct impact and ordinary blast both displace a surviving flying target',()=>{
 const {e,b,u,hero}=arena('crow');b.terrain=[solid('support',0,600,1600,400)];assert(e.fire('A05',30,.6));const p=b.projectiles[0];assert(p);Object.assign(p,{x:u.x,y:u.y-u.h*.5,vx:600,vy:0});
 e.impact(p,{x:p.x,y:p.y,t:0,n:{x:-1,y:0},unit:u});assert(u.x>500,'A05 actual impact recoil');assert(u.hp<9999);assert.equal(u.fixed,true);
 const q=arena('lantern');q.e.blast(470,360,140,20,q.hero.id,false);assert(q.u.x>500,'ordinary blast recoil');assert(q.u.hp<9999);assert.equal(q.u.fixed,true);
});
check('Recoil cancels a stale flight path and survives serialized engine resume and stage sanitation',()=>{
 const {e,b,u}=arena('lantern');u.aiMove={round:b.round,path:[{x:700,y:400,jump:false}],index:0,elapsed:0,stalled:0,lastX:500,lastY:400,jumping:false,intent:'flight'};u.moveTarget=700;
 e.impulse(u,280,-130);assert.equal(u.aiMove,undefined);assert.equal(u.moveTarget,undefined);const pose={x:u.x,y:u.y};
 const saved=JSON.parse(JSON.stringify(b));g.HonroStageRules.sanitizeStageBattle(saved);const resumed=new C.Engine(saved),v=saved.units.find(v=>v.id===u.id);resumed.stepUnits(C.STEP);assert.deepEqual({x:v.x,y:v.y},pose);assert.equal(v.fixed,true);
});
console.log(`Flying knockback: ${cases} production-engine groups passed.`);
