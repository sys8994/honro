(function(G){'use strict';
// Immutable vector primitives: Scene.time changes transforms and opacity only.
// Canvas clip() is the native equivalent of SVG clipPath in this renderer.
const E=G.HonroEnvironment,paths=new Map(),cards=new Map(),waterPaths=new WeakMap();
const reduced=G.matchMedia?.('(prefers-reduced-motion: reduce)');
function path(key,d){if(!paths.has(key))paths.set(key,new Path2D(d));return paths.get(key);}
function color(hex,alpha){return hex+Math.round(Math.max(0,Math.min(1,alpha))*255).toString(16).padStart(2,'0');}
function gradient(c,x,y,xx,yy,stops){const g=c.createLinearGradient(x,y,xx,yy);for(const [at,col]of stops)g.addColorStop(at,col);return g;}
function glow(c,x,y,rx,ry,tint,alpha){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,.02,0,0,1);g.addColorStop(0,color(tint,alpha));g.addColorStop(.3,color(tint,alpha*.32));g.addColorStop(1,color(tint,0));c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();}
function fogCard(tint){if(cards.has(tint))return cards.get(tint);const cv=document.createElement('canvas');cv.width=512;cv.height=128;const c=cv.getContext('2d');
 for(const [x,y,rx,ry,a]of [[190,68,200,55,.42],[300,57,172,50,.37],[380,76,130,40,.24]])glow(c,x,y,rx,ry,tint,a);
 cards.set(tint,cv);if(cards.size>24)cards.delete(cards.keys().next().value);return cv;
}
function fog(c,x,y,w,h,tint,alpha,time=0,speed=0){c.save();c.globalAlpha*=alpha;c.drawImage(fogCard(tint),x-w/2+Math.sin(time*.07)*speed,y-h/2,w,h);c.restore();}
function shaft(c,x,y,w,h,tint,alpha,time=0){c.save();c.translate(x,y);c.scale(w,h);c.globalAlpha*=alpha*(.92+.08*Math.sin(time*.13));c.fillStyle=gradient(c,0,0,0,1,[[0,color(tint,.45)],[.32,color(tint,.22)],[1,color(tint,0)]]);c.fill(path('shaft','M-.12 0 L.12 0 L1.3 1 L.18 1 Z'));c.restore();}
function waterfall(c,x,y,width,height,a,time,{staticOnly=false}={}){
 c.save();c.translate(x,y);c.scale(width/100,height/540);
 const body=path('fall','M-30 0 L19 0 C15 110 34 270 28 350 L48 534 Q0 544 -49 534 L-34 358 C-29 196 -43 101 -30 0 Z');
 c.save();c.clip(body);c.fillStyle=gradient(c,-45,0,48,0,[[0,a.waterBaseColor],[.35,E.mixColor(a.waterBaseColor,a.waterHighlightColor,.52)],[.56,E.mixColor(a.waterBaseColor,a.waterHighlightColor,.30)],[.84,a.waterBaseColor],[1,E.mixColor(a.shadowTint,a.waterBaseColor,.6)]]);c.fillRect(-70,0,140,550);
 if(!staticOnly){const ribbon=path('ribbon','M0 0 C-3 35 5 74 2 114 L9 140 C13 94 6 50 9 0 Z');
  for(let i=0;i<5;i++)for(let j=-1;j<4;j++){c.save();c.translate(-28+i*14,j*170+(time*(83+i*11)+i*71)%170);c.scale(.55+i%3*.28,1);c.globalAlpha*=.25+(i%2)*.17;c.fillStyle=i%2?a.waterHighlightColor:a.waterfallFoamColor;c.fill(ribbon);c.restore();}}
 c.restore();c.strokeStyle=color(a.waterfallFoamColor,.75);c.lineWidth=2;c.stroke(path('lip','M-33 2 Q-10 -4 21 2'));
 if(!staticOnly){const foam=path('foam','M-1 0 Q-.55 -.2 -.2 -.06 Q.08 -.3 .38 -.09 Q.65 -.2 1 0 Q.45 .2 0 .13 Q-.5 .25 -1 0 Z');
  for(let i=0;i<4;i++){const phase=(time*.48+i*.25)%1;c.save();c.translate((i-1.5)*13,534-phase*16);c.scale(24+phase*40,9+phase*12);c.globalAlpha*=.48*(1-phase);c.fillStyle=a.waterfallFoamColor;c.fill(foam);c.restore();}}
 c.restore();if(!staticOnly)fog(c,x,y+height,width*3,width*.85,a.farFogColor,a.mistStrength+.25,time,10);
}
function poolData(z){if(waterPaths.has(z))return waterPaths.get(z);const p=new Path2D(),pts=z.points;pts.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=z.surface?.[0]?.[1]??Math.min(...ys),bottom=Math.max(...ys),edge=new Path2D();edge.moveTo(left,top);edge.bezierCurveTo(left+(right-left)*.3,top+3,left+(right-left)*.7,top-2,right,top);const data={clip:p,edge,left,right,top,bottom};waterPaths.set(z,data);return data;}
function pool(c,z,a,time){if(!z.points?.length)return;const q=poolData(z),{left,right,top,bottom}=q,w=right-left,h=Math.max(20,bottom-top);c.save();c.clip(q.clip);
 c.fillStyle=gradient(c,0,top,0,bottom,[[0,E.mixColor(a.waterBaseColor,a.waterHighlightColor,.28)],[.24,a.waterBaseColor],[1,a.shadowTint]]);c.fillRect(left,top,w,h);
 // Five broad highlights, regardless of pool width; no per-frame wave mesh.
 const ripple=path('ripple','M-1 0 C-.75 -.5 -.4 .6 0 0 S.7 -.5 1 0');
 for(let i=0;i<5;i++){c.save();const phase=(time*(.055+i*.006)+i*.21)%1;c.translate(left+w*(.15+phase*.75),top+5+i*Math.min(12,h*.12));c.scale(w*(.12+(i%3)*.06),2+i*.35);c.globalAlpha*=.24+Math.sin(phase*Math.PI)*.40;c.strokeStyle=i%2?a.waterHighlightColor:a.waterfallFoamColor;c.lineWidth=1.1;c.stroke(ripple);c.restore();}
 c.fillStyle=gradient(c,left+w*.6,top,left+w*.6,top+h*.7,[[0,color(a.keyLightColor,.17)],[1,color(a.keyLightColor,0)]]);c.fillRect(left+w*.61,top,w*.16,h*.7);
 c.strokeStyle=color(a.shadowTint,.85);c.lineWidth=4;c.stroke(q.edge);c.strokeStyle=color(a.waterHighlightColor,.70);c.lineWidth=1.5;c.stroke(q.edge);c.restore();
}
G.HonroEnvironmentArt={color,gradient,glow,fog,shaft,waterfall,pool,poolData,time:scene=>reduced?.matches?1.2:scene.time,stats:()=>({paths:paths.size,fogCards:cards.size,fogBytes:cards.size*512*128*4})};
})(globalThis);
