(function(G){'use strict';
// Stage 32 only. Keep source path order, compounds, roads and grass verbatim.
// Rasterize one shared world-coordinate material into the current device plane;
// every geology clip then samples the same bitmap without repeated vector AA.
if(G.HonroStage32FoundationArt)return;
const FOUNDATION='act4-handoff:32:foundation',BODY='act4-handoff:32:body-shared-material';
const MAX_PIXELS=8*1024*1024,prepared=new WeakMap();
let buffer=null,bufferContext=null,last=null;
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
   return {path:new G.Path2D(path),fill:n.fill,rule:n.fillRule||'nonzero',protected:protect.has(i),gray:indices?new G.Path2D(indices.map(j=>subs[j]).join('')):null};
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
function draw(c,l,b){
 const id=l?.asset?.id;
 if(b?.honroStage!==32||b?.honroCustom||![FOUNDATION,BODY].includes(id))return false;
 if((l.scale??1)!==1||(l.rotation??0)!==0||l.x!==(id===FOUNDATION?-5500:0)||l.y!==(id===FOUNDATION?-1950:0))return fallback('unexpected-placement');
 // The compiler clones providers into battle landmarks. Share that exact
 // resolved field object across foundation/BODY passes, not the library copy.
 const field=id===FOUNDATION?l.asset:(b.honroLandmarks?.find(v=>v.asset?.id===FOUNDATION)?.asset||G.HONRO_PROJECT?.library?.find(a=>a.id===FOUNDATION));
 if(!field)return fallback('missing-field');
 let q,cv;try{q=geometry(l.asset);cv=q&&material(c,field);}catch{return fallback('invalid-source');}
 if(!q||!cv)return fallback('invalid-source-or-device-pixel-cap');
 c.save();try{
  c.globalAlpha*=(l.opacity??1);
  if(id===FOUNDATION){c.translate(l.x,l.y);c.scale(7.2,7.2);c.clip(q.silhouette);bitmap(c,cv);}
  else{
   c.clip(q.apron);c.scale(2.2,2.2);
   for(const n of q.paths){
    if(n.protected){c.fillStyle=n.fill;c.fill(n.path,n.rule);continue;}
    c.save();c.clip(n.path,n.rule);bitmap(c,cv);
    if(n.gray){c.fillStyle=n.fill;c.fill(n.gray,n.rule);}c.restore();
   }
  }
 }finally{c.restore();}
 return true;
}
G.HonroStage32FoundationArt={draw,stats:()=>({...counters,maxPixels:MAX_PIXELS}),clear:()=>{last=null;if(buffer){buffer.width=1;buffer.height=1;}counters.bytes=buffer?4:0;}};
})(globalThis);

