(function(G){'use strict';
const Scene=G.HonroScene,E=G.HonroEnvironment;
function polygon(c,shape){const pts=shape.points||[];if(!pts.length)return;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));if(shape.closed!==false)c.closePath();c.save();c.globalAlpha*=shape.alpha??1;if(shape.fill){c.fillStyle=shape.fill;c.fill();}if(shape.stroke){c.strokeStyle=shape.stroke;c.lineWidth=shape.lineWidth||1.5;c.stroke();}c.restore();}
function sky(c,w,h,scene,show=true){const open=scene.sky,g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,open?'#07131a':'#0d1419');g.addColorStop(.62,open?'#15292b':'#1b2526');g.addColorStop(1,open?'#20332d':'#252c2a');c.fillStyle=g;c.fillRect(0,0,w,h);
 if(!open||!show)return;
 // L5 is screen-fixed. It never enters finite-depth projection.
 const x=w*.76,y=h*.18,r=Math.min(w,h)*.030,halo=c.createRadialGradient(x,y,r*.5,x,y,r*5);halo.addColorStop(0,'#bfc5b12a');halo.addColorStop(1,'#bfc5b100');c.fillStyle=halo;c.fillRect(x-r*5,y-r*5,r*10,r*10);c.fillStyle='#bcc1af64';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
}
function drawPlacement(c,e,st,view,w,h){const a=e.asset,r=a?.reference;if(!r)return;const box=E.screenBounds(a,e,view,w,h,st);if(box.x>w+80||box.x+box.w<-80||box.y>h+80||box.y+box.h<-80)return;
 const q=E.screen(view,w,h,st,e.depthLayer,e),z=E.vectorScale(a,e,st,view.scale),tone=E.preset(st).tone[e.depthLayer];c.save();c.globalAlpha=tone;c.translate(q.x,q.y);c.rotate(e.rotation||0);c.scale(z,z);c.translate(-r.foot.x,-r.foot.y);for(const shape of a.visual||[])polygon(c,shape);c.restore();
}
Scene.prototype.background=function(c,w,h,b){const env=b.honroEnvironment;if(!env){c.fillStyle='#101e22';c.fillRect(0,0,w,h);return;}
 const st={backdrop:b.honroBackdrop,environment:env},scene=E.preset(st);sky(c,w,h,scene,env.skyVisible!==false);
 for(const layer of ['L4','L3','L2'])for(const e of env.placements)if(e.depthLayer===layer)drawPlacement(c,e,st,this,w,h);
 // Thin atmospheric wash keeps rear silhouettes below the foreground contrast.
 const wash=c.createLinearGradient(0,h*.55,0,h);wash.addColorStop(0,'#344b4800');wash.addColorStop(1,scene.sky?'#243e3240':'#1f302d38');c.fillStyle=wash;c.fillRect(0,h*.55,w,h*.45);
};
})(globalThis);
