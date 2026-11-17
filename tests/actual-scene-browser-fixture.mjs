/** CI-only generator: isolated production Scene, not public UI/gameplay acceptance. */
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runtimeParts} from '../shared/build.mjs';
const out=process.argv[2];
if(!out)throw Error('Usage: node tests/actual-scene-browser-fixture.mjs OUTPUT_DIRECTORY');
await mkdir(out,{recursive:true});
const runtime=(await runtimeParts({vector:true,render:true,app:false,productionStory:true})).join('\n;\n');
const runtimeSha256=createHash('sha256').update(runtime).digest('hex');
function bootstrap(){
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
async function capture(id,runtimeSha256){
 const p=globalThis.PROBE,assert=(v,m)=>{if(!v)throw Error(m);};
 try{
  assert(devicePixelRatio===1,'DPR must be 1');
  const project=HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===id);
  assert(stage,'Missing production stage');
  HonroMaps.compile(stage,project); // Match Native setup order.
  const b=HonroMaps.createBattle(stage,project);HonroStageRules.sanitizeStageBattle(b);
  const engine=new HONRO_CORE.Engine(b,()=>{},true);
  const physics=JSON.stringify({terrain:b.terrain,units:b.units});
  const cv=document.getElementById('scene');cv.width=1331;cv.height=763;
  const scene=new HonroScene(cv);
  Object.assign(scene,{x:0,y:stage.height,scale:HonroBounds.zoomLimits(1331).min,manual:true,time:2,editorView:false,skillPreview:false});
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
  publishProbe({ok:true,scope:'Isolated Chrome production Scene diagnostic. Synthetic initial battle only; no user save, public UI, normal input or gameplay acceptance.',stage:id,view:'edge-desktop-2',width:1331,height:763,dpr:devicePixelRatio,camera,time:2,seed:3910,runtimeSha256,physicsSha256:await hash(physics),renderPure:true,fontStatus:document.fonts.status,fontNote:'System sans-serif; document.fonts.ready awaited. Cross-backend text pixels are not an exact equality claim.',userAgent:navigator.userAgent,imageCount:p.images.length,pendingImages:p.images.filter(v=>v.pending).length,imageErrors:p.images.filter(v=>v.error).length,storage:p.storage,errors:p.errors,violations:p.violations,png:cv.toDataURL('image/png')});
 }catch(e){publishProbe({ok:false,stage:id,error:String(e.stack||e),...p});}
}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
for(const id of [23,26,29]){
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated production Scene diagnostic</title><style>body{margin:0}canvas{width:1331px;height:763px}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')();')+script(runtime)+script('('+capture.toString()+')('+id+','+JSON.stringify(runtimeSha256)+');');
 await writeFile(path.join(out,`stage${id}.html`),html);
}
console.log(JSON.stringify({stages:[23,26,29],runtimeSha256,runtimeBytes:Buffer.byteLength(runtime),scope:'Generator only. Run each fixture in a separate temporary Chrome profile with --force-device-scale-factor=1 --virtual-time-budget=60000 --dump-dom and external timeout 300s. Extractor requires completion, no fixed sleep acceptance.'}));
