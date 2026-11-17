import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Path2D} from '@napi-rs/canvas';
import {runtimeEntries} from '../shared/build.mjs';
import {terrainPathOptimization} from '../shared/terrain-path-optimization.mjs';
const out=process.argv[2];assert(out);await mkdir(out,{recursive:true});
const sha=s=>createHash('sha256').update(s).digest('hex');
const clone=structuredClone;
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const project=entries.find(e=>e.project)?.project;assert(project);
const oldId='act4-handoff:32:body-joined',newId='act4-handoff:32:body-shared-material';
const old=project.library.find(a=>a.id===oldId),current=project.library.find(a=>a.id===newId);assert(old&&current);
const originalProjectSHA=sha(JSON.stringify(project));
const sourceRawSHA=sha(JSON.stringify(current.vector)),oldRuntimeSHA=sha(JSON.stringify(old.vector));
assert.equal(sourceRawSHA,'76e4fc6c04fc1f95aa9dcd0d97c9b8294c05cbe0a75169eb53174768f8da7cd1');
assert.equal(oldRuntimeSHA,'bf7391da9a43c37aff1388ca12a22a31611b61897f42752b9285c90db085d199');
// In-memory diagnostic proxy only: no ID, registry, vector or metadata is changed in project.
const alias={...clone(current),id:oldId};
const optimization=await terrainPathOptimization();optimization.apply([alias]);
assert.deepEqual(alias.vector,old.vector,'Existing optimizer alias must be exactly old optimized vector');
assert.equal(sha(JSON.stringify(alias.vector)),oldRuntimeSHA);
function nodes(v){const a=[];function walk(n,p=[]){if(n.tag==='path')a.push({address:p,node:n,d:n.d??n.dParts?.join('')});for(let i=0;i<(n.children??[]).length;i++)walk(n.children[i],[...p,'children',i]);}walk(v.root,['root']);return a;}
const raw=nodes(current.vector),optimized=nodes(alias.vector),oldNodes=nodes(old.vector);assert.equal(raw.length,25);assert.equal(optimized.length,25);
const cfg=current.params.stage32SharedMaterial;assert.equal(cfg.sourcePathSHA256.length,25);
const noD=v=>{const q=clone(v);for(const n of nodes(q)){delete n.node.d;delete n.node.dParts;}return q;};assert.deepEqual(noD(current.vector),noD(alias.vector));
const report={scope:'Source-only in-memory exact existing optimization reuse. No production registry/code changes, no rasterization; not footer or visual acceptance.',sourceRawSHA,oldRuntimeSHA,aliasRuntimeSHA:sha(JSON.stringify(alias.vector)),nonPathDataUnchanged:true,wholeProjectUnchanged:null,rawHashContract:'sourcePathSHA256 remains author/raw only; must not be mislabeled optimized runtime hashes',paths:[],totalRawSubpaths:0,totalOptimizedSubpaths:0,selectedCount:0,indexNotUniqueClosest:[]};
function subpaths(d){return (d.match(/[Mm][^Mm]*/g)??[]).map((text,index)=>{assert(text[0]==='M','Relative moveto requires a different correspondence analysis');const bounds=new Path2D(text).computeTightBounds();const nums=text.slice(1).match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g);const start=nums.slice(0,2).map(Number);return {index,sha:sha(text),bounds,start,descriptor:[...start,...bounds]};});}
for(let i=0;i<25;i++){
 assert.deepEqual(raw[i].address,optimized[i].address);assert.equal(sha(raw[i].d),cfg.sourcePathSHA256[i]);assert.equal(optimized[i].d,oldNodes[i].d);
 const a=subpaths(raw[i].d),b=subpaths(optimized[i].d);assert.equal(a.length,b.length,'Subpath count/order contract '+i);
 const selected=cfg.graySubpaths?.[i]??[];assert.equal(new Set(selected).size,selected.length);for(const k of selected)assert(k>=0&&k<a.length&&Number.isInteger(k));
 const rows=a.map((x,k)=>{const y=b[k],distance=(p,q)=>p.descriptor.reduce((s,v,n)=>s+(v-q.descriptor[n])**2,0),own=distance(x,y);let best=Infinity,bestIndices=[];for(let j=0;j<b.length;j++){const d=distance(x,b[j]);if(d<best){best=d;bestIndices=[j];}else if(d===best)bestIndices.push(j);}const closestAtSameIndex=bestIndices.includes(k);if(!closestAtSameIndex||bestIndices.length!==1)report.indexNotUniqueClosest.push({path:i,index:k,selected:selected.includes(k),own,best,bestIndices});return {index:k,selected:selected.includes(k),rawSHA:x.sha,optimizedSHA:y.sha,rawStart:x.start,optimizedStart:y.start,rawBounds:x.bounds,optimizedBounds:y.bounds,maxDescriptorDelta:Math.max(...x.descriptor.map((v,n)=>Math.abs(v-y.descriptor[n]))),closestAtSameIndex,uniqueClosest:bestIndices.length===1};});
 report.paths.push({index:i,address:raw[i].address,rawSHA:sha(raw[i].d),optimizedSHA:sha(optimized[i].d),subpaths:a.length,selected,rows});report.totalRawSubpaths+=a.length;report.totalOptimizedSubpaths+=b.length;report.selectedCount+=selected.length;
}
report.wholeProjectUnchanged=sha(JSON.stringify(project))===originalProjectSHA;assert(report.wholeProjectUnchanged);assert.equal(report.totalRawSubpaths,723);assert.equal(report.totalOptimizedSubpaths,723);
report.correspondenceNote='Original subpath ordinal is preserved by equal per-path count and ordered M-command stream. Unique closest start+bbox at the same ordinal provides additional measured identity evidence, not a replacement geometric error budget or proof of curve equivalence. Approved optimization values are reused verbatim; no tolerance changed.';
await writeFile(path.join(out,'optimization-alias.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sourceRawSHA,oldRuntimeSHA,aliasRuntimeSHA:report.aliasRuntimeSHA,totalRawSubpaths:report.totalRawSubpaths,selectedCount:report.selectedCount,indexNotUniqueClosest:report.indexNotUniqueClosest,wholeProjectUnchanged:report.wholeProjectUnchanged}));
assert.deepEqual(report.indexNotUniqueClosest,[],'Ambiguous or changed subpath identity must be reviewed; do not assume index safety');
