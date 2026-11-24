(function(G){'use strict';
// Display only. (1) Flat contact shadow under enlarged monsters (no gradient:
// vector art rule). (2) Stage 16 (잠운사): the great darkness half-seen in the
// dark cavern behind the floor, a non-hostile omen of the stage-46 encounter
// (temporary eoduksini3 art). Chosen with the user: Act 2 deep cave.
const S=G.HonroScene?.prototype;if(!S?.unitBody)return;
const OMEN={16:{x:4300,y:3480,m:13,sink:.04,alpha:.3}};G.HonroMonsterOmen=OMEN;
function omen(scene,c){
 const b=scene.battle||scene.actorEngine?.b,o=(b?.honroMonsterScaleRevision===1||b?.honroMonsterScaleRevision===2)&&OMEN[b.honroStage];if(!o)return;
 const V=G.HonroMonsterVisual,a=V?.assets?.eoduksini3;if(!a)return;
 const h=o.m*60.6,scale=h/a.baseHeight;
 c.save();c.beginPath();c.rect(o.x-h,o.y-h*1.2,h*2,h*1.2);c.clip(); // rises out of the water line
 c.globalAlpha*=(o.alpha??.2)+.04*Math.sin((scene.time||0)*.6);c.translate(o.x,o.y+h*(o.sink??.22));c.scale(-scale,scale);
 const m=c.getTransform(),ratio=c.canvas.clientWidth?c.canvas.width/c.canvas.clientWidth:1;
 V.draw(c,'eoduksini3',{time:scene.time||0,state:{},pixels:a.baseHeight*Math.hypot(m.c,m.d)/ratio});c.restore();
}
let frame=0;const raf=G.requestAnimationFrame?.bind(G);if(raf){const loop=()=>{frame++;raf(loop);};raf(loop);}
const body=S.unitBody;
S.unitBody=function(c,u,...args){
 if(this._honroOmenFrame!==frame){this._honroOmenFrame=frame;try{omen(this,c);darkness();}catch{}}
 const sc=u?.honroMonsterScale;
 if(sc&&!sc.kept&&u.side===1&&u.h>=180&&!u.dead&&!u.airborne&&!u.fixed){
  const w=Math.max(u.r*1.5,u.h*.2);c.save();c.fillStyle='rgba(12,14,16,.28)';c.beginPath();c.ellipse(u.x,u.y+2,w,Math.max(6,w*.14),0,0,Math.PI*2);c.fill();c.restore();
 }
 return body.call(this,c,u,...args);
};
// The great darkness always uses the full-height rig (its body h is the drawn
// height). Installed after every art module so later unitBody wrappers that
// dispatch monsters themselves cannot draw the smaller growth forms instead.
function darkness(){
 const inner=S.unitBody;if(inner.honroDarkness)return;// re-wraps if a later module replaced it
 S.unitBody=function(c,u,...args){
  if(u?.honroGreatDarkness&&!u.dead){const V=G.HonroMonsterVisual,a=V?.assets?.eoduksini3;if(a){
   c.save();c.translate(u.x,u.y);const k=u.h/a.baseHeight;c.scale(k*(u.facing||1),k);const m=c.getTransform(),ratio=c.canvas.clientWidth?c.canvas.width/c.canvas.clientWidth:1;
   V.draw(c,'eoduksini3',{time:this.time||0,state:V.state?.(u)||{},pixels:a.baseHeight*Math.hypot(m.c,m.d)/ratio});c.restore();return;}}
  return inner.call(this,c,u,...args);
 };S.unitBody.honroDarkness=true;
}
G.HonroMonsterScaleArt={install:darkness}; // called from the mission tick, after all modules load
})(globalThis);
