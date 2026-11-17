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
 const enemies=b.units.filter(u=>u.side===1); const xs=enemies.map(u=>u.x),ys=enemies.map(u=>u.y-u.h/2); const lim=HonroBounds.zoomLimits(1331).min; const box={left:xs.length?Math.min(...xs):0,right:xs.length?Math.max(...xs):b.width,top:ys.length?Math.min(...ys):0,bottom:ys.length?Math.max(...ys):b.height}; const halfW=1331/lim/2-130,halfH=763/lim/2-130; const cx=(box.left+box.right)/2,cy=(box.top+box.bottom)/2; const left=Math.min(cx,box.left+halfW),right=Math.max(cx,box.right-halfW),top=Math.min(cy,box.top+halfH),bottom=Math.max(cy,box.bottom-halfH); const positions={center:[cx,cy],nw:[left,top],ne:[right,top],sw:[left,bottom],se:[right,bottom],gate:[2500,2400]}; const focus={4:[2300,3000],12:[4600,2100],14:[1500,2120],15:[1050,2250],18:[6240,2350],19:[4000,6200],22:[2550,1050],23:[4200,4950],28:[5650,2450]}; positions.detail=focus[id]; const pos=positions[camera.name];camera={...camera,x:pos[0],y:pos[1],scale:camera.name==='detail'?.55:lim}; const scene=new HonroScene(cv);Object.assign(scene,{x:camera.x,y:camera.y,scale:camera.scale||HonroBounds.zoomLimits(1331).min,manual:true,time:2,editorView:false,skillPreview:false});HonroBounds.constrain(scene,b);
 if(id===19)HonroAct23V4Reviewed19.familyCalls(b);
 if(id===17)HonroAct23V4Act2.worksite(b); // Official lazy scene data, no progression.
 const before=JSON.stringify(b);await document.fonts.ready;
 const drain=async()=>{for(let i=0;i<200;i++){if(!p.images.some(v=>v.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Images timed out');};
 for(let i=0;i<3;i++){scene.render(engine,0,'',.6,false,0);await drain();await new Promise(r=>setTimeout(r,100));}
 if(JSON.stringify(b)!==before)throw Error('render mutation');
 const initialPng=cv.toDataURL('image/png'),initialCamera={x:scene.x,y:scene.y,scale:scene.scale};

 const localActions=[],warningImages=[];

 const source=HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id);
 publishProbe({ok:true,stage:id,variant,view:camera.name,localActions,warningImages,source:{metadata:source.metadata,units:source.units,terrains:source.terrains,markers:source.markers,elements:source.elements,encounters:source.encounters},units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,r:u.r,h:u.h,role:u.role,kind:u.kind,side:u.side,hp:u.hp,group:u.group,contact:engine.contactSurface(u.x,u.y-8,u.y+10)?.t.id||null})),camera:initialCamera,scope:'Isolated initial production Chrome Scene only, not public input or full-play acceptance.',...p,png:initialPng});
}catch(e){publishProbe({ok:false,stage:id,error:String(e.stack||e),...p});}
}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
for(const id of [4,12,14,15,18,19,22,23,28]){
 const html='<!doctype html><meta charset="utf-8"><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script(candidateRuntime)+script('('+capture.toString()+')('+id+', {name:location.hash.slice(1)||"center"},"candidate");');
 await writeFile(path.join(out,'stage'+id+'.html'),html);
}
