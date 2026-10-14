import {applyStoryRuntimeManifest} from './act23-story-revision-history.mjs';
/** Current production identity is checked separately from archive identity. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const runtimeContractHash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const bytes=readFileSync(new URL('./fixtures/runtime-contracts/current-manifest.json',import.meta.url));
assert.equal(runtimeContractHash(bytes),'476d746f8ddcab4e12b75769ccd7fc6c6dd2a8c60f7453a41b1c218f1832c141','Reviewed current runtime provenance manifest');
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
export const currentRuntimeManifest=freeze(applyStoryRuntimeManifest(JSON.parse(bytes)));
const f=currentRuntimeManifest,root=new URL('../',import.meta.url);
export function currentRuntimeSources(){const dirs=['shared/runtime','shared/map','shared/engine/src'],extra=['shared/build.mjs','game/engine/build.mjs','game/config/balance.json',...readdirSync(new URL('shared/data',root)).filter(p=>p.endsWith('.json')&&p!=='campaign.json').map(p=>'shared/data/'+p)];return Object.fromEntries([...dirs.flatMap(dir=>readdirSync(new URL(dir,root)).filter(p=>/\.(js|ts)$/.test(p)).map(p=>dir+'/'+p)),...extra].sort().map(p=>[p,readFileSync(new URL(p,root),'utf8')]));}
export function assertCurrentRuntimeSources(sources){assert.deepEqual(Object.keys(sources),f.sourceOrder,'Exact reviewed current source paths, uniqueness and sorted order');for(const row of f.sourceRows)assert.equal(runtimeContractHash(sources[row.path]),row.sha256,'Current '+row.kind+' source '+row.path);return sources;}
export function assertCurrentRuntimeParts(parts,{variant='v0r0a0'}={}){const expected=f.variants[variant];assert(expected,'Explicit current build variant');assert.deepEqual(parts.map(runtimeContractHash),expected.parts,'Current production parts membership, bytes and order: '+variant);assert.equal(runtimeContractHash(parts.join('\n')),expected.sha256,'Current build fingerprint: '+variant);return parts;}
export function assertCurrentBuildGraph({modelFiles,engineFiles,core}){assert.deepEqual(modelFiles,f.modelFiles,'Exact actual current modelFiles declaration/order');assert.deepEqual(engineFiles,f.engineFiles,'Actual compiler TS input set/order');assert.equal(runtimeContractHash(core),f.coreSha256,'Actual current TypeScript compilation');}
