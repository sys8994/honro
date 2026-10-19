(function(G){'use strict';
// Stage1 approved transparent near + independent screen-space far. The source
// playable near is unchanged; a cached non-colliding fringe joins its cut edges.
const S=G.HonroScene.prototype,P=G.HonroPaintedPilots,L=G.HonroQuietLayeredArt;
const active=b=>b?.honroStage===1&&!b.honroCustom&&b.honroMap?.stage1ImageFirst?.quietLayers===1;
const ready=b=>active(b)&&L.ready(b.honroMap.stage1ImageFirst.image),broken=b=>!!b.terrain.find(t=>t.id==='pine-branch-east')?.broken;
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b))return oldBackground.call(this,c,w,h,b);ready(b);L.background(this,c,w,h,b);};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(active(this.battle))return;return oldTerrain.call(this,c,t);};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,ls,layer){const b=this.battle;if(!active(b))return oldLayer.call(this,c,ls,layer);if(layer!=='structural-back'||!ready(b))return;const v=b.honroMap.stage1ImageFirst;L.drawNear(c,v,broken(b)?v.brokenBoughMask:null);};
const oldSkirt=S.terrainSkirt;S.terrainSkirt=function(c,b,w,h){if(active(b)){if(ready(b)){const v=b.honroMap.stage1ImageFirst;L.drawNear(c,v,broken(b)?v.brokenBoughMask:null,true);}return;}return oldSkirt.call(this,c,b,w,h);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){if(active(b))return;return oldZones.call(this,c,b);};
const oldWater=S.liveWater;S.liveWater=function(c,b){if(!active(b))return oldWater.call(this,c,b);c.save();c.globalAlpha*=.13;const out=oldWater.call(this,c,b);c.restore();return out;};
const oldTone=S.environmentTone;S.environmentTone=function(c,w,h,b){if(active(b))return;return oldTone?.call(this,c,w,h,b);};
const oldMarker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(active(scene.battle)&&(m.type==='exit'||m.type==='hauntHabitat'))return true;return oldMarker.call(this,scene,m);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage1-quiet3-fringe:'+Number(broken(b))+':'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage1-quiet-layered',active,naturalEdges:true,cachedWorld:true});
G.HonroStage1ImageFirstArt={active,ready,cacheStats:()=>({...L.cacheStats(),requestedImages:['quietFar','stage1BalancedNear'].filter(id=>P.images[id]).length,maxImages:2})};
})(globalThis);
