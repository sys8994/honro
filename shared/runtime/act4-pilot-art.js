(function(G){'use strict';
if(G.HonroAct4PilotArt)return;
// Art-only opt-in. Ordinary Scene layers and their world/domain caches remain
// authoritative. No collision, actor, event, or authored instance is rewritten.
const layers=Object.freeze({background:'back',structure:'structural-back',body:'mid',rear:'prop',front:'front'});
function config(b){const q=b?.honroMap?.nativeArt;return b?.honroStage>=31&&b.honroStage<=40&&q?.version===1&&Array.isArray(q.coveredTerrainIds)?q:null;}
function native(l,b){return !!(config(b)&&Object.hasOwn(layers,l?.nativeArtLayer)&&l.layer===layers[l.nativeArtLayer]&&l.kind==='canonical-element'&&l.asset?.vector&&!l.asset.collision?.length&&!l.collisionIds?.length&&!l.honroElementCollision);}
function terrainIds(l){return Array.isArray(l?.nativeTerrainIds)?l.nativeTerrainIds:(l?.nativeTerrainId?[l.nativeTerrainId]:[]);}
function bodyLive(l,b){const ids=terrainIds(l);return ids.length>0&&new Set(ids).size===ids.length&&ids.every(id=>typeof id==='string'&&b.terrain?.some(t=>t.id===id&&!t.broken));}
function covered(t,b){const q=config(b);return !!(q&&q.coveredTerrainIds.includes(t.id)&&!t.honroElementCollision&&(b.honroLandmarks||[]).some(l=>native(l,b)&&l.nativeArtLayer==='body'&&bodyLive(l,b)&&terrainIds(l).includes(t.id)&&(l.opacity??1)===1));}
// Composer-side fail-fast contract; runtime still retains fallback if a BODY
// asset is absent in an older/incomplete saved battle.
function validateStage(stage,library){
 const q=stage.design?.nativeArt;if(!q)return true;
 if(!(stage.metadata?.stageId>=31&&stage.metadata?.stageId<=40)||q.version!==1||!Array.isArray(q.coveredTerrainIds))throw Error('Invalid native art opt-in');
 for(const l of stage.elements||[]){if(!l.nativeArtLayer)continue;const a=library.find(a=>a.id===l.assetId);
  if(!Object.hasOwn(layers,l.nativeArtLayer)||l.layer!==layers[l.nativeArtLayer]||!a?.vector||a.collision?.length||a.interactionType)throw Error('Invalid native art element '+l.id);
 }
 for(const id of q.coveredTerrainIds){if(!stage.terrains.some(t=>t.id===id)||(stage.elements||[]).filter(l=>l.nativeArtLayer==='body'&&terrainIds(l).includes(id)&&(l.opacity??1)===1).length!==1)throw Error('Missing native BODY for '+id);}
 for(const l of stage.elements||[]){if(l.nativeArtLayer!=='body')continue;const ids=terrainIds(l);if(!ids.length||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!q.coveredTerrainIds.includes(id)||!stage.terrains.some(t=>t.id===id)))throw Error('Invalid native BODY coverage '+l.id);}
 return true;
}
const S=G.HonroScene?.prototype;
if(S){
 const terrain=S.terrain;S.terrain=function(c,t,...args){if(covered(t,this.battle))return;return terrain.call(this,c,t,...args);};
 const foreground=S._isForeground;S._isForeground=function(l){return native(l,this.battle)?l.nativeArtLayer==='front':foreground.call(this,l);};
 const landmark=S.landmark;S.landmark=function(c,l,...args){
  const b=this.battle;
  if(config(b)&&this._nativeArtBackground&&l.id==='a4-31-boat-10'&&l.asset?.id==='a4:boat'){this._nativeArtDeferredBoat={...l};return;}
  if(native(l,b)){
   if(l.nativeArtLayer==='body'&&!bodyLive(l,b))return;
   if(G.HonroVectorArt?.draw(G.HonroVisualStyle?.raw(c)||c,l.asset,l))return;
  }
  // Paint the existing event-controlled boat pose exactly once, without making
  // a second static boat or changing its identity/collision/event lifecycle.
  if(config(b)&&l.id==='a4-31-boat-10'&&l.asset?.id==='a4:boat'){
   const id=b.honroMap.vectorArrivalBoatAssetId,a=G.HONRO_PROJECT?.library?.find(a=>a.id===id&&a.vector&&!a.collision?.length);
   if(a&&G.HonroVectorArt?.draw(G.HonroVisualStyle?.raw(c)||c,a,l))return;
  }
  return landmark.call(this,c,l,...args);
 };
 // Existing boat event renders in background(), before opaque native scenery.
 // Defer only that existing instance to the world-space live-water pass.
 const background=S.background;S.background=function(c,w,h,b,...args){const prior=this._nativeArtBackground;this._nativeArtDeferredBoat=null;this._nativeArtBackground=!!config(b);try{return background?.call(this,c,w,h,b,...args);}finally{this._nativeArtBackground=prior;}};
 const water=S.liveWater;S.liveWater=function(c,b,...args){const out=water?.call(this,c,b,...args);const boat=this._nativeArtDeferredBoat;this._nativeArtDeferredBoat=null;if(config(b)&&boat)this.landmark(c,boat);return out;};
 const tone=S.environmentTone;S.environmentTone=function(c,w,h,b,...args){if(config(b)?.preservePalette===true)return;return tone?.call(this,c,w,h,b,...args);};
 const cacheKey=S._worldCacheKey;S._worldCacheKey=function(b,...args){const q=config(b);return cacheKey.call(this,b,...args)+(q?':native-art-1:'+JSON.stringify(q):'');};
}
G.HonroAct4PilotArt={layers,config,native,covered,validateStage};
})(globalThis);
