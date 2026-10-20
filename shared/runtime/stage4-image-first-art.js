(function(G){'use strict';
const S=G.HonroScene.prototype,P=G.HonroPaintedPilots,L=G.HonroQuietLayeredArt;
const active=b=>!G.HonroVectorCampaignArt?.active(b)&&b?.honroStage===4&&!b.honroCustom&&b.honroMap?.stage4ImageFirst?.quietLayers===1;
const ready=b=>active(b)&&L.ready('stage4QuietNear');
const background=S.background;S.background=function(c,w,h,b){if(!active(b))return background.call(this,c,w,h,b);ready(b);L.background(this,c,w,h,b);};
const terrain=S.terrain;S.terrain=function(c,t){if(active(this.battle))return;return terrain.call(this,c,t);};
const layer=S._landmarkLayer;S._landmarkLayer=function(c,ls,name){const b=this.battle;if(!active(b))return layer.call(this,c,ls,name);if(name!=='structural-back'||!ready(b))return;const v=b.honroMap.stage4ImageFirst,q=v.transform,broken=b.terrain.find(t=>t.id==='burned-gallery')?.broken;c.drawImage(L.near(v.image),q.x,q.y,v.source.width*q.scale,v.source.height*q.scale);if(broken){c.save();c.translate(q.x,q.y);c.scale(q.scale,q.scale);c.fillStyle='#21231f';c.beginPath();v.galleryFracture.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.restore();}};
const skirt=S.terrainSkirt;S.terrainSkirt=function(c,b,w,h){if(active(b))return;return skirt.call(this,c,b,w,h);};
const zones=S.surfaceZones;S.surfaceZones=function(c,b){if(active(b))return;return zones.call(this,c,b);};
const tone=S.environmentTone;S.environmentTone=function(c,w,h,b){if(active(b))return;return tone?.call(this,c,w,h,b);};
const marker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(active(scene.battle)&&m.type==='hauntHabitat'){const c=scene.ctx;c.save();c.fillStyle='#332f2b99';c.beginPath();c.ellipse(m.x,m.y-4,24,8,0,0,Math.PI*2);c.fill();c.fillStyle='#9a7964';for(const dx of[-5,5]){c.beginPath();c.arc(m.x+dx,m.y-8,1.5,0,Math.PI*2);c.fill();}c.restore();return true;}return marker.call(this,scene,m);};
// The goal body remains the same fixed damageable unit. Its closed door is
// already in the whole painting; keep only the established durability overlay.
const body=S.unitBody;S.unitBody=function(c,u,...args){if(active(this.battle)&&u.id==='objective')return;return body.call(this,c,u,...args);};
const unit=S.unit;S.unit=function(c,u,...args){if(!active(this.battle)||u.id!=='objective')return unit.call(this,c,u,...args);if(u.dead)return;const z=1/Math.max(.05,this.scale),w=86;c.save();c.translate(u.x,u.y-u.h-18);c.scale(z,z);c.fillStyle='#13232a';c.fillRect(-w/2-2,-2,w+4,9);c.fillStyle='#cab47c';c.fillRect(-w/2,0,w*Math.max(0,u.hp/u.maxHp),5);c.restore();};
const key=S._worldCacheKey;S._worldCacheKey=function(b,w){return key.call(this,b,w)+(active(b)?':stage4-image-first1:'+Number(!!b.terrain.find(t=>t.id==='burned-gallery')?.broken)+':'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage4-image-first',active,naturalEdges:true,cachedWorld:true});G.HonroStage4ImageFirstArt={active,ready,cacheStats:()=>({...L.cacheStats(),requestedImages:['quietFar','stage4QuietNear'].filter(id=>P.images[id]).length,maxImages:2})};
})(globalThis);
