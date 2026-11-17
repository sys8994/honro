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
if(createHash('sha256').update(rendererCanonical).digest('hex')!=='aab056752d65b36fcb620f5e3896ee4404926170de4c67d9fc33aa83fea22953')throw Error('Requires exact production transition renderer');
// runtimeParts is exactly runtimeEntries(...).map(entry=>entry.code). Names allow safe deduplication.
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const runtime=entries.map(entry=>entry.code).join('\n;\n');
const sourceProject=entries.find(e=>e.project).project;await writeFile(path.join(out,'source-evidence.json'),JSON.stringify({stage:sourceProject.stages.find(s=>s.metadata?.stageId===32),body:sourceProject.library.find(a=>a.id==='act4-handoff:32:body-shared-material'),providers:sourceProject.library.filter(a=>/32/.test(a.id)).map(a=>({id:a.id,bounds:a.bounds,sha256:createHash('sha256').update(JSON.stringify(a)).digest('hex')}))}));
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
  globalThis.HonroStage32FoundationArt=variant==='outside'?HonroStage32GrayOutside:variant==='solid'?HonroStage32GraySolid:HonroStage32GrayCurrent;
  const tileReports=[],seenTiles=new Set(),currentDraw=HonroStage32GrayCurrent.draw,outsideDraw=HonroStage32GrayOutside.draw,solidDraw=HonroStage32GraySolid.draw;
  const originalDraw=HonroStage32FoundationArt.draw;
  HonroStage32FoundationArt.draw=function(c,l,b){
   drawDiagnostic.calls++;
   const row={assetId:l?.asset?.id??null,stage:b?.honroStage??null,custom:b?.honroCustom??null,x:l?.x??null,y:l?.y??null,scale:l?.scale??null,rotation:l?.rotation??null};
   if(drawDiagnostic.rows.length<10)drawDiagnostic.rows.push(row);
   if(variant==='direct-candidate-source'&&l?.asset?.id==='act4-handoff:32:body-shared-material'){drawDiagnostic.directBypasses++;row.directBypass=true;return false;}
   let tile=null,inputBefore=null;
   if(variant==='current'&&l?.asset?.id==='act4-handoff:32:body-shared-material'){
    const m=c.getTransform(),key=[c.canvas.width,c.canvas.height,m.a,m.b,m.c,m.d,m.e,m.f].join(',');
    if(!seenTiles.has(key)){seenTiles.add(key);inputBefore=c.getImageData(0,0,c.canvas.width,c.canvas.height);}
   }
   const result=originalDraw.apply(this,arguments);row.returned=result;
   if(inputBefore){const actual=c.getImageData(0,0,c.canvas.width,c.canvas.height).data;tile=grayTileProbe(c,l,b,currentDraw,outsideDraw,solidDraw,inputBefore);let changed=0,max=0;for(let k=0;k<actual.length;k+=4){let d=0;for(let j=0;j<4;j++)d=Math.max(d,Math.abs(actual[k+j]-tile.predictedCurrent[k+j]));if(d){changed++;max=Math.max(max,d);}}tile.report.currentReplay={changed,max};tileReports.push(tile.report);}
   return result;
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
  assert(['current','outside','solid'].includes(variant),'Invalid variant');
  
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
  const verifiedPng=cv.toDataURL('image/png');
  if(variant==='current'){assert(tileReports.length>0,'No tile diagnostics');assert(tileReports.every(t=>t.currentReplay.changed===0),'Replay does not match actual cache plane');}
  publishProbe({ok:true,tileReports,renderSamples,renderTimingScope:'First synchronous Scene.render and three subsequent cached calls, excludes asynchronous image wait. Single run, not p50/p95 or hardware benchmark.',transitionFills:materialStats.transition?.fills??0,scope:'Isolated Chrome production Scene diagnostic. Synthetic initial battle only; no user save, public UI, normal input or gameplay acceptance.',stage:id,variant,requestedCamera,drawDiagnostic,cacheStats:materialStats,sceneCacheStats:scene._cacheStats??null,...((id===32)?{tideSnapshot,appReadyUnresolved:true,initialization:'Official coast.tide; fresh in-memory profile; no App launch or event progression'}:{}),view,width,height,dpr:devicePixelRatio,camera,time:2,seed:3910,runtimeSha256,physicsSha256:await hash(physics),renderPure:true,firstFramePure:true,vectorSHA,sourcePathHashes,battleSha256:await hash(before),sourceCanonicalSha256:await hash(sourceCanonical),diagnosticMode:'Same raw candidate provider/physics across all groups. Direct-candidate-source bypasses helper only. Not released-old equivalence.',fontStatus:document.fonts.status,fontNote:'System sans-serif; document.fonts.ready awaited. Cross-backend text pixels are not an exact equality claim.',userAgent:navigator.userAgent,imageCount:p.images.length,pendingImages:p.images.filter(v=>v.pending).length,imageErrors:p.images.filter(v=>v.error).length,storage:p.storage,errors:p.errors,violations:p.violations,png:verifiedPng});
 }catch(e){
  let png=null,pngError=null;try{png=document.getElementById('scene')?.toDataURL('image/png')??null;}catch(error){pngError=String(error);}
  publishProbe({ok:false,stage:id,variant,view:requestedCamera.name,requestedCamera,error:String(e.stack||e),canonicalDiagnostic,...p,drawDiagnostic,cacheStats:globalThis.HonroStage32FoundationArt?.stats?.()??null,sceneCacheStats:diagnosticScene?._cacheStats??null,png,pngError});
 }
}


const grayNeedle="c.save();c.clip(n.path,n.rule);bitmap(c,cv);\n    if(n.gray){c.fillStyle=n.fill;c.fill(n.gray,n.rule);}c.restore();";
if(rendererCanonical.split(grayNeedle).length!==2)throw Error('Gray compositor source changed');
const outsideRenderer=rendererCanonical.replace(grayNeedle,"c.save();c.clip(n.path,n.rule);bitmap(c,cv);c.restore();\n    if(n.gray){c.fillStyle=n.fill;c.fill(n.gray,n.rule);}").replaceAll('HonroStage32FoundationArt','HonroStage32GrayOutside');
const solidRenderer=rendererCanonical.replace(grayNeedle,"c.save();c.clip(n.path,n.rule);c.fillStyle=n.fill;c.fillRect(-1000000,-1000000,2000000,2000000);\n    if(n.gray){c.fillStyle=n.fill;c.fill(n.gray,n.rule);}c.restore();").replaceAll('HonroStage32FoundationArt','HonroStage32GraySolid');
function grayTileProbe(c,l,b,currentDraw,outsideDraw,solidDraw,input){
 const w=c.canvas.width,h=c.canvas.height,m=c.getTransform(),asset=l.asset,nodes=[];
 function walk(n){if(n.tag==='path')nodes.push(n);for(const a of n.children||[])walk(a);}walk(asset.vector.root);
 const cfg=asset.params.stage32SharedMaterial,apron=new Path2D(asset.vector.clips.portApron.join(''));
 const make=()=>{const v=document.createElement('canvas');v.width=w;v.height=h;return v.getContext('2d');};
 const replay=draw=>{const q=make();q.putImageData(input,0,0);q.setTransform(m);q.globalAlpha=c.globalAlpha;q.globalCompositeOperation=c.globalCompositeOperation;q.filter=c.filter;q.shadowBlur=c.shadowBlur;q.shadowOffsetX=c.shadowOffsetX;q.shadowOffsetY=c.shadowOffsetY;q.shadowColor=c.shadowColor;draw(q,l,b);return q.getImageData(0,0,w,h).data;};
 const A=replay(currentDraw),B=replay(outsideDraw),C=replay(solidDraw);
 const sourceContext=()=>{const q=make();q.setTransform(m);q.clip(apron);q.scale(2.2,2.2);return q;};
 const path=i=>new Path2D(nodes[i].d??nodes[i].dParts.join(''));
 const visible=indices=>{const q=make();q.fillStyle='#000';q.fillRect(0,0,w,h);q.setTransform(m);q.clip(apron);q.scale(2.2,2.2);for(let i=0;i<nodes.length;i++){q.fillStyle=indices.includes(i)?'#fff':'#000';q.fill(path(i),nodes[i].fillRule||'nonzero');}return q.getImageData(0,0,w,h).data;};
 const grass=visible([12,13,14,15,16,17]),road=visible([21,22,23,24]);
 const grayQ=make();grayQ.fillStyle='#000';grayQ.fillRect(0,0,w,h);grayQ.setTransform(m);grayQ.clip(apron);grayQ.scale(2.2,2.2);for(let i=0;i<nodes.length;i++){grayQ.fillStyle='#000';grayQ.fill(path(i),nodes[i].fillRule||'nonzero');if(cfg.graySubpaths[i]){const d=nodes[i].d??nodes[i].dParts.join(''),subs=d.match(/[Mm][^Mm]*/g);grayQ.save();grayQ.clip(path(i),nodes[i].fillRule||'nonzero');grayQ.fillStyle='#fff';grayQ.fill(new Path2D(cfg.graySubpaths[i].map(j=>subs[j]).join('')),nodes[i].fillRule||'nonzero');grayQ.restore();}}const visibleGray=grayQ.getImageData(0,0,w,h).data;

 const diff=(X,Y,mask,kind)=>{let changed=0,max=0,opaque=0,edge=0;const samples=[];for(let k=0;k<X.length;k+=4){if(mask&&!mask[k])continue;let d=0;for(let z=0;z<4;z++)d=Math.max(d,Math.abs(X[k+z]-Y[k+z]));if(d){changed++;max=Math.max(max,d);if(mask)(mask[k]===255?opaque++:edge++);if(samples.length<12){const px=(k/4)%w,py=Math.floor(k/4/w),wx=(px-m.e)/m.a,wy=(py-m.f)/m.d;samples.push({x:px,y:py,world:[wx,wy],before:Array.from(X.slice(k,k+4)),after:Array.from(Y.slice(k,k+4)),coverage:mask?.[k]??null});}}}return {kind,changed,max,opaque,edge,samples};};
 const subset=[];
 for(const [key,indices]of Object.entries(cfg.graySubpaths)){
  const i=Number(key),d=nodes[i].d??nodes[i].dParts.join(''),subs=d.match(/[Mm][^Mm]*/g),fq=sourceContext(),gq=sourceContext();fq.fillStyle=gq.fillStyle='#fff';fq.fill(path(i),nodes[i].fillRule||'nonzero');gq.fill(new Path2D(indices.map(j=>subs[j]).join('')),nodes[i].fillRule||'nonzero');const F=fq.getImageData(0,0,w,h).data,G=gq.getImageData(0,0,w,h).data;
  let grayPositive=0,outsideFull=0,greaterCoverage=0,maxOutsideAlpha=0,maxExcess=0;for(let k=3;k<G.length;k+=4){if(G[k]){grayPositive++;if(!F[k]){outsideFull++;maxOutsideAlpha=Math.max(maxOutsideAlpha,G[k]);}if(G[k]>F[k]){greaterCoverage++;maxExcess=Math.max(maxExcess,G[k]-F[k]);}}}subset.push({path:i,grayPositive,outsideFull,greaterCoverage,maxOutsideAlpha,maxExcess});
 }
 return {predictedCurrent:A,predictedOutside:B,predictedSolid:C,report:{width:w,height:h,matrix:[m.a,m.b,m.c,m.d,m.e,m.f],diff:diff(A,B,null,'current-vs-outside'),grass:diff(A,B,grass,'original-visible-grass'),road:diff(A,B,road,'original-visible-road'),grayOriginalOpaque:diff(A,B,visibleGray,'original-selected-gray-visible; only coverage255 is opaque preservation metric'),solidVsCurrent:diff(A,C,null,'original-color-control-vs-current'),subset,maskScope:'Exact cache-plane transform; original 25 raw paths, source-over order, apron; white/black visible contribution, not union. Source geometry/palette unchanged. Final edge RGB is measured, not silently waived.'}};
}

const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
const views=[{name:'lower',x:1689.6,y:1900,scale:.6},{name:'left',x:320,y:1650,scale:.6}];
for(const id of stages)for(const variant of ['current','outside','solid'])for(const view of views){
 const stageRuntime=((id===32)?runtime+'\n;\n'+act4Extra.join('\n;\n'):runtime)+'\n;globalThis.HonroStage32GrayCurrent=HonroStage32FoundationArt;\n'+outsideRenderer+'\n;\n'+solidRenderer;
 const stageRuntimeSha256=createHash('sha256').update(stageRuntime).digest('hex');
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated production Scene diagnostic</title><style>body{margin:0}canvas{width:1331px;height:763px}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script(stageRuntime)+script(grayTileProbe.toString()+';('+capture.toString()+')('+id+','+JSON.stringify(stageRuntimeSha256)+','+JSON.stringify(variant)+','+JSON.stringify(view)+');');
 await writeFile(path.join(out,`stage${id}-${variant}-${view.name}.html`),html);
}
console.log(JSON.stringify({stages,views,variants:['current','outside','solid'],runtimeSha256,runtimeBytes:Buffer.byteLength(runtime),scope:'Generator only. Run each fixture in a separate temporary Chrome profile with --force-device-scale-factor=1 --virtual-time-budget=60000 --dump-dom and external timeout 300s. Extractor requires completion, no fixed sleep acceptance.'}));

