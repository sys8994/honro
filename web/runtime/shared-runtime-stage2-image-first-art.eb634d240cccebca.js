(function(G){'use strict';
// Isolated Stage2 presentation. No edits to Stage1 or shared rock helpers.
const S=G.HonroScene.prototype,P=G.HonroPaintedPilots;
const active=b=>b?.honroStage===2&&!b.honroCustom&&b.honroMap?.stage2ImageFirst?.revision===1;
const ready=b=>{if(!active(b))return false;P.request(['stage2Place']);return P.ready('stage2Place');};
function frame(scene,w,h,b){const a=b.honroMap.stage2ImageFirst.artBounds;scene.scale=Math.max(w/(a.right-a.left),h/(a.bottom-a.top),scene.scale);const hw=w/(2*scene.scale),hh=h/(2*scene.scale);scene.x=Math.max(a.left+hw,Math.min(a.right-hw,scene.x));scene.y=Math.max(a.top+hh,Math.min(a.bottom-hh,scene.y));}
const background=S.background;S.background=function(c,w,h,b){if(!active(b))return background.call(this,c,w,h,b);frame(this,w,h,b);ready(b);const cc=G.HonroVisualStyle.raw(c);cc.fillStyle='#283844';cc.fillRect(0,0,w,h);this.environmentStats={groups:1,visibleAssets:ready(b)?1:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};};
const terrain=S.terrain;S.terrain=function(c,t){if(active(this.battle))return;return terrain.call(this,c,t);};
const layer=S._landmarkLayer;S._landmarkLayer=function(c,ls,name){const b=this.battle;if(!active(b))return layer.call(this,c,ls,name);if(name!=='structural-back'||!ready(b))return;const v=b.honroMap.stage2ImageFirst,q=v.transform;c.drawImage(P.images.stage2Place,q.x,q.y,v.source.width*q.scale,v.source.height*q.scale);};
const skirt=S.terrainSkirt;S.terrainSkirt=function(c,b,w,h){if(active(b))return;return skirt.call(this,c,b,w,h);};
const zones=S.surfaceZones;S.surfaceZones=function(c,b){if(active(b))return;return zones.call(this,c,b);};
const water=S.liveWater;S.liveWater=function(c,b){if(!active(b))return water.call(this,c,b);c.save();c.globalAlpha*=.13;const out=water.call(this,c,b);c.restore();return out;};
const tone=S.environmentTone;S.environmentTone=function(c,w,h,b){if(active(b))return;return tone?.call(this,c,w,h,b);};
const marker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(active(scene.battle)&&(m.type==='exit'||m.type==='hauntHabitat'))return true;return marker.call(this,scene,m);};
const key=S._worldCacheKey;S._worldCacheKey=function(b,w){return key.call(this,b,w)+(active(b)?':stage2-image-first1:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage2-image-first',active,naturalEdges:true,cachedWorld:true});
G.HonroStage2ImageFirstArt={active,ready,cacheStats:()=>({filterPasses:0,requestedImages:P.images.stage2Place?1:0,maxImages:1})};
})(globalThis);

