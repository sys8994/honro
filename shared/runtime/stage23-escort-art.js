(function(G){'use strict';
// Exact authored polygons and one translated cargo drawing. Story owns timing;
// this pass cannot move an actor, change geography, or write a saved value.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap(),skyCache=new WeakMap();
const active=b=>b?.honroStage===23&&!b.honroCustom&&b.honroEscortYardRevision===1;
const reduced=G.matchMedia?.('(prefers-reduced-motion: reduce)');
const state=b=>b.honroState?.escortYard||{},spec=b=>b.honroEscortYardSpec?.cargo||{};
function path(ps){const p=new Path2D();ps.forEach((v,i)=>i?p.lineTo(v.x??v[0],v.y??v[1]):p.moveTo(v.x??v[0],v.y??v[1]));p.closePath();return p;}
function shape(t,b){let q=cache.get(t);if(q?.vertices===t.vertices&&q.version===b.sceneVersion)return q;
 const ps=C.poly(t),profile=t.id==='sy-ground'?b.honroMap?.act3?.primaryContour:null;
 // The extended v6 polygon starts outside Play Bounds. Its vertex indices are
 // not the authored road indices; paint only the actual contour's top edge.
 const pairs=profile?profile.slice(1).map((z,i)=>[profile[i],z].map(p=>({x:p[0],y:p[1]}))):(t.honroWalkEdges||[]).map(i=>[ps[i],ps[(i+1)%ps.length]]);
 const edges=pairs.filter(([a,z])=>a&&z&&Math.abs(a.x-z.x)>.001&&Math.abs((a.y-z.y)/(a.x-z.x))<=1.35),rim=new Path2D();for(const[a,z]of edges){rim.moveTo(a.x,a.y+7);rim.lineTo(z.x,z.y+7);}
 q={vertices:t.vertices,version:b.sceneVersion,body:path(ps),edges,rim};cache.set(t,q);return q;
}
function terrain(c,t,b){if(!active(b)||!t.id?.startsWith('sy-'))return false;
 // The bound bundle asset is the visible body of both collision poses.
 if(t.id==='sy-cargo-stored'||t.id==='sy-cargo-settled')return true;
 const q=shape(t,b),earth=t.id==='sy-ground',wood=t.mat==='wood',stone=/bridge|pier|corner/.test(t.id),top=earth?4100:t.y,depth=earth?2200:Math.max(24,Math.min(850,t.h));
 // Local vertical values, never the huge v6 world-bound width/height, own tone.
 const g=c.createLinearGradient(0,top,0,top+depth);g.addColorStop(0,wood?'#ab9868':earth?'#727e65':'#88937a');g.addColorStop(.38,wood?'#7b6c48':earth?'#54674f':'#667d62');g.addColorStop(1,earth?'#304c40':'#3f5948');
 c.save();c.clip(q.body);c.fillStyle=g;c.fill(q.body);
 if(earth){
  // A broad worn road and its compacted earth shoulder follow every true
  // incline; the water-cut cliffs deliberately receive no walkable rim.
  for(const[a,z]of q.edges){c.fillStyle='#9b9e7d';c.fill(path([[a.x,a.y],[z.x,z.y],[z.x,z.y+43],[a.x,a.y+43]]));c.fillStyle='#758367';c.fill(path([[a.x,a.y+43],[z.x,z.y+43],[z.x,z.y+112],[a.x,a.y+112]]));}
 }else if(wood){c.strokeStyle='#3d4a36';c.lineWidth=4;for(const f of [.19,.46,.81]){const x=t.x+t.w*f;c.beginPath();c.moveTo(x,t.y);c.lineTo(x+6,t.y+t.h);c.stroke();}}
 else if(stone){
  // Human-scale dressed courses tie each true solid core to the rear masonry.
  const rows=Math.max(1,Math.ceil(t.h/150));c.strokeStyle='#354d3d99';c.lineWidth=5;
  for(let row=1;row<rows;row++){const y=t.y+t.h*row/rows;c.beginPath();c.moveTo(t.x,y);c.lineTo(t.x+t.w,y+4);c.stroke();}
  for(let row=0;row<rows;row++)for(const f of row%2?[.32,.76]:[.53]){const x=t.x+t.w*f,y=t.y+t.h*row/rows;c.beginPath();c.moveTo(x,y+6);c.lineTo(x+3,y+t.h/rows-5);c.stroke();}
  if(t.id==='sy-stone-corner'){c.fillStyle='#9ca183';c.fill(path([[t.x,t.y],[t.x+24,t.y],[t.x+24,t.y+t.h],[t.x,t.y+t.h]]));c.fillStyle='#314a3c66';c.fill(path([[t.x+t.w-30,t.y],[t.x+t.w,t.y],[t.x+t.w,t.y+t.h],[t.x+t.w-30,t.y+t.h]]));}
 }
 c.strokeStyle=wood?'#c9b88b99':earth?'#c3bea078':'#bdc0a278';c.lineWidth=earth?9:7;c.stroke(q.rim);c.restore();return true;
}
const originalTerrain=S.terrain;S.terrain=function(c,t){if(terrain(c,t,this.battle))return;return originalTerrain.call(this,c,t);};
const skyAsset=b=>b.honroMap?.escortYardArt?.backdropAsset;
function skyRaster(asset){let q=skyCache.get(asset);if(q)return q;const cv=G.document.createElement('canvas'),[x,y,w,h]=asset.vector.viewBox;cv.width=1800;cv.height=1080;const c=cv.getContext('2d');c.scale(cv.width/w,cv.height/h);c.translate(-x,-y);G.HonroVectorArt.draw(c,asset,{x:0,y:0,scale:1,rotation:0});skyCache.set(asset,cv);return cv;}
const background=S.background;S.background=function(c,w,h,b){if(!active(b)||!skyAsset(b))return background.call(this,c,w,h,b);const cv=skyRaster(skyAsset(b)),frame=G.HonroEnvironment.act1BackdropFrame(this,w,h,b,cv.width,cv.height);c.drawImage(cv,frame.x,frame.y,frame.w,frame.h);this.environmentStats={groups:0,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};};
function motion(b){const s=state(b),ps=spec(b).path||[],u=s.status==='settled'?1:s.status==='sliding'?(reduced?.matches?0:Math.max(0,Math.min(1,(s.elapsed||0)/(s.duration||1)))):0;if(ps.length<2)return{x:0,y:0,progress:u};
 const lengths=ps.slice(1).map((p,i)=>Math.hypot(p.x-ps[i].x,p.y-ps[i].y)),total=lengths.reduce((a,z)=>a+z,0);let remaining=total*(u*u*(3-2*u));for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]||i===lengths.length-1){const f=lengths[i]?Math.min(1,remaining/lengths[i]):1;return{x:ps[i].x+(ps[i+1].x-ps[i].x)*f-ps[0].x,y:ps[i].y+(ps[i+1].y-ps[i].y)*f-ps[0].y,progress:u};}remaining-=lengths[i];}return{x:0,y:0,progress:u};}
function body(b){return b.honroLandmarks?.find(l=>l.id===(spec(b).elementId||'sy-art-cargo'));}
function drawBody(c,l,m){c.save();c.translate(m.x,m.y);G.HonroVectorArt.draw(c,l.asset,l);c.restore();return true;}
const landmarks=S._landmarkLayer;S._landmarkLayer=function(c,list,layer){const b=this.battle;if(!active(b))return landmarks.call(this,c,list,layer);const id=spec(b).elementId||'sy-art-cargo',l=list.find(l=>l.id===id),out=landmarks.call(this,c,list.filter(l=>l.id!==id),layer);if(l&&layer===(l.layer||'back')&&state(b).status!=='sliding')drawBody(c,l,motion(b));return out;};
// The loading trough sits behind the narrow upper front walkway. Repaint only
// its actual 24-unit solid strip over the moving rear bundle, before actors and
// aiming guides. Its occupants are still part of the unchanged safety sweep.
function cargoForeground(c,b){const t=b.terrain.find(t=>t.id==='sy-west-upper');if(!t||t.broken)return;terrain(c,t,b);}
const live=S.liveWater;S.liveWater=function(c,b){const out=live?.call(this,c,b);if(active(b)&&state(b).status==='sliding'){const l=body(b);if(l?.asset){drawBody(c,l,motion(b));cargoForeground(c,b);}}return out;};
const omitReadability=(group,b)=>active(b)&&['sy-cargo-stored','sy-cargo-settled'].includes(group.id);
G.HonroStage23EscortArt={active,shape,terrain,skyAsset,skyRaster,motion,body,drawBody,cargoForeground,omitReadability};
})(globalThis);
