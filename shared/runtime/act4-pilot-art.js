(function(G){'use strict';
if(G.HonroAct4PilotArt)return;
// Art-only opt-in. Ordinary Scene layers and their world/domain caches remain
// authoritative. No collision, actor, event, or authored instance is rewritten.
const layers=Object.freeze({background:'back',structure:'structural-back',body:'mid',rear:'prop',front:'front'});
function config(b){const q=b?.honroMap?.nativeArt;return b?.honroStage>=31&&b.honroStage<=40&&q?.version===1&&Array.isArray(q.coveredTerrainIds)?q:null;}
function validHarbor(h){const finite=v=>Number.isFinite(v)&&Math.abs(v)<=1000000;return !!(h&&['surface','left','right','bottom'].every(k=>finite(h[k]))&&h.right>h.left&&h.right-h.left<=100000&&h.bottom>h.surface&&Array.isArray(h.shore)&&h.shore.length>=2&&h.shore.length<=64&&h.shore.every(p=>Array.isArray(p)&&p.length===2&&p.every(finite)));}
function native(l,b){return !!(config(b)&&Object.hasOwn(layers,l?.nativeArtLayer)&&l.layer===layers[l.nativeArtLayer]&&l.kind==='canonical-element'&&l.asset?.vector&&!l.asset.collision?.length&&!l.collisionIds?.length&&!l.honroElementCollision);}
function terrainIds(l){return Array.isArray(l?.nativeTerrainIds)?l.nativeTerrainIds:(l?.nativeTerrainId?[l.nativeTerrainId]:[]);}
function bodyLive(l,b){const ids=terrainIds(l);return ids.length>0&&new Set(ids).size===ids.length&&ids.every(id=>typeof id==='string'&&b.terrain?.some(t=>t.id===id&&!t.broken));}
function covered(t,b){const q=config(b);return !!(q&&q.coveredTerrainIds.includes(t.id)&&!t.honroElementCollision&&(b.honroLandmarks||[]).some(l=>native(l,b)&&l.nativeArtLayer==='body'&&bodyLive(l,b)&&terrainIds(l).includes(t.id)&&(l.opacity??1)===1));}
// Only a resolved moving return ferry replaces its collision deck's paint.
function movingDeckCovered(t,b){const id=b?.honroMap?.vectorReturnBoatAssetId;return !!(config(b)&&b.honroAct4Preview===40&&b.honroAct4Design?.geometry40&&t?.id==='a4-return-deck'&&t.honroAct4MovingDeck===true&&(b.honroAct4PreviewDynamic||[]).some(l=>l.asset?.id==='a4:boat'&&(l.opacity??1)===1)&&typeof id==='string'&&G.HONRO_PROJECT?.library?.some(a=>a.id===id&&a.vector&&!a.collision?.length));}
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
 const terrain=S.terrain;S.terrain=function(c,t,...args){if(covered(t,this.battle)||movingDeckCovered(t,this.battle))return;return terrain.call(this,c,t,...args);};
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
 const water=S.liveWater;S.liveWater=function(c,b,...args){const out=water?.call(this,c,b,...args),harbor=b.honroMap?.act4?.harborWater;
  const sea=harbor?.continuousSea,rect=this.canvas?.getBoundingClientRect?.(),vw=rect?.width??this.canvas?.clientWidth,vh=rect?.height??this.canvas?.clientHeight;
  const continuous=(b.honroStage===31||(b.honroStage===40&&sea?.stage40===true))&&config(b)&&validHarbor(harbor)&&sea?.version===1&&Number.isFinite(sea.depth)&&sea.depth>=300&&sea.depth<=10000&&Number.isFinite(vw)&&Number.isFinite(vh)&&vw>0&&vh>0&&Number.isFinite(this.scale)&&this.scale>0&&Number.isFinite(this.x)&&Number.isFinite(this.y)&&!!G.HonroBounds?.viewport;
  if(continuous){const view=G.HonroBounds.viewport(this,vw,vh),left=view.left-8/this.scale,right=view.right+8/this.scale,bottom=Math.max(harbor.surface,view.bottom+8/this.scale),depthEnd=harbor.surface+sea.depth;c.save();const gradient=c.createLinearGradient(0,harbor.surface,0,depthEnd);gradient.addColorStop(0,'#456b85d9');gradient.addColorStop(.45,'#244963e8');gradient.addColorStop(1,'#16384fff');c.fillStyle=gradient;c.fillRect(left,harbor.surface,right-left,bottom-harbor.surface);c.strokeStyle='#a4c4d145';c.lineWidth=3;for(let j=0;j<6;j++){const yy=harbor.surface+12+j*j*17;c.beginPath();for(let x=Math.floor(left/24)*24;x<=right+24;x+=24){const y=yy+Math.sin(x*.008+(this.time||0)*.7+j)*3;if(x===Math.floor(left/24)*24)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();}c.restore();}
  else if(config(b)&&validHarbor(harbor)){c.save();c.beginPath();c.moveTo(harbor.shore[0][0],harbor.surface);c.lineTo(harbor.right,harbor.surface);c.lineTo(harbor.right,harbor.bottom);for(const p of [...harbor.shore].reverse())c.lineTo(p[0],p[1]);c.closePath();c.clip();const gradient=c.createLinearGradient(0,harbor.surface,0,harbor.bottom);gradient.addColorStop(0,'#456b85d9');gradient.addColorStop(.45,'#244963e8');gradient.addColorStop(1,'#16384fed');c.fillStyle=gradient;c.fillRect(harbor.left-400,harbor.surface,harbor.right-harbor.left+800,harbor.bottom-harbor.surface);c.strokeStyle='#a4c4d145';c.lineWidth=3;for(let j=0;j<6;j++){const yy=harbor.surface+12+j*j*17;c.beginPath();for(let x=harbor.left-300;x<harbor.right;x+=24){const y=yy+Math.sin(x*.008+(this.time||0)*.7+j)*3;if(x===harbor.left-300)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();}c.restore();}
  const boat=this._nativeArtDeferredBoat;this._nativeArtDeferredBoat=null;if(config(b)&&boat)this.landmark(c,boat);return out;};
 const tone=S.environmentTone;S.environmentTone=function(c,w,h,b,...args){if(config(b)?.preservePalette===true)return;return tone?.call(this,c,w,h,b,...args);};
 const cacheKey=S._worldCacheKey;S._worldCacheKey=function(b,...args){const q=config(b);return cacheKey.call(this,b,...args)+(q?':native-art-1:'+JSON.stringify(q):'');};
}
G.HonroAct4PilotArt={layers,config,native,covered,movingDeckCovered,validateStage};
})(globalThis);
