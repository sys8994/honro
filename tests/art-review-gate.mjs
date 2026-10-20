/** Synthetic consistency tests only. Generated fixture pixels are NOT art evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {DEFAULT_CONFIG, sourceHash, checkArtReview} from '../tools/release/art-review.mjs';
import {prepareRelease} from '../tools/release/prepare.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const criterionIds = ['hierarchy', 'materials', 'grounding', 'readability', 'place'];
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'honro-art-review-'));
  for (const dir of ['game/docs/art-review', 'art/source', 'evidence']) await mkdir(path.join(root, dir), {recursive: true});
  const config = {version: 1, scope: 'synthetic-only', manifest: 'game/docs/art-review/manifest.json', sourcePaths: ['art/source'], stages: [1, 3], affectedStages: [18], criteria: criterionIds.map(id => ({id, description: 'Synthetic ' + id + ' criterion'}))};
  await writeFile(path.join(root, DEFAULT_CONFIG), JSON.stringify(config));
  await writeFile(path.join(root, 'art/source/terrain.js'), 'synthetic source bytes');
  const hash = await sourceHash(root);
  let serial = 0;
  async function image(name) {
    const file = 'evidence/' + name + '.png';
    const bytes = await sharp({create: {width: 16, height: 12, channels: 4, background: {r: ++serial * 13, g: 50, b: 100, alpha: 1}}}).png().toBuffer();
    await writeFile(path.join(root, file), bytes);
    return {path: file, sha256: sha(bytes)};
  }
  const reference = (await image('synthetic-reference')).path;
  const capture = async (stage, name) => ({stage, camera: {x: 100 + serial, y: 200, scale: .5}, viewport: {width: 16, height: 12}, screenshot: await image(name)});
  const verdict = (id, shot, status = 'pass') => ({id, status, evidence: 'Synthetic test assertion about a named visible surface only; no real art approval.', refs: [shot, reference]});
  const rounds = [];
  for (let i = 0; i < 5; i++) {
    const shot = await capture(i % 2 ? 3 : 1, 'round-' + i), reviewed = criterionIds.slice(0, i + 1);
    rounds.push({id: 'r' + (i + 1), sourceHash: hash, stages: [shot.stage], focusCriteria: [criterionIds[i]], changes: 'Synthetic camera correction and fresh capture for focused criterion ' + criterionIds[i], captures: [shot], criteria: reviewed.map(id => verdict(id, shot.screenshot.path)), regressions: reviewed.slice(0, -1).map(id => verdict(id, shot.screenshot.path))});
  }
  const finalCaptures = [rounds[4].captures[0], await capture(3, 'final-3'), await capture(18, 'final-18')];
  const final = {sourceHash: hash, stages: [1, 3, 18], captures: finalCaptures, criteria: criterionIds.map(id => verdict(id, finalCaptures[0].screenshot.path)), regressions: criterionIds.map(id => verdict(id, finalCaptures[0].screenshot.path)), unresolvedFailures: [], parentImageReview: {status: 'approved', reviewer: 'parent', sourceHash: hash, evidence: 'Synthetic parent review record for the final image; not a real approval.', refs: finalCaptures.map(c => c.screenshot.path)}};
  const manifest = {version: 1, scope: config.scope, rounds, final};
  const save = () => writeFile(path.join(root, config.manifest), JSON.stringify(manifest));
  await save();
  return {root, config, hash, manifest, save};
}
const using = fn => async () => {const f = await fixture(); try {await fn(f);} finally {await rm(f.root, {recursive: true, force: true});}};
async function blocked(f, pattern) {
  await f.save();
  const result = await checkArtReview({root: f.root});
  assert.equal(result.status, 'blocked');
  assert.equal(result.quality, 'not-automatically-assessed');
  assert.match(result.errors.join('\n'), pattern);
  let builds = 0;
  const prepared = await prepareRelease({root: f.root, runBuild: () => {builds++; return {status: 0};}});
  assert.equal(builds, 0, 'blocked evidence must never run the release build');
  assert.equal(prepared.build, 'not-run'); assert.equal(prepared.exitCode, 1);
}

test('focused subsets, cumulative regressions and separate final record satisfy consistency without automatic art approval', using(async f => {
  assert.equal(f.manifest.rounds.every(r => r.stages.length === 1), true);
  const result = await checkArtReview({root: f.root});
  assert.deepEqual(result.errors, []); assert.equal(result.status, 'records-consistent');
  assert.equal(result.quality, 'not-automatically-assessed'); assert.equal(result.approved, undefined);
  let builds = 0;
  const prepared = await prepareRelease({root: f.root, runBuild: () => {builds++; return {status: 0};}});
  assert.equal(builds, 1); assert.equal(prepared.exitCode, 0); assert.equal(prepared.build, 'completed');
  assert.equal((await prepareRelease({root: f.root, runBuild: () => ({status: 7})})).exitCode, 7);
}));
test('missing scope and manifest fail closed before any release build', using(async f => {
  await rm(path.join(f.root, DEFAULT_CONFIG));
  await blocked(f, /ENOENT/);
  await writeFile(path.join(f.root, DEFAULT_CONFIG), JSON.stringify(f.config));
  await rm(path.join(f.root, f.config.manifest));
  const result = await prepareRelease({root: f.root, runBuild: () => assert.fail('must not build')});
  assert.equal(result.status, 'blocked'); assert.match(result.errors[0], /ENOENT/);
}));
test('source bytes, added source files and scope criteria invalidate the final review, independently of Git SHA', using(async f => {
  await writeFile(path.join(f.root, 'art/source/terrain.js'), 'changed actual source bytes');
  await blocked(f, /Stale source/);
  await writeFile(path.join(f.root, 'art/source/terrain.js'), 'synthetic source bytes');
  await writeFile(path.join(f.root, 'art/source/new.js'), 'new source in configured directory');
  await blocked(f, /Stale source/);
  await rm(path.join(f.root, 'art/source/new.js'));
  f.config.criteria[0].description += ' changed';
  await writeFile(path.join(f.root, DEFAULT_CONFIG), JSON.stringify(f.config));
  await blocked(f, /Stale source/);
}));
test('manifest content never hashes itself even when its directory is a configured source', using(async f => {
  f.config.manifest = 'art/source/review.json';
  await writeFile(path.join(f.root, DEFAULT_CONFIG), JSON.stringify(f.config));
  const before = await sourceHash(f.root);
  await writeFile(path.join(f.root, f.config.manifest), '{"arbitrary":"manifest content"}');
  assert.equal(await sourceHash(f.root), before);
}));
test('fewer than five rounds, absent focus and missing previous-pass regression block release', using(async f => {
  const last = f.manifest.rounds.pop(); await blocked(f, /At least five/); f.manifest.rounds.push(last);
  f.manifest.rounds[4].focusCriteria = ['hierarchy']; await blocked(f, /Every configured criterion/);
  f.manifest.rounds[4].focusCriteria = ['place'];
  f.manifest.rounds[2].regressions.pop(); await blocked(f, /missing criterion or previous-pass regression/);
}));
test('unresolved final failures and disagreement with regression judgments block release', using(async f => {
  f.manifest.final.criteria[0].status = 'fail'; await blocked(f, /Unresolved fail/);
  f.manifest.final.criteria[0].status = 'pass'; f.manifest.final.unresolvedFailures.push('unfixed contact gap');
  await blocked(f, /Unresolved failures/); f.manifest.final.unresolvedFailures = [];
  f.manifest.rounds[1].regressions[0].status = 'fail'; await blocked(f, /verdict disagree/);
}));
test('an earlier failure can be corrected with later concrete pass and regression records', using(async f => {
  f.manifest.rounds[0].criteria[0].status = 'fail';
  f.manifest.rounds[1].changes = 'Synthetic correction of the first-round contact problem; new image captured.';
  await f.save(); assert.equal((await checkArtReview({root: f.root})).status, 'records-consistent');
}));
test('pending parent review, stale parent source and absent actual final image refs block release', using(async f => {
  f.manifest.final.parentImageReview.status = 'pending'; await blocked(f, /Parent final image review/);
  f.manifest.final.parentImageReview.status = 'approved'; f.manifest.final.parentImageReview.sourceHash = 'sha256:' + '0'.repeat(64);
  await blocked(f, /Parent final image review source hash is stale/);
  f.manifest.final.parentImageReview.sourceHash = f.hash; f.manifest.final.parentImageReview.refs = ['evidence/synthetic-reference.png'];
  await blocked(f, /reference actual final captures/);
}));
test('final needs every representative/affected stage and the same source as the last review', using(async f => {
  f.manifest.final.stages.pop(); await blocked(f, /all representative and affected/);
  f.manifest.final.stages.push(18); f.manifest.rounds[4].sourceHash = 'sha256:' + '1'.repeat(64);
  await blocked(f, /same final sourceHash/);
}));
test('missing image, changed bytes, disguised text, wrong viewport and detached evidence refs block release', using(async f => {
  const shot = f.manifest.rounds[0].captures[0].screenshot, absolute = path.join(f.root, shot.path), original = await readFile(absolute);
  await rm(absolute); await blocked(f, /ENOENT/);
  await writeFile(absolute, 'not an actual PNG'); shot.sha256 = sha(Buffer.from('not an actual PNG')); await blocked(f, /Not PNG\/WebP/);
  await writeFile(absolute, original); await blocked(f, /bytes\/hash mismatch/);
  shot.sha256 = sha(original); f.manifest.rounds[0].captures[0].viewport.width = 100; await blocked(f, /dimensions/);
  f.manifest.rounds[0].captures[0].viewport.width = 16; f.manifest.rounds[0].criteria[0].refs = ['evidence/synthetic-reference.png'];
  await blocked(f, /this review's actual screenshot/);
}));
test('copying an old screenshot or changing only its metadata cannot count as a new capture', using(async f => {
  const old = f.manifest.rounds[0].captures[0].screenshot, shot = f.manifest.rounds[1].captures[0].screenshot;
  const pixels = await readFile(path.join(f.root, old.path));
  await writeFile(path.join(f.root, shot.path), pixels); shot.sha256 = sha(pixels);
  await blocked(f, /repeated screenshot content\/pixels/);
  const differentBytes = await sharp(pixels).withMetadata({density: 96}).png().toBuffer();
  assert.notEqual(sha(differentBytes), sha(pixels));
  await writeFile(path.join(f.root, shot.path), differentBytes); shot.sha256 = sha(differentBytes);
  await blocked(f, /repeated screenshot content\/pixels/);
}));
test('package release entry invokes the gate then build while ordinary build stays unchanged', async () => {
  const root = path.resolve(import.meta.dirname, '..'), p = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(p.scripts.build, 'node workshop/build.mjs');
  assert.equal(p.scripts['prepare:release'], 'node tools/release/prepare.mjs');
  const source = await readFile(path.join(root, 'tools/release/prepare.mjs'), 'utf8');
  assert.match(source, /\['run', 'build'\]/);
});
