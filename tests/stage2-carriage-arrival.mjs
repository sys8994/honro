/** Isolated convoy boundary tests; authored poses are not normal-play evidence. */
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false});
function setup({gap=29.144492237803206,threat=false,pause=false,block=false,custom=false,stage=2}={}){
 const f=battlefield(g,2),{b,e,app}=f,car=e.unit('objective'),porter=b.units.find(u=>u.allyRole==='porter'),guard=b.units.find(u=>u.allyRole==='guard'),bird=e.unit('foe-1');
 b.honroStage=stage;b.honroCustom=custom;b.units=b.units.filter(u=>u.side!==1||u===bird);
 Object.assign(car,{x:block?3700:4100-gap});car.y=g.HonroWorld.top(b,car.x,2630);
 Object.assign(porter,{x:block?3800:4005,y:g.HonroWorld.top(b,block?3800:4005,2630)});
 Object.assign(guard,{x:4200,y:g.HonroWorld.top(b,4200,2630)});
 Object.assign(bird,{x:threat?car.x+100:1000,y:threat?car.y-50:1000});
 if(pause)b.honroState.carriagePauseUntilRound=b.round;
 if(block)b.terrain.push({id:'arrival-test-block',x:4000,y:2500,w:100,h:300,hp:99999,maxHp:99999,destructible:true,honroBlocker:true,kind:'rect'});
 g.HonroAllies.attach(app,e);b.phase='ally';b.honroState.allyQueue={ids:[porter.id],index:0,returnActive:'p-archer',phase:'begin',elapsed:0,started:false};e.tick(0);
 return {...f,car,porter,bird};
}
function finish(f,dt){const {b,e,car}=f,target=b.honroState.allyQueue.carTarget,hp=f.bird.hp;let steps=0;
 for(;steps<1000&&b.honroState.allyQueue.phase!=='after';steps++){
  const x=car.x;e.tick(dt);assert(car.x>=x&&car.x-x<=480*dt+1e-8,'Each movement step is bounded by existing speed');assert(car.x<=target,'No overshoot or jump past the scheduled target');assert.equal(car.y,g.HonroWorld.top(b,car.x,car.y),'Car stays on the authored road');
 }
 assert(steps<1000);assert.equal(f.bird.hp,hp);return car.x;
}
for(const dt of [1/240,1/120,1/60])for(const gap of [.001,1.144492237803206,2,29.144492237803206,560]){
 const f=setup({gap});assert.equal(f.b.honroState.allyQueue.carTarget,4100);assert(f.car.x<4100,'Selection must not snap to the goal');assert.equal(finish(f,dt),4100,'Exact arrival through normal movement');
}
for(const options of [{threat:true},{pause:true}]){const f=setup({...options,gap:1.144492237803206}),x=f.car.x;assert.equal(f.b.honroState.allyQueue.carTarget,x);assert.equal(finish(f,1/120),x,'Threat/pause still forbids progress even within two pixels');}
const blocked=setup({block:true});assert.equal(blocked.b.honroState.allyQueue.carTarget,3895);assert.equal(finish(blocked,1/120),3895,'Stops at existing blocker clearance; does not move through it');
for(const options of [{custom:true},{stage:3}]){const f=setup({...options,gap:1.144492237803206});assert.equal(f.b.honroState.allyQueue.phase,'after','Unrelated/custom tolerance remains unchanged');assert(f.car.x<4100);}
const saved=setup({gap:1.144492237803206}),snapshot=JSON.parse(JSON.stringify(saved.b));
assert.equal(snapshot.honroState.allyQueue.phase,'move');const resumed=new g.HONRO_CORE.Engine(snapshot,()=>{},true),app={...saved.app,engine:resumed};g.HonroAllies.attach(app,resumed);
assert.equal(resumed.unit('objective').x,saved.car.x,'Mounting a mid-action save does not rewrite position');
const f={b:snapshot,e:resumed,car:resumed.unit('objective'),bird:resumed.unit(saved.bird.id)};assert.equal(finish(f,1/120),4100);
console.log('PASS Stage2 exact arrival at 0.001/1.144/2/29.144/560 gaps, bounded dt movement, road support, blocker clearance, threats, pause, custom/other-stage exclusions and mid-action save resume');
