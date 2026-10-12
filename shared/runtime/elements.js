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
G.HonroElements={draw,nativeLandmark};
})(globalThis);
