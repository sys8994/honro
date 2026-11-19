async ({actual,w,h,expected,kind='stock'})=>{
 // A second Scene, not the photographed Scene. Keep native layer routing and
 // raster allocation/projection verbatim; make only non-BODY paint transparent.
 const p=kind==='candidate'?HonroWorkshopAPI.getProject():structuredClone(window.__eastStockBeforeOpen);
 const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))).map(n=>n.toString(16).padStart(2,'0')).join('');
 if(await digest(p)!==expected||p.activeStageId!=='stage-42')throw Error('Cached opacity source mismatch');
 const proj=HonroMaps.finalize({...p,stages:p.stages.filter(s=>s.id==='stage-42')});
 const battle=HonroMaps.createBattle(proj.stages[0],proj,HonroProfileStore.fresh(),{origin:'campaign'});
 HonroStageRules.sanitizeStageBattle(battle);
 const run=(b)=>{
  const owner='act5:stage42:registered-body', cv=document.createElement('canvas');
  cv.width=w;cv.height=h;
  Object.assign(cv.style,{position:'fixed',left:'-200vw',top:'0',width:w+'px',height:h+'px'});
  document.body.append(cv);
  const sc=new HonroScene(cv);sc.battle=b;[sc.x,sc.y,sc.scale]=actual;
  const oldVector=HonroVectorArt.draw, layer=sc._landmarkLayer, oldBlit=CanvasRenderingContext2D.prototype.drawImage;
  const events=[],ownerDraws=[];
  try {
   sc.size(b);const mask=document.createElement('canvas');mask.width=cv.width;mask.height=cv.height;const c=mask.getContext('2d',{alpha:true});
   const dpr=sc._pixelRatio(w,h,b);if(dpr!==1||cv.width!==w||cv.height!==h)throw Error('Cached mask CSS/DPR mismatch');
   c.setTransform(dpr,0,0,dpr,0,0);c.translate(w/2,h/2);c.scale(sc.scale,sc.scale);c.translate(-sc.x,-sc.y);
   sc._landmarkLayer=function(ctx,landmarks,name){return layer.call(this,ctx,landmarks.filter(l=>l.id==='a5-near'&&l.asset?.id==='act5:near:42'),name)};
   sc.terrain=sc.surfaceZones=sc.terrainReadability=()=>{};
   HonroVectorArt.draw=function(ctx,a,...rest){
    if(a?.id!==owner)return;const m=ctx.getTransform();const raw=ctx.canvas;
    if(!sc._staticCacheBuild||raw.width!==516||raw.height!==516)throw Error('BODY was not drawn on a cached tile');
    ownerDraws.push([m.a,m.d,m.e,m.f,ctx.globalAlpha]);
    return oldVector.call(this,ctx,a,...rest);
   };
   CanvasRenderingContext2D.prototype.drawImage=function(img,...args){
    if(this===c){const m=c.getTransform();events.push({args,transform:[m.a,m.d,m.e,m.f],size:[img.width,img.height],smoothing:c.imageSmoothingEnabled,quality:c.imageSmoothingQuality,alpha:c.globalAlpha,composite:c.globalCompositeOperation,filter:c.filter??null});}
    return oldBlit.call(this,img,...args);
   };
   sc._drawTerrainDomainTiles(c,b,w,h);
   const tileCount=sc._domainTiles?.tiles.size??0,rs=sc._domainTiles?.rs;
   if(!ownerDraws.length||!tileCount||!events.length||events.some(e=>e.size[0]!==516||e.size[1]!==516||e.args.slice(0,4).join(',')!=='0,0,516,516'))throw Error('Native BODY tile/blit trace missing');
   return {png:mask.toDataURL(),dpr,rs,tileCount,events,ownerDraws,camera:actual};
  }finally{
   CanvasRenderingContext2D.prototype.drawImage=oldBlit;HonroVectorArt.draw=oldVector;sc._releaseDomainTiles();cv.remove();
  }
 };
 return run(battle);
}
