import {runLiveTagProbe} from './tag-probe.mjs';
import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import path from'node:path';import{pathToFileURL}from'node:url';import assert from'node:assert/strict';
const [rootArg,out,mode='baseline']=process.argv.slice(2),root=path.resolve(rootArg);await mkdir(out,{recursive:true});assert.equal(process.env.HONRO_ACT4_RELEASE,'1');const cwd=process.cwd();let all;try{process.chdir(root);const{runtimeEntries}=await import(pathToFileURL(path.join(root,'shared/build.mjs')));all=await runtimeEntries({vector:true,render:true,app:true,productionStory:true});}finally{process.chdir(cwd);}assert.equal(all.filter(e=>e.name==='shared/runtime/main.js').length,1);const entries=all.filter(e=>e.name!=='shared/runtime/main.js');const candidateMode=mode==='candidate';const helper=entries.filter(e=>e.name==='shared/runtime/stage32-foundation-art.js');assert(['baseline','candidate'].includes(mode));assert.equal(helper.length,1);const sha=s=>createHash('sha256').update(s).digest('hex');assert.equal(sha(helper[0].code),'2cbc7689548b871021ebcf5c4190052029bac510a65cc16ef5ed10290ea828e5');const candidateHelper=await readFile(new URL('../candidate.js',import.meta.url),'utf8'),candidatePilot=await readFile(new URL('../pilot.js',import.meta.url),'utf8');assert.equal(sha(candidateHelper),"7ca476433572d83201e8e767fc3aa99d65192b592d59920a3bdf37acf41a64e3");assert.equal(sha(candidatePilot),"636b0562211ab2ee8b0018bc8c6ea8a584653c99ccaad5c76cd0d6ca5bd819c8");assert.equal(sha(entries.find(e=>e.name==='shared/runtime/act4-pilot-art.js').code),"2296c1edc9d316cbca882b8ed350c73aeb2668c9c8a659b15c754db3200efb7b");const visibleD=await readFile(new URL('../visible.svgpath',import.meta.url),'utf8');assert.equal(sha(visibleD),"864f51b028d961f1788514656188dbae41540b7508728e8d063d39582adeb941");const runtime=entries.map(e=>candidateMode&&e.name==='shared/runtime/stage32-foundation-art.js'?candidateHelper:candidateMode&&e.name==='shared/runtime/act4-pilot-art.js'?candidatePilot:e.code).join('\n;\n'),provenance={runtimeSHA256:sha(runtime),mode,helperSHA256:helper.length?sha(helper[0].code):null,ownRegisteredRuntime:!candidateMode,sourceOverride:candidateMode,candidateHelperSHA256:candidateMode?sha(candidateHelper):null,candidatePilotSHA256:candidateMode?sha(candidatePilot):null,excluded:['shared/runtime/main.js']};
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
async function capture(requestedCamera,provenance){const isRegistered=true,id=32,p=PROBE,assert=(v,m)=>{if(!v)throw Error(m);};try{assert(devicePixelRatio===(requestedCamera.dpr||1),'Actual Chrome DPR mismatch');
  const originalStage=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===32);
  assert(originalStage,'Missing official Stage32');
  const originalStageText=JSON.stringify(originalStage),stage=structuredClone(originalStage);
  const oldFoundation='approved32:coastal-foundation',newFoundation=isRegistered?'act4-handoff:32:foundation':'approved32:coastal-foundation',oldBody='act4-handoff:32:body-joined',newBody=isRegistered?'act4-handoff:32:body-shared-material':'act4-handoff:32:body-joined';
  const candidateVector=HONRO_PROJECT.library.find(a=>a.id===newBody).vector;
  const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
  const vectorSHA=await digest(JSON.stringify(candidateVector));
  if(isRegistered)assert(vectorSHA==='76e4fc6c04fc1f95aa9dcd0d97c9b8294c05cbe0a75169eb53174768f8da7cd1','Exact d18 raw candidate vector changed');
  const sourceNodes=[];function walkSource(n){if(n.tag==='path')sourceNodes.push(n);for(const child of n.children||[])walkSource(child);}walkSource(candidateVector.root);
  const sourcePathHashes=await Promise.all(sourceNodes.map(n=>digest(typeof n.d==='string'?n.d:n.dParts.join(''))));
  if(isRegistered)assert(sourceNodes.length===25&&JSON.stringify(sourcePathHashes)===JSON.stringify(HONRO_PROJECT.library.find(a=>a.id===newBody).params.stage32SharedMaterial.sourcePathSHA256),'Candidate author path contract changed');
  const sourceCanonical=JSON.stringify(HONRO_PROJECT.library.filter(a=>[oldFoundation,newFoundation,oldBody,newBody].includes(a.id)));
  const foundation=stage.elements.find(e=>e.id==='approved32-coastal-foundation'),body=stage.elements.find(e=>e.id==='approved32-body');
  assert(foundation.assetId===newFoundation&&body.assetId===newBody,'Expected candidate providers');
  assert(stage.design.vectorShelterDoor.bodyAssetId===newBody,'Candidate door BODY link');
  for(const aid of [oldFoundation,newFoundation,oldBody,newBody])assert(HONRO_PROJECT.library.some(a=>a.id===aid),'Missing provider '+aid);

  
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
  if(isRegistered)assert(HonroStage32FoundationArt.stats().nativeJunction.prepareCalls===0,'Helper prepared eagerly');
  const cv=document.getElementById('scene');cv.width=width;cv.height=height;cv.style.width=width+'px';cv.style.height=height+'px';
  const scene=new HonroScene(cv);
  const zoomLimits=HonroBounds.zoomLimits(width),requestedScale=requestedCamera.minimum?zoomLimits.min:requestedCamera.scale;
  Object.assign(scene,{x:requestedCamera.x,y:requestedCamera.y,scale:requestedScale,manual:true,time:2,editorView:false,skillPreview:false});
  HonroBounds.constrain(scene,b);
  const camera={x:scene.x,y:scene.y,scale:scene.scale},before=JSON.stringify(b);
  await document.fonts.ready;
  const drain=async()=>{for(let i=0;i<200;i++){if(!p.images.some(v=>v.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Image decode timeout');};
  const routeRows=[];const routeDraw=HonroStage32FoundationArt.draw;HonroStage32FoundationArt.draw=function(c,l,b,originalOnly,route){if(l?.asset?.id==='act4-handoff:32:body-shared-material'&&routeRows.length<500)routeRows.push({sceneScale:scene.scale,route:route??null,matrix:[c.getTransform().a,c.getTransform().d],canvas:[c.canvas.width,c.canvas.height]});const routeBefore=JSON.stringify(route),out=routeDraw.apply(this,arguments);assert(JSON.stringify(route)===routeBefore,'Public route object mutated');return out;};
  const renderSamples=[];const timedRender=()=>{const start=performance.now();scene.render(engine,0,'',.6,false,0);renderSamples.push({ms:performance.now()-start,sceneCacheStats:structuredClone(scene._cacheStats??null),materialStats:structuredClone(globalThis.HonroStage32FoundationArt?.stats?.()??null)});};
  for(let i=0;i<3;i++){timedRender();assert(JSON.stringify(b)===before,'Scene mutated battle at frame '+i);await drain();await new Promise(r=>setTimeout(r,100));}
  timedRender();await drain();
  assert(JSON.stringify(b)===before,'Scene mutated battle');
  assert(JSON.stringify(HONRO_PROJECT.library.filter(a=>[oldFoundation,newFoundation,oldBody,newBody].includes(a.id)))===sourceCanonical,'Canonical provider source mutated');
  assert(JSON.stringify(originalStage)===originalStageText,'Original stage changed during rendering');
  assert(JSON.stringify({terrain:b.terrain,units:b.units})===physics,'Physics changed');
  assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Storage/runtime/CSP error');
  assert(!p.images.some(v=>v.pending||v.error),'Pending or failed image');
  camera.x=scene.x;camera.y=scene.y;camera.scale=scene.scale;if(requestedCamera.minimum)assert(scene.scale===zoomLimits.min,'Minimum zoom changed');

const physicalWidth=cv.width,physicalHeight=cv.height,actualDPR=physicalWidth/width;const sceneMaterialStats=structuredClone(HonroStage32FoundationArt.stats());let liveTagProbe=null;const png=cv.toDataURL('image/png');const hashBytes=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',v)),v=>v.toString(16).padStart(2,'0')).join('');const sceneRGBA=await hashBytes(cv.getContext('2d').getImageData(0,0,physicalWidth,physicalHeight).data);let terrainRGBA=null,terrainPng=null;if(isRegistered){const bodyLandmark=b.honroLandmarks.find(v=>v.asset?.id===newBody),floor=b.honroLandmarks.find(v=>v.asset?.id===newFoundation);assert(bodyLandmark&&floor,'Registered placements missing');const tc=document.createElement('canvas');tc.width=physicalWidth;tc.height=physicalHeight;const c=tc.getContext('2d');c.setTransform(camera.scale*actualDPR,0,0,camera.scale*actualDPR,physicalWidth/2-camera.x*camera.scale*actualDPR,physicalHeight/2-camera.y*camera.scale*actualDPR);HonroStage32FoundationArt.clear();assert(HonroStage32FoundationArt.draw(c,floor,b,false,{sceneScale:camera.scale,nativeLive:camera.scale>1.05}),'Foundation fallback');assert(HonroStage32FoundationArt.draw(c,bodyLandmark,b,false,{sceneScale:camera.scale,nativeLive:camera.scale>1.05}),'BODY fallback');terrainRGBA=await hashBytes(c.getImageData(0,0,physicalWidth,physicalHeight).data);terrainPng=tc.toDataURL('image/png');}if(provenance.mode==='candidate'&&camera.scale>1.05&&!requestedCamera.coverageProbe){liveTagProbe=globalThis.__runLiveTagProbe({camera,width,height,body:HONRO_PROJECT.library.find(a=>a.id===newBody),field:HONRO_PROJECT.library.find(a=>a.id===newFoundation),...globalThis.__liveTagInputs});}assert(JSON.stringify(b)===before,'Probe battle mutation');assert(JSON.stringify(originalStage)===originalStageText,'Stage mutation');assert(!p.storage.length&&!p.errors.length,'Forbidden side effects');publishProbe({ok:true,view,width:physicalWidth,height:physicalHeight,cssWidth:width,cssHeight:height,actualDPR,coverageProbe:!!requestedCamera.coverageProbe,camera,physicsSha256:await digest(physics),vectorSHA,sourcePathHashes,sceneRGBA,terrainRGBA,png,renderSamples,routeRows,sceneMaterialStats,liveTagProbe,masks:terrainPng?{terrain:terrainPng}:{},provenance,storage:p.storage,errors:p.errors,renderPure:true});}catch(e){publishProbe({ok:false,error:String(e.stack||e),storage:p.storage,errors:p.errors});}}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';const list=[];for(const view of [{"name": "gray-left", "width": 1331, "height": 763, "x": 320, "y": 1650, "scale": 0.6}, {"name": "portrait-overview", "width": 390, "height": 696, "x": 1689.6, "y": 1200, "scale": 0.057352941176470586}, {"name": "portrait-bottom", "width": 390, "height": 696, "x": 1689.6, "y": 2492.8, "scale": 0.057352941176470586}, {"name": "landscape-overview", "width": 844, "height": 390, "x": 1689.6, "y": 1200, "scale": 0.12411764705882353}, {"name": "landscape-bottom", "width": 844, "height": 390, "x": 1689.6, "y": 2492.8, "scale": 0.12411764705882353}, {"name": "desktop-walk", "width": 1331, "height": 763, "x": 1689.6, "y": 1342, "scale": 1}, {"name": "native-walk", "width": 1331, "height": 763, "x": 1689.6, "y": 1342, "scale": 1.65}, {"name": "maximum", "width": 1331, "height": 763, "x": 320, "y": 1650, "scale": 1.65}, {"name": "renderer-below", "width": 1331, "height": 763, "x": 320, "y": 1650, "scale": 1.04999}, {"name": "renderer-above", "width": 1331, "height": 763, "x": 320, "y": 1650, "scale": 1.05001}, {"name": "coverage-phone-dpr2", "width": 390, "height": 696, "x": 1689.6, "y": 1342, "scale": 1.65, "dpr": 2, "coverageProbe": true}, {"name": "coverage-desktop-large", "width": 1920, "height": 1080, "x": 1689.6, "y": 1342, "scale": 1.65, "dpr": 1, "coverageProbe": true}]){const file=mode+'-'+view.name+'.html';await writeFile(path.join(out,file),'<!doctype html><meta charset="utf-8"><style>body{margin:0}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')(32);')+script(runtime)+script('globalThis.__runLiveTagProbe='+runLiveTagProbe.toString()+';globalThis.__liveTagInputs='+JSON.stringify({visibleD,baselineHelper:helper[0].code,candidateHelper})+';')+script('('+capture.toString()+')('+JSON.stringify(view)+','+JSON.stringify(provenance)+');'));list.push({variant:mode,view:view.name,file,dpr:view.dpr||1});}await writeFile(path.join(out,'capture-list.json'),JSON.stringify(list));
