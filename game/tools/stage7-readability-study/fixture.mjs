import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runtimeEntries} from '../../../shared/build.mjs';
import {applyAct1Sites} from '../../../tools/map-forge/act1-naru-doldang.mjs';
import {terrainPathOptimization} from '../../../shared/terrain-path-optimization.mjs';
const out=process.argv[2];if(!out)throw Error('Output directory required');await mkdir(out,{recursive:true});
const candidate=JSON.parse(await readFile(new URL('../stage7-vector-study/generated/candidate.json',import.meta.url),'utf8'));
const helper=await readFile(new URL('./terrain-readability.js',import.meta.url),'utf8');
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const runtime=entries.map(e=>e.code).join('\n;\n'),runtimeSha=createHash('sha256').update(runtime).digest('hex');
// Recreate the production author -> registered path optimizer boundary exactly.
// Never substitute the unoptimized JSON source into the running game.
const stableBuild=x=>JSON.stringify(x,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const shaBuild=x=>createHash('sha256').update(stableBuild(x)).digest('hex');
const runtimeProject=entries.find(e=>e.project)?.project;if(!runtimeProject)throw Error('Runtime campaign project missing');
const rawProject=structuredClone(runtimeProject);rawProject.library=rawProject.library.filter(a=>!a.id.startsWith('act1-site:'));
await applyAct1Sites(rawProject);
const body=p=>p.library.find(a=>a.id==='act1-site:7:body');
const rawBody=structuredClone(body(rawProject));
if(stableBuild(candidate.vector.symbols['original-body-source'])!==stableBuild(rawBody.vector.symbols.source))throw Error('Candidate changed authoritative unoptimized source');
const opt=await terrainPathOptimization();opt.apply([body(rawProject)]);
const optimizedBody=body(rawProject),actualBody=body(runtimeProject);
if(stableBuild(optimizedBody.vector)!==stableBuild(actualBody.vector))throw Error('Registered optimizer does not reproduce actual runtime BODY');
const changes=[];
function differences(a,b,path=[]){if(stableBuild(a)===stableBuild(b))return;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))differences(a[k],b[k],[...path,k]);return;}changes.push({path,rawType:typeof a,runtimeType:typeof b,rawLength:typeof a==='string'?a.length:null,runtimeLength:typeof b==='string'?b.length:null,rawSha256:shaBuild(a??null),runtimeSha256:shaBuild(b??null)});}
differences(rawBody.vector.symbols.source,actualBody.vector.symbols.source);
const sourceContract={rawSource:rawBody.vector.symbols.source,runtimeSource:actualBody.vector.symbols.source,rawSha256:shaBuild(rawBody.vector.symbols.source),runtimeSha256:shaBuild(actualBody.vector.symbols.source)};
await writeFile(path.join(out,'source-adapter-contract.json'),JSON.stringify({scope:'Authoritative source -> existing registered production optimizer, not candidate source edits',rawSha256:sourceContract.rawSha256,runtimeSha256:sourceContract.runtimeSha256,exactRuntimeVectorReproduction:true,changes},null,2));

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
async function capture(candidate,sourceContract,runtimeSha,variant,view){
 const p=PROBE,assert=(v,m)=>{if(!v)throw Error(m);},plain=x=>JSON.parse(JSON.stringify(x));
 const stable=x=>JSON.stringify(x,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 const hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(typeof x==='string'?x:stable(x)))),v=>v.toString(16).padStart(2,'0')).join('');
 try{
  HonroScene.prototype.terrainReadability=variant==='readability'?READABILITY_AB.newDraw:READABILITY_AB.oldDraw;
  assert(devicePixelRatio===1,'DPR1 required');const project=HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===7),asset=project.library.find(a=>a.id==='act1-site:7:body');assert(stage&&asset,'Missing authored stage7');
  const placement=stage.elements.find(e=>e.assetId==='act1-site:7:body');assert(placement&&placement.x===0&&placement.y===0&&placement.scale===3.13&&!placement.rotation,'Unexpected source-to-world placement');
  const stageBefore=stable(stage),original=plain(asset),source=original.vector.symbols.source;assert(source,'Actual native source symbol required');
  const findCaps=v=>{const map={};function walk(n){const m=/^(?:site-crop-|cap-)(\d+)$/.exec(n.clipPath||'');if(m)map[+m[1]]=n;for(const c of n.children||[])walk(c);}walk(v.root);return map;};
  const currentCaps=findCaps(original.vector);assert(Object.keys(currentCaps).length===13,'Actual 13 footholds required');
  if(variant==='candidate'){
   const v=plain(candidate.vector);assert(stable(v.symbols['original-body-source'])===stable(sourceContract.rawSource),'Authoritative raw foreground changed');assert(stable(source)===stable(sourceContract.runtimeSource),'Authoritative runtime foreground changed');
   delete v.symbols['original-body-source'];v.symbols.source=plain(source);
   function adapt(n){if(n.tag==='use'&&n.symbol==='original-body-source')n.symbol='source';const m=/^cap-(\d+)$/.exec(n.clipPath||'');if(m)return plain(currentCaps[+m[1]]);if(n.children)n.children=n.children.map(adapt);return n;}
   v.root=adapt(v.root);for(const key of Object.keys(v.symbols))if(key!=='source')v.symbols[key]=adapt(v.symbols[key]);
   for(let i=0;i<13;i++){const cp=currentCaps[i].clipPath;v.clips[cp]=plain(original.vector.clips[cp]);delete v.clips['cap-'+i];}
   for(const [key,value]of Object.entries(original.vector.clips)){if(key==='source-alpha'){assert(stable(v.clips[key])===stable(value),'Native source clip changed');v.clips[key]=plain(value);}}
   const errors=HonroVectorArt.validate(v);assert(!errors.length,'Native validator: '+errors.join(';'));
   asset.vector=v;const [x,y,w,h]=v.viewBox;asset.bounds={x,y,w,h};asset.reference.bounds={x,y,w,h};
   assert(stable(asset.vector.symbols.source)===stable(source),'Source symbol not preserved');assert(stable(findCaps(v))===stable(currentCaps),'13 actual cap trees not preserved');
  }
  assert(stable(stage)===stageBefore,'Stage/camera/placements changed');assert(stable(asset.collision)===stable(original.collision),'Collision art changed');assert(stable(asset.params)===stable(original.params),'Source metadata/style changed');
  HonroMaps.compile(stage,project);const b=HonroMaps.createBattle(stage,project,undefined,{origin:'campaign'});HonroStageRules.sanitizeStageBattle(b);const engine=new HONRO_CORE.Engine(b,()=>{},true);
  const battleBeforePrepare=stable(b),oldPrepared=READABILITY_AB.oldPrepare(b),newPrepared=READABILITY_AB.newPrepare(b);
  const rows=q=>q.groups.map(g=>({id:g.id,wood:g.wood,bounds:g.bounds,segments:g.segments}));
  const oldRows=rows(oldPrepared),newRows=rows(newPrepared),oldBy=new Map(oldRows.map(g=>[g.id,g])),newBy=new Map(newRows.map(g=>[g.id,g]));
  const removed=[],added=[];for(const row of oldRows){const next=newBy.get(row.id);assert(next,'Readability group removed');for(const seg of row.segments)if(!next.segments.some(q=>stable(q)===stable(seg)))removed.push({id:row.id,...seg});}
  for(const row of newRows){const prior=oldBy.get(row.id);assert(prior,'Readability group added');for(const seg of row.segments)if(!prior.segments.some(q=>stable(q)===stable(seg)))added.push({id:row.id,...seg});}
  assert(removed.length>0&&!added.length,'Expected only existing closure segments removed');const bounds=b.honroTerrainBounds;assert(bounds,'Actual terrain bounds missing');assert(HonroTerrainDomain.render(b).find(t=>t.id==='root-floor')?.honroDomain===true,'Root-floor must be actual rendered domain');
  const near=(x,y)=>Math.abs(x-y)<1e-6;for(const seg of removed)assert(seg.id==='root-floor'&&!seg.walkable&&((near(seg.a.x,bounds.left)&&near(seg.z.x,bounds.left))||(near(seg.a.x,bounds.right)&&near(seg.z.x,bounds.right))||(near(seg.a.y,bounds.bottom)&&near(seg.z.y,bounds.bottom))),'Removed segment is not domain nonwalk closure');
  for(const row of oldRows)if(row.id!=='root-floor')assert(stable(row)===stable(newBy.get(row.id)),'Non-root readability changed: '+row.id);
  const walking=q=>q.flatMap(g=>g.segments.filter(s=>s.walkable).map(s=>({id:g.id,...s})));assert(stable(walking(oldRows))===stable(walking(newRows)),'Walkable rim changed');assert(stable(b)===battleBeforePrepare,'Prepare mutated battle');
  const readability={removed,added,bounds,oldSegments:oldRows.reduce((n,g)=>n+g.segments.length,0),newSegments:newRows.reduce((n,g)=>n+g.segments.length,0),walkSegmentsUnchanged:true,otherGroupsUnchanged:true};
  const physics={terrain:b.terrain,units:b.units,width:b.width,height:b.height,waters:b.waters,anchors:b.anchors};
  const S=HonroProfileStore;assert(S?.compactBattleArt&&S?.restoreBattleArt,'Save codec missing');const saved=plain(b),savedText=stable(saved),packed=plain(S.compactBattleArt(saved));assert(stable(saved)===savedText,'Save compactor mutated source');const restored=plain(packed);assert(S.restoreBattleArt(restored),'Save restore failed');assert(stable(restored)===savedText,'Candidate save roundtrip changed battle');
  const probe=plain(b),pe=new HONRO_CORE.Engine(probe,()=>{},true),u=pe.active;assert(u,'No active unit for actual movement probe');const trace=[];for(let i=0;i<90;i++){pe.move(1,1/120);pe.tick(1/120);trace.push([u.x,u.y,u.vx,u.vy,u.hp,u.moveLeft,!!u.airborne]);}
  const movement={scope:'Bounded ordinary Engine.move/tick in a separate in-memory initial battle, not campaign/UI completion',unit:u.id,first:trace[0],last:trace.at(-1),moved:Math.abs(trace.at(-1)[0]-trace[0][0])>.01,grounded:pe.grounded(u),trajectorySha256:await hash(trace)};
  const W=view.width,H=view.height,cv=document.getElementById('scene');cv.width=W;cv.height=H;cv.style.width=W+'px';cv.style.height=H+'px';
  function sized(){const r=cv.getBoundingClientRect();assert(cv.width===W&&cv.height===H&&r.width===W&&r.height===H&&W>100&&H>100,'Attached Canvas bitmap/CSS size mismatch or 1x1');}
  sized();const make=()=>{const s=new HonroScene(cv);sized();const min=HonroBounds.zoomLimits(W).min;Object.assign(s,{x:view.x==='left'?0:stage.width,y:view.y==='top'?0:view.y==='cut'?650*3.13:stage.height,scale:view.close?Math.max(min,.6):min,manual:true,time:2,editorView:false,skillPreview:false});HonroBounds.constrain(s,b);return s;};
  let scene=make();const before=stable(b);await document.fonts.ready;
  const realNow=performance.now.bind(performance);const draw=()=>{sized();const t=realNow(),descriptor=Object.getOwnPropertyDescriptor(performance,'now');try{Object.defineProperty(performance,'now',{configurable:true,value:()=>100000});scene.render(engine,0,'',.6,false,0);}finally{if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete performance.now;}sized();return realNow()-t;};
  const drain=async()=>{for(let i=0;i<240;i++){if(!p.images.some(v=>v.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Image decode timeout');};
  const firstRenderMs=draw();await drain();draw();await drain();scene=make();const coldReadySceneMs=draw();await drain();const repeated=[];for(let i=0;i<7;i++)repeated.push(draw());
  const camera={x:scene.x,y:scene.y,scale:scene.scale},png=cv.toDataURL('image/png'),cache=plain(scene._cacheStats||{}),pan=[];
  for(const delta of [-60,-20,0,20,60]){scene.x=camera.x+delta;HonroBounds.constrain(scene,b);const actual={x:scene.x,y:scene.y,scale:scene.scale};pan.push({requestedWorldDx:delta,appliedWorldDx:actual.x-camera.x,ms:draw(),cache:plain(scene._cacheStats||{})});}
  assert(stable(b)===before,'Scene mutated battle');assert(stable(stage)===stageBefore,'Stage mutated');assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Storage/runtime/CSP failure');assert(!p.images.some(v=>v.pending||v.error),'Image not ready');
  const cut={source:{x:1448,y0:419,y1:884},world:{x:1448*3.13,y0:419*3.13,y1:884*3.13}};cut.screen={x:W/2+(cut.world.x-camera.x)*camera.scale,y0:H/2+(cut.world.y0-camera.y)*camera.scale,y1:H/2+(cut.world.y1-camera.y)*camera.scale};cut.intersectsViewport=cut.screen.x>=0&&cut.screen.x<W&&Math.max(cut.screen.y0,cut.screen.y1)>=0&&Math.min(cut.screen.y0,cut.screen.y1)<H;cut.note='Unchanged authored source right boundary. Visibility is measured here; image review determines whether its finish is a visual defect.';
  publishProbe({ok:true,scope:'Actual isolated production HonroScene with test-only in-memory BODY injection. No App/user storage/public deployment; bounded engine movement and codec, not full campaign.',variant,readability,view:view.name,width:W,height:H,camera,upperRightCut:cut,stageBounds:{play:stage.playBounds,terrain:stage.terrainBounds,camera:stage.camera},runtimeSha,stageSha256:await hash(stage),physicsSha256:await hash(physics),sourceSha256:await hash(source),capsSha256:await hash(currentCaps),assetSha256:await hash(asset),save:{roundtrip:true,packedBytes:JSON.stringify(packed).length,inlineBytes:JSON.stringify(saved).length,table:!!packed.honroLocalArtTable},movement,canvas:{width:cv.width,height:cv.height,cssWidth:cv.getBoundingClientRect().width,cssHeight:cv.getBoundingClientRect().height},timing:{firstRenderMs,coldReadySceneMs,repeated,pan,cache,notes:'Real performance.now; coldReadyScene is new Scene caches after image decode and global VectorArt warmup, not cold process. CI only, not phone FPS.'},fontStatus:document.fonts.status,images:p.images.length,...p,png});
 }catch(e){publishProbe({ok:false,variant,view:view.name,error:String(e.stack||e),...p});}
}
const views=[{name:'portrait-bl',width:390,height:696,x:'left',y:'bottom'},{name:'desktop-br',width:1331,height:763,x:'right',y:'bottom'}];
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>',list=[];
for(const variant of ['original','readability'])for(const view of views){const file=`${variant}-${view.name}.html`;const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><style>body{margin:0}canvas{display:block}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')(7);')+script(runtime)+script('globalThis.READABILITY_AB={oldPrepare:HonroTerrainReadability.prepare,oldDraw:HonroScene.prototype.terrainReadability};')+script(helper)+script('READABILITY_AB.newPrepare=HonroTerrainReadability.prepare;READABILITY_AB.newDraw=HonroScene.prototype.terrainReadability;')+script('('+capture.toString()+')('+JSON.stringify(candidate)+','+JSON.stringify(sourceContract)+','+JSON.stringify(runtimeSha)+','+JSON.stringify(variant)+','+JSON.stringify(view)+');');await writeFile(path.join(out,file),html);list.push({variant,view:view.name,file});}
await writeFile(path.join(out,'capture-list.json'),JSON.stringify(list,null,2));console.log({runtimeSha,views:views.length,variants:2,productionModified:false});
