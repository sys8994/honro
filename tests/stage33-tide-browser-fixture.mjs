/** CI-only generator: isolated production Scene, not public UI/gameplay acceptance. */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runtimeEntries,root,authorProjectExpression} from '../shared/build.mjs';
import {restoreStage33Exterior} from '../shared/act4-stage33-exterior-art.mjs';
const out=process.argv[2];
async function stage33BaselineProject(){const entry=entries.find(e=>e.name==='campaign');if(!entry?.project)throw Error('Missing campaign source project');return restoreStage33Exterior(entry.project);}
if(!out)throw Error('Usage: node tests/actual-scene-browser-fixture.mjs OUTPUT_DIRECTORY [23,26,29|32|33|34,37,38]');
const stages=[33];
if(!stages.length||new Set(stages).size!==stages.length||stages.some(id=>![23,26,29,32,33,34,37,38].includes(id)))throw Error('Unsupported or duplicate stage');
if(stages.some(id=>[32,33,34,37,38].includes(id))&&process.env.HONRO_ACT4_RELEASE!=='1')throw Error('Act4 stage requires HONRO_ACT4_RELEASE=1');
await mkdir(out,{recursive:true});
// runtimeParts is exactly runtimeEntries(...).map(entry=>entry.code). Names allow safe deduplication.
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const runtime=entries.map(entry=>entry.code).join('\n;\n');
const names=new Set(entries.map(entry=>entry.name)),act4Extra=[];
if(stages.some(id=>[32,33,34,37,38].includes(id))){
 for(const [name,file]of [['HONRO_ACT4_PILOT_COMBAT_REFERENCE','pilot-combat-reference.json'],['HONRO_ACT4_PREVIEW_SEEDS','reviewed.json']])if(!entries.some(e=>e.global===name||e.name===name))act4Extra.push('globalThis.'+name+'='+JSON.stringify(JSON.parse(await readFile(path.join(root,'shared/data/act4',file),'utf8')))+';');
 for(const name of ['act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-pilot-combat','stage33-exterior-art','stage34-foundation-edge','stage37-alpha-edge','stage38-alpha-edge','act4-pilot-art']){
  const file='shared/runtime/'+name+'.js';if(names.has(file))continue;
  names.add(file);act4Extra.push(await readFile(path.join(root,file),'utf8'));
 }
}
const runtimeSha256=createHash('sha256').update(runtime).digest('hex');
function bootstrap(id){
 if([32,33,34,37,38].includes(id))globalThis.HONRO_APP_READY=new Promise(()=>{}); // Never attach a real App or resolve this promise.
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
async function capture(id,runtimeSha256,variant,requestedView){
 const p=globalThis.PROBE,assert=(v,m)=>{if(!v)throw Error(m);};
 try{
  assert(devicePixelRatio===1,'DPR must be 1');
  for(const name of ['HonroStage33ExteriorArt','HonroStage34FoundationEdge','HonroStage37AlphaEdge','HonroStage38AlphaEdge'])assert(globalThis[name],'Missing combined helper: '+name);
  const project=variant==='baseline'?HONRO_STAGE33_BASELINE:HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===id);
  assert(['baseline','candidate'].includes(variant),'Invalid variant');
  assert(stage,'Missing production stage');
  HonroMaps.compile(stage,project); // Match Native setup order.
  const b=([32,33,34,37,38].includes(id))?HonroMaps.createBattle(stage,project,HonroProfileStore.fresh()):HonroMaps.createBattle(stage,project);HonroStageRules.sanitizeStageBattle(b);
  let tideSnapshot=null;
  if([32,33,34,37,38].includes(id)){
   assert(HONRO_ACT4_RELEASE===true,'Act4 release absent');
   assert(b.honroStage===id&&b.honroAct4Official===1,'Not official Act4 stage');
   if(id===32)assert(!b.honroAct4Design.tide&&b.honroAct4Design.waterPolicies.length===0,'Stage32 tide contract changed');
   HonroAct4TerrainPreview.coast.tide(b);
   b.honroAct4PreviewState.visualDrawn={};
   tideSnapshot=structuredClone(b.honroAct4PreviewState.tide??null);
   if([32,34,37,38].includes(id))assert(tideSnapshot===null,'Non-tidal stage must not synthesize tide');
   if(id===33){
    const cfg=b.honroAct4Design.tide;
    assert(cfg.low===4095&&cfg.high===3532.5&&cfg.floorTerrainIds.join(',')==='approved33-low-ground','Stage33 source tide contract changed');
    assert(JSON.stringify(tideSnapshot)===JSON.stringify({phase:'low',surface:4095,warningRound:2,highRound:5,lowRound:7}),'Expected official Stage33 initial low tide');
    assert(b.honroAct4PreviewState.waterVisualLevel===4095,'Official syncWater not initialized');
   }
  }
  // Diagnostic-only fresh battle: exercise the official tide function at its
  // authored warning/high rounds. This is not real combat/input progression.
  assert(id===33&&['rising','high'].includes(requestedView.tide),'Invalid tide scenario');
  assert(b.side===0&&b.phase==='aim','Expected initial player aim phase');
  b.round=b.honroAct4Design.tide.warningRound;HonroAct4TerrainPreview.coast.tide(b);
  assert(b.honroAct4PreviewState.tide.phase==='rising'&&b.honroAct4PreviewState.tide.surface===4077,'Official rising tide mismatch');
  if(requestedView.tide==='high'){b.round=b.honroAct4PreviewState.tide.highRound;HonroAct4TerrainPreview.coast.tide(b);}
  tideSnapshot=structuredClone(b.honroAct4PreviewState.tide);
  assert(tideSnapshot.phase===requestedView.tide,'Wrong official tide phase');
  assert(tideSnapshot.surface===(requestedView.tide==='high'?3532.5:4077),'Wrong official tide surface');
  assert(b.honroAct4PreviewState.waterVisualLevel===tideSnapshot.surface,'Water visual state mismatch');
  // Full synthetic battle uses the production JSON codec. No storage is accessed.
  const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
  const saveCanonical=canonical(b),saveBefore=JSON.stringify(b),packed=JSON.parse(JSON.stringify(HonroProfileStore.compactBattleArt(b)));
  assert(JSON.stringify(b)===saveBefore,'Codec mutated original battle');
  assert(HonroProfileStore.restoreBattleArt(packed),'Provider roundtrip restoration failed');
  assert(canonical(packed)===saveCanonical,'Actual battle JSON roundtrip changed');
  const engine=new HONRO_CORE.Engine(b,()=>{},true);
  if([32,33,34,37,38].includes(id))globalThis.HonroApp={engine};
  const physics=JSON.stringify({terrain:b.terrain,units:b.units});
  const extraViews={34:{name:'focus-desktop-3',x:6464,y:4336,scale:1331/6800},37:{name:'edge-detail',x:1201,y:1552,scale:.6},38:{name:'edge-desktop-4',x:3456,y:2304,scale:1331/6800}},extra=extraViews[id];
  const view=requestedView.name,width=requestedView.width,height=requestedView.height;
  const cv=document.getElementById('scene');cv.width=width;cv.height=height;cv.style.width=width+'px';cv.style.height=height+'px';
  const scene=new HonroScene(cv);
  const focus=id===33?HonroBounds.focus(b):null;
  Object.assign(scene,{x:requestedView.x??focus?.left??0,y:requestedView.y??focus?.bottom??stage.height,scale:requestedView.scale??HonroBounds.zoomLimits(width).min,manual:true,time:2,editorView:false,skillPreview:false});
  HonroBounds.constrain(scene,b);
  if(extra){
   assert(Math.abs(scene.x-extra.x)<1e-9&&Math.abs(scene.y-extra.y)<1e-9&&Math.abs(scene.scale-extra.scale)<1e-12,'Native report camera mismatch');
   if(id===37){
    // Stage37 liveWater calls inView(app,...). Other stages must not activate App receipts.
    const modal=document.createElement('div');modal.id='diagnostic-closed-modal';modal.hidden=true;document.body.appendChild(modal);
    globalThis.HonroApp.scene=scene;globalThis.HonroApp.modal=modal;
   }
  }
  const camera={x:scene.x,y:scene.y,scale:scene.scale},before=JSON.stringify(b);
  await document.fonts.ready;
  const drain=async()=>{for(let i=0;i<200;i++){if(!p.images.some(v=>v.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Image decode timeout');};
  for(let i=0;i<3;i++){scene.render(engine,0,'',.6,false,0);await drain();await new Promise(r=>setTimeout(r,100));}
  scene.render(engine,0,'',.6,false,0);await drain();
  assert(JSON.stringify(b)===before,'Scene mutated battle');
  assert(JSON.stringify({terrain:b.terrain,units:b.units})===physics,'Physics changed');
  assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Storage/runtime/CSP error');
  assert(!p.images.some(v=>v.pending||v.error),'Pending or failed image');
  const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
  publishProbe({ok:true,variant,tideScenario:requestedView.tide,saveRoundtrip:true,materialStats:globalThis.HonroStage33ExteriorArt?.stats?.()??null,scope:'Isolated Chrome production Scene diagnostic. Synthetic initial battle only; no user save, public UI, normal input or gameplay acceptance.',stage:id,...(([32,33,34,37,38].includes(id))?{tideSnapshot,appReadyUnresolved:true,initialization:'Official coast.tide at synthetic authored warning/high rounds; fresh profile; no App launch, user save or real combat progression'}:{}),view,width,height,dpr:devicePixelRatio,camera,time:2,seed:3910,runtimeSha256,physicsSha256:await hash(physics),renderPure:true,fontStatus:document.fonts.status,fontNote:'System sans-serif; document.fonts.ready awaited. Cross-backend text pixels are not an exact equality claim.',userAgent:navigator.userAgent,imageCount:p.images.length,pendingImages:p.images.filter(v=>v.pending).length,imageErrors:p.images.filter(v=>v.error).length,storage:p.storage,errors:p.errors,violations:p.violations,png:cv.toDataURL('image/png')});
 }catch(e){publishProbe({ok:false,stage:id,error:String(e.stack||e),...p});}
}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
const baselineProject=await stage33BaselineProject();
const baselineScript='globalThis.HONRO_STAGE33_BASELINE='+authorProjectExpression(JSON.stringify(baselineProject))+';';
const views=[
 {name:'rising-landscape',width:844,height:390,tide:'rising'},
 {name:'high-landscape',width:844,height:390,tide:'high'},
 {name:'high-portrait',width:390,height:844,tide:'high'}
];
for(const id of stages)for(const variant of ['baseline','candidate'])for(const requestedView of views){
 const stageRuntime=([32,33,34,37,38].includes(id))?runtime+'\n;\n'+act4Extra.join('\n;\n'):runtime;
 const stageRuntimeSha256=createHash('sha256').update(stageRuntime).digest('hex');
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated production Scene diagnostic</title><style>body{margin:0}canvas{width:1331px;height:763px}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script(stageRuntime)+script(baselineScript)+script('('+capture.toString()+')('+id+','+JSON.stringify(stageRuntimeSha256)+','+JSON.stringify(variant)+','+JSON.stringify(requestedView)+');');
 await writeFile(path.join(out,`stage${id}-${variant}-${requestedView.name}.html`),html);
}
console.log(JSON.stringify({stages,runtimeSha256,runtimeBytes:Buffer.byteLength(runtime),scope:'Generator only. Run each fixture in a separate temporary Chrome profile with --force-device-scale-factor=1 --virtual-time-budget=60000 --dump-dom and external timeout 300s. Extractor requires completion, no fixed sleep acceptance.'}));
