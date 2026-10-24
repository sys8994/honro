import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,mkdtemp,rm,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {audit} from '../tools/testing/audit-portrait-variants.mjs';
const baseline='e975a63646af0e55f1a5c2edc01a5cca22cbe8c9',sha=b=>createHash('sha256').update(b).digest('hex'),json=async p=>JSON.parse(await readFile(p,'utf8')),old=p=>JSON.parse(execFileSync('git',['show',baseline+':'+p],{maxBuffer:20e6}));
const h=await json('game/config/story-portraits.json'),n=await json('game/config/npc-portraits.json'),m=await json('art/portraits/variants-v2-20261024/manifest.json'),encoding=await json('shared/assets/portraits/variants-v2-20261024/encoding.json');
const promptDir='art/portraits/variants-v2-20261024/prompts',prompts=await Promise.all((await readdir(promptDir)).map(p=>json(promptDir+'/'+p)));
assert.equal(m.images.length,32);assert.equal(new Set(m.images.map(r=>r.identity+'|'+r.expression)).size,32);
// Every existing base/variant/config fact remains exact; only new expression entries are added.
const strippedH=structuredClone(h),strippedN=structuredClone(n);let sourceBytes=0,runtimeBytes=0;
for(const r of m.images){
 const hero=Object.values(h).find(p=>p.approvedPortrait?.id===r.identity),a=hero?.approvedPortrait.expressions[r.expression]||n.assets[r.identity]?.expressions?.[r.expression];
 const prompt=prompts.find(p=>p.id===r.file.split('/').at(-1).replace('.png',''));assert(prompt);assert.equal(a.identityMasterSha256,prompt.references.find(p=>p.identity===r.identity).sha256);assert.equal(sha(await readFile(a.identityMaster)),a.identityMasterSha256);
 assert.equal(a.status,'ready');assert.equal(a.source,r.file);assert.equal(a.sourceSha256,r.sha256);
 const png=await readFile(r.file),webp=await readFile(a.file),meta=await sharp(webp).metadata(),stats=await sharp(webp).stats();assert.equal(sha(png),r.sha256);assert.equal(png.length,r.bytes);assert.equal(meta.width,768);assert.equal(meta.height,1152);assert(meta.hasAlpha);assert.equal(stats.channels[3].min,0);assert.deepEqual(await sharp(webp).extractChannel(3).raw().toBuffer(),await sharp(png).resize(768).extractChannel(3).raw().toBuffer(),'Q100 alpha matches standard resized source');assert.equal(a.framing.dialogue.top<=0,true);assert(a.framing.dialogue.maxHeight>=896);sourceBytes+=png.length;runtimeBytes+=webp.length;
 const row=encoding.rows.find(x=>x.source===r.file);assert.equal(row.encodedSha256,sha(webp));
 if(hero)delete Object.values(strippedH).find(p=>p.approvedPortrait?.id===r.identity).approvedPortrait.expressions[r.expression];else delete strippedN.assets[r.identity].expressions[r.expression];
}
for(const a of Object.values(strippedN.assets))if(a.expressions&&!Object.keys(a.expressions).length)delete a.expressions;
const preservedFiles=new Set([...Object.values(strippedH).flatMap(p=>Object.values(p.approvedPortrait?.expressions||{})),...Object.values(strippedN.assets).flatMap(a=>[a,...Object.values(a.expressions||{})])].filter(a=>a.file).map(a=>a.file));
for(const file of preservedFiles)assert.equal(sha(await readFile(file)),sha(execFileSync('git',['show',baseline+':'+file],{maxBuffer:20e6})),file+' existing encoded bytes');
assert.deepEqual(strippedH,old('game/config/story-portraits.json'));assert.deepEqual(strippedN,old('game/config/npc-portraits.json'));
assert.equal(await readFile('shared/data/narrative-current.json','utf8'),execFileSync('git',['show',baseline+':shared/data/narrative-current.json'],{encoding:'utf8',maxBuffer:20e6}));
const data=await json('shared/data/narrative-current.json'),result=await audit(data),cwd=process.cwd(),temp=await mkdtemp(cwd+'/_local/portrait-baseline-');let before;
try{
 for(const file of ['game/config/portrait-variants.json','game/docs/portrait-variants-20261023/approved-row-tags.json','game/docs/portrait-variants-20261023/editorial-exclusions.json','game/config/npc-portraits.json','game/config/story-portraits.json','game/docs/portrait-variants-20261023/editorial-value-reviews.json','shared/runtime/portraits.js','shared/runtime/npc-portraits.js']){await mkdir(temp+'/'+file.slice(0,file.lastIndexOf('/')),{recursive:true});await writeFile(temp+'/'+file,execFileSync('git',['show',baseline+':'+file],{maxBuffer:20e6}));}
 process.chdir(temp);before=await audit(data);
}finally{process.chdir(cwd);await rm(temp,{recursive:true,force:true});}
assert.deepEqual(result.errors,before.errors,'Existing editorial audit findings unchanged; no rewritten dialogue');
assert(result.summary.pendingRows<before.summary.pendingRows);
await mkdir('_local/reports/portrait-variants32',{recursive:true});await writeFile('_local/reports/portrait-variants32/native.json',JSON.stringify({baseline,sourceBytes,runtimeBytes,beforeSummary:before.summary,summary:result.summary,pending:result.pending,existingEditorialErrors:result.errors},null,2));
console.log(JSON.stringify({registered:32,sourceBytes,runtimeBytes,summary:result.summary,pending:result.pending.map(x=>({identity:x.identity,expression:x.portraitExpression,count:x.count})),existingEditorialErrors:result.errors.length}));
