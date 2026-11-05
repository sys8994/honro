/** Isolated phase/position fixtures, not a normal chapter completion. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{C}=h;
const profile=JSON.parse(await readFile('game/docs/stage-review/stage09-yard/evidence/normal-victory-profile.json','utf8')).profile;
const app=h.load(profile);app.launch(10);h.finish(app);
const e=app.engine,b=e.b;
e.hurt(e.unit('sodan-binding'),100000,'p-archer');
for(let i=0;i<5;i++){app.actorBoundary=true;app.missionTick(C.STEP);h.finish(app);}
const wave=b.honroState.finaleWaves[0].units.map(id=>e.unit(id)),crows=wave.filter(u=>u.honroType==='crow'),boss=e.unit('boss');
assert.equal(crows.length,4);
assert(crows.every(u=>u.y<2200&&C.flightClear(e,u,u)),'West wave uses upper-gallery airspace with full-wing clearance');
assert(wave.filter(u=>u.honroVariant==='hound').every(u=>u.x>3000),'East ground wave keeps its original hall');
// Free cap room in this phase fixture, then let production mission code create
// the next west ground / east air wave with its unchanged six-unit request.
b.units=b.units.filter(u=>u.side!==1||wave.includes(u));
b.teamEnds[1]++;b.round++;app.actorBoundary=true;app.missionTick(C.STEP);h.finish(app);
const next=b.honroState.finaleWaves.at(-1).units.map(id=>e.unit(id));
assert.equal(next.length,6);
assert(next.filter(u=>u.honroType==='crow').every(u=>u.x>3000),'East air wave keeps its original hall');
const ground=next.filter(u=>u.honroVariant==='hound').at(-1);
Object.assign(ground,{x:1822,y:2511.6363636363635,moveLeft:550,honroTargetId:boss.id,honroTargetUntil:99});
Object.assign(e.unit('p-archer'),{x:1491.4566923010325,y:2213.070866096373});
Object.assign(e.unit('p-mage'),{x:1657.6523828855743,y:2225.3816586463387});
const to={x:2162,y:2332.1},snapshot=plain(b);
assert(next.filter(u=>u.honroVariant==='hound').every(u=>C.rankEnemyQueue(e,[u])[0].tier>0),'All three western ground reinforcements have an approach, including a two-leg climb');
assert(C.traceTravel(e,ground,ground,to,550),'West slope is physically traversable with the upper air wave');
assert(C.rankEnemyQueue(e,[ground])[0].tier>0,'Approach tier uses Sodan, not closer heroes on another gallery');
assert.deepEqual(plain(b),snapshot,'Travel/ranking probes cannot mutate live resources or bodies');
for(const scope of [{honroStage:9},{honroStage:11},{honroCustom:true},{honroState:{...b.honroState,sodanCoop:false}}]){
 const other=new C.Engine({...plain(b),...scope},()=>{},true);
 assert.equal(C.rankEnemyQueue(other,[other.unit(ground.id)])[0].tier,0,'Other scopes retain nearest-hero/direct-probe ranking');
}
// Counterfactual old lower roost: the same terrain and target become blocked.
const old=plain(b),oldCrow=old.units.find(u=>u.id===crows[0].id);Object.assign(oldCrow,{x:1752,y:2368});
const oldEngine=new C.Engine(old,()=>{},true);
assert.equal(C.traceTravel(oldEngine,oldEngine.unit(ground.id),ground,to,550),null);
const plan=C.planEnemyMove(e,ground,boss);assert(plan);
e.checkEnd=()=>false;b.phase='enemy';b.side=1;b.active=ground.id;b.queue=[ground.id];ground.acted=false;ground.aiMove=plan;
e.planningBudget(Infinity);for(let i=0;i<600&&ground.aiMove;i++)e.tick(C.STEP);
assert(ground.x>2100&&ground.y<2350&&ground.moveLeft<550,'Ground reinforcement actually climbs using its existing budget');
console.log('PASS stage10 upper west air wave, unchanged east waves, physical ground approach and actual-target ranking');
