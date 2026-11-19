({expected,requested,w=1280,h=800,corner=null})=>{
 const p=HonroWorkshopAPI.getProject(),s=p.stages[0],cv=document.createElement('canvas'),names=p.library.map(a=>a.id);
 if(JSON.stringify(p.library.map(x=>[x.id,x.vector.root,x.collision.length]))!==JSON.stringify(expected.asset)||p.activeStageId!==expected.id||s.terrains.length>0)throw Error('Actual reopened native source drift');
 cv.width=w;cv.height=h;Object.assign(cv.style,{position:'fixed',left:'-200vw',width:w+'px',height:h+'px'});document.body.append(cv);
 const rng=Math.random,normal=HonroVectorArt.draw,seen=new Map();
 const b=HonroMaps.createBattle(s,p,HonroProfileStore.fresh(),{origin:'workshop'}),e=new HONRO_CORE.Engine(b,()=>{},true),sc=new HonroScene(cv);
 const focus=HonroBounds.focus(b), limits=HonroBounds.zoomLimits(w);
 if(corner){
  if (!['nw','ne','sw','se'].includes(corner)||!Number.isFinite(limits.min))throw Error('Invalid focus-extrema request');
  requested=[corner[1]==='w'?focus.left:focus.right,corner[0]==='n'?focus.top:focus.bottom,limits.min];
 }
 try {
  if(b.honroLandmarks.some(x=>!names.includes(x.asset?.id))||b.terrain.length!==0)throw Error('Foreign old art/physics present');
  Object.assign(sc,{manual:true,x:requested[0],y:requested[1],scale:requested[2],time:2,editorView:false,skillPreview:false});
  HonroBounds.constrain(sc,b);let n=4903;Math.random=()=>((n=(n*1664525+1013904223)>>>0)/2**32);
  HonroVectorArt.draw=(c,a,...args)=>{
   if(names.includes(a?.id)){const cached=!!sc._staticCacheBuild&&c.canvas.width===516&&c.canvas.height===516;const v=seen.get(a.id)??{cached:0,direct:0};v[cached?'cached':'direct']++;seen.set(a.id,v);}
   return normal.call(HonroVectorArt,c,a,...args);
  };
  sc.render(e,0,'',.6,false,0);
  if(!corner&&!seen.has('new-stage42-joined-lower'))throw Error('Full-width structural owner not drawn');
  return {png:cv.toDataURL('image/png'),requested,actual:[sc.x,sc.y,sc.scale],bounds:b.honroTerrainBounds,dpr:devicePixelRatio,viewport:{w,h},focus,legalZoom:limits,deviceCorner:corner,worldViewport:HonroBounds.viewport(sc,w,h),cacheTiles:sc._domainTiles?.tiles.size??0,owners:Object.fromEntries(seen),notProof:'Outside cache/direct coverage, contact, playability, final colors, far asset and camera-edge art are independent gates.'};
 }finally{Math.random=rng;HonroVectorArt.draw=normal;cv.remove();}
}
