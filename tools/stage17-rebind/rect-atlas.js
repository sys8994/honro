async ({z, view, centers})=>{
 const app=HonroApp,e=app.engine,b=e.b,s=app.scene,c=s.canvas,rt=c.getBoundingClientRect(),t=s._domainTiles;
 if(!HonroTerrainDomain.active(b)||b.honroStage!==17||s.time!==2||s.scale!==z||!t||t.tiles.size>24)throw Error('actual Stage17 atlas cannot be witnessed');
 const v=HonroBounds.viewport(s,rt.width,rt.height);
 if(JSON.stringify(v)!==JSON.stringify(view))throw Error('native viewport moved');
 const rs=s._worldRasterScale(b,rt.width);if(t.rs!==rs)throw Error('actual tile scale drift');
 const samples=centers.map(([j,i])=>{
  const sat=(k,oo)=>Math.round((k-oo)*z);
  const seen=[...t.tiles].filter(([,a])=>j>=sat(a.left,v.left)&&j<sat(a.left+512/rs,v.left)&&i>=sat(a.top,v.top)&&i<sat(a.top+512/rs,v.top));
  if(seen.length!==1)throw Error('not one actual on-screen owner tile');
  const [id,tile]=seen[0],ctx=tile.canvas.getContext('2d'),C=[rs*(v.left+(j+.5)/z),rs*(v.top+(i+.5)/z)],B=C.map(n=>Math.floor(n-.5));
  const [tx,ty]=id.split(':').map(Number);
  if(Math.abs(tile.left*rs-tx*512)>1e-7||Math.abs(tile.top*rs-ty*512)>1e-7||[tile.canvas.width,tile.canvas.height].some(n=>n!==516))throw Error('unexpected atlas tile layout');
  const src=[];
  for(let x=B[0];x<=B[0]+1;x++)for(let y=B[1];y<=B[1]+1;y++){
   const weight=(1-Math.abs(C[0]-x-.5))*(1-Math.abs(C[1]-y-.5));
   if(weight<=1e-12)continue;
   const ix=x-tx*512+2,iy=y-ty*512+2;
   if(ix<0||ix>=516||iy<0||iy>=516)throw Error('sample outside real two-pixel gutter');
   src.push({source:[x,y],atlas:[ix,iy],weight,rgba:[...ctx.getImageData(ix,iy,1,1).data]});
  }
  return {device:[j,i],tile:id,src};
 });
 return {rect:{x:rt.x,y:rt.y,width:rt.width,height:rt.height},scroll:[scrollX,scrollY],zoom:window.visualViewport?.scale??null,dpr:devicePixelRatio,rs,
         backing:[c.width,c.height],cssCanvasSmoothing:getComputedStyle(c).imageRendering,screenCacheBacking:s._screenWorldCache?.canvas?[s._screenWorldCache.canvas.width,s._screenWorldCache.canvas.height]:null, samples};
}
