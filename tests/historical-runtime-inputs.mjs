/** Archive byte evidence only. Never evaluate these sources or supply their
 * fingerprint as the identity of a current Engine/normal-gameplay execution. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {runtimeContractHash as hash,currentRuntimeManifest as f,assertCurrentRuntimeSources} from './current-runtime-contract-helpers.mjs';
const bytes=readFileSync(new URL('./fixtures/runtime-contracts/history-1973f07.json.gz',import.meta.url));
assert.equal(hash(bytes),'f3bfb75624c391e4aef7fc85cf8f77ae2d61f73d7dc765d017f734811946018e','Immutable original source/fingerprint fixture');assert.equal(hash(bytes),f.historicalFixtureSha256);
const archive=JSON.parse(gunzipSync(bytes));assert.equal(archive.sourceCommit,'1973f07c76f89992348bbc763dc35c7a2b259d4b');
export function historicalRuntimeSources(){return structuredClone(archive.sources);}
export function historicalRuntimeParts({variant='raw'}={}){assert(['raw','temple'].includes(variant),'Explicit archive variant');const parts=[...archive.parts[variant]],expected=f.historicalParts[variant];assert.deepEqual(parts.map(hash),expected.parts);assert.equal(hash(parts.join('\n')),expected.sha256);return parts;}
export function sourceHistoryInput(sources){
 // Only exact current sources may enter this new boundary. Older partial
 // historical projections keep flowing to the unchanged original validators.
 const added=f.sourceRows.filter(r=>r.kind==='added').map(r=>r.path);
 if(Object.keys(sources).some(p=>added.includes(p))){assertCurrentRuntimeSources(sources);return historicalRuntimeSources();}
 return sources;
}
