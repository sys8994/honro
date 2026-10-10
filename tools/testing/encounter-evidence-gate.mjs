/** Evidence completeness only. No gameplay-quality verdict, approvals or remote writes. */
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
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
    return {stageId, clusters: [...groups].map(([id, memberIds]) => ({id, memberIds})), waves};
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
function activity(row, label) {
  need(Array.isArray(row.actions) && Array.isArray(row.playerResponses), `${label}: actions/playerResponses arrays required`);
  for (const a of row.actions) need(text(a.actorId) && Number.isInteger(a.round) && a.round >= 0 && text(a.kind) && Number.isFinite(a.x) && Number.isFinite(a.y) && Object.hasOwn(a, 'targetId') && (a.targetId === null || text(a.targetId)), `${label}: real actor/round/action/position/target fields required`);
  for (const r of row.playerResponses) need(text(r.actorId) && Number.isInteger(r.round) && r.round >= 0 && text(r.kind) && text(r.detail), `${label}: player response actor/round/kind/detail required`);
  need(nonempty(row.effects), `${label}: no observed tactical effect; damage is not mandatory, empty effect is blocking`);
  for (const e of row.effects) {
    need(EFFECTS.has(e.type) && text(e.detail), `${label}: observed effect category/detail required`);
    need(Array.isArray(e.actionIndexes) && Array.isArray(e.responseIndexes), `${label}: effect must reference actions/responses`);
    need(e.actionIndexes.length + e.responseIndexes.length > 0, `${label}: effect has no actual observation reference`);
    need(e.actionIndexes.every(i => Number.isInteger(i) && i >= 0 && i < row.actions.length) && e.responseIndexes.every(i => Number.isInteger(i) && i >= 0 && i < row.playerResponses.length), `${label}: effect observation index out of range`);
  }
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
      activity(row, c.id);
    });
    for (const wave of stage.waves || []) await guard(`stage ${source.stageId} wave ${wave.id}`, async () => {
      need(wave.status === 'observed', 'Unverified wave');
      const row = observation(wave.observation, stage.stageId, 'wave', wave.id);
      need(nonempty(row.phases) && new Set(row.phases.map(p => p.id)).size === row.phases.length, 'Individual phase IDs required');
      for (const phase of row.phases) {
        need(text(phase.id) && text(phase.trigger?.event) && Number.isInteger(phase.trigger?.round), 'Trigger event/round required');
        need(text(phase.warningBoundary) && text(phase.entry?.boundary) && phase.warningBoundary !== phase.entry.boundary, 'Distinct warning and entry action boundaries required');
        need(Number.isInteger(phase.entry?.round) && phase.entry.round >= phase.trigger.round && Number.isFinite(phase.entry?.x) && Number.isFinite(phase.entry?.y), 'Actual entry round/coordinates required');
        activity(phase, `${wave.id}/${phase.id}`);
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
        need(Number.isInteger(packet.profile?.entryLevel) && packet.profile.entryLevel > 0 && packet.profile?.skillAllocation && packet.profile?.startingResources, 'Actual entry level, legal skill allocation and starting resources required');
        paths(packet.rawEvidencePaths, 'Normal-input raw trace');
        need(!packet.rawEvidencePaths.some(p => row.evidencePaths.includes(p) && jsonSchema(p) === 'honro-encounter-normal-play/v1'), 'Play envelope cannot be its own raw trace');
      }
    });
  }
  function jsonSchema(p) { try { return json(p).schema; } catch { return null; } }
  for (const failure of manifest?.knownFailures || []) await guard(`known failure ${failure.id}`, async () => {
    need(text(failure.id) && text(failure.detail) && failure.status === 'resolved', 'Known failure remains open or unverified');
    paths(failure.retestEvidencePaths, 'Current failure retest');
    need(failure.retestEvidencePaths.some(p => { let packet; try { packet = json(p); } catch { return false; } return packet.sourceDigest === manifest.sourceDigest && packet.targetDigest === manifest.targetDigest; }), 'Known failure needs current-target retest packet');
  });
  await guard('independent review', async () => {
    const r = manifest.review;
    need(r?.status === 'reviewed' && r.conclusion === 'no-blocking-findings' && text(r.reviewer) && !manifest.implementationAuthors?.some(a => a.trim().toLowerCase() === r.reviewer.trim().toLowerCase()) && validTime(r.reviewedAt), 'Different reviewer and actual review time required');
    need(r.reviewDigest === reviewDigest(manifest), 'Independent review must bind exact manifest/evidence bytes');
    paths(r.reportPaths, 'Independent review report');
    need(Array.isArray(r.unresolvedFindings) && r.unresolvedFindings.length === 0, 'Independent review has unresolved findings');
  });
  return {schema: SCHEMA, status: errors.length ? 'blocked' : 'evidence-records-complete', quality: 'not-automatically-assessed', sourceDigest: current?.sourceDigest ?? null, targetDigest: current?.targetDigest ?? null, reviewDigest: reviewDigest(manifest), errors,
    limits: ['File hashes and schemas do not prove truthful observations, reviewer identity or design quality.', 'Runtime-only wave/phase completeness and actual tactical/visual quality require independent source and evidence review.', 'This gate does not replace verify, browser/performance checks, final approval or Pages verification.']};
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
