/** Bounded reviewed Stage23 authoring and exact old Continue contract. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from '../tools/act2-qa/stage17-gate-app-harness.mjs';
const h=await appHarness({productionStory:true}),{g}=h;
const runtimeProjectBefore=plain(g.HONRO_PROJECT.stages[22]),original=JSON.parse(await readFile('shared/data/campaign.json','utf8')).stages[22],map=structuredClone(original);let config;
const sandbox={HonroAct3V4ReviewedCore:{register(c){config=c;return c;}},HonroAct23V4:{},HONRO_CORE:{}};
vm.runInNewContext(await readFile('shared/runtime/act23-v4-ch23-reviewed.js','utf8'),sandbox);config.author(map);
const removed=['s23-B-5','s23-C-5','s23-E-2','s23-F-2'];assert.equal(original.units.filter(u=>u.team==='enemy').length,40);assert.equal(map.units.filter(u=>u.team==='enemy').length,36);
assert.deepEqual(map.units,original.units.filter(u=>!removed.includes(u.id)));assert.equal(map.initialState.honroReviewed23PacingRevision,1);assert.deepEqual([...map.initialState.honroReviewed23PacingRemoved],removed);
assert.equal(map.initialState.honroEscortYardPopulationCap,original.initialState.honroEscortYardPopulationCap);assert.equal(map.initialState.honroEncounterDensityPopulationCap,original.initialState.honroEncounterDensityPopulationCap);
assert.deepEqual(map.encounters,original.encounters.map(c=>({...c,unitIds:c.unitIds.filter(id=>!removed.includes(id))})));
assert.equal(map.design.act3.encounterPlan.initial,36);assert.equal(map.design.act3.encounterPlan.elites,original.design.act3.encounterPlan.elites);
for(const c of map.design.act3.encounterPlan.groups){assert(c.unitIds.every(id=>!removed.includes(id)));assert(c.members.every(u=>!removed.includes(u.id)));}
// Reviewed story already authors this cover and moves the dispatch marker.
// Those are deliberately excluded from pacing: no original geometry changes.
assert.deepEqual(map.terrains.slice(0,-1),original.terrains);assert.equal(map.terrains.at(-1).id,'v4.23.wagon-cover');assert.deepEqual(map.routes,original.routes);assert.deepEqual(map.events,original.events);assert.deepEqual(map.environment,original.environment);assert.deepEqual(map.design.escortYard,original.design.escortYard);
assert.deepEqual(map.initialState.honroEscortYardActivation,original.initialState.honroEscortYardActivation);assert.deepEqual(map.initialState.honroEncounterDensityActivation,original.initialState.honroEncounterDensityActivation);
const prior=JSON.parse(await readFile(process.env.HONRO23_CHECKPOINT,'utf8'));const old=h.load(prior.profile);old.continue();assert.deepEqual(plain(old.engine.b),prior.profile.honroBattle,'Old whole battle Continue remains exact');assert.equal(old.engine.b.honroReviewed23PacingRevision,undefined);assert.equal(old.engine.b.units.filter(u=>u.side===1).length,40);
const entry=JSON.parse(await readFile(process.env.HONRO23_ENTRY,'utf8'));const fresh=h.load(entry.profile);fresh.launch(23);const b=fresh.engine.b;
assert.equal(b.honroReviewed23PacingRevision,1);assert.equal(b.units.filter(u=>u.side===1).length,36);assert.equal(b.honroCampaignMapRevision,423);assert.equal(b.enemyLimit,4);assert.equal(b.honroEvents.length,0);assert.equal(b.units.filter(u=>u.side===1&&u.honroAct3Elite).length,10);assert.equal(b.units.find(u=>u.id==='act3-carrier').hp,1450);assert.equal(b.honroEncounterDensityPopulationCap,54);
assert.deepEqual(plain(g.HONRO_PROJECT.stages[22]),runtimeProjectBefore,'Launching/Continue did not rewrite the prepared project');assert.equal(g.HonroJourneyContent.transitionAfter(23),'rest');
// Normal/tactical is a fresh-construction risk check, not a tactical full clear.
const tacticalProfile=plain(entry.profile);tacticalProfile.settings.difficulty='normal';const tactical=h.load(tacticalProfile);tactical.launch(23);const tb=tactical.engine.b;assert.equal(tb.difficulty,'normal');assert.equal(tb.units.filter(u=>u.side===1).length,36);assert.equal(tb.enemyLimit,4);assert.equal(tb.units.find(u=>u.id==='act3-carrier').hp,1450);assert.deepEqual(plain(tb.terrain),plain(b.terrain));for(const u of tb.units.filter(u=>u.side===1)){assert.equal(u.maxHp,Math.round(u.combatBaseHp*g.HONRO_CORE.DIFFICULTIES.normal.hp));const prior=b.units.find(v=>v.id===u.id);assert(prior);assert.equal(u.x,prior.x);assert.equal(u.y,prior.y);assert.equal(u.combatBaseHp,prior.combatBaseHp);assert.equal(u.combatBaseAttack,prior.combatBaseAttack);}

console.log(JSON.stringify({passed:true,scope:'Fresh reviewed23 only; original authored project, geometry, activation, caps, NPC, distinct combat roles and old whole-battle Continue preserved. No pacing or browser conclusion.',removed,initialEnemies:36,eliteEnemies:10,oldSaveEnemies:40,activeLimit:b.enemyLimit,oldContinueExact:true,tacticalFreshConstruction:true,tacticalWholeClear:false}));
