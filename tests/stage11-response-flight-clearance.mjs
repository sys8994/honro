// Exact normal-play export from public fe3d488, chapter 11 turn 16. Controlled
// spawn/actor-turn fixtures below test the defect, not campaign completion.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {battlefield} from '../game/tests/helpers.mjs';

const h=await appHarness(),{g,C}=h,R=g.HonroStage11RavineEncounters;
const profile=JSON.parse(await readFile('tests/fixtures/stage11-response-embedded-save.json','utf8'));
const targetId='event-49',source='ravine-response-west-return',rows=[];
function fresh(next){const q=battlefield(g,11);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);q.b.nextId=next;return q;}
for(const next of [1,2,3,47]){
 const {b,e,app}=fresh(next),action=b.honroEvents.find(ev=>ev.id===source).action;
 const original=plain(b.units),terrain=JSON.stringify(b.terrain),count=b.honroCounters.spawned;
 assert(g.HonroAllies.execute(app,action));
 assert.deepEqual(plain(b.units.slice(0,original.length)),original);
 const born=b.units.slice(original.length);assert.equal(born.length,3);assert.equal(b.nextId,next+3);assert.equal(b.honroCounters.spawned,count+3);
 assert.equal(JSON.stringify(b.terrain),terrain);assert.equal(born.filter(u=>u.honroAct2Elite).length,1);
 for(const u of born.filter(C.flyingEnemy)){assert(C.flightClear(e,u,u),'Fresh response flyer must satisfy actual AI body clearance');rows.push({kind:'fresh',next,id:u.id,x:u.x,y:u.y});}
}
console.log('PASS Fresh west response retains all 3 actors and one elite with clear air for every factory lift residue');

for(const response of ['ravine-response-saddle-wings','ravine-response-ravine-crosswind','ravine-response-ritual-west-pursuit','ravine-response-ritual-east-turn'])for(const next of [1,2,3]){
 const {b,e,app}=fresh(next),action=b.honroEvents.find(ev=>ev.id===response).action,start=b.units.length;
 assert(g.HonroAllies.execute(app,action));
 const born=b.units.slice(start),expected=action.actions.reduce((n,a)=>n+(a.n||1),0);
 assert.equal(born.length,expected);assert.equal(b.nextId,next+expected);
 for(const u of born.filter(C.flyingEnemy))assert(C.flightClear(e,u,u),response+' must retain clear flight bodies');
 rows.push({kind:'other-response',source:response,next,count:born.length,flying:born.filter(C.flyingEnemy).length});
}
console.log('PASS All other authored response groups preserve counts and clear flying spawns across factory lift residues');

// Block both authored entrances only for the flying member. A failed combined
// reservation cannot publish the two ground members or consume IDs/counters.
{
 const {b,app}=fresh(47),action=b.honroEvents.find(ev=>ev.id===source).action;
 // Initialize the existing density wrapper's lazy warning map separately.
 g.HonroAllies.execute(app,{type:'multi',actions:[]});
 b.terrain.push({id:'flight-clearance-blocker-fixture',x:1900,y:4800,w:1900,h:1700,mat:'wood',hp:99999,maxHp:99999,oneWay:true});b.sceneVersion++;
 const before=JSON.stringify(b);assert.equal(g.HonroAllies.execute(app,action),false);assert.equal(JSON.stringify(b),before);
}
console.log('PASS Blocked response preflight is atomic across ground and flying members');

const old=profile.honroBattle,oldTarget=old.units.find(u=>u.id===targetId);
assert.equal(old.honroStage,11);assert.equal(old.round,16);assert.equal(oldTarget.hp,346);assert.equal(oldTarget.maxHp,430);
assert.equal(oldTarget.x,2865);assert.equal(oldTarget.y,5750.166666666667);
const originalEngine=new C.Engine(plain(old));assert.equal(C.flightClear(originalEngine,originalEngine.unit(targetId),oldTarget),false);
let app=h.load(profile);app.continue();let b=app.engine.b,e=app.engine,u=e.unit(targetId);
const maskPose=battle=>{const copy=plain(battle),unit=copy.units.find(v=>v.id===targetId);for(const key of ['x','y','spawnX','spawnY','vx','vy','aiMove','moveTarget'])delete unit[key];return copy;};
assert(C.flightClear(e,u,u));assert(Math.hypot(u.x-oldTarget.x,u.y-oldTarget.y)<=256);
// The separately approved trace-exit migration applies to this same campaign
// save. Permit exactly its removed cleanup step and revision metadata, while
// comparing every other battle field (including all quest/history state).
const expected=plain(old);assert.equal(expected.honroStage11TraceExitRevision,undefined);
assert.equal(expected.honroAct2Steps.filter(s=>s.id==='clear-road').length,1);
expected.honroAct2Steps=expected.honroAct2Steps.filter(s=>s.id!=='clear-road');expected.honroStage11TraceExitRevision=1;
assert.deepEqual(maskPose(b),maskPose(expected),'Only the trapped pose and explicitly approved trace-exit plan migration may change on Continue');
const repaired=plain(b);app.export();app=h.load(await h.exported());app.continue();
assert.deepEqual(plain(app.engine.b),repaired,'Repeated production export/load/Continue keeps the recovered battle exactly');
b=app.engine.b;e=app.engine;u=e.unit(targetId);
rows.push({kind:'normal-save-repair',id:u.id,from:{x:oldTarget.x,y:oldTarget.y},to:{x:u.x,y:u.y},hp:u.hp,maxHp:u.maxHp});
console.log('PASS Exact normal save repairs the trapped pose plus approved trace-exit plan, without healing, duplicates, progress/history or turn changes; repeat Continue is exact');

for(const change of [
 b=>b.honroCustom=true,b=>b.honroStage=12,b=>b.honroStage11EncounterRevision=1,
 b=>b.honroMapOrigin='workshop',b=>delete b.honroMapOrigin,
 b=>{const u=b.units.find(v=>v.id===targetId);u.dead=true;u.hp=0;},
 b=>delete b.units.find(v=>v.id===targetId).honroStage11Response,
 b=>b.units.find(v=>v.id===targetId).honroStage11Response='different-source',
 b=>b.units.find(v=>v.id===targetId).side=2,
 b=>b.terrain.find(t=>t.id==='rv-west-low-bough').broken=true
]){
 const battle=plain(old);change(battle);const engine=new C.Engine(battle),a={engine},before=JSON.stringify(battle);
 assert.equal(R.repairResponseFlights(a,engine),0);assert.equal(JSON.stringify(battle),before);
}
{const battle=plain(repaired),engine=new C.Engine(battle),before=JSON.stringify(battle);assert.equal(R.repairResponseFlights({engine},engine),0);assert.equal(JSON.stringify(battle),before);}
console.log('PASS Healthy, legacy, custom, other-chapter, unowned, dead and non-hostile actors are untouched');

// Keep the exact saved player pose, skill ranks, HP/focus and current turn. The
// current caster has an ordinary non-phasing O01 shot after the recovery.
const caster=e.heroesAlive().find(v=>v.cls==='occultist'),skill=C.SKILLS.O01;
assert.equal(b.active,caster.id);assert(e.canAct());assert.equal(skill.phase,undefined);
let aim=null;for(const candidate of e.shotSeeds(caster,skill,u)){const result=C.shotViable(e,caster,skill,u,candidate.angle,candidate.power);if(result.ok&&result.risk<1&&(!aim||result.miss<aim.miss))aim={...candidate,miss:result.miss};}
assert(aim,'The exact saved caster must have a safe normal projectile path');
const hp=u.hp;assert(e.fire(skill.id,aim.angle,aim.power));
for(let i=0;i<1800&&b.projectiles.length;i++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
assert(u.hp<hp&&u.hp>0);rows.push({kind:'ordinary-O01',from:{x:caster.x,y:caster.y},aim,hpBefore:hp,hpAfter:u.hp});

// A declared next-enemy-turn budget invokes production planning and motion;
// no manual position path or alternate solver can make the flyer move.
const moving=plain(b),engine=new C.Engine(moving),bird=engine.unit(targetId);
Object.assign(bird,{moveLeft:C.FLY_MOVE_BUDGET,acted:false});Object.assign(moving,{active:bird.id,side:1,phase:'enemy'});
const target=C.targetFor(engine,bird),plan=C.planEnemyMove(engine,bird,target);assert(plan);
bird.aiMove=plan;const from={x:bird.x,y:bird.y};
for(let i=0;i<360&&bird.aiMove;i++)engine.stepUnits(C.STEP);
assert(Math.hypot(bird.x-from.x,bird.y-from.y)>24);assert(C.flightClear(engine,bird,bird));
rows.push({kind:'real-AI-movement',target:target.id,from,to:{x:bird.x,y:bird.y},distance:Math.hypot(bird.x-from.x,bird.y-from.y)});
console.log('PASS Exact saved caster hits with non-phasing O01; production AI then plans and moves through clear air');
await mkdir('_local/reports/stage11-response-clearance',{recursive:true});
await writeFile('_local/reports/stage11-response-clearance/summary.json',JSON.stringify({rows,scope:'Exact browser save plus declared spawn and next-turn fixtures. No normal campaign completion or browser rendering claim.'},null,2)+'\n');
