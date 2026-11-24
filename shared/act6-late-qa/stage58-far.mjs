import {plate58} from './stage58-far-data.mjs';
export function mountStage58Far(G,app,e,scene,authorize){
 const b=e?.b;
 if(b?.honroStage!==58||b.honroAuthoredId!=='stage-58'||app.stageId!==58||app.scene!==scene||app.engine!==e||app.debugMode||app.customMap||
    typeof scene?.background!=='function'||!authorize()||!G.location?.origin||!G.crypto?.subtle)return null;
 const base=scene.background,abort=new G.AbortController();let img=null,disposed=false;
 const current=()=>!disposed&&app.scene===scene&&app.engine===e&&e.b===b&&app.stageId===58&&b.honroStage===58&&b.honroAuthoredId==='stage-58'&&!app.debugMode&&!app.customMap&&authorize();
 const clamp=(v,l,h)=>Math.min(h,Math.max(l,v));
 async function load(){
  try{
   const origin=G.location.origin;
   // Resolve from normal HONRO.html or its project Pages subpath, not from
   // a separately hosted CDN or a replacement stage URL.
   const url=new G.URL('.'+plate58.path,G.location.href);
   if(url.origin!==origin||!url.pathname.endsWith(plate58.path)||url.search||url.hash) return false;
   const res=await G.fetch(url.href,{credentials:'omit',redirect:'error',signal:abort.signal});
   if(!res.ok||res.url!==url.href)return false;
   const raw=await res.arrayBuffer();
   if(raw.byteLength!==plate58.bytes||!current())return false;
   const sha=Array.from(new Uint8Array(await G.crypto.subtle.digest('SHA-256',raw)),v=>v.toString(16).padStart(2,'0')).join('');
   if(sha!==plate58.sha||!current())return false;
   const obj=G.URL.createObjectURL(new G.Blob([raw],{type:plate58.mime})),im=new G.Image();
   try{im.src=obj;await im.decode();}finally{G.URL.revokeObjectURL(obj);}
   if(im.naturalWidth!==plate58.w||im.naturalHeight!==plate58.h||!current())return false;
   img=im;return true;
  }catch{return false;}
 }
 function render(ctx,w,h,active){
  if(active!==b||!current()||!img)return base.apply(this,arguments);
  const raw=G.HonroVisualStyle?.raw?.(ctx)??ctx;
  const z=Math.max(w/plate58.w,h/plate58.h)*1.018,iw=plate58.w*z,ih=plate58.h*z;
  // Keep the paired inverted roof silhouettes and central suspended line
  // inside the portrait field. Wide uses the line as the vertical center.
  const anchorX=clamp(.51+.10*((scene.x-3900)/7200),.43,.59);
  const anchorY=clamp(.45+.08*((scene.y-3100)/3600),.41,.49);
  raw.save();
  raw.fillStyle='#181923';raw.fillRect(0,0,w,h);
  raw.drawImage(img,-(iw-w)*anchorX,-(ih-h)*anchorY,iw,ih);
  raw.fillStyle='rgba(17,19,29,0.18)';raw.fillRect(0,0,w,h);
  raw.restore();
  this.environmentStats={groups:0,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0,authoredFar:[plate58.sha]};
 }
 scene.background=render;
 return Object.freeze({ready:load(),dispose(){disposed=true;abort.abort();img=null;if(scene.background===render)scene.background=base;}});
}
