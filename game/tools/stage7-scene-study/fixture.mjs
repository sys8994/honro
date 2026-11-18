import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runtimeEntries} from '../../../shared/build.mjs';
import {applyAct1Sites} from '../../../tools/map-forge/act1-naru-doldang.mjs';
import {terrainPathOptimization} from '../../../shared/terrain-path-optimization.mjs';
const out=process.argv[2];if(!out)throw Error('Output directory required');await mkdir(out,{recursive:true});
const candidate=JSON.parse(await readFile(new URL('../stage7-vector-study/generated/candidate.json',import.meta.url),'utf8'));
const closure=JSON.parse(await readFile(new URL('./right-closure.json',import.meta.url),'utf8'));
const join=JSON.parse(await readFile(new URL('./nonwalk-join.json',import.meta.url),'utf8'));
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
async function capture(candidate,closure,join,sourceContract,runtimeSha,variant,view,controlMode=false){
 const partitionRim=function(original,candidate){
 const v=structuredClone(candidate),orig=original;
 const envelope=v.clips['nonwalk-envelope'];
 if(!Array.isArray(envelope)||envelope.length!==1)throw Error('Expected single authored lower envelope');
 // Complement the EXISTING lower-art envelope inside candidate viewBox. No new width/tolerance.
 const [x,y,w,h]=v.viewBox;
 v.clips['original-rim-domain']=[`M${x} ${y}H${x+w}V${y+h}H${x}Z`,...envelope];
 // Evenodd is not supported as clip metadata: use simple upper polygon from envelope top chain.
 const d=envelope[0],tokens=d.match(/[MLZ]|-?\d+(?:\.\d+)?/g),pts=[];
 for(let i=0;i<tokens.length;){const cmd=tokens[i++];if(cmd==='Z')break;if(!['M','L'].includes(cmd))throw Error('Envelope command');pts.push([+tokens[i++],+tokens[i++]]);}
 if(pts.length<4||pts.at(-1)[1]!==y+h||pts.at(-2)[1]!==y+h)throw Error('Expected bottom-closed envelope');
 const top=pts.slice(0,-2);v.clips['original-rim-domain']=[`M${x} ${y}L${x+w} ${y}`+top.slice().reverse().map(p=>'L'+p.join(' ')).join('')+'Z'];
 const foreground=orig.root.children.filter(n=>n.tag==='use'&&n.symbol==='source'||/^site-crop-\d+$/.test(n.clipPath||''));
 const edges=orig.root.children.filter(n=>/^site-edge-\d+$/.test(n.clipPath||''));
 if(foreground.length!==14||edges.length!==3)throw Error('Unexpected original role layout');
 for(const [k,c]of Object.entries(orig.clips))v.clips[k]=structuredClone(c);
 v.symbols.source=structuredClone(orig.symbols.source);
 // Adapt only original alias, leave material's exact source unchanged.
 function adapt(n){if(n.symbol==='original-body-source')n.symbol='source';if(n.children)n.children.forEach(adapt);}
 Object.values(v.symbols).forEach(adapt);delete v.symbols['original-body-source'];
 const backing=v.root.children.filter(n=>!(n.tag==='use'&&['original-body-source','source'].includes(n.symbol))&&!/^(?:cap-|site-crop-)\d+$/.test(n.clipPath||'')&&n.clipPath!=='protected-right');backing.forEach(adapt);
 v.root={tag:'g',children:[...backing,...structuredClone(foreground),{tag:'g',clipPath:'original-rim-domain',children:structuredClone(edges)}]};
 return v;
};
 const qaDiagnostics=true;
 const p=PROBE,assert=(v,m)=>{if(!v)throw Error(m);},plain=x=>JSON.parse(JSON.stringify(x));
 const stable=x=>JSON.stringify(x,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 const hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(typeof x==='string'?x:stable(x)))),v=>v.toString(16).padStart(2,'0')).join('');
 try{
  assert(devicePixelRatio===1,'DPR1 required');const project=HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===7),asset=project.library.find(a=>a.id==='act1-site:7:body');assert(stage&&asset,'Missing authored stage7');
  const placement=stage.elements.find(e=>e.assetId==='act1-site:7:body');assert(placement&&placement.x===0&&placement.y===0&&placement.scale===3.13&&!placement.rotation,'Unexpected source-to-world placement');
  const stageBefore=stable(stage),original=plain(asset),source=original.vector.symbols.source;assert(source,'Actual native source symbol required');
  const findCaps=v=>{const map={};function walk(n){const m=/^(?:site-crop-|cap-)(\d+)$/.exec(n.clipPath||'');if(m)map[+m[1]]=n;for(const c of n.children||[])walk(c);}walk(v.root);return map;};
  const currentCaps=findCaps(original.vector);assert(Object.keys(currentCaps).length===13,'Actual 13 footholds required');
  if(!['original','original-repeat'].includes(variant)){
   let v=plain(candidate.vector);assert(stable(v.symbols['original-body-source'])===stable(sourceContract.rawSource),'Authoritative raw foreground changed');assert(stable(source)===stable(sourceContract.runtimeSource),'Authoritative runtime foreground changed');
   delete v.symbols['original-body-source'];v.symbols.source=plain(source);
   function adapt(n){if(n.tag==='use'&&n.symbol==='original-body-source')n.symbol='source';const m=/^cap-(\d+)$/.exec(n.clipPath||'');if(m)return plain(currentCaps[+m[1]]);if(n.children)n.children=n.children.map(adapt);return n;}
   v.root=adapt(v.root);for(const key of Object.keys(v.symbols))if(key!=='source')v.symbols[key]=adapt(v.symbols[key]);
   for(let i=0;i<13;i++){const cp=currentCaps[i].clipPath;v.clips[cp]=plain(original.vector.clips[cp]);delete v.clips['cap-'+i];}
   for(const [key,value]of Object.entries(original.vector.clips)){if(key==='source-alpha'){assert(stable(v.clips[key])===stable(value),'Native source clip changed');v.clips[key]=plain(value);}}
   if(!controlMode&&variant!=='legacy')v=partitionRim(original.vector,v); // Experimental semantic foreground/backing partition.
   if(!controlMode&&!['legacy','lower-base','lower-expected'].includes(variant)){
    const ch=v.root.children,k=ch.findIndex(n=>n.clipPath==='nonwalk-envelope');assert(k>=0,'Exactly one authored lower layer required');
    const lower=ch.splice(k,1)[0],sourceIndex=ch.findIndex(n=>n.tag==='use'&&n.symbol==='source');assert(sourceIndex>=0,'Source required');ch.splice(sourceIndex+1,0,lower);
   }
   if(['closure','joined'].includes(variant)){
    const index=v.root.children.findIndex(n=>n.tag==='use'&&n.symbol==='source');assert(index>=0,'Foreground source missing');
    v.clips[closure.clipId]=plain(closure.clip);v.root.children.unshift(plain(closure.root)); // Exterior underpaint below lower backing, not a rectangular foreground patch.
    if(variant==='joined')v.root.children.splice(index+2,0,plain(join.node));
   }
   if(variant==='right-backing-off'){
    const count=v.root.children.filter(n=>n.clipPath==='protected-right').length;assert(count===1,'Expected one right backing');
    v.root.children=v.root.children.filter(n=>n.clipPath!=='protected-right');
   }
   if(variant==='bounds-only'){
    const viewBox=plain(v.viewBox);v=plain(original.vector);v.viewBox=viewBox;
    assert(stable(v.root)===stable(original.vector.root),'Bounds control changed root');
    assert(stable(v.symbols)===stable(original.vector.symbols)&&stable(v.clips)===stable(original.vector.clips),'Bounds control changed source/clip');
   }
   const errors=HonroVectorArt.validate(v);assert(!errors.length,'Native validator: '+errors.join(';'));
   asset.vector=v;const [x,y,w,h]=v.viewBox;asset.bounds={x,y,w,h};asset.reference.bounds={x,y,w,h};
   assert(stable(asset.vector.symbols.source)===stable(source),'Source symbol not preserved');assert(stable(findCaps(v))===stable(currentCaps),'13 actual cap trees not preserved');
  }
  assert(stable(stage)===stageBefore,'Stage/camera/placements changed');assert(stable(asset.collision)===stable(original.collision),'Collision art changed');assert(stable(asset.params)===stable(original.params),'Source metadata/style changed');
  const nativeDraw=HonroVectorArt.draw;let expectedDraws=0;
  const paintClosure=(ctx,inst,anchor,white=false)=>{ctx.save();ctx.translate(inst.x||0,inst.y||0);ctx.rotate(inst.rotation||0);ctx.scale(inst.scale??1,inst.scale??1);ctx.translate(-(anchor?.x||0),-(anchor?.y||0));ctx.clip(new Path2D(closure.clip.join(' ')));for(const n of closure.root.children){ctx.fillStyle=white?'#ffffff':n.fill;ctx.fill(new Path2D(n.d));}ctx.restore();};
  const paintJoin=(ctx,inst,anchor,white=false)=>{
   // Independent constructive fill; never call decoration-suppressed stroke(Path2D).
   const shape=new Path2D();
   // Independent command construction from canonical polygon coordinates, not native d parsing.
   for(const poly of join.ribbon.polygons){shape.moveTo(...poly[0]);for(const point of poly.slice(1))shape.lineTo(...point);shape.closePath();}
   ctx.save();ctx.translate(inst.x||0,inst.y||0);ctx.rotate(inst.rotation||0);ctx.scale(inst.scale??1,inst.scale??1);ctx.translate(-(anchor?.x||0),-(anchor?.y||0));ctx.fillStyle=white?'#ffffff':join.node.fill;ctx.fill(shape,'nonzero');ctx.restore();
  };
  if(['expected','joined-expected','lower-expected'].includes(variant)){
   const partVector=(vector,root)=>{
    const symbols={},clips={},gradients={},visiting=new Set();
    function walk(n){
     if(n.clipPath!==undefined){assert(Object.hasOwn(vector.clips||{},n.clipPath),'Expected control missing clip');clips[n.clipPath]=vector.clips[n.clipPath];}
     for(const paint of [n.fill,n.stroke])if(paint?.startsWith('url(')){const id=paint.slice(5,-1);assert(Object.hasOwn(vector.gradients||{},id),'Expected control missing gradient');gradients[id]=vector.gradients[id];}
     if(n.tag==='use'){
      assert(Object.hasOwn(vector.symbols||{},n.symbol),'Expected control missing symbol');assert(!visiting.has(n.symbol),'Expected control symbol cycle');
      if(!Object.hasOwn(symbols,n.symbol)){visiting.add(n.symbol);walk(vector.symbols[n.symbol]);visiting.delete(n.symbol);symbols[n.symbol]=vector.symbols[n.symbol];}
     }
     for(const child of n.children||[])walk(child);
    }
    walk(root);const v={...vector,root,symbols,clips,gradients};const errors=HonroVectorArt.validate(v);assert(!errors.length,'Expected control part validation: '+errors.join(';'));return v;
   };
   const splits=new WeakMap();HonroVectorArt.draw=(ctx,a,inst)=>{
    if(!a.vector?.symbols?.source||stable(a.vector.symbols.source)!==stable(source))return nativeDraw(ctx,a,inst);
    assert(a.vector.root.tag==='g'&&Object.keys(a.vector.root).every(k=>['tag','children'].includes(k)),'Expected control requires identity root');
    let split=splits.get(a.vector);if(!split){split=a.vector.root.children.map(n=>({...a,vector:partVector(a.vector,n)}));splits.set(a.vector,split);}
    if(variant!=='lower-expected'){paintClosure(ctx,inst,a.anchor);expectedDraws++;}
    const lowerPart=variant==='lower-expected'?split.find(part=>part.vector.root.clipPath==='nonwalk-envelope'):null;
    if(variant==='lower-expected')assert(lowerPart,'Independent lower control missing authored material');
    for(const part of split){if(part===lowerPart)continue;nativeDraw(ctx,part,inst);
     if(lowerPart&&part.vector.root.tag==='use'&&part.vector.root.symbol==='source'){nativeDraw(ctx,lowerPart,inst);expectedDraws++;}if(variant==='joined-expected'&&part.vector.root.tag==='use'&&part.vector.root.symbol==='source')paintJoin(ctx,inst,a.anchor);}return true;
   };
  }
  const foregroundReference=partitionRim(original.vector,candidate.vector);
  const lowerReference=foregroundReference.root.children.find(n=>n.clipPath==='nonwalk-envelope');assert(lowerReference,'Lower reference required');
  const originalRim=foregroundReference.root.children.at(-1);
  assert(originalRim.clipPath==='original-rim-domain','Independent rim reference');
  const bodyDrawMetadata=[],sourceReplayTiles=new WeakMap(),observedDraw=HonroVectorArt.draw;
  if(qaDiagnostics)HonroVectorArt.draw=function(ctx,a,inst){
   if(a.id==='act1-site:7:body'){
    if(qaDiagnostics){
     assert(!sourceReplayTiles.has(ctx.canvas),'Multiple BODY calls on one tile require explicit replay ordering');
     const paths={source:{tag:'use',symbol:'source'},caps:{tag:'g',children:Object.keys(currentCaps).sort((a,b)=>+a-+b).map(k=>plain(currentCaps[k]))},sourceCaps:{tag:'g',children:[{tag:'use',symbol:'source'},...Object.keys(currentCaps).sort((a,b)=>+a-+b).map(k=>plain(currentCaps[k]))]}};
     paths.rim=plain(originalRim);paths.foreground={tag:'g',children:[...paths.sourceCaps.children,plain(originalRim)]};
     paths.lower=null;paths.lowerOnBlack=null;paths.lowerOnWhite=null;
     paths.closure=null;paths.join=null;paths.paintedUnion={tag:'use',symbol:'source'};
     paths.sourceBlack=paths.source;paths.sourceWhite=paths.source;paths.closureOnBlack=null;paths.closureOnWhite=null;paths.joinOnBlack=null;paths.joinOnWhite=null;
     const replay={};for(const [name,root]of Object.entries(paths)){
      const cv=document.createElement('canvas');cv.width=ctx.canvas.width;cv.height=ctx.canvas.height;const cc=cv.getContext('2d');if(/(?:Black|White)$/.test(name)){cc.fillStyle=name.endsWith('Black')?'#000000':'#ffffff';cc.fillRect(0,0,cv.width,cv.height);}cc.setTransform(ctx.getTransform());cc.globalAlpha=ctx.globalAlpha;cc.globalCompositeOperation=ctx.globalCompositeOperation;cc.filter=ctx.filter;cc.imageSmoothingEnabled=ctx.imageSmoothingEnabled;cc.imageSmoothingQuality=ctx.imageSmoothingQuality;
      if(['lower','lowerOnBlack','lowerOnWhite'].includes(name))nativeDraw(HonroVisualStyle?.contextLike(ctx,cc)||cc,{...original,vector:{...foregroundReference,root:lowerReference}},inst);
      if(name==='closureOnBlack'||name==='closureOnWhite')paintClosure(cc,inst,original.anchor,false);
      if(name==='joinOnBlack'||name==='joinOnWhite')paintJoin(cc,inst,original.anchor,false);
      if(['closure','paintedUnion'].includes(name))paintClosure(cc,inst,original.anchor,true);if(name==='join')paintJoin(cc,inst,original.anchor,true);if(root)nativeDraw(HonroVisualStyle?.contextLike(ctx,cc)||cc,{...original,vector:{...original.vector,clips:{...original.vector.clips,'original-rim-domain':foregroundReference.clips['original-rim-domain']},root}},inst);replay[name]=cv;
     }sourceReplayTiles.set(ctx.canvas,replay);
    }
    const m=ctx.getTransform(),row={canvas:[ctx.canvas.width,ctx.canvas.height],matrix:[m.a,m.b,m.c,m.d,m.e,m.f],globalAlpha:ctx.globalAlpha,composite:ctx.globalCompositeOperation,filter:ctx.filter,placement:{x:inst.x,y:inst.y,scale:inst.scale,rotation:inst.rotation??0}};
    const key=JSON.stringify(row);if(!bodyDrawMetadata.some(v=>v.key===key)){assert(bodyDrawMetadata.length<128,'Metadata cap');bodyDrawMetadata.push({key,...row});}
   }
   return observedDraw.apply(this,arguments);
  };
  HonroMaps.compile(stage,project);const b=HonroMaps.createBattle(stage,project,undefined,{origin:'campaign'});HonroStageRules.sanitizeStageBattle(b);const engine=new HONRO_CORE.Engine(b,()=>{},true);
  const physics={terrain:b.terrain,units:b.units,width:b.width,height:b.height,waters:b.waters,anchors:b.anchors};
  const S=HonroProfileStore;assert(S?.compactBattleArt&&S?.restoreBattleArt,'Save codec missing');const saved=plain(b),savedText=stable(saved),packed=plain(S.compactBattleArt(saved));assert(stable(saved)===savedText,'Save compactor mutated source');const restored=plain(packed);assert(S.restoreBattleArt(restored),'Save restore failed');assert(stable(restored)===savedText,'Candidate save roundtrip changed battle');
  const probe=plain(b),pe=new HONRO_CORE.Engine(probe,()=>{},true),u=pe.active;assert(u,'No active unit for actual movement probe');const trace=[];for(let i=0;i<90;i++){pe.move(1,1/120);pe.tick(1/120);trace.push([u.x,u.y,u.vx,u.vy,u.hp,u.moveLeft,!!u.airborne]);}
  const movement={scope:'Bounded ordinary Engine.move/tick in a separate in-memory initial battle, not campaign/UI completion',unit:u.id,first:trace[0],last:trace.at(-1),moved:Math.abs(trace.at(-1)[0]-trace[0][0])>.01,grounded:pe.grounded(u),trajectorySha256:await hash(trace)};
  const W=view.width,H=view.height,cv=document.getElementById('scene');cv.width=W;cv.height=H;cv.style.width=W+'px';cv.style.height=H+'px';
  function sized(){const r=cv.getBoundingClientRect();assert(cv.width===W&&cv.height===H&&r.width===W&&r.height===H&&W>100&&H>100,'Attached Canvas bitmap/CSS size mismatch or 1x1');}
  sized();const make=()=>{const s=new HonroScene(cv);sized();const min=HonroBounds.zoomLimits(W).min;Object.assign(s,{x:view.x==='left'?0:stage.width,y:view.y==='top'?0:view.y==='cut'?650*3.13:stage.height,scale:view.close?Math.max(min,.6):min,manual:true,time:2,editorView:false,skillPreview:false});HonroBounds.constrain(s,b);return s;};
  let scene=make();const before=stable(b);await document.fonts.ready;
  const realNow=performance.now.bind(performance),clockSamples=[];
  const draw=()=>{sized();const t=realNow(),descriptor=Object.getOwnPropertyDescriptor(performance,'now');
   try{if(qaDiagnostics)Object.defineProperty(performance,'now',{configurable:true,value:()=>100000});scene.render(engine,0,'',.6,false,0);}
   finally{if(qaDiagnostics){if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete performance.now;}}
   sized();const elapsed=realNow()-t;if(qaDiagnostics&&clockSamples.length<24)clockSamples.push({time:scene.time,clouds:plain(scene._honroClouds??null),grade:plain(scene._honroTime??null)});return elapsed;
  };
  const drain=async()=>{for(let i=0;i<240;i++){if(!p.images.some(v=>v.pending))return;await new Promise(r=>setTimeout(r,50));}throw Error('Image decode timeout');};
  const firstRenderMs=draw();await drain();draw();await drain();scene=make();const coldReadySceneMs=draw();await drain();const repeated=[];for(let i=0;i<1;i++)repeated.push(draw());
  const camera={x:scene.x,y:scene.y,scale:scene.scale},png=cv.toDataURL('image/png'),cache=plain(scene._cacheStats||{}),pan=[];
  // Read actual cache entries after the measured final camera, BEFORE pan.
  // Instrumentation does not change rs, gutters, tile ordering or rendering calls.
  const controls=qaDiagnostics?{bodyDrawMetadata:plain(bodyDrawMetadata),tiles:[],screens:{},rasterScale:scene._domainTiles?.rs??null,viewOptions:plain(scene.viewOptions??null),editorView:scene.editorView,skillPreview:scene.skillPreview,actualSourceAlphaCaptured:false,visualClock:{scope:"performance.now fixed only during synchronous Scene.render; real timing restored in finally",value:100000,samples:clockSamples}}:null;
  const controlMasks={};
  if(qaDiagnostics){
   const bytesHash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
   for(const [id,tile]of scene._domainTiles?.tiles||[]){const cv=tile.canvas,m=cv.getContext('2d').getTransform();controls.tiles.push({id,left:tile.left,top:tile.top,width:cv.width,height:cv.height,lastContextMatrix:[m.a,m.b,m.c,m.d,m.e,m.f],rgbaSha256:await bytesHash(cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data)});}
   for(const key of ['_screenBackgroundCache','_screenWorldCache','_screenForegroundCache']){const v=scene[key]?.canvas;if(v){controls.screens[key]={width:v.width,height:v.height,rgbaSha256:await bytesHash(v.getContext('2d').getImageData(0,0,v.width,v.height).data)};controlMasks[key.slice(1)]=v.toDataURL('image/png');}}
  }
  if(qaDiagnostics){
   const material=HonroTerrainDomain.materialLandmarks(b).find(l=>l.asset?.id==='act1-site:7:body');assert(material&&!material.honroTerrainMaterialClip,'External BODY material clip requires replay support');
   assert(scene._domainTiles&&scene._screenWorldCache?.canvas,'Actual tile and screen caches required');
   const replayReports={};
   for(const name of ['source','caps','sourceCaps','rim','foreground','lower','lowerOnBlack','lowerOnWhite','closure','join','paintedUnion','sourceBlack','sourceWhite','closureOnBlack','closureOnWhite','joinOnBlack','joinOnWhite']){
    const mask=document.createElement('canvas');mask.width=W;mask.height=H;Object.assign(mask.style,{position:'fixed',left:'-20000px',top:'0',width:W+'px',height:H+'px'});document.body.appendChild(mask);
    const replay=new HonroScene(mask);Object.assign(replay,{...camera,manual:true,battle:b});
    replay._domainTiles={key:replay._worldCacheKey(b,W),rs:scene._domainTiles.rs,tiles:new Map()};let matched=0,empty=0;
    for(const [id,tile]of scene._domainTiles.tiles){const saved=sourceReplayTiles.get(tile.canvas)?.[name];const blank=document.createElement('canvas');blank.width=tile.canvas.width;blank.height=tile.canvas.height;const cv=saved||blank;if(saved)matched++;else empty++;replay._domainTiles.tiles.set(id,{canvas:cv,left:tile.left,top:tile.top});}
    const cc=mask.getContext('2d');cc.setTransform(camera.scale,0,0,camera.scale,W/2-camera.x*camera.scale,H/2-camera.y*camera.scale);
    const paint=()=>replay._drawStaticWorldCached(cc,b,W,H);paint();cc.save();cc.setTransform(1,0,0,1,0,0);cc.clearRect(0,0,W,H);cc.restore();paint();
    assert((replay._cacheStats.domainTileBuilds||0)===0,'Replay generated unobserved tiles');assert(replay._screenWorldCache?.canvas,'Replay omitted screen cache');assert(matched>0,'No actual BODY tiles captured');
    controlMasks[name+'Effective']=replay._screenWorldCache.canvas.toDataURL('image/png');replayReports[name]={matched,empty,rasterScale:replay._domainTiles.rs,tileBuilds:replay._cacheStats.domainTileBuilds||0,screenBuilds:replay._cacheStats.screenBuilds,scope:'Source drawn on observed tile transforms; existing production tile and screen-cache compositor reused. Not direct viewport vector alpha.'};mask.remove();
   }
   controls.actualSourceAlphaCaptured=true;controls.sourceReplay=replayReports;
  }
  for(const delta of []){scene.x=camera.x+delta;HonroBounds.constrain(scene,b);const actual={x:scene.x,y:scene.y,scale:scene.scale};pan.push({requestedWorldDx:delta,appliedWorldDx:actual.x-camera.x,ms:draw(),cache:plain(scene._cacheStats||{})});}
  assert(stable(b)===before,'Scene mutated battle');assert(stable(stage)===stageBefore,'Stage mutated');assert(!p.storage.length&&!p.errors.length&&!p.violations.length,'Storage/runtime/CSP failure');assert(!p.images.some(v=>v.pending||v.error),'Image not ready');
  const masks={...controlMasks};
  if(['closure','joined'].includes(variant)){
   const mask=document.createElement('canvas');mask.width=W;mask.height=H;const ctx=mask.getContext('2d');ctx.translate(W/2,H/2);ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.x,-camera.y);
   nativeDraw(ctx,{...original,vector:{...original.vector,root:{tag:'use',symbol:'source'}}},placement);masks.source=mask.toDataURL('image/png');
   ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);ctx.restore();paintClosure(ctx,placement,original.anchor,true);masks.closure=mask.toDataURL('image/png');
  }
  if(['expected','joined-expected','lower-expected'].includes(variant))assert(expectedDraws>0,'Expected control never intercepted BODY draw');
  const cut={source:{x:1448,y0:419,y1:884},world:{x:1448*3.13,y0:419*3.13,y1:884*3.13}};cut.screen={x:W/2+(cut.world.x-camera.x)*camera.scale,y0:H/2+(cut.world.y0-camera.y)*camera.scale,y1:H/2+(cut.world.y1-camera.y)*camera.scale};cut.intersectsViewport=cut.screen.x>=0&&cut.screen.x<W&&Math.max(cut.screen.y0,cut.screen.y1)>=0&&Math.min(cut.screen.y0,cut.screen.y1)<H;cut.note='Unchanged authored source right boundary. Visibility is measured here; image review determines whether its finish is a visual defect.';
  publishProbe({ok:true,scope:'Actual isolated production HonroScene with test-only in-memory BODY injection. No App/user storage/public deployment; bounded engine movement and codec, not full campaign.',variant,view:view.name,width:W,height:H,camera,upperRightCut:cut,stageBounds:{play:stage.playBounds,terrain:stage.terrainBounds,camera:stage.camera},runtimeSha,stageSha256:await hash(stage),physicsSha256:await hash(physics),sourceSha256:await hash(source),capsSha256:await hash(currentCaps),lowerRole:{sha256:await hash(lowerReference),nonwalkEnvelope:foregroundReference.clips['nonwalk-envelope'],grassComplementSha256:await hash(foregroundReference.clips['source-fixed-grass-complement'])},rimReference:{sha256:await hash(originalRim),domain:foregroundReference.clips['original-rim-domain'],meaning:'Original source + 13 caps + original edge nodes clipped only by complement of existing lower-art domain; no epsilon'},assetSha256:await hash(asset),save:{roundtrip:true,packedBytes:JSON.stringify(packed).length,inlineBytes:JSON.stringify(saved).length,table:!!packed.honroLocalArtTable},movement,canvas:{width:cv.width,height:cv.height,cssWidth:cv.getBoundingClientRect().width,cssHeight:cv.getBoundingClientRect().height},timing:{firstRenderMs,coldReadySceneMs,repeated,pan,cache,notes:'Real elapsed clock outside scoped frozen visual time. Diagnostic fixed-camera pass only (one repeat, no pan); separate clean study owns five-repeat/three-pan measurements. Source-mask instrumentation runs inside BODY calls: NOT performance acceptance. coldReadyScene is new Scene caches after decode/global VectorArt warmup, not cold process.'},expectedDraws,controls,masks,fontStatus:document.fonts.status,images:p.images.length,...p,png});
 }catch(e){publishProbe({ok:false,variant,view:view.name,error:String(e.stack||e),...p});}
}
const controlMode=process.env.STAGE7_CONTROLS==='1';
const views=[{name:'portrait-bl',width:390,height:696,x:'left',y:'bottom'},{name:'desktop-br',width:1331,height:763,x:'right',y:'bottom'},{name:'portrait-tr',width:390,height:696,x:'right',y:'top'},{name:'desktop-tr',width:1331,height:763,x:'right',y:'top'},{name:'desktop-cut-close',width:1331,height:763,x:'right',y:'cut',close:true}].filter(v=>!controlMode||['desktop-br','portrait-tr','portrait-bl'].includes(v.name));
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>',list=[];
for(const variant of (controlMode?['original','original-repeat','bounds-only','candidate','right-backing-off']:['original','legacy','lower-base','lower-expected','candidate','closure','expected','joined','joined-expected']))for(const view of views){const file=`${variant}-${view.name}.html`;const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><style>body{margin:0}canvas{display:block}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')(7);')+script(runtime)+script('('+capture.toString()+')('+JSON.stringify(candidate)+','+JSON.stringify(closure)+','+JSON.stringify(join)+','+JSON.stringify(sourceContract)+','+JSON.stringify(runtimeSha)+','+JSON.stringify(variant)+','+JSON.stringify(view)+','+JSON.stringify(controlMode)+');');await writeFile(path.join(out,file),html);list.push({variant,view:view.name,file});}
await writeFile(path.join(out,'capture-list.json'),JSON.stringify(list,null,2));console.log({runtimeSha,views:views.length,controlMode,variants:controlMode?5:6,productionModified:false});

