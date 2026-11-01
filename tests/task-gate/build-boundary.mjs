import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,symlink,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildOutputRoot} from '../../tools/quality-gate/build-boundary.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const before=await Promise.all(['HONRO.html','web/manifest.json'].map(p=>readFile(path.join(root,p))));
for(const cmd of [['workshop/build.mjs'],['game/build.mjs'],['--input-type=module','-e',"import {buildWeb} from './shared/web-build.mjs';await buildWeb({vector:false});"]]){
 const p=spawnSync(process.execPath,cmd,{cwd:root,encoding:'utf8',env:{...process.env,HONRO_SKIP_GATE:'1',HONRO_FORCE_RELEASE:'1'}});
 assert.notEqual(p.status,0,'unmeasured production build must be blocked');assert.match(p.stderr,/Production quality gate BLOCKED/);
}
const after=await Promise.all(['HONRO.html','web/manifest.json'].map(p=>readFile(path.join(root,p))));assert(before.every((b,i)=>b.equals(after[i])),'blocked build touched public files');
const temp=await mkdtemp(path.join(tmpdir(),'honro-preview-test-'));
try{
 const p=await buildOutputRoot(temp,'valid-preview');assert.equal(p,path.join(temp,'_local/previews/valid-preview'));
 await assert.rejects(()=>buildOutputRoot(temp,'../escape'));
 const other=await mkdtemp(path.join(tmpdir(),'honro-preview-outside-'));
 try{await symlink(other,path.join(temp,'_local/previews/linked'));await assert.rejects(()=>buildOutputRoot(temp,'linked'));}finally{await rm(other,{recursive:true,force:true});}
}finally{await rm(temp,{recursive:true,force:true});}
console.log('PASS: 3 production entry points block missing evidence; fake bypass env ignored; public bytes unchanged; preview traversal/symlink denied.');
