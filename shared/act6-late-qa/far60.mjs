const hex=/^[a-f0-9]{64}$/;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sha=async(G,raw)=>Array.from(new Uint8Array(await G.crypto.subtle.digest('SHA-256',raw)),v=>v.toString(16).padStart(2,'0')).join('');
// Playable-only after the 59 handoff. Never apply to the ending cuts (won),
// title, replay or any other battle. No writes outside the owned Scene.
export function createPlayableFar60({G=globalThis,plate,authorize,resolveAsset=x=>x,decode,mode='matte',onError=()=>{}}={}){
 if(plate?.schema!=='honro-act6-playable-far60/v1'||plate.stage!==60||!hex.test(plate.sha)||!hex.test(plate.authorSHA)||plate.w!==2172||plate.h!==724||plate.bytes>150000||
  plate.path!=='/web/graphics/act6-far-60-playable.'+plate.sha.slice(0,16)+'.webp'||typeof authorize!=='function'||!['cover','matte'].includes(mode))throw TypeError('Scope/asset mismatch for Stage60 playable far');
 const used=new WeakSet();
 function mount({app,engine:e,scene:s,lease}){
  const b=e?.b;
  const attached=()=>app?.stageId===60&&app.engine===e&&app.scene===s&&e.b===b&&b?.honroStage===60&&!app.customMap&&!app.debugMode&&!app.endingGallery;
  const live=()=>attached()&&!['won','lost'].includes(b.phase)&&authorize(app,e,s,lease);
  if(!live()||used.has(s)||typeof s.background!=='function')return null;
  const base=s.background, ctrl=new G.AbortController();let cached=null,stopped=false,error=false,last=null;
  const ready=(async()=>{
   try{
    const u=new G.URL(resolveAsset(plate.path),G.location.origin);
    if(u.origin!==G.location.origin||u.search||u.hash||!u.pathname.endsWith(plate.path))throw Error('Stage60 far path');
    const r=await G.fetch(u.href,{redirect:'error',credentials:'omit',signal:ctrl.signal});if(!r.ok||r.url!==u.href)throw Error('Stage60 far response');
    const bytes=await r.arrayBuffer();if(bytes.byteLength!==plate.bytes||await sha(G,bytes)!==plate.sha)throw Error('Stage60 far digest');
    let image;
    if(decode)image=await decode(bytes);
    else {const url=G.URL.createObjectURL(new G.Blob([bytes],{type:'image/webp'}));
     image=new G.Image();try{image.src=url;await image.decode();}finally{G.URL.revokeObjectURL(url);}}
    if((image.naturalWidth??image.width)!==plate.w||(image.naturalHeight??image.height)!==plate.h)throw Error('Stage60 far resolved dimensions');
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
    if(mode==='matte')c.globalAlpha=.60;
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
  s.background=draw;used.add(s);
  return Object.freeze({ready,observe:()=>!stopped&&live()&&last?structuredClone(last):null,dispose(){
   stopped=true;ctrl.abort();cached=null;if(s.background===draw)s.background=base;used.delete(s);
  }});
 }
 return Object.freeze({mount});
}
