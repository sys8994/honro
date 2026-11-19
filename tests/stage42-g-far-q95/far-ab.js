async ({sourcePath,key,sha})=>{
 const G=globalThis,A=G.HonroAuthoredFarArt,M=A.manifest;
 if(sourcePath!=='/stage42-evening-h-q95.qa.webp'||key!=='act5Stage42EveningHQ95'||sha!=='aab6bd260cb84abfb2128112a371735dd7bf2bf2f2db38b9952fbd9d80029233')throw Error('Unexpected exact Q95 key/path/hash');
 if(!M||M!==G.HONRO_AUTHORED_FAR||!M.images||!M.stages)throw Error('Unexpected stock runtime manifest identity');
 const priorDesc=Object.getOwnPropertyDescriptor(M.stages,'42');
 if(!priorDesc?.writable||!priorDesc?.configurable||!Object.isExtensible(M.images)||Object.isFrozen(M.stages)||Object.isFrozen(M.images)||Object.hasOwn(M.images,key))
  throw Error('Stock manifest does not permit narrow reversible runtime-only substitution');
 const req=await fetch(sourcePath,{cache:'no-store',credentials:'omit',redirect:'error'});
 if(!req.ok||req.headers.get('content-type')!=='image/webp')throw Error('H source HTTP content-type');
 const bytes=await req.arrayBuffer(),digest=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(n=>n.toString(16).padStart(2,'0')).join('');
 if(bytes.byteLength!==44380||await digest(bytes)!==sha)throw Error('H source bytes mismatch');
 const blob=new Blob([bytes],{type:'image/webp'});
 const decoded=await createImageBitmap(blob),dimensions=[decoded.width,decoded.height];decoded.close();
 if(dimensions[0]!==2172||dimensions[1]!==724)throw Error('Wrong H browser decode size');
 // Build uses this same MIME + data URI pattern; make it from checked bytes.
 const sourceURL=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);});
 if(!sourceURL.startsWith('data:image/webp;base64,'))throw Error('Wrong browser data URI MIME');
 const old=M.stages[42],candidate={...old,key};
 const manifestOther=()=>JSON.stringify([Object.entries(M.stages).filter(([k])=>k!=='42'),Object.entries(M.images).filter(([k])=>k!==key)]);
 const others=manifestOther();
 const app=G.HonroApp,e=app.engine,b=e.b;
 const clock=G.HonroTimeOfDay,entry=clock?.entry(b),target=entry&&clock.targetMinutes(entry,b.round);
 if(entry!==G.HONRO_TIMELINE?.stages?.['42']||entry.clock===false||!Number.isFinite(target))throw Error('No expected native Stage42 round clock');
 const read=()=>JSON.stringify({
  state:[b.phase,b.side,b.round,b.active,b.honroState.act5,b.honroMarkers,b.honroObjectives],
  terrain:b.terrain,world:b.honroWorldTerrain,play:b.honroPlayBounds,domain:b.honroTerrainBounds,
  actors:b.units.map(u=>[u.id,u.cls,u.x,u.y,u.h,u.hp,u.awake,u.dead,u.airborne,u.spawnX,u.spawnY]),
  view:[app.scene.x,app.scene.y,app.scene.scale,app.scene.time,app.scene.manual],
  timelines:[G.HONRO_TIMELINE?.stages?.['42'],b.honroMap?.clock,b.honroClock,b.clock,b.time]
 });
 if(!old||old.key!=='valleyFar'||Object.hasOwn(M.images,key)||b.honroStage!==42||b.honroMapOrigin!=='campaign'||b.honroCustom||b.round!==1||b.honroState.act5.step!==0||app.dialogue)throw Error('Unexpected far or mount');
 const canvas=(w,h)=>{
  const cv=document.createElement('canvas');
  Object.assign(cv.style,{position:'fixed',left:'-200vw',width:w+'px',height:h+'px'});
  cv.width=w;cv.height=h;document.body.append(cv);return cv;
 };
 const cover=(f,w,h)=>f&&f.x<=0&&f.y<=0&&f.x+f.w>=w&&f.y+f.h>=h;
 const paint=(view,mode,spec)=>{
  const {w,h,x,y,z}=view;M.stages[42]=spec;
  try{
   if(A.keyFor(42)!==spec.key||!A.ready(42,undefined,b))throw Error('Wrong far or pending raster '+spec.key);
   const cv=canvas(w,h),s=new HonroScene(cv);
   try{
    Object.assign(s,{manual:true,x,y,scale:z,time:2,editorView:false,skillPreview:false});
    HonroBounds.constrain(s,b);
    const ctx=cv.getContext('2d');
    if(mode==='fg')s.background=()=>{};
    if(mode==='bg'){s.battle=b;s.background(ctx,w,h,b);}
    else s.render(e,0,app.selected,.6,false,0,true);
    const frames=A.frames(s,w,h,b);
    if(frames.length!==1||frames[0].key!==spec.key||!cover(frames[0].frame,w,h))throw Error('Wrong stock far frames or incomplete coverage');
    const found=s.environmentStats?.authoredFar?.includes(spec.key);
    if(mode==='fg'?found:!found)throw Error('Unexpected background render route '+mode);
    if(cv.width!==w||cv.height!==h||devicePixelRatio!==1)throw Error('Unmatched DPR or backing dimensions');
    return{cam:[s.x,s.y,s.scale,s.manual,cv.width,cv.height,s.time],minutes:s._honroTime?.value??null,frames,png:cv.toDataURL(),
     pixels:ctx.getImageData(0,0,cv.width,cv.height).data};
   }finally{cv.remove();}
  }finally{M.stages[42]=old;}
 };
 const delta=(a,c)=>{let n=0;for(let i=0;i<a.length;i+=4)if(a[i]!==c[i]||a[i+1]!==c[i+1]||a[i+2]!==c[i+2]||a[i+3]!==c[i+3])n++;return n};
 const alpha=a=>{let full=0,clear=0;for(let i=3;i<a.length;i+=4){if(a[i]===255)full++;else if(a[i]===0)clear++}return {full,clear,partial:a.length/4-full-clear}};
 const images={},results=[];
 try{
  M.images[key]=sourceURL;
  // Pre-decode both via the existing renderer cache. B is enabled only
  // synchronously while requesting it; the normal App never displays B.
  for(const spec of [old,candidate]){
   const end=performance.now()+15000;
   for(;;){
    let ready;
    try{M.stages[42]=spec;ready=A.ready(42,undefined,b)}finally{M.stages[42]=old}
    if(ready)break;
    if(performance.now()>end)throw Error('Stock far decode timeout '+spec.key);
    await new Promise(r=>setTimeout(r,35));
   }
  }
  const before=read();
  const member=b.units.find(u=>u.side===0&&!u.dead&&!u.summoned);
  if(!member)throw Error('No actual stock initial actor');
  const views=[{id:'entry-desktop',w:1280,h:800,x:app.scene.x,y:app.scene.y,z:app.scene.scale},
   {id:'west-phone-crop',w:390,h:844,x:member.x,y:member.y-180,z:.5}];
  for(const v of views){try{
   const a=paint(v,'full',old),aa=paint(v,'full',old),af=paint(v,'fg',old),ab=paint(v,'bg',old),
     c=paint(v,'full',candidate),cc=paint(v,'full',candidate),cf=paint(v,'fg',candidate),cb=paint(v,'bg',candidate),
     restored=paint(v,'full',old);
   const counts={stockAA:delta(a.pixels,aa.pixels),candidateBB:delta(c.pixels,cc.pixels),
    exactForegroundAB:delta(af.pixels,cf.pixels),restoredAA:delta(a.pixels,restored.pixels),
    backgroundAB:delta(ab.pixels,cb.pixels),compositeAB:delta(a.pixels,c.pixels)};
   let opaqueForegroundChanges=0;
   for(let i=0;i<af.pixels.length;i+=4)
    if(af.pixels[i+3]===255&&(a.pixels[i]!==c.pixels[i]||a.pixels[i+1]!==c.pixels[i+1]||a.pixels[i+2]!==c.pixels[i+2]||a.pixels[i+3]!==c.pixels[i+3]))opaqueForegroundChanges++;
   const allViews=[aa,af,ab,c,cc,cf,cb,restored].every(q=>JSON.stringify(q.cam)===JSON.stringify(a.cam));
   const marks={a:alpha(ab.pixels),b:alpha(cb.pixels),fg:alpha(af.pixels)};
   const clockA=a.minutes,clockB=c.minutes;
   const checks={allViews,clock:clockA===target&&[aa,af,c,cc,cf,restored].every(q=>q.minutes===clockA),positiveFrames:counts.backgroundAB>0&&counts.compositeAB>0,
    strictRepeat:counts.stockAA===0&&counts.candidateBB===0&&counts.restoredAA===0,
    foreground:counts.exactForegroundAB===0&&marks.fg.full>0&&(marks.fg.clear+marks.fg.partial)>0,
    backgroundOpaque:marks.a.full===v.w*v.h&&marks.b.full===v.w*v.h};
   results.push({request:v,actual:a.cam,clock:{target,a:clockA,b:clockB,text:clock.clockText(b)},frames:{a:ab.frames,b:cb.frames},counts,opaqueForegroundChanges,marks,checks});
   Object.assign(images,{[v.id+'-A-full']:a.png,[v.id+'-B-full']:c.png,[v.id+'-A-background']:ab.png,[v.id+'-B-background']:cb.png,[v.id+'-A-foreground']:af.png});
  }catch(e){results.push({request:v,error:String(e?.message||e),checks:{caseCompleted:false}});}}
  // Both controls deliberately avoid RAF/ticks between snapshots.
  const stateEqual=before===read()&&app.engine===e&&e.b===b,manifestEqual=manifestOther()===others&&M.stages[42]===old;
  return {results,images,stateEqual,manifestEqual,source:{sha,bytes:bytes.byteLength,dimensions,encoding:'lossy WebP',quality:95},cache:A.stats(),
    pass:stateEqual&&manifestEqual&&results.length===views.length&&results.every(r=>Object.values(r.checks).every(Boolean))};
 }finally{M.stages[42]=old;delete M.images[key];}
}
