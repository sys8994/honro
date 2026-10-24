import assert from 'node:assert/strict';
import {readFile,access,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {graphSha256} from '../shared/web-retention.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),inventory=JSON.parse(await readFile('game/docs/retired-art-providers-p22-20261024/inventory.json')),base=inventory.base;
const get=path=>execFileSync('git',['show',base+':'+path],{maxBuffer:32e6});
for(const f of inventory.files){const original=get(f.path);assert.equal(original.length,f.bytes);assert.equal(hash(original),f.sha256);await assert.rejects(access(f.path));if(f.movedTo)assert.deepEqual(await readFile(f.movedTo),original);}
const build=await readFile('shared/build.mjs','utf8');assert.equal(build,get('shared/build.mjs').toString());for(const f of inventory.files)assert(!build.includes(f.path));
const overlay=await readFile('review/shared-terrain-interior/source-overlay.mjs','utf8');assert.equal(overlay,get('review/shared-terrain-interior/source-overlay.mjs').toString().replace("readFile(root+'shared/runtime/vector-campaign-art.js'","readFile(root+'migration/legacy/runtime/vector-campaign-art.js'"));
for(const f of ['renderer','main','environment-renderer','terrain-readability','stage18-bell-art','act1-spatial-art'])assert(!/HonroPaintedPresentation|HonroStage21Painted|HonroPaintedPilots|HonroStage[346]LocationArt/.test(await readFile('shared/runtime/'+f+'.js','utf8')));
// Protect pixel/culling/cache arithmetic beyond the retired conditional branches.
const renderer=await readFile('shared/runtime/renderer.js','utf8'),oldRenderer=get('shared/runtime/renderer.js').toString();assert.equal(renderer.slice(renderer.indexOf('                const matrix=c.getTransform()'),renderer.indexOf('        renderCacheStats()')),oldRenderer.slice(oldRenderer.indexOf('                const matrix=c.getTransform()'),oldRenderer.indexOf('        renderCacheStats()')));assert(renderer.includes('limit=w<900?12:24'));
const bell=await readFile('shared/runtime/stage18-bell-art.js','utf8'),oldBell=get('shared/runtime/stage18-bell-art.js').toString();assert.equal(bell.slice(bell.indexOf('function drawBell('),bell.indexOf('const landmarks=')),oldBell.slice(oldBell.indexOf('function drawBell('),oldBell.indexOf('const landmarks=')));
execFileSync('git',['diff','--exit-code',base,'--','shared/assets','shared/engine','shared/map','shared/data','game/src','shared/runtime/vector-campaign-config.js']);
const m=JSON.parse(await readFile('web/manifest.json')),old=JSON.parse(get('web/manifest.json')),seen=new Map();
async function audit(files){for(const f of files){if(seen.has(f.path)){assert.equal(seen.get(f.path),f.sha256);continue;}const b=await readFile(f.path);assert.equal(b.length,f.bytes);assert.equal(hash(b),f.sha256);seen.set(f.path,f.sha256);}}
await audit(m.files);await audit(old.files);for(const p of old.publishedGenerations)assert.deepEqual(m.publishedGenerations.find(q=>q.graphSha256===p.graphSha256),p);
for(const p of m.publishedGenerations){const source=JSON.parse(execFileSync('git',['show',p.sourceSha+':web/manifest.json'],{maxBuffer:32e6}));assert.equal(graphSha256(source.files),p.graphSha256);await audit(p.files);}
const result={deleted:17,deletedProviderBytes:inventory.files.filter(f=>!f.movedTo).reduce((n,f)=>n+f.bytes,0),movedBytes:inventory.files.find(f=>f.movedTo).bytes,inventoryHashesExact:true,activeFiles:m.files.length,activeBytes:m.files.reduce((n,f)=>n+f.bytes,0),previousActiveBytes:old.files.reduce((n,f)=>n+f.bytes,0),published:m.publishedGenerations.length,uniqueFiles:seen.size,entry:m.gameEntry,manifestSha256:hash(await readFile('web/manifest.json')),protectedAssetsEngineMapsDataCssUnchanged:true};
await mkdir('_local/reports/retired-art-providers-p22',{recursive:true});await writeFile('_local/reports/retired-art-providers-p22/contracts.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
