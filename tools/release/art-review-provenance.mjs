/** Reconstruct source content digests from preserved bytes, never asserted hashes.
 * This proves source-record consistency, not that a screenshot depicts that source.
 * node tools/release/art-review-provenance.mjs makesnapshot --out _local/.../state.json
 */
import {createHash} from 'node:crypto';
import {readFile, writeFile, readdir, lstat, realpath, mkdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const exec = promisify(execFile), ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DEFAULT_CONFIG = 'game/docs/art-review/current.json';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bare = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const need = (yes, message) => {if (!yes) throw Error(message);};
const unique = rows => new Set(rows).size === rows.length;
function relative(file) {
 need(typeof file === 'string' && file.length > 0 && !path.isAbsolute(file) && !/[\\\0\r\n:]/.test(file) && file.split('/').every(p => p && p !== '.' && p !== '..'), `Repository-relative path required: ${file}`);
 return file;
}
async function safeRoot(root) {
 const absolute = path.resolve(root); need(await realpath(absolute) === absolute, 'Symlink repository root is not permitted'); return absolute;
}
async function local(root, file) {
 const absolute = path.resolve(root, relative(file));
 need(await realpath(absolute) === absolute, `Symlink source/snapshot path is not permitted: ${file}`);
 need((await lstat(absolute)).isFile(), `Regular source/snapshot file required: ${file}`);
 return absolute;
}
async function bytesAt(root, file) {return readFile(await local(root, file));}
async function rejectExistingSymlinks(root, file) {
 let absolute = root;
 for (const part of relative(file).split('/')) {
  absolute = path.join(absolute, part);
  try {need(!(await lstat(absolute)).isSymbolicLink(), `Symlink original source path is not permitted: ${file}`);}
  catch (error) {if (error.code === 'ENOENT') return; throw error;}
 }
}
function stable(value) {
 if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
 if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
 return JSON.stringify(value);
}
function sourcePaths(config) {
 need(config?.version === 1 && typeof config.scope === 'string' && config.scope.trim(), 'Source scope version/name required');
 relative(config.manifest);
 need(Array.isArray(config.criteria) && config.criteria.length > 0 && config.criteria.every(c => typeof c.id === 'string' && c.id && typeof c.description === 'string' && c.description) && unique(config.criteria.map(c => c.id)), 'Named source criteria/descriptions required');
 need(Array.isArray(config.sourcePaths) && config.sourcePaths.length > 0 && unique(config.sourcePaths), 'Unique sourcePaths required');
 config.sourcePaths.forEach(relative);
 need(!config.sourcePaths.includes(config.manifest), 'Manifest self-reference cannot be a sourcePath');
 return config.sourcePaths;
}
async function knownDirectories(root, paths) {
 const dirs = new Set();
 for (const file of paths) {
  try {
   const absolute = path.resolve(root, file), stat = await lstat(absolute);
   need(!stat.isSymbolicLink() && await realpath(absolute) === absolute, `Symlink source path is not permitted: ${file}`);
   if (stat.isDirectory()) dirs.add(file);
  } catch (error) {if (error.code !== 'ENOENT') throw error;}
 }
 return dirs;
}
async function git(root, args) {return (await exec('git', args, {cwd: root, encoding: 'buffer', maxBuffer: 128 * 1024 * 1024})).stdout;}
async function gitBytes(root, commit, file) {
 need(typeof commit === 'string' && /^[a-f0-9]{40}$/.test(commit), `Full immutable gitCommit required: ${file}`);
 need((await git(root, ['cat-file', '-t', commit])).toString().trim() === 'commit', `Git object is not a commit: ${commit}`);
 const tree = (await git(root, ['--literal-pathspecs', 'ls-tree', '-z', commit, '--', relative(file)])).toString();
 const rows = tree.split('\0').filter(Boolean);
 need(rows.length === 1 && /^(100644|100755) blob [a-f0-9]{40}\t/.test(rows[0]) && rows[0].slice(rows[0].indexOf('\t') + 1) === file, `Git source must be a regular tracked blob, not a symlink/directory: ${file}`);
 return git(root, ['show', commit + ':' + file]);
}
function framedHash(configPath, configBytes, files) {
 const hash = createHash('sha256');
 for (const [name, bytes] of [[configPath, configBytes], ...[...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)]) {
  hash.update(JSON.stringify([name, bytes.length]) + '\n'); hash.update(bytes); hash.update('\n');
 }
 return 'sha256:' + hash.digest('hex');
}

export async function verifySourceState({root = ROOT, state, expectedHash, scope}) {
 root = await safeRoot(root);
 need(state && bare(state.sha256), 'Source state path/sha256 required');
 need(typeof expectedHash === 'string' && /^sha256:[a-f0-9]{64}$/.test(expectedHash), 'Expected source content hash required');
 const stateBytes = await bytesAt(root, state.path);
 need(sha(stateBytes) === state.sha256, 'Source state bytes/hash mismatch');
 const record = JSON.parse(stateBytes.toString('utf8'));
 need(record.version === 1 && record.config && Array.isArray(record.files) && record.files.length > 0, 'Source state version/config/files required');
 const config = record.config;
 relative(config.path); relative(config.snapshot);
 need(config.path !== config.snapshot && config.snapshot !== state.path && bare(config.sha256), 'Separate immutable config snapshot/hash required');
 const configBytes = await bytesAt(root, config.snapshot);
 need(sha(configBytes) === config.sha256, 'Source config snapshot bytes/hash mismatch');
 const snapshotScope = JSON.parse(configBytes.toString('utf8'));
 const oldPaths = sourcePaths(snapshotScope), currentPaths = sourcePaths(scope);
 need(snapshotScope.scope === scope.scope && stable(snapshotScope.criteria) === stable(scope.criteria), 'Historical scope/criteria wording differs from current scope');
 need(snapshotScope.manifest === scope.manifest, 'Historical manifest identity differs from current scope');
 const currentDirs = await knownDirectories(root, currentPaths), oldDirs = await knownDirectories(root, oldPaths);
 const coveredNow = file => currentPaths.includes(file) || [...currentDirs].some(dir => file.startsWith(dir + '/'));
 need(oldPaths.every(coveredNow), 'Historical sourcePaths were removed or are outside current scope; only additions are allowed');
 const names = record.files.map(f => relative(f.path));
 need(unique(names), 'Duplicate original source paths in state');
 const protectedPaths = new Set([state.path, config.path, config.snapshot, scope.manifest, snapshotScope.manifest]);
 for (const file of names) {need(!protectedPaths.has(file), `Manifest/config/state self-reference is not a source: ${file}`); await rejectExistingSymlinks(root, file);}
 for (const entry of oldPaths) {
  if (entry === config.path) continue; // Existing sourceHash frames config once.
  need(names.some(file => file === entry || file.startsWith(entry + '/')), `Missing configured source entry: ${entry}`);
 }
 const blobs = new Map(), verified = [];
 for (const row of record.files) {
  const file = row.path;
  need(oldPaths.some(entry => file === entry || file.startsWith(entry + '/') && (oldDirs.has(entry) || !currentPaths.includes(entry))) && coveredNow(file), `Source inventory path is outside configured files/directories: ${file}`);
  need(bare(row.sha256), `Source file sha256 required: ${file}`);
  const snapshot = Object.hasOwn(row, 'snapshot'), committed = Object.hasOwn(row, 'gitCommit');
  need(snapshot !== committed, `Exactly one snapshot or gitCommit required: ${file}`);
  let bytes;
  if (snapshot) {
   relative(row.snapshot);
   need(row.snapshot !== file && row.snapshot !== state.path && row.snapshot !== config.snapshot && row.snapshot !== scope.manifest, `Separate source snapshot artifact required: ${file}`);
   bytes = await bytesAt(root, row.snapshot);
  } else bytes = await gitBytes(root, row.gitCommit, file);
  need(sha(bytes) === row.sha256, `Source blob bytes/hash mismatch: ${file}`);
  blobs.set(file, bytes);
  verified.push({path: file, sha256: row.sha256, bytes: bytes.length, ...(snapshot ? {snapshot: row.snapshot} : {gitCommit: row.gitCommit})});
 }
 const actualHash = framedHash(config.path, configBytes, blobs);
 need(actualHash === expectedHash, `Source provenance digest mismatch: expected ${expectedHash}, reconstructed ${actualHash}`);
 return {sourceHash: actualHash, scope: snapshotScope.scope, state: {path: state.path, sha256: state.sha256}, config: {path: config.path, snapshot: config.snapshot, sha256: config.sha256}, files: verified.sort((a,b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)};
}

async function inventory(root, configPath, config) {
 const files = new Map();
 async function walk(file) {
  if (file === config.manifest || file === configPath) return;
  const absolute = path.resolve(root, relative(file));
  need(await realpath(absolute) === absolute, `Symlink source path is not permitted: ${file}`);
  const stat = await lstat(absolute);
  if (stat.isDirectory()) for (const child of (await readdir(absolute)).sort()) await walk(file + '/' + child);
  else {need(stat.isFile(), `Regular art source required: ${file}`); files.set(file, await readFile(absolute));}
 }
 for (const file of sourcePaths(config)) await walk(file);
 need(files.size > 0, 'Source paths contain no source files');
 return files;
}
async function newArtifact(root, file, bytes) {
 relative(file);
 let dir = root;
 for (const segment of file.split('/').slice(0, -1)) {
  dir = path.join(dir, segment);
  try {await mkdir(dir);} catch (error) {if (error.code !== 'EEXIST') throw error;}
  need((await lstat(dir)).isDirectory() && await realpath(dir) === dir, `Symlink artifact directory is not permitted: ${file}`);
 }
 await writeFile(path.resolve(root, file), bytes, {flag: 'wx'});
}
export async function makeSourceState({root = ROOT, configPath = DEFAULT_CONFIG, statePath}) {
 root = await safeRoot(root); relative(statePath); relative(configPath);
 const configBytes = await bytesAt(root, configPath), scope = JSON.parse(configBytes.toString('utf8'));
 const files = await inventory(root, configPath, scope), dirs = await knownDirectories(root, scope.sourcePaths);
 const artifactBase = statePath + '.files';
 need(statePath !== configPath && statePath !== scope.manifest && !scope.sourcePaths.some(file => file === statePath || file === artifactBase || dirs.has(file) && statePath.startsWith(file + '/')), 'Source state output must be outside sourcePaths/config/manifest');
 let head = null;
 try {const value = (await git(root, ['rev-parse', '--verify', 'HEAD'])).toString().trim(); if (/^[a-f0-9]{40}$/.test(value)) head = value;} catch {}
 const configSnapshot = artifactBase + '/scope-config.json';
 const record = {version: 1, config: {path: configPath, snapshot: configSnapshot, sha256: sha(configBytes)}, files: []};
 // Build every record from bytes already read before writing artifacts.
 const copies = [[configSnapshot, configBytes]];
 for (const [file, bytes] of [...files].sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0)) {
  let match = false;
  if (head) {try {match = bytes.equals(await gitBytes(root, head, file));} catch {}}
  if (match) record.files.push({path: file, gitCommit: head, sha256: sha(bytes)});
  else {const snapshot = artifactBase + '/sources/' + file; record.files.push({path: file, snapshot, sha256: sha(bytes)}); copies.push([snapshot, bytes]);}
 }
 const sourceHash = framedHash(configPath, configBytes, files), bytes = Buffer.from(JSON.stringify(record, null, 2) + '\n');
 for (const [file, contents] of copies) await newArtifact(root, file, contents);
 await newArtifact(root, statePath, bytes);
 const state = {path: statePath, sha256: sha(bytes)};
 return {state, sourceHash, files: record.files.length, configSnapshot, verification: await verifySourceState({root, state, expectedHash: sourceHash, scope})};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 try {
  const [command, ...args] = process.argv.slice(2), flags = {};
  need(command === 'makesnapshot' && args.length % 2 === 0, 'Usage: art-review-provenance.mjs makesnapshot --out relative/state.json [--config relative/config.json]');
  for (let i=0;i<args.length;i+=2) {need(['--out','--config'].includes(args[i]) && !Object.hasOwn(flags,args[i]), 'Unknown/duplicate snapshot argument'); flags[args[i]]=args[i+1];}
  console.log(JSON.stringify(await makeSourceState({statePath: flags['--out'], configPath: flags['--config'] || DEFAULT_CONFIG}), null, 2));
 } catch (error) {console.error(`Source provenance blocked: ${error.message}`);process.exitCode=1;}
}
