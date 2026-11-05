/** Isolated targeting/convoy contracts; fixture poses are not normal-play evidence. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {runtimeParts} from '../shared/build.mjs';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false});
function fixture({stage=2,custom=false,role='guard',vertical=1100,ground=false,paused=false,positions=null,context=g}={}){
 const g=context,f=battlefield(g,2),{b,e,app}=f;
 b.honroStage=stage;b.honroCustom=custom;
 const guard=b.units.find(u=>u.allyRole==='guard'),car=e.unit('objective'),bird=e.unit('foe-1-cluster'),low=e.unit('foe-0');
 Object.assign(guard,{x:1900,y:g.HonroWorld.top(b,1900,2950),allyRole:role});Object.assign(car,{x:2400,y:g.HonroWorld.top(b,2400,2950)});Object.assign(bird,{x:2000,y:guard.y-vertical});Object.assign(low,{x:2100,y:g.HonroWorld.top(b,2100,2950)});
 if(positions)for(const [id,pose] of Object.entries(positions))Object.assign(e.unit(id),pose);
 b.units=b.units.filter(u=>u.side!==1||u===bird||ground&&u===low);
 if(paused)b.honroState.carriagePauseUntilRound=b.round;
 g.HonroAllies.attach(app,e);
 const before=b.units.map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y}));
 b.phase='ally';b.honroState.allyQueue={ids:[guard.id],index:0,returnActive:'p-archer',phase:'begin',elapsed:0,started:false};
 e.tick(0);
 assert.deepEqual(b.units.map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y})),before,'Selecting a route cannot teleport/heal/remove actors');
 return {...f,guard,car,bird,low,q:b.honroState.allyQueue};
}
let f=fixture();assert.equal(f.q.targetId,undefined);assert.equal(f.q.dest,f.car.x+310,'Guard advances along escort road instead of chasing inaccessible height');
f=fixture({ground:true});assert.equal(f.q.targetId,f.low.id,'Available ground pressure remains a target');
for(const vertical of [900,1100])for(const hp of [1,79]){f=fixture({vertical,positions:{'foe-1-cluster':{hp}}});assert.equal(f.q.targetId,undefined,'Reach policy does not special-case low HP');assert.equal(f.bird.hp,hp);}
f=fixture({vertical:880});assert.equal(f.q.targetId,f.bird.id,'Aerial enemies within sword-wave vertical reach remain threats');
for(const option of [{stage:3},{custom:true},{role:'daoist'}]){f=fixture(option);assert.equal(f.q.targetId,f.bird.id,'Other stages, custom maps and ranged companion targeting remain unchanged');}
function carriage(options){const f=fixture(options),{b,e}=f,p=b.units.find(u=>u.allyRole==='porter');b.honroState.allyQueue={ids:[p.id],index:0,returnActive:'p-archer',phase:'begin',elapsed:0,started:false};e.tick(0);return {...f,q:b.honroState.allyQueue};}
f=carriage({ground:true});assert.equal(f.q.carTarget,f.car.x,'Nearby threats still stop the carriage');
f=carriage({paused:true});assert.equal(f.q.carTarget,f.car.x,'Authored pauses remain binding');
f=carriage({});assert(f.q.carTarget>f.car.x&&f.q.carTarget<=f.car.x+560,'Safe road uses existing bounded pace');
console.log('PASS Stage2 guard reach, reachable ground/air pressure, other-stage/custom/ranged exclusions, unchanged HP/poses, carriage threat/pause/speed contracts');

// Same diagnostic start, real walking and unchanged carriage rule in both runtimes.
const old=vm.createContext({console,performance,structuredClone});let controls=0;
// Reconstruct only the prior nearest-all-foes choice in memory; no git-history
// dependency in shallow CI, no product mutation and no changes to walking/pace.
for(let source of await runtimeParts({vector:false,render:false})){if(source.includes('const nearest=pursuit.slice()')){source=source.replace('const nearest=pursuit.slice()','const nearest=foes.slice()');controls++;}vm.runInContext(source,old);}assert.equal(controls,1);
function convoy(context){const f=fixture({context}),{e,b,guard,car,bird}=f,health=bird.hp,guardStart=guard.x,carStart=car.x;
 for(let n=0;n<400&&b.honroState.allyQueue?.phase!=='after';n++)e.tick(context.HONRO_CORE.STEP);
 const guardEnd=guard.x,p=b.units.find(u=>u.allyRole==='porter');b.honroState.allyQueue={ids:[p.id],index:0,returnActive:'p-archer',phase:'begin',elapsed:0,started:false};e.tick(0);const target=b.honroState.allyQueue.carTarget;
 for(let n=0;n<400&&b.honroState.allyQueue?.phase!=='after';n++)e.tick(context.HONRO_CORE.STEP);
 assert.equal(bird.hp,health);assert(!bird.dead);return{guardStart,guardEnd,carStart,carEnd:car.x,target,birdHP:bird.hp};}
const before=convoy(old),after=convoy(g);assert(after.guardEnd>before.guardEnd+500);assert(after.carEnd>before.carEnd+250);assert.equal(before.birdHP,after.birdHP);
console.log('PASS identical isolated convoy comparison',JSON.stringify({before,after}));

// A high bird can still threaten the carriage on the rising exit road while
// outside the guard's current vertical reach. Filtering pursuit must not erase
// that carriage stop; movement/archer support must resolve the pressure normally.
const road=battlefield(g,2).b,positions={
 'ally-baeksan':{x:2300,y:g.HonroWorld.top(road,2300,3005)},
 'objective':{x:3800,y:g.HonroWorld.top(road,3800,2800)},
 'foe-1-cluster':{x:2700,y:2100,hp:79}
};
f=carriage({positions});assert(Math.abs(f.bird.y-f.guard.y)*.8>=720);assert(Math.abs(f.bird.x-f.car.x)<1150&&Math.abs(f.bird.y-f.car.y)<650);assert.equal(f.q.carTarget,f.car.x,'High aerial threat near the carriage still stops it');
for(const context of [old,g]){const q=fixture({context,positions});q.b.honroState.stage2Airborne={released:true};q.e.refreshActivation();assert(q.e.combatEnemies().some(u=>u.id===q.bird.id));assert(q.bird.awake,'Aerial alert/eligibility must survive guard pursuit filtering');assert.equal(q.b.enemyLimit,4);}
console.log('PASS HP-independent reach boundary and elevated carriage pressure/airborne activation retained');
