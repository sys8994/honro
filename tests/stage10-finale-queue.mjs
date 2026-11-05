/** Isolated ritual fixtures: queue selection, paid movement and save boundaries.
 * Not a normal campaign completion or permission to alter other chapters. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{C,g}=h;
const entry=JSON.parse(await readFile('game/docs/stage-review/stage09-yard/evidence/normal-victory-profile.json','utf8')).profile;
const app=h.load(entry);app.launch(10);h.finish(app);
const e=app.engine,b=e.b;
// Controlled phase setup, not a claim to have broken the binding by normal fire.
e.hurt(e.unit('sodan-binding'),100000,'p-archer');
for(let i=0;i<5;i++){app.actorBoundary=true;app.missionTick(C.STEP);h.finish(app);}
assert(b.honroState.sodanCoop);
const waveIds=b.honroState.finaleWaves[0].units;
b.round=2; // The reinforcement has now missed its first enemy turn.
const before=plain(b),ranked=C.rankEnemyQueue(e,e.combatEnemies());
assert.deepEqual(plain(b),before,'Ranking cannot move, damage or spend resources');
const oldOrder=[...ranked].sort((a,z)=>z.tier-a.tier||a.band-z.band||a.unit.lastAct-z.unit.lastAct||a.distance-z.distance||a.unit.id.localeCompare(z.unit.id));
const beasts=ranked.filter(p=>waveIds.includes(p.unit.id)&&p.unit.honroVariant==='hound');
assert.equal(beasts.length,4);
assert(beasts.every(p=>p.tier>=1),'Ground reinforcements have a real approach');
assert.equal(oldOrder.slice(0,6).filter(p=>beasts.includes(p)).length,0,'Original queue starves reachable beasts behind shots');
assert.equal(ranked.slice(0,6).filter(p=>beasts.includes(p)).length,2,'Two of the existing six slots allow approach');
assert.equal(new Set(ranked.map(p=>p.unit.id)).size,ranked.length);
assert.deepEqual(new Set(ranked.map(p=>p.unit.id)),new Set(oldOrder.map(p=>p.unit.id)));
const picked=ranked.slice(0,6).filter(p=>beasts.includes(p)).map(p=>p.unit.id);
for(const id of picked){
 const copy=plain(b),engine=new C.Engine(copy,()=>{},true),u=engine.unit(id),start={x:u.x,y:u.y,move:u.moveLeft,hp:u.hp};
 engine.checkEnd=()=>false;copy.active=id;copy.queue=[id];copy.side=1;copy.phase='enemy';u.acted=false;
 u.aiMove=C.planEnemyMove(engine,u,engine.unit('boss'));assert(u.aiMove);
 engine.planningBudget(Infinity);for(let i=0;i<600&&u.aiMove;i++)engine.tick(C.STEP);
 assert(Math.hypot(u.x-start.x,u.y-start.y)>100,'Selected wave beast walks/jumps on actual terrain');
 assert(u.moveLeft<start.move&&u.hp===start.hp,'Movement spends existing budget without pose/HP refill');
}
// No new save fields: existing lastAct and wave IDs are the full fairness state.
for(const id of picked)e.unit(id).lastAct=b.round;
const again=C.rankEnemyQueue(e,e.combatEnemies());
assert.equal(again.slice(0,6).filter(p=>beasts.some(x=>x.unit.id===p.unit.id)&&!picked.includes(p.unit.id)).length,2);
const snapshot=plain(b);app.profile.honroBattle=snapshot;app.persist();const restored=h.load(plain(app.profile));restored.continue();
// Restore materializes false/zero motion defaults on stationary objectives.
const stableUnits=units=>units.map(u=>({...u,moving:u.moving||0,jumping:!!u.jumping}));
assert.deepEqual(stableUnits(plain(restored.engine.b.units)),stableUnits(snapshot.units));
assert.deepEqual(plain(restored.engine.b.honroState.finaleWaves),snapshot.honroState.finaleWaves);
assert.deepEqual(C.rankEnemyQueue(restored.engine,restored.engine.combatEnemies()).slice(0,6).map(p=>p.unit.id),again.slice(0,6).map(p=>p.unit.id));
for(const state of [{honroStage:9},{honroStage:11},{honroCustom:true},{honroState:{...b.honroState,sodanCoop:false}},{honroState:{...b.honroState,finaleWaves:[]}}]){
 const engine={b:{...b,...state}};assert.equal(C.stage10FinaleQueue(engine,oldOrder),oldOrder,'Other scopes retain the exact original array/order');
}
console.log('PASS Stage10 bounded wave approach, real locomotion, rotation, save and scope guards');
