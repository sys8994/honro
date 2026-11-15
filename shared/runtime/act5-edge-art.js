(function(G){'use strict';
// Continue the *painted* boundary, not collision boxes. Empty shaft gaps stay
// transparent. This cache is bounded to one stage and contains no game state.
const S=G.HonroScene.prototype,draw=S.landmark,bounds=S._landmarkPaintBounds;
function active(l){return /^act5:near:4[1-9]$|^act5:near:50$/.test(l.asset?.id||'');}
function prepare(scene,l){
 const a=l.asset,v=a.vector.viewBox,w=v[2],h=v[3],r=Math.min(1,1024/Math.max(w,h)),pw=Math.ceil(w*r),ph=Math.ceil(h*r),pad=Math.ceil(Math.min(w*.28,420)*r);
 if(scene._act5Edge?.asset===a)return scene._act5Edge;
 if(scene._act5Edge)scene._releaseRasterCanvas(scene._act5Edge.canvas);
 const src=scene._makeLayerCanvas(pw,ph),s=src.getContext('2d');
 s.scale(r,r);draw.call(scene,s,{...l,x:0,y:0,scale:1,rotation:0});
 const cv=scene._makeLayerCanvas(pw+2*pad,ph+pad),c=cv.getContext('2d');
 // Sample the canonical boundary once. No reflected/repeated texture and no
 // silhouettes invented across the open centre of a vertical stage.
 for(const side of [-1,1]){
  const x=side<0?2:pw-3;
  for(let d=-2;d<pad;d++){const t=Math.max(0,d/pad),shift=Math.round((Math.sin(t*2.5)*.7+Math.sin(t*6)*.15)*pad*.22),dx=side<0?pad-d-1:pw+pad+d;
   c.drawImage(src,x,0,1,ph,dx,shift,1,ph);
  }
 }
 c.drawImage(src,0,ph-3,pw,1,pad,ph-2,pw,pad+2);
 // Corners continue only pixels actually occupied at the source corners.
 c.drawImage(src,2,ph-3,1,1,0,ph,pad,pad);
 c.drawImage(src,pw-3,ph-3,1,1,pw+pad,ph,pad,pad);
 // Fade chromatic detail rapidly into the deep rock shadow instead of
 // stretching fine source markings into bright horizontal ribbons.
 c.globalCompositeOperation='source-atop';
 for(const side of [-1,1]){const x=side<0?pad:pad+pw,outer=side<0?0:cv.width,g=c.createLinearGradient(x,0,outer,0);g.addColorStop(0,'#151b2000');g.addColorStop(.18,'#151b20cc');g.addColorStop(1,'#151b20f5');c.fillStyle=g;c.fillRect(side<0?0:pw+pad,0,pad,cv.height);}
 const dark=c.createLinearGradient(0,ph,0,ph+pad);dark.addColorStop(0,'#151b2000');dark.addColorStop(.25,'#151b20cc');dark.addColorStop(1,'#151b20f5');c.fillStyle=dark;c.fillRect(0,ph,cv.width,pad);
 c.globalCompositeOperation='destination-in';
 const horizontal=c.createLinearGradient(0,0,cv.width,0);
 horizontal.addColorStop(0,'#0000');horizontal.addColorStop(pad*.7/cv.width,'#000');horizontal.addColorStop(1-pad*.7/cv.width,'#000');horizontal.addColorStop(1,'#0000');
 c.fillStyle=horizontal;c.fillRect(0,0,cv.width,cv.height);
 const vertical=c.createLinearGradient(0,ph,0,ph+pad);vertical.addColorStop(0,'#000');vertical.addColorStop(.25,'#000');vertical.addColorStop(1,'#0000');
 c.fillStyle=vertical;c.fillRect(0,0,cv.width,cv.height);
 scene._releaseRasterCanvas(src);
 return scene._act5Edge={asset:a,canvas:cv,pad:pad/r,w:cv.width/r,h:cv.height/r};
}
S.landmark=function(c,l){
 if(!active(l)||l.rotation)return draw.call(this,c,l);
 const q=prepare(this,l),scale=l.scale??1;
 draw.call(this,c,l);
 c.save();c.translate(l.x,l.y);c.scale(scale,scale);c.drawImage(q.canvas,-q.pad,0,q.w,q.h);c.restore();
};
S._landmarkPaintBounds=function(l){const q=bounds.call(this,l);if(!q||!active(l)||l.rotation)return q;const p=Math.min(l.asset.vector.viewBox[2]*.28,420)*(l.scale??1);return{left:q.left-p,right:q.right+p,top:q.top,bottom:q.bottom+p};};
G.HonroAct5EdgeArt={version:1};
})(globalThis);
