/** Reproducible, local-only Act4 integration. Never approves or publishes art. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {canonicalizeSharedAssets} from './canonicalize-shared-assets.mjs';
import {runtime} from '../../game/tests/helpers.mjs';
const clone=x=>JSON.parse(JSON.stringify(x)),hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const positional=process.argv.slice(2).filter(a=>!a.startsWith('--'));
const out=resolve(positional[0]||'_local/reports/act4-vector-production/integrated-candidate');
assert(out.startsWith(resolve('_local')+sep),'Output must remain inside repository _local; this is not an official release command.');
const inputs=[];
async function read(path){const raw=await readFile(path,'utf8');inputs.push({path,sha256:hash(raw),bytes:Buffer.byteLength(raw)});return JSON.parse(raw);}
const base=await read('shared/data/campaign.json'),world=await read('shared/data/act4/world.json'),project=clone(base);
const stage35Skeleton=await read('art/stage35-vector-production/stage35-skeleton.json');
const baselineAssets=new Map(),assets=new Map();
function diff(before,after,path=''){if(JSON.stringify(before)===JSON.stringify(after))return[];if(before&&after&&typeof before==='object'&&typeof after==='object')return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(k=>diff(before[k],after[k],path?path+'.'+k:k));return[{path,before:before??null,after:after??null}];}
function add(asset,source){assert(asset?.id,'Asset missing ID: '+source);if(assets.has(asset.id))assert.deepEqual(assets.get(asset.id),asset,'Conflicting asset ID '+asset.id+' from '+source);else assets.set(asset.id,clone(asset));}
for(const a of [...base.library,...world.library])add(a,'official');for(const[id,a]of assets)baselineAssets.set(id,clone(a));
const originalStages=new Map(world.stages.map(s=>[s.id,s])),packages=[];
const draft31=await read('_local/reports/stage31-production/release-candidate/stage31.draft.honro-map.json');
const s31=draft31.stages.find(s=>s.id==='stage-31');assert(s31,'Missing Stage31 draft');
// Only import Stage31 and new assets from its full-project draft. In particular,
// normalized historical stages1–30 in that draft do NOT replace official data.
const portable31={stage:await read('art/stage31-vector-production/package/stage.json'),library:await read('art/stage31-vector-production/package/library.json')};assert.deepEqual(portable31.stage,s31,'Stage31 portable stage differs from authored draft');for(const a of portable31.library){assert.deepEqual(a,draft31.library.find(x=>x.id===a.id),'Stage31 portable asset differs from draft: '+a.id);add(a,'stage31 portable referenced inventory');}
for(const e of s31.elements){const a=draft31.library.find(a=>a.id===e.assetId);assert(a,'Missing Stage31 source asset '+e.assetId);if(baselineAssets.has(a.id))assert.deepEqual(a,baselineAssets.get(a.id),'Stage31 unexpectedly changed shared asset '+a.id);}
packages.push({number:31,stage:clone(s31),library:[]});
for(let n=32;n<=40;n++){
 const dir=`art/stage${n}-vector-production`;let p;
 if(n===35||n===36)p=await read(`${dir}/stage${n}-production-package.json`);
 else p={stage:await read(`${dir}/package/stage.json`),library:await read(`${dir}/package/library.json`)};
 assert.equal(p.stage.id,`stage-${n}`);for(const a of p.library)add(a,`stage${n}`);packages.push({number:n,...p});
}
project.library=[...assets.values()];project.stages=[...clone(base.stages),...packages.map(p=>clone(p.stage))];project.activeStageId='stage-31';
const beforeSharedReuse=clone(project),sharedReuse=await canonicalizeSharedAssets(project,{officialIds:new Set(baselineAssets.keys())});project.library=sharedReuse.project.library;project.stages=sharedReuse.project.stages;assets.clear();for(const a of project.library)assets.set(a.id,a);for(const p of packages)p.stage=project.stages.find(s=>s.id===p.stage.id);
assert.equal(new Set(project.stages.map(s=>s.id)).size,40);assert.equal(project.stages.length,40);assert.deepEqual(project.stages.slice(0,30),base.stages);
const unresolved=[];function checkRefs(value,path){if(!value||typeof value!=='object')return;for(const[k,v]of Object.entries(value)){if((k==='assetId'||k.endsWith('AssetId'))&&typeof v==='string'&&!assets.has(v))unresolved.push({path:path+'.'+k,id:v});else if(v&&typeof v==='object')checkRefs(v,path+'.'+k);}}
for(const p of packages)checkRefs(p.stage,p.stage.id);assert.deepEqual(unresolved,[],'Missing stage asset reference');
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false}),official={...clone(base),stages:[...base.stages,...world.stages],library:[...base.library,...world.library]};
const compile=(s,p)=>clone(g.HonroMaps.compile(s,p).terrain),checks=[];
for(const p of packages){const n=p.number,s=p.stage,original=originalStages.get(s.id),candidateCollision=compile(s,project),originalCollision=compile(original,official);let expected=originalCollision,exception=null;
 if(n===31){expected=compile(s31,draft31);exception='Stage31 explicit authored gameplay redesign; integrated collision must exactly match its independently tested draft.';}
 if(n===35){expected=compile(stage35Skeleton,official);exception='Explicit authored Stage35 skeleton: eight ground vertices, grounded original units/props, and two wall placements; central shot pocket retained. Full official delta recorded, not an appearance-only claim.';}

 assert.deepEqual(candidateCollision,expected,'Compiled collision mismatch stage '+n);assert.deepEqual(candidateCollision,compile(beforeSharedReuse.stages.find(x=>x.id===s.id),beforeSharedReuse),'Shared reuse changed compiled collision stage '+n);
 const gameplayBaseline=n===35?stage35Skeleton:original;
 const unchanged=[];if(n!==31){for(const key of ['terrains','units','materials','events','encounters','objectives','markers']){assert.deepEqual(s[key],gameplayBaseline[key],`Stage${n} changed gameplay field ${key}`);unchanged.push(key);}const currentAct4=clone(s.design.act4),originalAct4=clone(gameplayBaseline.design.act4);delete currentAct4.palette;delete originalAct4.palette;assert.deepEqual(currentAct4,originalAct4);unchanged.push('design.act4 except display palette');const candidateState=clone(s.initialState),expectedState=clone(gameplayBaseline.initialState);for(const state of[candidateState,expectedState]){delete state.honroPreviewFar;for(const key of ['honroNarrativeRevision','honroStoryCanonRevision','honroNarrativeCatalogueRevision']){if(state[key]!==undefined){assert.equal(state[key],1,'Unexpected narrative marker value');delete state[key];}}if(state.honroAct4Design)delete state.honroAct4Design.palette;}assert.deepEqual(candidateState,expectedState,`Stage${n} gameplay initial state differs`);unchanged.push('initialState except far display, palette and canonical narrative1 markers');}
 const assetIds=new Set();function collect(v){if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){if((k==='assetId'||k.endsWith('AssetId'))&&typeof x==='string')assetIds.add(x);else if(x&&typeof x==='object')collect(x);}}collect(s);
 checks.push({stage:n,stageSha256:hash(s),compiledCollisionSha256:hash(candidateCollision),officialCollisionSha256:hash(originalCollision),expectedCollisionSha256:hash(expected),compiledCollisionCount:candidateCollision.length,unchangedGameplayFields:unchanged,exception,assetIds:[...assetIds].sort(),officialGameplayChanges:n===31||n===35?['terrains','units','materials','events','encounters','objectives','markers','design'].filter(k=>hash(s[k]??null)!==hash(original[k]??null)).map(key=>({key,officialSha256:hash(original[key]??null),candidateSha256:hash(s[key]??null)})):[]});
}
const p35=packages.find(p=>p.number===35),source35=await read('art/stage35-vector-production/continuous-project.json'),replay35=await read('_local/reports/stage35-direct/final-symbol-app.json');
assert.deepEqual(p35.stage,source35.stages[0],'Stage35 replay source stage is stale');for(const a of p35.library)assert.deepEqual(a,source35.library.find(b=>b.id===a.id),'Stage35 replay source asset is stale: '+a.id);assert.equal(hash(source35),replay35.fingerprint,'Stage35 actual App replay fingerprint stale');assert.equal(replay35.success,true);
const stage35Redesign={source:'art/stage35-vector-production/stage35-skeleton.json',recipe:'tools/stage35-production/skeleton.mjs',officialToCandidate:diff(originalStages.get('stage-35'),p35.stage),compiledCollisionChanges:diff(compile(originalStages.get('stage-35'),official),compile(p35.stage,project)),actualReplay:{path:'_local/reports/stage35-direct/final-symbol-app.json',sourceFingerprint:replay35.fingerprint,recordedRuntimeSha256:replay35.runtimeSha256,frames:replay35.frame,resume:replay35.resume,scope:'Existing successful actual App replay matches exact final stage and its assets. Recorded runtime hash is historical; this does not claim a replay on later runtime edits.'}};
const vectorChecks=[];for(const[id,a]of assets){if(baselineAssets.has(id)||!a.vector)continue;const errors=clone(g.HonroVectorArt.validate(a.vector));assert.deepEqual(errors,[],'Unsafe vector '+id);vectorChecks.push({id,bytes:Buffer.byteLength(JSON.stringify(a)),sha256:hash(a)});}
// Stage31 formal reviews remain whatever the draft actually recorded. Never
// synthesize release approvals from successful integration assertions.
if(draft31.production)project.production=clone(draft31.production);
const candidateWorld={...clone(world),stages:packages.map(p=>clone(p.stage)),library:[...assets.values()].filter(a=>!base.library.some(b=>b.id===a.id))};
const vectorMetrics=[];const globalPathStrings=new Set();
for(const a of candidateWorld.library.filter(a=>a.vector)){const v=a.vector;let expandedNodes=0,expandedPaths=0,maxDepth=0,storedPaths=0,maxPathChars=0;const uniquePaths=new Set();
 const walk=(node,depth)=>{expandedNodes++;maxDepth=Math.max(maxDepth,depth);if(node.tag==='use')walk(v.symbols[node.symbol],depth+1);else if(node.tag==='path')expandedPaths++;else for(const c of node.children)walk(c,depth+1);};walk(v.root,0);
 const stored=node=>{if(node.tag==='path'){storedPaths++;uniquePaths.add(node.d);globalPathStrings.add(node.d);maxPathChars=Math.max(maxPathChars,node.d.length);}else if(node.tag==='g')node.children.forEach(stored);};stored(v.root);Object.values(v.symbols||{}).forEach(stored);
 const expand=node=>node.tag==='use'?{...Object.fromEntries(Object.entries(node).filter(([k])=>k!=='symbol')),tag:'g',children:[expand(v.symbols[node.symbol])]}:node.tag==='g'?{...node,children:node.children.map(expand)}:node;
 const expanded={...v,root:expand(v.root)};delete expanded.symbols;
 vectorMetrics.push({id:a.id,assetBytes:Buffer.byteLength(JSON.stringify(a)),vectorBytes:Buffer.byteLength(JSON.stringify(v)),equivalentExpandedVectorBytes:Buffer.byteLength(JSON.stringify(expanded)),storedPathNodes:storedPaths,distinctPathStrings:uniquePaths.size,expandedPathNodes:expandedPaths,expandedNodes,maxDepth,maxPathChars});
}
const jsonBytes=x=>Buffer.byteLength(JSON.stringify(x)),gzipBytes=x=>gzipSync(JSON.stringify(x),{level:9}).length;
sharedReuse.report.worldBefore={compactJSONBytes:jsonBytes({...clone(world),stages:beforeSharedReuse.stages.filter(s=>s.metadata.stageId>=31),library:beforeSharedReuse.library.filter(a=>!base.library.some(b=>b.id===a.id))}),gzipLevel9Bytes:gzipBytes({...clone(world),stages:beforeSharedReuse.stages.filter(s=>s.metadata.stageId>=31),library:beforeSharedReuse.library.filter(a=>!base.library.some(b=>b.id===a.id))})};sharedReuse.report.worldAfter={compactJSONBytes:jsonBytes(candidateWorld),gzipLevel9Bytes:gzipBytes(candidateWorld)};
const payload={scope:'Serialized payload and vector-tree inventory, not FPS, network transfer or mobile GPU measurements. Equivalent expanded trees measure exact internal-symbol storage reuse only; no claim about raw SVG shape simplification.',officialWorld:{diskBytes:inputs.find(x=>x.path==='shared/data/act4/world.json').bytes,compactJSONBytes:jsonBytes(world),gzipLevel9Bytes:gzipBytes(world)},candidateWorld:{compactJSONBytes:jsonBytes(candidateWorld),gzipLevel9Bytes:gzipBytes(candidateWorld)},act4Vectors:{assets:vectorMetrics.length,storedPathNodes:vectorMetrics.reduce((n,m)=>n+m.storedPathNodes,0),distinctPathStringsAcrossAssets:globalPathStrings.size,expandedPathNodes:vectorMetrics.reduce((n,m)=>n+m.expandedPathNodes,0),expandedNodeMaximum:Math.max(...vectorMetrics.map(m=>m.expandedNodes)),maxDepth:Math.max(...vectorMetrics.map(m=>m.maxDepth)),maxPathChars:Math.max(...vectorMetrics.map(m=>m.maxPathChars)),vectorBytes:vectorMetrics.reduce((n,m)=>n+m.vectorBytes,0),equivalentExpandedVectorBytes:vectorMetrics.reduce((n,m)=>n+m.equivalentExpandedVectorBytes,0),largestAsset:vectorMetrics.reduce((a,b)=>a.assetBytes>b.assetBytes?a:b)},assets:vectorMetrics};
const report={version:1,payload,sharedReuse:sharedReuse.report,status:'local-integration-only-not-release-approved',inputs,projectSha256:hash(project),worldSha256:hash(candidateWorld),officialStages1to30Unchanged:true,officialSharedAssetsUnchanged:true,stageCount:project.stages.length,assetCount:project.library.length,newVectorAssets:vectorChecks,stage35Redesign,stages:checks,checks:['unique asset IDs with identical shared definitions','all static and configured dynamic asset references resolve','expanded vector schema safety validation','exact compiled collision equality to official or explicit31/35 exception'],notEstablished:['visual art approval','actual browser HUD and touch behavior','linked campaign playthrough','remote publication','master integration','GitHub Pages deployment'],worldRevision:world.revision,revisionNote:'Candidate retains source world metadata; release revision policy is separate. Do not copy this file to production without final release review.'};
for(const input of inputs)assert.equal(hash(await readFile(input.path,'utf8')),input.sha256,'Source changed during assembly; rerun: '+input.path);
await mkdir(out,{recursive:true});for(const[name,value]of[['project-before-shared-reuse.json',beforeSharedReuse],['project.json',project],['world.json',candidateWorld],['integration-check.json',report]])await writeFile(resolve(out,name),JSON.stringify(value,null,name==='integration-check.json'?2:0));
console.log(JSON.stringify({output:relative(process.cwd(),out),stageCount:40,assets:assets.size,newVectors:vectorChecks.length,projectSha256:report.projectSha256,status:report.status},null,2));
