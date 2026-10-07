// Actual App export/import/Continue. DOM, storage and download are test doubles.
import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g}=h,R=g.HonroProjectileTargets,app=h.load(h.profileThrough(5));app.launch(5);h.finish(app);
const b=app.engine.b;for(const ts of [b.terrain,b.honroWorldTerrain])ts.find(t=>t.id===R.targetId).oneWay=true;
b.round=4;b.terrain.find(t=>t.id===R.targetId).hp=313;b.honroState.ritual={active:true,holderId:b.units.find(u=>u.cls==='mage').id};
const old=plain(b),withoutCorrection=v=>{const q=plain(v);delete q.sceneVersion;for(const ts of [q.terrain,q.honroWorldTerrain])ts.find(t=>t.id===R.targetId).oneWay=true;return q;},rows=[];
const direct=plain(old);assert(R.upgradeBattle(direct));assert.deepEqual(withoutCorrection(direct),withoutCorrection(old));assert.equal(R.upgradeBattle(direct),false);rows.push('exact canonical target changes only its two projected flags and sceneVersion');
for(const change of [b=>delete b.honroMapOrigin,b=>b.honroMapOrigin='workshop',b=>b.honroCustom=true,b=>b.honroAuthoredId='custom',b=>b.terrain[0].vertices[0].x++,b=>b.honroWorldTerrain[0].vertices[0].x++,b=>b.terrain.find(t=>t.id===R.targetId).vertices[0].y++,b=>b.honroMapAnchors.shotGap.x++]){const q=plain(old);change(q);const expected=JSON.stringify(q);assert.equal(R.upgradeBattle(q),false);assert.equal(JSON.stringify(q),expected);}
rows.push('eight unmarked/custom/edited geometry variants remain byte-stable');
app.export();const exported=await h.exported();await h.import(exported);assert.equal(app.profile.honroBattle.terrain.find(t=>t.id===R.targetId).oneWay,true,'Import alone does not change terrain');
app.continue();h.finish(app);const resumed=app.engine.b;assert.equal(resumed.terrain.find(t=>t.id===R.targetId).oneWay,false);assert.equal(resumed.honroWorldTerrain.find(t=>t.id===R.targetId).oneWay,false);assert.equal(resumed.terrain.find(t=>t.id===R.targetId).hp,313);assert.deepEqual(plain(resumed.units),old.units);assert.equal(resumed.round,old.round);assert.deepEqual(plain(resumed.honroState.ritual),old.honroState.ritual);rows.push('actual Continue preserves damaged target, ritual, round and actors while repairing the exact flag');
const stable=withoutCorrection(resumed);app.export();await h.import(await h.exported());app.continue();h.finish(app);assert.deepEqual(withoutCorrection(app.engine.b),stable);rows.push('repeated actual export/import/Continue is stable');
await report('projectile-target-save',rows);console.log('PASS exact waterfall target App migration, rejection and idempotency');
