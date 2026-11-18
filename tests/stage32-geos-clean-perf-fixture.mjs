/** Separate current-candidate-source experiment. Historical old/new strict failure remains preserved. Derived from clean remote 69476eefd62be6cf835038928e9112fc1e88eb47. Not public UI/gameplay acceptance. */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runtimeEntries,root} from '../shared/build.mjs';
const out=process.argv[2];
if(!out)throw Error('Usage: HONRO_ACT4_RELEASE=1 node tests/stage32-material-browser-fixture.mjs OUTPUT_DIRECTORY');
const stages=[32];
if(process.env.HONRO_ACT4_RELEASE!=='1')throw Error('Stage32 requires HONRO_ACT4_RELEASE=1');
await mkdir(out,{recursive:true});
const rendererCanonical=await readFile(path.join(root,'shared/runtime/stage32-foundation-art.js'),'utf8');
if(createHash('sha256').update(rendererCanonical).digest('hex')!=='0281052db3e3d89efff8a75d9859ffe871a50ceef4a7d17ec7398a7c2ff1f6b0')throw Error('Requires exact registered SS2 production renderer');
const declaredCoverage=await readFile(path.join(root,'tests/fixtures/stage32-geos-scene-coverage.svgpath'),'utf8');
const testRenderer=await readFile(path.join(root,'tests/fixtures/stage32-geos-scene-candidate.js'),'utf8');
if(createHash('sha256').update(testRenderer).digest('hex')!=='fd34469c8a364ef105b3d26cb668324a69581d2fa88bcb8f6293bd1131542074')throw Error('Native-component candidate source changed');
const actualCoverage=JSON.parse(testRenderer.match(/const nativeCoverageD=("[^\n]*");/)[1]);if(actualCoverage!==declaredCoverage)throw Error('Independent declared coverage differs from helper literal');
// runtimeParts is exactly runtimeEntries(...).map(entry=>entry.code). Names allow safe deduplication.
// Use actual App build order. Exclude exactly main.js: it constructs App, loads
// user storage and starts the RAF loop. Every other production entry is retained.
const appEntries=await runtimeEntries({vector:true,render:true,app:true,productionStory:true});
const excluded=appEntries.filter(e=>e.name==='shared/runtime/main.js');
if(excluded.length!==1)throw Error('Expected exactly one App startup entry');
const entries=appEntries.filter(e=>e.name!=='shared/runtime/main.js');
const registered=entries.filter(e=>e.name==='shared/runtime/stage32-foundation-art.js');
if(registered.length!==1||registered[0].code!==rendererCanonical)throw Error('Production App manifest must contain exact registered helper once');
if(entries.filter(e=>e.name==='engine/core').length!==1)throw Error('Expected exactly one production core');
const coreIndex=entries.findIndex(e=>e.name==='engine/core'),helperIndex=entries.findIndex(e=>e.name==='shared/runtime/stage32-foundation-art.js'),artIndex=entries.findIndex(e=>e.name==='shared/runtime/act4-pilot-art.js');
if(!(coreIndex<helperIndex&&helperIndex<artIndex))throw Error('Production core/helper/art order changed');
const runtime=entries.map(e=>e.code).join('\n;\n');
const act4Extra=[]; // No fixture-sourced helper, Act4 modules or module reordering.
const runtimeSha256=createHash('sha256').update(runtime).digest('hex');
function bootstrap(id){
 if(id===32)globalThis.HONRO_APP_READY=new Promise(()=>{}); // Never attach a real App or resolve this promise.
 globalThis.PROBE={storage:[],errors:[],images:[],violations:[]};
 const p=globalThis.PROBE;
 globalThis.publishProbe=value=>{document.getElementById('result').textContent=btoa(unescape(encodeURIComponent(JSON.stringify(value))));};
 addEventListener('error',e=>{p.errors.push(String(e.error?.stack||e.message));publishProbe({ok:false,...p});});
 addEventListener('unhandledrejection',e=>{p.errors.push(String(e.reason?.stack||e.reason));publishProbe({ok:false,...p});});
 addEventListener('securitypolicyviolation',e=>p.violations.push({directive:e.violatedDirective,uri:e.blockedURI}));
 for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(globalThis,key,{configurable:true,get(){p.storage.push(key);throw Error('Forbidden storage access: '+key);}});
 // Synthetic session clock only. compiler.createBattle embeds Date.now() in session.
 Date.now=()=>1794916800000;
 let seed=3910;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 const descriptor=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
 Object.defineProperty(HTMLImageElement.prototype,'src',{...descriptor,set(value){
  const row={pending:!!value,error:false};p.images.push(row);
  this.addEventListener('load',()=>{row.pending=false;},{once:true});
  this.addEventListener('error',()=>{row.pending=false;row.error=!!value;},{once:true});
  descriptor.set.call(this,value);
 }});
}
async function capture(id,runtimeSha256,variant,requestedCamera){
 const p=globalThis.PROBE,assert=(v,m)=>{if(!v)throw Error(m);};
 let diagnosticScene=null,canonicalDiagnostic=null;const drawDiagnostic={calls:0,directBypasses:0,directVectorDraws:0,rows:[]};
 try{
  assert(devicePixelRatio===1,'DPR must be 1');
  assert(globalThis.HonroStage32FoundationArt,'Stage32 material renderer missing');
  if(variant==='ss2')globalThis.HonroStage32FoundationArt=globalThis.HonroStage32NativeComponentTestArt;
  assert(HonroStage32FoundationArt.stats().supersample.factor===2,'Expected registered or test SS2 factor');
  globalThis.HONRO_STAGE32_VERIFY_PACKED_MASKS=variant==='spatial';
  // Clean cost fixture: no helper/vector wrapper or SS observation installed.
  const originalStage=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===32);
  assert(originalStage,'Missing official Stage32');
  const originalStageText=JSON.stringify(originalStage),stage=structuredClone(originalStage);
  const oldFoundation='approved32:coastal-foundation',newFoundation='act4-handoff:32:foundation',oldBody='act4-handoff:32:body-joined',newBody='act4-handoff:32:body-shared-material';
  const candidateVector=HONRO_PROJECT.library.find(a=>a.id===newBody).vector;
  const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
  const vectorSHA=await digest(JSON.stringify(candidateVector));
  assert(vectorSHA==='76e4fc6c04fc1f95aa9dcd0d97c9b8294c05cbe0a75169eb53174768f8da7cd1','Exact d18 raw candidate vector changed');
  const sourceNodes=[];function walkSource(n){if(n.tag==='path')sourceNodes.push(n);for(const child of n.children||[])walkSource(child);}walkSource(candidateVector.root);
  const sourcePathHashes=await Promise.all(sourceNodes.map(n=>digest(typeof n.d==='string'?n.d:n.dParts.join(''))));
  assert(sourceNodes.length===25&&JSON.stringify(sourcePathHashes)===JSON.stringify(HONRO_PROJECT.library.find(a=>a.id===newBody).params.stage32SharedMaterial.sourcePathSHA256),'Candidate author path contract changed');
  const sourceCanonical=JSON.stringify(HONRO_PROJECT.library.filter(a=>[oldFoundation,newFoundation,oldBody,newBody].includes(a.id)));
  const foundation=stage.elements.find(e=>e.id==='approved32-coastal-foundation'),body=stage.elements.find(e=>e.id==='approved32-body');
  assert(foundation.assetId===newFoundation&&body.assetId===newBody,'Expected candidate providers');
  assert(stage.design.vectorShelterDoor.bodyAssetId===newBody,'Candidate door BODY link');
  for(const aid of [oldFoundation,newFoundation,oldBody,newBody])assert(HONRO_PROJECT.library.some(a=>a.id===aid),'Missing provider '+aid);
  assert(['candidate','ss2'].includes(variant),'Invalid variant');
  
  const project={...HONRO_PROJECT,stages:HONRO_PROJECT.stages.map(s=>s===originalStage?stage:s)};
  assert(JSON.stringify(originalStage)===originalStageText,'Original project mutated');

  HonroMaps.compile(stage,project); // Match Native setup order.
  const b=(id===32)?HonroMaps.createBattle(stage,project,HonroProfileStore.fresh()):HonroMaps.createBattle(stage,project);HonroStageRules.sanitizeStageBattle(b);
  let tideSnapshot=null;
  if(id===32){
   assert(HONRO_ACT4_RELEASE===true,'Act4 release absent');
   assert(b.honroStage===id&&b.honroAct4Official===1,'Not official Act4 stage');
   if(id===32)assert(!b.honroAct4Design.tide&&b.honroAct4Design.waterPolicies.length===0,'Stage32 tide contract changed');
   HonroAct4TerrainPreview.coast.tide(b);
   b.honroAct4PreviewState.visualDrawn={};
   tideSnapshot=structuredClone(b.honroAct4PreviewState.tide??null);
   if(id===32)assert(tideSnapshot===null,'Stage32 must not synthesize tide');

  }
  const engine=new HONRO_CORE.Engine(b,()=>{},true);
  if(id===32)globalThis.HonroApp={engine};
  const physics=JSON.stringify({terrain:b.terrain,units:b.units});
  globalThis.HonroStage32FoundationArt?.clear?.();
  const view=requestedCamera.name,width=requestedCamera.width,height=requestedCamera.height;
  if(variant==='ss2')assert(HonroStage32FoundationArt.stats().nativeJunction.prepareCalls===0,'Helper prepared eagerly');
  const cv=document.getElementById('scene');cv.width=width;cv.height=height;cv.style.width=width+'px';cv.style.height=height+'px';
  const scene=new HonroScene(cv);diagnosticScene=scene;
  const zoomLimits=HonroBounds.zoomLimits(width),requestedScale=requestedCamera.minimum?zoomLimits.min:requestedCamera.scale;
  Object.assign(scene,{x:requestedCamera.x,y:requestedCamera.y,scale:requestedScale,manual:true,time:2,editorView:false,skillPreview:false});
  HonroBounds.constrain(scene,b);
  const camera={x:scene.x,y:scene.y,scale:scene.scale},before=JSON.stringify(b);
  await document.fonts.ready;
  const drain=async()=>{for(let i=0;i<200;i++){if(!p.images.some(v=>v.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Image decode timeout');};
  const renderSamples=[];const timedRender=()=>{const start=performance.now();scene.render(engine,0,'',.6,false,0);renderSamples.push({ms:performance.now()-start,sceneCacheStats:structuredClone(scene._cacheStats??null),materialStats:structuredClone(HonroStage32FoundationArt.stats())});};
  for(let i=0;i<3;i++){timedRender();assert(JSON.stringify(b)===before,'Scene mutated battle at frame '+i);await drain();await new Promise(r=>setTimeout(r,100));}
  timedRender();await drain();
  assert(JSON.stringify(b)===before,'Scene mutated battle');
  assert(JSON.stringify(HONRO_PROJECT.library.filter(a=>[oldFoundation,newFoundation,oldBody,newBody].includes(a.id)))===sourceCanonical,'Canonical provider source mutated');
  assert(JSON.stringify(originalStage)===originalStageText,'Original stage changed during rendering');
  assert(JSON.stringify({terrain:b.terrain,units:b.units})===physics,'Physics changed');
  assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Storage/runtime/CSP error');
  assert(!p.images.some(v=>v.pending||v.error),'Pending or failed image');
  camera.x=scene.x;camera.y=scene.y;camera.scale=scene.scale;if(requestedCamera.minimum)assert(scene.scale===zoomLimits.min,'Minimum zoom changed');
  const ssObservation=null,imagePlanes=[],paintFootprintPng=null;
  const materialStats=HonroStage32FoundationArt.stats();
  if(variant==='ss2')assert(materialStats.nativeJunction.prepareCalls===1,'Native prepare must occur exactly once before prepared-scene benchmark');
  assert(materialStats.fallbacks===0,'Material renderer fallback');
  if(variant==='direct-candidate-source')assert(drawDiagnostic.directBypasses>0&&drawDiagnostic.directVectorDraws===drawDiagnostic.directBypasses,'Direct candidate source was not drawn through VectorArt');
  if(variant!=='direct-candidate-source')assert(materialStats.rasterizations>0&&materialStats.hits>0,'Candidate did not exercise shared material cache');
  const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
  globalThis.HONRO_STAGE32_VERIFY_PACKED_MASKS=false;
  const verifiedPng=cv.toDataURL('image/png'),cold=[],warm=[];
  for(let i=0;i<3;i++){scene.render(engine,0,'',.6,false,0);await drain();assert(cv.toDataURL('image/png')===verifiedPng,'Repeated no-op Scene image drift');assert(JSON.stringify(b)===before,'Repeated no-op battle mutation');}
  let performanceReport=null;
  const summary=values=>{const a=[...values].sort((x,y)=>x-y);return{count:a.length,min:a[0]??null,p50:a.length?a[Math.ceil(a.length*.5)-1]:null,p95:a.length?a[Math.ceil(a.length*.95)-1]:null,max:a.at(-1)??null};};
  const snapshot=()=>structuredClone(HonroStage32FoundationArt.stats());
  const delta=(a,z)=>{const paths=['rasterizations','hits','allocations','resizes','nativeJunction.calls','nativeJunction.ms','nativeJunction.prepareCalls','nativeJunction.prepareMs','supersample.calls','supersample.ms','supersample.corrected','supersample.stripes','supersample.highRasterStripes','supersample.emptyStripes','supersample.allocations','supersample.resizes'];const get=(o,k)=>k.split('.').reduce((v,x)=>v?.[x],o)??0;return Object.fromEntries(paths.map(k=>[k,get(z,k)-get(a,k)]));};
  const benchCanvas=document.createElement('canvas');benchCanvas.width=width;benchCanvas.height=height;Object.assign(benchCanvas.style,{position:'fixed',left:'-20000px',top:'0px',width:width+'px',height:height+'px'});document.body.appendChild(benchCanvas);
  const preparedBefore=snapshot(),prepareCalls=preparedBefore.nativeJunction?.prepareCalls??0;let bench;
  const coldStart=snapshot();
  for(let i=0;i<5;i++){
   HonroStage32FoundationArt.clear();bench=new HonroScene(benchCanvas);assert(benchCanvas.width===width&&benchCanvas.height===height,'Benchmark viewport resized');Object.assign(bench,{x:camera.x,y:camera.y,scale:camera.scale,manual:true,time:2,editorView:false,skillPreview:false});HonroBounds.constrain(bench,b);
   const a=snapshot(),t=performance.now();bench.render(engine,0,'',.6,false,0);const ms=performance.now()-t,z=snapshot();assert(z.rasterizations>a.rasterizations,'Cold material not rebuilt');assert((z.nativeJunction?.prepareCalls??0)===prepareCalls,'Static Path2D unexpectedly reparsed');cold.push({ms,worldBuildMs:bench._cacheStats.worldBuildMs,phaseCounters:delta(a,z),logicalBytes:z.totalLogicalBytes??z.bytes});assert(JSON.stringify(b)===before,'Cold bench changed battle');
  }
  const coldEnd=snapshot(),warmStart=snapshot();
  for(let i=0;i<30;i++){const t=performance.now();bench.render(engine,0,'',.6,false,0);warm.push(performance.now()-t);}
  const warmEnd=snapshot();assert(warmEnd.rasterizations===warmStart.rasterizations,'Warm bench rebuilt material');
  const panStart=snapshot(),pan=[];
  for(let i=0;i<60;i++){bench.x=camera.x+16*(i+1);bench.y=camera.y;HonroBounds.constrain(bench,b);const a=snapshot(),worldBefore=bench._cacheStats.worldBuildMs,t=performance.now();bench.render(engine,0,'',.6,false,0);const ms=performance.now()-t,z=snapshot();pan.push({ms,x:bench.x,y:bench.y,scale:bench.scale,materialRebuilds:z.rasterizations-a.rasterizations,worldBuildDeltaMs:bench._cacheStats.worldBuildMs-worldBefore,phaseCounters:delta(a,z)});}
  const panEnd=snapshot();assert((panEnd.nativeJunction?.prepareCalls??0)===prepareCalls,'Preparation repeated in prepared-source phases');assert(JSON.stringify(b)===before&&JSON.stringify({terrain:b.terrain,units:b.units})===physics,'Benchmark mutated battle/physics');assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Benchmark storage/runtime error');
  performanceReport={viewport:{width,height,cssWidth:benchCanvas.clientWidth,cssHeight:benchCanvas.clientHeight},scope:'Unwrapped, observation-free Scene costs.5 prepared-source Scene-cold,30warm,60pan per fresh browser. Two sequentialABBA blocks. NOT total startup, phoneFPS, GPUheap or quality acceptance. n5p95=max.',initialPreparation:{prepareCalls,prepareMs:preparedBefore.nativeJunction?.prepareMs??0,staticSourceBytes:preparedBefore.nativeJunction?.staticBytes??0,retainedByClear:true,excludesModuleJSParse:true},cold,warm,pan,coldRender:summary(cold.map(x=>x.ms)),warmRender:summary(warm),firstWarmMs:warm[0],steadyWarmRender:summary(warm.slice(1)),panRender:summary(pan.map(x=>x.ms)),rebuildPanRender:summary(pan.filter(x=>x.materialRebuilds>0).map(x=>x.ms)),cachedPanRender:summary(pan.filter(x=>x.materialRebuilds===0).map(x=>x.ms)),panFramesWithMaterialRebuild:pan.filter(x=>x.materialRebuilds>0).length,phaseCounterDeltas:{cold:delta(coldStart,coldEnd),warm:delta(warmStart,warmEnd),pan:delta(panStart,panEnd)},helperStats:panEnd,memoryScope:'Logical helper canvas/readback gauges only; native Path2D/GPU heap not measured'};

  let priorPng=null;
  // Independent transparent BODY probe: never prefill with Scene/foundation.
  const bodyProbe=document.createElement('canvas');bodyProbe.width=width;bodyProbe.height=height;
  const bc=bodyProbe.getContext('2d');bc.setTransform(camera.scale,0,0,camera.scale,width/2-camera.x*camera.scale,height/2-camera.y*camera.scale);
  const bodyLandmark=b.honroLandmarks.find(v=>v.asset?.id===newBody);assert(bodyLandmark,'Missing original BODY provider for alpha proof');
  HonroStage32FoundationArt.clear();assert(HonroStage32FoundationArt.draw(bc,bodyLandmark,b),'BODY-only helper did not render');
  const bodyOnlyPng=bodyProbe.toDataURL('image/png');assert(JSON.stringify(b)===before,'BODY alpha probe mutated battle');
  assert(HonroStage32FoundationArt.stats().fallbacks===0,'BODY alpha probe fallback');
  if(variant.startsWith('ss')){assert(materialStats.supersample.calls>0,'Supersample not exercised');assert(materialStats.supersample.factor===Number(variant.slice(2)),'Wrong SS factor');assert(materialStats.supersample.skips===0,'Supersample cap skipped');assert(materialStats.supersample.alphaChanged===0,'Supersample alpha changed');assert(materialStats.supersample.peakLogicalBytes<=24*1024*1024,'Supersample memory bound');assert(materialStats.transition.skips===0,'Existing transition cap skipped');} publishProbe({ok:true,paintFootprintPng,imagePlanes,bodyOnlyPng,ssObservation,zoomLimits,requestedScale,narrow:HonroStage32FoundationArt.stats().narrow??null,priorPng,performanceReport,renderSamples,renderTimingScope:'Initial unwrapped renders include first-use geometry/Path2D when actually exercised; asynchronous image waits excluded. Separate from prepared-source Scene-cold loops. Full document/JS startup is not measured.',transitionFills:materialStats.transition?.fills??0,scope:'Isolated Chrome production Scene diagnostic. Synthetic initial battle only; no user save, public UI, normal input or gameplay acceptance.',stage:id,variant,requestedCamera,drawDiagnostic,cacheStats:materialStats,sceneCacheStats:scene._cacheStats??null,...((id===32)?{tideSnapshot,appReadyUnresolved:true,initialization:'Official coast.tide; fresh in-memory profile; no App launch or event progression'}:{}),view,width,height,dpr:devicePixelRatio,camera,time:2,seed:3910,runtimeSha256,physicsSha256:await hash(physics),renderPure:true,firstFramePure:true,vectorSHA,sourcePathHashes,battleSha256:await hash(before),sourceCanonicalSha256:await hash(sourceCanonical),diagnosticMode:'Same raw candidate provider/physics across all groups. Direct-candidate-source bypasses helper only. Not released-old equivalence.',fontStatus:document.fonts.status,fontNote:'System sans-serif; document.fonts.ready awaited. Cross-backend text pixels are not an exact equality claim.',userAgent:navigator.userAgent,imageCount:p.images.length,pendingImages:p.images.filter(v=>v.pending).length,imageErrors:p.images.filter(v=>v.error).length,storage:p.storage,errors:p.errors,violations:p.violations,png:verifiedPng});
 }catch(e){
  let png=null,pngError=null;try{png=document.getElementById('scene')?.toDataURL('image/png')??null;}catch(error){pngError=String(error);}
  publishProbe({ok:false,stage:id,variant,view:requestedCamera.name,requestedCamera,error:String(e.stack||e),canonicalDiagnostic,...p,drawDiagnostic,cacheStats:globalThis.HonroStage32FoundationArt?.stats?.()??null,sceneCacheStats:diagnosticScene?._cacheStats??null,png,pngError});
 }
}


const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
const views=[{name:'left',width:1331,height:763,x:320,y:1650,scale:.6}];
for(const id of stages)for(const variant of ['candidate','ss2'])for(const view of views){
 let stageRuntime=runtime+'\n;\n'+testRenderer.replaceAll('HonroStage32FoundationArt','HonroStage32NativeComponentTestArt');
 const stageRuntimeSha256=createHash('sha256').update(stageRuntime).digest('hex');
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated production Scene diagnostic</title><style>body{margin:0}canvas{width:1331px;height:763px}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script(stageRuntime)+script('('+capture.toString()+')('+id+','+JSON.stringify(stageRuntimeSha256)+','+JSON.stringify(variant)+','+JSON.stringify(view)+');');
 await writeFile(path.join(out,`stage${id}-${variant}-${view.name}.html`),html);
}
console.log(JSON.stringify({stages,views,variants:['candidate','ss2'],runtimeSha256,runtimeBytes:Buffer.byteLength(runtime),scope:'Generator only. Run each fixture in a separate temporary Chrome profile with --force-device-scale-factor=1 --virtual-time-budget=60000 --dump-dom and external timeout 300s. Extractor requires completion, no fixed sleep acceptance.'}));



await writeFile(path.join(out,'capture-list.json'),JSON.stringify(['candidate','ss2','ss2','candidate','candidate','ss2','ss2','candidate'].map((variant,i)=>({variant,view:'abba-'+i,file:'stage32-'+variant+'-left.html'}))));
