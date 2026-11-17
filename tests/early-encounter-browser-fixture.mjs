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
 const before=JSON.stringify(b);await document.fonts.ready;
 const drain=async()=>{for(let i=0;i<200;i++){if(!p.images.some(v=>v.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Images timed out');};
 for(let i=0;i<3;i++){scene.render(engine,0,'',.6,false,0);await drain();await new Promise(r=>setTimeout(r,100));}
 if(JSON.stringify(b)!==before)throw Error('render mutation');
 const source=HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id);
 publishProbe({ok:true,stage:id,variant,view:camera.name,source:{metadata:source.metadata,units:source.units,terrains:source.terrains,markers:source.markers,elements:source.elements,encounters:source.encounters},units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,r:u.r,h:u.h,role:u.role,kind:u.kind,side:u.side,hp:u.hp,group:u.group,contact:engine.contactSurface(u.x,u.y-8,u.y+10)?.t.id||null})),camera:{x:scene.x,y:scene.y,scale:scene.scale},...p,png:cv.toDataURL('image/png')});
}catch(e){publishProbe({ok:false,stage:id,error:String(e.stack||e),...p});}
}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
for(const [id,x,y] of [[13,4650,2440],[29,3400,2110],[30,5200,5350],[9,3000,2700],[17,2600,2000]])for(const variant of ([13,29].includes(id)?['baseline','candidate']:['candidate']))for(const camera of [{name:'focus',x,y,scale:.65},{name:'overview',x:x/2,y:y/2}]){
 const runtime=variant==='baseline'?baselineRuntime:candidateRuntime;
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script(runtime)+script('('+capture.toString()+')('+id+','+JSON.stringify(camera)+','+JSON.stringify(variant)+');');
 await writeFile(path.join(out,'stage'+id+'-'+variant+'-'+camera.name+'.html'),html);
}
