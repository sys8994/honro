/** Model regression from an unmodified, real Stage 34 UI save.
 * No browser/full-play claim: only DOM and event-presentation adapters are stubs.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { buildCore } from '../game/engine/build.mjs';

const bytes = execFileSync('xz', ['-dc', 'tests/fixtures/act4-stage34-water/water-pending-r2.json.xz']);
assert.equal(createHash('sha256').update(bytes).digest('hex'),
  'ce8b9b7cbe040f012262046ee578a52a28d5eb994d684570c629d11398f2991c');
const original = JSON.parse(bytes).honroBattle;
const g = vm.createContext({ console, structuredClone, performance });
vm.runInContext(await buildCore(), g);
g.HonroScene = class {};
g.document = { addEventListener() {}, getElementById() { return null; } };
g.HONRO_APP_READY = { then() {} };
const alive = u => u && !u.dead && u.hp > 0;
g.HonroAct4TerrainPreview = { launch() {}, eventAPI: {
  alive, party: b => b.units.filter(u => u.side === 0 && alive(u)),
  memory: b => b.honroAct4PreviewState,
} };
for (const name of ['terrain-space', 'act4-coast-events']) {
  vm.runInContext(await readFile(`shared/runtime/${name}.js`, 'utf8'), g);
}
const shoreId = 'approved34-shore-link';
function engine(b) {
  const e = new g.HONRO_CORE.Engine(b, () => {});
  g.HonroAct4TerrainPreview.attachCoast({ engine: e, dialogue: null });
  return e;
}
function settle(e) { for (let i = 0; i < 240; i++) e.tick(1 / 120); }
function fixture(change = () => {}) { const b = structuredClone(original); change(b); return engine(b); }
function remainsPending(change, label) {
  const e = fixture(change), u = e.unit('knight'), hp = u.hp;
  settle(e);
  assert.equal(u.honroAct4RecoverPending, true, label);
  assert.equal(u.hp, hp, `${label}: no damage before a safe landing`);
  assert.equal(e.b.honroAct4PreviewState.water.recoveries.length, 0, label);
}

const e = fixture(), u = e.unit('knight'), hp = u.hp;
const receipts = JSON.stringify(e.b.honroAct4PreviewState.events);
settle(e);
assert.equal(u.honroAct4Recovering, undefined);
assert.equal(u.honroAct4RecoverPending, undefined);
assert.equal(hp - u.hp, 762, 'one unshielded 25% water penalty');
assert.equal(e.grounded(u), true);
const recovery = e.b.honroAct4PreviewState.water.recoveries;
assert.equal(recovery.length, 1);
assert.equal(recovery[0].side, 'Left');
assert.ok(u.x >= 2200 + u.r && u.x <= 2500 - u.r);
assert.ok(u.y >= recovery[0].entry.y - 60 && u.y < 3890);
assert.ok(g.HONRO_CORE.terrainSurfaces(e.b.terrain.find(t => t.id === shoreId), u.x)
  .some(f => Math.abs(f.y - u.y) < 2));
assert.equal(JSON.stringify(e.b.honroAct4PreviewState.events), receipts, 'no story receipt injection');
assert.equal(e.b.phase, 'aim');
assert.equal(e.b.active, 'archer');
const x = e.active.x;
e.move(1, 0.1);
assert.notEqual(e.active.x, x, 'surviving active ally can still move');
const restored = engine(structuredClone(e.b));
settle(restored);
assert.equal(restored.unit('knight').hp, u.hp, 'no second water penalty on model restore');
assert.equal(restored.b.honroAct4PreviewState.water.recoveries.length, 1);

remainsPending(b => { delete b.honroWorldTerrain; }, 'unknown authored source');
remainsPending(b => { b.terrain.find(t => t.id === shoreId).broken = true; }, 'destroyed live support');
remainsPending(b => { b.honroWorldTerrain.find(t => t.id === shoreId).broken = true; }, 'invalid authored support');
remainsPending(b => { b.terrain.find(t => t.id === shoreId).honroAct4MovingDeck = true; }, 'moving deck');
remainsPending(b => { b.terrain.find(t => t.id === shoreId).honroElementCollision = true; }, 'dynamic element collision');
remainsPending(b => { b.terrain.find(t => t.id === shoreId).id = 'unregistered-copy'; }, 'unregistered live platform');
remainsPending(b => { b.honroWorldTerrain.find(t => t.id === shoreId).vertices[6].y -= 40; }, 'authored surface never supported entry');

const occupied = fixture(b => {
  const blocker = structuredClone(b.units.find(v => v.id === 'knight'));
  Object.assign(blocker, { id: 'qa-bank-occupant', x: 2350, y: 3500, r: 220, h: 200, fixed: true });
  delete blocker.honroAct4Recovering; delete blocker.honroAct4RecoverPending;
  b.units.push(blocker);
});
settle(occupied);
assert.equal(occupied.unit('knight').honroAct4RecoverPending, true, 'occupied bank remains pending');
occupied.b.units = occupied.b.units.filter(v => v.id !== 'qa-bank-occupant');
settle(occupied);
assert.equal(occupied.unit('knight').honroAct4RecoverPending, undefined, 'later clearance permits recovery');
assert.equal(occupied.b.honroAct4PreviewState.water.recoveries.length, 1);
console.log('PASS real Stage34 pending save: static entry ledge recovery, same-side/height limits, one penalty, next actor, restore, and unsafe-support rejection');
