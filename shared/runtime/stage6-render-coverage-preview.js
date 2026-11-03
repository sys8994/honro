(function(G){'use strict';
// Preview-only: added to the browser bundle only by the explicit Stage 6 art
// diagnostic build. Nothing here mutates battle, save, terrain, or art objects.
if(G.HonroStage6RenderCoveragePreview)return;
const EXPECTED=Object.freeze({
 west:{terrain:'14592f4c3c4d3ddd12e6f3021bb3da8507da0a2eec02b5da7c540a8089c5d452',skin:'afdaa133ce8ecc57584e478abffdc283f6c92fd19a65c77c474d96d8f261bb3a'},
 east:{terrain:'9cd0c807fd7b51370695f97b42f1f6c296ace5b8b3a95c2cdd874409095a0c6f',skin:'83d1532aa637b4a1283fcfdda60569f8b09d80485a41db9313ecaa1925d6f26a'}
});
const states=new WeakMap();let epoch=0;
function geo(t){return{id:t.id,vertices:t.vertices,x:t.x,y:t.y,w:t.w,h:t.h,broken:t.broken,mat:t.mat,oneWay:t.oneWay,honroElementCollision:t.honroElementCollision};}
function digest(s){if(!G.crypto?.subtle||typeof G.TextEncoder!=='function')return Promise.reject(Error('SHA-256 unavailable'));return G.crypto.subtle.digest('SHA-256',new G.TextEncoder().encode(s)).then(a=>Array.from(new Uint8Array(a),x=>x.toString(16).padStart(2,'0')).join(''));}
function validBase(b){return !!(b&&b.honroStage===6&&b.honroCustom!==true&&b.honroCanonical===true&&b.honroAuthoredId==='stage-6'&&b.honroMapOrigin==='campaign'&&b.honroMapRevision===20&&b.honroCampaignMapRevision===3);}
function record(b,name){
 if(!validBase(b)||!Object.hasOwn(EXPECTED,name)||!G.HonroVectorArt?.draw||!G.HonroVectorArt?.validate||!G.HonroVectorArt?.prepare||!G.HonroTerrainDomain?.render)return null;
 let ts,ls;try{ts=G.HonroTerrainDomain.render(b).filter(t=>t.id==='pier-'+name);ls=(b.honroLandmarks||[]).filter(l=>l.id==='stage06-prototype-pier-'+name);}catch{return null;}
 if(ts.length!==1||ls.length!==1)return null;const t=ts[0],l=ls[0],a=l.asset;
 if(t.broken||t.honroElementCollision||l.kind!=='canonical-element'||l.layer!=='prop'||l.opacity!=null&&l.opacity!==1||l.honroTerrainMaterialClip||!a?.vector||!Array.isArray(a.collision)||a.collision.length||!Array.isArray(l.collisionIds)||l.collisionIds.length)return null;
 let geometry,skin;try{geometry=JSON.stringify(geo(t));skin=JSON.stringify(l);if(typeof geometry!=='string'||typeof skin!=='string')return null;}catch{return null;}
 let pair=states.get(b);if(!pair){pair=Object.create(null);states.set(b,pair);}let r=pair[name],draw=G.HonroVectorArt.draw,prepare=G.HonroVectorArt.prepare,validate=G.HonroVectorArt.validate;
 if(r&&r.geometry===geometry&&r.skin===skin&&r.draw===draw&&r.prepare===prepare&&r.validate===validate)return r;
 r={geometry,skin,draw,prepare,validate,ready:false,version:++epoch};pair[name]=r;
 Promise.all([digest(geometry),digest(skin)]).then(([gh,sh])=>{
  if(pair[name]!==r||gh!==EXPECTED[name].terrain||sh!==EXPECTED[name].skin)return;
  try{const detached=JSON.parse(skin);if(validate(detached.asset.vector).length)return;prepare(detached.asset.vector);const c=G.document.createElement('canvas');c.width=c.height=16;const ctx=c.getContext('2d');if(!ctx||draw(ctx,detached.asset,detached)!==true)return;r.detached=detached;r.ready=true;r.version=++epoch;}catch{/* Original face remains visible. */}
 }).catch(()=>{});
 return r;
}
function covered(b,t){if(!t||!/^pier-(west|east)$/.test(t.id||''))return false;const name=t.id.slice(5),r=record(b,name);if(!r?.ready)return false;try{return JSON.stringify(geo(t))===r.geometry;}catch{return false;}}
const S=G.HonroScene?.prototype;if(S){const oldTerrain=S.terrain;S.terrain=function(c,t,...args){if(covered(this.battle,t))return;return oldTerrain.call(this,c,t,...args);};
 const oldLandmark=S.landmark;S.landmark=function(c,l,...args){const m=/^stage06-prototype-pier-(west|east)$/.exec(l?.id||''),r=m&&record(this.battle,m[1]);if(r?.ready){try{return oldLandmark.call(this,c,r.detached,...args);}catch{r.ready=false;r.version=++epoch;const t=G.HonroTerrainDomain?.render(this.battle)?.find(x=>x.id==='pier-'+m[1]);if(t)oldTerrain.call(this,c,t);}}return oldLandmark.call(this,c,l,...args);};
 const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,...args){const base=oldKey.call(this,b,...args),a=record(b,'west'),z=record(b,'east');return base+':s6-preview:'+[a?.version||0,a?.ready?1:0,z?.version||0,z?.ready?1:0].join(':');};}
G.HonroStage6RenderCoveragePreview={covered};
})(globalThis);
