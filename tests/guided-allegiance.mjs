import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
const b=C.createBattle(1,C.defaults(),'practice',{party:['archer'],wind:0});
const owner=b.units[0];Object.assign(owner,{x:100,y:500,spiritSight:false});
Object.assign(b,{terrain:[],units:[owner],projectiles:[],waters:[],fields:[]});const e=new C.Engine(b);
function target(extra={}){return C.makeUnit('knight',1,200,600,{id:'target',...extra});}
for(const flags of [{honroAlly:true},{side:0},{side:2},{summoned:true,summonOwner:owner.id},{enthrall:{owner:owner.id}},{dead:true},{hp:0},{spiritHidden:true}]){
 const t=target(flags);b.units=[owner,t];const v=e.steer(100,500,1000,0,owner,.1);assert.equal(v.vy,0,`must not seek ${JSON.stringify(flags)}`);
}
b.units=[owner,target()];assert(e.steer(100,500,1000,0,owner,.1).vy>0,'opposing enemy still tracked');
console.log('PASS guided allegiance candidate exclusion');
for(const child of [false,true]){
 const foe=target();b.units=[owner,foe];assert(e.steer(100,500,1000,0,owner,.1,[],child).vy>0);assert.equal(e.steer(100,500,1000,0,owner,.1,[foe.id],child).vy,0);
 foe.spiritHidden=true;assert.equal(e.steer(100,500,1000,0,owner,.1,[],child).vy,0);foe.manifested=true;assert(e.steer(100,500,1000,0,owner,.1,[],child).vy>0);
}
const enemyOwner=target({id:'enemy-owner',x:100,y:500}),ally=target({side:2,honroAlly:true});b.units=[enemyOwner,ally];assert(e.steer(100,500,1000,0,enemyOwner,.1).vy>0,'enemy guidance targets an opposing authored ally');
const summon=target({id:'owned',side:1,summoned:true,summonOwner:owner.id});b.units=[owner,summon,target()];assert.equal(e.allegiance(summon),0);assert(e.guidanceTarget(summon,b.units[2]));assert(!e.guidanceTarget(summon,owner));
for(const mode of ['homing','seekChild','arcBolt','hunterBolt','nightBolt','summonBolt']){
 b.units=[owner,target()];owner.loadout=['A13'];owner.focus=9999;owner.acted=false;b.phase='aim';b.side=0;b.active=owner.id;e.grounded=()=>true;
 assert(e.fire('A13',0,.5));const p=b.projectiles.at(-1);Object.assign(p,{mode,targetId:'target',x:100,y:500,vx:1000,vy:0,age:.2,gravityScale:0,wind:0});
 b.units[1].honroAlly=true;e.stepProjectile(p,.01);
 if(mode==='summonBolt')assert(!b.projectiles.includes(p),'invalid summon ray removed');else assert(Math.abs(p.vy)<1e-6,mode+' must stop steering when target becomes allied');
 b.projectiles=[];
}
console.log('PASS live guided modes, enemy opponents, ownership, visibility and hit exclusions');
// Split target assignment must use the same allegiance as subsequent steering.
b.units=[owner,target({honroAlly:true,id:'friendly'}),target({id:'foe'}),target({id:'hidden',spiritHidden:true})];
b.projectiles=[];const parent={id:999,owner:owner.id,side:0,skill:'A15',mode:'seekRain',x:100,y:500,vx:100,vy:10,damage:10,fieldHits:[],hit:[],trail:[]};b.projectiles.push(parent);C.splitSeven(e,parent);
assert.equal(b.projectiles.length,7);assert(b.projectiles.every(p=>p.targetId==='foe'));
for(const mode of ['arcaneJudgment','starHunt','nightParade']){
 b.projectiles=[];const p={...parent,mode,skill:'A15'};b.projectiles.push(p);e.launchUltimateChildren(p);
 assert(b.projectiles.length>0);assert(b.projectiles.every(p=>p.targetId==='foe'),mode+' initial assignment excludes allies and hidden enemies');
}
b.units=[owner,target()];b.terrain=[{id:'wall',x:145,y:400,w:20,h:300,mat:'rock',hp:9999,maxHp:9999}];b.sceneVersion++;
assert.equal(e.steer(100,500,1000,0,owner,.1).vy,0,'terrain line of sight retained');
const saved=JSON.stringify(b);e.guidanceTarget(owner,b.units[1]);e.allegiance(owner);assert.equal(JSON.stringify(b),saved,'allegiance queries must not mutate battle saves');
console.log('PASS initial split/ultimate allocation, terrain line of sight and read-only saves');
