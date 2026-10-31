import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,cp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {packWorld,readWorldSource,materializeWorld,defaultDirectory,chunkBytes} from '../tools/act4-source/world-source.mjs';
const scratch=async fn=>{const directory=await mkdtemp(path.join(os.tmpdir(),'honro-act4-source-'));try{await fn(directory);}finally{await rm(directory,{recursive:true,force:true});}};
test('real canonical chunks reconstruct clean checkout byte-for-byte',()=>scratch(async directory=>{
 const original=await readFile(path.join(defaultDirectory,'world.json'));
 await cp(path.join(defaultDirectory,'world.parts'),path.join(directory,'world.parts'),{recursive:true});
 const result=await materializeWorld({directory});assert.equal(result.created,true);
 assert.equal(result.sha256,'801df923ce89d8747f337f0b71e2ae38c604a8efbd6250d56e885b931af9f1b5');
 assert.deepEqual(await readFile(path.join(directory,'world.json')),original);
 assert.equal((await materializeWorld({directory})).created,false);
 const {manifest}=await readWorldSource(directory);assert.equal(manifest.parts.length,16);
 assert(manifest.parts.every(p=>p.bytes<=chunkBytes));
 // Worst-case JSON escaping and base64 each remain comfortably below16MiB.
 for(const p of manifest.parts){const b=await readFile(path.join(directory,'world.parts',p.file));assert(Buffer.byteLength(JSON.stringify({content:b.toString('utf8')}))<8*1024*1024);assert(Buffer.byteLength(JSON.stringify({content:b.toString('base64')}))<4*1024*1024);}
}));
test('multibyte boundary, unpacked edit protection, deterministic repack',()=>scratch(async directory=>{
 const original=Buffer.from(JSON.stringify({text:'가나다😀'.repeat(200000)}));
 await writeFile(path.join(directory,'world.json'),original);const first=await packWorld({directory});
 assert(first.parts.length>1);assert.deepEqual((await readWorldSource(directory)).bytes,original);
 assert.deepEqual(await packWorld({directory}),first);
 await writeFile(path.join(directory,'world.json'),'{}');
 await assert.rejects(materializeWorld({directory}),/unpacked edits/);
 assert.equal(await readFile(path.join(directory,'world.json'),'utf8'),'{}');
 await packWorld({directory});assert.equal((await readWorldSource(directory)).bytes.toString(),'{}');
}));
test('tampered, missing, reordered and path-escaping parts fail closed',()=>scratch(async directory=>{
 await writeFile(path.join(directory,'world.json'),'{}');await packWorld({directory});
 const folder=path.join(directory,'world.parts'),manifestPath=path.join(folder,'manifest.json');
 const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
 await writeFile(path.join(folder,'part-000.jsonpart'),'[]');await assert.rejects(readWorldSource(directory),/checksum mismatch/);
 await rm(path.join(folder,'part-000.jsonpart'));await assert.rejects(readWorldSource(directory),{code:'ENOENT'});
 for(const file of ['part-001.jsonpart','../world.json','/tmp/world.json']){await writeFile(manifestPath,JSON.stringify({...manifest,parts:[{...manifest.parts[0],file}]}));await assert.rejects(readWorldSource(directory),/Invalid Act4 source part/);}
}));
