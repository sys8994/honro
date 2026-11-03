/** Register one attested publication whose active graph is still present.
 * The caller must independently verify the successful publication and obtain
 * expectedBlobSha from that source commit's authenticated Git tree entry.
 * No network, history restoration, pruning, or modification of prior facts.
 */
import {readFile, writeFile, rename, unlink} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {graphSha256, validateAsset, selectPublishedGenerations} from '../../shared/web-retention.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export const gitBlobSha = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
function requireFact(ok, message) { if (!ok) throw Error(message); }
function array(value, label) { requireFact(Array.isArray(value), `${label} must be an array`); return value; }

export async function registerCurrentPublication({
  root = process.cwd(), sourceManifest, expectedBlobSha, sourceSha,
  publishedAt, evidence, now = Date.now()
}) {
  requireFact(/^[a-f0-9]{40}$/.test(sourceSha || ''), 'Full source Git SHA required');
  requireFact(/^[a-f0-9]{40}$/.test(expectedBlobSha || ''), 'Expected source manifest Git blob SHA required');
  requireFact(typeof sourceManifest === 'string' && sourceManifest, 'Source manifest file required');
  requireFact(typeof evidence === 'string' && /^https:\/\//.test(evidence) && evidence === evidence.trim(), 'Verified HTTPS publication evidence required');
  const sourceBytes = await readFile(sourceManifest);
  requireFact(gitBlobSha(sourceBytes) === expectedBlobSha, 'Source manifest Git blob SHA mismatch');
  const source = JSON.parse(sourceBytes.toString('utf8'));
  const manifestFile = path.join(root, 'web/manifest.json');
  const before = await readFile(manifestFile);
  const current = JSON.parse(before.toString('utf8'));
  requireFact(source.version === 1 && current.version === 1, 'Unsupported web manifest version');
  array(source.files, 'Source files'); array(current.files, 'Current files');
  requireFact(isDeepStrictEqual(source.files, current.files), 'Published source active files differ from current active files');
  const record = {
    sourceSha, publishedAt, publishedAtPrecision: 'instant', publicationOrder: 0,
    evidence, graphSha256: graphSha256(source.files), files: source.files
  };
  const prior = array(current.publishedGenerations ?? [], 'Published generations');
  // Validation only: keep the complete original array, including expired facts.
  selectPublishedGenerations([...prior, record], {now});
  const related = prior.filter(g => g.sourceSha === sourceSha || g.graphSha256 === record.graphSha256);
  requireFact(related.length === 0 || related.length === 1 && isDeepStrictEqual(related[0], record), 'Conflicting publication facts already exist');

  const previous = array(current.previousFiles ?? [], 'Previous files');
  const intermediate = array(current.previousGenerations ?? [], 'Previous generations')
    .flatMap((files, index) => array(files, `Previous generation ${index}`));
  const unique = new Map();
  for (const file of [...current.files, ...previous, ...intermediate, ...prior.flatMap(g => g.files)]) {
    validateAsset(file);
    const found = unique.get(file.path);
    requireFact(!found || found.bytes === file.bytes && found.sha256 === file.sha256, `Immutable asset metadata collision: ${file.path}`);
    if (!found) unique.set(file.path, file);
  }
  let verifiedBytes = 0;
  for (const file of unique.values()) {
    const bytes = await readFile(path.join(root, file.path));
    requireFact(bytes.length === file.bytes && digest(bytes) === file.sha256, `Retained immutable asset mismatch: ${file.path}`);
    verifiedBytes += bytes.length;
  }
  requireFact((await readFile(manifestFile)).equals(before), 'Manifest changed during publication verification');
  const summary = {changed: related.length === 0, sourceSha, graphSha256: record.graphSha256,
    verifiedFiles: unique.size, verifiedBytes, priorPublications: prior.length};
  if (related.length) return summary;

  // Preserve every unrelated field and every existing publication object.
  const after = Buffer.from(JSON.stringify({...current, publishedGenerations: [...prior, record]}, null, 2) + '\n');
  const temporary = manifestFile + '.publication-' + randomUUID();
  try {
    await writeFile(temporary, after, {flag: 'wx'});
    requireFact((await readFile(manifestFile)).equals(before), 'Manifest changed before publication registration');
    await rename(temporary, manifestFile);
  } finally {
    try { await unlink(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const names = {'--root': 'root', '--source-manifest': 'sourceManifest', '--expected-blob-sha': 'expectedBlobSha',
    '--source-sha': 'sourceSha', '--published-at': 'publishedAt', '--evidence': 'evidence'};
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i += 2) {
    const name = names[args[i]];
    requireFact(name && args[i + 1] && !args[i + 1].startsWith('--') && !(name in options), 'Invalid or duplicate argument: ' + args[i]);
    options[name] = args[i + 1];
  }
  console.log(JSON.stringify(await registerCurrentPublication(options)));
}
