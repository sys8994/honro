import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runtimeEntries} from '../../../shared/build.mjs';
import {buildOriginalAct1SiteBody} from '../../../tools/map-forge/act1-naru-doldang.mjs';
import {finishStage7Body,loadStage7TerrainFinish} from '../../../tools/map-forge/stage7-terrain-finish.mjs';
import {terrainPathOptimization} from '../../../shared/terrain-path-optimization.mjs';
const out=process.argv[2];if(!out)throw Error('Output directory required');await mkdir(out,{recursive:true});
const stableBuild=x=>JSON.stringify(x,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const shaBuild=x=>createHash('sha256').update(stableBuild(x)).digest('hex');
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const runtime=entries.map(e=>e.code).join('\n;\n'),runtimeSha=createHash('sha256').update(runtime).digest('hex');
const project=entries.find(e=>e.project)?.project;assert(project,'Missing actual project');
const actual=project.library.find(a=>a.id==='act1-site:7:body');assert(actual);
const sourceData=JSON.parse(await readFile(new URL('../../../shared/assets/environment/act1-sites/stage07.json',import.meta.url),'utf8'));
const rawOriginal=buildOriginalAct1SiteBody(sourceData,7),originalSnapshot=stableBuild(rawOriginal);
const rawFinished=finishStage7Body(rawOriginal,await loadStage7TerrainFinish());assert.equal(stableBuild(rawOriginal),originalSnapshot,'Mutation of readonly original');
const expected={...structuredClone(actual),vector:rawFinished},baseline={...structuredClone(actual),vector:structuredClone(rawOriginal)};
const frozen=JSON.parse(await readFile(new URL('./frozen-original-recipe.json',import.meta.url),'utf8'));
const boundary=JSON.parse(await readFile(new URL('./frozen-registry-boundary.json',import.meta.url),'utf8'));
const exactSha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.equal(exactSha(rawOriginal),frozen.original,'Independent raw baseline differs from frozen recipe');
assert.equal(frozen.original,boundary.rawOriginalSha256);
assert.equal(exactSha(rawOriginal.symbols.source),boundary.sourceRawSha256);
assert.equal(frozen.paths.length,5);
for(const [p,key,value] of frozen.paths){assert.deepEqual(p.slice(0,2),['symbols','source']);const node=p.reduce((v,k)=>v?.[k],baseline.vector);assert.equal(node?.tag,'path');assert(['d','dParts'].includes(key)&&Object.hasOwn(node,key));node[key]=value;}
assert.equal(exactSha(baseline.vector),boundary.oldOptimizedVectorSha256,'Frozen baseline optimized hash');
assert.equal(exactSha(baseline.vector.symbols.source),boundary.sourceOptimizedSha256);
const registry=JSON.parse(await readFile(new URL('../../../shared/data/terrain-path-optimization.json',import.meta.url),'utf8'));
assert.deepEqual(registry.find(e=>e.id===frozen.id),frozen,'Legacy five-path recipe changed');
assert.equal(exactSha(registry.filter(e=>e.id!==frozen.id)),boundary.otherEntriesSha256,'Other asset recipes changed');
const opt=await terrainPathOptimization();opt.apply([expected]);
assert.equal(stableBuild(actual.vector),stableBuild(expected.vector),'Registered raw->optimizer differs from runtime final');
assert.equal(stableBuild(actual.vector.symbols.source),stableBuild(baseline.vector.symbols.source),'Registered source changed');
const baselineVector=baseline.vector,registeredVectorSha=shaBuild(actual.vector);
await writeFile(path.join(out,'registered-contract.json'),JSON.stringify({rawOriginalSha:shaBuild(rawOriginal),rawFinishedSha:shaBuild(rawFinished),registeredVectorSha,actualRuntimeReproduced:true,readonlyOriginalUnchanged:true,frozenBaselineValidated:true,otherRecipesUnchanged:true,scope:'Independent readonly original author builder, normal optimizer, actual runtime final. Candidate has no fixture injection.'},null,2));
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
async function capture(baselineVector,registeredVectorSha,runtimeSha,variant,view){
 const qaDiagnostics=true;
 const p=PROBE,assert=(v,m)=>{if(!v)throw Error(m);},plain=x=>JSON.parse(JSON.stringify(x));
 const stable=x=>JSON.stringify(x,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 const hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(typeof x==='string'?x:stable(x)))),v=>v.toString(16).padStart(2,'0')).join('');
 try{
  assert(devicePixelRatio===1,'DPR1 required');const project=HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===7),asset=project.library.find(a=>a.id==='act1-site:7:body');assert(stage&&asset,'Missing authored stage7');
  const placement=stage.elements.find(e=>e.assetId==='act1-site:7:body');assert(placement&&placement.x===0&&placement.y===0&&placement.scale===3.13&&!placement.rotation,'Unexpected source-to-world placement');
  const registeredBefore=stable(asset);assert(await hash(asset.vector)===registeredVectorSha,'Registered runtime asset mismatch before capture');
  if(variant==='original'){asset.vector=plain(baselineVector);const [x,y,w,h]=baselineVector.viewBox;asset.bounds={x,y,w,h};asset.reference.bounds={x,y,w,h};}
  const stageBefore=stable(stage),original=plain(asset),source=original.vector.symbols.source;assert(source,'Actual native source symbol required');
  const findCaps=v=>{const map={};function walk(n){const m=/^(?:site-crop-|cap-)(\d+)$/.exec(n.clipPath||'');if(m)map[+m[1]]=n;for(const c of n.children||[])walk(c);}walk(v.root);return map;};
  const currentCaps=findCaps(original.vector);assert(Object.keys(currentCaps).length===13,'Actual 13 footholds required');
  assert(stable(stage)===stageBefore,'Stage/camera/placements changed');assert(stable(asset.collision)===stable(original.collision),'Collision art changed');assert(stable(asset.params)===stable(original.params),'Source metadata/style changed');
  if(variant==='joined')assert(stable(asset)===registeredBefore,'Candidate injected or mutated');
  const nativeDrawIdentity=HonroVectorArt.draw;
  HonroMaps.compile(stage,project);const b=HonroMaps.createBattle(stage,project,undefined,{origin:'campaign'});HonroStageRules.sanitizeStageBattle(b);const engine=new HONRO_CORE.Engine(b,()=>{},true);
  const physics={terrain:b.terrain,units:b.units,width:b.width,height:b.height,waters:b.waters,anchors:b.anchors};
  const S=HonroProfileStore;assert(S?.compactBattleArt&&S?.restoreBattleArt,'Save codec missing');const saved=plain(b),savedText=stable(saved),packed=plain(S.compactBattleArt(saved));assert(stable(saved)===savedText,'Save compactor mutated source');const restored=plain(packed);assert(S.restoreBattleArt(restored),'Save restore failed');assert(stable(restored)===savedText,'Candidate save roundtrip changed battle');
  const probe=plain(b),pe=new HONRO_CORE.Engine(probe,()=>{},true),u=pe.active;assert(u,'No active unit for actual movement probe');const trace=[];for(let i=0;i<90;i++){pe.move(1,1/120);pe.tick(1/120);trace.push([u.x,u.y,u.vx,u.vy,u.hp,u.moveLeft,!!u.airborne]);}
  const movement={scope:'Bounded ordinary Engine.move/tick in a separate in-memory initial battle, not campaign/UI completion',unit:u.id,first:trace[0],last:trace.at(-1),moved:Math.abs(trace.at(-1)[0]-trace[0][0])>.01,grounded:pe.grounded(u),trajectorySha256:await hash(trace)};
  const W=view.width,H=view.height,cv=document.getElementById('scene');cv.width=W;cv.height=H;cv.style.width=W+'px';cv.style.height=H+'px';
  function sized(){const r=cv.getBoundingClientRect();assert(cv.width===W&&cv.height===H&&r.width===W&&r.height===H&&W>100&&H>100,'Attached Canvas bitmap/CSS size mismatch or 1x1');}
  sized();const make=()=>{const s=new HonroScene(cv);sized();const min=HonroBounds.zoomLimits(W).min;Object.assign(s,{x:view.x==='left'?0:stage.width,y:view.y==='top'?0:view.y==='cut'?650*3.13:stage.height,scale:view.close?Math.max(min,.6):min,manual:true,time:2,editorView:false,skillPreview:false});HonroBounds.constrain(s,b);return s;};
  let scene=make();const before=stable(b);await document.fonts.ready;
  const realNow=performance.now.bind(performance);
  const draw=()=>{sized();const t=realNow(),descriptor=Object.getOwnPropertyDescriptor(performance,'now');
   try{if(qaDiagnostics)Object.defineProperty(performance,'now',{configurable:true,value:()=>100000});scene.render(engine,0,'',.6,false,0);}
   finally{if(qaDiagnostics){if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete performance.now;}}
   sized();return realNow()-t;
  };
  const drain=async()=>{for(let i=0;i<240;i++){if(!p.images.some(v=>v.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Image decode timeout');};
  const firstRenderMs=draw();await drain();draw();await drain();scene=make();const coldReadySceneMs=draw();await drain();const repeated=[];for(let i=0;i<5;i++)repeated.push(draw());
  const camera={x:scene.x,y:scene.y,scale:scene.scale},png=cv.toDataURL('image/png'),cache=plain(scene._cacheStats||{}),pan=[];
  for(const delta of [-60,0,60]){scene.x=camera.x+delta;HonroBounds.constrain(scene,b);const actual={x:scene.x,y:scene.y,scale:scene.scale};pan.push({requestedWorldDx:delta,appliedWorldDx:actual.x-camera.x,ms:draw(),cache:plain(scene._cacheStats||{})});}
  assert(stable(b)===before,'Scene mutated battle');assert(stable(stage)===stageBefore,'Stage mutated');assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Storage/runtime/CSP failure');assert(!p.images.some(v=>v.pending||v.error),'Image not ready');
  if(variant==='joined')assert(stable(asset)===registeredBefore,'Scene mutated registered candidate');
  assert(HonroVectorArt.draw===nativeDrawIdentity,'Unexpected renderer instrumentation');
  const cut={source:{x:1448,y0:419,y1:884},world:{x:1448*3.13,y0:419*3.13,y1:884*3.13}};cut.screen={x:W/2+(cut.world.x-camera.x)*camera.scale,y0:H/2+(cut.world.y0-camera.y)*camera.scale,y1:H/2+(cut.world.y1-camera.y)*camera.scale};cut.intersectsViewport=cut.screen.x>=0&&cut.screen.x<W&&Math.max(cut.screen.y0,cut.screen.y1)>=0&&Math.min(cut.screen.y0,cut.screen.y1)<H;cut.note='Unchanged authored source right boundary. Visibility is measured here; image review determines whether its finish is a visual defect.';
  publishProbe({ok:true,scope:'Actual registered production HonroScene candidate without asset/helper injection; original is independent raw-builder plus normal optimizer baseline. No App/user storage/public deployment; bounded engine movement and codec, not full campaign.',variant,view:view.name,width:W,height:H,camera,upperRightCut:cut,stageBounds:{play:stage.playBounds,terrain:stage.terrainBounds,camera:stage.camera},runtimeSha,stageSha256:await hash(stage),physicsSha256:await hash(physics),sourceSha256:await hash(source),capsSha256:await hash(currentCaps),assetSha256:await hash(asset),save:{roundtrip:true,packedBytes:JSON.stringify(packed).length,inlineBytes:JSON.stringify(saved).length,table:!!packed.honroLocalArtTable},movement,canvas:{width:cv.width,height:cv.height,cssWidth:cv.getBoundingClientRect().width,cssHeight:cv.getBoundingClientRect().height},timing:{firstRenderMs,coldReadySceneMs,repeated,pan,cache,notes:'Real elapsed clock outside scoped frozen visual time. No renderer wrappers, mask drawing, cache replay or pixel readback inside measured render. Same validated readability helper in both variants. CI timings are not phone FPS. coldReadyScene is new Scene caches after decode/global VectorArt warmup, not cold process.'},registered:{candidateUninjected:variant==='joined',vectorSha256:await hash(asset.vector)},cleanRender:{rendererUnwrapped:true,maskPasses:0,readability:'same validated helper in both variants',visualClock:100000},fontStatus:document.fonts.status,images:p.images.length,...p,png});
 }catch(e){publishProbe({ok:false,variant,view:view.name,error:String(e.stack||e),...p});}
}
const controlMode=false;
const views=[{name:'portrait-bl',width:390,height:696,x:'left',y:'bottom'},{name:'desktop-br',width:1331,height:763,x:'right',y:'bottom'},{name:'portrait-tr',width:390,height:696,x:'right',y:'top'},{name:'desktop-tr',width:1331,height:763,x:'right',y:'top'},{name:'desktop-cut-close',width:1331,height:763,x:'right',y:'cut',close:true}].filter(v=>!controlMode||['desktop-br','portrait-tr','portrait-bl'].includes(v.name));
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>',list=[];
for(const variant of ['original','joined'])for(const view of views){const file=`${variant}-${view.name}.html`;const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><style>body{margin:0}canvas{display:block}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')(7);')+script(runtime)+script('('+capture.toString()+')('+JSON.stringify(baselineVector)+','+JSON.stringify(registeredVectorSha)+','+JSON.stringify(runtimeSha)+','+JSON.stringify(variant)+','+JSON.stringify(view)+');');await writeFile(path.join(out,file),html);list.push({variant,view:view.name,file});}
await writeFile(path.join(out,'capture-list.json'),JSON.stringify(list,null,2));console.log({runtimeSha,views:views.length,controlMode,variants:2,productionModified:false});


