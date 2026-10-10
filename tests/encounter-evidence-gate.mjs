/** Synthetic manifest regression only. These files are never actual map/quality evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm, symlink} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileRef} from '../tools/intent-pipeline/review-job.mjs';
import {SCHEMA, CHECKS, inventory, template, reviewDigest, validateManifest} from '../tools/testing/encounter-evidence-gate.mjs';
const clone = o => JSON.parse(JSON.stringify(o));
const now = '2026-10-09T20:00:00Z';
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/rXcAAAAASUVORK5CYII=', 'base64');
const campaign = {stages: [{metadata: {stageId: 8}, units: [
  {id: 'front-1', team: 'enemy', encounterGroup: 'front'}, {id: 'front-2', team: 'enemy', encounterGroup: 'front'},
  {id: 'boss', team: 'enemy'}, {id: 'hero', team: 'player'},
], encounters: [{id: 'front', unitIds: ['front-1', 'front-2']}],
  events: [{id: 'seal-wave', action: {type: 'multi', actions: [{type: 'spawn', n: 3}]}}],
  initialState: {honroAct2Steps: [{id: 'hold', wave: {count: 2}}]},
}]};
const response = {actorId: 'hero', round: 4, kind: 'move', detail: 'Synthetic fixture: choose upper path after warning'};
const effect = {type: 'route', detail: 'Synthetic zero-damage route response', actionIndexes: [], responseIndexes: [0]};
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'honro-encounter-gate-'));
  await mkdir(path.join(root, 'shared/data'), {recursive: true});
  await mkdir(path.join(root, '_local/evidence'), {recursive: true});
  for (const [file, data] of [['shared/data/campaign.json', JSON.stringify(campaign)], ['HONRO.html', 'synthetic game'], ['HONRO_WORKSHOP.html', 'synthetic workshop']]) await writeFile(path.join(root, file), data);
  const manifest = await template(root, [8]);
  manifest.implementationAuthors = ['synthetic-implementer'];
  const add = async (name, data, kind = 'report') => {
    const relative = `_local/evidence/${name}`;
    await writeFile(path.join(root, relative), Buffer.isBuffer(data) || typeof data === 'string' ? data : JSON.stringify(data));
    manifest.evidence.push(await fileRef(root, relative, kind));
    return relative;
  };
  const raw = await add('raw.json', {synthetic: true, stageId: 8, actions: [response], sourceClusters: ['front', 'unit:boss'], sourceWaves: ['seal-wave', 'objective:hold']}, 'raw-trace');
  const before = await add('before.png', pixel, 'screenshot'), after = await add('after.png', pixel, 'screenshot');
  const context = {stageId: 8, sourceDigest: manifest.sourceDigest, targetDigest: manifest.targetDigest};
  const activity = {actions: [], playerResponses: [response], effects: [effect]};
  const packet = {schema: 'honro-encounter-observation/v1', ...context, observer: 'synthetic-observer', observedAt: now, method: 'native-input', rawEvidencePaths: [raw],
    clusters: manifest.stages[0].clusters.map(c => ({id: c.id, kind: 'cluster', status: 'observed', memberIds: c.memberIds, purpose: 'Synthetic gate test only', roleRelations: 'Synthetic support protects approach', emptySpacePurpose: 'Synthetic route option', supportIds: ['ground'], ...clone(activity)})),
    waves: manifest.stages[0].waves.map(w => ({id: w.id, kind: 'wave', status: 'observed', phases: [{id: `${w.id}-0`, spawnedIds: [`${w.id}-spawn-1`], trigger: {event: w.id, round: 3}, warningBoundary: 'hero-action-3', entry: {boundary: 'hero-action-4', round: 4, x: 100, y: 200}, firstEffect: {kind: 'player-response', index: 0}, ...clone(activity)}]})),
  };
  const observations = await add('observations.json', packet, 'observation');
  const camera = {x: 100, y: 200, zoom: 1, width: 1280, height: 720};
  const comparison = await add('comparison.json', {schema: 'honro-encounter-comparison/v1', ...context, baselineRevision: 'synthetic-baseline', views: [{id: 'front', beforePath: before, afterPath: after, beforeCamera: camera, afterCamera: camera}]});
  const play = await add('play.json', {schema: 'honro-encounter-normal-play/v1', ...context, observer: 'synthetic-observer', observedAt: now, method: 'native-input', debug: false, modifications: [], normalResources: true, completed: true, profile: {entryLevel: 7, skillAllocation: {A01: 1}, startingResources: {hp: 500}}, rawEvidencePaths: [raw]});
  const report = await add('independent-review.txt', 'Synthetic independent review fixture. No actual game approval.');
  const stage = manifest.stages[0];
  stage.clusters.forEach((c, i) => Object.assign(c, {status: 'observed', observation: {path: observations, pointer: `/clusters/${i}`}}));
  stage.waves.forEach((w, i) => Object.assign(w, {status: 'observed', observation: {path: observations, pointer: `/waves/${i}`}}));
  for (const key of CHECKS) stage.checks[key] = {status: 'observed', detail: 'Synthetic evidence linkage, no quality assertion', evidencePaths: [key === 'same-camera' ? comparison : key === 'normal-resource-play' ? play : raw]};
  manifest.review = {status: 'reviewed', conclusion: 'no-blocking-findings', reviewer: 'synthetic-independent-reviewer', reviewedAt: now, reviewDigest: reviewDigest(manifest), reportPaths: [report], unresolvedFindings: []};
  return {root, manifest, packet, raw, observations, comparison, play, before, after, report};
}
const using = fn => async () => { const f = await fixture(); try { await fn(f); } finally { await rm(f.root, {recursive: true, force: true}); } };
async function rewrite(f, p, change) {
  const packet = JSON.parse(await readFile(path.join(f.root, p), 'utf8'));
  change(packet);
  await writeFile(path.join(f.root, p), JSON.stringify(packet));
  Object.assign(f.manifest.evidence.find(e => e.path === p), await fileRef(f.root, p));
  f.manifest.review.reviewDigest = reviewDigest(f.manifest);
}
const blocked = async (f, pattern) => {
  const result = await validateManifest(f.root, f.manifest);
  assert.equal(result.status, 'blocked');
  assert.match(result.errors.join('\n'), pattern);
  assert.equal(result.quality, 'not-automatically-assessed');
};

test('source inventory includes source groups, ungrouped actors, nested spawn and defense objective IDs', () => {
  const row = inventory(campaign, [8])[0];
  assert.deepEqual(row.clusters.map(c => c.id), ['front', 'unit:boss']);
  assert.deepEqual(row.waves.map(w => w.id), ['seal-wave', 'objective:hold']);
  assert.throws(() => inventory(campaign, [8, 8]), /Unique/);
  assert.throws(() => inventory(campaign, [31]), /1–30/);
});
test('complete synthetic records do not claim quality approval and zero-damage evasion is valid evidence', using(async f => {
  const result = await validateManifest(f.root, f.manifest);
  assert.deepEqual(result.errors, []);
  assert.equal(result.status, 'evidence-records-complete');
  assert.equal(result.quality, 'not-automatically-assessed');
  assert.equal(result.approved, undefined);
}));
test('init keeps all map evidence and review explicitly pending', using(async f => {
  const m = await template(f.root, [8]);
  assert.equal(m.schema, SCHEMA); assert.equal(m.review.status, 'pending');
  assert(m.stages[0].waves.every(w => w.status === 'pending'));
  f.manifest = m; await blocked(f, /authors|required|Unverified|unverified/);
}));
test('deleting a source cluster or wave and inventing member IDs cannot complete', using(async f => {
  const removed = f.manifest.stages[0].clusters.pop(); await blocked(f, /source cluster ID/);
  f.manifest.stages[0].clusters.push(removed);
  f.manifest.stages[0].waves.pop(); await blocked(f, /wave event\/objective\/runtime ID/);
  f.manifest.stages[0].clusters[0].memberIds = ['invented']; await blocked(f, /member IDs/);
}));
test('generic prose or wrong-stage/ID observation cannot replace structured linked evidence', using(async f => {
  await rewrite(f, f.observations, p => { p.clusters[0].id = 'other-cluster'; });
  await blocked(f, /Observation ID/);
  await rewrite(f, f.observations, p => { p.stageId = 12; });
  await blocked(f, /stage\/source\/target mismatch/);
  f.manifest.stages[0].clusters[0].observation = {path: f.report, pointer: '/clusters/0'};
  await blocked(f, /JSON/);
}));
test('no tactical effect, ineffective state, and fabricated first-effect index are blocking', using(async f => {
  await rewrite(f, f.observations, p => { p.waves[0].phases[0].effects = []; });
  await blocked(f, /no observed tactical effect/);
  await rewrite(f, f.observations, p => { p.waves[1].status = 'ineffective'; });
  await blocked(f, /ineffective/);
  await rewrite(f, f.observations, p => { p.clusters[0].effects[0].responseIndexes = [99]; });
  await blocked(f, /index out of range/);
}));
test('same-boundary entry fails and first effect must point to an observed effect', using(async f => {
  await rewrite(f, f.observations, p => { p.waves[0].phases[0].entry.boundary = 'hero-action-3'; });
  await blocked(f, /Distinct warning/);
  await rewrite(f, f.observations, p => { p.waves[1].phases[0].firstEffect.index = 9; });
  await blocked(f, /First effective/);
}));
test('source edits, built target edits, missing files and changed bytes fail closed', using(async f => {
  await writeFile(path.join(f.root, f.raw), 'changed raw trace'); await blocked(f, /Evidence bytes changed/);
  await rm(path.join(f.root, f.before)); await blocked(f, /ENOENT/);
  await writeFile(path.join(f.root, 'HONRO.html'), 'changed html'); await blocked(f, /Stale source or built targets/);
  await writeFile(path.join(f.root, 'shared/new-source.js'), 'changed source'); await blocked(f, /Stale source or built targets/);
}));
test('camera mismatch and text disguised as a screenshot cannot complete', using(async f => {
  await rewrite(f, f.comparison, p => { p.views[0].afterCamera.zoom = 2; }); await blocked(f, /camera and viewport/);
  await writeFile(path.join(f.root, f.before), 'not an image');
  Object.assign(f.manifest.evidence.find(e => e.path === f.before), await fileRef(f.root, f.before, 'screenshot'));
  await blocked(f, /not PNG\/JPEG\/WebP/);
}));
test('debug, altered resources, unfinished play and missing raw trace cannot become normal play', using(async f => {
  for (const mutate of [p => { p.debug = true; }, p => { p.debug = false; p.modifications = ['injected HP']; }, p => { p.modifications = []; p.completed = false; }, p => { p.completed = true; p.normalResources = false; }]) {
    await rewrite(f, f.play, mutate); await blocked(f, /Normal completed UI input/);
  }
  await rewrite(f, f.play, p => { p.normalResources = true; p.rawEvidencePaths = []; }); await blocked(f, /raw trace/);
}));
test('independent reviewer, exact review digest and unresolved findings are mandatory', using(async f => {
  f.manifest.review.reviewer = 'synthetic-implementer'; await blocked(f, /Different reviewer/);
  f.manifest.review.reviewer = 'other'; f.manifest.stages[0].checks['tactical-quality'].detail = 'Changed after review'; await blocked(f, /exact manifest/);
  f.manifest.review.reviewDigest = reviewDigest(f.manifest); f.manifest.review.unresolvedFindings = ['ineffective wave']; await blocked(f, /unresolved findings/);
}));
test('open known failure blocks even with complete packet and reviewed report', using(async f => {
  f.manifest.knownFailures = [{id: 'no-pressure', status: 'open', detail: 'Known ineffective wave', retestEvidencePaths: [f.observations]}];
  f.manifest.review.reviewDigest = reviewDigest(f.manifest); await blocked(f, /remains open/);
  f.manifest.knownFailures[0].status = 'resolved'; f.manifest.review.reviewDigest = reviewDigest(f.manifest);
  await blocked(f, /naming its failure ID/);
  await rewrite(f, f.observations, p => { p.resolvedFailureIds = ['no-pressure']; });
  assert.equal((await validateManifest(f.root, f.manifest)).status, 'evidence-records-complete');
}));
test('symlink and checkout traversal references are rejected', using(async f => {
  await symlink(path.join(f.root, f.raw), path.join(f.root, '_local/evidence/link.json'));
  f.manifest.evidence.push({...f.manifest.evidence.find(e => e.path === f.raw), path: '_local/evidence/link.json'});
  await blocked(f, /symlink rejected/);
  f.manifest.evidence.push({...f.manifest.evidence.find(e => e.path === f.raw), path: '../outside.json'}); await blocked(f, /outside checkout/);
}));
test('runtime-only waves must name real source files and receive their own observation', using(async f => {
  f.manifest.stages[0].runtimeWaves = [{id: 'runtime-wave', sourcePaths: [f.raw]}]; await blocked(f, /actual runtime\/generator source/);
}));

test('impossible wave timing and empty normal-resource profile are rejected', using(async f => {
  await rewrite(f, f.observations, p => { p.waves[0].phases[0].playerResponses[0].round = 1; });
  await blocked(f, /response before trigger/);
  await rewrite(f, f.observations, p => { const phase = p.waves[1].phases[0]; phase.actions = [{actorId: phase.spawnedIds[0], round: 1, kind: 'wait', x: 10, y: 20, targetId: null}]; });
  await blocked(f, /action before entry/);
  await rewrite(f, f.play, p => { p.profile.skillAllocation = {}; });
  await blocked(f, /legal skill allocation and starting resources/);
}));

test('action and response actor IDs are bound to actual source members or the recorded spawned phase', using(async f => {
  await rewrite(f, f.observations, p => { p.clusters[0].actions = [{actorId: 'invented-enemy', round: 4, kind: 'attack', x: 10, y: 20, targetId: 'hero'}]; });
  await blocked(f, /not a member of this cluster\/spawn phase/);
  await rewrite(f, f.observations, p => { p.clusters[0].actions = []; p.clusters[0].playerResponses[0].actorId = 'invented-hero'; });
  await blocked(f, /not a current source party member/);
  await rewrite(f, f.observations, p => { p.waves[0].phases[0].actions = [{actorId: 'wrong-wave-enemy', round: 4, kind: 'attack', x: 10, y: 20, targetId: 'hero'}]; });
  await blocked(f, /not a member of this cluster\/spawn phase/);
}));
