(function(G){'use strict';
// Stage2 uses the same independent approved far and its own transparent near.
const S=G.HonroScene.prototype,P=G.HonroPaintedPilots,L=G.HonroQuietLayeredArt;
const active=b=>b?.honroStage===2&&!b.honroCustom&&b.honroMap?.stage2ImageFirst?.quietLayers===1;
const ready=b=>active(b)&&L.ready('stage2QuietNear');
const background=S.background;S.background=function(c,w,h,b){if(!active(b))return background.call(this,c,w,h,b);ready(b);L.frame(this,w,h,b,b.honroMap.stage2ImageFirst.artBounds);L.background(this,c,w,h,b);};
const terrain=S.terrain;S.terrain=function(c,t){if(active(this.battle))return;return terrain.call(this,c,t);};
const layer=S._landmarkLayer;S._landmarkLayer=function(c,ls,name){const b=this.battle;if(!active(b))return layer.call(this,c,ls,name);if(name!=='structural-back'||!ready(b))return;const v=b.honroMap.stage2ImageFirst,q=v.transform;c.drawImage(L.near(v.image),q.x,q.y,v.source.width*q.scale,v.source.height*q.scale);};
const skirt=S.terrainSkirt;S.terrainSkirt=function(c,b,w,h){if(active(b))return;return skirt.call(this,c,b,w,h);};
const zones=S.surfaceZones;S.surfaceZones=function(c,b){if(active(b))return;return zones.call(this,c,b);};
const water=S.liveWater;S.liveWater=function(c,b){if(!active(b))return water.call(this,c,b);c.save();c.globalAlpha*=.13;const out=water.call(this,c,b);c.restore();return out;};
const tone=S.environmentTone;S.environmentTone=function(c,w,h,b){if(active(b))return;return tone?.call(this,c,w,h,b);};
const marker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(active(scene.battle)&&(m.type==='exit'||m.type==='hauntHabitat'))return true;return marker.call(this,scene,m);};
const key=S._worldCacheKey;S._worldCacheKey=function(b,w){return key.call(this,b,w)+(active(b)?':stage2-quiet2:'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage2-quiet-layered',active,naturalEdges:true,cachedWorld:true});
G.HonroStage2ImageFirstArt={active,ready,cacheStats:()=>({...L.cacheStats(),requestedImages:['quietFar','stage2QuietNear'].filter(id=>P.images[id]).length,maxImages:2})};
})(globalThis);
