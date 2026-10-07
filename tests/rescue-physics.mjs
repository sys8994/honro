// Real coalition turns/body integration. Artificial terrain/queue setups are
// regression fixtures, not a normal-campaign completion claim.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {appHarness,plain} from './app-regression-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,checks=[];
const pose=u=>({x:u.x,y:u.y,vx:u.vx,vy:u.vy,moveLeft:u.moveLeft});
const residents=b=>b.units.filter(u=>u.id.startsWith('resident-'));
function check(name,run){const detail=run();checks.push({name,detail});console.log('PASS',name);}
function queue(q,ids,dt=1/120,phase='begin'){
 const {e,b,app}=q;b.phase='ally';b.side=0;e.checkEnd=()=>false;
 b.honroState.allyQueue={ids,index:0,returnActive:e.heroesAlive()[0].id,phase,elapsed:0,started:false,dest:200};
 let n=0;for(;n<Math.ceil(15/dt)&&b.honroState.allyQueue;n++)g.HonroAllies.tick(app,e,dt,()=>{});
 assert(!b.honroState.allyQueue,'coalition queue must terminate');return n*dt;
}
for(const dt of [1/120,1/60,1/30,.08])check(`Stationary residents keep support through three real coalition queues, dt=${dt}`,()=>{
 const q=battlefield(g,7),units=residents(q.b),before=units.map(u=>({x:u.x,y:u.y}));
 for(let round=0;round<3;round++){
  queue(q,units.map(u=>u.id),dt);
  for(const [i,u]of units.entries()){assert.deepEqual({x:u.x,y:u.y},before[i]);assert(q.e.grounded(u));assert.equal(u.vx,0);assert.equal(u.vy,0);}
 }
 return units.map(u=>({id:u.id,...pose(u)}));
});
check('A stationary healer skips walking but still performs its supported heal',()=>{
 const q=battlefield(g,7),u=residents(q.b)[0],hero=q.e.heroesAlive()[0];hero.hp=Math.round(hero.maxHp*.5);const before=hero.hp,start={x:u.x,y:u.y};
 queue(q,[u.id]);assert(hero.hp>before);assert.deepEqual({x:u.x,y:u.y},start);assert(q.b.honroState.combatLog.some(v=>v.actor===u.id&&v.action==='heal'));
});
check('A saved stationary movement phase resumes without another horizontal step',()=>{
 const q=battlefield(g,7),u=residents(q.b)[1],before={x:u.x,y:u.y};queue(q,[u.id],1/120,'move');assert.deepEqual({x:u.x,y:u.y},before);
});
for(const side of [0,1,2])check(`Shared walking rejects fixed bodies on side ${side}`,()=>{
 const q=battlefield(g,7),u=residents(q.b)[1];u.side=side;const before=pose(u);assert.equal(q.e.walk(u,-1,.5),false);assert.deepEqual(pose(u),before);assert.equal(q.e.jump(u),false);
});
for(const stage of [2,4,6])check(`Movable coalition and escort actions still advance in stage ${stage}`,()=>{
 const q=battlefield(g,stage),u=q.b.units.find(u=>u.honroAlly&&!u.fixed),start=u.x,car=q.e.unit('objective'),carStart=car?.x;
 queue(q,[u.id]);assert.notEqual(u.x,start);assert(q.e.grounded(u)||u.jumping||Math.abs(u.vy)>0);
 if(u.allyRole==='porter')assert(car.x>=carStart);
});
check('Act2 stage20 convoy still follows its leader using the shared walking path',()=>{
 const q=battlefield(g,20),{b,e,app}=q,u=e.unit('objective'),hero=e.heroesAlive()[0],a=b.honroState.act2;
 assert.equal(u.fixed,false);const steps=b.honroAct2Steps||app.stage.steps,first=steps.findIndex(s=>s.kind==='escort');assert(first>=0);
 for(const step of steps.slice(0,first))a.done[step.id]=true;a.escort=true;
 const start=u.x;Object.assign(hero,{x:u.x+400,y:u.y});
 for(let n=0;n<120;n++){g.HonroAct2.tick(app,1/120);e.stepUnits(1/120);}
 assert(u.x>start+30,'convoy cannot be accidentally frozen by the fixed guard');assert(e.grounded(u));
});
for(const kind of ['bat','crow','lantern'])check(`Legal ${kind} flight bypasses grounded walking and keeps airborne movement`,()=>{
 const q=battlefield(g,7),{b,e}=q;b.terrain=[];b.sceneVersion++;b.width=4000;b.height=3000;
 const u=g.HonroWorld.createEnemy(b,q.st,1000,kind,99,1000);b.units=[u];b.phase='enemy';b.active=u.id;u.acted=false;u.moveLeft=280;u.aiMove={round:b.round,path:[{x:1100,y:900,jump:false}],index:0,elapsed:0,stalled:0,lastX:u.x,lastY:u.y,jumping:false};
 assert(C.flyingEnemy(u));for(let n=0;n<120;n++)e.stepUnits(1/120);assert(u.x>1099&&u.y<901);assert.equal(u.vy,0);
});
for(const dt of [1/120,1/30,.08])check(`Player jump, explosion knockback and floor sweep remain physical, dt=${dt}`,()=>{
 const q=battlefield(g,7),{b,e}=q,u=e.active;b.units=[u];b.terrain=[{id:'floor',x:0,y:1200,w:4000,h:2000,mat:'rock',hp:99999,maxHp:99999}];b.sceneVersion++;b.width=4000;b.height=3200;b.waters=[];
 Object.assign(u,{x:1000,y:1200,vx:0,vy:0,airborne:false,jumping:false,moveLeft:1000,hp:1000,maxHp:1000});
 assert(e.jump(u));let airborne=false;for(let n=0;n<Math.ceil(2/dt);n++){e.stepUnits(dt);airborne ||= u.y<1100;}assert(airborne);assert(e.grounded(u));
 e.blast(u.x-30,u.y-u.h*.45,160,30,'');assert(u.vx>0&&u.vy<0);for(let n=0;n<Math.ceil(3/dt);n++)e.stepUnits(dt);assert(e.grounded(u));assert(u.x>1000);assert.equal(u.y,1200);
});
// Coordinates below come from the unpatched production coalition loop after
// two queues (not from manually moving a fixed resident to prove the cause).
for(const id of ['resident-2','resident-3'])check(`Legacy air-walk ${id} settles via gravity/sweep without losing progress`,()=>{
 const q=battlefield(g,7),u=q.e.unit(id),p=id==='resident-2'?{x:1174.350379983669,y:3320}:{x:211.69811635117654,y:2200};Object.assign(u,p,{honroResolved:id==='resident-2',shield:47});
 q.b.honroState.rescuedCount=2;const before=plain(u),terrain=JSON.stringify(q.b.terrain),markers=JSON.stringify(q.b.honroMarkers),floor=q.e.contactSurface(u.x,u.y,q.b.height);
 assert(!q.e.grounded(u));assert(floor);g.HonroAllies.attach(q.app,q.e);assert(q.e.grounded(u));assert.equal(u.x,p.x);assert.equal(u.y,floor.y);assert.equal(u.hp,before.hp);assert.equal(u.shield,47);assert.equal(u.honroResolved,before.honroResolved);assert.equal(q.b.honroState.rescuedCount,2);assert.equal(JSON.stringify(q.b.terrain),terrain);assert.equal(JSON.stringify(q.b.honroMarkers),markers);
 assert.equal(q.b.honroContactRecoveries.at(-1).reason,'fixed-rescue-airwalk');const once=JSON.stringify(u),count=q.b.honroContactRecoveries.length;g.HonroAllies.attach(q.app,q.e);assert.equal(JSON.stringify(u),once);assert.equal(q.b.honroContactRecoveries.length,count);
 return{from:p,to:{x:u.x,y:u.y},hp:u.hp};
});
check('Recovery never touches legitimate fixed fliers, gates, carried/flying actors or groundless probes',()=>{
 const q=battlefield(g,7),{b,e}=q;const flyer=b.units.find(C.flyingEnemy);const before=plain(flyer);g.HonroAllies.attach(q.app,e);assert.deepEqual(plain(flyer),before);
 for(const flags of [{airborne:true},{carriedBy:7},{honroCivilian:false},{honroAlly:false},{dead:true},{fixed:false}]){const u=residents(b)[0];Object.assign(u,{x:1000,y:3000,airborne:false,carriedBy:undefined,honroCivilian:true,honroAlly:true,dead:false,fixed:true},flags);const saved=plain(u);g.HonroAllies.attach(q.app,e);assert.deepEqual(plain(u),saved);}
 b.terrain=[];b.sceneVersion++;const u=residents(b)[0];Object.assign(u,{x:1000,y:1000,airborne:false,carriedBy:undefined,honroCivilian:true,honroAlly:true,dead:false,fixed:true});const saved=plain(u);g.HonroAllies.attach(q.app,e);assert.deepEqual(plain(u),saved,'no invented floor or out-of-bounds teleport');
});
const h=await appHarness();
async function roundtrip(profile,label){
 const app=h.load(profile),before=plain(profile.honroBattle),old=before.units.filter(u=>u.id.startsWith('resident-'));app.continue();h.finish(app);const b=app.engine.b;
 for(const original of old){const u=b.units.find(u=>u.id===original.id);assert.equal(u.hp,original.hp);assert.equal(u.honroResolved,original.honroResolved);if(app.engine.contactSurface(original.x,original.y-4,original.y+5)){assert.equal(u.x,original.x);assert.equal(u.y,original.y);}else assert(app.engine.grounded(u));}
 assert.deepEqual(plain(b.terrain),before.terrain);assert.deepEqual(plain(b.honroMarkers),before.honroMarkers);assert.equal(b.honroState.rescuedCount,before.honroState.rescuedCount);
 app.export();const exported=await h.exported(),once=exported.honroBattle.units.filter(u=>u.id.startsWith('resident-'));await h.import(exported);app.continue();h.finish(app);assert.deepEqual(plain(app.engine.b.units.filter(u=>u.id.startsWith('resident-'))),once);
 checks.push({name:label});console.log('PASS',label);
}
{
 const app=h.load(h.profileThrough(6));app.launch(7);h.finish(app);const u=app.engine.unit('resident-2');Object.assign(u,{x:1174.350379983669,y:3320});app.export();await roundtrip(await h.exported(),'Actual App export/import/Continue repairs old floating target once');
}
let originalSave;
if(process.env.HONRO_RESCUE_SAVE){const bytes=await readFile(process.env.HONRO_RESCUE_SAVE);originalSave={sha256:createHash('sha256').update(bytes).digest('hex')};await roundtrip(JSON.parse(bytes),'Unedited genuine stage7 save preserves all grounded resident coordinates and progress');}
await mkdir('_local/reports/rescue-physics',{recursive:true});await writeFile('_local/reports/rescue-physics/summary.json',JSON.stringify({status:'passed',checks,originalSave,limits:['Real engine/coalition loops and App save routes with DOM/storage doubles','No normal campaign completion or actual UI claim']},null,2)+'\n');console.log('PASS',checks.length,'rescue physics checks');
