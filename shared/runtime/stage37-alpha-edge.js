(function(G){'use strict';
// Apply source-alpha coverage once only at fractional coverage pixels.
// Original source paths/order, fully covered interiors, holes and physics are unchanged.
if(G.HonroStage37AlphaEdge)return;
const ID='approved37:body',MAX_PIXELS=1048576,prepared=new WeakMap();
let buffer,mask,replacement;const stats={draws:0,allocations:0,bytes:0,peakBytes:0,partialPixels:0,runs:0,fallbacks:0,lastFallback:null,coverageZero:0,coverageOpaque:0,coveragePartial:0,maskBackend:null};
const fail=reason=>{stats.fallbacks++;stats.lastFallback=reason;return false;};
function canvas(old,w,h){if(!old){old=G.document?.createElement('canvas')||(typeof G.OffscreenCanvas==='function'?new G.OffscreenCanvas(w,h):null);if(!old)return null;stats.allocations++;}if(old.width!==w)old.width=w;if(old.height!==h)old.height=h;return old;}
function draw(c,l,b){
 if(b?.honroStage!==37||b?.honroCustom||l?.asset?.id!==ID)return false;
 const a=l.asset,m=c.getTransform(),w=c.canvas?.width,h=c.canvas?.height;
 if(a.params?.semanticLayer!=='BODY'||a.params?.silhouetteUnderpaint!==false||a.params?.source!=='stage37/v2-cleanalpha24/04-final.svg'||a.vector?.root?.transform?.join(',')!=='1.6,0,0,1.6,0,0'||(l.scale??1)!==1||(l.rotation??0)!==0||c.globalAlpha!==1||c.globalCompositeOperation!=='source-over'||m.a<=0||m.d<=0||m.b!==0||m.c!==0||!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>MAX_PIXELS)return fail('unsupported-source-or-device');
 let q=prepared.get(a),pixels,coverage;
 try{
  if(!q){const copy=structuredClone(a),found=[];const walk=n=>{if(n.clipPath==='sourceAlpha')found.push(n);for(const ch of n.children||[])walk(ch);};walk(copy.vector.root);if(found.length!==1||!Array.isArray(a.vector.clips?.sourceAlpha))return fail('unexpected-source-clip');delete found[0].clipPath;q={copy,clip:new Path2D(a.vector.clips.sourceAlpha.join(' '))};prepared.set(a,q);}
  buffer=canvas(buffer,w,h);mask=canvas(mask,w,h);replacement=canvas(replacement,w,h);if(!buffer||!mask||!replacement)return fail('missing-canvas');
  const cc=buffer.getContext('2d'),mc=mask.getContext('2d'),rc=replacement.getContext('2d');if(!cc||!mc||!rc)return fail('missing-context');
  for(const ctx of [cc,mc,rc]){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.clearRect(0,0,w,h);}
  cc.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);cc.honroVisualLayer=c.honroVisualLayer;
  G.HonroVectorArt.draw(cc,q.copy,l);
  mc.save();try{mc.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);mc.translate(l.x||0,l.y||0);mc.translate(-(a.anchor?.x||0),-(a.anchor?.y||0));mc.transform(...a.vector.root.transform);mc.clip(q.clip);mc.setTransform(1,0,0,1,0,0);mc.fillStyle='#fff';mc.fillRect(0,0,w,h);}finally{mc.restore();}
  rc.drawImage(c.canvas,0,0);rc.save();try{rc.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);rc.translate(l.x||0,l.y||0);rc.translate(-(a.anchor?.x||0),-(a.anchor?.y||0));rc.transform(...a.vector.root.transform);rc.clip(q.clip);rc.setTransform(1,0,0,1,0,0);rc.drawImage(buffer,0,0);}finally{rc.restore();}
  coverage=mc.getImageData(0,0,w,h).data;stats.maskBackend={canvas:mask.constructor.name,context:mc.getContextAttributes?.()??null};for(let i=3;i<coverage.length;i+=4){if(coverage[i]===0)stats.coverageZero++;else if(coverage[i]===255)stats.coverageOpaque++;else stats.coveragePartial++;}pixels=rc.getImageData(0,0,w,h);
 }catch{return fail('prepare-coverage');}
 // All fallible preparation completes before the normal source drawing.
 G.HonroVectorArt.draw(c,a,l);
 stats.draws++;stats.bytes=w*h*4*5;stats.peakBytes=Math.max(stats.peakBytes,stats.bytes);
 // Dirty rectangles are integer partial-coverage runs, never full-canvas readback/writeback.
 for(let y=0;y<h;y++){let start=-1;for(let x=0;x<=w;x++){const alpha=x<w?coverage[(y*w+x)*4+3]:0,partial=alpha>0&&alpha<255;if(partial){stats.partialPixels++;if(start<0)start=x;}if(!partial&&start>=0){c.putImageData(pixels,0,0,start,y,x-start,1);stats.runs++;start=-1;}}}
 return true;
}
G.HonroStage37AlphaEdge={draw,stats:()=>({...stats,maxPixels:MAX_PIXELS})};
})(globalThis);
