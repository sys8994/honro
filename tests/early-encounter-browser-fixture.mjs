import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {runtimeEntries} from '../shared/build.mjs';
const out=process.argv[2];await mkdir(out,{recursive:true});
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const candidateRuntime=entries.map(e=>e.code).join('\n;\n');
const baselineRuntime=entries.map(e=>e.name==='shared/runtime/early-encounter-placement.js'?'globalThis.HonroEarlyEncounterPlacement={author:p=>p};':e.code).join('\n;\n');
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

async function capture(id,camera,variant){
const p=PROBE;try{
 const C=HONRO_CORE,st=HONRO_CONTENT.stages[id-1],profile=C.defaults();
 profile.recruited=HonroStageRules.stageParty(id);profile.honroGrowth={version:2,stages:{}};
 for(const cls of profile.recruited)profile.heroes[cls].xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);
 const b=HonroWorld.build(st,profile,false,'archer','A01');HonroStageRules.sanitizeStageBattle(b);
 const engine=new C.Engine(b,()=>{},true),cv=document.getElementById('scene');cv.width=1331;cv.height=763;
 const scene=new HonroScene(cv);Object.assign(scene,{x:camera.x,y:camera.y,scale:camera.scale||HonroBounds.zoomLimits(1331).min,manual:true,time:2,editorView:false,skillPreview:false});HonroBounds.constrain(scene,b);
 if(id===17)HonroAct23V4Act2.worksite(b); // Official lazy scene data, no progression.
 const before=JSON.stringify(b);await document.fonts.ready;
 const drain=async()=>{for(let i=0;i<200;i++){if(!p.images.some(v=>v.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Images timed out');};
 for(let i=0;i<3;i++){scene.render(engine,0,'',.6,false,0);await drain();await new Promise(r=>setTimeout(r,100));}
 if(JSON.stringify(b)!==before)throw Error('render mutation');
 const initialPng=cv.toDataURL('image/png'),initialCamera={x:scene.x,y:scene.y,scale:scene.scale};

 const localActions=[],warningImages=[];
 if(variant==='candidate'&&camera.name==='focus'&&[9,13,17,29].includes(id)){
  const source=HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id);
  for(const row of HonroEarlyEncounterPlacement.placements[id].filter(row=>!(id===13&&row.id==='a2-enemy-20'))){
   const copy=structuredClone(b),probe=new C.Engine(copy,()=>{},true),u=copy.units.find(u=>u.id===row.id),h=probe.heroesAlive().find(h=>h.cls==='knight')||probe.heroesAlive()[0];
   const support=source.terrains.find(t=>t.id===row.support);
   const point=x=>{for(const i of support.properties.honroWalkEdges){const a=support.points[i],z=support.points[(i+1)%support.points.length];if(a.x!==z.x&&x>=Math.min(a.x,z.x)&&x<=Math.max(a.x,z.x))return{x,y:a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x)};}};
   const offsets=row.id==='a3-29-letter-store-guard-2'?[150,-150]:[-230,230,-160,160,-100,100];
   const pos=offsets.map(dx=>u.x+dx).map(point).filter(Boolean).find(p=>C.validTerrainContactPose(copy.terrain,{...h,...p})&&!copy.units.some(v=>v!==h&&v!==u&&Math.abs(v.x-p.x)<v.r+h.r+18&&Math.abs(v.y-p.y)<Math.min(v.h,h.h)));
   if(!pos){localActions.push({id:row.id,error:'No supported local approach'});continue;}
   Object.assign(h,pos,{vx:0,vy:0});Object.assign(u,{awake:true,acted:false,moveLeft:u.maxMove});
   Object.assign(copy,{side:1,phase:'enemy',active:u.id,queue:[u.id],turnAge:0});
   const damageLog=[],nativeHurt=probe.hurt.bind(probe);probe.hurt=(v,...args)=>{const before={hp:v.hp,shield:v.shield||0},out=nativeHurt(v,...args);damageLog.push({id:v.id,before,after:{hp:v.hp,shield:v.shield||0},damage:args[0],owner:args[1]});return out;};
   if(id===17){HonroEncounterDensity.installActivation(probe);probe.refreshActivation();if(!probe.combatEnemies().some(v=>v.id===u.id))throw Error('Changed stage17 post not eligible from prepared local access '+u.id);}
   const start={x:u.x,y:u.y,hp:h.hp,shot:copy.shot};let projectiles=0;
   for(let i=0;i<Math.ceil(12/C.STEP);i++){probe.tick(C.STEP);projectiles=Math.max(projectiles,copy.projectiles.length);if(u.acted&&!copy.projectiles.length)break;}
   const firstAction={hpLoss:start.hp-h.hp,dx:u.x-start.x,dy:u.y-start.y,shots:copy.shot-start.shot,acted:!!u.acted,intent:u.intent};let followUp=null;
   if(u.honroMonsterWindup||u.enemyEffectCast){
    for(let i=0;i<720&&!(copy.side===0&&copy.phase==='aim');i++)probe.tick(C.STEP);
    if(probe.select(h.id)){
     Object.assign(scene,{x:(u.x+h.x)/2,y:h.y-180,scale:.65});globalThis.HonroApp={engine:probe,scene};
     scene.render(probe,0,'',.6,false,0,false);await drain();
     const shown=structuredClone(u.honroMonsterWindup||u.enemyEffectCast),hp=h.hp,shield=h.shield||0;
     warningImages.push({id:row.id,png:cv.toDataURL('image/png')});
     probe.wait();for(let i=0;i<1440&&copy.side===0;i++){if(probe.canAct())probe.wait();probe.tick(C.STEP);}
     const answer=structuredClone(u.honroMonsterWindup||u.enemyEffectCast||null);
     const responsePose={x:h.x,y:h.y,stunnedRound:h.stunnedRound,round:copy.round,teamEnds:[...copy.teamEnds]},laneBlockers=answer?.origin?probe.collisionTerrain(answer.origin,{x:h.x,y:h.y-h.h*.44},0).filter(t=>!t.broken&&C.segmentTerrain(answer.origin,{x:h.x,y:h.y-h.h*.44},t,0)).map(t=>t.id):[];
     if(copy.side===1){copy.queue=[u.id];copy.active=u.id;copy.phase='enemy';u.acted=false;for(let i=0;i<1440;i++){probe.tick(C.STEP);if(u.acted&&!copy.projectiles.length)break;}}
     followUp={shown,answer,responsePose,laneBlockers,finalPose:{x:h.x,y:h.y},hpLoss:hp-h.hp,shieldLoss:shield-(h.shield||0),remainingWindup:!!(u.honroMonsterWindup||u.enemyEffectCast),intent:u.intent};
    }else followUp={error:'No actual hero turn'};
   }
   localActions.push({id:row.id,preparedHero:pos,support:row.support,damageLog,firstAction,followUp,hpLoss:start.hp-h.hp,projectiles,shots:copy.shot-start.shot,scope:'Synthetic nearby hero pose and enemy slot, original Engine action. Not normal route or full-play acceptance.'});
  }
 }

 const source=HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id);
 publishProbe({ok:true,stage:id,variant,view:camera.name,localActions,warningImages,source:{metadata:source.metadata,units:source.units,terrains:source.terrains,markers:source.markers,elements:source.elements,encounters:source.encounters},units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,r:u.r,h:u.h,role:u.role,kind:u.kind,side:u.side,hp:u.hp,group:u.group,contact:engine.contactSurface(u.x,u.y-8,u.y+10)?.t.id||null})),camera:initialCamera,scope:'Isolated initial production Chrome Scene and synthetic local Engine diagnostic, not public input or full-play acceptance.',...p,png:initialPng});
}catch(e){publishProbe({ok:false,stage:id,error:String(e.stack||e),...p});}
}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
for(const [id,x,y] of [[13,4650,2440],[29,3400,2110],[30,5200,5350],[9,1850,2390],[17,1400,2290]])for(const variant of ([9,13,17,29].includes(id)?['baseline','candidate']:['candidate']))for(const camera of [{name:'focus',x,y,scale:.65},{name:'overview',x:x/2,y:y/2}]){
 const runtime=variant==='baseline'?baselineRuntime:candidateRuntime;
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script(runtime)+script('('+capture.toString()+')('+id+','+JSON.stringify(camera)+','+JSON.stringify(variant)+');');
 await writeFile(path.join(out,'stage'+id+'-'+variant+'-'+camera.name+'.html'),html);
}
