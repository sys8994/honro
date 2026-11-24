const hex=/^[a-f0-9]{64}$/;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sha=async(G,raw)=>Array.from(new Uint8Array(await G.crypto.subtle.digest('SHA-256',raw)),v=>v.toString(16).padStart(2,'0')).join('');
// Playable-only after the 59 handoff. Never apply to the ending cuts (won),
// title, replay or any other battle. No writes outside the owned Scene.
export function createPlayableFar60({G=globalThis,plate,authorize,resolveAsset=x=>x,decode,mode='matte',onError=()=>{}}={}){
 if(plate?.schema!=='honro-act6-playable-far60/v1'||plate.stage!==60||!hex.test(plate.sha)||!hex.test(plate.authorSHA)||plate.w!==2172||plate.h!==724||plate.bytes>150000||
  plate.path!=='/web/graphics/act6-far-60-playable.'+plate.sha.slice(0,16)+'.webp'||typeof authorize!=='function'||!['cover','matte'].includes(mode))throw TypeError('Scope/asset mismatch for Stage60 playable far');
 // Replace only the signed visual-only rear drawing. The ledges, carryable
 // positions, front slate, contact rim, and all native actors stay in place.
 function ownRear(view,on,suffix){
  if(typeof view._landmarkLayer!=='function'||typeof view._worldCacheKey!=='function')return ()=>{};
  const paint=view._landmarkLayer,key=view._worldCacheKey;
  const valid=l=>l.id==='rear-only-nonsolid'&&l.asset?.id==='rear-only-nonsolid'&&l.layer==='structural-back'&&
    l.depthLayer==='L1'&&l.asset.collision?.length===0&&!l.honroElementCollision&&!(l.collisionIds?.length);
  function signature(b,w){return key.call(this,b,w)+(on()?':r5-dawn-'+suffix:'');}
  function layer(c,rows,name){
   if(on()&&name==='structural-back'&&rows.some(valid)){
     if(view.canvas?.dataset)view.canvas.dataset.act6RearReplaced='true';
     return paint.call(this,c,rows.filter(l=>!valid(l)),name);
   }
   return paint.apply(this,arguments);
  }
  view._landmarkLayer=layer;view._worldCacheKey=signature;
  return ()=>{if(view._landmarkLayer===layer)view._landmarkLayer=paint;if(view._worldCacheKey===signature)view._worldCacheKey=key;};
 }
 let sceneImage=null;
 async function imageFor(signal){
  if(sceneImage)return sceneImage;
  const u=new G.URL(resolveAsset(plate.path),G.location.origin);
  if(u.origin!==G.location.origin||u.search||u.hash||!u.pathname.endsWith(plate.path))throw Error('Stage60 far path');
  const r=await G.fetch(u.href,{redirect:'error',credentials:'omit',signal});
  if(!r.ok||r.url!==u.href)throw Error('Stage60 far response');
  const bytes=await r.arrayBuffer();
  if(bytes.byteLength!==plate.bytes||await sha(G,bytes)!==plate.sha)throw Error('Stage60 far digest');
  let image;
  if(decode)image=await decode(bytes);
  else {const url=G.URL.createObjectURL(new G.Blob([bytes],{type:'image/webp'}));
   image=new G.Image();try{image.src=url;await image.decode();}finally{G.URL.revokeObjectURL(url);}}
  if((image.naturalWidth??image.width)!==plate.w||(image.naturalHeight??image.height)!==plate.h)throw Error('Stage60 far resolved dimensions');
  if(!signal?.aborted)sceneImage=image;
  return image;
 }
 const grade=Object.freeze({
  'last-souls':{fx:.47, f:'saturate(.42) brightness(.55) contrast(1.03)', tint:'rgba(29,49,75,.36)'},
  'bridge-record':{fx:.61, f:'saturate(.52) brightness(.66) contrast(1.02)', tint:'rgba(32,52,66,.23)'},
  'later-return':{fx:.53, f:'saturate(.76) brightness(.86) contrast(.98)', tint:'rgba(44,50,53,.13)'}
 });
 async function configureEnding({view,canvas,signal,fork,scene,authorized}){
  const tone=grade[scene];
  if(!tone||typeof authorized!=='function'||!authorized()||signal?.aborted||
    fork.b?.honroStage!==60||fork.b.phase!=='won'||fork.b.honroAuthoredId!=='stage-60')return true;
  let im;
  try{im=await imageFor(signal);}catch{return true;}
  if(!im||!authorized()||signal?.aborted)return true;
  ownRear(view,()=>true,'epilogue-'+scene);
  view.background=function(ctx,w,h,b){
   if(b!==fork.b||!authorized())return;
   const c=G.HonroVisualStyle?.raw?.(ctx)??ctx,z=Math.max(w/plate.w,h/plate.h)*1.025;
   c.save();try{
     c.fillStyle='#273645';c.fillRect(0,0,w,h);
     const dw=plate.w*z,dh=plate.h*z;
     c.filter=tone.f;c.drawImage(im,(w-dw)*tone.fx,(h-dh)*.53,dw,dh);c.filter='none';
     c.fillStyle=tone.tint;c.fillRect(0,0,w,h);
     const bottom=c.createLinearGradient(0,h*.50,0,h);
     bottom.addColorStop(0,'rgba(23,36,44,0)');bottom.addColorStop(1,'rgba(26,36,43,.63)');
     c.fillStyle=bottom;c.fillRect(0,h*.50,w,h*.5);
     if(canvas.dataset)canvas.dataset.act6QuietMatte=scene;
   }finally{c.restore();}
  };
  return true;
 }
 const used=new WeakSet();
 function mount({app,engine:e,scene:s,lease}){
  const b=e?.b;
  const attached=()=>app?.stageId===60&&app.engine===e&&app.scene===s&&e.b===b&&b?.honroStage===60&&!app.customMap&&!app.debugMode&&!app.endingGallery;
  const live=()=>attached()&&!['won','lost'].includes(b.phase)&&authorize(app,e,s,lease);
  if(!live()||used.has(s)||typeof s.background!=='function')return null;
  const base=s.background, ctrl=new G.AbortController();let cached=null,stopped=false,error=false,last=null;
  const ready=(async()=>{
   try{
    const image=await imageFor(ctrl.signal);
    if(stopped||!live())return false;
    cached=image;return true;
   }catch(e){if(!stopped&&live()){error=true;onError(e);}return false;}
  })();
  function draw(ctx,w,h,battle){
   if(stopped||battle!==b||!live())return base.apply(this,arguments);
   const c=G.HonroVisualStyle?.raw?.(ctx)??ctx;
   c.save();
   try{
    const color='#3b4950';c.fillStyle=color;c.fillRect(0,0,w,h);
    if(!cached){last={stage:60,blocked:error,waiting:!error};return;}
    const portrait=w/h<.82, dx=clamp((s.x-b.width*.5)/b.width,-.5,.5);
    const z=Math.max(w/plate.w,h/plate.h)*1.012,ox=-(plate.w*z-w)*(.505+dx*(portrait?.11:.15)),oy=-(plate.h*z-h)*.5;
    if(mode==='matte')c.globalAlpha=.86;
    c.drawImage(cached,ox,oy,plate.w*z,plate.h*z);
    if(mode==='matte'){
     c.globalAlpha=1;const blend=c.createLinearGradient(0,0,0,h);blend.addColorStop(0,'rgba(35,52,62,.12)');
     blend.addColorStop(.35,'rgba(39,53,62,0)');blend.addColorStop(.58,'rgba(39,53,62,.07)');blend.addColorStop(1,'rgba(33,51,61,.40)');
     c.fillStyle=blend;c.fillRect(0,0,w,h);
    }
    this.environmentStats={groups:0,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0,authoredFar:[plate.sha]};
    last={stage:60,mode,sha:plate.sha,sourceWindow:[-ox/z,-oy/z,w/z,h/z]};
   } finally{c.restore();}
  }
  const resetRear=ownRear(s,()=>!!cached&&live(),'play');
  s.background=draw;used.add(s);
  return Object.freeze({ready,observe:()=>!stopped&&live()&&last?structuredClone(last):null,dispose(){
   stopped=true;ctrl.abort();cached=null;if(s.background===draw)s.background=base;resetRear();used.delete(s);
  }});
 }
 return Object.freeze({mount,configureEnding});
}
