import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,Q=g.HonroQuestTargets,clone=x=>JSON.parse(JSON.stringify(x));
const expected={5:['cliff-cleat'],8:['bier-knot-0','bier-knot-1'],10:['sodan-binding'],18:['upper-chain']};
function battle(id){const st=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id),b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT),e=new C.Engine(b),app={engine:e,stage:g.HONRO_CONTENT.stages[id-1],event(){},sayLines(){},checkMission(){return false;},dirty:false};g.HonroAct2.attach(app,e);g.HonroAct3.attach(app,e);g.HonroNarrativeRevision.attach(app,e);return {b,e,app};}
const inventory=[];
for(let id=1;id<=30;id++){
 const {b,e}=battle(id),targets=b.units.filter(u=>u.honroObjectiveTarget),ids=targets.map(u=>u.id);
 assert.deepEqual(clone(ids),expected[id]||[],`stage ${id} complete inventory`);inventory.push({stage:id,ids:clone(ids)});
 for(const u of targets){assert.equal(u.side,1);assert.equal(u.role,'objective');assert(u.fixed);assert.equal(u.attack,0);assert.equal(u.loadout.length,0);assert(!b.terrain.some(t=>t.id===u.id));assert(!b.honroWorldTerrain?.some(t=>t.id===u.id));assert(!e.alive(1).includes(u));assert(!e.combatEnemies().includes(u));assert(e.actors(1).includes(u));assert(e.guidanceTarget(e.heroesAlive()[0],u));assert.equal(e.captureEnemy(u,e.heroesAlive()[0],8),false);}
 const before=JSON.stringify(b);Q.migrate(b);assert.equal(JSON.stringify(b),before,`stage ${id} conversion idempotent`);
}
for(const id of [5,8,10,18]){
 const {b,e}=battle(id),u=b.units.find(u=>u.honroObjectiveTarget),t=b.honroQuestTargets[0],hero=e.heroesAlive()[0];
 if(id===18){e.hurt(u,40,hero.id,true);assert.equal(u.hp,u.maxHp,'bell gate remains');g.HonroAct2.memory(b).silenced=true;}
 const hp=u.hp,kills=b.kills; e.hurt(u,40,hero.id,true);assert(u.hp<hp);assert.equal(t.hp,u.hp);assert.equal(b.kills,kills);
 const position=[u.x,u.y];e.impulse(u,500,-500);assert.deepEqual([u.x,u.y],position);assert.equal(u.vx,0);assert.equal(u.vy,0);
 const a={x:u.x-u.r-10,y:u.y-u.h/2},z={x:u.x+u.r+10,y:a.y};
 assert.equal(e.collision(a,z,0,hero.id,[],false,[],false),null,'walking sweep ignores objective body');
 assert.equal(e.collision(a,z,0,hero.id,[],true,[],false).unit.id,u.id,'projectile sweep hits objective');
 // Original save descriptor wins, including partial HP and already-broken flags.
 const saved=clone(b);saved.terrain.push(saved.honroQuestTargets[0]);saved.units=saved.units.filter(v=>!v.honroObjectiveTarget);delete saved.honroQuestTargets;const snapshot=JSON.stringify(saved.honroState);Q.migrate(saved);assert.equal(saved.units.find(v=>v.id===u.id).hp,u.hp);assert.equal(JSON.stringify(saved.honroState),snapshot);
 const reloaded=clone(b);new C.Engine(reloaded);assert.equal(reloaded.units.find(v=>v.id===u.id).hp,u.hp);
 e.hurt(u,u.maxHp*20,hero.id,true);assert(u.dead&&t.broken);assert.equal(u.hp,0);assert.equal(b.kills,kills,'objective adds no kill count');
 const broken=clone(b);Q.migrate(broken);assert(broken.units.find(v=>v.id===u.id).dead);assert.equal(broken.units.find(v=>v.id===u.id).hp,0);
}
// Objective devices keep their original ward effect until actually destroyed;
// changing enemy difficulty cannot silently resize a saved object's durability.
{const {b,e}=battle(5),hero=e.heroesAlive()[0],target=b.units.find(u=>u.honroObjectiveTarget),hp=target.hp,maxHp=target.maxHp;
 C.setDifficulty(b,'veteran');assert.equal(target.hp,hp);assert.equal(target.maxHp,maxHp);assert.equal(target.attack,0);
 const foe=C.makeUnit('archer',1,100,100,{id:'ward-probe',hp:2000,maxHp:2000,armor:0,shield:0,existenceDefense:{form:1,qi:1,soul:1}});b.units.push(foe);e.hurt(foe,100,hero.id,false);const protectedDamage=2000-foe.hp;for(const t of b.honroQuestTargets)t.broken=true;foe.hp=2000;e.hurt(foe,100,hero.id,false);assert(2000-foe.hp>protectedDamage,'old ward protection ends only on real destruction');
}
// Integrated v4 accounting: original goal credit, no enemy reward, one common slice.
{const {b,e}=battle(5),P=g.HonroProgression,X=g.HonroContributionXP,state=P.contributionState(b),u=e.unit('cliff-cleat'),archer=e.heroesAlive().find(u=>u.cls==='archer'),mage=e.heroesAlive().find(u=>u.cls==='mage'),m=b.honroMarkers.find(m=>m.id==='receiver-5');
 Object.assign(mage,{x:m.x,y:m.y});b.honroState.ritual={active:true,holderId:mage.id};const enemies=Object.keys(state.enemies),xp=JSON.stringify(b.heroes),spent=state.combatSpent;
 e.hurt(u,120,archer.id,true);assert(!state.objectives['goal:terrain:cliff-cleat']);e.hurt(u,9999,archer.id,true);
 assert.deepEqual(clone(state.objectives['goal:terrain:cliff-cleat']),{archer:12,mage:8});assert.deepEqual(Object.keys(state.enemies),enemies);assert(!state.enemies[u.id]);assert.equal(u.xpGranted,0);assert.equal(state.combatSpent,spent);assert.equal(JSON.stringify(b.heroes),xp);assert.equal(state.rewardBalance,1);
 const weighted=X.rewardScores(state),raw=X.scores(state),total=Object.values(raw).reduce((n,v)=>n+v,0);for(const cls of state.actors)assert(Math.abs(weighted[cls]-((raw[cls]||0)*.8+total*.2/state.actors.length))<1e-9);
 const before=JSON.stringify(state);e.hurt(u,9999,archer.id,true);e.damageTerrain(b.honroQuestTargets[0],9999,0,archer.id);assert.equal(JSON.stringify(state),before,'repeat destruction cannot award again');
}
const legacy={12:'rock-pin',13:'door-pin',15:'shaft-pin',17:'collapse-pin',20:'exit-pin',21:'wagon-lock',22:'upper-latch',23:'cargo-lock',24:'courtyard-latch',25:'rear-latch',27:'water-release',28:'outer-chain',29:'sluice-chain',30:'route-pin'};
for(const [stage,id]of Object.entries(legacy)){
 const {b}=battle(+stage);b.honroQuestTargets=[];b.units=b.units.filter(u=>!u.honroObjectiveTarget);b.terrain.push({id,x:100,y:200,w:50,h:80,hp:37,maxHp:100,mat:'wood',broken:false});b[+stage<=20?'honroAct2Steps':'honroAct3Steps']=[{id,kind:'destroy',label:'옛 목표',requiredClass:'archer'}];const state=JSON.stringify(b.honroState);Q.migrate(b);const u=b.units.find(u=>u.id===id);assert(u?.honroObjectiveTarget);assert.equal(u.hp,37);assert.equal(u.maxHp,100);assert.equal(JSON.stringify(b.honroState),state);assert(!b.terrain.some(t=>t.id===id));
 const t=b.honroQuestTargets[0];t.broken=true;t.hp=37;Q.migrate(b);assert.equal(u.hp,0);assert(u.dead,'old broken target never revives');
}
console.log(JSON.stringify({status:'PASS',inventory,currentTargets:5,legacyTargets:Object.keys(legacy).length}));
