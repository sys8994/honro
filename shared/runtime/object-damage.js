(function(G){'use strict';
const C=G.HONRO_CORE;
// Derived from current HP on every frame: repairs and old saves need no new
// field, event history, random seed or static-world cache invalidation.
function stage(t){
 if(t.broken||t.indestructible||!Number.isFinite(t.hp)||t.hp>=9999||!Number.isFinite(t.maxHp)||t.maxHp<=0||t.hp>=t.maxHp)return 0;
 const r=Math.max(0,t.hp/t.maxHp);return r>2/3?1:r>1/3?2:3;
}
function material(t){return ['wood','support','barrel'].includes(t.mat)||t.surfaceKind==='branch'?'wood':['iron','metal'].includes(t.mat)?'metal':['ice','crystal'].includes(t.mat)?'crystal':['earth','soil'].includes(t.mat)?'earth':'stone';}
function path(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));}
function line(c,points,color,width){path(c,points);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function face(c,points,color){path(c,points);c.closePath();c.fillStyle=color;c.fill();}
function draw(c,t,zoom=1){
 const level=stage(t);if(!level)return false;
 const poly=C.poly(t);if(poly.length<3||!(t.w>0)||!(t.h>0))return false;
 const kind=material(t),z=Math.max(.08,zoom),width=Math.min(Math.max(1.4,.85/z),Math.max(1.4,Math.min(t.w,t.h)*.18));
 // Follow the actual top/bottom at each column instead of placing scratches
 // in the empty bounding box of sloped branches or irregular rock polygons.
 const at=(u,v)=>{const x=t.x+t.w*u,ys=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if(a.x===b.x)continue;if(x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x))ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}const top=ys.length?Math.min(...ys):t.y,bottom=ys.length?Math.max(...ys):t.y+t.h;return[x,top+(bottom-top)*v];};
 const points=rows=>rows.map(([u,v])=>at(u,v));
 c.save();path(c,poly.map(p=>[p.x,p.y]));c.closePath();c.clip();c.lineJoin='round';c.lineCap='round';
 const exposed=kind==='wood'?'#af916bbb':kind==='crystal'?'#b4d9d6bb':kind==='metal'?'#a3aaa2a6':kind==='earth'?'#b09a7599':'#a3aaa099';
 const shadow=kind==='wood'?'#181d19c9':kind==='crystal'?'#254852cf':'#152326d9';
 // A few broad worn facets preserve the original silhouette and artwork.
 face(c,points([[.19,.33],[.37,.24],[.52,.36],[.40,.49],[.24,.47]]),kind==='wood'?'#b89a6c35':kind==='metal'?'#ac8f6838':'#a9b0a738');
 if(kind==='wood'){
  line(c,points([[.13,.46],[.31,.40],[.49,.49],[.60,.43]]),exposed,width);
  line(c,points([[.23,.54],[.40,.51],[.54,.55]]),shadow,width);
  if(level>=2){
   face(c,points([[.37,.52],[.48,.33],[.55,.41],[.65,.27],[.61,.57],[.75,.65],[.52,.63]]),'#171e1cc4');
   line(c,points([[.35,.53],[.48,.31],[.55,.39],[.66,.26]]),exposed,width*1.25);
   line(c,points([[.55,.58],[.70,.77],[.88,.69]]),shadow,width*1.5);
  }
  if(level>=3){
   face(c,points([[.55,.02],[.63,.12],[.58,.42],[.66,.65],[.61,.98],[.52,.87],[.56,.59],[.48,.36]]),'#121b19e8');
   line(c,points([[.54,.06],[.57,.31],[.52,.42],[.59,.62],[.55,.89]]),'#c5a579cf',width*1.5);
   line(c,points([[.21,.73],[.31,.80],[.44,.68]]),exposed,width);
  }
 }else if(kind==='metal'){
  // Flattened dents and rubbed metal, rather than stone-like branching cracks.
  face(c,points([[.27,.35],[.43,.25],[.57,.42],[.46,.59],[.31,.55]]),'#192a2b80');
  line(c,points([[.25,.36],[.43,.27],[.55,.41]]),exposed,width);
  if(level>=2){face(c,points([[.40,.58],[.68,.42],[.78,.61],[.61,.79]]),'#152223b8');line(c,points([[.40,.58],[.69,.44],[.77,.59]]),exposed,width*1.5);}
  if(level>=3){face(c,points([[.57,.07],[.67,.14],[.60,.38],[.69,.57],[.57,.87],[.52,.72],[.59,.53],[.51,.32]]),'#101d20ed');line(c,points([[.65,.15],[.58,.38],[.67,.57],[.55,.84]]),'#bbb6a4c9',width*1.4);}
 }else{
  line(c,points([[.27,.23],[.39,.40],[.34,.58]]),shadow,width);
  line(c,points([[.28,.23],[.41,.39],[.36,.58]]),exposed,width*.55);
  if(level>=2){
   line(c,points([[.39,.40],[.59,.47],[.70,.68],[.62,.87]]),shadow,width*1.65);
   line(c,points([[.60,.47],[.70,.30],[.79,.27]]),shadow,width);
   face(c,points([[.40,.39],[.59,.47],[.49,.59],[.32,.57]]),kind==='crystal'?'#b4dedb52':'#bdbaa442');
  }
  if(level>=3){
   face(c,points([[.58,.02],[.64,.21],[.58,.43],[.66,.60],[.60,.79],[.68,.98],[.56,.89],[.54,.65],[.49,.43],[.57,.20]]),shadow);
   line(c,points([[.65,.22],[.60,.43],[.68,.60],[.62,.80]]),exposed,width*1.6);
   face(c,points([[.08,.66],[.24,.63],[.30,.85],[.17,.93]]),'#172423aa');
  }
 }
 c.restore();return true;
}
G.HonroObjectDamage={stage,material,draw};
G.HonroScene.prototype.objectDamage=function(c,b,w,h){
 const z=1/Math.max(.01,this.scale),left=this.x-w*z/2,right=this.x+w*z/2,top=this.y-h*z/2,bottom=this.y+h*z/2;
 for(const t of b.terrain||[]){if(t.x+t.w<left||t.x>right||t.y+t.h<top||Math.min(t.y,t.y+(t.slope||0))>bottom)continue;draw(c,t,this.scale);}
};
})(globalThis);
