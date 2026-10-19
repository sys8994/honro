(function(G){'use strict';
// Whole original place panels at ONE uniform art transform. Collision is
// independent authored gameplay data; it is never a paint mask or texture UV.
const S=G.HonroScene.prototype,P=G.HonroPaintedPilots;
const active=b=>b?.honroStage===1&&!b.honroCustom&&b.honroMap?.stage1ImageFirst?.revision===1;
const state=b=>(b.terrain.find(t=>t.id==='pine-branch-west')?.broken?1:0)|(b.terrain.find(t=>t.id==='pine-branch-east')?.broken?2:0);
const names=['stage1Place','stage1PlaceWestBroken','stage1PlaceEastBroken'],patches=new Map();
const boughPatches=[{bit:1,id:names[1],rect:[275,375,245,100]},{bit:2,id:names[2],rect:[540,365,320,110]}];
function ready(b){if(!active(b))return false;P.request([names[0],...boughPatches.filter(p=>state(b)&p.bit).map(p=>p.id)]);return P.ready(names[0]);}
function patch(p){if(patches.has(p.id))return patches.get(p.id);const [x,y,w,h]=p.rect,cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');c.drawImage(P.images[p.id],x,y,w,h,0,0,w,h);c.globalCompositeOperation='destination-in';
 for(const [x0,y0,x1,y1,size]of [[0,0,w,0,w],[0,0,0,h,h]]){const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'#0000');g.addColorStop(6/size,'#000');g.addColorStop(1-6/size,'#000');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,w,h);}
 patches.set(p.id,cv);return cv;
}
function frame(scene,w,h,b){const a=b.honroMap.stage1ImageFirst.artBounds,scale=Math.max(w/(a.right-a.left),h/(a.bottom-a.top));scene.scale=Math.max(scale,scene.scale);const hw=w/(2*scene.scale),hh=h/(2*scene.scale);scene.x=Math.max(a.left+hw,Math.min(a.right-hw,scene.x));scene.y=Math.max(a.top+hh,Math.min(a.bottom-hh,scene.y));}
const oldBackground=S.background;S.background=function(c,w,h,b){if(!active(b))return oldBackground.call(this,c,w,h,b);ready(b);frame(this,w,h,b);const cc=G.HonroVisualStyle.raw(c);cc.fillStyle='#283844';cc.fillRect(0,0,w,h);this.environmentStats={groups:1,visibleAssets:ready(b)?1:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(active(this.battle))return;return oldTerrain.call(this,c,t);};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,ls,layer){const b=this.battle;if(!active(b))return oldLayer.call(this,c,ls,layer);if(layer!=='structural-back'||!ready(b))return;const v=b.honroMap.stage1ImageFirst,q=v.transform;c.drawImage(P.images[names[0]],q.x,q.y,v.source.width*q.scale,v.source.height*q.scale);
 // Original non-bough pixels remain the original panel in every state. Only
 // the two fixed art-space bough neighborhoods receive feathered repair patches.
 for(const p of boughPatches)if((state(b)&p.bit)&&P.ready(p.id)){const [x,y,w,h]=p.rect;c.drawImage(patch(p),q.x+x*q.scale,q.y+y*q.scale,w*q.scale,h*q.scale);}
};
const oldSkirt=S.terrainSkirt;S.terrainSkirt=function(c,b,w,h){if(active(b))return;return oldSkirt.call(this,c,b,w,h);};
const oldZones=S.surfaceZones;S.surfaceZones=function(c,b){if(active(b))return;return oldZones.call(this,c,b);};
// Keep the common pool/contact/ripple implementation, translucently over the
// painted ford. It must not replace a shallow stream with an opaque teal card.
const oldWater=S.liveWater;S.liveWater=function(c,b){if(!active(b))return oldWater.call(this,c,b);c.save();c.globalAlpha*=.13;const result=oldWater.call(this,c,b);c.restore();return result;};
const oldTone=S.environmentTone;S.environmentTone=function(c,w,h,b){if(active(b))return;return oldTone?.call(this,c,w,h,b);};
const oldMarker=G.HonroAct1StoryArt.marker;G.HonroAct1StoryArt.marker=function(scene,m){if(active(scene.battle)&&(m.type==='exit'||m.type==='hauntHabitat'))return true;return oldMarker.call(this,scene,m);};
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':stage1-image-first1:'+state(b)+':'+P.appearanceKey():'');};
G.HonroPaintedPresentation.register({id:'stage1-image-first',active,naturalEdges:true,cachedWorld:true});
G.HonroStage1ImageFirstArt={active,ready,frame,cacheStats:()=>({filterPasses:0,requestedImages:names.filter(id=>P.images[id]).length,maxImages:3,boughPatches:patches.size})};
})(globalThis);
