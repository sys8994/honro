/** Production Stage 11 echo lifecycle in declared objective/pose fixtures.
 * All 53 initial enemies remain present. Only Sodan is moved to the supported
 * ritual court in the basic fixture; the other heroes retain their start poses.
 * Occupancy cases explicitly place one further hero or a temporary test stake.
 * Prior objective/event flags and second-phase history are fixture setup, never
 * evidence of normal arrival, route execution, chapter completion or quality.
 * App input/actor boundaries, wave admission, export and Continue are real;
 * DOM, rendering, storage, audio and scheduling are the shared harness doubles.
 */
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeParts} from '../shared/build.mjs';
import {appHarness, plain} from './app-regression-helpers.mjs';

const h = await appHarness(), {g, C} = h;
const A = g.HonroAct2, D = g.HonroEncounterDensity;
const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const project = plain(g.HONRO_PROJECT), rows = [];
const provenance = {
  projectSha256: hash(project),
  stageSha256: hash(project.stages[10]),
  runtimeSha256: hash((await runtimeParts({vector:false, render:false})).join('\n')),
  controllerSha256: hash(await readFile(new URL(import.meta.url), 'utf8')),
  observedAt: new Date().toISOString()
};
const sources = ['hold-knots-0', 'hold-knots-3'];
let now = 10000;
g.performance = {now: () => now};

function actors(q, source) { return q.b.units.filter(u => u.honroSpawnSource === source); }
function warning(q, source) { return q.b.honroState.encounterDensity?.existingWarnings?.[source]; }
function entry(q, source) { return q.b.honroState.ravineComposition?.entries?.[source]; }
function safePose(q, u, x, support = 'rv-ritual-buttress') {
  const at = g.HonroMapEngine.surfaceY(q.b.terrain, x, undefined, support);
  assert(at, `${support} supports fixture x=${x}`);
  Object.assign(u, {x, y:at.y, vx:0, vy:0});
  assert(C.validTerrainContactPose(q.b.terrain, u), `${u.id} has a valid supported fixture pose`);
  assert(!q.b.units.some(v => v !== u && !v.dead && v.hp > 0 &&
    Math.abs(v.x-u.x) < v.r+u.r+12 && u.y > v.y-v.h-12 && u.y-u.h < v.y+12),
  `${u.id} fixture does not overlap an existing actor`);
}
function snapshotEqual(actual, expected, label) {
  const actualPlain = plain(actual), expectedPlain = plain(expected);
  const changed = [...new Set([...Object.keys(actualPlain), ...Object.keys(expectedPlain)])]
    .filter(key => JSON.stringify(actualPlain[key]) !== JSON.stringify(expectedPlain[key]));
  assert.equal(hash(actualPlain), hash(expectedPlain), `${label}; changed top-level fields: ${changed.join(', ')}`);
}
function fixture({phase=0, density=true, members=true} = {}) {
  g.HONRO_PROJECT = plain(project);
  // Opt-in metadata is set before world construction, never removed from an
  // already-mounted engine with density hooks still installed.
  const savedMetadata = g.HONRO_PROJECT.stages[10].initialState;
  if (!density) delete savedMetadata.honroEncounterDensityRevision;
  if (!members) for (const at of savedMetadata.honroStage11DefenseEntries) delete at.members;
  const profile = h.profileThrough(10);
  for (const cls of profile.recruited) profile.heroes[cls].xp = g.HonroProgression.legacyCampaignAnchor(10);
  profile.seen['act2:first-spirit-encounter'] = true;
  const app = h.load(profile);
  app.launch(11);
  h.finish(app);
  now += 10000;
  const q = {app, b:app.engine.b, e:app.engine, notices:[], responses:[], births:[], conversions:[], queues:[], shots:[], damage:[], frames:0};
  q.initialEnemyIds = q.e.alive(1).map(u => u.id);
  assert.equal(q.initialEnemyIds.length, 53, 'Every production initial enemy is retained');
  assert.equal(q.b.enemyLimit, 4);
  assert(q.e.heroesAlive().every(u => u.level === 10));
  const originalEnemies = plain(q.e.alive(1));
  const a = A.memory(q.b);
  for (const step of A.steps(q.b)) {
    if (step.id === 'hold-knots') break;
    a.done[step.id] = true;
  }
  for (const ev of q.b.honroEvents) q.b.honroState.flags['event:'+ev.id] = true;
  q.b.honroState.pendingEvents = [];
  if (phase) {
    a.holds['hold-knots'] = {progress:0, spawned:3, lastRound:q.b.round, enteredRound:q.b.round, continuous:false};
    a.events['hold-knots-0'] = true;
  }
  const sodan = q.e.heroesAlive().find(u => u.cls === 'occultist');
  safePose(q, sodan, 7470);
  q.e.select(sodan.id);
  assert.deepEqual(plain(q.e.alive(1)), originalEnemies, 'Objective/pose fixture does not alter any initial enemy');
  q.e.refreshActivation(); // The ordinary cache refresh observes the declared pose before save.
  q.setup = {phase, density, members, initialEnemies:53, heroPose:{id:sodan.id, x:sodan.x, y:sodan.y, support:'rv-ritual-buttress'},
    priorGoals:'Declared completed through knot-east', unrelatedEvents:'Declared already handled',
    phaseHistory:phase ? 'First trio marked handled as an explicit phase fixture; no first-wave bodies injected' : 'No prior echo wave'};
  return instrument(q);
}
function instrument(q) {
  q.known = new Set(q.b.units.map(u => u.id));
  q.possessed = new Set(q.b.units.filter(u => u.honroPossessed).map(u => u.id));
  const event = q.app.event.bind(q.app);
  q.app.event = text => {
    q.notices.push({text, frame:q.frames, round:q.b.round, serial:q.b.honroState.actorTurnSerial || 0});
    return event(text);
  };
  const switchTeam = q.e.switchTeam.bind(q.e);
  q.e.switchTeam = (...args) => {
    const side = q.b.side, result = switchTeam(...args);
    if (side === 0 && q.b.side === 1) {
      assert(q.b.queue.length <= 4, 'Actual enemy queue keeps the four-action cap');
      q.queues.push({round:q.b.round, ids:[...q.b.queue]});
    }
    return result;
  };
  const fire = q.e.fire.bind(q.e);
  q.e.fire = (skill, angle, power, ...args) => {
    const u = q.e.active, pose = u && {x:u.x, y:u.y}, result = fire(skill, angle, power, ...args);
    if (result && sources.includes(u?.honroSpawnSource)) q.shots.push({id:u.id, source:u.honroSpawnSource,
      round:q.b.round, frame:q.frames, skill, angle, power, ...pose});
    return result;
  };
  const hurt = q.e.hurt.bind(q.e);
  q.e.hurt = (u, amount, owner, ...args) => {
    const hp = u.hp, shield = u.shield || 0, source = q.e.unit(owner)?.honroSpawnSource;
    const result = hurt(u, amount, owner, ...args);
    if (sources.includes(source) && (u.hp < hp || (u.shield || 0) < shield)) q.damage.push({id:owner, source,
      targetId:u.id, targetSide:u.side, round:q.b.round, frame:q.frames,
      hp:Math.max(0, hp-u.hp), shield:Math.max(0, shield-(u.shield || 0)), x:u.x, y:u.y});
    return result;
  };
  return q;
}
function observe(q) {
  for (const u of q.b.units) {
    if (!q.known.has(u.id)) {
      q.known.add(u.id);
      if (sources.includes(u.honroSpawnSource)) q.births.push({id:u.id, source:u.honroSpawnSource,
        x:u.x, y:u.y, hp:u.hp, maxHp:u.maxHp, elite:!!u.elite, round:q.b.round, frame:q.frames,
        warning:plain(warning(q, u.honroSpawnSource) || null), entry:plain(entry(q, u.honroSpawnSource) || null)});
    }
    if (sources.includes(u.honroSpawnSource) && u.honroPossessed && !q.possessed.has(u.id)) {
      q.possessed.add(u.id);
      q.conversions.push({id:u.id, source:u.honroSpawnSource, bornRound:u.honroEchoBorn,
        round:q.b.round, x:u.x, y:u.y, kind:u.honroVariant});
    }
  }
  assert(q.initialEnemyIds.every(id => q.b.units.some(u => u.id === id)), 'No initial enemy is removed from the battlefield');
}
function tick(q) {
  now += C.STEP * 1000;
  q.e.tick(C.STEP);
  if (q.app.dialogue) h.finish(q.app);
  q.app.missionTick(C.STEP);
  q.frames++;
  observe(q);
}
function waitAction(q) {
  assert(q.e.canAct(), 'Production player action is available');
  const u = q.e.active;
  q.responses.push({id:u.id, round:q.b.round, frame:q.frames, kind:'wait', x:u.x, y:u.y});
  q.e.wait();
  assert(u.acted || q.b.phase !== 'aim', 'Production wait accepts the actual player action');
  observe(q);
  return u.id;
}
function until(q, predicate, {drive=false, limit=14000} = {}) {
  for (let i=0; i<limit && !predicate(); i++) {
    assert(!['won', 'lost'].includes(q.b.phase), `Unexpected terminal ${q.b.phase} before lifecycle condition`);
    if (drive && q.e.canAct()) waitAction(q);
    tick(q);
  }
  assert(predicate(), `Production ticks reach condition at round ${q.b.round}, phase ${q.b.phase}`);
}
function warn(q, source) {
  q.app.missionTick(0);
  h.finish(q.app);
  q.app.missionTick(0);
  const w = warning(q, source);
  assert(w, `${source} receives its actual chapter warning`);
  assert(!w.opportunity);
  assert.equal(actors(q, source).length, 0, 'Warning alone never admits bodies');
  const exactCount = q.b.units.length;
  for (let i=0; i<5; i++) q.app.missionTick(0);
  assert.equal(q.b.units.length, exactCount, 'Repeated warning ticks are not a response opportunity');
  return w;
}
function spawnAction(q, source) {
  const at = q.b.honroStage11DefenseEntries[sources.indexOf(source)];
  return {type:'spawn', source, kind:'echo', n:3, x:at.x, y:at.y, spacing:130, maxDistance:450};
}
function rejectSyntheticEnemyBoundary(q, source) {
  const serial = q.b.honroState.actorTurnSerial || 0, boundary = q.app.actorBoundary;
  const count = q.b.units.length;
  // This deliberately synthetic negative probe proves that advancing a serial
  // alone is insufficient. It is restored before the actual wait input.
  q.b.honroState.actorTurnSerial = serial+1;
  q.app.actorBoundary = q.e.alive(1)[0].id;
  assert.equal(g.HonroAllies.execute(q.app, spawnAction(q, source)), false);
  assert(!warning(q, source).opportunity);
  assert.equal(q.b.units.length, count);
  q.b.honroState.actorTurnSerial = serial;
  q.app.actorBoundary = boundary;
}
async function snapshotContinue(q, label) {
  q.app.export();
  const exported = await h.exported(), saved = plain(exported.honroBattle);
  const app = h.load(exported);
  app.continue();
  snapshotEqual(app.engine.b, saved, label+' preserves the entire battle snapshot');
  const resumed = {...q, app, e:app.engine, b:app.engine.b};
  instrument(resumed);
  h.finish(app);
  resumed.continues = [...(q.continues || []), {label, battleSha256:hash(saved), exact:true}];
  return resumed;
}

// Both waves run consecutively, with no round, HP, enemy, AI or action injection.
{
  const q = fixture(), w = warn(q, sources[0]);
  rejectSyntheticEnemyBoundary(q, sources[0]);
  const actor = waitAction(q);
  until(q, () => actors(q, sources[0]).length === 3, {drive:true});
  assert.equal(w.opportunity.id, actor);
  until(q, () => sources.every(source => actors(q, source).length === 3), {drive:true});
  for (const [index, source] of sources.entries()) {
    const born = q.births.filter(u => u.source === source), at = q.b.honroStage11DefenseEntries[index];
    assert.equal(born.length, 3);
    assert.deepEqual(born.map(u => [u.x, u.y]), plain(at.members.map(m => [m.x, m.y])));
    assert.deepEqual(born.map(u => u.hp), [796, 796, 1234]);
    assert.equal(born.filter(u => u.elite).length, 1);
    assert(born.every(u => u.warning?.opportunity && u.entry.serial >= u.warning.opportunity.serial));
    assert(q.responses.some(r => r.id === born[0].warning.opportunity.id && r.round === born[0].warning.opportunity.round),
      'Every recorded opportunity is backed by an actual wait input');
  }
  until(q, () => q.conversions.length === 6, {drive:true});
  assert(q.conversions.every(u => u.round-u.bornRound === 2 && u.kind === 'picks'), 'Existing two-round tool possession is unchanged');
  assert.equal(A.memory(q.b).holds['hold-knots'].spawned, 6);
  assert.equal(q.births.length, 6);
  assert.equal(q.births.filter(u => u.elite).length, 2);
  const pressureRounds = Number(process.env.HONRO_STAGE11_ECHO_PRESSURE_ROUNDS || 0);
  if (pressureRounds) until(q, () => q.b.round >= 1+pressureRounds, {drive:true, limit:60000});
  const count = q.b.units.length;
  for (let i=0; i<5; i++) q.app.missionTick(0);
  assert.equal(q.b.units.length, count, 'Completed finite defense cannot emit another trio');
  rows.push({case:'both-waves-actual-waits-and-two-round-possession', setup:q.setup,
    notices:q.notices, responses:q.responses, births:q.births, conversions:q.conversions, queues:q.queues,
    pressureDiagnostic:{optionalExtraRounds:pressureRounds, endRound:q.b.round, shots:q.shots, damage:q.damage,
      scope:'Read-only observation in the same declared fixture; no effectiveness or quality pass criterion'}});
  for (const source of sources) console.log('OBSERVED echo pressure', JSON.stringify({source,
    round:q.b.round, shots:q.shots.filter(s => s.source === source).length,
    partyDamage:q.damage.filter(d => d.source === source && d.targetSide === 0)}));
  console.log('PASS Stage 11 both echo waves: real waits, exact low-air trios, HP/elites, two-round possession, cap 4');
}

// A single occupied advertised entry holds the whole trio. A stake on the last
// member also exercises spawnMembers' atomic reservation beyond the hero margin.
for (const [phase, source] of sources.entries()) for (const occupancy of ['hero', 'last-member-stake']) {
  let q = fixture({phase});
  const at = q.b.honroStage11DefenseEntries[phase];
  assert.equal(q.b.honroStage11DefenseAlternates.length, 0, 'No remote cleanup-lane alternate');
  const blocker = q.e.heroesAlive().find(u => u.cls === 'archer');
  const oldPose = plain({x:blocker.x, y:blocker.y, vx:blocker.vx, vy:blocker.vy});
  if (occupancy === 'hero') safePose(q, blocker, at.members.at(-1).x);
  else (q.b.stakes ??= []).push({id:'echo-lifecycle-fixture-stake', x:at.members.at(-1).x,
    y:at.members.at(-1).y, active:true, expires:1000});
  const w = warn(q, source), before = {count:q.b.units.length, nextId:q.b.nextId, counters:plain(q.b.honroCounters)};
  rejectSyntheticEnemyBoundary(q, source);
  const actor = waitAction(q);
  until(q, () => !!w.opportunity);
  assert.equal(w.opportunity.id, actor);
  assert.equal(actors(q, source).length, 0);
  assert.equal(q.b.units.length, before.count, 'Blocked entry creates no partial trio');
  assert.equal(q.b.nextId, before.nextId, 'Blocked entry does not consume IDs');
  assert.deepEqual(plain(q.b.honroCounters), before.counters, 'Blocked entry does not consume budget');
  assert.equal(A.memory(q.b).holds['hold-knots'].spawned, phase*3);
  assert(!A.memory(q.b).events[source]);
  assert(!entry(q, source));
  q = await snapshotContinue(q, source+' '+occupancy+' pending');
  const persistedWarning = plain(warning(q, source));
  q = await snapshotContinue(q, source+' '+occupancy+' pending repeated');
  assert.deepEqual(plain(warning(q, source)), persistedWarning, 'Repeated Continue preserves warning and actual opportunity');
  assert.equal(actors(q, source).length, 0);
  if (occupancy === 'hero') Object.assign(q.e.unit(blocker.id), oldPose);
  else q.b.stakes = q.b.stakes.filter(s => s.id !== 'echo-lifecycle-fixture-stake');
  if (!q.e.canAct()) until(q, () => q.e.canAct());
  waitAction(q);
  until(q, () => actors(q, source).length === 3, {drive:true});
  assert.equal(q.b.units.length, before.count+3);
  assert.equal(A.memory(q.b).holds['hold-knots'].spawned, phase*3+3);
  assert.equal(A.memory(q.b).events[source], true);
  assert.equal(entry(q, source).ids.length, 3);
  const ids = actors(q, source).map(u => u.id);
  for (let i=0; i<5; i++) q.app.missionTick(0);
  q = await snapshotContinue(q, source+' '+occupancy+' admitted');
  assert.deepEqual(actors(q, source).map(u => u.id), ids, 'Admission stays exactly once after repeated ticks/Continue');
  rows.push({case:'occupied-entry-atomic-full-continue-once', source, occupancy, setup:q.setup,
    warning:persistedWarning, continues:q.continues, entry:plain(entry(q, source)), ids});
  console.log('PASS Stage 11', source, occupancy, ': no partial spawn/budget loss, full Continue, unblock exactly once');
}

// Terminal/cancel fixtures use already offered, actually accepted opportunities.
// They change only the terminal condition; they do not forge a player action.
for (const [phase, source] of sources.entries()) for (const terminal of ['won', 'lost', 'app.done']) {
  const q = fixture({phase}), at = q.b.honroStage11DefenseEntries[phase];
  const blocker = q.e.heroesAlive().find(u => u.cls === 'archer');
  const oldPose = plain({x:blocker.x, y:blocker.y, vx:blocker.vx, vy:blocker.vy});
  safePose(q, blocker, at.members.at(-1).x);
  const w = warn(q, source);
  waitAction(q);
  until(q, () => !!w.opportunity);
  Object.assign(blocker, oldPose); // Remove the occupancy reason before testing cancellation.
  const before = {count:q.b.units.length, nextId:q.b.nextId, counters:plain(q.b.honroCounters)};
  if (terminal === 'app.done') q.app.done = true;
  else q.b.phase = terminal;
  q.app.actorBoundary = q.e.heroesAlive()[0].id;
  assert.equal(g.HonroAllies.execute(q.app, spawnAction(q, source)), false);
  q.app.missionTick(0);
  assert.equal(actors(q, source).length, 0);
  assert.equal(q.b.units.length, before.count);
  assert.equal(q.b.nextId, before.nextId);
  assert.deepEqual(plain(q.b.honroCounters), before.counters);
  assert.equal(A.memory(q.b).holds['hold-knots'].spawned, phase*3);
  rows.push({case:'pending-echo-terminal-admission-blocked', source, terminal, opportunity:plain(w.opportunity)});
  console.log('PASS Stage 11', source, ': pending admission blocked by', terminal);
}

// Legacy snapshots neither gain exact members nor have their battlefield
// rewritten. The saved metadata itself chooses the old runtime branch.
const frozen = JSON.parse(await readFile('tests/fixtures/stage11-ravine-draft-save.json', 'utf8'));
for (const name of ['initial', 'partial']) {
  const b = plain(frozen[name]), expected = plain(b), e = new C.Engine(b, () => {}, false);
  const app = {engine:e, stage:g.HONRO_CONTENT.stages[10], profile:plain(frozen.profile), training:false,
    done:false, event(){}, sayLines(){}, checkMission(){return false;}};
  for (let i=0; i<2; i++) {
    g.HonroStageRules.sanitizeStageBattle(b);
    g.HonroAllies.attach(app, e);
    g.HonroEncounters.attach(app, e);
    A.attach(app, e);
    snapshotEqual(b, expected, 'Frozen old Stage 11 '+name+' repeated mount');
  }
  assert(!D.active(b));
  assert(b.honroStage11DefenseEntries.every(at => !at.members));
  rows.push({case:'frozen-legacy-snapshot-exact', name, sourceCommit:frozen.sourceCommit, battleSha256:hash(expected)});
  console.log('PASS frozen old Stage 11', name, ': entire snapshot unchanged on repeated mount');
}
const spawnMembers = D.spawnMembers;
let legacyShape;
for (const spec of [{density:false, members:true}, {density:true, members:false}, {density:false, members:false}]) {
  let q = fixture(spec), exactCalls = 0;
  q = await snapshotContinue(q, 'legacy metadata fixture before input');
  D.spawnMembers = (...args) => { exactCalls++; return spawnMembers(...args); };
  try {
    q.app.missionTick(0);
    h.finish(q.app);
    q.app.missionTick(0);
    waitAction(q);
    until(q, () => actors(q, sources[0]).length === 3, {drive:true});
    assert.equal(exactCalls, 0, 'No-density or missing-members snapshots retain the legacy generator');
    assert.equal(actors(q, sources[0]).length, 3);
    assert.equal(actors(q, sources[0]).filter(u => u.elite).length, 1);
    const shape = plain(actors(q, sources[0]).map(u => ({x:u.spawnX, y:u.spawnY, hp:u.maxHp,
      elite:!!u.elite, armor:u.armor, baseHp:u.combatBaseHp, kind:u.honroVariant, loadout:u.loadout})));
    if (!legacyShape) legacyShape = shape;
    else assert.deepEqual(shape, legacyShape, 'Both compatibility fallbacks preserve legacy placement, stats and loadout');
    assert(actors(q, sources[0]).every(u => u.honroDensityBornRound === undefined));
    if (!spec.density) assert(!q.b.honroState.encounterDensity, 'Read-only observations do not add density state to old battles');
    assert(!entry(q, sources[0]).ids, 'Legacy entry representation is preserved');
    q = await snapshotContinue(q, 'legacy metadata fixture after wave');
    assert.equal(D.active(q.b), spec.density);
    assert.equal(Array.isArray(q.b.honroStage11DefenseEntries[0].members), spec.members);
    rows.push({case:'legacy-generator-gating', ...spec, exactCalls, continues:q.continues,
      entry:plain(entry(q, sources[0])), shape, births:q.births});
    console.log('PASS Stage 11 legacy branch:', JSON.stringify(spec), 'keeps generator and saved representation');
  } finally { D.spawnMembers = spawnMembers; }
}

await mkdir('_local/reports/encounter-density', {recursive:true});
await writeFile('_local/reports/encounter-density/stage11-density-echo-lifecycle.json', JSON.stringify({
  provenance,
  scope:'Explicit production App objective/pose/occupancy/terminal and legacy-save regressions. Initial 53 retained; real wait/actor-end/waves/export/Continue. Not normal arrival, fullplay, tactical effectiveness, visual, browser, performance or gameplay approval.',
  rows
}, null, 2)+'\n');
console.log('PASS Stage 11 echo lifecycle regression only; no gameplay/normal-arrival approval');
