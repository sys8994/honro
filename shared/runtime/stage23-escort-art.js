(function(G){'use strict';
// Exact authored polygons and one translated cargo drawing. Story owns timing;
// this pass cannot move an actor, change geography, or write a saved value.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap(),skyCache=new WeakMap();
const active=b=>b?.honroStage===23&&!b.honroCustom&&b.honroEscortYardRevision===1;
const reduced=G.matchMedia?.('(prefers-reduced-motion: reduce)');
const state=b=>b.honroState?.escortYard||{},spec=b=>b.honroEscortYardSpec?.cargo||{};
function path(ps){const p=new Path2D();ps.forEach((v,i)=>i?p.lineTo(v.x??v[0],v.y??v[1]):p.moveTo(v.x??v[0],v.y??v[1]));p.closePath();return p;}
function shape(t,b){let q=cache.get(t);if(q?.vertices===t.vertices&&q.version===b.sceneVersion)return q;const ps=C.poly(t),edges=(t.honroWalkEdges||[]).map(i=>[ps[i],ps[(i+1)%ps.length]]).filter(([a,z])=>a&&z&&Math.abs(a.x-z.x)>.001),rim=new Path2D();for(const[a,z]of edges){rim.moveTo(a.x,a.y+7);rim.lineTo(z.x,z.y+7);}q={vertices:t.vertices,version:b.sceneVersion,body:path(ps),edges,rim};cache.set(t,q);return q;}
function terrain(c,t,b){if(!active(b)||!t.id?.startsWith('sy-'))return false;
 // The bound bundle asset is the visible body of both collision poses.
 if(t.id==='sy-cargo-stored'||t.id==='sy-cargo-settled')return true;
 const q=shape(t,b),wood=t.mat==='wood',g=c.createLinearGradient(t.x,t.y,t.x+t.w*.08,t.y+Math.min(2000,t.h));g.addColorStop(0,wood?'#b2a073':'#9ca59a');g.addColorStop(.2,wood?'#7b7155':'#748b84');g.addColorStop(.62,wood?'#4c5447':'#42646a');g.addColorStop(1,'#243f4d');c.save();c.clip(q.body);c.fillStyle=g;c.fill(q.body);
 // Broad supported foundations stay legible at the tactical zoom. Timber
 // deck joints differ from the larger irregular dressed-stone bridge blocks.
 if(wood){c.strokeStyle='#3d4a41';c.lineWidth=4;for(const f of [.19,.46,.81]){const x=t.x+t.w*f;c.beginPath();c.moveTo(x,t.y);c.lineTo(x+6,t.y+t.h);c.stroke();}}
 else if(/bridge|pier|reflector/.test(t.id)){c.strokeStyle='#304f5577';c.lineWidth=6;for(const f of [.34,.72]){c.beginPath();c.moveTo(t.x,t.y+t.h*f);c.lineTo(t.x+t.w,t.y+t.h*f+6);c.stroke();}for(const [x,y,h]of [[.23,0,.34],[.63,0,.34],[.46,.34,.38],[.81,.34,.38],[.31,.72,.28]]){c.beginPath();c.moveTo(t.x+t.w*x,t.y+t.h*y);c.lineTo(t.x+t.w*x+4,t.y+t.h*(y+h));c.stroke();}}
 else{c.fillStyle='#193c4b31';c.fill(path([[t.x,t.y+t.h*.35],[t.x+t.w*.38,t.y+t.h*.44],[t.x+t.w*.64,t.y+t.h*.33],[t.x+t.w,t.y+t.h*.51],[t.x+t.w,t.y+t.h],[t.x,t.y+t.h]]));}
 c.strokeStyle=wood?'#d4c59999':'#d0d2b878';c.lineWidth=12;c.stroke(q.rim);c.restore();return true;
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
const live=S.liveWater;S.liveWater=function(c,b){const out=live?.call(this,c,b);if(active(b)&&state(b).status==='sliding'){const l=body(b);if(l?.asset)drawBody(c,l,motion(b));}return out;};
const omitReadability=(group,b)=>active(b)&&['sy-cargo-stored','sy-cargo-settled'].includes(group.id);
G.HonroStage23EscortArt={active,shape,terrain,skyAsset,skyRaster,motion,body,drawBody,omitReadability};
})(globalThis);
