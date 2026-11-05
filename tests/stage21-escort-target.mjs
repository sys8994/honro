/** Observed normal-input snapshots are explicit fixtures; test only presentation
 * and exact save/resume. No claim of a second combat completion. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const trace=JSON.parse(await readFile(process.env.HONRO_STAGE21_TRACE||'_local/reports/stage21-current/clear-route/trace.json','utf8'));
const h=await appHarness({productionStory:true}),V=h.g.HonroAct23V4;
const moving=trace.snapshots.find(r=>{const a=r.battle.honroState.act23v4.city.actors['act3-resident'];return a?.distance>80&&!a.safe;}).battle;
for(const [name,battle] of [['cart',trace.initial],['moving',moving],['exit',trace.snapshots.find(r=>r.battle.honroState.act23v4.done['refuge-hold']).battle]]){
 let app=h.load({...trace.profile,honroBattle:plain(battle)});app.continue();let b=app.engine.b;
 const markers=plain(b.honroMarkers),before=V.state(b),resident=b.units.find(u=>u.id==='act3-resident');
 if(name==='moving'){
  const t=before.targets.find(t=>t.id==='gate-resident');assert(t);assert.equal(t.x,resident.x);assert.equal(t.y,resident.y);
  assert.notEqual(t.x,V.marker(b,'gate-resident').x,'observed NPC has actually moved');
 }else assert.equal(before.currentObjectiveId,name==='cart'?'v4.gate-cart':'city-exit');
 assert.deepEqual(plain(b.honroMarkers),markers,'presentation must not move authored markers');
 app.export();const saved=await h.exported();app=h.load(saved);app.continue();assert.deepEqual(plain(app.engine.b),plain(b));assert.deepEqual(plain(V.state(app.engine.b)),plain(before));
 console.log('PASS current Stage21 target and exact save/resume',name);
}
