/** Native production-Scene timing and cache contracts. No browser, HUD or FPS claim.
 * Run sequentially: node --expose-gc tests/stage30-ferry-native-performance.mjs
 * Only test fixtures change battle state; the production tree must stay byte-identical.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeParts,root} from '../shared/build.mjs';

const require=createRequire(import.meta.url),native=require('@napi-rs/canvas');
const out=path.join(root,'_local/reports/stage30-ferry-native-performance');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const sha=x=>createHash('sha256').update(x).digest('hex');
const productionPaths=['shared','game/config','game/src','game/engine','tools/environment','tools/map-forge','tools/party-forge','tools/monster-forge','tools/actor-forge'];
const sourceCommit=git('rev-parse','71a3f527'),checkoutCommit=git('rev-parse','HEAD');
assert.equal(git('diff','--name-only',sourceCommit,'--',...productionPaths),'','Production files differ from the pinned 71a3f527 checkpoint; test-only commits are allowed');
const productionFiles=git('ls-files','-z','--',...productionPaths).split('\0').filter(Boolean).sort();
async function sourceDigest(){const h=createHash('sha256');for(const file of productionFiles)h.update(file+'\0').update(await readFile(path.join(root,file)));return h.digest('hex');}
const productionBefore=await sourceDigest(),startedAt=new Date().toISOString();
await mkdir(out,{recursive:true});
const appCanvases=new WeakMap();
function canvas(w=64,h=64,{viewport=false}={}){const c=native.createCanvas(w,h),size={w,h};if(viewport)appCanvases.set(c,size);Object.defineProperties(c,{clientWidth:{get:()=>viewport?size.w:c.width},clientHeight:{get:()=>viewport?size.h:c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:viewport?size.w:c.width,height:viewport?size.h:c.height});return c;}
class Image extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
let seed=3910;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
const g=vm.createContext({console,performance,structuredClone,Math:math,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,Image,document:{createElement:()=>canvas(),querySelector:()=>null,getElementById:()=>null},navigator:{userAgent:'honro-native-stage30-performance'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout,clearTimeout});g.window=g;
const parts=await runtimeParts({vector:true,render:true});for(const source of parts)vm.runInContext(source,g);
const project=g.HONRO_PROJECT,stage=project.stages.find(s=>s.metadata.stageId===30),road=stage.markers.find(m=>m.id==='old-road');
assert.ok(g.HonroStage30FerryArt&&stage.initialState.honroFerryRevision===1);
const metadata={sourceCommit,checkoutCommit,sourceTree:git('rev-parse',sourceCommit+'^{tree}'),productionContentSha256:productionBefore,productionFileCount:productionFiles.length,bundleSha256:sha(parts.join('\n')),compiledProjectSha256:sha(JSON.stringify(project)),rawCampaignSha256:sha(await readFile(path.join(root,'shared/data/campaign.json'))),artRuntimeSha256:sha(await readFile(path.join(root,'shared/runtime/stage30-ferry-art.js'))),sceneSha256:sha(await readFile(path.join(root,'shared/runtime/renderer.js'))),testSha256:sha(await readFile(new URL(import.meta.url))),node:process.version,nativeCanvas:require('@napi-rs/canvas/package.json').version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,cpuCount:os.cpus().length,gcExposed:typeof global.gc==='function',startedAt};
for(const f of ['HONRO.html','HONRO_WORKSHOP.html'])try{metadata[f+'Sha256']=sha(await readFile(path.join(root,f)));}catch{metadata[f+'Sha256']=null;}
const viewports=[{name:'desktop',w:1440,h:900},{name:'portrait',w:390,h:844},{name:'landscape',w:844,h:390}];
const fixtures=[
 {name:'overview',x:5600,y:4200,z:.122,inspection:true},
 {name:'rear-c-quay',x:4590,y:5450,z:.5},
 {name:'gather-g',x:road.x+180,y:road.y-75,z:.48},
 {name:'deep-water',x:6835,y:6540,z:.48},
 {name:'barge',x:6760,y:5790,z:.58}
];
const samples=60,warmups=8,probeSamples=24,results=[],failures=[];
const stats=s=>structuredClone(s.renderCacheStats());
const delta=(a,z)=>Object.fromEntries(['worldBuilds','domainTileBuilds','worldHits','worldBuildMs','bgBuilds','bgHits'].map(k=>[k,(z[k]||0)-(a[k]||0)]));
const quantiles=times=>{const a=times.slice().sort((x,y)=>x-y);return{samples:a.length,medianMs:(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2,p95Ms:a[Math.ceil(a.length*.95)-1],minMs:a[0],maxMs:a.at(-1),rawMs:times};};
const check=(condition,message,context)=>{if(!condition)failures.push({message,...context});return !!condition;};
const resize=(cv,w,h)=>Object.assign(appCanvases.get(cv),{w,h});
const releaseTiles=q=>{for(const t of q?.tiles?.values()||[])t.canvas.width=1;q?.tiles?.clear();};
function sampleState(status){const b=g.HonroMaps.createBattle(stage,project);b.honroState.ferry={...(b.honroState.ferry||{}),status:status==='before'?'moored':status,elapsed:status==='settling'?.4:status==='settled'?.8:0,duration:.8};for(const ts of [b.terrain,b.honroWorldTerrain])for(const t of ts){if(b.honroFerrySpec.enableTerrainIds.includes(t.id))t.broken=status!=='settled';if(b.honroFerrySpec.disableTerrainIds.includes(t.id))t.broken=status==='settled';}b.sceneVersion+=status==='before'?0:status==='settling'?1:2;return b;}
function setupScene(cv,v,fixture){const scene=new g.HonroScene(cv);Object.assign(scene,{x:fixture.x,y:fixture.y,scale:fixture.inspection?fixture.z*v.w/1440:fixture.z,manual:true,time:2,editorView:!!fixture.inspection,skillPreview:!!fixture.inspection});return scene;}
function render(scene,engine){scene.render(engine,0,'',.6,false,1/60);}
function measure(scene,engine,n){const times=[];for(let i=0;i<n;i++){const start=performance.now();render(scene,engine);times.push(performance.now()-start);}return quantiles(times);}
function cacheBlock(scene,engine,n,context){const before=stats(scene),edgeBefore=scene.terrainReadabilityStats?.builds||0,battleBefore=JSON.stringify(engine.b),timing=measure(scene,engine,n),after=stats(scene),d=delta(before,after),eligible=scene.scale<=1.05;
 const pure=check(JSON.stringify(engine.b)===battleBefore,'Render changed battle',context),stable=check(!eligible||d.domainTileBuilds===0,'Warm view rebuilt static tiles',context),reused=check(!eligible||d.worldHits>0,'Warm cached view had no tile hits',context),edgeStable=check((scene.terrainReadabilityStats?.builds||0)===edgeBefore,'Warm view rebuilt exposed-edge paths',context),tiles=scene._domainTiles?.tiles.size||0,cap=scene.canvas.clientWidth<900?12:24;
 check(tiles<=cap,'Retained world tile count exceeds production cap',context);
 return{timing,cacheBefore:before,cacheAfter:after,cacheDelta:d,cacheEligible:eligible,retainedTiles:tiles,tileCap:cap,tileHitFraction:d.worldHits/(d.worldHits+d.domainTileBuilds)||0,pure,stable,reused,edgeStable};}
for(const status of ['before','settling','settled'])for(const viewport of viewports)for(const fixture of fixtures){
 const context={status,viewport:viewport.name,fixture:fixture.name},b=sampleState(status),engine=new g.HONRO_CORE.Engine(b,()=>{},true),cv=canvas(viewport.w,viewport.h,{viewport:true}),scene=setupScene(cv,viewport,fixture),initial=JSON.stringify(b),coldStart=performance.now();render(scene,engine);const coldNativeMs=performance.now()-coldStart;
 await new Promise(r=>setTimeout(r,8));for(let i=0;i<warmups;i++)render(scene,engine);
 const warm=cacheBlock(scene,engine,samples,{...context,phase:'warm'}),camera={x:scene.x,y:scene.y,scale:scene.scale},sky=g.HonroStage30FerryArt.skyRaster(g.HonroStage30FerryArt.skyAsset(b));
 let imageFile=null;if(viewport.name==='desktop'||['barge','deep-water'].includes(fixture.name)){imageFile=`${status}-${viewport.name}-${fixture.name}.png`;await writeFile(path.join(out,imageFile),cv.toBuffer('image/png'));}
 const resized=viewport.name==='desktop'?{w:844,h:390}:viewport.name==='portrait'?{w:844,h:390}:{w:390,h:844},oldTiles=scene._domainTiles,oldKey=oldTiles?.key,resizeBefore=stats(scene),resizeSceneBefore={...camera};resize(cv,resized.w,resized.h);const rt=performance.now();render(scene,engine);const resizeColdNativeMs=performance.now()-rt;if(oldTiles!==scene._domainTiles)releaseTiles(oldTiles);
 for(let i=0;i<warmups;i++)render(scene,engine);const resizeWarm=cacheBlock(scene,engine,probeSamples,{...context,phase:'resize-warm'}),resizeDetails={from:viewport,to:resized,sceneBefore:resizeSceneBefore,sceneAfter:{x:scene.x,y:scene.y,scale:scene.scale},raster:{width:cv.width,height:cv.height},keyChanged:oldKey!==scene._domainTiles?.key,coldNativeMs:resizeColdNativeMs,delta:delta(resizeBefore,stats(scene)),warm:resizeWarm};
 check(cv.width===resized.w&&cv.height===resized.h,'Scene.resize failed Native raster dimensions',context);
 const resizeTiles=scene._domainTiles;resize(cv,viewport.w,viewport.h);Object.assign(scene,camera);scene._cameraWidth=viewport.w;scene._cameraHeight=viewport.h;for(let i=0;i<warmups;i++)render(scene,engine);if(resizeTiles!==scene._domainTiles)releaseTiles(resizeTiles);
 const priorTiles=scene._domainTiles,priorKey=priorTiles?.key,invalidBefore=stats(scene),oldVersion=b.sceneVersion;b.sceneVersion++;const invalidFixture=JSON.stringify(b),it=performance.now();render(scene,engine);const invalidColdNativeMs=performance.now()-it,invalidAfter=stats(scene),invalidDelta=delta(invalidBefore,invalidAfter);
 const invalidated=check(priorKey!==scene._domainTiles?.key&&invalidDelta.domainTileBuilds>0,'sceneVersion did not invalidate static tiles',context);if(priorTiles!==scene._domainTiles)releaseTiles(priorTiles);for(let i=0;i<warmups;i++)render(scene,engine);const invalidWarm=cacheBlock(scene,engine,probeSamples,{...context,phase:'invalidated-warm'});
 check(JSON.stringify(b)===invalidFixture,'Render changed battle after explicit sceneVersion fixture',context);const finalForComparison=structuredClone(b);finalForComparison.sceneVersion=oldVersion;const overallPure=check(JSON.stringify(finalForComparison)===initial,'Battle changed beyond the explicit sceneVersion fixture',context);
 const row={...context,view:{...viewport,...camera,inspection:!!fixture.inspection},coldNativeMs,warm,resize:resizeDetails,invalidation:{oldVersion,newVersion:b.sceneVersion,invalidated,coldNativeMs:invalidColdNativeMs,cacheDelta:invalidDelta,warm:invalidWarm},staticBytes:{retainedWorld:warm.cacheAfter.worldBytes,sky:sky.width*sky.height*4,retainedWorldPlusSky:warm.cacheAfter.worldBytes+sky.width*sky.height*4},overallPure,imageFile};results.push(row);
 console.log(JSON.stringify({case:results.length,...context,medianMs:+warm.timing.medianMs.toFixed(3),p95Ms:+warm.timing.p95Ms.toFixed(3),warmBuilds:warm.cacheDelta.domainTileBuilds,warmHits:warm.cacheDelta.worldHits,resizeWarmBuilds:resizeWarm.cacheDelta.domainTileBuilds,invalidated,overallPure}));
 releaseTiles(scene._domainTiles);if(scene._staticWorldCache?.canvas)scene._staticWorldCache.canvas.width=1;if(scene._backgroundCache?.canvas)scene._backgroundCache.canvas.width=1;sky.width=1;scene._domainTiles=null;scene._staticWorldCache=null;scene._backgroundCache=null;cv.width=1;cv.height=1;global.gc?.();
 await writeFile(path.join(out,'partial.json'),JSON.stringify({metadata,results,failures},null,2)+'\n');
}
const productionAfter=await sourceDigest();assert.equal(productionAfter,productionBefore,'Native QA changed production files');
const slowest=results.slice().sort((a,z)=>z.warm.timing.p95Ms-a.warm.timing.p95Ms).slice(0,8).map(r=>({status:r.status,viewport:r.viewport,fixture:r.fixture,medianMs:r.warm.timing.medianMs,p95Ms:r.warm.timing.p95Ms,coldNativeMs:r.coldNativeMs}));
const range=rows=>({cases:rows.length,medianMs:{min:Math.min(...rows.map(r=>r.warm.timing.medianMs)),max:Math.max(...rows.map(r=>r.warm.timing.medianMs))},p95Ms:{min:Math.min(...rows.map(r=>r.warm.timing.p95Ms)),max:Math.max(...rows.map(r=>r.warm.timing.p95Ms))}});
const summary={pass:!failures.length,cases:results.length,byViewport:Object.fromEntries(viewports.map(v=>[v.name,range(results.filter(r=>r.viewport===v.name))])),byState:Object.fromEntries(['before','settling','settled'].map(s=>[s,range(results.filter(r=>r.status===s))])),slowest,allWarmCachesStable:results.every(r=>r.warm.stable),allResizeWarmCachesStable:results.every(r=>r.resize.warm.stable),allSceneVersionInvalidated:results.every(r=>r.invalidation.invalidated),allBattlesUnchanged:results.every(r=>r.overallPure),maxRetainedWorldBytes:Math.max(...results.map(r=>r.staticBytes.retainedWorld)),maxWorldPlusSkyBytes:Math.max(...results.map(r=>r.staticBytes.retainedWorldPlusSky))};
const report={metadata:{...metadata,finishedAt:new Date().toISOString(),endCommit:git('rev-parse','HEAD'),productionAfterSha256:productionAfter},method:{sequential:true,warmups,warmSamples:samples,probeSamples,devicePixelRatio:1,sceneEffectDt:1/60,engineTickCalled:false,fixtureEdits:['ferry status and elapsed/duration','authored enable/disable terrain broken flags in both simulation and world terrain','sceneVersion on fixture entry and one explicit invalidation probe'],overview:'Editor inspection zoom, proportional to viewport width; not a playable minimum-zoom performance claim',resize:'Production Scene.size/render resize path. Explicit restoration of original scene framing before the sceneVersion probe.',timeUnit:'Milliseconds per Native HonroScene.render call, never converted to game FPS',cacheCounters:'worldHits count reused tile draws; domainTileBuilds count rasterized tiles. Warm tile-hit fraction is tile-level, not frame-level.',excludedFromTimedSamples:['JSON state assertions','PNG encoding and file writes','runtime loading','source hashing','manual GC between cases'],memory:'World tile bytes and sky raster bytes are retained canvas pixel sizes, not process memory or browser/GPU allocations.'},summary,failures,results,limitations:['Native @napi-rs/canvas CPU/Skia path only; not browser Canvas, GPU, DOM/HUD/input or full game-loop timing.','Chromium socket EPERM blocker is inherited context; no browser, CDP or permission workaround was attempted.','Ferry states are isolated render fixtures. Settling elapsed is held at its midpoint while Scene.time advances; this does not validate event timing or normal play.','Cases run in a fixed order without interleaved replicas; timing differences between event states are not evidence of causation. All figures are observations on this shared host; scheduling, JIT warmup and Native garbage collection can affect tails. No browser performance threshold or game FPS pass is inferred.','Cold numbers include first-view tile/path allocation, and differ from steady-state warm render samples.']};
await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const csv=['state,viewport,fixture,median_ms,p95_ms,cold_ms,warm_tile_hits,warm_tile_builds,resize_key_changed,resize_median_ms,resize_p95_ms,invalidation_cold_ms,world_bytes,sky_bytes,pure',...results.map(r=>[r.status,r.viewport,r.fixture,r.warm.timing.medianMs,r.warm.timing.p95Ms,r.coldNativeMs,r.warm.cacheDelta.worldHits,r.warm.cacheDelta.domainTileBuilds,r.resize.keyChanged,r.resize.warm.timing.medianMs,r.resize.warm.timing.p95Ms,r.invalidation.coldNativeMs,r.staticBytes.retainedWorld,r.staticBytes.sky,r.overallPure].join(','))].join('\n');await writeFile(path.join(out,'summary.csv'),csv+'\n');
await writeFile(path.join(out,'README.txt'),`Native Stage 30 ferry render/cache report\nProduction: ${sourceCommit}\nBundle SHA-256: ${metadata.bundleSha256}\n${results.length} cases, ${samples} timed warm renders per case; ${probeSamples} timed renders after resize and invalidation.\nContract result: ${summary.pass?'PASS':'FAIL'}\n${JSON.stringify(summary,null,2)}\n\nNative render milliseconds only. No browser Canvas/HUD, GPU, full game-loop or FPS conclusion. See report.json for raw samples, explicit fixture edits, resize scales, cache counters and limitations.\n`);
console.log(JSON.stringify({output:out,summary,productionUnchanged:true}));if(failures.length)process.exitCode=1;
