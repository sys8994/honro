/** Actual normal-arrival save, followed by a declared wait-only response branch.
 * No actor, HP, objective, equipment, queue or terrain injection. The real App
 * Continue restores the whole battle exactly; ordinary defend inputs then let
 * the existing four-slot AI and two-round possession rule run unchanged.
 */
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {runtimeParts} from '../shared/build.mjs';
import {act1Runtime} from './act1-spatial-test-helpers.mjs';

const plain = value => JSON.parse(JSON.stringify(value));
const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const fixtureRoot = new URL('./fixtures/encounter-density/ravine-ritual/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', fixtureRoot), 'utf8'));
const packed = await readFile(new URL(manifest.snapshotFile, fixtureRoot));
assert.equal(hash(packed), manifest.gzipSha256, 'Committed compressed normal-arrival snapshot is exact');
assert(packed.subarray(4, 8).every(byte => byte === 0), 'Deterministic gzip timestamp is zero');
const raw = gunzipSync(packed);
assert.equal(hash(raw), manifest.snapshotSha256, 'Full original snapshot bytes are exact');
const saved = JSON.parse(raw);
const g = await act1Runtime(), C = g.HONRO_CORE, D = g.HonroEncounterDensity;
const parts = await runtimeParts({vector: false, render: false});
const projectParts = parts.filter(part => part.startsWith('globalThis.HONRO_PROJECT='));
assert.equal(projectParts.length, 1);
const nonProjectRuntimeSha256 = hash(parts.filter(part => !part.startsWith('globalThis.HONRO_PROJECT=')).join('\n'));
assert.equal(nonProjectRuntimeSha256, manifest.nonProjectRuntimeSha256, 'Every non-project runtime byte must match the recorded arrival');
assert.equal(hash(g.HONRO_PROJECT.stages[10]), manifest.stageSha256, 'Current Stage11 must match the recorded arrival exactly');
assert.equal(hash(JSON.parse(await readFile('shared/data/campaign.json')).stages[10]), manifest.canonicalStageSha256);
const main = await readFile('shared/runtime/main.js', 'utf8');
assert.equal(hash(main), manifest.mainSha256, 'Actual App Continue/mission implementation is unchanged');
assert.equal(hash(await readFile('shared/runtime/interactions.js')), manifest.interactionsSha256);
assert.equal(hash(await readFile(new URL('./act1-spatial-test-helpers.mjs', import.meta.url))), manifest.helpersSha256);
const provenance = {fixture: manifest, observedAt: new Date().toISOString(), currentProjectSha256: hash(g.HONRO_PROJECT), currentRuntimeSha256: hash(parts.join('\n')), nonProjectRuntimeSha256, controllerSha256: hash(await readFile(new URL(import.meta.url)))};

const mount = main.slice(main.indexOf('        mount(b) {'), main.indexOf(' this.selected = e.active')) + '}';
const continueMethod = main.slice(main.indexOf('        continue() {'), main.indexOf('        checkMission(e) {'));
const methods = new Function('G', 'C', 'H', 'clone', 'return ({' + mount + ',' + continueMethod + '})')(g, C, g.HONRO_CONTENT, structuredClone);
const profile = structuredClone(saved.profile);
const app = {...methods, profile, contacts: new Set(), notices: [], speeches: [], training: false, done: false,
  event(text) { this.notices.push(text); }, sayLines(lines) { this.speeches.push(...lines); },
  canInput() { return this.engine.canAct(); }, cancelInput() {}, checkMission: g.testCheckMission};
g.HonroProgression.syncRoster(profile, saved.b);
profile.honroBattle = structuredClone(saved.b);
app.continue();
const e = app.engine, b = e.b;
assert.deepEqual(plain(b), saved.b, 'Whole saved battle is exact after real Continue');
assert.equal(b.enemyLimit, 4);
assert.equal(b.round, manifest.round);
assert.equal(g.HonroAct2.current(b).id, 'hold-knots');
assert(e.heroesAlive().every(hero => hero.level === 10));
const sources = ['hold-knots-0', 'hold-knots-3'];
assert.equal(b.units.filter(unit => sources.includes(unit.honroSpawnSource)).length, 0, 'Real checkpoint is after warning, before either birth');
const initial = plain(b), known = new Set(b.units.map(unit => unit.id)), possessed = new Set();
const notices = [], responses = [], births = [], actions = [], shots = [], damage = [], queues = [], conversions = [], goals = [];
let frames = 0, serial = 0, goal = null, ritualCompletedRound = null;
const unitRecord = unit => unit ? {id: unit.id, source: unit.honroSpawnSource || null, cell: unit.honroRavineCell || null, side: unit.side, x: unit.x, y: unit.y, hp: unit.hp, maxHp: unit.maxHp, shield: unit.shield || 0, possessed: !!unit.honroPossessed, support: e.contactSurface(unit.x, unit.y - 8, unit.y + 10)?.t?.id || null} : null;
const originalEvent = app.event.bind(app);
app.event = text => { notices.push({round: b.round, frame: frames, serial, text}); return originalEvent(text); };
const fire = e.fire.bind(e);
e.fire = (skill, angle, power, ...args) => { const unit = e.active, round = b.round, result = fire(skill, angle, power, ...args); if (result) shots.push({round, frame: frames, actor: unitRecord(unit), skill, angle, power}); return result; };
const hurt = e.hurt.bind(e);
e.hurt = (unit, amount, owner, ...args) => { const hp = unit.hp, shield = unit.shield || 0, actor = unitRecord(e.unit(owner)), result = hurt(unit, amount, owner, ...args); if (hp > unit.hp || shield > (unit.shield || 0)) damage.push({round: b.round, frame: frames, actor, actorId: owner, targetId: unit.id, targetSide: unit.side, skill: args[4] || args[1]?.skill || null, hp: Math.max(0, hp - unit.hp), shield: Math.max(0, shield - (unit.shield || 0))}); return result; };
const finish = e.finishAction.bind(e);
e.finishAction = (...args) => { const unit = e.active, acted = unit?.acted, round = b.round, kind = unit?.intent, targetId = unit?.aiMove?.targetId || null, result = finish(...args); if (unit?.side === 1 && !acted && unit.acted) actions.push({round, frame: frames, actor: unitRecord(unit), kind, targetId}); return result; };
const switchTeam = e.switchTeam.bind(e);
e.switchTeam = (...args) => { const side = b.side, result = switchTeam(...args); if (side === 0 && b.side === 1) { assert(b.queue.length <= 4); queues.push({round: b.round, frame: frames, ids: [...b.queue]}); } return result; };

for (; frames < 80000 && b.round < initial.round + 6 && !['won', 'lost'].includes(b.phase); frames++) {
  if (e.canAct()) {
    const unit = e.active;
    responses.push({round: b.round, frame: frames, serial: ++serial, actorId: unit.id, kind: 'defend', x: unit.x, y: unit.y, detail: 'Ordinary wait/defend from the exact normal-arrival save; no state correction.'});
    e.wait();
  }
  e.tick(C.STEP);
  g.HonroMission.tick(app, C.STEP);
  for (const unit of b.units) {
    if (!known.has(unit.id)) {
      known.add(unit.id);
      births.push({round: b.round, frame: frames, serial, actor: unitRecord(unit), warning: plain(D.memory(b).existingWarnings?.[unit.honroSpawnSource] || null), safeFromParty: e.heroesAlive().every(hero => Math.abs(hero.x - unit.x) >= 280 || Math.abs(hero.y - unit.y) >= 300), nearestHero: Math.min(...e.heroesAlive().map(hero => Math.hypot(hero.x - unit.x, hero.y - unit.y)))});
    }
    if (sources.includes(unit.honroSpawnSource) && unit.honroPossessed && !possessed.has(unit.id)) {
      possessed.add(unit.id);
      conversions.push({round: b.round, frame: frames, actor: unitRecord(unit), validContact: C.validTerrainContactPose(b.terrain, unit)});
    }
  }
  const next = g.HonroAct2.current(b)?.id;
  if (next !== goal) { goals.push({round: b.round, frame: frames, id: next, hold: plain(g.HonroAct2.memory(b).holds?.['hold-knots'] || null)}); goal = next; }
  if (g.HonroAct2.memory(b).done['hold-knots'] && ritualCompletedRound === null) ritualCompletedRound = b.round;
}
const waves = sources.map(source => ({source, births: births.filter(row => row.actor.source === source), actions: actions.filter(row => row.actor.source === source), shots: shots.filter(row => row.actor.source === source), damage: damage.filter(row => row.actor?.source === source && row.targetSide === 0), conversions: conversions.filter(row => row.actor.source === source)}));
const report = {contract: 'Exact R37 Continue; two safe trios after actual response opportunities; native two-round possession; cap four; observed west pressure.', quality: 'not-assessed', eastShotsObserved: waves[1].shots.length, holdAfterBranch: plain(g.HonroAct2.memory(b).holds?.['hold-knots'] || null), scope: 'Exact normal-arrival Continue followed by a six-round wait-only response branch. The existing front remains alive and contests the hold. East fire is not required or claimed in this branch. No actor, objective, HP, equipment, terrain or queue injection; not whole-stage completion or optimal-response evidence.', provenance, wholeBattleRestoredExactly: true, initial, notices, responses, births, actions, shots, damage, queues, conversions, goals, ritualCompletedRound, waves, frames, round: b.round, final: plain(b)};
const out = process.env.HONRO_STAGE11_CONTINUATION_OUT || '_local/reports/encounter-density/stage11-real-save-continuation';
await mkdir(out, {recursive: true});
await writeFile(out + '/result.json', JSON.stringify(report, null, 2) + '\n');
assert.equal(b.round, initial.round + 6, 'Branch reaches six real round transitions');
// Defending without clearing the original front is intentionally not treated
// as an automatic ritual completion. Its actual contested state is reported.
assert(queues.length >= 6);
for (const wave of waves) {
  assert.equal(wave.births.length, 3, wave.source + ': one atomic trio');
  assert.equal(new Set(wave.births.map(row => row.actor.id)).size, 3);
  assert(wave.births.every(row => row.serial > 0 && row.warning?.opportunity && row.safeFromParty), wave.source + ': real response opportunity and safe births');
  assert.deepEqual(wave.births.map(row => row.actor.maxHp), [796, 796, 1234], 'Original HP and one elite per trio');
  if (wave.source === 'hold-knots-0') {
    assert(wave.shots.length > 0, 'West existing AI actually fires');
    assert(wave.damage.some(row => row.round < initial.round + 4 && row.hp + row.shield > 0), 'West actually pressures the party in the original four-round window');
  }
  // East pressure after real front clearance belongs to the frozen normal
  // prefix proof. Zero shots here must not be relabelled as effective attacks.
  assert.equal(wave.conversions.length, 3, wave.source + ': original possession for all three');
  for (const conversion of wave.conversions) {
    const birth = wave.births.find(row => row.actor.id === conversion.actor.id);
    assert.equal(conversion.round, birth.round + 2);
    assert.equal(conversion.actor.support, 'rv-ritual-buttress');
    assert(conversion.validContact);
  }
}
assert.deepEqual(plain(b.items), initial.items, 'No consumables used');
console.log(JSON.stringify({passed: true, contract: report.contract, quality: report.quality, eastShotsObserved: report.eastShotsObserved, holdAfterBranch: report.holdAfterBranch, round: b.round, ritualCompletedRound, wholeBattleRestoredExactly: true, cap: 4, waves: waves.map(wave => ({source: wave.source, birthRound: wave.births[0].round, shots: wave.shots.length, firstEffect: wave.damage[0], conversions: wave.conversions.length})), report: out + '/result.json'}));
