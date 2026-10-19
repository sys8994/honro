(function(G){'use strict';
// Whole original place panels at ONE uniform art transform. Collision is
// independent authored gameplay data; it is never a paint mask or texture UV.
const S=G.HonroScene.prototype,P=G.HonroPaintedPilots;
const active=b=>b?.honroStage===1&&!b.honroCustom&&b.honroMap?.stage1ImageFirst?.revision===1;
const state=b=>(b.terrain.find(t=>t.id==='pine-branch-west')?.broken?1:0)|(b.terrain.find(t=>t.id==='pine-branch-east')?.broken?2:0);
const names=['stage1Place','stage1PlaceWestBroken','stage1PlaceEastBroken','stage1PlaceBothBroken'];
function ready(b){if(!active(b))return false;P.request(['stage1Place',names[state(b)]]);return P.ready('stage1Place');}
function image(b){const id=names[state(b)];return P.images[P.ready(id)?id:'stage1Place'];}
function frame(scene,w,h,b){const a=b.honroMap.stage1ImageFirst.artBounds,scale=Math.max(w/(a.right-a.left),h/(a.bottom-a.top));scene.scale=Math.max(scale,scene.scale);const hw=w/(2*scene.scale),hh=h/(2*scene.scale);scene.x=Math.max(a.left+hw,Math.min(a.right-hw,scene.x));scene.y=Math.max(a.top+hh,Math.min(a.bottom-hh,scene.y));}
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b))return oldBackground.call(this,c,w,h,b);ready(b);frame(this,w,h,b);const cc=G.HonroVisualStyle.raw(c);cc.fillStyle='#283844';cc.fillRect(0,0,w,h);this.environmentStats={groups:1,visibleAssets:ready(b)?1:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(active(this.battle))return;return oldTerrain.call(this,c,t);};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,ls,layer){const b=this.battle;if(!active(b))return oldLayer.call(this,c,ls,layer);if(layer!=='structural-back'||!ready(b))return;const v=b.honroMap.stage1ImageFirst,im=image(b),q=v.transform;c.drawImage(im,q.x,q.y,v.source.width*q.scale,v.source.height*q.scale);};
const oldSkirt=S.terrainSkirt;S.terrainSkirt=function(c,b,w,h){if(active(b))return;return oldSkirt.call(this,c,b,w,h);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){if(active(b))return;return oldZones.call(this,c,b);};
// Keep the common pool/contact/ripple implementation, translucently over the
// painted ford. It must not replace a shallow stream with an opaque teal card.
const oldWater=S.liveWater;S.liveWater=function(c,b){if(!active(b))return oldWater.call(this,c,b);c.save();c.globalAlpha*=.13;const result=oldWater.call(this,c,b);c.restore();return result;};
const oldTone=S.environmentTone;S.environmentTone=function(c,w,h,b){if(active(b))return;return oldTone?.call(this,c,w,h,b);};
const oldMarker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(active(scene.battle)&&(m.type==='exit'||m.type==='hauntHabitat'))return true;return oldMarker.call(this,scene,m);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage1-image-first1:'+state(b)+':'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage1-image-first',active,naturalEdges:true,cachedWorld:true});
G.HonroStage1ImageFirstArt={active,ready,frame,cacheStats:()=>({filterPasses:0,requestedImages:names.filter(id=>P.images[id]).length,maxImages:4})};
})(globalThis);

