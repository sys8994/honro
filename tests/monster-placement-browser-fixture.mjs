/** CI-only generator: isolated production Scene, not public UI/gameplay acceptance. */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {supportPoint} from '../shared/act4-finale-revision.mjs';
import {runtimeEntries,root} from '../shared/build.mjs';
const out=process.argv[2];
if(!out)throw Error('Usage: node tests/actual-scene-browser-fixture.mjs OUTPUT_DIRECTORY [23,26,29|32|33]');
const stages=[40];
if(process.env.HONRO_ACT4_RELEASE!=='1')throw Error('Act4 release required');
const old=execFileSync('git',['show','7d238d20663c3ceffe430eb0304e01516ae625cf:shared/act4-finale-author.mjs'],{encoding:'utf8'});
const {authorAct4Finale:oldAuthor}=await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'));
const src=JSON.parse(await readFile('shared/data/act4/world.json','utf8')).stages.find(s=>s.metadata.stageId===40);
const authored=oldAuthor(src,supportPoint);const baseline={units:authored.units,encounters:authored.encounters,initialState:authored.initialState};
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
  if(variant==='baseline')Object.assign(stage,structuredClone(HONRO_BASELINE40));
  const project={...HONRO_PROJECT,stages:HONRO_PROJECT.stages.map(s=>s===original?stage:s)};
  assert(stage,'Missing production stage');
  HonroMaps.compile(stage,project); // Match Native setup order.
  const b=(id===40)?HonroMaps.createBattle(stage,project,HonroProfileStore.fresh()):HonroMaps.createBattle(stage,project);HonroStageRules.sanitizeStageBattle(b);
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
  const placementDiagnostics=[];
  if(variant==='candidate'&&requestedCamera.name==='west'){
   const u=b.units.find(u=>u.id==='final40-dock-stair-2'),support=b.terrain.find(t=>t.id==='approved40-dock-stair');
   for(const x of [1950,1990,2020,2050,2080,2110])for(const face of HONRO_CORE.terrainSurfaces(support,x)){
    const y=face.y,other=b.units.filter(v=>v!==u&&!v.dead&&!v.honroObjectiveTarget&&v.hp>0&&Math.abs(v.x-x)<v.r+u.r+18&&y>v.y-v.h-18&&y-u.h<v.y+18).map(v=>v.id);
    const blocked=b.terrain.filter(t=>!t.broken&&t!==support&&!t.oneWay&&HONRO_CORE.terrainRectIntersects(t,x-u.r-2,y-u.h-2,u.r*2+4,u.h+1,.12)).map(t=>t.id);
    placementDiagnostics.push({x,y,other,blocked});
   }
  }
  const contacts=[];
  if(variant==='candidate'){
   for(const u of b.units.filter(u=>u.side===1&&!HONRO_CORE.flyingEnemy(u))){
    const actual=engine.contactSurface(u.x,u.y-8,u.y+10)?.t.id||null;
    assert(actual===u.honroEncounterSupport,'authored/runtime support mismatch '+u.id+' '+actual+' vs '+u.honroEncounterSupport);
    contacts.push({id:u.id,support:actual});
   }
   assert(contacts.length===41,'41 ground enemies and one flying crow');
  }
  const settling=[];
  if(variant==='candidate'&&requestedCamera.name==='west'){
   const copy=structuredClone(b),probe=new HONRO_CORE.Engine(copy,()=>{},true);
   HonroAct4TerrainPreview.attachCoast({engine:probe,dialogue:null});
   HonroAct4PilotCombat.attach({engine:probe,dialogue:null,charging:false});
   const initial=new Map(copy.units.filter(u=>u.side===1).map(u=>[u.id,{x:u.x,y:u.y,hp:u.hp}]));
   for(let i=0;i<Math.ceil(8/HONRO_CORE.STEP);i++)probe.tick(HONRO_CORE.STEP);
   for(const u of copy.units.filter(u=>initial.has(u.id))){const a=initial.get(u.id);settling.push({id:u.id,dx:u.x-a.x,dy:u.y-a.y,hpLoss:a.hp-u.hp,dead:!!u.dead,support:probe.contactSurface(u.x,u.y-8,u.y+10)?.t.id||null});}
   assert(settling.length===42&&!settling.some(r=>r.dead||r.hpLoss>0),'initial eight-second physics loss');
  }
  const activation=[];
  if(variant==='candidate'){
   for(const cell of Object.keys(b.honroEncounterDensityActivation||{})){
    const copy=structuredClone(b),probe=new HONRO_CORE.Engine(copy,()=>{},true);
    HonroEncounterDensity.installActivation(probe);
    const members=copy.units.filter(u=>u.honroDensityCell===cell),h=probe.heroesAlive()[0];
    assert(members.length&&h,'activation fixture actors');
    for(const other of probe.heroesAlive()){other.x=0;other.y=0;}
    // Synthetic local-contact diagnostic, NOT a traversed route or gameplay win.
    h.x=members[0].x;h.y=members[0].y;
    const contact=probe.contactSurface(h.x,h.y-8,h.y+10)?.t.id;
    probe.refreshActivation();
    assert(probe.honroDensityEligible.has(cell),'unreachable activation cell '+cell+' on '+contact);
    const eligible=probe.combatEnemies().filter(u=>u.honroDensityCell===cell);
    assert(eligible.length===members.length,'missing active members '+cell);
    activation.push({cell,contact,members:members.length,eligible:eligible.length});
   }
   assert(activation.length===16,'all sixteen authored places');
  }
  const initialPng=cv.toDataURL('image/png'),warningImages=[];
  const localActions=[];
  if(variant==='candidate'&&requestedCamera.name==='overview'){
   const at=(support,x)=>{const t=stage.terrains.find(t=>t.id===support);for(const i of t?.properties?.honroWalkEdges||[]){const a=t.points[i],z=t.points[(i+1)%t.points.length];if(a.x!==z.x&&x>=Math.min(a.x,z.x)&&x<=Math.max(a.x,z.x))return {x,y:a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x)};}return null;};
   for(const group of stage.encounters.filter(q=>q.id.startsWith('place40-')&&!['place40-boarding-pair','place40-tide-keeper'].includes(q.id)))for(const approach of (['place40-west-sentry','place40-stair-head','place40-boss-approach'].includes(group.id)?['distant','close']:group.id==='place40-arrival-watch'?['default','caster']:['place40-binding-turn','place40-dock-battery'].includes(group.id)?['default','pilot','near']:['default'])){
    const copy=structuredClone(b),events=[],probe=new HONRO_CORE.Engine(copy,ev=>events.push(ev),true);
    const members=copy.units.filter(u=>group.unitIds.includes(u.id)),u=(approach==='pilot'?members.find(u=>u.honroPilotMidboss==='harbor'):null)||(approach==='caster'?members.find(u=>u.id==='final40-departure-upper-1'):null)||(group.id==='place40-stair-head'?members.find(u=>u.id==='final40-dock-stair-6'):null)||members.find(u=>!u.honroMidboss&&(u.honroPilotRole==='bow'||u.role==='bow'))||members.find(u=>!u.honroMidboss)||members[0],h=probe.heroesAlive().find(u=>u.cls==='archer')||probe.heroesAlive()[0];
    const support=u.honroEncounterSupport,lo=Math.min(...members.map(u=>u.x)),hi=Math.max(...members.map(u=>u.x));
    const pos=(approach==='near'?[group.id==='place40-binding-turn'?2140:1250]:approach==='close'?[group.id==='place40-west-sentry'?1700:group.id==='place40-stair-head'?2640:1625]:[lo-260,hi+260,lo-160,hi+160,lo-100,hi+100]).map(x=>at(support,x)).find(p=>p&&!copy.units.some(v=>v.id!==h.id&&Math.abs(v.x-p.x)<65&&Math.abs(v.y-p.y)<125));
    if(pos&&!HONRO_CORE.validTerrainContactPose(copy.terrain,{...h,...pos})){localActions.push({group:group.id,approach,error:'Unsupported prepared hero pose',pos});continue;}
    if(!pos){localActions.push({group:group.id,error:'No synthetic local approach on same support'});continue;}
    Object.assign(h,pos,{vx:0,vy:0});Object.assign(u,{awake:true,acted:false,moveLeft:u.maxMove});
    Object.assign(copy,{side:1,phase:'enemy',active:u.id,queue:[u.id],turnAge:0});
    const probeApp={engine:probe,dialogue:null,charging:false};
    HonroAct4TerrainPreview.attachCoast(probeApp); // Real exclusion, tide/water and cluster activation wrappers.
    HonroAct4PilotCombat.attach(probeApp);
    const start={x:u.x,y:u.y,hp:h.hp,shot:copy.shot};let projectiles=0;
    for(let i=0;i<Math.ceil(12/HONRO_CORE.STEP);i++){probe.tick(HONRO_CORE.STEP);projectiles=Math.max(projectiles,copy.projectiles.length);if(u.acted&&!copy.projectiles.length)break;}
    const firstAction={hpLoss:start.hp-h.hp,dx:u.x-start.x,dy:u.y-start.y,shots:copy.shot-start.shot,acted:!!u.acted,intent:u.intent};
    let followUp=null;
    const pending=u.honroMonsterWindup||u.enemyEffectCast||u.honroPilotCombat?.target;
    if(pending||(['place40-east-rearguard','place40-stair-head','place40-boss-approach'].includes(group.id)&&firstAction.hpLoss===0&&firstAction.shots===0)){
     for(let i=0;i<720&&!(copy.side===0&&copy.phase==='aim');i++)probe.tick(HONRO_CORE.STEP);
     if(probe.select(h.id)){
      const advanceFrom={x:h.x,y:h.y,hp:h.hp};
      if(!pending&&['place40-stair-head','place40-boss-approach'].includes(group.id)){
       const direction=Math.sign(u.x-h.x);
       for(let i=0;i<240&&Math.abs(h.x-advanceFrom.x)<40;i++){probe.move(direction,HONRO_CORE.STEP);probe.tick(HONRO_CORE.STEP);if(copy.side!==0||copy.phase!=='aim')break;}
      }
      const playerAdvance={from:advanceFrom,to:{x:h.x,y:h.y,hp:h.hp},method:'Actual Engine.move/tick, capped at forty world units; no coordinate or health assignment'};
      Object.assign(scene,{x:(u.x+h.x)/2,y:h.y-180,scale:.65});
      HonroApp={engine:probe,scene:{x:scene.x,y:scene.y,scale:scene.scale,canvas:cv}};
      scene.render(probe,0,'',.6,false,0,false);await drain();
      const shown=structuredClone(u.honroMonsterWindup||u.enemyEffectCast||u.honroPilotCombat?.target),health=h.hp,shield=h.shield||0;
      if(!warningImages.length)warningImages.push({group:group.id,actor:u.id,target:h.id,png:cv.toDataURL('image/png')});
      probe.wait();
      for(let i=0;i<1440&&copy.side===0;i++){if(probe.canAct())probe.wait();probe.tick(HONRO_CORE.STEP);}
      const answer=structuredClone(u.honroMonsterWindup||u.enemyEffectCast||u.honroPilotCombat?.target||null);
      if(copy.side===1){
       // A second prepared actor slot, after real hero wait/turn completion.
       // No seen/answered receipts, damage or skill outcome are assigned.
       copy.queue=[u.id];copy.active=u.id;copy.phase='enemy';u.acted=false;
       for(let i=0;i<1440;i++){probe.tick(HONRO_CORE.STEP);if(u.acted&&!copy.projectiles.length)break;}
      }
      followUp={shown,answer,playerAdvance,hpLoss:health-h.hp,shieldLoss:shield-(h.shield||0),conditions:h.honroMonsterConditions||h.bound||null,remainingWindup:!!(u.honroMonsterWindup||u.enemyEffectCast||u.honroPilotCombat?.target),intent:u.intent,scope:'Actual Canvas warning, actual hero wait then a second prepared enemy slot. Not normal route or full-play acceptance.'};
      HonroApp={engine};Object.assign(scene,camera);if(id===37)HonroApp.scene={...camera,canvas:cv};
     }else followUp={error:'Could not offer target an actual ally turn'};
    }
    localActions.push({pilotCombat:u.honroPilotCombat||null,pilotRelocation:u.honroPilotRelocation||null,group:group.id,approach,actor:u.id,target:h.id,preparedHero:pos,support,followUp,firstAction,actorSupport:probe.contactSurface(start.x,start.y-8,start.y+10)?.t.id||null,hpLoss:start.hp-h.hp,dx:u.x-start.x,dy:u.y-start.y,projectiles,shots:copy.shot-start.shot,acted:!!u.acted,intent:u.intent,scope:'Prepared one-actor local Engine action on production terrain; not normal route, quest or full-play acceptance'});
   }
  }
  const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
  publishProbe({ok:true,warningImages,contacts,localActions,placementDiagnostics,settling,activation,scope:'Isolated Chrome production Scene diagnostic. Synthetic initial battle only; no user save, public UI, normal input or gameplay acceptance.',stage:id,variant,units:b.units.filter(u=>u.side===1).map(u=>({id:u.id,x:u.x,y:u.y,role:u.role,group:u.group})),...((id===40)?{tideSnapshot,appReadyUnresolved:true,initialization:'Official coast.tide; fresh in-memory profile; no App launch or event progression'}:{}),view,width,height,dpr:devicePixelRatio,camera,time:2,seed:3910,runtimeSha256,physicsSha256:await hash(physics),renderPure:true,fontStatus:document.fonts.status,fontNote:'System sans-serif; document.fonts.ready awaited. Cross-backend text pixels are not an exact equality claim.',userAgent:navigator.userAgent,imageCount:p.images.length,pendingImages:p.images.filter(v=>v.pending).length,imageErrors:p.images.filter(v=>v.error).length,storage:p.storage,errors:p.errors,violations:p.violations,png:initialPng});
 }catch(e){publishProbe({ok:false,stage:id,error:String(e.stack||e),...p});}
}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
for(const id of stages)for(const variant of ['baseline','candidate'])for(const requestedCamera of [{name:'overview',x:3330,y:2400},{name:'west',x:2200,y:2550,scale:.35},{name:'east',x:4500,y:2200,scale:.35}]){
 const stageRuntime=(id===40)?runtime+'\n;\n'+act4Extra.join('\n;\n'):runtime;
 const stageRuntimeSha256=createHash('sha256').update(stageRuntime).digest('hex');
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated production Scene diagnostic</title><style>body{margin:0}canvas{width:1331px;height:763px}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script('globalThis.HONRO_BASELINE40='+JSON.stringify(baseline)+';')+script(stageRuntime)+script('('+capture.toString()+')('+id+','+JSON.stringify(stageRuntimeSha256)+','+JSON.stringify(variant)+','+JSON.stringify(requestedCamera)+');');
 await writeFile(path.join(out,`stage${id}-${variant}-${requestedCamera.name}.html`),html);
}
console.log(JSON.stringify({stages,runtimeSha256,runtimeBytes:Buffer.byteLength(runtime),scope:'Generator only. Run each fixture in a separate temporary Chrome profile with --force-device-scale-factor=1 --virtual-time-budget=60000 --dump-dom and external timeout 300s. Extractor requires completion, no fixed sleep acceptance.'}));

