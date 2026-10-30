import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {unpackJson} from '../shared/json-pool.mjs';
import {runtimeDigest} from '../tools/stage31/probes.mjs';
import {selectPublishedGenerations} from '../shared/web-retention.mjs';
const baseline=process.argv[2]||'a6da24cc7b5c9df33b56b3cf592d7260fd6ad7db',output=process.argv[3]||'_local/reports/size-audit/final-proof.json';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),jsonHash=x=>hash(JSON.stringify(x));
const source=(file,old=false)=>old?execFileSync('git',['show',`${baseline}:${file}`],{maxBuffer:64*1024*1024}):fs.readFileSync(file);
const json=(file,old=false)=>JSON.parse(source(file,old));
function load(file,old=false,encoding){let j=json(file,old);if(j?.$honroJsonParts===1)j=JSON.parse(Buffer.concat(j.parts.map(part=>source(part.path,old))));return encoding==='json-pool-v1'?unpackJson(j):j;}
const before=json('web/manifest.json',true),after=json('web/manifest.json'),old=load(before.project,true),now=load(after.project),oldLibrary=load(old.library,true);
assert(!now.library,'new full library monolith absent');
assert(!after.files.some(f=>/^web\/data\/campaign-library[.-]/.test(f.path)),'no current monolith or monolith parts');
assert(!after.files.some(f=>f.path.endsWith('.bin')),'no current JSON transport byte parts');
const shared=load(now.shared,false,now.assetEncodings.shared),bundles=now.stageLibraries.map((f,i)=>load(f,false,now.assetEncodings.stageLibraries[i])),extras=load(now.editorExtras,false,now.assetEncodings.editorExtras);
const map=new Map([...shared,...bundles.flat(),...extras].map(asset=>[asset.id,asset]));
assert.equal(map.size,now.libraryOrder.length);const library=now.libraryOrder.map(id=>map.get(id));
assert.equal(jsonHash(library),jsonHash(oldLibrary),'entire1090asset library exactly restored in original order');
assert.equal(jsonHash(shared),jsonHash(load(old.shared,true)));
assert.equal(jsonHash(load(now.base)),jsonHash(load(old.base,true)));
const seen=new WeakSet();let independentObjects=0;function visit(v){if(!v||typeof v!=='object')return;assert(!seen.has(v),'JSON objects must not become aliased by pooling');seen.add(v);independentObjects++;for(const child of Object.values(v))visit(child);}visit(library);
const stats=(file,old=false)=>{const j=json(file,old),files=j?.$honroJsonParts===1?[file,...j.parts.map(p=>p.path)]:[file];return{bytes:files.reduce((s,f)=>s+source(f,old).length,0),gzip:files.reduce((s,f)=>s+gzipSync(source(f,old),{level:9}).length,0)};};
const stageProof=[];for(let i=0;i<now.stages.length;i++){
 assert.equal(jsonHash(load(now.stages[i])),jsonHash(load(old.stages[i],true)),`stage${i+1} geometry/state data unchanged`);
 assert.equal(jsonHash(bundles[i]),jsonHash(load(old.stageLibraries[i],true)),`stage${i+1} asset closure unchanged`);
 const oldParts=[old.shared,old.stageLibraries[i],old.stages[i]].map(f=>stats(f,true)),newParts=[now.shared,now.stageLibraries[i],now.stages[i]].map(f=>stats(f));
 stageProof.push({stage:i+1,encoding:now.assetEncodings.stageLibraries[i],stageSHA256:jsonHash(load(now.stages[i])),assetsSHA256:jsonHash(bundles[i]),assetBytesBefore:stats(old.stageLibraries[i],true),assetBytesAfter:stats(now.stageLibraries[i]),coldJSONBefore:{bytes:oldParts.reduce((s,x)=>s+x.bytes,0),gzip:oldParts.reduce((s,x)=>s+x.gzip,0)},coldJSONAfter:{bytes:newParts.reduce((s,x)=>s+x.bytes,0),gzip:newParts.reduce((s,x)=>s+x.gzip,0)}});
}
const currentSum=m=>m.files.reduce((s,f)=>s+f.bytes,0),currentJSON=m=>m.files.filter(f=>f.path.startsWith('web/data/')).reduce((s,f)=>s+f.bytes,0),retainedSum=m=>m.previousFiles.reduce((s,f)=>s+f.bytes,0);
let verifiedFiles=0;for(const f of new Map([...after.files,...after.previousFiles].map(f=>[f.path,f])).values()){const b=source(f.path);assert.equal(b.length,f.bytes);assert.equal(hash(b),f.sha256);verifiedFiles++;}
const retentionAt=process.argv[4]?Date.parse(process.argv[4]):Date.now();assert(Number.isFinite(retentionAt),'valid recorded build retention time');
const expectedPublished=selectPublishedGenerations(before.publishedGenerations,{now:retentionAt});assert.deepEqual(after.publishedGenerations,expectedPublished,'published retention unchanged policy and original records');
const fullFiles=[now.shared,...now.stageLibraries,now.editorExtras],uniqueFull=[...new Set(fullFiles)];
const runtimeSHA256=await runtimeDigest();
assert.equal(runtimeSHA256,'7652daac71dc2c7c6ea02b438ce10105a26e1ac008b36258ad08e2835ee14fd9');
assert.equal(hash(source('shared/data/act4/world.json')),'801df923ce89d8747f337f0b71e2ae38c604a8efbd6250d56e885b931af9f1b5');
const report={retentionVerifiedAt:new Date(retentionAt).toISOString(),runtimeSHA256,status:'pass',baselineCommit:baseline,worldSHA256:hash(source('shared/data/act4/world.json')),librarySHA256:jsonHash(library),libraryCount:library.length,editorExtras:extras.length,independentObjects,currentGraph:{before:currentSum(before),after:currentSum(after)},currentJSON:{before:currentJSON(before),after:currentJSON(after)},retainedExtraUnique:{before:retainedSum(before),after:retainedSum(after)},publishedGraphs:{before:before.publishedGenerations.length,after:after.publishedGenerations.length,naturallyExpired:before.publishedGenerations.length-after.publishedGenerations.length},manifestBytes:{before:source('web/manifest.json',true).length,after:source('web/manifest.json').length},fullLibraryTransport:{before:stats(old.library,true),after:{bytes:uniqueFull.reduce((s,f)=>s+stats(f).bytes,0)+Buffer.byteLength(JSON.stringify(now.libraryOrder)),gzip:uniqueFull.reduce((s,f)=>s+stats(f).gzip,0)+gzipSync(JSON.stringify(now.libraryOrder),{level:9}).length}},currentFiles:after.files.length,verifiedCurrentAndRetainedFiles:verifiedFiles,noCurrentByteParts:true,stages:stageProof,scope:'Exact JSON/canonical source identity and immutable-file integrity; gzip figures are local estimates, not observed wire transfer. Currentgraph bytes are not startup download bytes. Browser loading/visual validation recorded separately.'};
fs.mkdirSync(output.slice(0,output.lastIndexOf('/')),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,stages:report.stages.filter(x=>[31,38,39,40].includes(x.stage))},null,2));
