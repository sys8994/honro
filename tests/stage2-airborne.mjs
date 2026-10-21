/** Isolated activation, source scope and save regression, not normal-play proof. */
import assert from'node:assert/strict';import vm from'node:vm';import{runtimeParts}from'../shared/build.mjs';import{battlefield}from'../game/tests/helpers.mjs';import{appHarness,plain}from'./app-regression-helpers.mjs';import{mkdir,writeFile,readFile}from'node:fs/promises';
const parts=await runtimeParts({vector:false,render:false}),load=baseline=>{const g=vm.createContext({console,performance,structuredClone});if(baseline)g.HonroStage2Airborne={author:p=>p};for(const p of parts)if(!baseline||!p.includes('G.HonroStage2Airborne='))vm.runInContext(p,g);return g;},g=load(false),old=load(true),R=g.HonroStage2Airborne,rows=[];
const normalize=b=>{const q=JSON.parse(JSON.stringify(b).split(b.session).join('SESSION'));delete q.session;return q;};
for(let id=1;id<=30;id++){const before=battlefield(old,id),after=battlefield(g,id);if(id!==2)assert.deepEqual(normalize(after.b),normalize(before.b),'Other chapter '+id+' compiler untouched');else{const expected=normalize(before.b),actual=normalize(after.b);expected.honroStage2AirborneRevision=1;assert.deepEqual(actual,expected,'Fresh connected bough has clearance already; only opt-in marker changes');assert.equal(after.e.alive(1).length,12);assert.equal(after.b.enemyLimit,3);for(const u of after.b.units.filter(R.roost))assert(g.HONRO_CORE.flightClear(after.e,u,u));rows.push({stage:2,initial:12,elites:after.e.alive(1).filter(u=>u.elite).length,cap:3,clearance:after.b.units.filter(R.roost).map(u=>({id:u.id,x:u.x,y:u.y}))});}}
console.log('PASS Fresh stage2 retains all count/stat/terrain/objective budgets; all 29 other chapter builds exactly unchanged');
const q=battlefield(g,2);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);const {e,b,app}=q;const pre=JSON.stringify(b);R.prepare(app);assert.equal(JSON.stringify(b),pre,'No warning before actual convoy engagement');e.unit('foe-0').hp--;R.prepare(app);assert(b.honroState.stage2Airborne.warning);assert(!b.honroState.stage2Airborne.released);assert.equal(app.notices.length,1);R.prepare(app);assert.equal(app.notices.length,1,'Single warning');assert.equal(e.combatEnemies().filter(R.roost).length,0,'Warning does not instantly admit distant group');e.wait();assert(b.honroState.stage2Airborne.released);e.refreshActivation();assert.equal(e.combatEnemies().filter(R.roost).length,4);assert.equal(b.enemyLimit,3);rows.push({warning:plain(b.honroState.stage2Airborne)});
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
console.log('PASS Actual ground engagement -> one warning -> next completed player action -> four roost actors eligible under unchanged cap3');
for(const mutate of [b=>b.honroCustom=true,b=>{b.honroMapOrigin='workshop';delete b.honroStage2AirborneRevision;},b=>b.honroStage=3,b=>b.honroLayoutRevision=0,b=>b.honroEscortGoalX=4400]){const q=battlefield(g,2);mutate(q.b);q.e.unit('foe-0').hp--;const before=JSON.stringify(q.b);g.HonroAllies.attach(q.app,q.e);R.prepare(q.app);assert.equal(JSON.stringify(q.b),before);}
for(const phase of ['won','lost']){const q=battlefield(g,2);q.b.phase=phase;q.e.unit('foe-0').hp--;const before=JSON.stringify(q.b);R.prepare(q.app);assert.equal(JSON.stringify(q.b),before);}
console.log('PASS Custom/workshop, other maps and terminal battles never acquire warning/activation');
const oldRoost=JSON.parse(await readFile('tests/fixtures/stage2-old-roost-terrain.json','utf8'));
const oldStage=old.HONRO_PROJECT.stages[1];oldStage.terrains=oldStage.terrains.map(t=>t.id===oldRoost.id?oldRoost:t);
const legacy=battlefield(old,2),legacyBefore=normalize(legacy.b);g.HonroAllies.attach(legacy.app,legacy.e);assert.deepEqual(normalize(legacy.b),legacyBefore,'Mount old battle is byte-equivalent apart from session already excluded');
// New generation is already safe. Reconstruct the actual old roost poses to
// test the historical save boundary rather than treating a fresh safe clone as old.
const historic=JSON.parse(await readFile('game/docs/stage-review/airborne-bugs/evidence/stage2-before.json')).initial.honroBattle;
for(const u of legacy.b.units.filter(R.roost)){const saved=historic.units.find(v=>v.id===u.id);Object.assign(u,{x:saved.x,y:saved.y,spawnX:saved.spawnX,spawnY:saved.spawnY});}
const clone=legacy.e.unit('foe-1-cluster');clone.hp-=23;const hp=clone.hp,before=JSON.stringify(clone);assert(!R.repair(legacy.e,clone));assert.equal(JSON.stringify(clone),before,'No old one-off teleport');
const plan=g.HONRO_CORE.planEnemyMove(legacy.e,clone,legacy.e.heroesAlive()[0]);assert(plan?.flightEscape);const move=clone.moveLeft;clone.aiMove=plan;for(let n=0;n<300&&clone.aiMove;n++)g.HONRO_CORE.advanceEnemyMove(legacy.e,clone,g.HONRO_CORE.STEP);assert(g.HONRO_CORE.flightClear(legacy.e,clone,clone));assert.equal(clone.hp,hp);assert.equal(clone.spawnY,1010);assert(move-clone.moveLeft>0&&move-clone.moveLeft<=192);
console.log('PASS Continue mount unchanged; historical clone now escapes through the shared paid full-wing flight path without healing');
const h=await appHarness(),p=plain(h.g.AppRegression.fresh());p.cleared[1]={visits:1,rounds:5};let a=h.load(p);a.launch(2);h.finish(a);a.engine.b.honroState.stage2Airborne={warning:{round:1,serial:0},released:true,response:{id:'p-archer',round:1,serial:0}};a.export();const saved=await h.exported(),snapshot=plain(saved.honroBattle);a=h.load(saved);a.continue();assert.deepEqual(plain(a.engine.b),snapshot,'Production App export/load/Continue exactly preserves serialized policy, actors, terrain, objective, queue and resources');a.export();const again=await h.exported();a=h.load(again);a.continue();assert.deepEqual(plain(a.engine.b),snapshot);
console.log('PASS Production App export/Continue repeat preserves live policy and complete battle snapshot exactly');
await mkdir('_local/reports/stage2-airborne',{recursive:true});await writeFile('_local/reports/stage2-airborne/contracts.json',JSON.stringify({method:'isolated-fixture',scope:'No browser/fullplay claim',rows},null,2));
