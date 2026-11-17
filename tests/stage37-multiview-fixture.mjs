/** CI-only generator: isolated production Scene, not public UI/gameplay acceptance. */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runtimeEntries,root} from '../shared/build.mjs';
import {firstRenderContract} from './act4-middle-frame-contract.mjs';
const out=process.argv[2];
if(!out)throw Error('Usage: node tests/act4-middle-browser-fixture.mjs OUTPUT_DIRECTORY');
const stages=[37],variants=["baseline","single-clip"];
if(!stages.length||new Set(stages).size!==stages.length||stages.some(id=>![34,37,38].includes(id)))throw Error('Unsupported or duplicate stage');
if(stages.some(id=>[34,37,38].includes(id))&&process.env.HONRO_ACT4_RELEASE!=='1')throw Error('Act4 middle stages require HONRO_ACT4_RELEASE=1');
await mkdir(out,{recursive:true});
// runtimeParts is exactly runtimeEntries(...).map(entry=>entry.code). Names allow safe deduplication.
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const runtime=entries.map(entry=>entry.code).join('\n;\n');
const names=new Set(entries.map(entry=>entry.name)),act4Extra=[];
if(stages.some(id=>[34,37,38].includes(id))){
 for(const [name,file]of [['HONRO_ACT4_PILOT_COMBAT_REFERENCE','pilot-combat-reference.json'],['HONRO_ACT4_PREVIEW_SEEDS','reviewed.json']])if(!entries.some(e=>e.global===name||e.name===name))act4Extra.push('globalThis.'+name+'='+JSON.stringify(JSON.parse(await readFile(path.join(root,'shared/data/act4',file),'utf8')))+';');
 for(const name of ['act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-pilot-combat','stage33-exterior-art','stage34-foundation-edge','stage37-alpha-edge','stage38-alpha-edge','act4-pilot-art']){
  const file='shared/runtime/'+name+'.js';if(names.has(file))continue;
  names.add(file);act4Extra.push(await readFile(path.join(root,file),'utf8'));
 }
}
const runtimeSha256=createHash('sha256').update(runtime).digest('hex');
function bootstrap(id){
 if([34,37,38].includes(id))globalThis.HONRO_APP_READY=new Promise(()=>{}); // Never attach a real App or resolve this promise.
 globalThis.PROBE={storage:[],errors:[],images:[],violations:[]};
 const p=globalThis.PROBE;
 globalThis.publishProbe=value=>{document.getElementById('result').textContent=btoa(unescape(encodeURIComponent(JSON.stringify(value))));};
 addEventListener('error',e=>{p.errors.push(String(e.error?.stack||e.message));publishProbe({ok:false,...p});});
 addEventListener('unhandledrejection',e=>{p.errors.push(String(e.reason?.stack||e.reason));publishProbe({ok:false,...p});});
 addEventListener('securitypolicyviolation',e=>p.violations.push({directive:e.violatedDirective,uri:e.blockedURI}));
 for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(globalThis,key,{configurable:true,get(){p.storage.push(key);throw Error('Forbidden storage access: '+key);}});
 let seed=3910;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 const descriptor=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
 Object.defineProperty(HTMLImageElement.prototype,'src',{...descriptor,set(value){
  const row={pending:!!value,error:false};p.images.push(row);
  this.addEventListener('load',()=>{row.pending=false;},{once:true});
  this.addEventListener('error',()=>{row.pending=false;row.error=!!value;},{once:true});
  descriptor.set.call(this,value);
 }});
}
async function capture(id,runtimeSha256,variant,view){
 const p=globalThis.PROBE,assert=(v,m)=>{if(!v)throw Error(m);};
 try{
  assert(devicePixelRatio===1,'DPR must be 1');
  for(const name of ['HonroStage33ExteriorArt','HonroStage34FoundationEdge','HonroStage37AlphaEdge','HonroStage38AlphaEdge'])assert(globalThis[name],'Missing combined helper: '+name);
  assert(id===37&&['baseline','single-clip'].includes(variant),'Invalid diagnostic');
  const source=HONRO_PROJECT.library.find(a=>a.id==='approved37:body');
  assert(source&&source.params.semanticLayer==='BODY'&&source.params.silhouetteUnderpaint===false,'Unexpected source semantics');
  const original=JSON.stringify(source),asset=structuredClone(source),nodes=[];
  const walk=n=>{nodes.push(n);for(const c of n.children||[])walk(c);};walk(asset.vector.root);
  const bases=nodes.filter(n=>n.tag==='path'&&n.fill==='#f2e4c6');
  const clips=nodes.filter(n=>n.clipPath==='sourceAlpha');
  assert(bases.length===1&&clips.length===1,'Unexpected base fill / source clip count');
  assert(globalThis.HonroStage37AlphaEdge,'Production helper missing');
  if(variant==='baseline')globalThis.HonroStage37AlphaEdge=undefined;
  else{
   const originalDraw=HonroVectorArt.draw,seen=new Set();globalThis.S37_ALPHA_MASKS=[];
   HonroVectorArt.draw=function(c,a,l){
    if(a.id===source.id){const w=c.canvas.width,h=c.canvas.height,m=c.getTransform(),key=[w,h,m.a,m.b,m.c,m.d,m.e,m.f,l.x,l.y].join('|');if(!seen.has(key)){
     seen.add(key);assert(seen.size<=32,'Too many diagnostic masks');const cv=document.createElement('canvas');cv.width=w;cv.height=h;const mc=cv.getContext('2d');mc.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);mc.translate(l.x||0,l.y||0);mc.translate(-(source.anchor?.x||0),-(source.anchor?.y||0));mc.transform(...source.vector.root.transform);mc.clip(new Path2D(source.vector.clips.sourceAlpha.join(' ')));mc.setTransform(1,0,0,1,0,0);mc.fillStyle='#fff';mc.fillRect(0,0,w,h);
     S37_ALPHA_MASKS.push({width:w,height:h,m:[m.a,m.b,m.c,m.d,m.e,m.f],png:cv.toDataURL('image/png')});
    }}return originalDraw.apply(this,arguments);
   };
  }
  assert(!HonroVectorArt.validate(asset.vector).length,'Invalid diagnostic vector');
  const project={...HONRO_PROJECT,library:HONRO_PROJECT.library.map(a=>a===source?asset:a)},stage=project.stages.find(s=>s.metadata?.stageId===id);
  assert(JSON.stringify(source)===original,'Original source changed');
  assert(stage,'Missing production stage');
  HonroMaps.compile(stage,project); // Match Native setup order.
  const b=[34,37,38].includes(id)?HonroMaps.createBattle(stage,project,HonroProfileStore.fresh()):HonroMaps.createBattle(stage,project);HonroStageRules.sanitizeStageBattle(b);
  let tideSnapshot=null;
  if([34,37,38].includes(id)){
   assert(HONRO_ACT4_RELEASE===true,'Act4 release absent');
   assert(b.honroStage===id&&b.honroAct4Official===1,'Not official requested Act4 stage');
   assert(!b.honroAct4Design.tide,'Non-tidal middle-stage contract changed');
   HonroAct4TerrainPreview.coast.tide(b);
   b.honroAct4PreviewState.visualDrawn={};
   tideSnapshot=structuredClone(b.honroAct4PreviewState.tide??null);
   assert(tideSnapshot===null,'Non-tidal stage must not synthesize tide');
   if(id===38)assert(!b.honroAct4PreviewState.connectionProbe&&!b.honroAct4PreviewState.connected,'Expected initial inactive connection');
  }
  const engine=new HONRO_CORE.Engine(b,()=>{},true);
  if([34,37,38].includes(id))globalThis.HonroApp={engine};
  const physics=JSON.stringify({terrain:b.terrain,units:b.units});
  const [W,H]={desktop:[1331,763],landscape:[844,390],portrait:[390,844]}[view];const cv=document.getElementById('scene');cv.width=W;cv.height=H;cv.style.width=W+'px';cv.style.height=H+'px';
  const scene=new HonroScene(cv);
  const requested={34:{name:'focus-desktop-3',x:6464,y:4336,scale:1331/6800},37:{name:'edge-detail',x:1201,y:1552,scale:.6},38:{name:'edge-desktop-4',x:3456,y:2304,scale:1331/6800}}[id];
  Object.assign(scene,{x:requested.x,y:requested.y,scale:requested.scale,manual:true,time:2,editorView:false,skillPreview:false});
  HonroBounds.constrain(scene,b);
  assert(Math.abs(scene.x-requested.x)<1e-9&&Math.abs(scene.y-requested.y)<1e-9&&Math.abs(scene.scale-requested.scale)<1e-12,'Native comparison camera mismatch');
  if(id===37){const modal=document.createElement('div');modal.id='diagnostic-closed-modal';modal.hidden=true;document.body.appendChild(modal);Object.assign(HonroApp,{scene,modal,root:document.body});}
  const camera={x:scene.x,y:scene.y,scale:scene.scale},before=JSON.stringify(b);
  await document.fonts.ready;
  const drain=async()=>{for(let i=0;i<200;i++){if(!p.images.some(v=>v.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Image decode timeout');};
  assert(!document.hidden,'Diagnostic page must be visible to Scene receipts');
  scene.render(engine,0,'',.6,false,0);await drain();
  const firstRenderInitializations=firstRenderContract(before,JSON.stringify(b),id),settled=JSON.stringify(b);
  for(let i=1;i<4;i++){await new Promise(r=>setTimeout(r,100));scene.render(engine,0,'',.6,false,0);await drain();assert(JSON.stringify(b)===settled,'Scene mutated battle after first frame '+i);}
  assert(JSON.stringify({terrain:b.terrain,units:b.units})===physics,'Physics changed');
  assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Storage/runtime/CSP error');
  assert(!p.images.some(v=>v.pending||v.error),'Pending or failed image');
  const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
  const alphaStats=globalThis.HonroStage37AlphaEdge?.stats()??null;if(variant==='single-clip'){assert(alphaStats.draws>0,'Helper not used');assert(alphaStats.fallbacks===0,JSON.stringify(alphaStats));assert(alphaStats.peakBytes<=20971520,'Memory cap');}
  publishProbe({ok:true,alphaStats,clipMasks:globalThis.S37_ALPHA_MASKS??[],variant,diagnosticOnly:true,sourceUnchanged:JSON.stringify(source)===original,scope:'Isolated Chrome production Scene diagnostic. Synthetic initial battle only; no user save, public UI, normal input or gameplay acceptance.',stage:id,...([34,37,38].includes(id)?{tideSnapshot,appReadyUnresolved:true,initialization:'Official coast.tide; fresh in-memory profile; no App launch or event progression'}:{}),view:'edge-'+view,width:W,height:H,dpr:devicePixelRatio,camera,time:2,seed:3910,runtimeSha256,physicsSha256:await hash(physics),renderPure:id!==37,firstRenderInitializations,renderStableAfterInitialization:true,frameCount:4,receiptScope:id===37?'Scene connected; only empty receipt initialization allowed':'No App.scene; receipt wrapper short-circuits',fontStatus:document.fonts.status,fontNote:'System sans-serif; document.fonts.ready awaited. Cross-backend text pixels are not an exact equality claim.',userAgent:navigator.userAgent,imageCount:p.images.length,pendingImages:p.images.filter(v=>v.pending).length,imageErrors:p.images.filter(v=>v.error).length,storage:p.storage,errors:p.errors,violations:p.violations,png:cv.toDataURL('image/png')});
 }catch(e){publishProbe({ok:false,stage:id,variant,error:String(e.stack||e),...p});}
}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
for(const id of stages)for(const variant of variants)for(const view of ['desktop','landscape','portrait']){
 const stageRuntime=[34,37,38].includes(id)?runtime+'\n;\n'+act4Extra.join('\n;\n'):runtime;
 const stageRuntimeSha256=createHash('sha256').update(stageRuntime).digest('hex');
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated production Scene diagnostic</title><style>body{margin:0}canvas{width:1331px;height:763px}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script(stageRuntime)+script(firstRenderContract.toString())+script('('+capture.toString()+')('+id+','+JSON.stringify(stageRuntimeSha256)+','+JSON.stringify(variant)+','+JSON.stringify(view)+');');
 await writeFile(path.join(out,`stage${id}-${variant}-${view}.html`),html);
}
console.log(JSON.stringify({stages,runtimeSha256,runtimeBytes:Buffer.byteLength(runtime),scope:'Generator only. Run each fixture in a separate temporary Chrome profile with --force-device-scale-factor=1 --virtual-time-budget=60000 --dump-dom and external timeout 300s. Extractor requires completion, no fixed sleep acceptance.'}));
