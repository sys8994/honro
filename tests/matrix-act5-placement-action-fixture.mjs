/** CI-only generator: isolated production Scene, not public UI/gameplay acceptance. */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {combat} from '../shared/data/act5/combat.mjs';
import {makeAct5} from '../shared/act5-world.mjs';
import {runtimeEntries,root} from '../shared/build.mjs';
const out=process.argv[2];
if(!out)throw Error('Usage: node tests/actual-scene-browser-fixture.mjs OUTPUT_DIRECTORY [23,26,29|32|33]');
const stages=(process.env.HONRO_PLACEMENT_STAGES||'43,47,48').split(',').map(Number);
if(stages.some(id=>![43,47,48].includes(id)))throw Error('Only approved placement stages');
if(process.env.HONRO_ACT4_RELEASE!=='1'||process.env.HONRO_ACT5_RELEASE!=='1')throw Error('Act4/5 release required');
const originalCombat=structuredClone(combat);
for(const [filename,exportName] of [['encounters-early.mjs','earlyEncounters'],['encounters-late.mjs','lateEncounters']]){
 const old=execFileSync('git',['show','7d238d20663c3ceffe430eb0304e01516ae625cf:shared/data/act5/'+filename],{encoding:'utf8'});
 const oldData=(await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64')))[exportName];
 for(const id of stages)if(oldData[id])combat[id-41]={...combat[id-41],...oldData[id]};
}
const baseline=Object.fromEntries((await makeAct5()).stages.filter(s=>stages.includes(s.metadata.stageId)).map(s=>[s.metadata.stageId,s]));
combat.splice(0,combat.length,...originalCombat);
await mkdir(out,{recursive:true});
// runtimeParts is exactly runtimeEntries(...).map(entry=>entry.code). Names allow safe deduplication.
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const runtime=entries.map(entry=>entry.code).join('\n;\n');
const names=new Set(entries.map(entry=>entry.name)),act4Extra=[];
if(stages.some(id=>id===40)){
 for(const [name,file]of [['HONRO_ACT4_PILOT_COMBAT_REFERENCE','pilot-combat-reference.json'],['HONRO_ACT4_PREVIEW_SEEDS','reviewed.json']])if(!entries.some(e=>e.global===name||e.name===name))act4Extra.push('globalThis.'+name+'='+JSON.stringify(JSON.parse(await readFile(path.join(root,'shared/data/act4',file),'utf8')))+';');
 for(const name of ['act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-pilot-combat','act4-pilot-art']){
  const file='shared/runtime/'+name+'.js';if(names.has(file))continue;
  names.add(file);act4Extra.push(await readFile(path.join(root,file),'utf8'));
 }
}
const runtimeSha256=createHash('sha256').update(runtime).digest('hex');
function bootstrap(id){
 if(id===40)globalThis.HONRO_APP_READY=new Promise(()=>{}); // Never attach a real App or resolve this promise.
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
 try{
  assert(devicePixelRatio===1,'DPR must be 1');
  const original=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===id),stage=structuredClone(original);
  if(variant==='baseline')Object.assign(stage,structuredClone(HONRO_BASELINE_ACT5[id]));
  const project={...HONRO_PROJECT,stages:HONRO_PROJECT.stages.map(s=>s===original?stage:s)};
  assert(stage,'Missing production stage');
  HonroMaps.compile(stage,project); // Match Native setup order.
  const b=(id===40)?HonroMaps.createBattle(stage,project,HonroProfileStore.fresh()):HonroMaps.createBattle(stage,project);HonroStageRules.sanitizeStageBattle(b);
  assert(b.honroAct5===1&&b.honroStage===id,'Official Act5 initialization required');
  let tideSnapshot=null;
  if(id===40){
   assert(HONRO_ACT4_RELEASE===true,'Act4 release absent');
   assert(b.honroStage===id&&b.honroAct4Official===1,'Not official Act4 stage');
   HonroAct4TerrainPreview.coast.tide(b);
   b.honroAct4PreviewState.visualDrawn={};
   tideSnapshot=structuredClone(b.honroAct4PreviewState.tide??null);
   assert(tideSnapshot?.surface===3762.5&&tideSnapshot?.phase==='low','Official Stage40 low tide');
  }

  const engine=new HONRO_CORE.Engine(b,()=>{},true);
  if(id===40)globalThis.HonroApp={engine};
  const physics=JSON.stringify({terrain:b.terrain,units:b.units});
  const view=requestedCamera.name,width=1331,height=763;
  const cv=document.getElementById('scene');cv.width=width;cv.height=height;cv.style.width=width+'px';cv.style.height=height+'px';
  const scene=new HonroScene(cv);
  Object.assign(scene,{x:requestedCamera.x,y:requestedCamera.y,scale:requestedCamera.scale||HonroBounds.zoomLimits(width).min,manual:true,time:2,editorView:false,skillPreview:false});
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
    const initialPng=cv.toDataURL('image/png'),warningImages=[];
  const localActions=[],settling=[];
  {
   const copy=structuredClone(b),probe=new HONRO_CORE.Engine(copy,()=>{},true);HonroAct5.attach(probe);
   const initial=new Map(copy.units.filter(u=>u.side===1&&!u.dead).map(u=>[u.id,{x:u.x,y:u.y,hp:u.hp}]));
   for(let i=0;i<Math.ceil(8/HONRO_CORE.STEP);i++)probe.tick(HONRO_CORE.STEP);
   for(const u of copy.units.filter(u=>initial.has(u.id))){const a=initial.get(u.id);settling.push({id:u.id,dx:u.x-a.x,dy:u.y-a.y,hpLoss:a.hp-u.hp,dead:!!u.dead,support:probe.contactSurface(u.x,u.y-8,u.y+10)?.t.id||null});}
  }
  const actorIndexes={43:[10,14,15,16],47:[1,2,4,5,6,10,12],48:[6,7,9,10]};
  for(const index of actorIndexes[id]){
   const copy=structuredClone(b),events=[],probe=new HONRO_CORE.Engine(copy,ev=>events.push(ev),true);HonroAct5.attach(probe);
   const u=copy.units.find(v=>v.id==='a5-foe-'+index),h=probe.heroesAlive().find(v=>v.cls==='archer')||probe.heroesAlive()[0];
   assert(u&&!u.dead&&h,'Probe actor/hero missing');
   copy.units=copy.units.filter(v=>v.side!==0||v.id===h.id);
   const support=probe.contactSurface(u.x,u.y-12,u.y+(HONRO_CORE.flyingEnemy(u)?800:12));
   const pos=support&&[-260,260,-420,420,-600,600].map(dx=>{const x=u.x+dx,t=probe.contactSurface(x,support.y-180,support.y+180);return t&&t.t.id===support.t.id?{x,y:t.y}:null;}).find(p=>p&&p.x>80&&p.x<copy.width-80&&!copy.units.some(v=>v.id!==h.id&&!v.dead&&Math.abs(v.x-p.x)<85&&Math.abs(v.y-p.y)<150));
   if(!pos){localActions.push({actor:u.id,group:u.honroAct5Group||stage.units.find(v=>v.id===u.id)?.encounterGroup,error:'No empty local approach on actor support',support:support?.t.id});continue;}
   Object.assign(h,pos,{vx:0,vy:0,jumping:false,airborne:false});delete h.platformDrop;delete h.groundContact;delete h.moveTarget;
   Object.assign(u,{awake:true,acted:false,moveLeft:u.maxMove});
   for(const v of copy.units)if(v.side===1&&v.id!==u.id)v.acted=true;
   Object.assign(copy,{side:1,phase:'enemy',active:u.id,queue:[u.id],turnAge:0});
   const start={x:u.x,y:u.y,hp:h.hp,shot:copy.shot||0};let projectiles=0,maxMove=0;
   const grounded=probe.grounded(h);assert(grounded,'Prepared hero must stand on production support');
   for(let i=0;i<Math.ceil(12/HONRO_CORE.STEP);i++){probe.tick(HONRO_CORE.STEP);projectiles=Math.max(projectiles,copy.projectiles.length);maxMove=Math.max(maxMove,Math.hypot(u.x-start.x,u.y-start.y));if(u.acted&&!copy.projectiles.length)break;}
   const firstAction={hpLoss:start.hp-h.hp,dx:u.x-start.x,dy:u.y-start.y,maxMove,projectiles,shots:(copy.shot||0)-start.shot,acted:!!u.acted,intent:u.intent,effect:!!u.enemyEffectCast};
   let followUp=null;
   if(u.honroMonsterWindup||u.enemyEffectCast){
    for(let i=0;i<720&&!(copy.side===0&&copy.phase==='aim');i++)probe.tick(HONRO_CORE.STEP);
    if(probe.select(h.id)){
     Object.assign(scene,{x:(u.x+h.x)/2,y:h.y-180,scale:.65});
     globalThis.HonroApp={engine:probe,scene:{x:scene.x,y:scene.y,scale:scene.scale,canvas:cv}};
     scene.render(probe,0,'',.6,false,0,false);await drain();
     const shown=structuredClone(u.honroMonsterWindup||u.enemyEffectCast),health=h.hp;
     warningImages.push({actor:u.id,target:h.id,png:cv.toDataURL('image/png')});
     probe.wait(); const guardAfterWait=h.shield||0;
     for(let i=0;i<1440&&copy.side===0;i++){if(probe.canAct())probe.wait();probe.tick(HONRO_CORE.STEP);}
     const answer=structuredClone(u.honroMonsterWindup||u.enemyEffectCast||null);
     if(copy.side===1){
      copy.queue=[u.id];copy.active=u.id;copy.phase='enemy';u.acted=false;
      for(let i=0;i<1440;i++){probe.tick(HONRO_CORE.STEP);if(u.acted&&!copy.projectiles.length)break;}
     }
     followUp={shown,answer,hpLoss:health-h.hp,guardAfterWait,guardRemaining:h.shield||0,conditions:h.honroMonsterConditions||h.bound||null,remainingWindup:!!(u.honroMonsterWindup||u.enemyEffectCast),intent:u.intent,scope:'Actual Canvas warning observation and original Engine.wait, then second prepared enemy slot. No seen/answered, damage or effect outcome assignments. Not normal play.'};
     delete globalThis.HonroApp;Object.assign(scene,camera);
    }else followUp={error:'Actual player turn could not be offered'};
   }
   localActions.push({actor:u.id,kind:u.honroVariant,group:stage.units.find(v=>v.id===u.id)?.encounterGroup,target:h.id,preparedHero:pos,grounded,support:support.t.id,...firstAction,followUp,scope:'Synthetic one-hero approach, forced-awake actor; original Engine action on actual terrain. Not normal route, wake eligibility, quest completion or full-play acceptance'});
  }

  const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
  publishProbe({ok:true,localActions,settling,warningImages,scope:'Isolated Chrome production Scene diagnostic. Synthetic initial battle only; no user save, public UI, normal input or gameplay acceptance.',stage:id,variant,units:b.units.filter(u=>u.side===1).map(u=>({id:u.id,x:u.x,y:u.y,role:u.role,group:u.group})),...((id===40)?{tideSnapshot,appReadyUnresolved:true,initialization:'Official coast.tide; fresh in-memory profile; no App launch or event progression'}:{}),view,width,height,dpr:devicePixelRatio,camera,time:2,seed:3910,runtimeSha256,terrainGeometrySha256:await hash(JSON.stringify(b.terrain)),physicsSha256:await hash(physics),renderPure:true,fontStatus:document.fonts.status,fontNote:'System sans-serif; document.fonts.ready awaited. Cross-backend text pixels are not an exact equality claim.',userAgent:navigator.userAgent,imageCount:p.images.length,pendingImages:p.images.filter(v=>v.pending).length,imageErrors:p.images.filter(v=>v.error).length,storage:p.storage,errors:p.errors,violations:p.violations,png:initialPng});
 }catch(e){publishProbe({ok:false,stage:id,error:String(e.stack||e),...p});}
}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
for(const id of stages)for(const variant of ['candidate'])for(const requestedCamera of [{name:'overview',x:baseline[id].width/2,y:baseline[id].height/2}]){
 const stageRuntime=(id===40)?runtime+'\n;\n'+act4Extra.join('\n;\n'):runtime;
 const stageRuntimeSha256=createHash('sha256').update(stageRuntime).digest('hex');
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated production Scene diagnostic</title><style>body{margin:0}canvas{width:1331px;height:763px}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script('globalThis.HONRO_BASELINE_ACT5='+JSON.stringify(baseline)+';')+script(stageRuntime)+script('('+capture.toString()+')('+id+','+JSON.stringify(stageRuntimeSha256)+','+JSON.stringify(variant)+','+JSON.stringify(requestedCamera)+');');
 await writeFile(path.join(out,`stage${id}-${variant}-${requestedCamera.name}.html`),html);
}
console.log(JSON.stringify({stages,runtimeSha256,runtimeBytes:Buffer.byteLength(runtime),scope:'Generator only. Run each fixture in a separate temporary Chrome profile with --force-device-scale-factor=1 --virtual-time-budget=60000 --dump-dom and external timeout 300s. Extractor requires completion, no fixed sleep acceptance.'}));


