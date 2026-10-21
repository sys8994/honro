/** Explicit App state fixtures; normal movement/combat evidence is separate. */
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const h=await appHarness(),profile=JSON.parse(await readFile('game/docs/stage-review/stage07-roots/evidence/entry-profile.json')).profile;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),h.g);
let app=h.load(profile);app.launch(7);h.finish(app);h.g.HonroStory.tick(app,performance.now()+3000);app.close();
let b=app.engine.b,u=app.engine.active,m=b.honroMarkers.find(m=>m.target==='resident-1'),resident=app.engine.unit(m.target);
Object.assign(u,{x:resident.x-80,y:resident.y,vx:0,vy:0});
assert(h.g.HonroInteractions.eligibility(app,m).ok);assert(h.g.HonroInteractions.use(app,m));h.finish(app);
assert.equal(b.honroState.rescuedCount,1);app.export();const saved=await h.exported();
app=h.load(saved);app.continue();h.finish(app);b=app.engine.b;
assert.equal(b.honroStage,7);assert.equal(b.honroState.rescuedCount,1);assert(b.honroMarkers.find(m=>m.target==='resident-1').collected);
assert.deepEqual(plain(app.profile.heroes),saved.heroes);
app.engine.unit('resident-2').hp=0;app.engine.unit('resident-2').dead=true;app.checkMission(app.engine);assert.equal(b.phase,'lost');
const g=await runtime({legacyMaps:false});for(const id of ['yard-hounds','upper-crows']){const q=battlefield(g,7);/* Explicit capacity fixture, not player kills. */for(const u of q.e.alive(1)){u.hp=0;u.dead=true;}const action=q.b.honroEvents.find(ev=>ev.id===id).action;assert.notEqual(g.HonroAllies.execute(q.app,{...action,source:id}),false);const wave=q.b.units.filter(u=>u.honroSpawnSource===id);assert.equal(wave.length,4);for(const u of wave){if(id==='yard-hounds'){assert(u.y<4000,'hound stays on lower bough');assert(g.HONRO_CORE.validTerrainContactPose(q.b.terrain,u));}else assert(g.HONRO_CORE.flightClear({b:q.b},u,{x:u.x,y:u.y}));}console.log(id,wave.map(u=>({x:u.x,y:u.y})));}
console.log('PASS actual rescue interaction, same-revision export/continue and growth, resident-loss mission, two wave supports');
