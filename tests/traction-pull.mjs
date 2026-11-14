import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildCore} from '../game/engine/build.mjs';
const ctx=vm.createContext({console,structuredClone,performance});vm.runInContext(await buildCore(),ctx);const C=ctx.HONRO_CORE;
function arena(flags={},facing=1){
 const b=C.createBattle(1,C.defaults(),'practice',{party:['knight'],wind:0});
 Object.assign(b,{width:2000,height:1500,waters:[],terrain:[{id:'floor',x:0,y:1000,w:2000,h:500,mat:'rock',hp:99999,maxHp:99999}],projectiles:[],phase:'aim',side:0});
 const u=b.units[0];Object.assign(u,{x:800,y:1000,facing,loadout:['S10'],ranks:{S10:1},focus:1000,maxFocus:1000,acted:false,cooldowns:{},attack:1});b.active=u.id;
 const t=C.makeUnit('archer',1,1400,1000,{id:'target',hp:10000,maxHp:10000,armor:0,shield:0,...flags});b.units=[u,t];const e=new C.Engine(b);e.random=()=>.99;return {b,u,t,e};
}
let n=0;
for(const flags of [{},{fixed:true,honroType:'bat'},{fixed:true,honroType:'crow'},{fixed:true,honroType:'lantern'},{elite:true,honroMidboss:true},{fixed:true,elite:true,honroPilotMidboss:'test'}])for(const facing of [-1,1]){
 const {b,u,t,e}=arena(flags,facing);const damages=[];const hurt=e.hurt.bind(e);e.hurt=(...args)=>{damages.push(args[1]);return hurt(...args);};assert(e.fire('S10',facing===1?10:170,.5));const p=b.projectiles[0],before=t.hp;
 Object.assign(p,{x:t.x-facing*2,y:t.y-t.h*.5,vx:facing*400,vy:0});e.stepProjectile(p,.02);
 assert((t.x-u.x)*facing>0);assert(Math.abs(t.x-u.x)<150);assert(damages.length===2&&before>t.hp,JSON.stringify({flags,facing,damages,damage:before-t.hp,base:p.damage,ux:u.x,x:t.x,y:t.y}));n++;
}
for(const flags of [{boss:1},{honroAct2Boss:true},{honroStage29Boss:true},{honroFinalBoss:true},{honroAct4FinaleBoss:true,boss:40},{honroAct4WreckBoss:true}]){
 const {u,t,e}=arena(flags),x=t.x;assert(!C.pullToFront(e,u,t));assert.equal(t.x,x);n++;
}
for(const condition of ['gap','wall','crowd','edge']){
 const {b,u,t,e}=arena();if(condition==='gap')b.terrain[0].w=820;
 if(condition==='wall')b.terrain.push({id:'wall',x:830,y:700,w:200,h:300,mat:'rock',hp:99999,maxHp:99999});
 if(condition==='crowd')b.units.push(C.makeUnit('knight',0,880,1000,{id:'ally',r:100}));
 if(condition==='edge')u.x=1940;
 assert(C.pullToFront(e,u,t),condition);assert(t.x>u.x);assert(t.x+t.r<b.width);assert(!b.terrain.some(w=>C.terrainRectIntersects(w,t.x-t.r,t.y-t.h,t.r*2,t.h,.15)),condition);n++;
}
console.log(`PASS ${n} pull cases: actual hit + follow-up, both directions, flying, fixed elite, story bosses, gap/wall/crowd/edge`);
