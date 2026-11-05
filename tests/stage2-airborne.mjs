/** Isolated activation, source scope and save regression, not normal-play proof. */
import assert from'node:assert/strict';import vm from'node:vm';import{runtimeParts}from'../shared/build.mjs';import{battlefield}from'../game/tests/helpers.mjs';import{appHarness,plain}from'./app-regression-helpers.mjs';import{mkdir,writeFile,readFile}from'node:fs/promises';
const parts=await runtimeParts({vector:false,render:false}),load=baseline=>{const g=vm.createContext({console,performance,structuredClone});if(baseline)g.HonroStage2Airborne={author:p=>p};for(const p of parts)if(!baseline||!p.includes('G.HonroStage2Airborne='))vm.runInContext(p,g);return g;},g=load(false),old=load(true),R=g.HonroStage2Airborne,rows=[];
const normalize=b=>{const q=JSON.parse(JSON.stringify(b).split(b.session).join('SESSION'));delete q.session;return q;};
for(let id=1;id<=30;id++){const before=battlefield(old,id),after=battlefield(g,id);if(id!==2)assert.deepEqual(normalize(after.b),normalize(before.b),'Other chapter '+id+' compiler untouched');else{const expected=normalize(before.b),actual=normalize(after.b);expected.honroStage2AirborneRevision=1;assert.deepEqual(actual,expected,'Fresh connected bough has clearance already; only opt-in marker changes');assert.equal(after.e.alive(1).length,12);assert.equal(after.b.enemyLimit,4);assert.equal(after.b.honroActionBudgetRevision,1);for(const u of after.b.units.filter(R.roost))assert(g.HONRO_CORE.flightClear(after.e,u,u));rows.push({stage:2,initial:12,elites:after.e.alive(1).filter(u=>u.elite).length,cap:4,clearance:after.b.units.filter(R.roost).map(u=>({id:u.id,x:u.x,y:u.y}))});}}
console.log('PASS Fresh stage2 retains all count/stat/terrain/objective budgets; all 29 other chapter builds exactly unchanged');
const q=battlefield(g,2);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);const {e,b,app}=q;const pre=JSON.stringify(b);R.prepare(app);assert.equal(JSON.stringify(b),pre,'No warning before actual convoy engagement');e.unit('foe-0').hp--;R.prepare(app);assert(b.honroState.stage2Airborne.warning);assert(!b.honroState.stage2Airborne.released);assert.equal(app.notices.length,1);R.prepare(app);assert.equal(app.notices.length,1,'Single warning');assert.equal(e.combatEnemies().filter(R.roost).length,0,'Warning does not instantly admit distant group');e.wait();assert(b.honroState.stage2Airborne.released);e.refreshActivation();assert.equal(e.combatEnemies().filter(R.roost).length,4);assert.equal(b.enemyLimit,4);rows.push({warning:plain(b.honroState.stage2Airborne)});
{
 const q=battlefield(g,2);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);
 q.e.unit('foe-0').hp--;q.b.phase='flight';R.prepare(q.app);assert(q.b.honroState.stage2Airborne.warning.inProgress);
 q.e.finishAction();assert(!q.b.honroState.stage2Airborne.released,'Already-started attack completion is not a response');
 q.b.phase='aim';q.b.side=0;q.b.active='p-archer';q.e.active.acted=false;q.e.canAct();assert(!q.b.honroState.stage2Airborne.offered,'Same attack serial cannot be retroactively offered');
 q.b.honroState.actorTurnSerial=(q.b.honroState.actorTurnSerial||0)+1;q.b.round++;assert(q.e.canAct());assert(!q.b.honroState.stage2Airborne.offered,'Readiness queries stay pure');q.e.wait();assert(q.b.honroState.stage2Airborne.offered);assert(q.b.honroState.stage2Airborne.released);
}
console.log('PASS A warning during flight cannot count that already-started attack; only a subsequent selectable player action releases it');
{
 const q=battlefield(g,2);g.HonroAllies.attach(q.app,q.e);q.e.unit('foe-0').hp--;q.app.charging=true;R.prepare(q.app);assert(q.b.honroState.stage2Airborne.warning.inProgress);
 q.app.charging=false;assert(q.e.canAct());assert(!q.b.honroState.stage2Airborne.offered,'Releasing a charge begun before the warning is not a new offered choice');q.e.finishAction();assert(!q.b.honroState.stage2Airborne.released);
}
console.log('PASS A warning during an already-held charge also waits for a genuinely new player action');

{
 const stage=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===2),p=g.HonroMaps.profileFor(stage),campaign=g.HonroMaps.createBattle(stage,g.HONRO_PROJECT,p,{origin:'campaign'}),preview=g.HonroMaps.createBattle(stage,g.HONRO_PROJECT,p);
 assert(R.active(preview),'Default authored Stage View/Playtest opt-in');assert.deepEqual(plain(preview.units),plain(campaign.units),'Default Game/Stage View/Playtest actors match');
 const original=old.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===2),legacyPreview=g.HonroMaps.createBattle(original,old.HONRO_PROJECT,p);assert(!R.active(legacyPreview),'Unversioned imported Workshop project stays legacy');
}
console.log('PASS Default Game/Stage View/Playtest match, while unversioned Workshop imports retain legacy behavior');
console.log('PASS Actual ground engagement -> one warning -> next completed player action -> four roost actors eligible under current migrated cap4 (authored3 + one migration)');
for(const mutate of [b=>b.honroCustom=true,b=>{b.honroMapOrigin='workshop';delete b.honroStage2AirborneRevision;},b=>b.honroStage=3,b=>b.honroLayoutRevision=0,b=>b.honroEscortGoalX=4400]){const q=battlefield(g,2);mutate(q.b);q.e.unit('foe-0').hp--;const before=JSON.stringify(q.b);g.HonroAllies.attach(q.app,q.e);R.prepare(q.app);assert.equal(JSON.stringify(q.b),before);}
for(const phase of ['won','lost']){const q=battlefield(g,2);q.b.phase=phase;q.e.unit('foe-0').hp--;const before=JSON.stringify(q.b);R.prepare(q.app);assert.equal(JSON.stringify(q.b),before);}
console.log('PASS Custom/workshop, other maps and terminal battles never acquire warning/activation');
// 308d1987 deliberately migrates authored3 to4 once. Repeated load/settings
// must never accumulate the +1 or alter player resources.
const authored=g.HONRO_PROJECT.stages[1].initialState.honroActiveLimit;assert.equal(authored,3);
const capCase=battlefield(g,2),players=JSON.stringify(capCase.b.units.filter(u=>u.side===0));
for(let n=0;n<3;n++){new g.HONRO_CORE.Engine(capCase.b);g.HONRO_CORE.setDifficulty(capCase.b,'nightmare');g.HONRO_CORE.setDifficulty(capCase.b,'normal');assert.equal(capCase.b.enemyLimit,4);assert.equal(capCase.b.honroActiveLimit,4);assert.equal(JSON.stringify(capCase.b.units.filter(u=>u.side===0)),players);}
// Freeze the original381afda0 test world. Mixing its old x3460 roost with
// today's authored x1880..2780 airspace creates an impossible hybrid fixture.
const fixture=JSON.parse(await readFile('tests/fixtures/stage2-legacy-escape-381afda0.json'));
assert.equal(fixture.sourceCommit,'381afda0');const legacyBattle=fixture.battle;
assert.equal(legacyBattle.honroMap.flightRegion,undefined);
const legacy={b:legacyBattle,e:new g.HONRO_CORE.Engine(legacyBattle)};
legacy.app={...q.app,engine:legacy.e};const legacyBefore=normalize(legacy.b);
g.HonroAllies.attach(legacy.app,legacy.e);assert.deepEqual(normalize(legacy.b),legacyBefore,'Mount old battle is byte-equivalent apart from session already excluded');
const clone=legacy.e.unit('foe-1-cluster');assert.equal(clone.hp,61.6);assert.equal(clone.x,3460);assert.equal(clone.y,1010);
const hp=clone.hp,before=JSON.stringify(clone);assert(!R.repair(legacy.e,clone));assert.equal(JSON.stringify(clone),before,'No old one-off teleport');
assert(!g.HONRO_CORE.flightClear(legacy.e,clone,clone),'Historical actor must start genuinely overlapping');
const plan=g.HONRO_CORE.planEnemyMove(legacy.e,clone,legacy.e.heroesAlive()[0]);assert(plan?.flightEscape);const move=clone.moveLeft;clone.aiMove=plan;for(let n=0;n<300&&clone.aiMove;n++)g.HONRO_CORE.advanceEnemyMove(legacy.e,clone,g.HONRO_CORE.STEP);assert(g.HONRO_CORE.flightClear(legacy.e,clone,clone));assert.equal(clone.hp,hp);assert.equal(clone.spawnY,1010);assert(move-clone.moveLeft>0&&move-clone.moveLeft<=192);
console.log('PASS Continue mount unchanged; historical clone now escapes through the shared paid full-wing flight path without healing');
const h=await appHarness(),p=plain(h.g.AppRegression.fresh());p.cleared[1]={visits:1,rounds:5};let a=h.load(p);a.launch(2);h.finish(a);a.engine.b.honroState.stage2Airborne={warning:{round:1,serial:0},released:true,response:{id:'p-archer',round:1,serial:0}};a.export();const saved=await h.exported(),snapshot=plain(saved.honroBattle);a=h.load(saved);a.continue();assert.deepEqual(plain(a.engine.b),snapshot,'Production App export/load/Continue exactly preserves serialized policy, actors, terrain, objective, queue and resources');a.export();const again=await h.exported();a=h.load(again);a.continue();assert.deepEqual(plain(a.engine.b),snapshot);
console.log('PASS Production App export/Continue repeat preserves live policy and complete battle snapshot exactly');
await mkdir('_local/reports/stage2-airborne',{recursive:true});await writeFile('_local/reports/stage2-airborne/contracts.json',JSON.stringify({method:'isolated-fixture',scope:'No browser/fullplay claim',rows},null,2));
