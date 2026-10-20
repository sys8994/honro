/** Public-output blocking and preview isolation only; no visual approval. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,lstat,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {buildOutput} from '../shared/web-build.mjs';
import {checkArtReview} from '../tools/release/art-review.mjs';
import {prepareRelease} from '../tools/release/prepare.mjs';

const root=path.resolve(import.meta.dirname,'..');
const npm=process.platform==='win32'?'npm.cmd':'npm';
const protectedRoots=['HONRO.html','index.html','HONRO_WORKSHOP.html','workshop/HONRO_MAP_WORKSHOP.html','web','shared/assets/party','shared/assets/monsters','shared/assets/actors','_local/reports/web-split','_local/reports/party-forge','_local/reports/monster-forge','_local/reports/actor-forge'];
async function snapshot(){
  const result={};
  async function walk(file){
    const absolute=path.join(root,file);let stat;
    try{stat=await lstat(absolute);}catch(error){if(error.code==='ENOENT')return;throw error;}
    if(stat.isDirectory())for(const name of (await readdir(absolute)).sort())await walk(file+'/'+name);
    else if(stat.isFile())result[file]=createHash('sha256').update(await readFile(absolute)).digest('hex');
    else assert.fail('Unexpected symlink in protected output: '+file);
  }
  for(const file of protectedRoots)await walk(file);
  return result;
}
const isolated=()=>path.join(root,'_local/preview','gate-test-'+randomUUID());

test('preview output rejects public roots, traversal, external destinations and symlink aliases',async t=>{
  for(const outputRoot of [root,path.join(root,'web'),path.join(root,'_local/preview'),path.join(root,'_local/preview/name/../../..'),'/tmp/honro-preview'])await assert.rejects(buildOutput({preview:true,outputRoot}),/isolated directory/);
  await assert.rejects(buildOutput({outputRoot:isolated()}),/Public builds/);
  const outputRoot=isolated();await mkdir(outputRoot,{recursive:true});t.after(()=>rm(outputRoot,{recursive:true,force:true}));
  await assert.rejects(buildOutput({preview:true,outputRoot,destination:path.join(root,'HONRO.html')}),/stay inside outputRoot/);
  await symlink(path.join(root,'web'),path.join(outputRoot,'web'),'dir');
  const target=await buildOutput({preview:true,outputRoot});
  await assert.rejects(target.output('web/manifest.json'),/symlink/);
  await assert.rejects(target.output('../HONRO.html'),/escaped outputRoot/);
  const alias=isolated();await symlink(root,alias,'dir');t.after(()=>rm(alias,{force:true}));
  await assert.rejects(buildOutput({preview:true,outputRoot:alias}),/symlink/);
});

test('ordinary npm build and release preparation stop before public writes on current failed review',async t=>{
  const review=await checkArtReview();
  if(review.status!=='blocked'){t.skip('Current real candidate is no longer blocked; schema negatives remain in art-review-gate.mjs');return;}
  const before=await snapshot(),result=spawnSync(npm,['run','build'],{cwd:root,encoding:'utf8',maxBuffer:2*1024*1024});
  assert.notEqual(result.status,0);assert.match(result.stdout+result.stderr,/Art review blocked before public output; build: not-run/);
  const prepared=await prepareRelease();assert.equal(prepared.build,'not-run');assert.equal(prepared.exitCode,1);
  assert.deepEqual(await snapshot(),before,'Blocked public commands must leave all public generated files and source assets unchanged');
});

test('real preview CLI writes and prunes only its isolated tree while public hashes remain unchanged',async t=>{
  const outputRoot=isolated();await mkdir(path.join(outputRoot,'web/data'),{recursive:true});t.after(()=>rm(outputRoot,{recursive:true,force:true}));
  const obsolete='web/data/obsolete-preview-only.json';await writeFile(path.join(outputRoot,obsolete),'preview obsolete asset');
  // A third old generation must be removed only from the preview tree.
  const file=(name)=>({path:'web/data/'+name+'.json'});
  await writeFile(path.join(outputRoot,'web/manifest.json'),JSON.stringify({files:[file('last-preview')],previousGenerations:[[file('older-preview')],[{path:obsolete}]]}));
  const before=await snapshot();
  const result=spawnSync(npm,['run','build:preview','--','--output',path.relative(root,outputRoot)],{cwd:root,encoding:'utf8',maxBuffer:2*1024*1024});
  assert.equal(result.status,0,result.stdout+'\n'+result.stderr);assert.match(result.stdout,/Candidate preview only/);
  assert.deepEqual(await snapshot(),before,'Preview must not modify public files, generated source assets, or root build reports');
  for(const file of ['HONRO.html','index.html','HONRO_WORKSHOP.html','workshop/HONRO_MAP_WORKSHOP.html','web/manifest.json','_local/reports/web-split/build.json'])assert((await lstat(path.join(outputRoot,file))).isFile(),file);
  await assert.rejects(lstat(path.join(outputRoot,obsolete)),{code:'ENOENT'});
  const manifest=JSON.parse(await readFile(path.join(outputRoot,'web/manifest.json'),'utf8'));
  for(const record of manifest.files){
    const bytes=await readFile(path.join(outputRoot,record.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,record.path);
  }
  for(const name of await readdir(path.join(root,'assets/bgm')))if(/\.mp3$/i.test(name))assert.deepEqual(await readFile(path.join(outputRoot,'assets/bgm',name)),await readFile(path.join(root,'assets/bgm',name)));
  const report=JSON.parse(await readFile(path.join(outputRoot,'_local/reports/web-split/build.json'),'utf8'));assert.equal(report.outputRoot,outputRoot);assert.equal(report.preview,true);
});
