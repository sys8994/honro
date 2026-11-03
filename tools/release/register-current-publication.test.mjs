import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm, readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {registerCurrentPublication, gitBlobSha} from './register-current-publication.mjs';
import {graphSha256} from '../../shared/web-retention.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const encode = value => JSON.stringify(value, null, 2) + '\n';
const sourceSha = 'e'.repeat(40);
const publishedAt = '2026-11-03T14:50:11Z';
const evidence = 'https://github.com/sys8994/honro/actions/runs/41657268203';
const now = Date.parse('2026-11-03T23:00:00Z');
async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'honro-publication-test-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  const make = async (name, text) => {
    const bytes = Buffer.from(text), file = {path: `web/runtime/${name}.js`, bytes: bytes.length, sha256: hash(bytes)};
    await mkdir(path.dirname(path.join(root, file.path)), {recursive: true});
    await writeFile(path.join(root, file.path), bytes); return file;
  };
  const active = await make('active', 'active runtime'), older = await make('older', 'old published runtime');
  const intermediate = await make('intermediate', 'unpublished runtime');
  const old = {sourceSha: 'a'.repeat(40), publishedAt: '2026-10-01T00:00:00Z', publishedAtPrecision: 'instant',
    publicationOrder: 0, evidence: 'https://github.com/sys8994/honro/actions/runs/1', graphSha256: graphSha256([older]), files: [older], preservedExtra: {note: 'Do not rewrite'}};
  const manifest = {version: 1, files: [active], previousFiles: [older, intermediate], previousGenerations: [[intermediate]],
    publishedGenerations: [old], publishedRetention: {version: 2, windowDays: 7, minGraphs: 2}, custom: {nested: ['keep', {value: 7}]}};
  const manifestFile = path.join(root, 'web/manifest.json'), sourceManifest = path.join(root, 'source-manifest.json');
  const sourceBytes = Buffer.from(encode(manifest));
  await writeFile(manifestFile, sourceBytes); await writeFile(sourceManifest, sourceBytes);
  return {root, manifestFile, sourceManifest, manifest, active, older, intermediate,
    options: {root, sourceManifest, expectedBlobSha: gitBlobSha(sourceBytes), sourceSha, publishedAt, evidence, now}};
}
async function unchangedFailure(f, pattern) {
  const before = await readFile(f.manifestFile);
  await assert.rejects(registerCurrentPublication(f.options), pattern);
  assert.deepEqual(await readFile(f.manifestFile), before, 'Failure must not alter the manifest');
  assert.deepEqual((await readdir(path.join(f.root, 'web'))).filter(n => n.includes('.publication-')), [], 'No temporary files remain');
}
test('Git blob pin uses Git header, not raw SHA1', () => {
  assert.equal(gitBlobSha(Buffer.from('test content\n')), 'd670460b4b4aece5915caf5c68d12f560a9fe3e4');
});
test('appends exactly one attested graph, preserves all old fields, and replay is a byte-for-byte no-op', async t => {
  const f = await fixture(t), result = await registerCurrentPublication(f.options);
  assert.equal(result.changed, true); assert.equal(result.verifiedFiles, 3);
  const afterBytes = await readFile(f.manifestFile), after = JSON.parse(afterBytes);
  assert.deepEqual({...after, publishedGenerations: f.manifest.publishedGenerations}, f.manifest);
  assert.deepEqual(after.publishedGenerations.slice(0, -1), f.manifest.publishedGenerations);
  assert.equal(after.publishedGenerations.length, 2);
  assert.deepEqual(after.publishedGenerations.at(-1), {sourceSha, publishedAt, publishedAtPrecision: 'instant', publicationOrder: 0,
    evidence, graphSha256: graphSha256(f.manifest.files), files: f.manifest.files});
  assert.equal((await registerCurrentPublication(f.options)).changed, false);
  assert.deepEqual(await readFile(f.manifestFile), afterBytes);
});
test('source manifest blob mismatch fails before writing', async t => {
  const f = await fixture(t); await writeFile(f.sourceManifest, 'tampered source');
  await unchangedFailure(f, /Git blob SHA mismatch/);
});
test('source/current active files mismatch fails without rewriting', async t => {
  const f = await fixture(t); f.manifest.files = [f.intermediate]; await writeFile(f.manifestFile, encode(f.manifest));
  await unchangedFailure(f, /active files differ/);
});
test('missing retained publication asset fails without any fetch or restoration', async t => {
  const f = await fixture(t); await rm(path.join(f.root, f.older.path)); await unchangedFailure(f, /ENOENT/);
});
test('changed retained publication bytes fail with identical manifest', async t => {
  const f = await fixture(t); await writeFile(path.join(f.root, f.older.path), 'X'.repeat(f.older.bytes));
  await unchangedFailure(f, /immutable asset mismatch/);
});
test('changed active bytes fail with identical manifest', async t => {
  const f = await fixture(t); await writeFile(path.join(f.root, f.active.path), 'corrupt');
  await unchangedFailure(f, /immutable asset mismatch/);
});
test('changed intermediate bytes fail with identical manifest', async t => {
  const f = await fixture(t); await writeFile(path.join(f.root, f.intermediate.path), 'corrupt');
  await unchangedFailure(f, /immutable asset mismatch/);
});
test('conflicting metadata for the same immutable path fails', async t => {
  const f = await fixture(t); f.manifest.previousFiles.push({...f.active, sha256: '0'.repeat(64)});
  await writeFile(f.manifestFile, encode(f.manifest)); await unchangedFailure(f, /metadata collision/);
});
test('invalid existing graph hash fails without discarding history', async t => {
  const f = await fixture(t); f.manifest.publishedGenerations[0].graphSha256 = '0'.repeat(64);
  await writeFile(f.manifestFile, encode(f.manifest)); await unchangedFailure(f, /Unverified published graph metadata/);
});
test('unsafe retained asset path fails before reading it', async t => {
  const f = await fixture(t); f.manifest.previousFiles.push({...f.active, path: '../outside.js'});
  await writeFile(f.manifestFile, encode(f.manifest)); await unchangedFailure(f, /Invalid immutable asset/);
});
test('future or absent publication timestamps fail', async t => {
  const f = await fixture(t); f.options.publishedAt = '2026-11-04T00:00:00Z'; await unchangedFailure(f, /future/);
  delete f.options.publishedAt; await unchangedFailure(f, /timestamp/);
});
test('same graph with different source facts cannot replace an existing record', async t => {
  const f = await fixture(t); await registerCurrentPublication(f.options); f.options.sourceSha = 'f'.repeat(40);
  await unchangedFailure(f, /Conflicting publication facts/);
});
test('same source with a different graph cannot replace an existing record', async t => {
  const f = await fixture(t); f.manifest.publishedGenerations[0].sourceSha = sourceSha;
  await writeFile(f.manifestFile, encode(f.manifest)); await unchangedFailure(f, /Conflicting publication facts/);
});
test('same graph with changed publication time or evidence cannot refresh history', async t => {
  const f = await fixture(t); await registerCurrentPublication(f.options);
  f.options.publishedAt = '2026-11-03T14:50:12Z'; await unchangedFailure(f, /Conflicting publication facts/);
  f.options.publishedAt = publishedAt; f.options.evidence = 'https://github.com/sys8994/honro/actions/runs/2';
  await unchangedFailure(f, /Conflicting publication facts/);
});
test('idempotent replay still verifies retained bytes', async t => {
  const f = await fixture(t); await registerCurrentPublication(f.options);
  await writeFile(path.join(f.root, f.older.path), 'corrupt'); await unchangedFailure(f, /immutable asset mismatch/);
});
test('short source or blob SHA and non-HTTPS evidence are rejected', async t => {
  const f = await fixture(t); f.options.sourceSha = 'eeeeeee'; await unchangedFailure(f, /Full source Git SHA/);
  f.options.sourceSha = sourceSha; f.options.expectedBlobSha = 'eeeeeee'; await unchangedFailure(f, /Git blob SHA required/);
  f.options.expectedBlobSha = gitBlobSha(await readFile(f.sourceManifest)); f.options.evidence = 'unverified';
  await unchangedFailure(f, /HTTPS publication evidence/);
});
