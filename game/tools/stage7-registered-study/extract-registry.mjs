import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import {buildOriginalAct1SiteBody} from '../../../tools/map-forge/act1-naru-doldang.mjs';
import {finishStage7Body,loadStage7TerrainFinish} from '../../../tools/map-forge/stage7-terrain-finish.mjs';
const out=process.argv[2]||'artifacts/stage7-registry-extract';await mkdir(out,{recursive:true});
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const registryText=await readFile(new URL('../../../shared/data/terrain-path-optimization.json',import.meta.url),'utf8');const registry=JSON.parse(registryText);
const entries=registry.filter(e=>e.id==='act1-site:7:body');assert.equal(entries.length,1);const entry=entries[0];
const sourceData=JSON.parse(await readFile(new URL('../../../shared/assets/environment/act1-sites/stage07.json',import.meta.url),'utf8'));
const raw=buildOriginalAct1SiteBody(sourceData,7),rawSnapshot=JSON.stringify(raw);assert.equal(sha(raw),entry.original,'Frozen recipe must match actual independent original raw');
assert.equal(entry.paths.length,5,'Unexpected old source recipe size');
for(const [p,key]of entry.paths){assert.deepEqual(p.slice(0,2),['symbols','source'],'Recipe must affect only authoritative source');assert(['d','dParts'].includes(key));}
function recipe(vector){const v=structuredClone(vector);for(const [p,key,value]of entry.paths){const node=p.reduce((o,k)=>o?.[k],v);assert.equal(node?.tag,'path');assert(Object.hasOwn(node,key));node[key]=value;}assert(Buffer.byteLength(JSON.stringify(v))<Buffer.byteLength(JSON.stringify(vector)));return v;}
const optimized=recipe(raw),finished=finishStage7Body(raw,await loadStage7TerrainFinish()),finishedOptimized=recipe(finished);
assert.equal(JSON.stringify(raw),rawSnapshot);assert.deepEqual(raw.symbols.source,finished.symbols.source);assert.deepEqual(optimized.symbols.source,finishedOptimized.symbols.source);
assert.deepEqual(finished.root,finishedOptimized.root);assert.deepEqual(finished.clips,finishedOptimized.clips);
for(const [k,value]of Object.entries(finished.symbols))if(k!=='source')assert.deepEqual(value,finishedOptimized.symbols[k]);
const summary={scope:'Read-only extraction; no registry, author, or runtime changes',entryKeys:Object.keys(entry),registrySha256:sha(registryText),otherEntriesSha256:sha(registry.filter(e=>e.id!==entry.id)),rawOriginalSha256:sha(raw),oldOptimizedVectorSha256:sha(optimized),sourceRawSha256:sha(raw.symbols.source),sourceOptimizedSha256:sha(optimized.symbols.source),finishedRawSha256:sha(finished),finishedOptimizedSha256:sha(finishedOptimized),sourcePathsExact:true,sourceRawExact:true,sourceOptimizedExact:true,allNonSourceNodesUnchanged:true,paths:entry.paths.map(([p,key,value])=>({path:p,key,bytes:Buffer.byteLength(JSON.stringify(value))}))};
await writeFile(path.join(out,'stage7-original-recipe.json'),JSON.stringify(entry,null,2));await writeFile(path.join(out,'registry-boundary-summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
