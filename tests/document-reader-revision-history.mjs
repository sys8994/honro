/** Explicit document presentation approval. Archive bytes are never executed. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {storyDeltaHash as hash} from './exact-story-revision-delta.mjs';
import {assertExactFollowupDelta} from './ui-followup-source-delta.mjs';
const bytes=readFileSync(new URL('./fixtures/document-reader-revision-delta.json',import.meta.url));
assert.equal(hash(bytes),'23aeb3160d784d91543a291308c02efe9e43addf93fd740698c881b95b6e2c42','Pinned exact document-only source/build delta');
export const documentDelta=JSON.parse(bytes),d=documentDelta;
assert.equal(d.baseCurrentCommit,'29b1e273a991ad64d639617be8c74ac3af09b18f');
assert.deepEqual(d.sourceChanges.map(c=>c.path),['shared/runtime/story-act23-art.js','shared/runtime/story.js']);
assert.deepEqual(d.packagingChanges.map(c=>c.path),['game/src/presentation.css']);
const swaps=new Map(d.sourceChanges.map(c=>[c.previousSha256,c.sha256]));
for(const [k,before]of Object.entries(d.beforeBuilds)){assert.deepEqual(d.afterBuilds[k].options,before.options);assert.deepEqual(d.afterBuilds[k].parts,before.parts.map(h=>swaps.get(h)||h),k+' only approved document parts change');}
export function applyDocumentRuntimeManifest(previous){
 assert.equal(hash(previous),d.beforeManifestSha256,'Entire P0-approved manifest retained');assert.deepEqual(previous.variants,d.beforeBuilds);
 const current=structuredClone(previous);
 for(const c of d.sourceChanges){const i=current.sourceRows.findIndex(r=>r.path===c.path);assert.deepEqual(current.sourceRows[i],c.beforeRow);current.sourceRows[i]=structuredClone(c.afterRow);}
 for(const c of d.packagingChanges){assert.equal(c.beforeRow,null);assert(!current.packagingSources.some(r=>r.path===c.path));current.packagingSources.push(structuredClone(c.afterRow));}
 current.variants=structuredClone(d.afterBuilds);current.approvedDeltas.push(structuredClone(d));return current;
}
export function beforeDocumentManifest(current){
 const previous=structuredClone(current);assert.deepEqual(previous.approvedDeltas.pop(),d);assert.deepEqual(previous.variants,d.afterBuilds);
 for(const c of d.sourceChanges){const i=previous.sourceRows.findIndex(r=>r.path===c.path);assert.deepEqual(previous.sourceRows[i],c.afterRow);previous.sourceRows[i]=structuredClone(c.beforeRow);}
 for(const c of [...d.packagingChanges].reverse())assert.deepEqual(previous.packagingSources.pop(),c.afterRow);
 previous.variants=structuredClone(d.beforeBuilds);assert.equal(hash(previous),d.beforeManifestSha256);return previous;
}
export function beforeDocumentSource(path,current){const c=[...d.sourceChanges,...d.packagingChanges].find(c=>c.path===path);return c?assertExactFollowupDelta(current,c):current;}
export function beforeDocumentSources(current){return Object.fromEntries(Object.entries(current).map(([p,s])=>[p,beforeDocumentSource(p,s)]));}
export function assertDocumentNegatives(current,sources){
 let count=0;beforeDocumentManifest(current);
 for(const c of [...d.sourceChanges,...d.packagingChanges]){const source=sources[c.path]??readFileSync(new URL('../'+c.path,import.meta.url),'utf8');assert.equal(hash(beforeDocumentSource(c.path,source)),c.previousSha256);assert.throws(()=>beforeDocumentSource(c.path,source+' '));count++;
  for(const mutate of [x=>x.exactEdits[0].afterLine++,x=>x.exactEdits[0].before.push('unapproved'),x=>x.exactEdits.pop()]){const bad=structuredClone(c);mutate(bad);assert.throws(()=>assertExactFollowupDelta(source,bad));count++;}}
 for(const mutate of [x=>x.sourceRows[0].sha256='0'.repeat(64),x=>x.coreSha256='0'.repeat(64),x=>x.modelFiles.pop(),x=>x.engineFiles.pop(),x=>x.variants.v1r1a1.parts.reverse(),x=>x.approvedDeltas.pop(),x=>x.packagingSources.pop()]){const bad=structuredClone(current);mutate(bad);assert.throws(()=>beforeDocumentManifest(bad));count++;}
 return count;
}
