/** Identical harness copied into baseline and candidate worktrees; no source overrides. */
import {mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
import {runtimeEntries} from '../shared/build.mjs';
const [out,variant]=process.argv.slice(2);if(!out||!['baseline','candidate'].includes(variant))throw Error('Usage: OUT baseline|candidate');
await mkdir(out,{recursive:true});const runtime=(await runtimeEntries({vector:true,render:true,app:false,productionStory:true})).map(e=>e.code).join('\n;\n');const runtimeSha256=createHash('sha256').update(runtime).digest('hex');
function bootstrap(){
 const p=globalThis.PROBE={storage:[],errors:[],images:[],violations:[]};
 globalThis.publishProbe=value=>document.getElementById('result').textContent=btoa(unescape(encodeURIComponent(JSON.stringify(value))));
 addEventListener('error',e=>{p.errors.push(String(e.error?.stack||e.message));publishProbe({ok:false,...p});});addEventListener('unhandledrejection',e=>{p.errors.push(String(e.reason?.stack||e.reason));publishProbe({ok:false,...p});});
 addEventListener('securitypolicyviolation',e=>p.violations.push({directive:e.violatedDirective,uri:e.blockedURI}));
 for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(globalThis,key,{configurable:true,get(){p.storage.push(key);throw Error('Forbidden storage '+key);}});
 // Keep the production animation clock fixed, but preserve the native monotonic clock for measurement.
 globalThis.stage3MeasureNow=performance.now.bind(performance);Object.defineProperty(performance,'now',{configurable:true,value:()=>2000});
 Date.now=()=>1794931200000;let seed=3910;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){const r={pending:!!v,error:false};p.images.push(r);this.addEventListener('load',()=>r.pending=false,{once:true});this.addEventListener('error',()=>{r.pending=false;r.error=!!v;},{once:true});d.set.call(this,v);}});
}
async function capture(variant,view,runtimeSha256){
 const p=PROBE,assert=(v,m)=>{if(!v)throw Error(m);};try{
 assert(devicePixelRatio===1,'DPR');const project=HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===3);assert(stage,'Missing Stage3');
 const body=project.library.find(a=>a.id==='act1-site:3:body');assert(body,'Missing BODY');assert((body.params?.paintBeyondTerrainDomain===true)===(variant==='candidate'),'Wrong registered production source');
 const stageText=JSON.stringify(stage);HonroMaps.compile(stage,project);const b=HonroMaps.createBattle(stage,project);HonroStageRules.sanitizeStageBattle(b);const engine=new HONRO_CORE.Engine(b,()=>{},true),before=JSON.stringify(b),physics=JSON.stringify({terrain:b.terrain,units:b.units});
 const W=view==='portrait'?390:1331,H=view==='portrait'?696:763,cv=document.getElementById('scene');cv.width=W;cv.height=H;cv.style.width=W+'px';cv.style.height=H+'px';
 const requested={x:stage.width/2,y:stage.height,scale:HonroBounds.zoomLimits(W).min};
 if(view==='native')Object.assign(requested,{x:553*3.23,y:610*3.23,scale:1.65});
 const configure=scene=>{Object.assign(scene,{...requested,manual:true,time:2,editorView:false,skillPreview:false});HonroBounds.constrain(scene,b);return scene;};
 let scene=configure(new HonroScene(cv));await document.fonts.ready;
 const t=stage3MeasureNow();scene.render(engine,0,'',.6,false,0);const firstFrameMs=stage3MeasureNow()-t;
 const drain=async()=>{for(let i=0;i<200;i++){if(!p.images.some(q=>q.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Image timeout');};await drain();
 for(let i=0;i<3;i++){scene.render(engine,0,'',.6,false,0);await drain();}
 const camera={x:scene.x,y:scene.y,scale:scene.scale},png=cv.toDataURL('image/png');
 const clean=()=>{scene._releaseDomainTiles?.();for(const name of ['_staticWorldCache','_screenWorldCache','_screenBackgroundCache','_screenForegroundCache','_backgroundCache']){const canvas=scene[name]?.canvas;if(canvas){canvas.width=1;canvas.height=1;}}};
 const samples=[],stats=()=>structuredClone(scene.renderCacheStats?.()??scene._cacheStats);
 const render=(phase,index)=>{const beforeTiles=scene._cacheStats?.domainTileBuilds||0,begin=stage3MeasureNow();scene.render(engine,0,'',.6,false,0);const ms=stage3MeasureNow()-begin;const cache=stats();samples.push({phase,index,ms,x:scene.x,y:scene.y,scale:scene.scale,tileBuilds:(scene._cacheStats?.domainTileBuilds||0)-beforeTiles,cache});assert(JSON.stringify(b)===before,'Render mutated battle');assert(!p.images.some(q=>q.pending||q.error),'Unexpected image/decode during timed frame');};
 for(let i=0;i<5;i++){clean();scene=configure(new HonroScene(cv));render('scene-cold',i);}
 render('screen-prime',0);render('screen-prime',1);
 for(let i=0;i<24;i++)render('warm',i);
 // Both directions and returns, with camera clamping recorded, not assumed.
 const xs=[0,.25,.5,.75,1,.75,.5,.25,0,.5,1,.5];
 for(let i=0;i<xs.length;i++){scene.x=stage.width*xs[i];scene.y=requested.y;HonroBounds.constrain(scene,b);render('pan',i);}
 assert(JSON.stringify(stage)===stageText,'Stage mutated');assert(JSON.stringify({terrain:b.terrain,units:b.units})===physics,'Physics mutated');assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Storage/runtime error');
 const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
 publishProbe({ok:true,variant,view,width:W,height:H,dpr:devicePixelRatio,runtimeSha256,physicsSha256:await digest(physics),stageSha256:await digest(stageText),bodySha256:await digest(JSON.stringify(body)),camera,firstFrameMs,samples,storage:p.storage,errors:p.errors,violations:p.violations,userAgent:navigator.userAgent,clocks:{productionAnimationMs:performance.now(),measurement:'native performance.now bound before fixed animation clock',internalBuildMsValid:false},png,scope:'Synthetic production Scene; first frame measured separately before image decode. Scene-cold recreates Scene and its tile/screen caches after image/source warmup; not full app startup. Synchronous rendering only. No real save access or gameplay FPS claim.'});
 }catch(e){publishProbe({ok:false,variant,view,error:String(e.stack||e),...p});}
}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
for(const view of ['desktop','portrait','native']){
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><style>body{margin:0}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')();')+script(runtime)+script('('+capture.toString()+')('+JSON.stringify(variant)+','+JSON.stringify(view)+','+JSON.stringify(runtimeSha256)+');');await writeFile(path.join(out,`stage3-perf-${variant}-${view}.html`),html);
}
