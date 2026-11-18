(function(G){'use strict';
// Stage 32 only. Original 25 path geometries/order remain verbatim. The limited
// non-walk band (source y780..904) transitions pale/green to the existing material.
// Research: bounded native supersample RGB correction only in nonwalk world1420..1716.
// Source geometry, grass fills and original clips/order remain unchanged.
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
// Research-only device-space supersampling. No source geometry modifications.
const SS=2,MAX_SS_PIXELS=1024*1024;
let ssCanvas=null,lowMaskCanvas=null;
const ssStats={calls:0,stripes:0,emptyStripes:0,highRasterStripes:0,eligibilityScanPixels:0,eligible:0,corrected:0,opaqueGrassSkipped:0,protectedPaletteSkipped:0,roadSkipped:0,subpixelRoadSkipped:0,unresolvedHolesSkipped:0,alphaChanged:0,skips:0,allocations:0,resizes:0,scratchBytes:0,peakLogicalBytes:0,readbackBytes:0,ms:0,factor:SS};
function boxMean(data,width,x,y,n){let sa=0,sr=0,sg=0,sb=0;for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=((y*n+j)*width+x*n+i)*4,a=data[k+3];sa+=a;sr+=data[k]*a;sg+=data[k+1]*a;sb+=data[k+2]*a;}return{r:sa?sr/sa:0,g:sa?sg/sa:0,b:sa?sb/sa:0,a:sa/(n*n),sumAlpha:sa};}
function sized(cv,w,h){if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>MAX_SS_PIXELS)throw Error('Supersample scratch bounds');if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;ssStats.resizes++;}if(cv.width!==w||cv.height!==h)throw Error('Supersample resize mismatch');}
function coherentColor(c,cv,q){
 const m=c.getTransform(),world=m.d/2.2;
 if(m.b||m.c||m.a<=0||m.d<=0||c.globalAlpha!==1||c.globalCompositeOperation!=='source-over'||c.filter&&c.filter!=='none'||c.shadowBlur||c.shadowOffsetX||c.shadowOffsetY)return;
 const y0=Math.max(0,Math.ceil(world*1420+m.f)),y1=Math.min(c.canvas.height,Math.floor(world*1716+m.f)),w=c.canvas.width,h=y1-y0;
 if(h<=0)return;if(!Number.isInteger(w)||w<1||w*h>MAX_SS_PIXELS||w*SS>MAX_SS_PIXELS){ssStats.skips++;return;}
 const start=G.performance.now();ssStats.calls++;
 if(!ssCanvas){ssCanvas=G.document.createElement('canvas');lowMaskCanvas=G.document.createElement('canvas');ssStats.allocations+=2;}
 sized(lowMaskCanvas,w,h);const low=lowMaskCanvas.getContext('2d');low.setTransform(1,0,0,1,0,0);low.globalAlpha=1;low.globalCompositeOperation='copy';low.fillStyle='#000';low.fillRect(0,0,w,h);low.globalCompositeOperation='source-over';low.setTransform(m.a/2.2,0,0,m.d/2.2,m.e,m.f-y0);low.save();low.clip(q.apron);low.scale(2.2,2.2);
 for(const p of q.paths){low.fillStyle=p.sourceIndex>=21?'#00ffff':p.sourceIndex>=12&&p.sourceIndex<=17?'#ff00ff':'#0000ff';low.fill(p.path,p.rule);}low.restore();
 const packed=low.getImageData(0,0,w,h).data,old=c.getImageData(0,y0,w,h),data=old.data,field=cv.getContext('2d').getImageData(0,y0,w,h).data;
 if(packed.length!==4*w*h||data.length!==4*w*h||field.length!==4*w*h)throw Error('Supersample low readback dimensions');
 const protectedColors=q.paths.filter(p=>p.sourceIndex>=12&&p.sourceIndex<=17||p.sourceIndex>=21).map(p=>{const h=p.fill.slice(1);return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));});
 const maxHighPixels=Math.min(MAX_SS_PIXELS,Math.floor((24*1024*1024-16*w*h)/12)),rows=Math.min(h,Math.floor(maxHighPixels/(w*SS*SS)));if(rows<1)throw Error('Supersample minimum stripe cannot fit');
 for(let sy=0;sy<h;sy+=rows){const count=Math.min(rows,h-sy),hw=w*SS,hh=count*SS;sized(ssCanvas,hw,hh);ssStats.stripes++;const hi=ssCanvas.getContext('2d');
  // Test-only optimization: preserve all low reads, canvas dimensions and final
  // putImageData roundtrip. Skip only high raster/readback if no RGB can change.
  let anyEligible=false;
  for(let y=0;y<count&&!anyEligible;y++)for(let x=0;x<w;x++){
   const k=((sy+y)*w+x)*4;ssStats.eligibilityScanPixels++;
   if(!packed[k]||packed[k]===255||packed[k+1]||packed[k+2]!==255||data[k+3]!==255||field[k+3]!==255)continue;
   if(protectedColors.some(v=>v[0]===data[k]&&v[1]===data[k+1]&&v[2]===data[k+2]))continue;
   anyEligible=true;break;
  }
  if(!anyEligible){
   ssStats.emptyStripes++;
   // Preserve diagnostic counts for each skipped original low-pixel branch.
   for(let y=0;y<count;y++)for(let x=0;x<w;x++){
    const k=((sy+y)*w+x)*4;if(!packed[k])continue;
    if(packed[k]===255){ssStats.opaqueGrassSkipped++;continue;}
    if(packed[k+1]){ssStats.roadSkipped++;continue;}
    if(packed[k+2]!==255||data[k+3]!==255||field[k+3]!==255)continue;
    if(protectedColors.some(v=>v[0]===data[k]&&v[1]===data[k+1]&&v[2]===data[k+2]))ssStats.protectedPaletteSkipped++;
   }
   ssStats.scratchBytes=(hw*hh+w*h)*4;ssStats.readbackBytes=3*w*h*4;
   ssStats.peakLogicalBytes=Math.max(ssStats.peakLogicalBytes,ssStats.scratchBytes+ssStats.readbackBytes);
   if(ssStats.peakLogicalBytes>24*1024*1024)throw Error('Supersample logical memory bound');
   continue;
  }
  ssStats.highRasterStripes++;

  function reset(){hi.setTransform(1,0,0,1,0,0);hi.globalAlpha=1;hi.globalCompositeOperation='source-over';hi.clearRect(0,0,hw,hh);hi.imageSmoothingEnabled=false;hi.setTransform(m.a/2.2*SS,0,0,m.d/2.2*SS,m.e*SS,(m.f-y0-sy)*SS);hi.save();hi.clip(q.apron);hi.scale(2.2,2.2);}
  reset();for(const p of q.paths){if(p.protected){hi.fillStyle=p.fill;hi.fill(p.path,p.rule);}else{hi.save();hi.clip(p.path,p.rule);hi.save();hi.setTransform(1,0,0,1,0,0);hi.drawImage(cv,0,y0+sy,w,count,0,0,hw,hh);hi.restore();if(p.gray){hi.fillStyle=p.fill;hi.fill(p.gray,p.rule);}hi.restore();}}hi.restore();
  const colors=hi.getImageData(0,0,hw,hh).data;
  reset();for(const p of q.paths){hi.fillStyle=p.sourceIndex>=21?'#00ff00':p.sourceIndex>=12&&p.sourceIndex<=17?'#ff0000':'#000';hi.fill(p.path,p.rule);}hi.restore();const labels=hi.getImageData(0,0,hw,hh).data;
  if(colors.length!==hw*hh*4||labels.length!==hw*hh*4)throw Error('Supersample high readback dimensions');
  ssStats.scratchBytes=(hw*hh+w*h)*4;ssStats.readbackBytes=(2*hw*hh+3*w*h)*4;ssStats.peakLogicalBytes=Math.max(ssStats.peakLogicalBytes,ssStats.scratchBytes+ssStats.readbackBytes);if(ssStats.peakLogicalBytes>24*1024*1024)throw Error('Supersample logical memory bound');
  for(let y=0;y<count;y++)for(let x=0;x<w;x++){const k=((sy+y)*w+x)*4;if(!packed[k])continue;if(packed[k]===255){ssStats.opaqueGrassSkipped++;continue;}if(packed[k+1]){ssStats.roadSkipped++;continue;}if(packed[k+2]!==255||data[k+3]!==255||field[k+3]!==255)continue;if(protectedColors.some(v=>v[0]===data[k]&&v[1]===data[k+1]&&v[2]===data[k+2])){ssStats.protectedPaletteSkipped++;continue;}ssStats.eligible++;
   const label=boxMean(labels,hw,x,y,SS),color=boxMean(colors,hw,x,y,SS);if(label.sumAlpha!==255*SS*SS||color.sumAlpha!==255*SS*SS){ssStats.unresolvedHolesSkipped++;continue;}if(label.g>0){ssStats.subpixelRoadSkipped++;continue;}if(packed[k]<=label.r+1)continue;
   const wy=(sy+y+y0+.5-m.f)/world,t=Math.max(0,Math.min(1,(wy-1420)/40)),weight=t*t*(3-2*t),rgb=[color.r,color.g,color.b].map((v,j)=>Math.round(data[k+j]+weight*(Math.round(v)-data[k+j])));if(rgb.some((v,j)=>v!==data[k+j])){for(let j=0;j<3;j++)data[k+j]=rgb[j];ssStats.corrected++;}
  }
 }
 c.putImageData(old,0,y0);ssStats.ms+=G.performance.now()-start;
}

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
   if(!originalContext)coherentColor(c,cv,q);
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
G.HonroStage32FoundationArt={draw,stats:()=>({...counters,supersample:{...ssStats,maxScratchPixels:MAX_SS_PIXELS,scope:"Logical canvas and live readback payload only; not total JS/native/GPU heap"},maxPixels:MAX_PIXELS,transition:{...transitionCounters,maxPixels:MAX_TRANSITION_PIXELS,bufferDimensions:[transitionWork,transitionColor,transitionBody].map(c=>c?[c.width,c.height]:null)},totalLogicalBytes:counters.bytes+transitionCounters.bytes+ssStats.scratchBytes}),clear:()=>{for(const cv of [ssCanvas,lowMaskCanvas])if(cv){cv.width=1;cv.height=1;}ssStats.scratchBytes=ssCanvas?8:0;ssStats.readbackBytes=0;last=null;if(buffer){buffer.width=1;buffer.height=1;}counters.bytes=buffer?4:0;for(const cv of [transitionWork,transitionColor,transitionBody])if(cv){cv.width=1;cv.height=1;}transitionMemory();}};
})(globalThis);

