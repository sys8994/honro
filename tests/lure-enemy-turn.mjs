/** Actual team transition/ticks: never substitute direct planner execution. */
import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
let passed=0;const trace=[];
function test(name,fn){fn();passed++;console.log('PASS',name);}
const solid=(id,x,y,w,h)=>({id,x,y,w,h,mat:'rock',hp:99999,maxHp:99999});
function arena(rank=1){
 const b=C.createBattle(1,C.defaults(),'practice',{party:['mage'],wind:0,distance:700});
 Object.assign(b,{width:4000,height:2000,terrain:[solid('floor',0,1500,4000,500)],fields:[],waters:[],drafts:[],zones:[],enemyLimit:1,practiceCombat:true});
 b.units=b.units.filter(u=>u.side===0).slice(0,1);const u=b.units[0];
 Object.assign(u,{x:400,y:1500,vx:0,vy:0,ranks:{M08:rank,M01:1},loadout:['M08'],attack:1,focus:1000,maxFocus:1000,acted:false,armor:0});
 const e=new C.Engine(b),foe=(x=1200,opts={})=>{const t=C.makeUnit('archer',1,x,1500,{id:'foe'+b.units.length,name:'표적',role:'dummy',hp:10000,maxHp:10000,armor:0,fixed:false,loadout:[],...opts});b.units.push(t);return t;};
 assert(e.fire('M08',0,.3));e.impact(b.projectiles[0],{x:1000,y:1500,n:{x:0,y:-1},terrain:b.terrain[0],t:0});b.projectiles=[];b.resolveAge=0;
 const z=b.stakes[0];
 function start(){b.side=0;b.phase='aim';u.acted=true;e.switchTeam();}
 function run(engine=e){let ticks=0;const round=engine.b.round;while(engine.b.round===round&&ticks++<2400)engine.tick(C.STEP);assert(ticks<2400,'enemy turn must terminate');return ticks;}
 return {b,e,u,z,foe,start,run};
}
test('all in-range ground/flying enemies approach despite attack cap; outside stays; no extra attacks',()=>{
 const a=arena(),selected=a.foe(790),omitted=a.foe(1220),fly=a.foe(1090,{fixed:true,honroType:'bat'}),outside=a.foe(1500);fly.y=1320;
 const initial=a.b.units.map(u=>({id:u.id,x:u.x,y:u.y,lastAct:u.lastAct,move:u.moveLeft}));a.start();assert.equal(a.b.queue.length,1);assert.equal(a.b.queue[0],selected.id);const ticks=a.run();
 assert(selected.x>790,'selected enemy must approach the stake, not hero');assert(omitted.x<1220,'omitted enemy still lured');assert(Math.hypot(fly.x-1000,fly.y-1500)<Math.hypot(90,-180),'flying enemy approaches');assert.equal(outside.x,1500);
 assert.equal(omitted.lastAct,initial.find(u=>u.id===omitted.id).lastAct,'lure does not spend an attack queue opportunity');assert.equal(selected.lastAct,1);assert(selected.x-790<=130+1);assert(1220-omitted.x<=130+1);
 trace.push({case:'capped-turn',ticks,initial,final:a.b.units.map(u=>({id:u.id,x:u.x,y:u.y,lastAct:u.lastAct,lureRound:u.lureRound}))});
});
test('unawakened enemy still approaches when no enemies get an attack; queue remains empty',()=>{
 const a=arena(),t=a.foe(1200,{awake:false,aggroUntil:0});a.u.x=3500;a.start();assert.equal(a.b.queue.length,0);a.run();assert(t.x<1200);assert.equal(t.lastAct,0);assert.equal(t.awake,false);
});
test('radius uses body center and exact strict boundary; MP01/cast boost reflected in rendered radius',()=>{
 const a=arena(),h=C.makeUnit('archer',1,0,0).h,edge=Math.sqrt(260**2-(h*.5)**2),inside=a.foe(1000+edge-.1),outside=a.foe(1000-edge-.1);a.u.x=3500;inside.awake=outside.awake=false;inside.aggroUntil=outside.aggroUntil=0;a.start();a.run();assert(inside.x<1000+edge-.1);assert.equal(outside.x,1000-edge-.1);
 const arcs=[],ctx=new Proxy({globalAlpha:1},{get(o,k){if(k==='arc')return(...v)=>arcs.push({args:v,alpha:o.globalAlpha});return k in o?o[k]:(()=>{});},set(o,k,v){o[k]=v;return true;}});
 a.z.expires=a.b.round+2;C.drawStakes(ctx,a.e,0);assert(arcs.some(v=>v.args[0]===1000&&v.args[1]===1500&&v.args[2]===260));
 a.u.ranks.MP01=3;a.z.effectBoost=.1;arcs.length=0;C.drawStakes(ctx,a.e,0);assert(arcs.some(v=>Math.abs(v.args[2]-260*1.06*1.1)<1e-6));
});
test('wall and occupied destination never teleport; contact damage still once per round',()=>{
 const a=arena(8),t=a.foe(1250);a.b.terrain.push(solid('wall',1100,1000,60,500));a.b.sceneVersion++;a.start();a.run();assert(t.x>=1160+t.r-10);assert.equal(t.hp,10000);
 const c=arena(8),near=c.foe(1100);c.start();c.run();assert(near.x<1100);assert(near.hp<10000);assert.equal(c.z.usedRounds[near.id],1);
});
test('boss, fixed ground, captured, dead, stunned and allies never acquire lure plans',()=>{
 const a=arena(),types=[{boss:1,fixed:true},{fixed:true},{eaterCapturedBy:'missing'},{dead:true,hp:0},{stun:1},{side:2}];const ts=types.map((opts,i)=>a.foe(1110+i*10,opts));a.start();a.run();for(const t of ts)assert.equal(t.lureRound,undefined,t.id);
});
test('mid-move Continue resumes the same path once and never repeats the pull',()=>{
 const a=arena(),t=a.foe(1210);a.start();for(let i=0;i<20;i++)a.e.tick(C.STEP);assert(t.aiMove?.lureStakeId!==undefined);assert(t.x<1210);
 const saved=JSON.parse(JSON.stringify(a.b)),restored=new C.Engine(saved);a.run();a.run(restored);const r=restored.unit(t.id);assert(Math.abs(r.x-t.x)<1e-6);assert.equal(r.lureRound,1);assert(1210-r.x<=131);assert.equal(r.lastAct,1);
});
test('removed stake during a saved movement cancels safely and finishes the turn',()=>{
 const a=arena(),t=a.foe(1210);a.start();a.e.tick(C.STEP);assert(t.aiMove);a.b.stakes=[];const x=t.x;a.run();assert.equal(t.x,x);assert(!t.aiMove);
});
console.log(`${passed} actual enemy-turn lure tests passed`);
