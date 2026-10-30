import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pinnedFixtureExists,readPinnedFixtureBytes} from './pinned-fixture-bytes.mjs';
import {act3FinalDelta} from './act3-environment-final-history.mjs';
const rows=[['act3-environment-final-delta',35267997,'c6fdc749d16aa3d46642c036e466506b4602961d9d2fbb2e03b895f119aee671'],['act3-environment-final-v2-delta',35272452,'92a7ca90b6d4523e115bce1c779f537ed29fd0856a21219ed92a08c7ce004c3e']];
rows.push(
 ['runtime-contracts/current-manifest',2842923,'476d746f8ddcab4e12b75769ccd7fc6c6dd2a8c60f7453a41b1c218f1832c141'],
 ['stage11-ravine-draft-save',2364474,'9f5d1b6aed5f4fbb777c87a0b7fca898157bb0884ed1ff799914bbada3e8c293'],
 ['narrative-legacy-resolver-v1',1945321,'94cec0bf0c9c1bb4307c60f070c43a75c7c128612ef5b0d8189210ef4a707b65'],
 ['stage11-ravine-completion-delta',1615009,'8f8783910c07c00a6bd79043dcb318dbedbdeed36c262d4a8da9cd04303650bb'],
 ['objective-revision-delta',1126395,'982b3757c74601a4faf797a54323aaf2e116e54e222d34856a6a18aac5765f0b']
);
for(const[n,size,sha]of rows){const url=new URL('./fixtures/'+n+'.json',import.meta.url);assert(pinnedFixtureExists(url));const bytes=readPinnedFixtureBytes(url);assert.equal(bytes.length,size);assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);}
assert.equal(act3FinalDelta().kind,'act3-environment-final'); // All existing approval assertions run unchanged.
const dir=mkdtempSync(path.join(tmpdir(),'honro-pinned-fixture-'));
try{
 const p=path.join(dir,'fixture.json'),bytes=Buffer.from('{"unicode":"혼로","spacing":  1}\n');
 assert(!pinnedFixtureExists(p));assert.throws(()=>readPinnedFixtureBytes(p));
 writeFileSync(p,bytes);assert.deepEqual(readPinnedFixtureBytes(p),bytes);rmSync(p);
 const compressed=gzipSync(bytes);writeFileSync(p+'.gz',compressed);assert(pinnedFixtureExists(p));assert.deepEqual(readPinnedFixtureBytes(pathToFileURL(p)),bytes);
 writeFileSync(p+'.gz',compressed.subarray(0,compressed.length-4));assert.throws(()=>readPinnedFixtureBytes(p));
 const corrupt=Buffer.from(compressed);corrupt[corrupt.length-8]^=255;writeFileSync(p+'.gz',corrupt);assert.throws(()=>readPinnedFixtureBytes(p));
}finally{rmSync(dir,{recursive:true,force:true});}
const root=new URL('../',import.meta.url);
for(const mode of ['pin','supersede']){
 const result=spawnSync(process.execPath,['tools/testing/pin-act3-environment-final.mjs',mode],{cwd:root,encoding:'utf8'});
 assert.notEqual(result.status,0);assert.match(result.stderr,/Final fixture already pinned; no automatic refresh/);
}
const capture=spawnSync(process.execPath,['tests/stage11-ravine-completion-capture.mjs'],{cwd:root,encoding:'utf8',env:{...process.env,HONRO_CAPTURE_APPROVED_RAVINE_COMPLETION:'1'}});
assert.notEqual(capture.status,0);assert.match(capture.stderr,/Refusing to overwrite a frozen completion revision/);
for(const name of ['current-runtime-contract-helpers','stage11-ravine-completion-history-helpers','objective-delta-helpers','objective-legacy-helpers'])await import('./'+name+'.mjs');
console.log('Pinned fixture storage: exact seven hashes, original approval/helper assertions, plain/gzip, corruption/truncation, and pin/capture guards passed.');
