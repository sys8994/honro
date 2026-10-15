/** Pinned current lake source/build delta, independent of all previous immutable approvals. */
import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const hash=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
const bytes=readFileSync(new URL('./fixtures/stage5-waterfall/lake-runtime-delta.json',import.meta.url));
assert.equal(hash(bytes),'05c6110d317574c2a0ccd285d656785635973624ce769dfb10fde657216ea516','Pinned lake source/build evidence');
export const lakeDelta=JSON.parse(bytes),d=lakeDelta;
assert.equal(d.baseCommit,'1902844316843bb1d64f2fd2d810365cc2a6ba3e');
export function beforeLakeSource(path,source){const c=[...d.sourceChanges,...d.packagingChanges].find(c=>c.path===path);if(!c)return source;assert.equal(hash(source),c.afterSha256,'Exact lake source '+path);assert.equal(hash(c.before),c.beforeSha256,'Immutable previous source '+path);return c.before;}
export function beforeLakeSources(sources){return Object.fromEntries(Object.entries(sources).map(([p,s])=>[p,beforeLakeSource(p,s)]));}
export function applyLakeRuntimeManifest(previous){assert.equal(hash(previous),d.beforeManifestSha256);const out=structuredClone(previous);for(const c of d.sourceChanges){const row=out.sourceRows.find(r=>r.path===c.path);assert.equal(row.sha256,c.beforeSha256);row.sha256=c.afterSha256;}assert.equal(out.coreSha256,d.beforeCoreSha256);out.coreSha256=d.afterCoreSha256;assert.deepEqual(out.variants,d.beforeBuilds);out.variants=structuredClone(d.afterBuilds);return out;}
export function beforeLakeManifest(current){const out=structuredClone(current);for(const c of d.sourceChanges){const row=out.sourceRows.find(r=>r.path===c.path);assert.equal(row.sha256,c.afterSha256);row.sha256=c.beforeSha256;}assert.equal(out.coreSha256,d.afterCoreSha256);out.coreSha256=d.beforeCoreSha256;assert.deepEqual(out.variants,d.afterBuilds);out.variants=structuredClone(d.beforeBuilds);assert.equal(hash(out),d.beforeManifestSha256);return out;}
