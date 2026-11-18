/** CI-only generator: isolated production Scene, not public UI/gameplay acceptance. */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {naruBodyStudy} from './fixtures/naru-body-study.mjs';
import {runtimeEntries,root} from '../shared/build.mjs';
const out=process.argv[2];
if(!out)throw Error('Usage: node tests/actual-scene-browser-fixture.mjs OUTPUT_DIRECTORY [23,26,29|32]');
const stages=(process.argv[3]||'3,7').split(',').map(Number),variant=process.argv[4];
const cases={3:['portrait-bl','desktop-br','pier-close','terrain-close','pier-native']};
if(!stages.length||new Set(stages).size!==stages.length||stages.some(id=>!cases[id])||!['baseline','candidate'].includes(variant))throw Error('Unsupported inspection');
await mkdir(out,{recursive:true});
// runtimeParts is exactly runtimeEntries(...).map(entry=>entry.code). Names allow safe deduplication.
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const runtime=entries.map(entry=>entry.code).join('\n;\n')+(process.env.STAGE3_READABILITY_CONTROL==='1'?'\n;\n'+await readFile(path.join(root,'tests/fixtures/stage3-public-readability.js'),'utf8'):'');
const names=new Set(entries.map(entry=>entry.name)),act4Extra=[];
if(stages.includes(32)){
 for(const [name,file]of [['HONRO_ACT4_PILOT_COMBAT_REFERENCE','pilot-combat-reference.json'],['HONRO_ACT4_PREVIEW_SEEDS','reviewed.json']])if(!entries.some(e=>e.global===name||e.name===name))act4Extra.push('globalThis.'+name+'='+JSON.stringify(JSON.parse(await readFile(path.join(root,'shared/data/act4',file),'utf8')))+';');
 for(const name of ['act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-pilot-combat','act4-pilot-art']){
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
 Date.now=()=>1794931200000;let seed=3910;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
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
  const project=HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===id);
  assert(stage,'Missing production stage');
  const stageBefore=JSON.stringify(stage);
  if(variant==='candidate'){
   const art=project.library.find(a=>a.id==='act1-site:3:body');
   assert(art,'Missing BODY');
   const next=globalThis.naruBodyStudy(art.vector,{palette:true,exterior:true});
   art.vector=next;const [x,y,w,h]=next.viewBox;art.bounds={x,y,w,h};art.reference.bounds={x,y,w,h};
  }
  assert(JSON.stringify(stage)===stageBefore,'Authored stage changed');
  HonroMaps.compile(stage,project); // Match Native setup order.
  const b=id===32?HonroMaps.createBattle(stage,project,HonroProfileStore.fresh()):HonroMaps.createBattle(stage,project);HonroStageRules.sanitizeStageBattle(b);
  let tideSnapshot=null;
  if(id===32){
   assert(HONRO_ACT4_RELEASE===true,'Act4 release absent');
   assert(b.honroStage===32&&b.honroAct4Official===1,'Not official Stage32');
   assert(!b.honroAct4Design.tide&&b.honroAct4Design.waterPolicies.length===0,'Stage32 tide contract changed');
   HonroAct4TerrainPreview.coast.tide(b);
   b.honroAct4PreviewState.visualDrawn={};
   tideSnapshot=structuredClone(b.honroAct4PreviewState.tide??null);
   assert(tideSnapshot===null,'Stage32 must not synthesize tide');
  }
  const engine=new HONRO_CORE.Engine(b,()=>{},true);
  if(id===32)globalThis.HonroApp={engine};
  const physics=JSON.stringify({terrain:b.terrain,units:b.units});
  const [W,H]=view.startsWith('portrait')?[390,696]:[1331,763];const cv=document.getElementById('scene');cv.width=W;cv.height=H;cv.style.width=W+'px';cv.style.height=H+'px';
  const scene=new HonroScene(cv);
  Object.assign(scene,{x:view.endsWith('br')?stage.width:0,y:view.endsWith('tl')?0:stage.height,scale:HonroBounds.zoomLimits(W).min,manual:true,time:2,editorView:false,skillPreview:false});
  if(view==='pier-close')Object.assign(scene,{x:553*3.23,y:610*3.23,scale:1.05});
  if(view==='pier-native')Object.assign(scene,{x:553*3.23,y:610*3.23,scale:1.65});
  if(view==='terrain-close')Object.assign(scene,{x:1774*3.23,y:760*3.23,scale:.65});
  HonroBounds.constrain(scene,b);
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
  publishProbe({ok:true,scope:'Isolated Chrome production Scene diagnostic. Synthetic initial battle only; no user save, public UI, normal input or gameplay acceptance.',stage:id,variant,...(id===32?{tideSnapshot,appReadyUnresolved:true,initialization:'Official coast.tide; fresh in-memory profile; no App launch or event progression'}:{}),view,width:W,height:H,dpr:devicePixelRatio,camera,time:2,seed:3910,runtimeSha256,physicsSha256:await hash(physics),renderPure:true,fontStatus:document.fonts.status,fontNote:'System sans-serif; document.fonts.ready awaited. Cross-backend text pixels are not an exact equality claim.',userAgent:navigator.userAgent,imageCount:p.images.length,pendingImages:p.images.filter(v=>v.pending).length,imageErrors:p.images.filter(v=>v.error).length,storage:p.storage,errors:p.errors,violations:p.violations,png:cv.toDataURL('image/png')});
 }catch(e){publishProbe({ok:false,stage:id,error:String(e.stack||e),...p});}
}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
// Study-only renderer change: paint-domain union does not mutate battle bounds.
const paintAnchor='domain=b.honroTerrainBounds,';
const paintUnion=`domain=(()=>{const d={...b.honroTerrainBounds};if(b.honroStage===3)for(const l of G.HonroTerrainDomain.materialLandmarks(b)){const q=this._landmarkPaintBounds(l);if(q){d.left=Math.min(d.left,q.left);d.top=Math.min(d.top,q.top);d.right=Math.max(d.right,q.right);d.bottom=Math.max(d.bottom,q.bottom);}}return d;})(),`;
if(runtime.split(paintAnchor).length!==2)throw Error('Unexpected paint-domain anchor count');
const studyRuntime=variant==='candidate'?runtime.replace(paintAnchor,paintUnion):runtime;
const captureList=[];for(const id of stages)for(const view of cases[id]){
 const stageRuntime=id===32?studyRuntime+'\n;\n'+act4Extra.join('\n;\n'):studyRuntime;
 const stageRuntimeSha256=createHash('sha256').update(stageRuntime).digest('hex');
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated production Scene diagnostic</title><style>body{margin:0}canvas{width:1331px;height:763px}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script(stageRuntime)+script('globalThis.naruBodyStudy='+naruBodyStudy.toString()+';')+script('('+capture.toString()+')('+id+','+JSON.stringify(stageRuntimeSha256)+','+JSON.stringify(variant)+','+JSON.stringify(view)+');');
 captureList.push({stage:id,variant,view});await writeFile(path.join(out,`stage${id}-${variant}-${view}.html`),html);
}
await writeFile(path.join(out,'capture-list.json'),JSON.stringify(captureList));
console.log(JSON.stringify({stages,variant,runtimeSha256,runtimeBytes:Buffer.byteLength(runtime),scope:'Generator only. Run each fixture in a separate temporary Chrome profile with --force-device-scale-factor=1 --virtual-time-budget=60000 --dump-dom and external timeout 300s. Extractor requires completion, no fixed sleep acceptance.'}));

