async ({sourcePath,key,sha})=>{
 const G=globalThis,A=G.HonroAuthoredFarArt,M=A.manifest;
 if(sourcePath!=='/stage42-evening-h2-q95.qa.webp'||key!=='act5Stage42EveningH2Q95'||sha!=='baf4efc3ea202073e8202de9aeea4c09a161b6473eb19f3d77f727d38d34d4e9')throw Error('Unexpected exact Q95 key/path/hash');
 if(!M||M!==G.HONRO_AUTHORED_FAR||!M.images||!M.stages)throw Error('Unexpected stock runtime manifest identity');
 const priorDesc=Object.getOwnPropertyDescriptor(M.stages,'42');
 if(!priorDesc?.writable||!priorDesc?.configurable||!Object.isExtensible(M.images)||Object.isFrozen(M.stages)||Object.isFrozen(M.images)||Object.hasOwn(M.images,key))
  throw Error('Stock manifest does not permit narrow reversible runtime-only substitution');
 const req=await fetch(sourcePath,{cache:'no-store',credentials:'omit',redirect:'error'});
 if(!req.ok||req.headers.get('content-type')!=='image/webp')throw Error('H source HTTP content-type');
 const bytes=await req.arrayBuffer(),digest=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(n=>n.toString(16).padStart(2,'0')).join('');
 if(bytes.byteLength!==125832||await digest(bytes)!==sha)throw Error('H source bytes mismatch');
 const blob=new Blob([bytes],{type:'image/webp'});
 const decoded=await createImageBitmap(blob),dimensions=[decoded.width,decoded.height];
 const raw=document.createElement('canvas');raw.width=2172;raw.height=724;
 const sourceCtx=raw.getContext('2d');sourceCtx.drawImage(decoded,0,0);decoded.close();
 const native=sourceCtx.getImageData(0,0,2172,724).data;
 raw.width=1;raw.height=1;
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
 const pairPlan=[['west-shoulder',[1000,153],[1000,190]],['west-fissure',[1020,153],[1020,195]],
   ['second-outcrop',[1091,223],[1091,272]],['second-slope',[1130,229],[1130,276]]];
 const med=(a,w,h,x,y,r)=>{
  x=Math.round(x);y=Math.round(y);
  if(x-r<0||x+r>=w||y-r<0||y+r>=h)return null;
  const p=[[],[],[],[]];
  for(let iy=y-r;iy<=y+r;iy++)for(let ix=x-r;ix<=x+r;ix++)
   for(let c=0;c<4;c++)p[c].push(a[(iy*w+ix)*4+c]);
  const rgba=p.map(k=>k.sort((a,b)=>a-b)[k.length>>1]);
  const [R,G,B]=rgba;return {rgba,Y:+(.2126*R+.7152*G+.0722*B).toFixed(3),blueMinusRed:B-R};
 };
 const artProbes=(v,a,af,ab,c,cb)=>{
  const f=cb.frames[0].frame,{w,h}=v,[cx,cy,z]=c.cam;
  const rect=[-f.x/f.w*2172,-f.y/f.h*724,(w-f.x)/f.w*2172,(h-f.y)/f.h*724];
  const actorRects=b.units.filter(u=>!u.dead&&u.hp>0&&Number.isFinite(u.h)).map(u=>{
   const x=(u.x-cx)*z+w/2,y=(u.y-cy)*z+h/2,hx=Math.max(u.h*.68,u.w||0)*z+24;
   return [x-hx,y-u.h*z-48,x+hx,y+26];
  });
  const probe=([x,y])=>{
   const sx=f.x+x/2172*f.w,sy=f.y+y/724*f.h;
   const projected=[+sx.toFixed(3),+sy.toFixed(3)];
   const radii=5;
   const scene={stock:med(a.pixels,w,h,sx,sy,radii),stockFar:med(ab.pixels,w,h,sx,sy,radii),
    H2:med(c.pixels,w,h,sx,sy,radii),H2Far:med(cb.pixels,w,h,sx,sy,radii)};
   let maskOpaquePixels=0;
   for(let yi=Math.max(0,Math.round(sy)-5);yi<=Math.min(h-1,Math.round(sy)+5);yi++)
    for(let xi=Math.max(0,Math.round(sx)-5);xi<=Math.min(w-1,Math.round(sx)+5);xi++)
     if(af.pixels[(yi*w+xi)*4+3]===255)maskOpaquePixels++;
   const outsideActors=!actorRects.some(([l,t,r,b])=>sx+5>=l&&sx-5<=r&&sy+5>=t&&sy-5<=b);
   return {source:[x,y],projected,decodedH2:med(native,2172,724,x,y,5),scene,outsideActors,maskOpaquePixels,
    eligible:!!scene.H2&&outsideActors&&maskOpaquePixels===0};
  };
  const pairs=pairPlan.map(([id,hi,lo])=>{
   const sky=probe(hi),ridge=probe(lo);
   const diff=(a,b)=>a&&b?+(a.Y-b.Y).toFixed(2):null;
   const d={decoded:diff(sky.decodedH2,ridge.decodedH2),far:diff(sky.scene.H2Far,ridge.scene.H2Far),
    final:diff(sky.scene.H2,ridge.scene.H2),stockFinal:diff(sky.scene.stock,ridge.scene.stock)};
   return {id,sky,ridge,Yseparation:d,eligible:sky.eligible&&ridge.eligible,
    cool:sky.scene.H2?.blueMinusRed>=6,usableContrast:d.final!==null&&d.final>=12&&d.final<=38,
    preferredContrast:d.final!==null&&d.final>=12&&d.final<=24};
  });
  const qualified=pairs.filter(p=>p.eligible&&p.cool&&p.preferredContrast);
  return {sourceRect:rect,pairs,criteria:{matchedFixed18:target===1080,eligiblePairCount:pairs.filter(p=>p.eligible).length,
   qualifiedPairCount:qualified.length,distinctRidgesAndCoolSky:qualified.length>=2&&qualified.some(p=>p.id.startsWith('west'))&&qualified.some(p=>p.id.startsWith('second'))},
   label:'automated color/position diagnostics only, inspect full image, framing and natural movement separately'};
 };
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
   let art;
   try{art=artProbes(v,a,af,ab,c,cb)}catch(err){art={error:String(err?.message||err)}}
   results.push({request:v,actual:a.cam,clock:{target,a:clockA,b:clockB,text:clock.clockText(b)},frames:{a:ab.frames,b:cb.frames},counts,opaqueForegroundChanges,marks,checks,art});
   Object.assign(images,{[v.id+'-A-full']:a.png,[v.id+'-B-full']:c.png,[v.id+'-A-background']:ab.png,[v.id+'-B-background']:cb.png,[v.id+'-A-foreground']:af.png});
  }catch(e){results.push({request:v,error:String(e?.message||e),checks:{caseCompleted:false}});}}
  // Both controls deliberately avoid RAF/ticks between snapshots.
  const stateEqual=before===read()&&app.engine===e&&e.b===b,manifestEqual=manifestOther()===others&&M.stages[42]===old;
  return {results,images,stateEqual,manifestEqual,source:{sha,bytes:bytes.byteLength,dimensions,encoding:'lossy WebP',quality:95},cache:A.stats(),
    pass:stateEqual&&manifestEqual&&results.length===views.length&&results.every(r=>Object.values(r.checks).every(Boolean)),
    artMetricsPass:results.length===views.length&&results.every(r=>r.art?.criteria?.matchedFixed18&&r.art?.criteria?.distinctRidgesAndCoolSky)};
 }finally{M.stages[42]=old;delete M.images[key];}
}
