/** Narrow, reversible P0 approval layered over immutable historical fixtures.
 * Previous source strings are audit evidence only; never execute them. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {storyDeltaHash as hash} from './exact-story-revision-delta.mjs';
import {assertExactFollowupDelta} from './ui-followup-source-delta.mjs';
const bytes=readFileSync(new URL('./fixtures/p0-body-revision-delta.json',import.meta.url));
assert.equal(hash(bytes),'1d4a7e882e2f79233a1e138bba251f214d46324aa413e1ab2d6b363e447bcd26','Pinned P0 source and build delta');
export const bodyDelta=JSON.parse(bytes),d=bodyDelta;
assert.deepEqual(d.sourceChanges.map(c=>c.path),['shared/engine/src/engine.ts','shared/engine/src/locomotion.ts','shared/engine/src/skillMechanics.ts','shared/engine/src/warriorMechanics.ts','shared/runtime/stake-crossing.js']);
// Exactly the compiled core and the checkpoint module may differ in any bundle.
for(const [key,before] of Object.entries(d.beforeBuilds)){
 const after=d.afterBuilds[key],swap=new Map([[d.beforeCoreSha256,d.afterCoreSha256],[d.sourceChanges.at(-1).previousSha256,d.sourceChanges.at(-1).sha256]]);
 assert.deepEqual(after.options,before.options);assert.deepEqual(after.parts,before.parts.map(h=>swap.get(h)||h),key+' exact two-part change');
}
export function applyBodyRuntimeManifest(previous){
 assert.equal(hash(previous),d.beforeManifestSha256,'Entire previously approved manifest preserved');
 assert.equal(previous.coreSha256,d.beforeCoreSha256);assert.deepEqual(previous.variants,d.beforeBuilds);
 const current=structuredClone(previous);
 for(const c of d.sourceChanges){const i=current.sourceRows.findIndex(r=>r.path===c.path);assert.deepEqual(current.sourceRows[i],c.beforeRow);current.sourceRows[i]=structuredClone(c.afterRow);}
 current.coreSha256=d.afterCoreSha256;current.variants=structuredClone(d.afterBuilds);current.approvedDeltas.push(structuredClone(d));return current;
}
export function beforeBodyManifest(current){
 const previous=structuredClone(current);assert.deepEqual(previous.approvedDeltas.pop(),d);assert.deepEqual(previous.variants,d.afterBuilds);assert.equal(previous.coreSha256,d.afterCoreSha256);
 for(const c of d.sourceChanges){const i=previous.sourceRows.findIndex(r=>r.path===c.path);assert.deepEqual(previous.sourceRows[i],c.afterRow);previous.sourceRows[i]=structuredClone(c.beforeRow);}
 previous.coreSha256=d.beforeCoreSha256;previous.variants=structuredClone(d.beforeBuilds);assert.equal(hash(previous),d.beforeManifestSha256);return previous;
}
export function beforeBodySource(path,current){const c=d.sourceChanges.find(c=>c.path===path);return c?assertExactFollowupDelta(current,c):current;}
export function beforeBodySources(current){return Object.fromEntries(Object.entries(current).map(([p,s])=>[p,beforeBodySource(p,s)]));}
export function assertBodyNegatives(current,sources){
 let count=0;beforeBodyManifest(current);
 for(const c of d.sourceChanges){assert.equal(hash(beforeBodySource(c.path,sources[c.path])),c.previousSha256);assert.throws(()=>beforeBodySource(c.path,sources[c.path]+' '));count++;
  for(const mutate of [x=>x.exactEdits[0].afterLine++,x=>x.exactEdits[0].before.push('unapproved'),x=>x.exactEdits.pop()]){const changed=structuredClone(c);mutate(changed);assert.throws(()=>assertExactFollowupDelta(sources[c.path],changed));count++;}}
 for(const mutate of [x=>x.sourceRows[0].sha256='0'.repeat(64),x=>x.coreSha256='0'.repeat(64),x=>x.modelFiles.pop(),x=>x.engineFiles.pop(),x=>x.variants.v1r1a1.parts.reverse(),x=>x.approvedDeltas.pop()]){const changed=structuredClone(current);mutate(changed);assert.throws(()=>beforeBodyManifest(changed));count++;}
 return count;
}
