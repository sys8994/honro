/** Synthetic verifier regressions. Never actual normal-play/quality evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {runtime, battlefield} from '../game/tests/helpers.mjs';
import {runtimeParts} from '../shared/build.mjs';
import {verifyStage5HabitatNonEntry, template, validateManifest} from '../tools/testing/encounter-evidence-gate.mjs';
import {fileRef} from '../tools/intent-pipeline/review-job.mjs';
const root = path.resolve(import.meta.dirname, '..'), clone = v => structuredClone(v);
const hash = v => createHash('sha256').update(v).digest('hex');
const g = await runtime({legacyMaps: false});
const source = {runtime: hash((await runtimeParts({vector: false, render: false})).join('\n')), campaign: hash(await readFile(path.join(root, 'shared/data/campaign.json')))};
function fixture({low = false, preempted = false} = {}) {
  const initial = JSON.parse(JSON.stringify(battlefield(g, 5).b));
  if (low) for (const u of initial.units.filter(u => u.side === 1).slice(4)) { u.dead = true; u.hp = 0; }
  const ready = clone(initial); ready.phase = 'transition'; ready.side = 0;
  ready.terrain.find(t => t.id === 'cliff-cleat').broken = true;
  ready.honroState.objectiveReadyRound = 1;
  const final = clone(ready); final.round = 2; final.phase = 'won';
  if (preempted) { final.honroState.waterfallHabitatWarnings = {'0:habitat-5-0': 1, '0:habitat-5-1': 1}; final.honroState.lastHabitatRound = 1; }
  const states = [initial, ready, final];
  const trace = {schema: 'honro-stage5-input-trace/v1', method: 'isolated-fixture', source, frame: 3, completed: true, initial, final,
    snapshots: states.map((b, i) => ({label: `synthetic-${i}`, frame: i + 1, round: b.round, battle: clone(b)})),
    frames: states.map((b, i) => ({frame: i + 1, round: b.round, serial: i, phase: b.phase, units: clone(b.units)})),
    stateTrace: states.map((b, i) => ({frame: i + 1, round: b.round, serial: i, phase: b.phase, state: clone(b.honroState)})),
    frameInputs: states.map((b, i) => ({frame: i + 1, now: (i + 1) * 16.67, keys: [], projectiles: []})),
    hits: [], terrainHits: [], enemyActions: [], births: [], continues: [],
  };
  if (preempted) trace.missionFrames = states.map((b, i) => ({frame: i + 1, boundary: i === 1, battle: clone(b)}));
  const phase = {id: 'synthetic-whole-run', disposition: preempted ? 'objective-preempted' : 'condition-not-met', spawnedIds: 'N/A', entry: 'N/A', firstEffect: 'N/A', effects: 'N/A', actions: [], playerResponses: [], nonEntry: {verifier: 'stage5-habitat/v1', reason: 'Synthetic verifier fixture only', terminal: {frame: 3, round: 2, phase: 'won'}}};
  return {trace, phase};
}
const verify = f => verifyStage5HabitatNonEntry(root, 'habitat-5-0', f.phase, f.trace);
test('source-computed untriggered habitat has explicit N/A and whole-run survivor proof', async () => {
  const r = await verify(fixture());
  assert.equal(r.survivorLowerBound, 20); assert(r.evaluations.every(v => v.requested === 0));
  assert.equal(r.terminal.phase, 'won');
});
test('real original trigger with low population cannot be labeled condition-not-met', async () => {
  await assert.rejects(verify(fixture({low: true})), /Cannot prove enemies >= 5|Actual trigger satisfied/);
});
test('an actual habitat birth cannot hide missing tactical effect behind either disposition', async () => {
  for (const disposition of ['condition-not-met', 'objective-preempted']) {
    const f = fixture(); f.phase.disposition = disposition;
    f.trace.births.push({frame: 2, id: 'born-without-effect', source: 'habitat-5-0'});
    await assert.rejects(verify(f), /Actual habitat birth/);
  }
});
test('a birth omitted from ledger is still detected in original whole state', async () => {
  const f = fixture(); f.trace.snapshots[1].battle.units[2].honroSpawnSource = 'habitat-5-0';
  await assert.rejects(verify(f), /Actual habitat birth/);
});
test('terminal prose, missing whole state, missing inputs and missing ledger fail closed', async () => {
  for (const [mutate, pattern] of [
    [f => { f.phase.nonEntry.terminal.round = 99; }, /terminal/],
    [f => { delete f.trace.initial.terrain; }, /initial\/final/],
    [f => { f.trace.frameInputs.pop(); }, /frame input/],
    [f => { delete f.trace.hits; }, /Missing original hits/],
    [f => { f.trace.snapshots = []; }, /whole-state snapshots/],
    [f => { f.trace.stateTrace.pop(); }, /Final state trace/],
    [f => { f.trace.source = {...source, runtime: '0'.repeat(64)}; }, /digest is stale/],
  ]) { const f = fixture(); mutate(f); await assert.rejects(verify(f), pattern); }
});
test('sparse final count cannot erase lethal or unreconciled intervening damage', async () => {
  const f = fixture();
  for (const u of f.trace.initial.units.filter(u => u.side === 1)) f.trace.hits.push({frame: 1, target: u.id, hpLoss: u.hp, hp: 0});
  await assert.rejects(verify(f), /Cannot prove enemies >= 5/);
});
test('non-entry needs explicit N/A and cannot contain action/effect claims', async () => {
  for (const key of ['spawnedIds', 'entry', 'firstEffect', 'effects']) {
    const f = fixture(); f.phase[key] = [];
    await assert.rejects(verify(f), /explicitly be N\/A/);
  }
  const f = fixture(); f.phase.actions = [{actorId: 'invented'}];
  await assert.rejects(verify(f), /cannot hide observed actions/);
});
test('actual one-round warning preemption is checked from every original mission frame', async () => {
  const r = await verify(fixture({low: true, preempted: true}));
  assert.deepEqual(r.opportunities, [{frame: 2, round: 1}]);
});
test('preemption cannot hide a previously warned, eligible original trigger', async () => {
  const f = fixture({low: true, preempted: true});
  f.trace.missionFrames[1].battle.honroState.waterfallHabitatWarnings = {'0:habitat-5-0': 0, '0:habitat-5-1': 0};
  await assert.rejects(verify(f), /Actual warned trigger satisfied/);
});
test('preemption requires complete boundary capture and verifies boundary against runtime', async () => {
  let f = fixture({low: true, preempted: true}); delete f.trace.missionFrames;
  await assert.rejects(verify(f), /every original pre-mission/);
  f = fixture({low: true, preempted: true}); f.trace.missionFrames[1].boundary = false;
  await assert.rejects(verify(f), /differs from actual runtime boundary/);
});

test('preemption cannot substitute an unrecorded low-population shadow battle', async () => {
  const f = fixture({preempted: true});
  for (const u of f.trace.missionFrames[1].battle.units.filter(u => u.side === 1).slice(4)) { u.dead = true; u.hp = 0; }
  await assert.rejects(verify(f), /Pre-mission population\/HP contradicts/);
});
test('unknown wave IDs and disposition/verifier strings do not open generic exemptions', async () => {
  const f = fixture();
  await assert.rejects(verifyStage5HabitatNonEntry(root, 'lower-beasts', f.phase, f.trace), /No reviewed/);
  f.phase.nonEntry.verifier = 'trust-me'; await assert.rejects(verify(f), /No reviewed/);
});
test('common manifest gate rejects same-looking conditional exemption in another chapter', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'honro-conditional-cross-stage-'));
  try {
    await mkdir(path.join(dir, 'shared/data'), {recursive: true});
    await mkdir(path.join(dir, '_local'), {recursive: true});
    await writeFile(path.join(dir, 'shared/data/campaign.json'), JSON.stringify({stages: [{metadata: {stageId: 8}, units: [], events: [{id: 'habitat-5-0', action: {type: 'spawn'}}]}]}));
    await writeFile(path.join(dir, 'HONRO.html'), 'fixture'); await writeFile(path.join(dir, 'HONRO_WORKSHOP.html'), 'fixture');
    const m = await template(dir, [8]), f = fixture();
    await writeFile(path.join(dir, '_local/raw.json'), '{}');
    await writeFile(path.join(dir, '_local/observation.json'), JSON.stringify({schema: 'honro-encounter-observation/v1', stageId: 8, sourceDigest: m.sourceDigest, targetDigest: m.targetDigest, observer: 'synthetic', observedAt: '2026-10-10T00:00:00Z', method: 'isolated-fixture', rawEvidencePaths: ['_local/raw.json'], waves: [{id: 'habitat-5-0', kind: 'wave', status: 'observed', phases: [f.phase]}]}));
    m.evidence = await Promise.all(['_local/raw.json', '_local/observation.json'].map(p => fileRef(dir, p)));
    Object.assign(m.stages[0].waves[0], {status: 'observed', observation: {path: '_local/observation.json', pointer: '/waves/0'}});
    const result = await validateManifest(dir, m);
    assert.match(result.errors.join('\n'), /No reviewed non-entry verifier for this stage\/wave/);
  } finally { await rm(dir, {recursive: true, force: true}); }
});
