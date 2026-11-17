/** Diagnostic only: foundation fixed; old BODY / shared field / per-path original color. Stage32-only A/B derived from clean remote 69476eefd62be6cf835038928e9112fc1e88eb47. Not public UI/gameplay acceptance. */
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
if(createHash('sha256').update(rendererCanonical).digest('hex')!=='8f48f81c25be136756ac320abd3715d75fb9fbdd7ee6bb624180a3898601611d')throw Error('Requires exact d18 Stage32 renderer');
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
 let diagnosticScene=null,canonicalDiagnostic=null;const drawDiagnostic={calls:0,rows:[]};
 try{
  assert(devicePixelRatio===1,'DPR must be 1');
  assert(globalThis.HonroStage32FoundationArt,'Stage32 material renderer missing');
  const originalDraw=HonroStage32FoundationArt.draw;
  HonroStage32FoundationArt.draw=function(c,l,b){
   drawDiagnostic.calls++;
   const row={assetId:l?.asset?.id??null,stage:b?.honroStage??null,custom:b?.honroCustom??null,x:l?.x??null,y:l?.y??null,scale:l?.scale??null,rotation:l?.rotation??null};
   if(drawDiagnostic.rows.length<10)drawDiagnostic.rows.push(row);
   const result=originalDraw.apply(this,arguments);row.returned=result;return result;
  };
  const originalStage=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===32);
  assert(originalStage,'Missing official Stage32');
  const originalStageText=JSON.stringify(originalStage),stage=structuredClone(originalStage);
  const oldFoundation='approved32:coastal-foundation',newFoundation='act4-handoff:32:foundation',oldBody='act4-handoff:32:body-joined',newBody='act4-handoff:32:body-shared-material';
  const oldVector=HONRO_PROJECT.library.find(a=>a.id===oldBody).vector,newVector=HONRO_PROJECT.library.find(a=>a.id===newBody).vector;
  const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
  const describe=async v=>({type:Array.isArray(v)?'array':typeof v,bytes:new TextEncoder().encode(JSON.stringify(v)??'undefined').length,sha256:await digest(JSON.stringify(v)??'undefined'),...(typeof v==='string'?{length:v.length}: {})});
  const differences=[];
  async function diff(a,z,p){if(JSON.stringify(a)===JSON.stringify(z))return;if(differences.length>=100)return;if(a&&z&&typeof a==='object'&&typeof z==='object'&&Array.isArray(a)===Array.isArray(z)){for(const k of new Set([...Object.keys(a),...Object.keys(z)]))await diff(a[k],z[k],p+'.'+k);}else differences.push({path:p,old:await describe(a),candidate:await describe(z)});}
  await diff(oldVector,newVector,'vector');
  const paths=async v=>{const rows=[];function walk(n,p){if(n.tag==='path'){const d=typeof n.d==='string'?n.d:(n.dParts||[]).join('');rows.push({path:p,d,fill:n.fill,rule:n.fillRule||'nonzero',commands:(d.match(/[a-z]/ig)||[]).length,subpaths:(d.match(/[Mm]/g)||[]).length});}for(const [i,nc] of (n.children||[]).entries())walk(nc,p+'.children.'+i);}walk(v.root,'root');return Promise.all(rows.map(async({d,...row})=>({...row,length:d.length,sha256:await digest(d)})));};
  const oldPaths=await paths(oldVector),newPaths=await paths(newVector),expected=HONRO_PROJECT.library.find(a=>a.id===newBody).params.stage32SharedMaterial.sourcePathSHA256;
  canonicalDiagnostic={scope:'Pre-render source difference; no equality assertion removed',old:await describe(oldVector),candidate:await describe(newVector),differences,differenceLimit:100,oldPaths,newPaths,expectedSourcePathSHA256:expected,oldMatchesAuthor:oldPaths.map((p,i)=>p.sha256===expected[i]),candidateMatchesAuthor:newPaths.map((p,i)=>p.sha256===expected[i]),pathCountEqual:oldPaths.length===newPaths.length,subpathCountsEqual:JSON.stringify(oldPaths.map(p=>p.subpaths))===JSON.stringify(newPaths.map(p=>p.subpaths)),pathOrderNamesEqual:JSON.stringify(oldPaths.map(p=>p.path))===JSON.stringify(newPaths.map(p=>p.path))};
  assert(JSON.stringify(HONRO_PROJECT.library.find(a=>a.id===oldBody).vector)===JSON.stringify(HONRO_PROJECT.library.find(a=>a.id===newBody).vector),'Old/new BODY canonical vectors differ');
  const sourceCanonical=JSON.stringify(HONRO_PROJECT.library.filter(a=>[oldFoundation,newFoundation,oldBody,newBody].includes(a.id)));
  const foundation=stage.elements.find(e=>e.id==='approved32-coastal-foundation'),body=stage.elements.find(e=>e.id==='approved32-body');
  assert(foundation.assetId===newFoundation&&body.assetId===newBody,'Expected candidate providers');
  assert(stage.design.vectorShelterDoor.bodyAssetId===newBody,'Candidate door BODY link');
  for(const aid of [oldFoundation,newFoundation,oldBody,newBody])assert(HONRO_PROJECT.library.some(a=>a.id===aid),'Missing provider '+aid);
  if(variant==='baseline'){
   body.assetId=oldBody;stage.design.vectorShelterDoor.bodyAssetId=oldBody;
  }else assert(['candidate','original-colors'].includes(variant),'Invalid variant');
  globalThis.HONRO_STAGE32_DIAGNOSTIC_ORIGINAL_COLORS=variant==='original-colors';
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
  for(let i=0;i<3;i++){scene.render(engine,0,'',.6,false,0);assert(JSON.stringify(b)===before,'Scene mutated battle at frame '+i);await drain();await new Promise(r=>setTimeout(r,100));}
  scene.render(engine,0,'',.6,false,0);await drain();
  assert(JSON.stringify(b)===before,'Scene mutated battle');
  assert(JSON.stringify(HONRO_PROJECT.library.filter(a=>[oldFoundation,newFoundation,oldBody,newBody].includes(a.id)))===sourceCanonical,'Canonical provider source mutated');
  assert(JSON.stringify(originalStage)===originalStageText,'Original stage changed during rendering');
  assert(JSON.stringify({terrain:b.terrain,units:b.units})===physics,'Physics changed');
  assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Storage/runtime/CSP error');
  assert(!p.images.some(v=>v.pending||v.error),'Pending or failed image');
  const materialStats=HonroStage32FoundationArt.stats();
  assert(materialStats.fallbacks===0,'Material renderer fallback');
  if(variant==='candidate')assert(materialStats.rasterizations>0&&materialStats.hits>0,'Candidate did not exercise shared material cache');
  const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
  publishProbe({ok:true,scope:'Isolated Chrome production Scene diagnostic. Synthetic initial battle only; no user save, public UI, normal input or gameplay acceptance.',stage:id,variant,requestedCamera,drawDiagnostic,cacheStats:globalThis.HonroStage32FoundationArt?.stats?.()??null,sceneCacheStats:scene._cacheStats??null,...((id===32)?{tideSnapshot,appReadyUnresolved:true,initialization:'Official coast.tide; fresh in-memory profile; no App launch or event progression'}:{}),view,width,height,dpr:devicePixelRatio,camera,time:2,seed:3910,runtimeSha256,physicsSha256:await hash(physics),renderPure:true,firstFramePure:true,sourceCanonicalSha256:await hash(sourceCanonical),diagnosticMode:'Foundation fixed V4; original-colors means per-path opaque original fill bitmap, NOT a full BODY image resampled through each clip',fontStatus:document.fonts.status,fontNote:'System sans-serif; document.fonts.ready awaited. Cross-backend text pixels are not an exact equality claim.',userAgent:navigator.userAgent,imageCount:p.images.length,pendingImages:p.images.filter(v=>v.pending).length,imageErrors:p.images.filter(v=>v.error).length,storage:p.storage,errors:p.errors,violations:p.violations,png:cv.toDataURL('image/png')});
 }catch(e){
  let png=null,pngError=null;try{png=document.getElementById('scene')?.toDataURL('image/png')??null;}catch(error){pngError=String(error);}
  publishProbe({ok:false,stage:id,variant,view:requestedCamera.name,requestedCamera,error:String(e.stack||e),canonicalDiagnostic,...p,drawDiagnostic,cacheStats:globalThis.HonroStage32FoundationArt?.stats?.()??null,sceneCacheStats:diagnosticScene?._cacheStats??null,png,pngError});
 }
}

function instrument(code){
 const needle="c.save();c.clip(n.path,n.rule);bitmap(c,cv);";
 if(code.split(needle).length!==2)throw Error('Expected exactly one d18 geology clip site');
 // Diagnostic only. This bitmap is deliberately not the complete old BODY.
 // Each opaque source color has the same continuous support as a normal fill;
 // raster edge differences from clip+drawImage and gray repaint are the target.
 const replacement="c.save();c.clip(n.path,n.rule);if(G.HONRO_STAGE32_DIAGNOSTIC_ORIGINAL_COLORS){if(!/^#[0-9a-f]{6}$/i.test(n.fill))throw Error('Diagnostic requires opaque six-digit source fill');let dc=G.__stage32DiagnosticColorCanvas;if(!dc)dc=G.__stage32DiagnosticColorCanvas=new G.OffscreenCanvas(cv.width,cv.height);if(dc.width!==cv.width||dc.height!==cv.height){dc.width=cv.width;dc.height=cv.height;}const dctx=dc.getContext('2d');dctx.setTransform(1,0,0,1,0,0);dctx.globalAlpha=1;dctx.globalCompositeOperation='copy';dctx.filter='none';dctx.fillStyle=n.fill;dctx.fillRect(0,0,dc.width,dc.height);bitmap(c,dc);}else bitmap(c,cv);";
 return code.replace(needle,replacement);
}

const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
const views=[{name:'lower',x:1689.6,y:1900,scale:.6},{name:'left',x:320,y:1650,scale:.6}];
for(const id of stages)for(const variant of ['baseline','candidate','original-colors'])for(const view of views){
 const stageRuntime=instrument((id===32)?runtime+'\n;\n'+act4Extra.join('\n;\n'):runtime);
 const stageRuntimeSha256=createHash('sha256').update(stageRuntime).digest('hex');
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated production Scene diagnostic</title><style>body{margin:0}canvas{width:1331px;height:763px}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script(stageRuntime)+script('('+capture.toString()+')('+id+','+JSON.stringify(stageRuntimeSha256)+','+JSON.stringify(variant)+','+JSON.stringify(view)+');');
 await writeFile(path.join(out,`stage${id}-${variant}-${view.name}.html`),html);
}
console.log(JSON.stringify({stages,views,variants:['baseline','candidate','original-colors'],runtimeSha256,runtimeBytes:Buffer.byteLength(runtime),scope:'Generator only. Run each fixture in a separate temporary Chrome profile with --force-device-scale-factor=1 --virtual-time-budget=60000 --dump-dom and external timeout 300s. Extractor requires completion, no fixed sleep acceptance.'}));
