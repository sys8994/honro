/** Verified outer combat-only boundary. All original historical validators and
 * fixtures remain authoritative after this exact separately pinned projection.
 * Never execute stored source strings or accept an arbitrary current golden. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex'),plain=v=>JSON.parse(JSON.stringify(v));
const bytes=readFileSync(new URL('./fixtures/encounter-density/history-delta.json',import.meta.url));
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
export const encounterDensityHistory=freeze(JSON.parse(bytes));
const f=encounterDensityHistory;
assert.equal(hash(bytes),'7e9357daba01e0cc77e415f997451674563ef15cd571f20da5e9161721d1181a','Exact independently scoped density checkpoint, never auto-refreshed');
assert.equal(f.sourceCommit,'bb5eafb52054e0f8a1fb09045d85a4c3dd0ca964');assert.equal(f.beforeProjectSha256,'d3a326b89d61c79968be75e452c81043071588db8d8755fe4b2d8c6b1647c39d');assert.deepEqual(f.stageIds,[8,11,12,16,17,18,23,30]);
export function beforeEncounterDensity(project){const p=plain(project);if(!p.stages?.some(s=>Object.hasOwn(s.initialState||{},'honroEncounterDensityRevision')))return p;
 const full=p.stages.length===30;assert(full||p.stages.length===20,'Complete full/Act12 density project required');assert.equal(hash(p),full?f.afterProjectSha256:f.afterAct12Sha256,'Exact combat-only density project: reject every map, art, order and global drift');
 for(const s of p.stages){const row=f.stages[s.metadata.stageId];if(!row)continue;assert.equal(hash(s),row.afterSha256,'Exact density stage '+s.id);for(const[k,v]of Object.entries(row.fields))s[k]=plain(v);assert.equal(hash(s),row.beforeSha256,'Exact immutable before-stage '+s.id);}
 assert.equal(hash(p),full?f.beforeProjectSha256:f.beforeAct12Sha256,'Exact bb5eafb projection');return p;
}
function beforeSources(sources,rows,marker){if(!Object.hasOwn(sources,marker))return sources;assert.deepEqual(Object.keys(sources).sort(),Object.keys(rows).sort(),'Exact density source membership');const out={};for(const[path,row]of Object.entries(rows)){assert.equal(hash(sources[path]),row.afterSha256,'Exact density source '+path);if(!row.beforeSha256)continue;if(Object.hasOwn(row,'before')){assert.equal(hash(row.before),row.beforeSha256,'Immutable stored before-source '+path);out[path]=Buffer.isBuffer(sources[path])?Buffer.from(row.before):row.before;}else out[path]=sources[path];}return out;}
export const beforeEncounterDensityRuntimeSources=sources=>beforeSources(sources,f.runtime,'shared/runtime/encounter-density.js');
export const beforeEncounterDensityAuthoringSources=sources=>beforeSources(sources,f.authoring,'tools/map-forge/apply-encounter-density.mjs');
export function beforeEncounterDensityFingerprintParts(parts){
 const rows=Object.entries(f.runtime).filter(([path,r])=>path.startsWith('shared/runtime/')&&(!r.beforeSha256||r.before)),digests=parts.map(hash),module=f.runtime['shared/runtime/encounter-density.js'].afterSha256,prefix='globalThis.HONRO_PROJECT=HonroObjectiveRevision.author(HonroAct1Roster.author(',suffix='));';
 const current=rows.some(([,r])=>digests.includes(r.afterSha256));if(!current)return [...parts];
 for(const[path,row]of rows)assert.equal(digests.filter(d=>d===row.afterSha256).length,1,'Exactly one complete current density model part '+path);
 assert.equal(digests.indexOf(module),digests.indexOf(f.runtime['shared/runtime/stage8-bier.js'].afterSha256)+1,'Density hook remains directly after Stage8 in the shared manifest');
 return parts.flatMap(part=>{const row=rows.find(([,r])=>r.afterSha256===hash(part))?.[1];if(row)return row.beforeSha256?[row.before]:[];if(part.startsWith(prefix)&&part.endsWith(suffix)){const p=JSON.parse(part.slice(prefix.length,-suffix.length));assert.equal(hash(p),f.afterProjectSha256,'Current model must carry the exact density canonical, never a mixed historical map');return[prefix+JSON.stringify(beforeEncounterDensity(p))+suffix];}return[part];});
}
