import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import path from'node:path';import{pathToFileURL}from'node:url';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';
const[rootArg,out]=process.argv.slice(2),root=path.resolve(rootArg),mode='candidate';await mkdir(out,{recursive:true});assert.equal(process.env.HONRO_ACT4_RELEASE,'1');const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();assert.equal(commit,'dbb25e21e075a495581ddaf8e2c0e615fe2e621e');const cwd=process.cwd();let all;try{process.chdir(root);const{runtimeEntries}=await import(pathToFileURL(path.join(root,'shared/build.mjs')));all=await runtimeEntries({vector:true,render:true,app:true,productionStory:true});}finally{process.chdir(cwd);}assert.equal(all.filter(e=>e.name==='shared/runtime/main.js').length,1);const entries=all.filter(e=>e.name!=='shared/runtime/main.js'),sha=s=>createHash('sha256').update(s).digest('hex');
const pins={'shared/runtime/stage32-foundation-art.js':'8c8fd33fc74ea89cca7895d01bd96b6a0928330b3b531a3c55671a181d3bbdc2','shared/runtime/act4-pilot-art.js':'636b0562211ab2ee8b0018bc8c6ea8a584653c99ccaad5c76cd0d6ca5bd819c8'};for(const[name,expected]of Object.entries(pins)){const matches=entries.filter(e=>e.name===name);assert.equal(matches.length,1,name);assert.equal(sha(matches[0].code),expected,name);assert.equal(sha(await readFile(path.join(root,name),'utf8')),expected,name);}
const scalePins={'shared/runtime/monster-scale.js':'a2458a7208e09d7aa96f6d439223be371308d16e8d3950122e9595bc4fd4e44e','shared/runtime/monster-scale-art.js':'adf41b356bb29daaafcbc96ab62752f088cdbcb8fc751b9a927a727ef8b17889'};for(const[name,pin]of Object.entries(scalePins)){assert.equal(entries.filter(e=>e.name===name).length,1);assert.equal(sha(entries.find(e=>e.name===name).code),pin);assert.equal(sha(await readFile(path.join(root,name),'utf8')),pin);}const order=name=>entries.findIndex(e=>e.name===name);assert(order('shared/runtime/monster-diversity.js')<order('shared/runtime/monster-scale.js'));assert(order('shared/runtime/monster-scale.js')<order('shared/map/compiler.js'));assert.equal(order('shared/runtime/monster-scale-art.js'),order('shared/runtime/monster-vector.js')+1);
const runtime=entries.map(e=>e.code).join('\n;\n'),provenance={commit,runtimeSHA256:sha(runtime),mode,sourceOverrides:false,ownRegisteredRuntime:true,registeredPins:pins,scalePins,excluded:['shared/runtime/main.js']};
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
  assert(HonroMonsterScale.REVISION===1&&b.honroMonsterScaleRevision===1,'Fresh scale registration inactive');assert(typeof HonroMonsterScale.sync==='function'&&typeof HonroMonsterScaleArt.install==='function','Scale/art hooks missing');assert(HonroMonsterOmen[16]&&!HonroMonsterOmen[5],'Stage16 omen regression');assert(HonroMonsterScale.DARK[46],'Darkness46 registry missing');const scaleSummary={revision:b.honroMonsterScaleRevision,tagged:b.units.filter(u=>u.honroMonsterScale).length,enlarged:b.units.filter(u=>u.honroMonsterScale&&!u.honroMonsterScale.kept).length,omenStages:Object.keys(HonroMonsterOmen),darknessStages:Object.keys(HonroMonsterScale.DARK)};assert(scaleSummary.tagged>0,'No positive scaled units');
  const engine=new HONRO_CORE.Engine(b,()=>{},true);
  if(id===32)globalThis.HonroApp={engine};
  const stable=v=>JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);const codecOriginal=stable(b),codecInput=structuredClone(b),encoded=structuredClone(HonroProfileStore.compactBattleArt(codecInput));assert(stable(codecInput)===codecOriginal,'Codec compact mutation');const restored=structuredClone(encoded);assert(HonroProfileStore.restoreBattleArt(restored),'Codec restore rejected');assert(stable(restored)===codecOriginal,'Own codec roundtrip changed battle');const codecRoundtripExact=true;
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
  const budgetLifecycle=[];
  if(requestedCamera.name==='maximum'){
   const originalScale=scene.scale;
   for(const scale of [.6,1.65,.6,1.65]){scene.scale=scale;timedRender();await drain();timedRender();const rgba=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;const frameHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',rgba)),n=>n.toString(16).padStart(2,'0')).join('');budgetLifecycle.push({scale,frameHash,stats:structuredClone(HonroStage32FoundationArt.stats())});}
   scene.scale=originalScale;timedRender();await drain();
  }

  assert(JSON.stringify(b)===before,'Scene mutated battle');
  assert(JSON.stringify(HONRO_PROJECT.library.filter(a=>[oldFoundation,newFoundation,oldBody,newBody].includes(a.id)))===sourceCanonical,'Canonical provider source mutated');
  assert(JSON.stringify(originalStage)===originalStageText,'Original stage changed during rendering');
  assert(JSON.stringify({terrain:b.terrain,units:b.units})===physics,'Physics changed');
  assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Storage/runtime/CSP error');
  assert(!p.images.some(v=>v.pending||v.error),'Pending or failed image');
  camera.x=scene.x;camera.y=scene.y;camera.scale=scene.scale;if(requestedCamera.minimum)assert(scene.scale===zoomLimits.min,'Minimum zoom changed');

const physicalWidth=cv.width,physicalHeight=cv.height,actualDPR=physicalWidth/width;const sceneMaterialStats=structuredClone(HonroStage32FoundationArt.stats());let liveTagProbe=null;const png=cv.toDataURL('image/png');const hashBytes=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',v)),v=>v.toString(16).padStart(2,'0')).join('');const sceneRGBA=await hashBytes(cv.getContext('2d').getImageData(0,0,physicalWidth,physicalHeight).data);let terrainRGBA=null,terrainPng=null,lowerProbe=null;globalThis.__lowerProbe=null;globalThis.__onLowerTarget=q=>{const original=q.c.getImageData(0,q.y0,q.w,q.rows).data,target=q.target.getContext('2d').getImageData(0,0,q.w,q.rows).data,field=q.cv.getContext('2d').getImageData(0,q.y0,q.w,q.rows).data;let targetDifferencePixels=0,fieldNonopaque=0,targetAlphaChanged=0,originalNonopaqueOnDifference=0;for(let k=0;k<target.length;k+=4){targetAlphaChanged+=target[k+3]!==original[k+3];if([0,1,2].some(j=>target[k+j]!==original[k+j])){targetDifferencePixels++;originalNonopaqueOnDifference+=original[k+3]!==255;if(field[k+3]!==255)fieldNonopaque++;}}globalThis.__lowerProbe={...q,targetDifferencePixels,fieldNonopaque,targetAlphaChanged,originalNonopaqueOnDifference};};if(isRegistered){const bodyLandmark=b.honroLandmarks.find(v=>v.asset?.id===newBody),floor=b.honroLandmarks.find(v=>v.asset?.id===newFoundation);assert(bodyLandmark&&floor,'Registered placements missing');const tc=document.createElement('canvas');tc.width=physicalWidth;tc.height=physicalHeight;const c=tc.getContext('2d');c.setTransform(camera.scale*actualDPR,0,0,camera.scale*actualDPR,physicalWidth/2-camera.x*camera.scale*actualDPR,physicalHeight/2-camera.y*camera.scale*actualDPR);HonroStage32FoundationArt.clear();assert(HonroStage32FoundationArt.draw(c,floor,b,false,{sceneScale:camera.scale,nativeLive:camera.scale>1.05}),'Foundation fallback');assert(HonroStage32FoundationArt.draw(c,bodyLandmark,b,false,{sceneScale:camera.scale,nativeLive:camera.scale>1.05}),'BODY fallback');terrainRGBA=await hashBytes(c.getImageData(0,0,physicalWidth,physicalHeight).data);terrainPng=tc.toDataURL('image/png');}if(globalThis.__lowerProbe){const q=globalThis.__lowerProbe,work=q.target.getContext('2d').getImageData(0,0,q.w,q.rows).data;let workPositive=0;for(let k=3;k<work.length;k+=4)workPositive+=work[k]>0;lowerProbe={y0:q.y0,width:q.w,height:q.rows,workPositive,targetDifferencePixels:q.targetDifferencePixels,fieldNonopaque:q.fieldNonopaque,targetAlphaChanged:q.targetAlphaChanged,originalNonopaqueOnDifference:q.originalNonopaqueOnDifference};}delete globalThis.__onLowerTarget;assert(JSON.stringify(b)===before,'Probe battle mutation');assert(JSON.stringify(originalStage)===originalStageText,'Stage mutation');assert(!p.storage.length&&!p.errors.length,'Forbidden side effects');let all50=null;if(view==='gray-left'){all50=[];const originalProject=stable(HONRO_PROJECT);assert(HONRO_PROJECT.stages.length===50,'All50 stages absent');for(const src of HONRO_PROJECT.stages){const st=structuredClone(src);HonroMaps.compile(st,HONRO_PROJECT);const fresh=HonroMaps.createBattle(st,HONRO_PROJECT,HonroProfileStore.fresh(),{origin:'campaign'});HonroStageRules.sanitizeStageBattle(fresh);const original=stable(fresh),packed=structuredClone(HonroProfileStore.compactBattleArt(fresh));assert(stable(fresh)===original,'All50 compact mutation');const restored=structuredClone(packed);assert(HonroProfileStore.restoreBattleArt(restored),'All50 restore rejected');assert(stable(restored)===original,'All50 codec mismatch '+src.metadata.stageId);all50.push({stage:src.metadata.stageId,codecExact:true,scaleRevision:fresh.honroMonsterScaleRevision??null,tagged:fresh.units.filter(u=>u.honroMonsterScale).length,terrainSHA:await digest(JSON.stringify(fresh.terrain)),unitsSHA:await digest(JSON.stringify(fresh.units)),fullSHA:await digest(original)});}assert(stable(HONRO_PROJECT)===originalProject,'All50 project mutation');assert(all50.every(r=>r.scaleRevision===1),'Fresh scale policy missing');}
publishProbe({ok:true,view,width:physicalWidth,height:physicalHeight,cssWidth:width,cssHeight:height,actualDPR,coverageProbe:!!requestedCamera.coverageProbe,camera,physicsSha256:await digest(physics),vectorSHA,sourcePathHashes,sceneRGBA,terrainRGBA,png,renderSamples,budgetLifecycle,routeRows,sceneMaterialStats,liveTagProbe,lowerProbe,masks:terrainPng?{terrain:terrainPng}:{},provenance,storage:p.storage,errors:p.errors,renderPure:true,codecRoundtripExact,scaleSummary,all50});}catch(e){publishProbe({ok:false,error:String(e.stack||e),storage:p.storage,errors:p.errors});}}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';const list=[];for(const view of [{"name": "maximum", "width": 1331, "height": 763, "x": 320, "y": 1650, "scale": 1.65}, {"name": "gray-left", "width": 1331, "height": 763, "x": 320, "y": 1650, "scale": 0.6}, {"name": "phone-dpr2", "width": 390, "height": 696, "x": 320, "y": 1650, "scale": 1.65, "dpr": 2}, {"name": "phone-dpr3", "width": 390, "height": 696, "x": 320, "y": 1650, "scale": 1.65, "dpr": 3}, {"name": "desktop1080", "width": 1920, "height": 1080, "x": 320, "y": 1650, "scale": 1.65, "dpr": 1}]){if(mode==='fallback'&&!['phone-dpr2','phone-dpr3','desktop1080'].includes(view.name))continue;const file=mode+'-'+view.name+'.html';await writeFile(path.join(out,file),'<!doctype html><meta charset="utf-8"><style>body{margin:0}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')(32);')+script(runtime)+script('('+capture.toString()+')('+JSON.stringify(view)+','+JSON.stringify(provenance)+');'));list.push({variant:mode,view:view.name,file,dpr:view.dpr||1});}await writeFile(path.join(out,'capture-list.json'),JSON.stringify(list));
