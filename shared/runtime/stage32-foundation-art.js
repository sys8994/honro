(function(G){'use strict';
// Stage 32 only. Original 25 path geometries/order remain verbatim. The limited
// non-walk band (source y780..904) transitions pale/green to the existing material.
// Roads and world y<=1700 retain the original BODY rendering. Not a general blur.
// Rasterize one shared world-coordinate material into the current device plane;
// every geology clip then samples the same bitmap without repeated vector AA.
if(G.HonroStage32FoundationArt)return;
const FOUNDATION='act4-handoff:32:foundation',BODY='act4-handoff:32:body-shared-material';
const MAX_PIXELS=8*1024*1024,prepared=new WeakMap();
const MAX_TRANSITION_PIXELS=1024*1024;
let buffer=null,bufferContext=null,last=null;
let transitionWork=null,transitionColor=null,transitionBody=null;
const transitionCounters={fills:0,passes:0,boundaryPasses:0,allocations:0,resizes:0,bytes:0,peakBytes:0,skips:0,lastSkip:null};
function transitionMemory(){
 transitionCounters.bytes=[transitionWork,transitionColor,transitionBody].reduce((n,c)=>n+(c?c.width*c.height*4:0),0);
 transitionCounters.peakBytes=Math.max(transitionCounters.peakBytes,transitionCounters.bytes);
}
function transitionCanvas(){
 const cv=G.document?.createElement?.('canvas');if(!cv||!cv.getContext('2d'))return null;
 cv.width=1;cv.height=1;transitionCounters.allocations++;return cv;
}
function resizeTransition(cv,w,h){
 if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;transitionCounters.resizes++;transitionMemory();}
}
function canTransition(c,l){
 const m=c.getTransform(),w=c.canvas.width,h=c.canvas.height;
 let reason=null;
 if(m.b!==0||m.c!==0||m.a<=0||m.d<=0)reason='non-axis-aligned';
 else if(c.globalAlpha!==1||(l.opacity??1)!==1||c.globalCompositeOperation!=='source-over'||c.filter&&c.filter!=='none'||c.shadowBlur||c.shadowOffsetX||c.shadowOffsetY)reason='paint-state';
 else if(w*h>MAX_TRANSITION_PIXELS)reason='transition-pixel-cap';
 else if(!G.document?.createElement)reason='canvas-unavailable';
 if(!reason){
  transitionWork??=transitionCanvas();transitionColor??=transitionCanvas();transitionBody??=transitionCanvas();
  if(!transitionWork||!transitionColor||!transitionBody)reason='canvas-unavailable';transitionMemory();
 }
 if(reason){transitionCounters.skips++;transitionCounters.lastSkip=reason;return false;}
 return true;
}
const counters={rasterizations:0,hits:0,allocations:0,resizes:0,bytes:0,peakBytes:0,fallbacks:0,lastFallback:null};
const d=n=>typeof n.d==='string'?n.d:Array.isArray(n.dParts)?n.dParts.join(''):null;
function fallback(reason){counters.fallbacks++;counters.lastFallback=reason;return false;}
function geometry(asset){
 if(prepared.has(asset))return prepared.get(asset);
 const q={};
 if(asset.id===FOUNDATION){
  const v=asset.vector,r=v?.root,g=r?.children?.[0],field=g?.children?.[0];
  if(asset.params?.stage32SharedMaterial!==1||r?.transform?.join(',')!=='7.2,0,0,7.2,0,0'||g?.clipPath!=='source-alpha-silhouette'||!field?.transform||!field.children?.length)return null;
  q.silhouette=new G.Path2D(v.clips[g.clipPath].join(''));
  q.fieldTransform=field.transform;
  q.field=field.children.map(n=>({path:new G.Path2D(d(n)),fill:n.fill}));
 }else{
  const cfg=asset.params?.stage32SharedMaterial;
  if(cfg?.version!==1||cfg.bodyScale!==2.2||!Array.isArray(cfg.protectedPaths))return null;
  const nodes=[];function walk(n){if(n.tag==='path')nodes.push(n);for(const child of n.children||[])walk(child);}walk(asset.vector.root);
  if(nodes.length!==25||cfg.sourcePathSHA256?.length!==25||!asset.vector.clips?.portApron)return null;
  q.apron=new G.Path2D(asset.vector.clips.portApron.join(''));
  const protect=new Set(cfg.protectedPaths);
  q.paths=nodes.map((n,i)=>{
   const path=d(n),indices=cfg.graySubpaths?.[i],subs=indices?path.match(/[Mm][^Mm]*/g):null;
   if(indices?.some(j=>!Number.isInteger(j)||!subs[j]))throw Error('Invalid Stage 32 original subpath index');
   return {sourceIndex:i,path:new G.Path2D(path),fill:n.fill,rule:n.fillRule||'nonzero',protected:protect.has(i),gray:indices?new G.Path2D(indices.map(j=>subs[j]).join('')):null};
  });
 }
 prepared.set(asset,q);return q;
}
function material(c,asset){
 const w=c.canvas?.width,h=c.canvas?.height,m=c.getTransform();
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>MAX_PIXELS)return null;
 const matrix=[m.a,m.b,m.c,m.d,m.e,m.f];if(matrix.some(v=>!Number.isFinite(v)))return null;
 const style=G.HonroVisualStyle?.key?.()||'',key=[w,h,...matrix,style].join('|');
 if(last?.context===c&&last.asset===asset&&last.key===key){counters.hits++;return buffer;}
 if(!buffer){buffer=typeof G.OffscreenCanvas==='function'?new G.OffscreenCanvas(w,h):G.document?.createElement('canvas');if(!buffer)return null;counters.allocations++;}
 if(buffer.width!==w||buffer.height!==h){buffer.width=w;buffer.height=h;counters.resizes++;}
 bufferContext=buffer.getContext('2d');if(!bufferContext)return null;
 const q=geometry(asset);if(!q)return null;
 const cc=bufferContext;cc.setTransform(1,0,0,1,0,0);cc.globalAlpha=1;cc.globalCompositeOperation='source-over';cc.filter='none';cc.clearRect(0,0,w,h);
 cc.setTransform(...matrix);cc.translate(-5500,-1950);cc.scale(7.2,7.2);cc.transform(...q.fieldTransform);
 for(const n of q.field){cc.fillStyle=n.fill;cc.fill(n.path);}
 counters.rasterizations++;counters.bytes=w*h*4;counters.peakBytes=Math.max(counters.peakBytes,counters.bytes);
 last={context:c,asset,key};return buffer;
}
function bitmap(c,cv){c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0);c.restore();}
function draw(c,l,b,originalOnly=false){
 const id=l?.asset?.id;
 if(b?.honroStage!==32||b?.honroCustom||![FOUNDATION,BODY].includes(id))return false;
 if((l.scale??1)!==1||(l.rotation??0)!==0||l.x!==(id===FOUNDATION?-5500:0)||l.y!==(id===FOUNDATION?-1950:0))return fallback('unexpected-placement');
 // The compiler clones providers into battle landmarks. Share that exact
 // resolved field object across foundation/BODY passes, not the library copy.
 const field=id===FOUNDATION?l.asset:(b.honroLandmarks?.find(v=>v.asset?.id===FOUNDATION)?.asset||G.HONRO_PROJECT?.library?.find(a=>a.id===FOUNDATION));
 if(!field)return fallback('missing-field');
 let q,cv;try{q=geometry(l.asset);cv=q&&material(c,field);}catch{return fallback('invalid-source');}
 if(!q||!cv)return fallback('invalid-source-or-device-pixel-cap');
 const transition=id===BODY&&!originalOnly&&canTransition(c,l);
 let originalContext=null,stagedCanvas=null;
 const threshold=c.getTransform().d*1716+c.getTransform().f;
 if(id===BODY&&transition&&threshold>0&&threshold<c.canvas.height){
  originalContext=c;const matrix=c.getTransform();
  stagedCanvas=transitionBody;resizeTransition(stagedCanvas,c.canvas.width,c.canvas.height);transitionCounters.boundaryPasses++;
  const next=stagedCanvas.getContext('2d');next.setTransform(1,0,0,1,0,0);next.globalAlpha=1;next.globalCompositeOperation='copy';next.drawImage(c.canvas,0,0);next.globalCompositeOperation='source-over';next.setTransform(matrix);next.globalAlpha=c.globalAlpha;c=next;
 }
 if(transition)transitionCounters.passes++;
 c.save();try{
  // Only the alternate boundary-tile pass is clipped. Its upper rows are never
  // published; the original BODY pass below still paints the real context fully.
  if(originalContext){const matrix=c.getTransform(),split=Math.floor(threshold);c.setTransform(1,0,0,1,0,0);c.beginPath();c.rect(0,split,c.canvas.width,c.canvas.height-split);c.clip();c.setTransform(matrix);}
  c.globalAlpha*=(l.opacity??1);
  if(id===FOUNDATION){c.translate(l.x,l.y);c.scale(7.2,7.2);c.clip(q.silhouette);bitmap(c,cv);}
  else{
   c.clip(q.apron);c.scale(2.2,2.2);
   let transitionMaskReady=false; // draw-local: identical material ROI/gradient for every protected fill
   for(const n of q.paths){
    if(n.protected){
  if(!transition||n.sourceIndex>=21){c.fillStyle=n.fill;c.fill(n.path,n.rule);continue;}
  // Original path/order is unchanged. No geometry erasure.
  // Source y780 = world1716, below the lowest actual route at world1342.
  const m=c.getTransform(),inv=m.inverse();if(m.b!==0||m.c!==0||m.d<=0)throw Error('Unexpected tile transform');
  const split=Math.max(0,Math.min(cv.height,Math.floor(m.d*780+m.f)));
  if(split===cv.height){c.fillStyle=n.fill;c.fill(n.path,n.rule);continue;}
  if(split>0){c.save();c.setTransform(1,0,0,1,0,0);c.beginPath();c.rect(0,0,cv.width,split);c.clip();c.setTransform(m);c.fillStyle=n.fill;c.fill(n.path,n.rule);c.restore();}
  const y0=Math.max(0,Math.floor(m.d*780+m.f)-2),y1=Math.min(cv.height,Math.ceil(m.d*904+m.f)+2),bandHeight=y1-y0;
  if(bandHeight<=0){c.fillStyle=n.fill;c.fill(n.path,n.rule);continue;}
  const work=transitionWork,color=transitionColor;
  resizeTransition(work,cv.width,bandHeight);resizeTransition(color,cv.width,bandHeight);
  const wc=work.getContext('2d'),cc=color.getContext('2d');
  if(!transitionMaskReady){
  wc.setTransform(1,0,0,1,0,0);wc.globalAlpha=1;wc.globalCompositeOperation='copy';wc.drawImage(cv,0,y0,cv.width,bandHeight,0,0,cv.width,bandHeight);
  wc.globalCompositeOperation='destination-in';wc.setTransform(m.a,m.b,m.c,m.d,m.e,m.f-y0);
  const g=wc.createLinearGradient(0,780,0,900);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.25,'rgba(255,255,255,.15625)');g.addColorStop(.5,'rgba(255,255,255,.5)');g.addColorStop(.75,'rgba(255,255,255,.84375)');g.addColorStop(1,'rgba(255,255,255,1)');wc.fillStyle=g;wc.fillRect(-1000000,-1000000,2000000,2000000);transitionMaskReady=true;
  }
  cc.setTransform(1,0,0,1,0,0);cc.globalAlpha=1;cc.globalCompositeOperation='copy';cc.fillStyle=n.fill;cc.fillRect(0,0,cv.width,bandHeight);cc.globalCompositeOperation='source-over';cc.drawImage(work,0,0);
  const pattern=c.createPattern(color,'no-repeat');if(!pattern)throw Error('Missing transition pattern');pattern.setTransform(inv.translate(0,y0));
  c.save();c.setTransform(1,0,0,1,0,0);c.beginPath();c.rect(0,split,cv.width,cv.height-split);c.clip();c.setTransform(m);c.fillStyle=pattern;c.fill(n.path,n.rule);c.restore();transitionCounters.fills++;continue;
 }
    c.save();c.clip(n.path,n.rule);bitmap(c,cv);
    if(n.gray){c.fillStyle=n.fill;c.fill(n.gray,n.rule);}c.restore();
   }
  }
 }finally{c.restore();}
 if(originalContext){
  // Preserve the original BODY pass exactly above the approved non-walk band.
  // The alternate pass is staged independently; only integer lower rows publish.
  const matrix=originalContext.getTransform(),split=Math.max(0,Math.min(stagedCanvas.height,Math.floor(matrix.d*1716+matrix.f)));
  draw(originalContext,l,b,true);
  if(split<stagedCanvas.height){originalContext.save();originalContext.setTransform(1,0,0,1,0,0);originalContext.globalAlpha=1;originalContext.globalCompositeOperation='source-over';originalContext.beginPath();originalContext.rect(0,split,stagedCanvas.width,stagedCanvas.height-split);originalContext.clip();originalContext.drawImage(stagedCanvas,0,0);originalContext.restore();}
 }
 return true;
}
G.HonroStage32FoundationArt={draw,stats:()=>({...counters,maxPixels:MAX_PIXELS,transition:{...transitionCounters,maxPixels:MAX_TRANSITION_PIXELS,bufferDimensions:[transitionWork,transitionColor,transitionBody].map(c=>c?[c.width,c.height]:null)},totalLogicalBytes:counters.bytes+transitionCounters.bytes}),clear:()=>{last=null;if(buffer){buffer.width=1;buffer.height=1;}counters.bytes=buffer?4:0;for(const cv of [transitionWork,transitionColor,transitionBody])if(cv){cv.width=1;cv.height=1;}transitionMemory();}};
})(globalThis);

