const own=(a,k)=>Object.hasOwn(a??{},k);
const digest=async(G,raw)=>Array.from(new Uint8Array(await G.crypto.subtle.digest('SHA-256',raw)),v=>v.toString(16).padStart(2,'0')).join('');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const supported=id=>Number.isInteger(id)&&id>=51&&id<=57;
export function createStageFar({G=globalThis,manifest,authorize,decode,resolveAsset=(path)=>path,onError=()=>{}}={}){
 if(manifest?.schema!=='honro-act6-stagefar-51-57/v1'||typeof authorize!=='function')throw TypeError('Act6 Far Art owner is required');
 const rows=structuredClone(manifest.rows), states=new WeakMap();
 async function decodeExact(raw,plate){
  if(decode)return decode(raw,plate); // private test or caller-supplied platform decoder
  const img=new G.Image(), obj=G.URL.createObjectURL(new G.Blob([raw],{type:plate.mime}));
  try{img.src=obj;await img.decode();return img;}finally{G.URL.revokeObjectURL(obj);}
 }
 function mount({app,engine:e,scene,lease}){
  const id=app?.stageId, b=e?.b, row=rows[id];
  if(!supported(id)||!b||b.honroStage!==id||app.engine!==e||app.scene!==scene||app.customMap||app.debugMode||!row||states.has(scene)||typeof scene?.background!=='function'||
    !authorize(app,e,scene,lease))return null;
  const origin=G.location?.origin, base=scene.background, control=new G.AbortController(), ready=new Map(), errors=new Set();let disposed=false, frame=null;
  if(!origin||!G.crypto?.subtle||!row.plates.wide)return null;
  const current=()=>!disposed&&app.engine===e&&e.b===b&&app.scene===scene&&app.stageId===id&&b.honroStage===id&&
    !app.customMap&&!app.debugMode&&authorize(app,e,scene,lease);
  async function load(kind,plate){
   try{
    if(plate.stage!==id||typeof plate.path!=='string'||!plate.path.startsWith('/web/graphics/act6-far-'+id+'-'+kind+'.')||
      !/^[a-f0-9]{64}$/.test(plate.sha)||!plate.path.includes('.'+plate.sha.slice(0,16)+'.')||
      !['image/png','image/webp'].includes(plate.mime)||!Array.isArray(plate.focus)||plate.focus.length!==2||
      !Number.isInteger(plate.w)||!Number.isInteger(plate.h)||plate.w<100||plate.h<100||
      !Number.isInteger(plate.bytes)||plate.bytes>3355443)throw Error('Far plate metadata mismatch');
    const u=new G.URL(resolveAsset(plate.path),origin);if(u.origin!==origin||!u.pathname.endsWith(plate.path)||u.search||u.hash)throw Error('Far plate origin mismatch');
    const r=await G.fetch(u.href,{credentials:'omit',redirect:'error',signal:control.signal});
    if(!r.ok||r.url!==u.href)throw Error('Far plate response mismatch');
    const raw=await r.arrayBuffer();
    if(raw.byteLength!==plate.bytes||await digest(G,raw)!==plate.sha||!current())throw Error('Far plate bytes lost or unowned');
    const img=await decodeExact(raw,plate);
    if((img.naturalWidth??img.width)!==plate.w||(img.naturalHeight??img.height)!==plate.h||!current())throw Error('Far plate dimensions lost or unowned');
    ready.set(kind,{img,plate});return true;
   }catch(error){if(current()){errors.add(kind);onError(error,id,kind);}return false;}
  }
  const pass=kind=>ready.has(kind)?ready.get(kind):null;
  function backdrop(ctx,w,h,active){
   if(active!==b||!current())return base.apply(this,arguments);
   const raw=G.HonroVisualStyle?.raw?.(ctx)??ctx, portrait=w/h<.82, kind=portrait&&own(row.plates,'portrait')?'portrait':'wide', selected=pass(kind);
   const matte=(!portrait&&id===51), sky=matte?'#1a202a':row.sky;
   raw.save();raw.fillStyle=sky;raw.fillRect(0,0,w,h);
   if(selected){
    const {plate,img}=selected, z=(matte?w/plate.w:Math.max(w/plate.w,h/plate.h))*1.018, width=plate.w*z,height=plate.h*z;
    const dx=clamp((scene.x-(b.width??1)/2)/Math.max(1,b.width??1),-.55,.55);
    const dy=clamp((scene.y-(b.height??1)/2)/Math.max(1,b.height??1),-.55,.55);
    const fX=clamp(plate.focus[0]+dx*(portrait?.10:.18),.08,.92), fY=clamp(plate.focus[1]+dy*(portrait?.09:.14),.08,.92);
    const x=-(width-w)*fX,y=matte?Math.min(0,dy*h*.025):-(height-h)*fY;
    raw.drawImage(img,x,y,width,height);
    if(matte){
     const inky=raw.createLinearGradient(0,y,0,y+height);
     inky.addColorStop(0,'rgba(26,32,42,.40)');inky.addColorStop(.13,'rgba(26,32,42,0)');inky.addColorStop(.77,'rgba(26,32,42,0)');inky.addColorStop(1,sky);
     raw.fillStyle=inky;raw.fillRect(0,y,w,height+.5);
    }
    const left=Math.max(0,-x/z), top=Math.max(0,-y/z);
    frame={stage:id,key:kind,sha:plate.sha,sourceWindow:[left,top,Math.min(plate.w-left,w/z),Math.min(plate.h-top,h/z)],mode:matte?'full-span-sky-matte':'cover',w,h};
   }else frame={stage:id,key:kind,waiting:!errors.has(kind),blocked:errors.has(kind),w,h};
   raw.restore();
   this.environmentStats={groups:0,visibleAssets:selected?1:0,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0,authoredFar:selected?[selected.plate.sha]:[]};
  }
  scene.background=backdrop;states.set(scene,lease);
  const pending=Promise.all(Object.entries(row.plates).map(([k,p])=>load(k,p)));
  return Object.freeze({ready:pending,observe:()=>current()&&frame?structuredClone(frame):null,dispose(){
    disposed=true;control.abort();ready.clear();if(scene.background===backdrop)scene.background=base;states.delete(scene);
  }});
 }
 return Object.freeze({mount});
}
