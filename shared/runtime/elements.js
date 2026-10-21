(function(G){'use strict';
const Scene=G.HonroScene,Q=G.HonroGeometry;
const nativeLandmark=Scene.prototype.landmark;
function draw(c,asset,inst,scene){
 const V=G.HonroVisualStyle;if(V)c=V.context(c,V.classify(inst,scene?.battle,asset)==='gameplay'?'gameplay':V.depth(inst,asset));
 if(G.HonroAct2SpatialArt?.element(c,asset,inst,scene))return;
 if(asset.vector&&G.HonroVectorArt?.draw(c,asset,inst))return;
 c.save();
 if(asset.renderer==='landmark'){
  c.translate(inst.x,inst.y);c.rotate(inst.rotation||0);c.scale(inst.scale??1,inst.scale??1);
  nativeLandmark.call(scene,c,{...inst,kind:asset.kind,x:0,y:0,size:1});
 }else {const shapes=Q.shapes(asset,inst);
  // Older filled-polygon collision assets have no authored rim. Underpaint
  // their visible silhouette, never the approximate collision hitbox.
  if(c.honroVisualLayer==='gameplay'&&!shapes.some(sh=>sh.stroke)){
   const m=c.getTransform(),style=G.HonroVisualStyle.STYLE;c.save();c.strokeStyle=style.outline;c.lineWidth=style.outlinePixels/Math.max(.05,Math.hypot(m.a,m.b));c.lineJoin='round';
   for(const sh of shapes)if(sh.fill&&sh.closed!==false&&(sh.alpha??1)>=.95){c.beginPath();sh.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.stroke();}c.restore();
  }
  for(const sh of shapes){
  c.beginPath();sh.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));if(sh.closed!==false)c.closePath();
  c.save();c.globalAlpha*=sh.alpha??1;if(!sh.fill&&sh.closed!==false&&sh.stroke&&asset.tags?.includes('cart')&&c.honroVisualLayer!=='gameplay'){c.fillStyle=G.HonroEnvironment.mixColor(sh.stroke,'#182b31',.6);c.fill();}if(sh.fill){c.fillStyle=sh.fill;const E=G.HonroEnvironment,A=G.HonroEnvironmentArt;if(A&&scene?.battle?.honroEnvironment&&['tree','rock','architecture'].includes(asset.category)&&/^#[0-9a-f]{6}$/i.test(sh.fill)){const a=E.atmosphere({backdrop:scene.battle.honroBackdrop,environment:scene.battle.honroEnvironment}),ys=sh.points.map(p=>p.y),top=Math.min(...ys),bottom=Math.max(...ys);if(bottom>top)c.fillStyle=A.gradient(c,0,top,0,bottom,[[0,E.mixColor(sh.fill,a.keyLightColor,.09)],[.55,sh.fill],[1,E.mixColor(sh.fill,a.shadowTint,.24)]]);}c.fill();}if(sh.stroke){c.strokeStyle=sh.stroke;c.lineWidth=sh.lineWidth??1.5;c.stroke();}c.restore();
 }}
 c.restore();
}
Scene.prototype.landmark=function(c,l){
 if(l.kind==='canonical-element'){
  if(l.collisionIds?.length&&l.collisionIds.every(id=>this.battle?.terrain.find(t=>t.id===id)?.broken))return;
  draw(c,l.asset,l,this);return;
 }
 if(l.rotation){c.save();c.translate(l.x,l.y);c.rotate(l.rotation);nativeLandmark.call(this,c,{...l,x:0,y:0,rotation:0});c.restore();}
 else nativeLandmark.call(this,c,l);
};
const terrain=Scene.prototype.terrain;
Scene.prototype.terrain=function(c,t){if(!t.honroElementCollision)terrain.call(this,c,t);};
// Terrain-face assets share the ordinary asset painter, with two canonical
// clips: the live solid and an inset of its actual walking rim.
const faceClips=new WeakMap();
function terrainFaceClip(t,b,inset){
 let cache=faceClips.get(t);if(!cache||cache.source!==t.vertices||cache.version!==b.sceneVersion||cache.physical!==b.terrain){cache={source:t.vertices,version:b.sceneVersion,physical:b.terrain,paths:new Map()};faceClips.set(t,cache);}if(cache.paths.has(inset))return cache.paths.get(inset);
 const C=G.HONRO_CORE,ps=C.poly(t),physical=b.terrain.find(v=>v.id===t.id)||t,base=C.poly(physical),walk=(physical.honroWalkEdges||[]).flatMap(i=>[base[i],base[(i+1)%base.length]]).filter(Boolean);
 // The common terrain painter continues its rim beyond the play projection.
 // Protect that displayed edge too; it is absent from physical walk vertices.
 if(t.honroDomain)for(const [a,z]of G.HonroAct2SpatialArt?.surfaceEdges(t,b)||[])if(Math.max(a.x,z.x)<=0||Math.min(a.x,z.x)>=b.width)walk.push(a,z);
 const path=points=>{const p=new Path2D();points.forEach((v,i)=>i?p.lineTo(v.x,v.y):p.moveTo(v.x,v.y));p.closePath();return p;};
 const q={solid:path(ps),inset:path(ps.map(p=>({x:p.x,y:p.y+(walk.some(v=>Math.abs(v.x-p.x)<.01&&Math.abs(v.y-p.y)<.01)?inset:0)})))};cache.paths.set(inset,q);return q;
}
// Optional burial of an inserted asset's ground datum. Paint the unchanged
// asset into a bounded cache, then mask only its base; never erase the host.
const faceImages=new Map(),FACE_IMAGE_BYTES=16*1024*1024;let faceImageBytes=0,faceImageBuilds=0;
function drawBuriedFace(c,inst,b,scene){
 const a=inst.asset,box=a.bounds||a.reference.bounds,points=[[box.x,box.y],[box.x+box.w,box.y],[box.x+box.w,box.y+box.h],[box.x,box.y+box.h]].map(([x,y])=>Q.transformPoint({x,y},a,inst));
 const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),w=Math.max(...points.map(p=>p.x))-x,h=Math.max(...points.map(p=>p.y))-y;
 const ratio=Math.min(Math.max(.5,Math.min(2,Math.ceil((scene.scale||1)*4)/4)),Math.sqrt(2e6/(w*h))),key=ratio.toFixed(4)+':'+inst.embedFade+':'+b.sceneVersion+':'+(G.HonroVisualStyle?.key()||'');
 let q=faceImages.get(inst);if(q?.key!==key){if(q){faceImageBytes-=q.bytes;faceImages.delete(inst);}const cv=document.createElement('canvas');cv.width=Math.ceil(w*ratio);cv.height=Math.ceil(h*ratio);const cc=cv.getContext('2d');cc.setTransform(ratio,0,0,ratio,-x*ratio,-y*ratio);draw(cc,a,inst,scene);
  const foot=Q.transformPoint(a.reference.foot,a,inst);cc.setTransform(1,0,0,1,0,0);const mask=cc.createLinearGradient(0,(foot.y-inst.embedFade-y)*ratio,0,(Math.max(foot.y,y+h)-y)*ratio);mask.addColorStop(0,'rgba(0,0,0,1)');mask.addColorStop(1,'rgba(0,0,0,0)');cc.globalCompositeOperation='destination-in';cc.fillStyle=mask;cc.fillRect(0,0,cv.width,cv.height);
  q={key,canvas:cv,x,y,w,h,bytes:cv.width*cv.height*4};while(faceImages.size&&faceImageBytes+q.bytes>FACE_IMAGE_BYTES){const first=faceImages.keys().next().value;faceImageBytes-=faceImages.get(first).bytes;faceImages.delete(first);}faceImageBuilds++;faceImageBytes+=q.bytes;
 }else faceImages.delete(inst);faceImages.set(inst,q);(G.HonroVisualStyle?.raw(c)||c).drawImage(q.canvas,q.x,q.y,q.w,q.h);
}
function drawTerrainFaces(c,t,b,scene){
 if(t.broken||!b?.honroTerrainAttachments?.length)return;for(const inst of b.honroTerrainAttachments){if(inst.terrainId!==t.id)continue;const q=terrainFaceClip(t,b,inst.walkClearance??24);c.save();c.clip(q.solid);c.clip(q.inset);if(inst.embedFade>0)drawBuriedFace(c,inst,b,scene);else draw(c,inst.asset,inst,scene);c.restore();}
}
function coversBlock(t,b,span){return(b.honroTerrainAttachments||[]).some(inst=>{if(!inst.replaceBlocks||inst.terrainId!==t.id)return false;const a=inst.asset,r=a.bounds||a.reference.bounds,xs=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]].map(([x,y])=>Q.transformPoint({x,y},a,inst).x);return Math.max(...xs)>span[0]&&Math.min(...xs)<span[1];});}
G.HonroTerrainAttachments={coversBlock,draw:drawTerrainFaces,clip:terrainFaceClip,stats:()=>({bytes:faceImageBytes,maxBytes:FACE_IMAGE_BYTES,entries:faceImages.size,builds:faceImageBuilds})};
G.HonroElements={draw,nativeLandmark};
})(globalThis);
