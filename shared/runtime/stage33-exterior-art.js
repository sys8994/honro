(function(G){'use strict';
if(G.HonroStage33ExteriorArt)return;
const MARKER='act4-sideview:33:exterior-v3:composite',FIELD='act4-sideview:33:exterior-v3:field',IDS=['act4-sideview:33:coastal-v2:west-continuous-geology','act4-sideview:33:coastal-v2:lowland'];
const MAX_PIXELS=8*1024*1024,BX=14000/1983,BY=5600/793,A=43/67.52,B=200-200*A,SPLIT=-300+200*BY;
let buffer=null,last=null;
const counters={allocations:0,rasterizations:0,hits:0,bytes:0,peakBytes:0,fallbacks:0,directCoreDraws:0,fullCoreDraws:0,reasons:{}};
const instance={x:0,y:0,scale:1,rotation:0};
function find(b,id){return b?.honroLandmarks?.find(l=>l.asset?.id===id)?.asset||G.HONRO_PROJECT?.library?.find(a=>a.id===id);}
function fallback(c,sources,reason){counters.fallbacks++;counters.reasons[reason]=(counters.reasons[reason]||0)+1;for(const a of sources)if(a?.vector)G.HonroVectorArt.draw(c,a,instance);return true;}
// World-axis affine covector, not endpoint-transform approximation (shear-safe).
function mask(c,m,axis,start,end,w,h){
 const det=m.a*m.d-m.b*m.c,ux=axis==='x'?m.d/det:-m.b/det,uy=axis==='x'?-m.c/det:m.a/det;
 const offset=-(ux*m.e+uy*m.f),n=ux*ux+uy*uy;
 const t0=(start-offset)/n,t1=(end-offset)/n;
 c.setTransform(1,0,0,1,0,0);const g=c.createLinearGradient(ux*t0,uy*t0,ux*t1,uy*t1);
 g.addColorStop(0,axis==='x'?'#ffffff00':'#ffffffff');g.addColorStop(1,axis==='x'?'#ffffffff':'#ffffff00');
 c.globalCompositeOperation='destination-in';c.fillStyle=g;c.fillRect(0,0,w,h);
}
function prepare(c,sources){
 const w=c.canvas?.width,h=c.canvas?.height,m=c.getTransform(),matrix=[m.a,m.b,m.c,m.d,m.e,m.f];
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>MAX_PIXELS)return {error:'device-pixel-cap'};
 if(matrix.some(v=>!Number.isFinite(v))||Math.abs(m.a*m.d-m.b*m.c)<1e-15)return {error:'invalid-transform'};
 const key=[w,h,...matrix,G.HonroVisualStyle?.key?.()||''].join('|');
 if(last?.context===c&&last.key===key&&sources.every((v,i)=>v===last.sources[i])){counters.hits++;return {canvas:buffer};}
 if(!buffer){buffer=typeof G.OffscreenCanvas==='function'?new G.OffscreenCanvas(w,h):G.document?.createElement('canvas');if(!buffer)return {error:'no-canvas'};counters.allocations++;}
 if(buffer.width!==w||buffer.height!==h){buffer.width=w;buffer.height=h;}
 const cc=buffer.getContext('2d');if(!cc)return {error:'no-context'};
 cc.setTransform(1,0,0,1,0,0);cc.globalAlpha=1;cc.globalCompositeOperation='source-over';cc.filter='none';cc.clearRect(0,0,w,h);cc.setTransform(...matrix);
 // The two original providers are isolated together in original order. Only
 // the resulting composite is masked; overlapping original paint is not faded twice.
 for(const a of sources)G.HonroVectorArt.draw(cc,a,instance);
 mask(cc,m,'x',-3300,-3000,w,h);mask(cc,m,'y',5100,5300,w,h);
 cc.globalCompositeOperation='source-over';last={context:c,key,sources:[...sources]};counters.rasterizations++;
 counters.bytes=w*h*4;counters.peakBytes=Math.max(counters.peakBytes,counters.bytes);return {canvas:buffer};
}
function exterior(c,field){
 const inv=field.params.registration.newBandInverseAffine;
 for(const ridge of [true,false]){
  c.save();try{
   c.beginPath();
   if(ridge)c.rect(-100000,-100000,97000,SPLIT+100000);
   else{c.moveTo(-100000,SPLIT);c.lineTo(-3000,SPLIT);c.lineTo(-3000,5100);c.lineTo(10700,5100);c.lineTo(10700,100000);c.lineTo(-100000,100000);c.closePath();}
   // Left-below and bottom share one identical transform; their union has no
   // internal antialiased clip seam or double-painted corner.
   c.clip();c.translate(-3300,-300);c.scale(BX,BY);if(ridge)c.transform(1,0,0,A,0,B);c.transform(...inv);G.HonroVectorArt.draw(c,field,instance);
  }finally{c.restore();}
 }
}
// Partition only axis-aligned positive device transforms. Every partition
// edge is an integer device coordinate, avoiding a fractional clip AA seam.
function coreRect(c){
 const m=c.getTransform(),w=c.canvas?.width,h=c.canvas?.height;
 if(m.b!==0||m.c!==0||!(m.a>0&&m.d>0)||![m.a,m.d,m.e,m.f,w,h].every(Number.isFinite))return null;
 const left=Math.max(0,Math.min(w,Math.ceil(m.a*-3000+m.e))),bottom=Math.max(0,Math.min(h,Math.floor(m.d*5100+m.f)));
 return left<w&&bottom>0?{left,bottom,w,h,m}:null;
}
function coreClip(c,r,outside){
 c.setTransform(1,0,0,1,0,0);c.beginPath();
 if(outside)c.rect(0,0,r.w,r.h);
 c.rect(r.left,0,r.w-r.left,r.bottom);c.clip(outside?'evenodd':'nonzero');
 c.setTransform(r.m.a,0,0,r.m.d,r.m.e,r.m.f);
}
function originalCore(c,r,sources){
 c.save();try{coreClip(c,r,false);for(const a of sources)G.HonroVectorArt.draw(c,a,instance);counters.directCoreDraws++;}finally{c.restore();}
}
function draw(c,l,b){
 if(b?.honroStage!==33||b?.honroCustom||l?.asset?.id!==MARKER)return false;
 const sources=IDS.map(id=>find(b,id)),field=find(b,FIELD),cfg=l.asset.params?.stage33ExteriorComposite;
 c.save();try{
  c.globalAlpha*=(l.opacity??1);
  if((l.opacity??1)!==1)return fallback(c,sources,'unsupported-opacity');
  if(l.x!==0||l.y!==0||(l.scale??1)!==1||(l.rotation??0)!==0)return fallback(c,sources,'unexpected-placement');
  if(cfg?.version!==1||cfg.fieldId!==FIELD||JSON.stringify(cfg.sourceIds)!==JSON.stringify(IDS))return fallback(c,sources,'invalid-config');
  if(sources.some(a=>!a?.vector))return fallback(c,sources,'missing-source');
  if(field?.params?.stage33ExteriorField!==1||field?.params?.registration?.newBandInverseAffine?.length!==6)return fallback(c,sources,'missing-field');
  const core=coreRect(c);
  if(core&&core.left===0&&core.bottom===core.h){for(const a of sources)G.HonroVectorArt.draw(c,a,instance);counters.directCoreDraws++;counters.fullCoreDraws++;return true;}
  let q;try{q=prepare(c,sources);}catch{return fallback(c,sources,'source-render-error');}
  if(q.error)return fallback(c,sources,q.error);
  // Existing clips on c still apply. Shared buffer holds raw palette; caller
  // supplies HonroVisualStyle.raw(c), so no additional tint is introduced.
  c.save();try{if(core)coreClip(c,core,true);exterior(c,field);c.setTransform(1,0,0,1,0,0);c.drawImage(q.canvas,0,0);}finally{c.restore();}
  if(core)originalCore(c,core,sources);return true;
 }finally{c.restore();}
}
G.HonroStage33ExteriorArt={draw,stats:()=>({...counters,reasons:{...counters.reasons},maxPixels:MAX_PIXELS}),clear:()=>{last=null;if(buffer){buffer.width=1;buffer.height=1;}counters.bytes=buffer?4:0;}};
})(globalThis);
