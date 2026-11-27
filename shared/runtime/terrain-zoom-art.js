(function(G){'use strict';
// Transparent native landmark renders used only in the moving camera grid.
// Actors, moving decks, water, contact ink and scene effects retain their live passes.
const S=G.HonroScene.prototype,landmark=S.landmark;
function prepare(scene,b){
 const motion=scene._terrainZoom,rows=G.HONRO_TERRAIN_ZOOM_ART?.[b.honroStage];
 if(!motion||motion.art||!rows)return;
 const art=motion.art=new Map();
 for(const row of rows){
  if(row.revision!==b.honroCampaignMapRevision||row.style!==G.HonroVisualStyle.key())continue;
  const image=new Image();image.decoding='async';image.src=row.src;
  art.set(row.id,{row,image});
 }
}
S.landmark=function(c,l){
 const motion=this._terrainZoom;
 const wide=this.scale<=.245;
 const temporary=(motion?.preview||wide)&&(this._staticCacheBuild||this._terrainExteriorPass)||
       this._terrainExteriorPass&&this._domainTilesDeferred;
 const entry=temporary&&motion?.battle===this.battle&&motion.art?.get(l.id);
 if(entry){
  const {row,image}=entry;
  if(image.complete&&image.naturalWidth&&l.asset?.id===row.asset&&l.x===row.x&&l.y===row.y&&
      (l.scale??1)===row.scale&&(l.rotation??0)===row.rotation){
   c.drawImage(image,row.left,row.top,row.width,row.height);return;
  }
 }
 return landmark.call(this,c,l);
};
G.HonroTerrainZoomArt={prepare};
})(globalThis);
