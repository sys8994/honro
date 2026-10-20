/** Evidence consistency only: this gate cannot judge pixels or grant art approval.
 * CLI: node tools/release/art-review.mjs hash|check [--config relative/path.json]
 * See tests/art-review-gate.mjs for a complete synthetic schema example.
 */
import {createHash} from 'node:crypto';
import {readFile, readdir, lstat, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {verifySourceState} from './art-review-provenance.mjs';

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
  need(Array.isArray(config.finalCriteria) && config.finalCriteria.length >= 2 && config.finalCriteria.every(c => text(c.id) && text(c.description)) && unique(config.finalCriteria.map(c => c.id)) && config.finalCriteria.every(c => !config.criteria.some(q => q.id === c.id)), 'Separate holistic final criteria required');
  need(config.requiredViews && ['normal','wide','mobile'].every(v => config.requiredViews.representative?.includes(v)) && config.requiredViews.affected?.includes('overview'), 'Normal/wide/mobile and affected overview coverage required');
  if(config.restStages?.length)stages(config.restStages,'Related rest scenes');
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
// The gate validates recorded relationships. It cannot prove a human opened
// a picture, authenticate their taste, or independently grant aesthetic approval.
const normalizedText = value => value.normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
const captureCore = (c, sourceHash=c.sourceHash) => ({id:c.id,stage:c.stage,view:c.view,sourceHash,camera:c.camera,viewport:c.viewport,screenshot:c.screenshot});
export async function checkArtReview({root = ROOT, configPath = DEFAULT_CONFIG} = {}) {
 const errors=[];
 try {
  const config=await loadScope(root,configPath),currentHash=await sourceHash(root,configPath,config),manifest=await json(root,config.manifest),ids=config.criteria.map(c=>c.id),holisticIds=config.finalCriteria.map(c=>c.id),allowedStages=[...new Set([...config.stages,...(config.affectedStages||[])])];
  need(manifest.version===1&&manifest.scope===config.scope,'Manifest version/scope mismatch');
  need(Array.isArray(manifest.rounds)&&manifest.rounds.length>=5,'At least five actual candidate capture/review rounds required');
  need(unique(manifest.rounds.map(r=>r.id))&&manifest.rounds.every(r=>text(r.id)),'Unique round IDs required');
  const images=new Map(),origins=new Map(),usedBytes=new Map(),usedPixels=new Map(),observed=new Set(),previousPasses=new Set(),openFailures=new Map(),failures=new Map(),priorTexts=new Set();
  const getImage=async file=>{if(!images.has(file))images.set(file,await imageRecord(root,file));return images.get(file);};
  async function evidence(row,label,{distinctFrom=null}={}){
   need(text(row.evidence)&&row.evidence.trim().length>=20,`${label}: concrete pixel evidence required`);
   if(distinctFrom)need(!distinctFrom.has(normalizedText(row.evidence)),`${label}: copied earlier review text cannot replace a separate judgment`);
   need(Array.isArray(row.refs)&&row.refs.length>0&&unique(row.refs),`${label}: image refs required`);for(const ref of row.refs)await getImage(ref);
  }
  async function results(rows,required,label,validIds=ids,distinctFrom=null){
   need(Array.isArray(rows)&&unique(rows.map(r=>r.id)),`${label}: unique criterion records required`);
   need(required.every(id=>rows.some(r=>r.id===id)),`${label}: missing criterion or previous-pass regression`);
   for(const row of rows){need(validIds.includes(row.id)&&['pass','fail'].includes(row.status),`${label}: unknown criterion/status`);await evidence(row,`${label}/${row.id}`,{distinctFrom});if(distinctFrom)distinctFrom.add(normalizedText(row.evidence));}
  }
  async function captureReceipt(capture,sourceHash,label){
   const receipt=capture.receipt;need(receipt&&text(receipt.path)&&/^[a-f0-9]{64}$/.test(receipt.sha256||''),`${label}: original capture receipt/hash required`);
   const bytes=await readFile(await local(root,receipt.path));need(sha(bytes)===receipt.sha256,`${label}: capture receipt bytes changed`);
   const original=JSON.parse(bytes),records=original.captures||original.rows;
   need(original.version===1&&Array.isArray(records),`${label}: valid original capture receipt required`);
   need(unique(records.map(c=>c.id))&&records.every(c=>text(c.id)),`${label}: original capture IDs must be unique`);
   const record=records.find(c=>c.id===capture.id);need(record,`${label}: capture ID missing from original receipt`);
   const originalHash=record.sourceHash||original.sourceHash;
   need(originalHash===sourceHash,`${label}: original capture sourceHash mismatch`);
   need(JSON.stringify(captureCore(record,originalHash))===JSON.stringify(captureCore(capture,sourceHash)),`${label}: original stage/camera/viewport/view/screenshot metadata mismatch`);
  }
  async function captures(record,label,final=false){
   stages(record.stages,label);need(record.stages.every(s=>allowedStages.includes(s)),`${label}: stage outside configured scope`);
   need(Array.isArray(record.captures)&&record.captures.length>0,`${label}: actual captures required`);
   need(record.stages.every(s=>record.captures.some(c=>c.stage===s)),`${label}: missing stage capture`);
   const localPaths=new Set(),localPixels=new Set(),localIds=new Set();
   for(const capture of record.captures){
    need(text(capture.id)&&!localIds.has(capture.id),`${label}: unique capture IDs required`);localIds.add(capture.id);
    need(record.stages.includes(capture.stage),`${label}: capture stage mismatch`);
    need(['normal','wide','mobile','overview','rest'].includes(capture.view),`${label}: explicit capture view required`);
    need(capture.sourceHash===record.sourceHash,`${label}: capture sourceHash must match its review`);
    const camera=capture.camera,viewport=capture.viewport,shot=capture.screenshot;
    need(camera&&[camera.x,camera.y,camera.scale].every(Number.isFinite)&&camera.scale>0,`${label}: finite camera required`);
    need(viewport&&[viewport.width,viewport.height].every(v=>Number.isInteger(v)&&v>0)&&(viewport.pixelRatio===undefined||Number.isFinite(viewport.pixelRatio)&&viewport.pixelRatio>0),`${label}: viewport required`);
    need(shot&&text(shot.path)&&/^[a-f0-9]{64}$/.test(shot.sha256||''),`${label}: original screenshot/hash required`);
    await captureReceipt(capture,record.sourceHash,label);
    const im=await getImage(shot.path),ratio=viewport.pixelRatio??1;
    need(im.sha256===shot.sha256,`${label}: screenshot bytes changed`);
    need(im.width===Math.round(viewport.width*ratio)&&im.height===Math.round(viewport.height*ratio),`${label}: screenshot viewport mismatch`);
    need(!localPaths.has(shot.path)&&!localPixels.has(im.pixels),`${label}: duplicate screenshot/path/pixels cannot create view or stage coverage`);localPaths.add(shot.path);localPixels.add(im.pixels);
    const core=captureCore(capture),prior=origins.get(capture.id);
    if(final&&prior){need(prior.sourceHash===record.sourceHash&&JSON.stringify(prior.core)===JSON.stringify(core),`${label}: final reference must exactly match original capture metadata/sourceHash`);}
    else {
     need(!prior,`${label}: capture ID already belongs to another original`);
     need(!usedBytes.has(im.sha256)&&!usedPixels.has(im.pixels),`${label}: duplicated screenshot bytes/pixels cannot count as a fresh capture`);
     origins.set(capture.id,{core,sourceHash:record.sourceHash,image:im});usedBytes.set(im.sha256,capture.id);usedPixels.set(im.pixels,capture.id);
    }
   }
   for(const row of [...(record.criteria||[]),...(record.regressions||[]),...(record.holisticCriteria||[])])need(row.refs.some(ref=>record.captures.some(c=>c.screenshot.path===ref)),`${label}: evidence detached from actual captures`);
   return record.captures.map(c=>({id:c.id,path:c.screenshot.path,sourceHash:record.sourceHash,image:origins.get(c.id).image,core:captureCore(c)}));
  }
  async function resolutions(record,label){
   need(Array.isArray(record.resolutions),`${label}: explicit failure-resolution records required`);
   for(const resolution of record.resolutions){
    need(Array.isArray(resolution.failures)&&resolution.failures.length>0&&unique(resolution.failures),`${label}: resolution must name earlier failures`);
    const targets=resolution.failures.map(id=>{need(openFailures.has(id),`${label}: resolution names an unknown/already closed failure ${id}`);return openFailures.get(id);});
    const id=targets[0].criterionId;need(targets.every(t=>t.criterionId===id),`${label}: resolve one criterion with concrete evidence at a time`);
    const correction=resolution.correction;
    need(correction&&text(correction.description)&&correction.description.length>=25&&['art-change','camera-correction'].includes(correction.kind),`${label}: concrete correction and kind required`);
    need(correction.afterSourceHash===record.sourceHash&&Array.isArray(correction.beforeSourceHashes)&&sameSet([...new Set(targets.map(t=>t.sourceHash))],correction.beforeSourceHashes),`${label}: resolution before/after source states must match actual failures/candidate`);
    if(correction.kind==='art-change')need(targets.every(t=>t.sourceHash!==record.sourceHash),`${label}: art correction must change the failed source`);
    else need(id==='readability',`${label}: camera-only correction cannot close material/composition/grounding failures`);
    need(Array.isArray(resolution.afterCaptureIds)&&resolution.afterCaptureIds.length>0&&unique(resolution.afterCaptureIds),`${label}: new correction captures required`);
    for(const captureId of resolution.afterCaptureIds){const shot=record.captures.find(c=>c.id===captureId);need(shot,`${label}: correction image must be captured in this review`);const original=origins.get(captureId);need(targets.every(t=>!t.pixels.includes(original.image.pixels)),`${label}: correction must have new pixels`);}
    need(resolution.judgment?.id===id&&resolution.judgment.status==='pass'&&record.criteria.some(r=>r.id===id&&r.status==='pass'),`${label}: correction must be rejudged pass in this candidate`);
    await evidence(resolution.judgment,`${label} resolution/${id}`);
    need(resolution.judgment.refs.some(ref=>record.captures.some(c=>resolution.afterCaptureIds.includes(c.id)&&c.screenshot.path===ref)),`${label}: resolution judgment must reference its new captures`);
    for(const failureId of resolution.failures)openFailures.delete(failureId);
   }
  }
  for(const round of manifest.rounds){
   const label=`Round ${round.id}`;need(digest(round.sourceHash),`${label}: source content hash required`);
   await verifySourceState({root,state:round.sourceState,expectedHash:round.sourceHash,scope:config});
   need(text(round.changes),`${label}: correction/initial candidate description required`);
   need(Array.isArray(round.focusCriteria)&&round.focusCriteria.length>0&&unique(round.focusCriteria)&&round.focusCriteria.every(id=>ids.includes(id)),`${label}: focusCriteria required`);
   await results(round.criteria,[...new Set([...round.focusCriteria,...previousPasses])],label);await results(round.regressions,[...previousPasses],`${label} regressions`);
   for(const row of round.regressions)need(round.criteria.some(c=>c.id===row.id&&c.status===row.status),`${label}: regression and criterion verdict disagree`);
   const originalCaptures=await captures(round,label);await resolutions(round,label);
   for(const row of round.criteria){if(row.status==='pass'){need(![...openFailures.values()].some(f=>f.criterionId===row.id),`${label}: an earlier fail has no concrete correction/new-capture resolution`);previousPasses.add(row.id);}else{const failureId=round.id+':'+row.id,failure={id:failureId,criterionId:row.id,roundId:round.id,sourceHash:round.sourceHash,pixels:originalCaptures.map(c=>c.image.pixels)};openFailures.set(failureId,failure);failures.set(failureId,failure);}priorTexts.add(normalizedText(row.evidence));}
   round.focusCriteria.forEach(id=>observed.add(id));
  }
  need(ids.every(id=>observed.has(id)),'Every configured criterion must be a focus in the five-or-more review rounds');
  const final=manifest.final;need(final&&final.reviewKind==='holistic','Separate final holistic pixel review is missing');
  need(final.sourceHash===currentHash,`Stale source: final must match current source content hash ${currentHash}`);
  need(final.sourceHash===manifest.rounds.at(-1).sourceHash,'Final and last candidate review must use the same final sourceHash');
  await verifySourceState({root,state:final.sourceState,expectedHash:final.sourceHash,scope:config});
  need(sameSet(stages(final.stages,'Final'),allowedStages),'Final captures must cover all representative and affected scope stages');
  const finalTexts=new Set(priorTexts);
  await results(final.criteria,ids,'Final',ids,finalTexts);await results(final.regressions,[...previousPasses],'Final regressions',ids,finalTexts);
  await results(final.holisticCriteria,holisticIds,'Final whole-art judgment',holisticIds,finalTexts);
  await captures(final,'Final',true);await resolutions(final,'Final');
  need(final.criteria.every(c=>c.status==='pass')&&final.regressions.every(c=>c.status==='pass')&&final.holisticCriteria.every(c=>c.status==='pass'),'Unresolved fail: final focus/whole-art/regression judgments must all pass');
  need(openFailures.size===0,'Unresolved earlier failures remain without correction/new-capture/rejudgment records');
  need(Array.isArray(final.unresolvedFailures)&&final.unresolvedFailures.length===0,'Unresolved failures must be zero');
  for(const stage of config.stages)for(const view of config.requiredViews.representative)need(final.captures.some(c=>c.stage===stage&&c.view===view),`Final: stage ${stage} missing representative ${view} view`);
  for(const stage of config.affectedStages||[])for(const view of config.requiredViews.affected)need(final.captures.some(c=>c.stage===stage&&c.view===view),`Final: stage ${stage} missing affected ${view} view`);
  for(const stage of config.restStages||[])need(final.captures.some(c=>c.stage===stage&&c.view==='rest'),`Final: stage ${stage} missing related rest scene`);
  const parent=final.parentImageReview;need(parent?.status==='approved'&&parent.reviewer==='parent','Parent final image review is pending/missing; release remains blocked');
  need(parent.sourceHash===currentHash,'Parent final image review source hash is stale');
  need(parent.message&&text(parent.message.threadId)&&text(parent.message.messageId)&&text(parent.message.receivedAt),'Actual received parent review message reference required; never prefill approval');
  await evidence(parent,'Parent final image review',{distinctFrom:finalTexts});
  for(const shot of final.captures.filter(c=>config.stages.includes(c.stage)&&config.requiredViews.representative.includes(c.view)))need(parent.refs.includes(shot.screenshot.path),'Parent must reference all final representative captures actually reviewed');
  return{status:'records-consistent',quality:'not-automatically-assessed',scope:config.scope,sourceHash:currentHash,rounds:manifest.rounds.length,errors};
 }catch(error){errors.push(error.message);return{status:'blocked',quality:'not-automatically-assessed',errors};}
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
