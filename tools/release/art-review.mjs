/** Evidence consistency only: this gate cannot judge pixels or grant art approval.
 * CLI: node tools/release/art-review.mjs hash|check [--config relative/path.json]
 * See tests/art-review-gate.mjs for a complete synthetic schema example.
 */
import {createHash} from 'node:crypto';
import {readFile, readdir, lstat, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

export const DEFAULT_CONFIG = 'game/docs/art-review/current.json';
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const text = value => typeof value === 'string' && value.trim().length > 0;
const need = (condition, message) => { if (!condition) throw Error(message); };
const digest = value => /^sha256:[a-f0-9]{64}$/.test(value || '');
const unique = rows => new Set(rows).size === rows.length;
const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
function relative(file) {
  need(text(file) && !path.isAbsolute(file) && !file.includes('\\') && file.split('/').every(p => p && p !== '.' && p !== '..'), `Repository-relative path required: ${file}`);
  return file;
}
async function local(root, file) {
  const absolute = path.resolve(root, relative(file)), resolved = await realpath(absolute);
  need(resolved === absolute && (await realpath(root)) === path.resolve(root), `Symlink paths are not evidence/source: ${file}`);
  return absolute;
}
async function json(root, file) { return JSON.parse(await readFile(await local(root, file), 'utf8')); }
function stages(value, label) {
  need(Array.isArray(value) && value.length > 0 && unique(value) && value.every(n => Number.isInteger(n) && n >= 1 && n <= 30), `${label}: unique stages 1–30 required`);
  return value;
}
export async function loadScope(root = ROOT, configPath = DEFAULT_CONFIG) {
  const config = await json(root, configPath);
  need(config.version === 1 && text(config.scope), 'Art scope version/name required');
  relative(config.manifest);
  need(config.manifest !== configPath, 'Manifest cannot be the scope config');
  need(Array.isArray(config.sourcePaths) && config.sourcePaths.length > 0 && unique(config.sourcePaths), 'Explicit unique art sourcePaths required');
  config.sourcePaths.forEach(relative);
  need(!config.sourcePaths.includes(config.manifest), 'Manifest self-reference cannot be a sourcePath');
  stages(config.stages, 'Scope');
  if (config.affectedStages !== undefined) stages(config.affectedStages, 'Affected scope');
  need(Array.isArray(config.criteria) && config.criteria.length > 0 && config.criteria.every(c => text(c.id) && text(c.description)) && unique(config.criteria.map(c => c.id)), 'Named unique art criteria with descriptions required');
  return config;
}
/** Framed relative names plus exact bytes, including scope criteria/config.
 * No Git revision or generated manifest bytes participate in the digest. */
export async function sourceHash(root = ROOT, configPath = DEFAULT_CONFIG, config = null) {
  config ||= await loadScope(root, configPath);
  const files = new Set();
  async function walk(file) {
    if (file === config.manifest || file === configPath) return;
    const absolute = await local(root, file), stat = await lstat(absolute);
    if (stat.isDirectory()) {
      for (const name of (await readdir(absolute)).sort()) await walk(file + '/' + name);
    } else { need(stat.isFile(), `Regular art source required: ${file}`); files.add(file); }
  }
  for (const file of config.sourcePaths) await walk(file);
  need(files.size > 0, 'Art sourcePaths contain no source files');
  const hash = createHash('sha256');
  for (const file of [configPath, ...[...files].sort()]) {
    const bytes = await readFile(await local(root, file));
    hash.update(JSON.stringify([file, bytes.length]) + '\n'); hash.update(bytes); hash.update('\n');
  }
  return 'sha256:' + hash.digest('hex');
}
async function imageRecord(root, file) {
  need(/\.(png|webp)$/i.test(relative(file)), `Original PNG/WebP required: ${file}`);
  const bytes = await readFile(await local(root, file));
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  need(png || webp, `Not PNG/WebP image bytes: ${file}`);
  const decoder = sharp(bytes, {limitInputPixels: 100000000}), metadata = await decoder.metadata();
  need(metadata.pages === undefined || metadata.pages === 1, `Still screenshot required: ${file}`);
  const {data, info} = await decoder.ensureAlpha().raw().toBuffer({resolveWithObject: true});
  return {sha256: sha(bytes), pixels: sha(Buffer.concat([Buffer.from(`${info.width}:${info.height}:`), data])), width: info.width, height: info.height};
}
export async function checkArtReview({root = ROOT, configPath = DEFAULT_CONFIG} = {}) {
  const errors = [];
  try {
    const config = await loadScope(root, configPath), currentHash = await sourceHash(root, configPath, config);
    const manifest = await json(root, config.manifest), ids = config.criteria.map(c => c.id);
    const allowedStages = [...new Set([...config.stages, ...(config.affectedStages || [])])];
    need(manifest.version === 1 && manifest.scope === config.scope, 'Manifest version/scope mismatch');
    need(Array.isArray(manifest.rounds) && manifest.rounds.length >= 5, 'At least five actual candidate capture/review rounds required');
    need(unique(manifest.rounds.map(r => r.id)) && manifest.rounds.every(r => text(r.id)), 'Unique round IDs required');
    const images = new Map(), usedBytes = new Set(), usedPixels = new Set(), capturesByPath = new Map();
    const observed = new Set(), previousPasses = new Set();
    const getImage = async file => { if (!images.has(file)) images.set(file, await imageRecord(root, file)); return images.get(file); };
    async function evidence(row, label) {
      need(text(row.evidence) && row.evidence.trim().length >= 20, `${label}: concrete pixel evidence required`);
      need(Array.isArray(row.refs) && row.refs.length > 0 && unique(row.refs), `${label}: image refs required`);
      for (const ref of row.refs) await getImage(ref);
    }
    async function results(rows, required, label) {
      need(Array.isArray(rows) && unique(rows.map(r => r.id)), `${label}: unique criterion records required`);
      need(required.every(id => rows.some(r => r.id === id)), `${label}: missing criterion or previous-pass regression`);
      for (const row of rows) {
        need(ids.includes(row.id) && ['pass', 'fail'].includes(row.status), `${label}: unknown criterion/status`);
        await evidence(row, `${label}/${row.id}`);
      }
    }
    async function captures(record, label, final = false) {
      stages(record.stages, label);
      need(record.stages.every(s => allowedStages.includes(s)), `${label}: stage outside configured scope`);
      need(Array.isArray(record.captures) && record.captures.length > 0, `${label}: actual captures required`);
      need(record.stages.every(s => record.captures.some(c => c.stage === s)), `${label}: missing stage capture`);
      for (const capture of record.captures) {
        need(record.stages.includes(capture.stage), `${label}: capture stage mismatch`);
        const camera = capture.camera, viewport = capture.viewport, shot = capture.screenshot;
        need(camera && Number.isFinite(camera.x) && Number.isFinite(camera.y) && Number.isFinite(camera.scale) && camera.scale > 0, `${label}: camera x/y/scale required`);
        need(viewport && ['width', 'height'].every(k => Number.isInteger(viewport[k]) && viewport[k] > 0) && Number.isFinite(viewport.pixelRatio ?? 1) && (viewport.pixelRatio ?? 1) > 0, `${label}: viewport width/height/pixelRatio required`);
        need(shot && /^[a-f0-9]{64}$/.test(shot.sha256 || ''), `${label}: screenshot sha256 required`);
        const actual = await getImage(shot.path);
        need(actual.sha256 === shot.sha256, `${label}: screenshot bytes/hash mismatch ${shot.path}`);
        need(actual.width === Math.round(viewport.width * (viewport.pixelRatio ?? 1)) && actual.height === Math.round(viewport.height * (viewport.pixelRatio ?? 1)), `${label}: screenshot dimensions do not match viewport ${shot.path}`);
        if (final && capturesByPath.has(shot.path)) {
          need(capturesByPath.get(shot.path) === record.sourceHash, `${label}: screenshot reused from a different sourceHash`);
        } else {
          need(!usedBytes.has(actual.sha256) && !usedPixels.has(actual.pixels), `${label}: repeated screenshot content/pixels; a new original capture is required`);
          usedBytes.add(actual.sha256); usedPixels.add(actual.pixels);
          capturesByPath.set(shot.path, record.sourceHash);
        }
      }
      const shotPaths = record.captures.map(c => c.screenshot.path);
      for (const row of [...(record.criteria || []), ...(record.regressions || [])]) {
        need(row.refs?.some(ref => shotPaths.includes(ref)), `${label}/${row.id}: evidence must reference this review's actual screenshot`);
      }
    }
    for (const round of manifest.rounds) {
      const label = `Round ${round.id}`;
      need(digest(round.sourceHash), `${label}: source content hash required`);
      need(text(round.changes), `${label}: correction/initial candidate description required`);
      need(Array.isArray(round.focusCriteria) && round.focusCriteria.length > 0 && unique(round.focusCriteria) && round.focusCriteria.every(id => ids.includes(id)), `${label}: focusCriteria required`);
      await results(round.criteria, [...new Set([...round.focusCriteria, ...previousPasses])], label);
      await results(round.regressions, [...previousPasses], `${label} regressions`);
      for (const row of round.regressions) need(round.criteria.some(c => c.id === row.id && c.status === row.status), `${label}: regression and criterion verdict disagree`);
      await captures(round, label);
      round.focusCriteria.forEach(id => observed.add(id));
      round.criteria.filter(c => c.status === 'pass').forEach(c => previousPasses.add(c.id));
    }
    need(ids.every(id => observed.has(id)), 'Every configured criterion must be a focus in the five-or-more review rounds');
    const final = manifest.final;
    need(final && final.sourceHash === currentHash, `Stale source: final must match current source content hash ${currentHash}`);
    need(final.sourceHash === manifest.rounds.at(-1).sourceHash, 'Final and last candidate review must use the same final sourceHash');
    need(sameSet(stages(final.stages, 'Final'), allowedStages), 'Final captures must cover all representative and affected scope stages');
    await results(final.criteria, ids, 'Final');
    await results(final.regressions, [...previousPasses], 'Final regressions');
    need(final.criteria.every(c => c.status === 'pass') && final.regressions.every(c => c.status === 'pass'), 'Unresolved fail: final criteria/regressions must all pass');
    need(Array.isArray(final.unresolvedFailures) && final.unresolvedFailures.length === 0, 'Unresolved failures must be zero');
    await captures(final, 'Final', true);
    const parent = final.parentImageReview;
    need(parent?.status === 'approved' && parent.reviewer === 'parent', 'Parent final image review is pending/missing; release remains blocked');
    need(parent.sourceHash === currentHash, 'Parent final image review source hash is stale');
    await evidence(parent, 'Parent final image review');
    need(parent.refs.some(ref => final.captures.some(c => c.screenshot.path === ref)), 'Parent final image review must reference actual final captures');
    return {status: 'records-consistent', quality: 'not-automatically-assessed', scope: config.scope, sourceHash: currentHash, rounds: manifest.rounds.length, errors};
  } catch (error) { errors.push(error.message); return {status: 'blocked', quality: 'not-automatically-assessed', errors}; }
}
export async function main(args = process.argv.slice(2)) {
  const [command = 'check', ...flags] = args;
  need(flags.length === 0 || flags.length === 2 && flags[0] === '--config', 'Usage: art-review.mjs hash|check [--config repository-relative.json]');
  const configPath = flags[1] || DEFAULT_CONFIG;
  if (command === 'hash') { console.log(await sourceHash(ROOT, configPath)); return 0; }
  need(command === 'check', 'Expected hash or check command');
  const result = await checkArtReview({configPath}); console.log(JSON.stringify(result, null, 2));
  return result.status === 'blocked' ? 1 : 0;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = await main(); } catch (error) { console.error(`Art review blocked: ${error.message}`); process.exitCode = 1; }
}
