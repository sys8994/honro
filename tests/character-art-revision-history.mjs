/** Explicit visual approval after the immutable story approval. Reverse outputs
 * are archive evidence only, never executable current-runtime fingerprints. */
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {storyDeltaHash as hash} from './exact-story-revision-delta.mjs';
import {assertExactFollowupDelta} from './ui-followup-source-delta.mjs';
const bytes=readFileSync(new URL('./fixtures/character-art-revision-delta.json',import.meta.url));
assert.equal(hash(bytes),'59a8b02788d747d49fb34a60e0196418437a983c554cdaa8bcf5140f419b4edd','Exact reviewed character artwork approval; never automatically refreshed');
export const characterArtDelta=JSON.parse(bytes);
const d=characterArtDelta;
assert.deepEqual(d.sourceChanges.map(c=>c.path),['shared/runtime/act2-art.js','shared/runtime/art-dark.js','shared/runtime/quest-target-art.js']);
assert.deepEqual(d.artParts.map(c=>c.path),['shared/assets/monsters/monsters.runtime.js','shared/assets/actors/actors.runtime.js']);
const substitutions=new Map([...d.sourceChanges,...d.artParts].map(c=>[c.previousSha256,c.sha256]));
for(const[key,before]of Object.entries(d.beforeBuilds)){
 const after=d.afterBuilds[key];assert.deepEqual(after.options,before.options);
 assert.deepEqual(after.parts,before.parts.map(h=>substitutions.get(h)||h),'Only the five approved art parts can change: '+key);
 if(!after.options?.render)assert.deepEqual(after,before,'Non-render gameplay fingerprints are unchanged');
}
function counts(f){f.currentCounts={sources:f.sourceRows.length};for(const kind of ['added','changed','unchanged'])f.currentCounts[kind]=f.sourceRows.filter(r=>r.kind===kind).length;}
export function applyCharacterArtRuntimeManifest(previous){
 assert.equal(hash(previous),d.beforeManifestSha256,'Entire previous story manifest immutable');
 assert.equal(hash(previous.sourceRows),d.beforeSourceRowsSha256);assert.equal(hash(previous.approvedDeltas),d.beforeApprovedDeltasSha256);
 assert.equal(previous.coreSha256,d.preservedCoreSha256);assert.deepEqual(previous.variants,d.beforeBuilds);
 const current=structuredClone(previous);
 for(const c of d.sourceChanges){const i=current.sourceRows.findIndex(r=>r.path===c.path);assert.deepEqual(current.sourceRows[i],c.beforeRow);current.sourceRows[i]=structuredClone(c.afterRow);}
 for(const c of d.packagingChanges){const i=current.packagingSources.findIndex(r=>r.path===c.path);if(c.beforeRow===null){assert.equal(i,-1);current.packagingSources.push(structuredClone(c.afterRow));}else{assert.deepEqual(current.packagingSources[i],c.beforeRow);current.packagingSources[i]=structuredClone(c.afterRow);}}
 current.variants=structuredClone(d.afterBuilds);current.approvedDeltas.push(structuredClone(d));counts(current);return current;
}
export function beforeCharacterArtManifest(current){
 const previous=structuredClone(current);assert.deepEqual(previous.approvedDeltas.pop(),d);assert.deepEqual(previous.variants,d.afterBuilds);
 for(const c of d.sourceChanges){const i=previous.sourceRows.findIndex(r=>r.path===c.path);assert.deepEqual(previous.sourceRows[i],c.afterRow);previous.sourceRows[i]=structuredClone(c.beforeRow);}
 for(const c of [...d.packagingChanges].reverse()){const i=previous.packagingSources.findIndex(r=>r.path===c.path);assert.deepEqual(previous.packagingSources[i],c.afterRow);if(c.beforeRow===null)previous.packagingSources.splice(i,1);else previous.packagingSources[i]=structuredClone(c.beforeRow);}
 previous.variants=structuredClone(d.beforeBuilds);counts(previous);assert.equal(hash(previous),d.beforeManifestSha256,'Reverse preserves every unrelated manifest byte');return previous;
}
export function beforeCharacterArtSource(path,current){const c=d.sourceChanges.find(c=>c.path===path);if(c)return assertExactFollowupDelta(current,c);const a=d.historicalPackaging.find(c=>c.path===path);if(!a)return current;assert.equal(hash(current),a.sha256);const previous=gunzipSync(Buffer.from(a.previousGzipBase64,'base64')).toString();assert.equal(hash(previous),a.previousSha256);return previous;}
export function beforeCharacterArtSources(current){return Object.fromEntries(Object.entries(current).map(([p,s])=>[p,beforeCharacterArtSource(p,s)]));}
export function assertCharacterArtNegatives(current,sources){
 let count=0;
 for(const c of d.sourceChanges){assert.equal(hash(sources[c.path]),c.sha256);assert.equal(hash(beforeCharacterArtSource(c.path,sources[c.path])),c.previousSha256);assert.throws(()=>beforeCharacterArtSource(c.path,sources[c.path]+' '));count++;
  for(const mutate of [x=>x.exactEdits[0].afterLine++,x=>x.exactEdits[0].before[0]+=' ',x=>x.exactEdits.pop()]){const altered=structuredClone(c);mutate(altered);assert.throws(()=>assertExactFollowupDelta(sources[c.path],altered));count++;}}
 for(const mutate of [x=>x.sourceRows[0].sha256='0'.repeat(64),x=>x.engineFiles.pop(),x=>x.modelFiles.push('unapproved'),x=>x.coreSha256='0'.repeat(64),x=>x.packagingSources.at(-1).sha256='0'.repeat(64),x=>x.variants.v1r1a1.parts.reverse(),x=>x.approvedDeltas.pop()]){const altered=structuredClone(current);mutate(altered);assert.throws(()=>beforeCharacterArtManifest(altered));count++;}
 return count;
}
