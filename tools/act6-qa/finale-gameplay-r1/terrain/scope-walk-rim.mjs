/* Per-scene matte authored walk rim. Never changes polygons, skills, or debug outline. */
const normalize=s=>typeof s==='string'?s.toLowerCase():'';
export function attachMatteWalkRim({scene,battle,owner,rendererStyle}={}){
 if(!scene||!battle||scene.battle!==battle||typeof scene.terrainReadability!=='function'||!rendererStyle)return null;
 if(battle.mode!=='campaign'||battle.honroStage!==58||battle.honroAuthoredId!=='stage-58'||battle.honroCanonical!==true||battle.honroCustom===true||battle.honroMapOrigin!=='campaign'||!owner?.ownsExactPaintedTerrain?.(battle))return null;
 const inspected=new Set([rendererStyle.topLight,rendererStyle.woodLight].map(normalize).filter(Boolean));
 if(!inspected.size)return null;
 const prior=scene.terrainReadability;
 const patch=function(ctx,b,...args){
  if(this!==scene||b!==battle||scene.battle!==b||!owner.ownsExactPaintedTerrain(b))return prior.call(this,ctx,b,...args);
  const native=ctx.stroke;
  ctx.stroke=function(...strokeArgs){
   if(!inspected.has(normalize(this.strokeStyle)))return native.apply(this,strokeArgs);
   const [alpha,width]=[this.globalAlpha,this.lineWidth];
   try{this.globalAlpha=alpha*.23;this.lineWidth=width*.72;return native.apply(this,strokeArgs);}
   finally{this.globalAlpha=alpha;this.lineWidth=width;}
  };
  try{return prior.call(this,ctx,b,...args);}
  finally{ctx.stroke=native;}
 };
 scene.terrainReadability=patch;
 return ()=>{if(scene.terrainReadability===patch)scene.terrainReadability=prior;};
}
