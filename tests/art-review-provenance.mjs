/** Synthetic source provenance checks. No actual art records or screenshots. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm, symlink} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {makeSourceState, verifySourceState} from '../tools/release/art-review-provenance.mjs';
import {sourceHash} from '../tools/release/art-review.mjs';

const exec=promisify(execFile), sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function fixture() {
 const root=await mkdtemp(path.join(os.tmpdir(),'honro-art-provenance-'));
 const configPath='game/docs/art-review/current.json';
 for(const d of ['game/docs/art-review','art/source'])await mkdir(path.join(root,d),{recursive:true});
 const scope={version:1,scope:'synthetic-provenance',manifest:'game/docs/art-review/manifest.json',sourcePaths:['art/source','art/standalone.mjs'],stages:[1],criteria:[{id:'hierarchy',description:'Preserve this exact visual hierarchy criterion.'}]};
 await writeFile(path.join(root,configPath),JSON.stringify(scope,null,2)+'\n');
 await writeFile(path.join(root,'art/source/a.js'),'const 벡터 = "original bytes";\n');
 await writeFile(path.join(root,'art/source/b.bin'),Buffer.from([0,1,2,255]));
 await writeFile(path.join(root,'art/standalone.mjs'),'');
 const git=async(...args)=>(await exec('git',args,{cwd:root})).stdout.trim();
 await git('init','--quiet');
 await git('add','--','art');
 await git('-c','user.name=synthetic-test','-c','user.email=test@example.invalid','commit','--quiet','-m','Synthetic source baseline');
 const first=await makeSourceState({root,configPath,statePath:'_local/round-1/state.json'});
 return{root,configPath,scope,first,git};
}
const using=fn=>async()=>{const f=await fixture();try{await fn(f);}finally{await rm(f.root,{recursive:true,force:true});}};
async function record(f,state=f.first.state){return JSON.parse(await readFile(path.join(f.root,state.path),'utf8'));}
async function rewrite(f,mutate,state=f.first.state){
 const value=await record(f,state);await mutate(value);const bytes=Buffer.from(JSON.stringify(value));
 await writeFile(path.join(f.root,state.path),bytes);return{path:state.path,sha256:sha(bytes)};
}
const verify=(f,state=f.first.state,expectedHash=f.first.sourceHash,scope=f.scope)=>verifySourceState({root:f.root,state,expectedHash,scope});

test('source snapshot exactly reconstructs existing config-first sorted content framing, including UTF-8 and binary/empty files',using(async f=>{
 assert.equal(f.first.sourceHash,await sourceHash(f.root,f.configPath,f.scope));
 assert.equal(f.first.verification.files.length,3);
 assert(f.first.verification.files.every(row=>row.gitCommit&&row.gitCommit.length===40&&!row.snapshot));
 assert.equal(f.first.verification.config.snapshot,'_local/round-1/state.json.files/scope-config.json');
 assert.equal((await verify(f)).sourceHash,f.first.sourceHash);
}));
test('earlier and changed source states each verify their actual bytes; modified and untracked names use preserved artifacts',using(async f=>{
 await writeFile(path.join(f.root,'art/source/a.js'),'a different unfinished vector candidate\n');
 await writeFile(path.join(f.root,'art/source/unfinished-candidate.js'),'not yet final art');
 const second=await makeSourceState({root:f.root,configPath:f.configPath,statePath:'_local/round-2/state.json'});
 assert.notEqual(second.sourceHash,f.first.sourceHash);
 assert.equal(second.sourceHash,await sourceHash(f.root,f.configPath,f.scope));
 assert.equal((await verify(f)).sourceHash,f.first.sourceHash,'old Git blobs remain verifiable after working source changes');
 const checked=await verify(f,second.state,second.sourceHash);
 assert.equal(checked.files.filter(r=>r.snapshot).length,2);
 assert.equal(checked.files.filter(r=>r.gitCommit).length,2);
 await assert.rejects(verify(f,f.first.state,second.sourceHash),/provenance digest mismatch/);
 await assert.rejects(verify(f,second.state,f.first.sourceHash),/provenance digest mismatch/);
}));
test('inventing hashes for any of the first four review rounds is blocked by actual source reconstruction',using(async f=>{
 for(let round=1;round<=4;round++) {
  const invented='sha256:'+String(round).repeat(64);
  await assert.rejects(verify(f,f.first.state,invented),/Source provenance digest mismatch/);
 }
}));
test('changed state JSON, changed config snapshot and changed source artifact bytes cannot keep their old checksums',using(async f=>{
 const original=await readFile(path.join(f.root,f.first.state.path));
 await writeFile(path.join(f.root,f.first.state.path),Buffer.concat([original,Buffer.from(' ')]));
 await assert.rejects(verify(f),/state bytes\/hash mismatch/);
 await writeFile(path.join(f.root,f.first.state.path),original);
 const state=await record(f);
 await writeFile(path.join(f.root,state.config.snapshot),'changed config bytes');
 await assert.rejects(verify(f),/config snapshot bytes\/hash mismatch/);
 await writeFile(path.join(f.root,'art/source/a.js'),'changed candidate');
 const second=await makeSourceState({root:f.root,configPath:f.configPath,statePath:'_local/changed/state.json'});
 const secondRecord=await record(f,second.state),row=secondRecord.files.find(r=>r.snapshot);
 await writeFile(path.join(f.root,row.snapshot),'artifact changed after capture');
 await assert.rejects(verify(f,second.state,second.sourceHash),/blob bytes\/hash mismatch/);
}));
test('historical criteria IDs, exact wording and scope identity cannot be weakened while keeping source additions possible',using(async f=>{
 for(const change of [s=>s.criteria[0].description='Easier altered requirement',s=>s.criteria[0].id='different',s=>s.scope='other-scope']) {
  const current=structuredClone(f.scope);change(current);
  await assert.rejects(verify(f,f.first.state,f.first.sourceHash,current),/scope\/criteria wording/);
 }
 const expanded=structuredClone(f.scope);expanded.sourcePaths.push('art/new-source.js');
 await writeFile(path.join(f.root,'art/new-source.js'),'new explicitly related art file');
 assert.equal((await verify(f,f.first.state,f.first.sourceHash,expanded)).sourceHash,f.first.sourceHash);
 const removed=structuredClone(f.scope);removed.sourcePaths=['art/source'];
 await assert.rejects(verify(f,f.first.state,f.first.sourceHash,removed),/Historical sourcePaths were removed/);
}));
test('missing configured files, duplicate originals, arbitrary extra snapshot inventory and renamed directories are rejected',using(async f=>{
 const original=await readFile(path.join(f.root,f.first.state.path));
 for(const [mutate,pattern]of [
  [r=>{r.files=r.files.filter(x=>x.path!=='art/standalone.mjs');},/Missing configured source entry/],
  [r=>{r.files.push(structuredClone(r.files[0]));},/Duplicate original source/],
  [r=>{r.files.push({...r.files[0],path:'unrelated/arbitrary.js'});},/outside configured/],
  [r=>{r.files[0].path='art/standalone.mjs/arbitrary-child.js';},/Missing configured|outside configured|ENOTDIR/],
  [r=>{r.files=r.files.filter(x=>x.path!=='art/source/a.js');},/provenance digest mismatch/],
 ]) {
  await writeFile(path.join(f.root,f.first.state.path),original);
  const changed=await rewrite(f,mutate);await assert.rejects(verify(f,changed),pattern);
 }
}));
test('exactly one immutable Git blob or separately preserved snapshot is required for every source',using(async f=>{
 const original=await readFile(path.join(f.root,f.first.state.path));
 let changed=await rewrite(f,r=>{r.files[0].snapshot='somewhere.js';});
 await assert.rejects(verify(f,changed),/Exactly one snapshot or gitCommit/);
 await writeFile(path.join(f.root,f.first.state.path),original);
 changed=await rewrite(f,r=>{delete r.files[0].gitCommit;});await assert.rejects(verify(f,changed),/Exactly one snapshot or gitCommit/);
 await writeFile(path.join(f.root,f.first.state.path),original);
 changed=await rewrite(f,r=>{r.files[0].gitCommit='HEAD';});await assert.rejects(verify(f,changed),/Full immutable gitCommit/);
 await writeFile(path.join(f.root,f.first.state.path),original);
 changed=await rewrite(f,r=>{r.files[0].sha256='0'.repeat(64);});await assert.rejects(verify(f,changed),/blob bytes\/hash mismatch/);
}));
test('manifest/state self-reference and path traversal cannot enter original files or snapshot artifacts',using(async f=>{
 const original=await readFile(path.join(f.root,f.first.state.path));
 for(const [mutate,pattern]of [
  [r=>{r.files.push({...r.files[0],path:f.scope.manifest});},/self-reference/],
  [r=>{r.files.push({...r.files[0],path:f.first.state.path});},/self-reference/],
  [r=>{r.files[0].path='../escape.js';},/Repository-relative/],
  [r=>{delete r.files[0].gitCommit;r.files[0].snapshot='../escape.js';},/Repository-relative/],
  [r=>{delete r.files[0].gitCommit;r.files[0].snapshot=r.files[0].path;},/Separate source snapshot/],
 ]){
  await writeFile(path.join(f.root,f.first.state.path),original);
  const changed=await rewrite(f,mutate);await assert.rejects(verify(f,changed),pattern);
 }
}));
test('symlink artifacts and workspace original-source symlinks are rejected',using(async f=>{
 const value=await record(f),snapshot=value.config.snapshot,bytes=await readFile(path.join(f.root,snapshot));
 await writeFile(path.join(f.root,'real-config.json'),bytes);await rm(path.join(f.root,snapshot));
 await symlink(path.join(f.root,'real-config.json'),path.join(f.root,snapshot));
 await assert.rejects(verify(f),/Symlink source\/snapshot/);
 await rm(path.join(f.root,snapshot));await writeFile(path.join(f.root,snapshot),bytes);
 await rm(path.join(f.root,'art/source/a.js'));await symlink('b.bin',path.join(f.root,'art/source/a.js'));
 await assert.rejects(verify(f),/Symlink original source/);
}));
test('Git symlink entries are not regular source blobs even if their bytes/hash would match',using(async f=>{
 await symlink('a.js',path.join(f.root,'art/source/link.js'));await f.git('add','--','art/source/link.js');
 await f.git('-c','user.name=synthetic-test','-c','user.email=test@example.invalid','commit','--quiet','-m','Synthetic symlink fixture');
 const commit=await f.git('rev-parse','HEAD');
 await rm(path.join(f.root,'art/source/link.js'));
 const changed=await rewrite(f,r=>{r.files.push({path:'art/source/link.js',gitCommit:commit,sha256:sha(Buffer.from('a.js'))});});
 await assert.rejects(verify(f,changed),/not a symlink\/directory/);
}));
test('snapshot helper cannot write inside source directories or overwrite an existing preserved state',using(async f=>{
 await assert.rejects(makeSourceState({root:f.root,configPath:f.configPath,statePath:'art/source/state.json'}),/outside sourcePaths/);
 await assert.rejects(makeSourceState({root:f.root,configPath:f.configPath,statePath:f.first.state.path}),/EEXIST/);
 assert.equal((await verify(f)).sourceHash,f.first.sourceHash);
}));
