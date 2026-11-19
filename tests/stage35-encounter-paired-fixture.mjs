/** CI-only generator: isolated production Scene, not public UI/gameplay acceptance. */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runtimeEntries,root} from '../shared/build.mjs';
import {authorAct4Stage35Encounter,clusters} from '../shared/act4-stage35-encounter.mjs';
const out=process.argv[2];
if(!out)throw Error('Usage: node tests/act4-middle-browser-fixture.mjs OUTPUT_DIRECTORY');
const stages=[35];
if(!stages.length||new Set(stages).size!==stages.length||stages.some(id=>![35].includes(id)))throw Error('Unsupported or duplicate stage');
if(stages.some(id=>[35].includes(id))&&process.env.HONRO_ACT4_RELEASE!=='1')throw Error('Act4 middle stages require HONRO_ACT4_RELEASE=1');
await mkdir(out,{recursive:true});
// runtimeParts is exactly runtimeEntries(...).map(entry=>entry.code). Names allow safe deduplication.
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const runtime=entries.map(entry=>entry.code).join('\n;\n');
const names=new Set(entries.map(entry=>entry.name)),act4Extra=[];
if(stages.some(id=>[35].includes(id))){
 for(const [name,file]of [['HONRO_ACT4_PILOT_COMBAT_REFERENCE','pilot-combat-reference.json'],['HONRO_ACT4_PREVIEW_SEEDS','reviewed.json']])if(!entries.some(e=>e.global===name||e.name===name))act4Extra.push('globalThis.'+name+'='+JSON.stringify(JSON.parse(await readFile(path.join(root,'shared/data/act4',file),'utf8')))+';');
 for(const name of ['act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-pilot-combat','act4-pilot-art']){
  const file='shared/runtime/'+name+'.js';if(names.has(file))continue;
  names.add(file);act4Extra.push(await readFile(path.join(root,file),'utf8'));
 }
}
const runtimeSha256=createHash('sha256').update(runtime).digest('hex');
function bootstrap(id){
 if([35].includes(id))globalThis.HONRO_APP_READY=new Promise(()=>{}); // Never attach a real App or resolve this promise.
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
  const project=HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===id);
  assert(stage,'Missing production stage');
  const planned=clusters.flatMap(c=>c.members.map(([short,support,x])=>({id:'a4-35-'+short,x,support:'approved35-'+support,group:'a4-35-authored-'+c.key})));
  assert(planned.every(m=>{const u=stage.units.find(u=>u.id===m.id);return u&&u.x===m.x&&u.encounterGroup===m.group&&u.stageOverrides.honroEncounterSupport===m.support;}),'Production author pipeline missing exact placement');
  HonroMaps.compile(stage,project); // Match Native setup order.
  const b=[35].includes(id)?HonroMaps.createBattle(stage,project,HonroProfileStore.fresh()):HonroMaps.createBattle(stage,project);HonroStageRules.sanitizeStageBattle(b);
  let tideSnapshot=null;
  if([35].includes(id)){
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
  if([35].includes(id))globalThis.HonroApp={engine};
  const enemies=b.units.filter(u=>u.side===1),nonFlying=enemies.filter(u=>!HONRO_CORE.flyingEnemy(u));
  assert(enemies.length===30,'Enemy count changed');
  assert(nonFlying.every(u=>engine.grounded(u)),'Nonflying enemy not grounded');
  const overlaps=[];for(let i=0;i<enemies.length;i++)for(const v of enemies.slice(i+1)){const u=enemies[i];if(Math.min(u.x+u.r,v.x+v.r)>Math.max(u.x-u.r,v.x-v.r)&&Math.min(u.y,v.y)>Math.max(u.y-u.h,v.y-v.h))overlaps.push([u.id,v.id]);}
  assert(!overlaps.length,'Enemy body overlap '+JSON.stringify(overlaps));
  const physics=JSON.stringify({terrain:b.terrain,units:b.units});
  const cv=document.getElementById('scene');cv.width=1331;cv.height=763;
  const scene=new HonroScene(cv);
  const requested={whole:{name:'whole',x:2400,y:1800,scale:.245},middle:{name:'middle',x:2350,y:1680,scale:.62},upper:{name:'upper',x:3700,y:1000,scale:.62}}[view];
  Object.assign(scene,{x:requested.x,y:requested.y,scale:requested.scale,manual:true,time:2,editorView:false,skillPreview:false});
  HonroBounds.constrain(scene,b);
  // Native constrain is retained; compare actual before/after cameras in evidence.
  if(id===37){const modal=document.createElement('div');modal.id='diagnostic-closed-modal';modal.hidden=true;document.body.appendChild(modal);Object.assign(HonroApp,{scene,modal,root:document.body});}
  const camera={x:scene.x,y:scene.y,scale:scene.scale},before=JSON.stringify(b);
  await document.fonts.ready;
  const drain=async()=>{for(let i=0;i<200;i++){if(!p.images.some(v=>v.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Image decode timeout');};
  assert(!document.hidden,'Diagnostic page must be visible to Scene receipts');
  scene.render(engine,0,'',.6,false,0);await drain();
  const firstRenderInitializations=[],settled=JSON.stringify(b);
  for(let i=1;i<4;i++){await new Promise(r=>setTimeout(r,100));scene.render(engine,0,'',.6,false,0);await drain();assert(JSON.stringify(b)===settled,'Scene mutated battle after first frame '+i);}
  assert(JSON.stringify({terrain:b.terrain,units:b.units})===physics,'Physics changed');
  assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Storage/runtime/CSP error');
  assert(!p.images.some(v=>v.pending||v.error),'Pending or failed image');
  const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
  publishProbe({ok:true,variant,authoredUnitState:stage.units,spawnGroups:stage.encounters,groundedCount:nonFlying.length,bodyOverlaps:overlaps,unitState:b.units.map(u=>({id:u.id,x:u.x,y:u.y,r:u.r,side:u.side,kind:u.kind,role:u.role,cls:u.cls,name:u.name,identity:u.honroMonsterDiversityKind,h:u.h,hp:u.hp,maxHp:u.maxHp,loadout:u.loadout,flying:HONRO_CORE.flyingEnemy(u),grounded:engine.grounded(u),support:u.honroEncounterSupport,fly:u.fly})),scope:'Isolated Chrome production Scene diagnostic. Synthetic initial battle only; no user save, public UI, normal input or gameplay acceptance.',stage:id,...([35].includes(id)?{tideSnapshot,appReadyUnresolved:true,initialization:'Official coast.tide; fresh in-memory profile; no App launch or event progression'}:{}),view:requested.name,width:1331,height:763,dpr:devicePixelRatio,camera,time:2,seed:3910,runtimeSha256,physicsSha256:await hash(physics),renderPure:id!==37,firstRenderInitializations,renderStableAfterInitialization:true,frameCount:4,receiptScope:id===37?'Scene connected; only empty receipt initialization allowed':'No App.scene; receipt wrapper short-circuits',fontStatus:document.fonts.status,fontNote:'System sans-serif; document.fonts.ready awaited. Cross-backend text pixels are not an exact equality claim.',userAgent:navigator.userAgent,imageCount:p.images.length,pendingImages:p.images.filter(v=>v.pending).length,imageErrors:p.images.filter(v=>v.error).length,storage:p.storage,errors:p.errors,violations:p.violations,png:cv.toDataURL('image/png')});
 }catch(e){publishProbe({ok:false,stage:id,error:String(e.stack||e),...p});}
}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
for(const id of stages)for(const variant of ['integrated'])for(const view of ['whole','middle','upper']){
 const stageRuntime=[35].includes(id)?runtime+'\n;\n'+act4Extra.join('\n;\n'):runtime;
 const stageRuntimeSha256=createHash('sha256').update(stageRuntime).digest('hex');
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated production Scene diagnostic</title><style>body{margin:0}canvas{width:1331px;height:763px}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script(stageRuntime)+script('const clusters='+JSON.stringify(clusters)+';')+script('('+capture.toString()+')('+id+','+JSON.stringify(stageRuntimeSha256)+','+JSON.stringify(variant)+','+JSON.stringify(view)+');');
 await writeFile(path.join(out,`stage${id}-${variant}-${view}.html`),html);
}
console.log(JSON.stringify({stages,runtimeSha256,runtimeBytes:Buffer.byteLength(runtime),scope:'Generator only. Run each fixture in a separate temporary Chrome profile with --force-device-scale-factor=1 --virtual-time-budget=60000 --dump-dom and external timeout 300s. Extractor requires completion, no fixed sleep acceptance.'}));
