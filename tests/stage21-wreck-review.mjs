/** Controlled saved-state presentation regression, not normal combat evidence. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const trace=JSON.parse(await readFile('_local/reports/stage21-current/clear-route/trace.json','utf8'));
const battle=trace.snapshots.find(r=>r.battle.honroState.act23v4.done['refuge-hold']).battle;
const h=await appHarness({productionStory:true}),app=h.load({...trace.profile,honroBattle:battle});app.continue();
const b=app.engine.b,V=h.g.HonroAct23V4,S=h.g.HonroAct23V4Chapter21,q=S.memory(b);
assert(S.rescued(b));assert(q.wreck);delete q.proof.emblem;
const before=plain(b),view=V.state(b);assert.equal(view.targets[0].id,'21-wreck-review');assert.equal(view.targets[0].x,q.wreck.x);assert.match(view.currentInstruction,/표식/);assert.deepEqual(plain(b),before);
q.proof.emblem={controlledFixture:true};assert(!V.state(b).targets.some(t=>t.id==='21-wreck-review'));
console.log('PASS existing armor evidence prerequisite is visible without mutating battle');
