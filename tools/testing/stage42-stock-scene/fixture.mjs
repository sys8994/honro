/** Isolated STOCK Scene diagnostic only. Never launches App, plays, saves, or edits repository. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const [repo,out,baselinePath,candidatePath,label='candidate']=process.argv.slice(2);
if(!repo||!out||!baselinePath||!candidatePath)throw Error('Usage: node fixture.mjs REPO OUTPUT BASELINE_PACKAGE CANDIDATE_PACKAGE [label]');
const {runtimeEntries}=await import(pathToFileURL(path.resolve(repo,'shared/build.mjs')));
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const runtime=entries.map(e=>e.code).join('\n;\n'), runtimeSha256=createHash('sha256').update(runtime).digest('hex');
const baseline=JSON.parse(await readFile(baselinePath,'utf8')), candidate=JSON.parse(await readFile(candidatePath,'utf8'));
const ids=['act5:stage42:registered-body','act5:stage42:original-surface'];
for(const p of [baseline,candidate])if(p.assets.length!==2||ids.some(id=>!p.assets.find(a=>a.id===id)))throw Error('Wrong package');
function bootstrap(){
 globalThis.PROBE={storage:[],errors:[],images:[],violations:[]};const p=PROBE;
 globalThis.publishProbe=value=>document.getElementById('result').textContent=btoa(unescape(encodeURIComponent(JSON.stringify(value))));
 addEventListener('error',e=>{p.errors.push(String(e.error?.stack||e.message));publishProbe({ok:false,...p});});
 addEventListener('unhandledrejection',e=>{p.errors.push(String(e.reason?.stack||e.reason));publishProbe({ok:false,...p});});
 addEventListener('securitypolicyviolation',e=>p.violations.push({directive:e.violatedDirective,uri:e.blockedURI}));
 for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(globalThis,key,{configurable:true,get(){p.storage.push(key);throw Error('Forbidden storage '+key);}});
 Date.now=()=>1794931200000;let seed=3910;globalThis.resetProbeRandom=()=>{seed=3910;};Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 const descriptor=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
 Object.defineProperty(HTMLImageElement.prototype,'src',{...descriptor,set(value){const row={pending:!!value,error:false};p.images.push(row);this.addEventListener('load',()=>row.pending=false,{once:true});this.addEventListener('error',()=>{row.pending=false;row.error=!!value;},{once:true});descriptor.set.call(this,value);}});
}
async function capture(baseline,selected,variant,runtimeSha256){
 const assert=(v,m)=>{if(!v)throw Error(m);},p=PROBE,canon=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
 const hash=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(typeof v==='string'?v:canon(v)))),n=>n.toString(16).padStart(2,'0')).join('');
 try{
  assert(devicePixelRatio===1,'DPR != 1');
  const project=HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===42);assert(stage,'Missing stage42');
  const seen=new Set(),near=[];function find(v){if(!v||typeof v!=='object'||seen.has(v))return;seen.add(v);if(v.id==='act5:near:42'&&v.edgeWall&&v.edgeSurface)near.push(v);for(const q of Object.values(v))find(q);}find(project);assert(near.length>0,'No active near42');
  const worldBefore=canon(stage),assetProof=[];
  for(const a of near)for(const [key,id]of [['edgeWall','act5:stage42:registered-body'],['edgeSurface','act5:stage42:original-surface']]){
   const old=a[key],source=baseline.assets.find(q=>q.id===id),next=selected.assets.find(q=>q.id===id);
   assert(canon(old.vector)===canon(source.vector),'Active source vector differs from supplied baseline: '+id);
   const metadata=a=>{const {vector,...rest}=a;return rest;};assert(canon(metadata(source))===canon(metadata(next)),'Candidate changes non-vector metadata: '+id);
   assetProof.push({id,sourceSha256:await hash(old.vector),selectedSha256:await hash(next.vector)});
   a[key]={...old,vector:structuredClone(next.vector)};
  }
  assert(canon(stage)===worldBefore,'Stage definition changed');
  HonroMaps.compile(stage,project);const b=HonroMaps.createBattle(stage,project);HonroStageRules.sanitizeStageBattle(b);
  assert(b.honroStage===42,'Wrong battle');const engine=new HONRO_CORE.Engine(b,()=>{},true);
  const physics=canon({terrain:b.terrain,units:b.units}),world=canon({width:stage.width,height:stage.height,stage});
  const cv=document.getElementById('scene'),scene=new HonroScene(cv),frames=[];
  const draw=HonroVectorArt.draw,draws={},observedVectors={};HonroVectorArt.draw=function(c,a,...rest){if(a?.id){draws[a.id]=(draws[a.id]||0)+1;if(a.id==='act5:stage42:registered-body'||a.id==='act5:stage42:original-surface')observedVectors[a.id]=a.vector;}return draw.call(this,c,a,...rest);};
  await document.fonts.ready;
  const drain=async()=>{for(let i=0;i<200;i++){if(!p.images.some(v=>v.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Image decode timeout');};
  const points=[['whole',.5,.5],['left',0,.5],['right',1,.5],['top',.5,0],['bottom',.5,1],['tl',0,0],['tr',1,0],['bl',0,1],['br',1,1]];
  for(const [screen,W,H]of [['desktop',1331,763],['portrait',390,844]])for(const [position,u,v]of points){
   cv.width=W;cv.height=H;cv.style.width=W+'px';cv.style.height=H+'px';const limits=HonroBounds.zoomLimits(W);
   const requested={x:stage.width*u,y:stage.height*v,scale:position==='whole'?limits.min:Math.min(limits.max,limits.min*2.8)};
   Object.assign(scene,requested,{manual:true,time:2,editorView:false,skillPreview:false});HonroBounds.constrain(scene,b);
   const camera={x:scene.x,y:scene.y,scale:scene.scale},before=canon(b),prior={...draws};
   const render=()=>{resetProbeRandom();scene.time=2;scene.render(engine,0,'',.6,false,0);};
   for(let i=0;i<3;i++){render();await drain();}render();await drain();
   const png=cv.toDataURL('image/png'),stationary=[],pan=[];
   for(let i=0;i<16;i++){const t=performance.now();render();stationary.push(performance.now()-t);}
   for(let i=0;i<16;i++){scene.x=camera.x+(i%2?3:-3)/camera.scale;const t=performance.now();render();pan.push(performance.now()-t);}Object.assign(scene,camera);
   assert(canon(b)===before,'Render mutated battle '+screen+'-'+position);assert(canon({terrain:b.terrain,units:b.units})===physics,'Physics changed');
   const stats=a=>{const s=[...a].sort((a,b)=>a-b);return{frames:a.length,p50:s[Math.floor(s.length*.5)],p95:s[Math.floor(s.length*.95)],max:s.at(-1),samples:a};};
   frames.push({view:screen+'-'+position,width:W,height:H,dpr:1,requested,camera,time:2,seed:3910,draws:Object.fromEntries(Object.entries(draws).map(([k,v])=>[k,v-(prior[k]||0)])),stationary:stats(stationary),pan:stats(pan),png});
  }
  for(const id of ['act5:stage42:registered-body','act5:stage42:original-surface']){assert(draws[id]>0,'Target asset never drawn '+id);assert(await hash(observedVectors[id])===assetProof.find(q=>q.id===id).selectedSha256,'Draw used stale/wrong vector '+id);}
  assert(!p.storage.length&&!p.errors.length&&!p.violations.length&&!p.images.some(i=>i.error||i.pending),'Runtime/storage/image error');
  publishProbe({ok:true,stage:42,variant,runtimeSha256,assetProof,worldSha256:await hash(world),physicsSha256:await hash(physics),renderPure:true,scope:'Stock isolated Scene only. No App, user saves, normal movement or gameplay acceptance. Candidate vector fields only; no source world change.',frames,draws,userAgent:navigator.userAgent,fontStatus:document.fonts.status,...p});
 }catch(e){publishProbe({ok:false,variant,error:String(e.stack||e),...p});}
}
await mkdir(out,{recursive:true});const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
for(const [variant,pkg]of [['baseline',baseline],[label,candidate]]){
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated stage42 Scene comparison</title><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')();')+script(runtime)+script('('+capture.toString()+')('+[baseline,pkg,variant,runtimeSha256].map(JSON.stringify).join(',')+');');
 await writeFile(path.join(out,variant+'.html'),html);
}
await writeFile(path.join(out,'manifest.json'),JSON.stringify({runtimeSha256,sourceMaster:'1e043b09d4ce107e1d2dcf70fe2274dff7098476',variants:['baseline',label],views:18,app:false},null,2));
