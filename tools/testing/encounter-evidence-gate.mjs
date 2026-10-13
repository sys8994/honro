/** Evidence completeness only. No gameplay-quality verdict, approvals or remote writes. */
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {fingerprints, fileRef, localFile} from '../intent-pipeline/review-job.mjs';

export const SCHEMA = 'honro-encounter-evidence/v1';
export const CHECKS = [
  'same-camera', 'terrain-and-roles', 'activation-and-action-cap',
  'normal-resource-play', 'warning-opportunity-and-occupancy',
  'continue-death-and-old-save', 'objectives-and-growth',
  'game-workshop-playtest', 'visual-quality', 'tactical-quality',
  'runtime-wave-inventory', 'build-and-regressions',
];
const EFFECTS = new Set(['damage', 'suppression', 'evasion', 'route', 'position', 'skill-choice', 'hero-choice', 'objective-pressure']);
const need = (ok, message) => { if (!ok) throw Error(message); };
const text = value => typeof value === 'string' && value.trim().length > 0;
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sameSet = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && new Set(a).size === a.length && [...a].sort().every((id, i) => id === [...b].sort()[i]);
const validTime = t => text(t) && Number.isFinite(Date.parse(t)) && Date.parse(t) <= Date.now() + 300000;
const nonempty = a => Array.isArray(a) && a.length > 0;
function hasSpawn(action) {
  if (!action || typeof action !== 'object') return false;
  return action.type === 'spawn' || Object.values(action).some(value => Array.isArray(value) ? value.some(hasSpawn) : typeof value === 'object' && hasSpawn(value));
}
/** These are source IDs, not an invented universal density/radius formula. */
export function inventory(project, stageIds) {
  need(sameSet(stageIds, [...new Set(stageIds)]) && nonempty(stageIds) && stageIds.every(n => Number.isInteger(n) && n >= 1 && n <= 30), 'Unique stage IDs 1–30 required');
  return stageIds.map(stageId => {
    const stage = project.stages?.find(s => s.metadata?.stageId === stageId);
    need(stage, `Stage ${stageId} missing from campaign`);
    const groups = new Map();
    for (const unit of stage.units || []) {
      if (unit.team !== 'enemy') continue;
      const declared = (stage.encounters || []).find(g => g.unitIds?.includes(unit.id));
      const id = unit.encounterGroup || declared?.id || `unit:${unit.id}`;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(unit.id);
    }
    const waves = (stage.events || []).filter(e => hasSpawn(e.action)).map(e => ({id: e.id, source: 'event'}));
    for (const [key, value] of Object.entries(stage.initialState || {})) {
      if (!/Steps$/.test(key) || !Array.isArray(value)) continue;
      for (const step of value) if (step?.wave) waves.push({id: `objective:${step.id}`, source: key});
    }
    need(waves.every(w => text(w.id)) && new Set(waves.map(w => w.id)).size === waves.length, `Stage ${stageId} duplicate/missing wave source IDs`);
    return {stageId, playerIds: (stage.units || []).filter(u => u.team === 'player').map(u => u.id), clusters: [...groups].map(([id, memberIds]) => ({id, memberIds})), waves};
  });
}
export function reviewDigest(manifest) {
  const {review, ...body} = manifest;
  return digest(body);
}
export async function template(root, stageIds) {
  const project = JSON.parse(await readFile(path.join(root, 'shared/data/campaign.json'), 'utf8'));
  const current = await fingerprints(root);
  const pending = () => ({status: 'pending', detail: 'Not observed yet', evidencePaths: []});
  return {
    schema: SCHEMA, stageIds, implementationAuthors: [], sourceDigest: current.sourceDigest,
    targetDigest: current.targetDigest, evidence: [], knownFailures: [],
    stages: inventory(project, stageIds).map(row => ({
      stageId: row.stageId, clusters: row.clusters.map(c => ({...c, status: 'pending', observation: null})),
      waves: row.waves.map(w => ({...w, status: 'pending', observation: null})), runtimeWaves: [],
      checks: Object.fromEntries(CHECKS.map(key => [key, pending()])),
    })),
    review: {status: 'pending', conclusion: 'unverified', reviewer: null, reviewedAt: null, reviewDigest: null, reportPaths: [], unresolvedFindings: []},
  };
}
function pointer(object, expression) {
  need(typeof expression === 'string' && expression.startsWith('/'), 'JSON Pointer required');
  return expression.slice(1).split('/').reduce((value, token) => {
    const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
    need(value !== null && typeof value === 'object' && Object.hasOwn(value, key), `Missing JSON Pointer ${expression}`);
    return value[key];
  }, object);
}
function imageBytes(bytes) {
  return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ||
    bytes.subarray(0, 3).equals(Buffer.from([255,216,255])) ||
    (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP');
}
function activity(row, label, enemyIds, playerIds) {
  need(Array.isArray(row.actions) && Array.isArray(row.playerResponses), `${label}: actions/playerResponses arrays required`);
  for (const a of row.actions) need(text(a.actorId) && Number.isInteger(a.round) && a.round >= 0 && text(a.kind) && Number.isFinite(a.x) && Number.isFinite(a.y) && Object.hasOwn(a, 'targetId') && (a.targetId === null || text(a.targetId)), `${label}: real actor/round/action/position/target fields required`);
  for (const r of row.playerResponses) need(text(r.actorId) && Number.isInteger(r.round) && r.round >= 0 && text(r.kind) && text(r.detail), `${label}: player response actor/round/kind/detail required`);
  need(row.actions.every(a => enemyIds.includes(a.actorId)), `${label}: enemy action actorId is not a member of this cluster/spawn phase`);
  need(row.playerResponses.every(r => playerIds.includes(r.actorId)), `${label}: response actorId is not a current source party member`);
  need(nonempty(row.effects), `${label}: no observed tactical effect; damage is not mandatory, empty effect is blocking`);
  for (const e of row.effects) {
    need(EFFECTS.has(e.type) && text(e.detail), `${label}: observed effect category/detail required`);
    need(Array.isArray(e.actionIndexes) && Array.isArray(e.responseIndexes), `${label}: effect must reference actions/responses`);
    need(e.actionIndexes.length + e.responseIndexes.length > 0, `${label}: effect has no actual observation reference`);
    need(e.actionIndexes.every(i => Number.isInteger(i) && i >= 0 && i < row.actions.length) && e.responseIndexes.every(i => Number.isInteger(i) && i >= 0 && i < row.playerResponses.length), `${label}: effect observation index out of range`);
  }
}
// Deliberately reviewed, source-pinned adapter. A new chapter or changed trigger
// must supply its own verifier; a disposition string is never an exemption.
const HABITAT_VERIFIER = 'stage5-habitat/v1';
const HABITAT_TRIGGER_DIGEST = 'bcafb0badc0e9ca18dd102edd734987b8285c07f2ec6e381956abc769fbefc14';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const clone = value => structuredClone(value);
const fullBattle = b => b && b.honroStage === 5 && b.honroStage5WaterfallRevision === 1 && !b.honroCustom &&
  Number.isInteger(b.round) && b.round > 0 && Number.isInteger(b.side) && text(b.phase) &&
  Number.isFinite(b.width) && Number.isFinite(b.height) && b.honroState &&
  Array.isArray(b.units) && Array.isArray(b.terrain) && Array.isArray(b.honroMarkers) &&
  Array.isArray(b.honroEvents) && Array.isArray(b.projectiles) && Array.isArray(b.teamEnds) &&
  b.units.every(u => text(u.id) && Number.isFinite(u.hp) && Number.isInteger(u.side) && Number.isFinite(u.x) && Number.isFinite(u.y));

/** Recomputes a narrow non-entry proof, not a gameplay/observer truth verdict.
 * The ordinary sparse trace is accepted ONLY with a conservative, reconciled
 * persistent-survivor lower bound. Preemption needs every pre-mission state. */
export async function verifyStage5HabitatNonEntry(root, waveId, phase, trace) {
  need(/^habitat-5-[01]$/.test(waveId) && phase.nonEntry?.verifier === HABITAT_VERIFIER, 'No reviewed non-entry verifier for this stage/wave');
  need(['condition-not-met', 'objective-preempted'].includes(phase.disposition), 'Unknown conditional disposition');
  need(text(phase.id) && text(phase.nonEntry.reason), 'Non-entry phase ID and reason required');
  for (const key of ['spawnedIds', 'entry', 'firstEffect', 'effects']) need(phase[key] === 'N/A', `Non-entry ${key} must explicitly be N/A`);
  need(equal(phase.actions, []) && equal(phase.playerResponses, []), 'Non-entry cannot hide observed actions/responses');
  need(trace?.schema === 'honro-stage5-input-trace/v1' && ['native-input', 'browser-input', 'isolated-fixture'].includes(trace.method), 'Original Stage5 input trace required');
  need(Number.isInteger(trace.frame) && trace.frame > 0 && trace.completed === true && fullBattle(trace.initial) && fullBattle(trace.final), 'Complete original initial/final battle and completed run required');
  const terminal = {frame: trace.frame, round: trace.final.round, phase: trace.final.phase};
  need(terminal.phase === 'won' && equal(phase.nonEntry.terminal, terminal), 'Non-entry terminal frame/round/phase must match original victory');
  for (const key of ['snapshots', 'stateTrace', 'frames', 'frameInputs', 'hits', 'terrainHits', 'enemyActions', 'births', 'continues']) need(Array.isArray(trace[key]), `Missing original ${key} evidence`);
  need(nonempty(trace.snapshots) && nonempty(trace.stateTrace) && nonempty(trace.frames), 'Original whole-state snapshots, state transitions and actor frames required');
  need(trace.frameInputs.length === trace.frame && trace.frameInputs.every((f, i) => f.frame === i + 1 && Number.isFinite(f.now) && Array.isArray(f.keys) && Array.isArray(f.projectiles)), 'Missing/duplicate/out-of-order frame input evidence');
  const ordered = rows => rows.every((r, i) => Number.isInteger(r.frame) && r.frame >= 0 && r.frame <= trace.frame && (!i || r.frame >= rows[i - 1].frame));
  need(['snapshots', 'stateTrace', 'frames', 'hits', 'terrainHits', 'births'].every(k => ordered(trace[k])), 'Original event/state frame ordering invalid');
  need(trace.snapshots.every(s => fullBattle(s.battle) && s.round === s.battle.round), 'Every snapshot must retain original whole battle');
  need(trace.frames.every(f => Array.isArray(f.units) && Number.isInteger(f.round) && Number.isInteger(f.serial)), 'Actor frame unit/round/serial evidence required');
  need(trace.stateTrace.every(f => f.state && Number.isInteger(f.round) && Number.isInteger(f.serial)), 'Original state transition evidence required');
  need(trace.stateTrace.at(-1).frame === trace.frame && trace.stateTrace.at(-1).phase === 'won' && equal(trace.stateTrace.at(-1).state, trace.final.honroState), 'Final state trace does not bind terminal battle');
  need(trace.frames.at(-1).frame === trace.frame && trace.frames.at(-1).phase === 'won', 'Final actor frame missing');
  need(trace.continues.every(c => c.exact === true && Number.isInteger(c.frame)), 'Inexact Continue interrupts whole-run non-entry proof');
  const whole = [trace.initial, ...trace.snapshots.map(s => s.battle), trace.final];
  need(whole.every(b => b.honroMarkers.some(m => m.id === waveId && m.type === 'hauntHabitat')), 'Authored habitat source missing from whole battle');
  need(!trace.births.some(u => /^habitat-5-/.test(u.source || '')) && !whole.some(b => b.units.some(u => /^habitat-5-/.test(u.honroSpawnSource || ''))), 'Actual habitat birth cannot be reclassified as non-entry; observed entry/effect evidence required');
  const initialIds = trace.initial.units.map(u => u.id), birthIds = trace.births.map(u => u.id);
  need(new Set([...initialIds, ...birthIds]).size === initialIds.length + birthIds.length && sameSet(trace.final.units.map(u => u.id), [...initialIds, ...birthIds]), 'Birth ledger and whole battle actor inventory disagree');
  need(trace.enemyActions.every(a => initialIds.includes(a.id) || birthIds.includes(a.id)), 'Enemy action has no original actor/birth evidence');
  for (let round = trace.initial.round; round < trace.final.round; round++) need(trace.snapshots.some(s => s.round === round), `Missing whole-battle observation for round ${round}`);

  const mission = await readFile(await localFile(root, 'shared/runtime/mission.js'), 'utf8');
  const objectives = await readFile(await localFile(root, 'shared/runtime/objectives.js'), 'utf8');
  const geometry = await readFile(await localFile(root, 'shared/runtime/stage5-waterfall-geometry.js'), 'utf8');
  const holdSource = mission.slice(mission.indexOf('function reinforceHold('), mission.indexOf('\nfunction tick(', mission.indexOf('function reinforceHold(')));
  const objectiveSource = objectives.slice(objectives.indexOf('function rawState('), objectives.indexOf('\nfunction failure(', objectives.indexOf('function rawState(')));
  need(sha256(holdSource + '\n' + objectiveSource + '\n' + geometry.slice(geometry.indexOf('const active='))) === HABITAT_TRIGGER_DIGEST, 'Conditional trigger/policy changed; reviewed adapter update required');
  const {runtimeParts} = await import(pathToFileURL(await localFile(root, 'shared/build.mjs')).href);
  const parts = await runtimeParts({vector: false, render: false});
  need(trace.source?.runtime === sha256(parts.join('\n')) && trace.source?.campaign === sha256(await readFile(await localFile(root, 'shared/data/campaign.json'))), 'Non-entry original runtime/campaign digest is stale');
  const g = vm.createContext({console, performance, structuredClone});
  for (const part of parts) vm.runInContext(part, g);
  vm.runInContext(`(function(G) { G.__reviewReinforceHold = ${holdSource}; })(globalThis);`, g);
  const st = g.HONRO_CONTENT.stages.find(s => s.id === 5);
  need(st?.objective === 'seals', 'Reviewed Stage5 objective contract changed');
  // Execute the actual source function. The sink observes spawn requests before
  // allocation; it never creates gameplay actors or executes evidence as code.
  let calls = [];
  g.HonroAllies.execute = (_app, action) => { calls.push(clone(action)); return false; };
  const check = (battle, {warning = false, boundary = true} = {}) => {
    const b = clone(battle), e = {b, alive: side => b.units.filter(u => u.side === side && !u.dead && u.hp > 0), heroesAlive: () => b.units.filter(u => u.side === 0 && !u.summoned && !u.dead && u.hp > 0), fx() {}};
    const app = {engine: e, stage: st, event() {}};
    const objective = clone(g.HonroObjectives.state(b, st));
    calls = []; g.__reviewReinforceHold(app, boundary);
    return {round: b.round, objectiveReady: objective.objectiveReady, complete: objective.complete, settleRounds: objective.settleRounds, foes: e.alive(1).length, requested: calls.length, warning};
  };
  const finalObjective = check(trace.final);
  need(finalObjective.complete && finalObjective.objectiveReady && finalObjective.settleRounds === 1, 'Original objective state does not independently establish one-round completion');
  const evaluation = whole.map(b => check(b));

  if (phase.disposition === 'condition-not-met') {
    // A final count alone is insufficient: reconcile all positive damage with
    // each persistent original enemy and every raw actor/whole-state sample.
    need(trace.hits.every(h => text(h.target) && Number.isFinite(h.hp) && Number.isFinite(h.hpLoss) && h.hpLoss >= 0), 'Damage ledger missing actual nonnegative HP loss/state');
    const survivors = trace.initial.units.filter(u => u.side === 1 && !u.dead && u.hp > 0).filter(initial => {
      const hits = trace.hits.filter(h => h.target === initial.id); let hp = initial.hp;
      for (const h of hits) { hp -= h.hpLoss; if (hp <= 0 || Math.abs(h.hp - hp) > 1e-6) return false; }
      const final = trace.final.units.find(u => u.id === initial.id);
      if (!final || final.dead || final.side !== 1 || Math.abs(final.hp - hp) > 1e-6) return false;
      const samples = [{frame: 0, units: trace.initial.units}, ...trace.frames, ...trace.snapshots.map(s => ({frame: s.frame, units: s.battle.units})), {frame: trace.frame, units: trace.final.units}];
      return samples.every(s => {
        const u = s.units.find(u => u.id === initial.id);
        if (!u || u.dead || u.hp <= 0 || (u.side !== undefined && u.side !== 1)) return false;
        // Hooks record damage during the next App.frame; snapshots taken in a
        // damage hook and end-of-frame samples can straddle that single frame.
        const before = initial.hp - hits.filter(h => h.frame < s.frame).reduce((n, h) => n + h.hpLoss, 0);
        const after = initial.hp - hits.filter(h => h.frame <= s.frame).reduce((n, h) => n + h.hpLoss, 0);
        return u.hp <= before + 1e-6 && u.hp >= after - 1e-6;
      });
    }).map(u => u.id);
    need(survivors.length >= 5, 'Cannot prove enemies >= 5 for the whole run; final count or sparse samples cannot excuse an eligible trigger');
    need(evaluation.every(r => r.requested === 0), 'Actual trigger satisfied: missing spawn must not be hidden by condition-not-met');
    // Force the original holding window on a clone to ensure the survivor
    // lower bound really blocks this exact reviewed runtime trigger.
    const worst = clone(trace.final); worst.phase = 'transition'; worst.side = 0;
    worst.honroState.objectiveReadyRound = worst.round; delete worst.honroState.lastHabitatRound;
    need(check(worst).requested === 0, 'Actual trigger permits entry despite claimed survivor bound');
    return {verifier: HABITAT_VERIFIER, disposition: phase.disposition, terminal, survivorLowerBound: survivors.length, survivorIds: survivors, evaluations: evaluation};
  }

  // This richer capture is mandatory when low population makes a request
  // possible. Every App.frame must retain state immediately before mission.tick
  // plus its actual boundary flag; a few favorable snapshots cannot qualify.
  need(Array.isArray(trace.missionFrames) && trace.missionFrames.length === trace.frame && trace.missionFrames.every((f, i) => f.frame === i + 1 && typeof f.boundary === 'boolean' && fullBattle(f.battle)), 'Objective-preempted requires every original pre-mission whole-state frame and boundary');
  // Restore the actual Stage5 wrapper over the recording sink, preserving the
  // warning-round policy instead of trusting a declared cancellation reason.
  vm.runInContext(geometry, g);
  const opportunities = [], readyFrames = [];
  for (const f of trace.missionFrames) {
    const b = f.battle;
    need(sameSet(b.units.map(u => u.id), [...initialIds, ...trace.births.filter(u => u.frame < f.frame).map(u => u.id)]), 'Pre-mission actor inventory contradicts original birth ledger');
    for (const u of b.units) {
      const initial = trace.initial.units.find(v => v.id === u.id);
      if (!initial) continue;
      const hits = trace.hits.filter(h => h.target === u.id);
      need(hits.every(h => Number.isFinite(h.hpLoss) && h.hpLoss >= 0), 'Pre-mission damage evidence missing');
      const before = initial.hp - hits.filter(h => h.frame < f.frame).reduce((n, h) => n + h.hpLoss, 0);
      const after = initial.hp - hits.filter(h => h.frame <= f.frame).reduce((n, h) => n + h.hpLoss, 0);
      need(u.side === initial.side && u.hp <= before + 1e-6 && u.hp >= Math.max(0, after) - 1e-6 && (!u.dead || u.hp <= 0), 'Pre-mission population/HP contradicts original whole state and damage ledger');
    }
    const engine = new g.HONRO_CORE.Engine(clone(b), () => {}, true);
    const actualBoundary = b.phase === 'transition' && !b.projectiles.length && !engine.settleBusy();
    need(f.boundary === actualBoundary, 'Recorded mission boundary differs from actual runtime boundary');
    need(b.round <= trace.final.round && !b.units.some(u => /^habitat-5-/.test(u.honroSpawnSource || '')), 'Pre-mission frame contradicts terminal/no-birth claim');
    const result = check(b, {warning: true, boundary: f.boundary});
    if (result.objectiveReady && !result.complete) readyFrames.push(f.frame);
    need(result.requested === 0, 'Actual warned trigger satisfied before victory; missing birth is not objective preemption');
    // Removing just warning gate must reveal at least one real original request.
    const wrapped = g.HonroAllies.execute;
    g.HonroAllies.execute = (_app, action) => { calls.push(clone(action)); return false; };
    const original = check(b, {boundary: f.boundary}); g.HonroAllies.execute = wrapped;
    if (original.requested > 0) opportunities.push({frame: f.frame, round: b.round});
  }
  need(opportunities.length > 0 && readyFrames.length > 0, 'No original trigger deferred by warning; use verified condition-not-met instead');
  need(opportunities.every(o => o.round + 1 === terminal.round), 'Victory did not preempt the original next-round warning entry');
  need(trace.final.honroState.objectiveReadyRound + 1 === terminal.round, 'Original one-round objective settlement was not preserved');
  return {verifier: HABITAT_VERIFIER, disposition: phase.disposition, terminal, opportunities, evaluations: evaluation};
}

export async function validateManifest(root, manifest) {
  const errors = [], cache = new Map(), refs = new Map();
  const guard = async (label, fn) => { try { await fn(); } catch (e) { errors.push(`${label}: ${e.message}`); } };
  let expected = [], current;
  await guard('manifest', async () => {
    need(manifest?.schema === SCHEMA, 'Unsupported manifest schema');
    need(Array.isArray(manifest.evidence) && Array.isArray(manifest.knownFailures), 'Evidence and knownFailures arrays required');
  });
  await guard('authors', async () => {
    need(nonempty(manifest.implementationAuthors) && manifest.implementationAuthors.every(text), 'Implementation authors required for independent review');
  });
  await guard('current target', async () => {
    current = await fingerprints(root);
    need(manifest.sourceDigest === current.sourceDigest && manifest.targetDigest === current.targetDigest, 'Stale source or built targets');
  });
  await guard('stage inventory', async () => {
    expected = inventory(JSON.parse(await readFile(path.join(root, 'shared/data/campaign.json'), 'utf8')), manifest.stageIds);
    need(sameSet(manifest.stages?.map(s => s.stageId), manifest.stageIds), 'Exact stage coverage required');
  });
  for (const ref of manifest?.evidence || []) await guard(`evidence ${ref?.path}`, async () => {
    need(text(ref.path) && /^[a-f0-9]{64}$/.test(ref.sha256) && text(ref.kind), 'Path, SHA256 and kind required');
    need(!refs.has(ref.path), 'Duplicate evidence path');
    refs.set(ref.path, ref);
    const actual = await fileRef(root, ref.path);
    need(actual.sha256 === ref.sha256, 'Evidence bytes changed');
    const bytes = await readFile(await localFile(root, ref.path));
    need(bytes.length > 0, 'Empty evidence file');
    if (ref.kind === 'screenshot') need(imageBytes(bytes), 'Screenshot is not PNG/JPEG/WebP bytes');
    cache.set(ref.path, bytes);
  });
  function paths(list, label) {
    need(nonempty(list) && new Set(list).size === list.length && list.every(p => refs.has(p) && cache.has(p)), `${label}: linked verified evidence files required`);
  }
  function json(p) {
    paths([p], 'JSON evidence');
    return JSON.parse(cache.get(p).toString('utf8'));
  }
  function bound(packet, stageId) {
    need(packet.stageId === stageId && packet.sourceDigest === manifest.sourceDigest && packet.targetDigest === manifest.targetDigest, 'Observation stage/source/target mismatch');
  }
  function observation(ref, stageId, kind, expectedId) {
    need(ref && text(ref.path), 'Observation JSON file/Pointer required');
    const packet = json(ref.path);
    need(packet.schema === 'honro-encounter-observation/v1', 'Observation packet schema required');
    bound(packet, stageId);
    need(text(packet.observer) && validTime(packet.observedAt) && ['native-input', 'browser-input', 'isolated-fixture'].includes(packet.method), 'Actual observer/time/method required');
    paths(packet.rawEvidencePaths, 'Original observation trace');
    need(!packet.rawEvidencePaths.includes(ref.path), 'Observation envelope cannot be its own raw trace');
    const row = pointer(packet, ref.pointer);
    need(row.id === expectedId && row.kind === kind && row.status === 'observed', 'Observation ID/kind/status mismatch or ineffective/unverified');
    return row;
  }
  for (const source of expected) {
    const stage = manifest.stages?.find(s => s.stageId === source.stageId);
    await guard(`stage ${source.stageId} inventory`, async () => {
      need(stage && sameSet(stage.clusters?.map(c => c.id), source.clusters.map(c => c.id)), 'Missing/extra/duplicate current source cluster ID');
      need(Array.isArray(stage.runtimeWaves), 'Explicit runtimeWaves inventory required, empty only after source audit');
      for (const wave of stage.runtimeWaves) {
        need(text(wave.id) && !source.waves.some(w => w.id === wave.id), 'Runtime wave ID required and must not duplicate source wave');
        paths(wave.sourcePaths, 'Runtime wave source');
        need(wave.sourcePaths.every(p => /^(shared\/runtime|tools\/map-forge)\//.test(p)), 'Runtime wave inventory must link actual runtime/generator source files');
      }
      need(sameSet(stage.waves?.map(w => w.id), [...source.waves, ...stage.runtimeWaves].map(w => w.id)), 'Missing/extra/duplicate wave event/objective/runtime ID');
    });
    if (!stage) continue;
    for (const sourceCluster of source.clusters) await guard(`stage ${source.stageId} cluster ${sourceCluster.id}`, async () => {
      const c = stage.clusters.find(c => c.id === sourceCluster.id);
      need(c?.status === 'observed' && sameSet(c.memberIds, sourceCluster.memberIds), 'Unverified cluster or mismatched source member IDs');
      const row = observation(c.observation, stage.stageId, 'cluster', c.id);
      need(sameSet(row.memberIds, sourceCluster.memberIds), 'Observation does not cover actual source member IDs');
      need(text(row.purpose) && text(row.roleRelations) && text(row.emptySpacePurpose) && nonempty(row.supportIds) && row.supportIds.every(text), 'Cluster purpose/role relations/empty-space purpose/supports required');
      activity(row, c.id, sourceCluster.memberIds, source.playerIds);
    });
    for (const wave of stage.waves || []) await guard(`stage ${source.stageId} wave ${wave.id}`, async () => {
      need(wave.status === 'observed', 'Unverified wave');
      const row = observation(wave.observation, stage.stageId, 'wave', wave.id);
      need(nonempty(row.phases) && new Set(row.phases.map(p => p.id)).size === row.phases.length, 'Individual phase IDs required');
      for (const phase of row.phases) {
        if (phase.disposition && phase.disposition !== 'observed') {
          need(stage.stageId === 5 && /^habitat-5-[01]$/.test(wave.id), 'No reviewed non-entry verifier for this stage/wave');
          const packet = json(wave.observation.path), rawPath = phase.nonEntry?.tracePath;
          need(text(rawPath) && packet.rawEvidencePaths.includes(rawPath), 'Non-entry trace must be original linked raw evidence');
          const runtime = stage.runtimeWaves.find(w => w.id === wave.id);
          need(runtime && ['shared/runtime/mission.js', 'shared/runtime/objectives.js', 'shared/runtime/stage5-waterfall-geometry.js'].every(p => runtime.sourcePaths.includes(p)), 'Non-entry inventory must bind actual trigger/objective/warning source');
          await verifyStage5HabitatNonEntry(root, wave.id, phase, json(rawPath));
          continue;
        }
        need(text(phase.id) && text(phase.trigger?.event) && Number.isInteger(phase.trigger?.round) && phase.trigger.round >= 0, 'Trigger event/round required');
        need(text(phase.warningBoundary) && text(phase.entry?.boundary) && phase.warningBoundary !== phase.entry.boundary, 'Distinct warning and entry action boundaries required');
        need(Number.isInteger(phase.entry?.round) && phase.entry.round >= phase.trigger.round && Number.isFinite(phase.entry?.x) && Number.isFinite(phase.entry?.y), 'Actual entry round/coordinates required');
        need(nonempty(phase.spawnedIds) && phase.spawnedIds.every(text) && new Set(phase.spawnedIds).size === phase.spawnedIds.length, 'Actual spawnedIds for each phase required');
        activity(phase, `${wave.id}/${phase.id}`, phase.spawnedIds, source.playerIds);
        need(phase.actions.every(a => a.round >= phase.entry.round) && phase.playerResponses.every(r => r.round >= phase.trigger.round), 'Wave action before entry or response before trigger');
        const first = phase.firstEffect;
        const list = first?.kind === 'actor-action' ? phase.actions : first?.kind === 'player-response' ? phase.playerResponses : null;
        need(list && Number.isInteger(first.index) && first.index >= 0 && first.index < list.length, 'First effective action/player response reference required');
        need(phase.effects.some(e => (first.kind === 'actor-action' ? e.actionIndexes : e.responseIndexes).includes(first.index)), 'First effect must be part of an observed effect');
      }
    });
    for (const key of CHECKS) await guard(`stage ${source.stageId} ${key}`, async () => {
      const row = stage.checks?.[key];
      need(row?.status === 'observed' && text(row.detail), 'Missing, blocked or unverified required check');
      paths(row.evidencePaths, key);
      if (key === 'same-camera') {
        const packet = row.evidencePaths.map(p => { try { return json(p); } catch { return null; } }).find(p => p?.schema === 'honro-encounter-comparison/v1');
        need(packet, 'Structured same-camera comparison required'); bound(packet, stage.stageId);
        need(text(packet.baselineRevision) && nonempty(packet.views), 'Baseline revision and actual view pairs required');
        for (const view of packet.views) {
          need(text(view.id) && view.beforePath !== view.afterPath, 'Distinct before/after view paths required');
          paths([view.beforePath, view.afterPath], 'Before/after images');
          need([view.beforePath, view.afterPath].every(p => refs.get(p).kind === 'screenshot'), 'Before/after must be actual screenshots');
          const camera = c => c && ['x', 'y', 'zoom', 'width', 'height'].every(k => Number.isFinite(c[k])) && c.zoom > 0 && c.width > 0 && c.height > 0;
          need(camera(view.beforeCamera) && camera(view.afterCamera) && ['x', 'y', 'zoom', 'width', 'height'].every(k => view.beforeCamera[k] === view.afterCamera[k]), 'Before/after camera and viewport must match');
        }
      }
      if (key === 'normal-resource-play') {
        const packet = row.evidencePaths.map(p => { try { return json(p); } catch { return null; } }).find(p => p?.schema === 'honro-encounter-normal-play/v1');
        need(packet, 'Structured normal-resource play evidence required'); bound(packet, stage.stageId);
        need(['native-input', 'browser-input'].includes(packet.method) && packet.debug === false && equal(packet.modifications, []) && packet.normalResources === true && packet.completed === true, 'Normal completed UI input with unchanged resources required');
        const populated = value => value && typeof value === 'object' && Object.keys(value).length > 0;
        need(text(packet.observer) && validTime(packet.observedAt), 'Normal play observer and actual observation time required');
        need(Number.isInteger(packet.profile?.entryLevel) && packet.profile.entryLevel > 0 && populated(packet.profile?.skillAllocation) && populated(packet.profile?.startingResources), 'Actual entry level, legal skill allocation and starting resources required');
        paths(packet.rawEvidencePaths, 'Normal-input raw trace');
        need(!packet.rawEvidencePaths.some(p => row.evidencePaths.includes(p) && jsonSchema(p) === 'honro-encounter-normal-play/v1'), 'Play envelope cannot be its own raw trace');
      }
    });
  }
  function jsonSchema(p) { try { return json(p).schema; } catch { return null; } }
  for (const failure of manifest?.knownFailures || []) await guard(`known failure ${failure.id}`, async () => {
    need(text(failure.id) && text(failure.detail) && failure.status === 'resolved', 'Known failure remains open or unverified');
    paths(failure.retestEvidencePaths, 'Current failure retest');
    need(failure.retestEvidencePaths.some(p => { let packet; try { packet = json(p); } catch { return false; } return packet.sourceDigest === manifest.sourceDigest && packet.targetDigest === manifest.targetDigest && packet.resolvedFailureIds?.includes(failure.id); }), 'Known failure needs current-target retest packet naming its failure ID');
  });
  await guard('independent review', async () => {
    const r = manifest.review;
    need(r?.status === 'reviewed' && r.conclusion === 'no-blocking-findings' && text(r.reviewer) && !manifest.implementationAuthors?.some(a => a.trim().toLowerCase() === r.reviewer.trim().toLowerCase()) && validTime(r.reviewedAt), 'Different reviewer and actual review time required');
    need(r.reviewDigest === reviewDigest(manifest), 'Independent review must bind exact manifest/evidence bytes');
    paths(r.reportPaths, 'Independent review report');
    need(Array.isArray(r.unresolvedFindings) && r.unresolvedFindings.length === 0, 'Independent review has unresolved findings');
  });
  return {schema: SCHEMA, status: errors.length ? 'blocked' : 'evidence-records-complete', quality: 'not-automatically-assessed', sourceDigest: current?.sourceDigest ?? null, targetDigest: current?.targetDigest ?? null, reviewDigest: reviewDigest(manifest), errors,
    limits: ['File hashes and schemas do not prove truthful observations, reviewer identity or design quality.', 'Runtime-only wave/phase completeness, recorded spawnedIds versus raw births, and actual tactical/visual quality require independent source and evidence review.', 'This gate does not replace verify, browser/performance checks, final approval or Pages verification.']};
}
async function main() {
  const [command = 'help', ...args] = process.argv.slice(2), root = process.cwd();
  if (command === 'help') {
    console.log('encounter:review init --stages 8,11 --out _local/reports/encounter-review.json\nencounter:review digest <manifest.json>\nencounter:review check <manifest.json>\nSee game/docs/ENCOUNTER_ACCEPTANCE.md. init creates pending records, never observations. check exit 0 means evidence completeness, never automatic design approval.'); return;
  }
  if (command === 'init') {
    const option = name => args[args.indexOf(name) + 1];
    need(args.includes('--stages') && args.includes('--out'), '--stages and --out required');
    const stageIds = option('--stages').split(',').map(Number), out = option('--out');
    need(out.startsWith('_local/') && !out.split(/[\\/]/).includes('..'), 'Output must be under _local/');
    const manifest = await template(root, stageIds), full = path.resolve(root, out);
    await mkdir(path.dirname(full), {recursive: true});
    await localFile(root, path.dirname(out));
    await writeFile(full, JSON.stringify(manifest, null, 2) + '\n', {flag: 'wx'});
    console.log(`Created pending evidence manifest: ${out}`); return;
  }
  need(['check', 'digest'].includes(command) && args.length === 1, 'Use help for supported commands');
  const manifest = JSON.parse(await readFile(await localFile(root, args[0]), 'utf8'));
  if (command === 'digest') { console.log(reviewDigest(manifest)); return; }
  const report = await validateManifest(root, manifest);
  console.log(JSON.stringify(report, null, 2));
  if (report.status === 'blocked') process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
