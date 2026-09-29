import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,checks=[];
function test(name,fn){const detail=fn();checks.push({name,detail});console.log('PASS',name);}
function arena(cls='mage',distance=750,side=1){
 const a=battlefield(g,10),{b,e}=a;b.width=4000;b.height=2000;b.terrain=[{id:'floor',x:0,y:1500,w:4000,h:500,mat:'rock',hp:99999,maxHp:99999}];b.sceneVersion++;b.fields=[];b.drafts=[];b.waters=[];b.zones=[];b.wind=0;b.honroEvents=[];
 const id=cls==='archer'?'LA01':cls==='mage'?'M01':'O09';
 const u=C.makeUnit(cls,side,700,1500,{id:'shooter',fixed:true,lastAct:b.round,loadout:[id],focus:999,honroAlly:side===2,allyRole:'daoist'}),t=C.makeUnit('archer',side===2?1:0,700+distance,1500,{id:'target',hp:1000,maxHp:1000});b.units=[u,t];b.active=u.id;b.side=1;b.phase='enemy';b.turnAge=0;e.checkEnd=()=>false;return{...a,u,t,id};
}
for(const cls of ['archer','mage','occultist'])for(const distance of [350,750,1100])test(`${cls} at ${distance}: fires without a turn-age delay or exhaustive search`,()=>{
 const {e,b,u,t,id}=arena(cls,distance);let probes=0;const predict=e.predict.bind(e);e.predict=(...args)=>{probes++;return predict(...args);};const start=performance.now();e.tick(C.STEP);const ms=performance.now()-start;
 assert.equal(b.phase,'flight');assert(probes<=12,`unexpected ${probes} predictions`);assert(C.shotViable(e,u,C.SKILLS[id],t,u.angle,u.lastPower).ok);return{probes,ms};
});
test('Allied ranged attacks use the capped, verified shot and can yield/restart behind a blocked lane',()=>{
 const {e,b,u,t,app}=arena('mage',750,2),hero=C.makeUnit('archer',0,200,1500,{id:'hero'});b.units.push(hero);b.side=0;b.phase='ally';
 const q=b.honroState.allyQueue={ids:[u.id],index:0,returnActive:hero.id,phase:'act',elapsed:0,started:false,targetId:t.id};
 b.terrain.push({id:'wall',x:1000,y:0,w:80,h:1500,mat:'rock',hp:99999,maxHp:99999});b.sceneVersion++;
 const old=g.performance;let clock=0;try{g.performance={now:()=>clock+=.2};e.planningBudget(1);g.HonroAllies.tick(app,e,C.STEP,()=>{});e.planningBudget();assert.equal(q.phase,'act');assert.equal(q.started,false);assert.equal(b.projectiles.length,0);
  b.terrain.pop();b.sceneVersion++;g.HonroAllies.tick(app,e,C.STEP,()=>{});assert.equal(q.phase,'flight');assert.equal(b.phase,'ally');assert(u.lastPower<=.82);assert(b.projectiles.length);
 }finally{g.performance=old;}
});
function finale(){const a=battlefield(g,10);a.e.checkEnd=()=>false;a.app.actorBoundary=true;a.b.honroEvents=[];a.b.honroState.receivers=2;const s=a.e.unit('boss');s.hp=s.maxHp*.4;return{...a,s};}
test('Cooperation starts at the central ritual independently of the previous boss position, with mortal companion HP',()=>{
 const points=[];for(const x of [1800,4200]){const {app,b,s}=finale();s.x=x;g.HonroMission.finale(app);assert(b.honroState.sodanCoop);assert.equal(s.name,'소단');assert.equal(s.maxHp,820);assert.equal(s.hp,656);assert.equal(s.shield,0);assert.equal(s.level,11);assert(!g.HonroTerrain.intersects(b,s));points.push([s.x,s.y]);const state=JSON.stringify(s);g.HonroMission.finale(app);assert.equal(JSON.stringify(s),state);}assert.deepEqual(points,[[2500,2180],[2500,2180]]);return points;
});
test('An occupied ritual gets a nearby legal position, never a body overlap or a far relocation',()=>{
 const {app,b,s}=finale();s.x=4300;const other=b.units.find(u=>u.side===0);Object.assign(other,{x:2500,y:2180});g.HonroMission.finale(app);assert(b.honroState.sodanCoop);assert(Math.abs(s.x-2500)<=160);assert(Math.abs(s.x-other.x)>=s.r+other.r+12);assert(!g.HonroTerrain.intersects(b,s));return{x:s.x,y:s.y};
});
test('Old cooperation saves keep their health fraction and defense progress exactly once',()=>{
 const {app,e,b,s}=finale(),hs=b.honroState;hs.sodanCoop=true;hs.coopHold=2;s.x=4300;s.hp=s.maxHp*.5;hs.finaleAnchor={x:s.x,y:s.y};const count=b.units.length;g.HonroMission.finale(app);assert.equal(s.hp,410);assert.equal(s.maxHp,820);assert.equal(hs.coopHold,2);assert.equal(b.units.length,count);assert.equal(s.x,2500);
 s.hp=200;const saved=structuredClone(b);app.engine=new C.Engine(saved);g.HonroMission.finale(app);assert.equal(app.engine.unit('boss').hp,200);assert.equal(saved.honroState.coopHold,2);
});
test('Every wave originates at a fixed hall, remains outside the ritual, and reserves units atomically',()=>{
 const {app,e,b,s}=finale();g.HonroMission.finale(app);assert(b.honroState.sodanCoop);const result=[];for(let turn=0;turn<6;turn++){
  const wave=b.honroState.finaleWaves.at(-1),units=wave.units.map(id=>e.unit(id));assert.equal(units.length,turn?6:8);
  for(const u of units){const site=b.honroState.finaleSites.find(p=>p.id===u.honroSpawnSource);assert(site);assert(Math.abs(u.spawnX-site.x)<=500);assert(Math.abs(u.spawnX-s.x)>450);assert(!g.HonroTerrain.intersects(b,u,u.x,u.y,{padding:u.fixed?10:2,support:u.fixed?null:e.surface(u.x,u.y-1,u.y+1)?.t}));}result.push(units.map(u=>[u.honroSpawnSource,Math.round(u.x),Math.round(u.y)]));
  if(turn<5){for(const u of e.alive(1)){u.hp=0;u.dead=true;}b.teamEnds[1]++;g.HonroMission.finale(app);}
 }return result;
});
test('A blocked source never scatters enemies by Sodan or duplicates an earlier group on retry',()=>{
 const {app,e,b}=finale(),count=b.units.length,next=b.nextId;b.terrain.push({id:'blocked-hall',x:3000,y:1800,w:1400,h:1700,mat:'rock',hp:99999,maxHp:99999});b.sceneVersion++;
 for(let i=0;i<3;i++)g.HonroMission.finale(app);assert(!b.honroState.sodanCoop);assert.equal(b.units.length,count);assert.equal(b.nextId,next);
 b.terrain.pop();b.sceneVersion++;g.HonroMission.finale(app);assert(b.honroState.sodanCoop);assert.equal(b.units.length,count+8);assert.equal(b.honroState.finaleWaves.length,1);
});
await mkdir('_local/reports/attack-tempo-finale',{recursive:true});await writeFile('_local/reports/attack-tempo-finale/unit.json',JSON.stringify({checks},null,2)+'\n');
