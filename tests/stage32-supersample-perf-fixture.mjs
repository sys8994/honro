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
if(createHash('sha256').update(rendererCanonical).digest('hex')!=='8087017be0eb111b84139fe0cadda624a17c0c4532b90a3fb68fdb6336b3b785')throw Error('Requires exact production transition renderer');
const baselineRenderer=await readFile(path.join(root,'tests/fixtures/stage32-coverage-baseline13d.js'),'utf8');
if(createHash('sha256').update(baselineRenderer).digest('hex')!=='aab056752d65b36fcb620f5e3896ee4404926170de4c67d9fc33aa83fea22953')throw Error('Baseline helper source changed');

const priorRenderer=await readFile(path.join(root,'tests/fixtures/stage32-coverage-prior-span.js'),'utf8');
if(createHash('sha256').update(priorRenderer).digest('hex')!=='6fb4250253b658a29442be550a146bd38de50b1f682211af93847ad293f45745')throw Error('Prior helper changed');
const ssRenderer=await readFile(path.join(root,'tests/fixtures/stage32-supersample.js'),'utf8');
const spatialRenderer=await readFile(path.join(root,'tests/fixtures/stage32-original-band-spatial-reference.js'),'utf8');
if(createHash('sha256').update(ssRenderer).digest('hex')!=='cce019baf33466c6cfb1462e4904b85501495e723dc51adb9b2e968b6dd4f283')throw Error('Supersample renderer mismatch');
if(createHash('sha256').update(spatialRenderer).digest('hex')!=='1c973b4581f678890599e07e57733670bfeb32d64198e9b5439a28952538dca3')throw Error('Spatial renderer mismatch');
// runtimeParts is exactly runtimeEntries(...).map(entry=>entry.code). Names allow safe deduplication.
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const runtime=entries.map(entry=>entry.code).join('\n;\n');
const names=new Set(entries.map(entry=>entry.name)),act4Extra=[];
if(stages.some(id=>id===32)){
 for(const [name,file]of [['HONRO_ACT4_PILOT_COMBAT_REFERENCE','pilot-combat-reference.json'],['HONRO_ACT4_PREVIEW_SEEDS','reviewed.json']])if(!entries.some(e=>e.global===name||e.name===name))act4Extra.push('globalThis.'+name+'='+JSON.stringify(JSON.parse(await readFile(path.join(root,'shared/data/act4',file),'utf8')))+';');
 for(const name of ['act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-pilot-combat','stage32-foundation-art','act4-pilot-art']){
  const file='shared/runtime/'+name+'.js';if(names.has(file))continue;
  names.add(file);act4Extra.push(await readFile(path.join(root,file),'utf8'));
 }
}
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
  if(variant==='candidate')globalThis.HonroStage32FoundationArt=globalThis.HonroStage32FoundationOriginalArt;
  else globalThis.HonroStage32FoundationArt=variant==='spatial'?globalThis.HonroStage32FoundationSpatialReferenceArt:variant==='ss2'?globalThis.HonroStage32FoundationSS2Art:globalThis.HonroStage32FoundationSS4Art;
  if(variant.startsWith('ss')){const input=Uint8ClampedArray.from([255,0,0,255,0,0,255,0,0,255,0,128,0,0,255,255]);const v=HonroStage32FoundationArt.testBoxMean(input,2,0,0,2);assert(v.sumAlpha===638&&v.a===159.5,'Premultiplied alpha mean failed');assert(Math.abs(v.r-65025/638)<1e-12&&Math.abs(v.g-32640/638)<1e-12&&Math.abs(v.b-65025/638)<1e-12,'Premultiplied RGB reduction failed');} 
  globalThis.HONRO_STAGE32_VERIFY_PACKED_MASKS=variant==='spatial';
  const originalDraw=HonroStage32FoundationArt.draw;
  HonroStage32FoundationArt.draw=function(c,l,b){
   drawDiagnostic.calls++;
   const row={assetId:l?.asset?.id??null,stage:b?.honroStage??null,custom:b?.honroCustom??null,x:l?.x??null,y:l?.y??null,scale:l?.scale??null,rotation:l?.rotation??null};
   if(drawDiagnostic.rows.length<10)drawDiagnostic.rows.push(row);
   if(variant==='direct-candidate-source'&&l?.asset?.id==='act4-handoff:32:body-shared-material'){drawDiagnostic.directBypasses++;row.directBypass=true;return false;}
   const result=originalDraw.apply(this,arguments);row.returned=result;return result;
  };
  const vectorDraw=HonroVectorArt.draw;HonroVectorArt.draw=function(c,asset,l){if(variant==='direct-candidate-source'&&asset?.id==='act4-handoff:32:body-shared-material')drawDiagnostic.directVectorDraws++;return vectorDraw.apply(this,arguments);};
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
  assert(['candidate','spatial','ss2','ss4'].includes(variant),'Invalid variant');
  
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
  const view=requestedCamera.name,width=1331,height=763;
  const cv=document.getElementById('scene');cv.width=width;cv.height=height;cv.style.width=width+'px';cv.style.height=height+'px';
  const scene=new HonroScene(cv);diagnosticScene=scene;
  Object.assign(scene,{x:requestedCamera.x,y:requestedCamera.y,scale:requestedCamera.scale,manual:true,time:2,editorView:false,skillPreview:false});
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
  const materialStats=HonroStage32FoundationArt.stats();
  assert(materialStats.fallbacks===0,'Material renderer fallback');
  if(variant==='direct-candidate-source')assert(drawDiagnostic.directBypasses>0&&drawDiagnostic.directVectorDraws===drawDiagnostic.directBypasses,'Direct candidate source was not drawn through VectorArt');
  if(variant!=='direct-candidate-source')assert(materialStats.rasterizations>0&&materialStats.hits>0,'Candidate did not exercise shared material cache');
  const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
  globalThis.HONRO_STAGE32_VERIFY_PACKED_MASKS=false;
  const verifiedPng=cv.toDataURL('image/png'),cold=[],warm=[];
  const benchCanvas=document.createElement('canvas');benchCanvas.width=width;benchCanvas.height=height;Object.assign(benchCanvas.style,{position:'fixed',left:'-20000px',top:'0px',width:width+'px',height:height+'px'});document.body.appendChild(benchCanvas);
  let bench;
  for(let i=0;i<10;i++){
   HonroStage32FoundationArt.clear();bench=new HonroScene(benchCanvas);assert(benchCanvas.width===width&&benchCanvas.height===height,'Benchmark viewport resized');
   Object.assign(bench,{x:camera.x,y:camera.y,scale:camera.scale,manual:true,time:2,editorView:false,skillPreview:false});
   HonroBounds.constrain(bench,b);const r0=HonroStage32FoundationArt.stats().rasterizations,t=performance.now();bench.render(engine,0,'',.6,false,0);const ms=performance.now()-t;
   assert(HonroStage32FoundationArt.stats().rasterizations>r0,'Cold material not rebuilt');
   cold.push({ms,worldBuildMs:bench._cacheStats.worldBuildMs,logicalBytes:HonroStage32FoundationArt.stats().totalLogicalBytes??HonroStage32FoundationArt.stats().bytes});
   assert(JSON.stringify(b)===before,'Cold bench changed battle');
  }
  const warmRaster=HonroStage32FoundationArt.stats().rasterizations;
  for(let i=0;i<60;i++){const t=performance.now();bench.render(engine,0,'',.6,false,0);warm.push(performance.now()-t);}
  assert(HonroStage32FoundationArt.stats().rasterizations===warmRaster,'Warm bench rebuilt material');
  assert(JSON.stringify(b)===before&&JSON.stringify({terrain:b.terrain,units:b.units})===physics,'Bench changed battle/physics');
  assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Benchmark storage/runtime error');
  const summary=values=>{const a=[...values].sort((x,y)=>x-y);return{count:a.length,min:a[0],p50:a[Math.ceil(a.length*.5)-1],p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)};};
  const pan=[];
  for(let i=0;i<60;i++){bench.x=camera.x+16*(i+1);bench.y=camera.y;HonroBounds.constrain(bench,b);const beforeRaster=HonroStage32FoundationArt.stats().rasterizations,t=performance.now();bench.render(engine,0,'',.6,false,0);pan.push({ms:performance.now()-t,x:bench.x,y:bench.y,scale:bench.scale,materialRebuilds:HonroStage32FoundationArt.stats().rasterizations-beforeRaster,worldBuildMs:bench._cacheStats.worldBuildMs});}
  assert(JSON.stringify(b)===before&&JSON.stringify({terrain:b.terrain,units:b.units})===physics,'Pan benchmark mutated battle');
  const performanceReport={viewport:{width:benchCanvas.width,height:benchCanvas.height,cssWidth:benchCanvas.clientWidth,cssHeight:benchCanvas.clientHeight},scope:'10 independent in-memory Scene cold builds with helper.clear; 60 same-scene cached calls. Synchronous rendering only, decoded assets and prepared source geometry reused; NOT cold app startup. No user battle/save or device/gameplay FPS. Nearest-rank percentiles; n=10 p95 is maximum. Scene tile/image/GPU allocations not included in helper logical RGBA bytes.',cold,warm,pan,panRender:summary(pan.map(v=>v.ms)),panFramesWithMaterialRebuild:pan.filter(v=>v.materialRebuilds>0).length,panMaterialRebuilds:pan.reduce((n,v)=>n+v.materialRebuilds,0),coldRender:summary(cold.map(x=>x.ms)),coldWorldBuild:summary(cold.map(x=>x.worldBuildMs)),warmRender:summary(warm),warmNoMaterialRebuild:true,helperStats:HonroStage32FoundationArt.stats()};

  let priorPng=null;
  if(variant==='transition'){
   const current=HonroStage32FoundationArt,pc=document.createElement('canvas');pc.width=width;pc.height=height;Object.assign(pc.style,{position:'fixed',left:'-20000px',top:'0px',width:width+'px',height:height+'px'});document.body.appendChild(pc);
   try{
    globalThis.HonroStage32FoundationArt=HonroStage32FoundationPriorArt;HonroStage32FoundationArt.clear();
    const ps=new HonroScene(pc);assert(pc.width===width&&pc.height===height,'Prior reference viewport resized');Object.assign(ps,{...camera,manual:true,time:2,editorView:false,skillPreview:false});HonroBounds.constrain(ps,b);
    for(let i=0;i<4;i++){ps.render(engine,0,'',.6,false,0);await drain();}
    assert(JSON.stringify(b)===before,'Prior reference mutated battle');
    assert(JSON.stringify(HONRO_PROJECT.library.filter(a=>[oldFoundation,newFoundation,oldBody,newBody].includes(a.id)))===sourceCanonical,'Prior reference changed provider');
    priorPng=pc.toDataURL('image/png');
   }finally{globalThis.HonroStage32FoundationArt=current;pc.remove();}
  }

  if(variant.startsWith('ss')){assert(materialStats.supersample.calls>0,'Supersample not exercised');assert(materialStats.supersample.factor===Number(variant.slice(2)),'Wrong SS factor');assert(materialStats.supersample.skips===0,'Supersample cap skipped');assert(materialStats.supersample.alphaChanged===0,'Supersample alpha changed');assert(materialStats.supersample.peakLogicalBytes<=24*1024*1024,'Supersample memory bound');assert(materialStats.transition.skips===0,'Existing transition cap skipped');} publishProbe({ok:true,priorPng,performanceReport,renderSamples,renderTimingScope:'First synchronous Scene.render includes debug semantic-mask equivalence work, NOT production timing; cold/pan benchmark disables that work. Excludes asynchronous image wait. Single run, not p50/p95 or hardware benchmark.',transitionFills:materialStats.transition?.fills??0,scope:'Isolated Chrome production Scene diagnostic. Synthetic initial battle only; no user save, public UI, normal input or gameplay acceptance.',stage:id,variant,requestedCamera,drawDiagnostic,cacheStats:materialStats,sceneCacheStats:scene._cacheStats??null,...((id===32)?{tideSnapshot,appReadyUnresolved:true,initialization:'Official coast.tide; fresh in-memory profile; no App launch or event progression'}:{}),view,width,height,dpr:devicePixelRatio,camera,time:2,seed:3910,runtimeSha256,physicsSha256:await hash(physics),renderPure:true,firstFramePure:true,vectorSHA,sourcePathHashes,battleSha256:await hash(before),sourceCanonicalSha256:await hash(sourceCanonical),diagnosticMode:'Same raw candidate provider/physics across all groups. Direct-candidate-source bypasses helper only. Not released-old equivalence.',fontStatus:document.fonts.status,fontNote:'System sans-serif; document.fonts.ready awaited. Cross-backend text pixels are not an exact equality claim.',userAgent:navigator.userAgent,imageCount:p.images.length,pendingImages:p.images.filter(v=>v.pending).length,imageErrors:p.images.filter(v=>v.error).length,storage:p.storage,errors:p.errors,violations:p.violations,png:verifiedPng});
 }catch(e){
  let png=null,pngError=null;try{png=document.getElementById('scene')?.toDataURL('image/png')??null;}catch(error){pngError=String(error);}
  publishProbe({ok:false,stage:id,variant,view:requestedCamera.name,requestedCamera,error:String(e.stack||e),canonicalDiagnostic,...p,drawDiagnostic,cacheStats:globalThis.HonroStage32FoundationArt?.stats?.()??null,sceneCacheStats:diagnosticScene?._cacheStats??null,png,pngError});
 }
}


const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
const views=[{name:'lower',x:1689.6,y:1900,scale:.6},{name:'left',x:320,y:1650,scale:.6}];
for(const id of stages)for(const variant of ['candidate','spatial','ss2','ss4'])for(const view of views){
 let stageRuntime=((id===32)?runtime+'\n;\n'+act4Extra.join('\n;\n'):runtime)+'\n;\n'+baselineRenderer.replaceAll('HonroStage32FoundationArt','HonroStage32FoundationOriginalArt')+'\n;\n'+priorRenderer.replaceAll('HonroStage32FoundationArt','HonroStage32FoundationPriorArt');
 stageRuntime+='\n;\n'+ssRenderer.replace('const SS=4','const SS=2').replaceAll('HonroStage32FoundationArt','HonroStage32FoundationSS2Art')+'\n;\n'+ssRenderer.replaceAll('HonroStage32FoundationArt','HonroStage32FoundationSS4Art')+'\n;\n'+spatialRenderer.replaceAll('HonroStage32FoundationArt','HonroStage32FoundationSpatialReferenceArt');
 const stageRuntimeSha256=createHash('sha256').update(stageRuntime).digest('hex');
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated production Scene diagnostic</title><style>body{margin:0}canvas{width:1331px;height:763px}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script(stageRuntime)+script('('+capture.toString()+')('+id+','+JSON.stringify(stageRuntimeSha256)+','+JSON.stringify(variant)+','+JSON.stringify(view)+');');
 await writeFile(path.join(out,`stage${id}-${variant}-${view.name}.html`),html);
}
console.log(JSON.stringify({stages,views,variants:['candidate','spatial','ss2','ss4'],runtimeSha256,runtimeBytes:Buffer.byteLength(runtime),scope:'Generator only. Run each fixture in a separate temporary Chrome profile with --force-device-scale-factor=1 --virtual-time-budget=60000 --dump-dom and external timeout 300s. Extractor requires completion, no fixed sleep acceptance.'}));


