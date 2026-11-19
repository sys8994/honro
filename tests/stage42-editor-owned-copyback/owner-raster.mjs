// Temporary browser QA only. Domain cache owns persistent cells; this routine
// borrows and returns a bounded owner canvas only during cold cell paints.
export function installOwnedRasterQA(G, compositeOwnedReplacement, copyOpaqueOwnerRuns){
 const cells=new WeakSet(), compiled=new WeakMap();
 const stats={cells:0,attempts:0,used:0,underBudgetPixels:0,ownerMs:0,fallbacks:{}};
 const fallback=(k)=>{stats.fallbacks[k]=(stats.fallbacks[k]||0)+1;};
 const reset=(ctx,w,h)=>{ctx.resetTransform();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,w,h);};
 const pin=value=>{const s=JSON.stringify(value);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;};
 const mark=cc=>{cells.add(cc);stats.cells++;};
 const unmark=cc=>cells.delete(cc);
 function paint(scene,c,cc,a,style,placement){
  const e=a.edgeWall, v=e?.vector,s=e?.params?.workshopVisibleJoint42,draw=G.HonroVectorArt.draw;
  if(a.id!=='act5:near:42'||!s)return draw(cc,e,{x:0,y:0,scale:1});
  let p=compiled.get(e);
  if(!p){
    const key='native-source-alpha',source=v.clips?.[key],guard=v.clips?.['editor-visible-support'],faces=v.root.children?.[1];
    if(!s.originalRoot||!source||s.originalRoot.clipPath!==key||pin([s.originalRoot,source])!==3938422908||!guard||faces?.clipPath!=='editor-visible-support')throw Error('QA owned raster source mismatch');
    const old={...e,vector:{...v,root:s.originalRoot}};
    const sw=s.rim;
    if(!Array.isArray(sw)||sw.length<3||sw.length>32||sw.some(q=>q.length!==2||!q.every(Number.isFinite)))throw Error('QA owned raster rim shape mismatch');
    const newOnly={...e,vector:{...v,root:faces}}, rim=new Path2D('M'+sw.map(q=>q.join(' ')).join('L')+'Z'),sourcePath=new Path2D(source.join(' '));
    const lo=[Math.min(...sw.map(q=>q[0])),Math.min(...sw.map(q=>q[1]))],hi=[Math.max(...sw.map(q=>q[0])),Math.max(...sw.map(q=>q[1]))];
    p={old,newOnly,rim,sourcePath,lo,hi,coat:faces.children[0].fill};compiled.set(e,p);
  }
  const original=reason=>{if(reason)fallback(reason);return draw(cc,p.old,{x:0,y:0,scale:1});};
  if(G.HONRO_STAGE42_OWNER_RASTER_QA!==true)return original('disabled');
  if(scene.battle?.honroStage!==42||!scene._staticCacheBuild||!cells.has(c)||typeof scene._makeLayerCanvas!=='function'||typeof scene._releaseRasterCanvas!=='function')return original('not-marked-domain-cell');
  const m=cc.getTransform(),W=c.canvas.width,H=c.canvas.height;
  if(W!==516||H!==516||m.b!==0||m.c!==0||!Number.isFinite(m.a+m.d+m.e+m.f)||m.a<=0||m.d<=0||c.globalAlpha!==1||c.globalCompositeOperation!=='source-over'||placement?.honroTerrainMaterialClip)return original('unsupported-grid-or-compositor');
  const ax=Math.max(0,Math.floor(m.a*p.lo[0]+m.e)-2), ay=Math.max(0,Math.floor(m.d*p.lo[1]+m.f)-2);
  const bx=Math.min(W,Math.ceil(m.a*p.hi[0]+m.e)+2),by=Math.min(H,Math.ceil(m.d*p.hi[1]+m.f)+2),w=bx-ax,h=by-ay;
  if(w<=0||h<=0)return original();
  if(w*h>262144)return original('roi-budget');
  if(!/^#[a-f0-9]{6}$/i.test(p.coat))return original('paint-palette');
  // The old painter runs directly at its original position/order. No extra owner compositing group.
  original();
  stats.attempts++;const begin=performance.now();
  let owner,scratch,ready=false,error=null;
  try{
   owner=scene._makeLayerCanvas(W,H);scratch=scene._makeLayerCanvas(w,h);
   if(owner===c.canvas||scratch===owner||scratch===c.canvas)throw Error('not isolated');
   const b=owner.getContext('2d',{alpha:true,willReadFrequently:true}),s=scratch.getContext('2d',{alpha:true,willReadFrequently:true});
   const V=G.HonroVisualStyle, pass=ctx=>V?V.context(ctx,style):ctx;
   reset(b,W,H);b.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);
   draw(pass(b),p.old,{x:0,y:0,scale:1});
   const cropped=()=>s.setTransform(m.a,m.b,m.c,m.d,m.e-ax,m.f-ay);
   const alpha=path=>{reset(s,w,h);cropped();s.fillStyle='#ffffff';s.fill(path,'nonzero');return s.getImageData(0,0,w,h).data;};
   const rim=alpha(p.rim),source=alpha(p.sourcePath);
   reset(s,w,h);const paint=pass(s);
   paint.fillStyle=p.coat;paint.fillRect(0,0,w,h);cropped();
   draw(paint,p.newOnly,{x:0,y:0,scale:1});
   const newPaint=s.getImageData(0,0,w,h).data;
   const isolated=b.getImageData(ax,ay,w,h).data;
   const write=copyOpaqueOwnerRuns(c,{x:ax,y:ay,w,h,newPaint,rim,source,isolated,authorized:cells.has(c),compose:compositeOwnedReplacement});
   if(!write.used){error=write.reason;}else{ready=true;stats.underBudgetPixels=Math.max(stats.underBudgetPixels,w*h);}
   if(ready){stats.used++;stats.spans=(stats.spans||0)+write.spans;stats.coveredPixels=(stats.coveredPixels||0)+write.pixels;stats.fullyCovered=(stats.fullyCovered||0)+write.fullyCovered;stats.oldInkChanged=(stats.oldInkChanged||0)+write.oldInkChanged;}
  }catch(e){if(ready||String(e.message??e).includes('rollback was not exact'))throw e;error=String(e.message??e);}
  finally{if(scratch&&scratch!==c.canvas&&scratch!==owner)scene._releaseRasterCanvas(scratch);if(owner&&owner!==c.canvas)scene._releaseRasterCanvas(owner);stats.ownerMs+=performance.now()-begin;}
  if(!ready)fallback(error??'not-ready');
  return true;
 }
 G.HonroStage42OwnedRasterQA=Object.freeze({mark,unmark,paint,inspect:()=>structuredClone(stats)});
}
