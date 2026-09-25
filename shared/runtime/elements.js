(function(G){'use strict';
const Scene=G.HonroScene,Q=G.HonroGeometry;
const nativeLandmark=Scene.prototype.landmark;
function draw(c,asset,inst,scene){
 c.save();
 if(asset.renderer==='landmark'){
  c.translate(inst.x,inst.y);c.rotate(inst.rotation||0);c.scale(inst.scale??1,inst.scale??1);
  nativeLandmark.call(scene,c,{...inst,kind:asset.kind,x:0,y:0,size:1});
 }else for(const sh of Q.shapes(asset,inst)){
  c.beginPath();sh.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));if(sh.closed!==false)c.closePath();
  c.save();c.globalAlpha*=sh.alpha??1;if(sh.fill){c.fillStyle=sh.fill;c.fill();}if(sh.stroke){c.strokeStyle=sh.stroke;c.lineWidth=sh.lineWidth??1.5;c.stroke();}c.restore();
 }
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
