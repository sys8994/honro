(function(G){'use strict';
// Shared approved far cache and independent, transparent near caches. Geometry
// never clips a ground texture. No grain, detail synthesis or new animation.
const P=G.HonroPaintedPilots,E=G.HonroEnvironment,pictures=new Map();let filters=0;
const fringes=new Map();let fringeBuilds=0;
function ready(near){P.request(['quietFar',near]);return P.ready('quietFar')&&P.ready(near);}
function picture(id){if(pictures.has(id))return pictures.get(id);const im=P.images[id],cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const c=cv.getContext('2d');c.filter='brightness('+(id==='quietFar'?.68:.62)+')';filters++;c.drawImage(im,0,0);c.filter='none';pictures.set(id,cv);return cv;}
function near(id,cutout){const base=picture(id);if(!cutout)return base;const key=id+':broken-bough';if(pictures.has(key))return pictures.get(key);const cv=document.createElement('canvas');cv.width=base.width;cv.height=base.height;const c=cv.getContext('2d');c.drawImage(base,0,0);c.globalCompositeOperation='destination-out';const p=new Path2D();cutout.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();c.fill(p);pictures.set(key,cv);return cv;}
// A finite, non-colliding margin uses the existing edge's broad forms once.
// Only deep foreground fades; the authored walk surfaces remain opaque. Build
// alpha once in source space, never filter or synthesize texture while panning.
function fringe(id,cutout){
 const key=id+':'+Number(!!cutout);if(fringes.has(key))return fringes.get(key);
 const base=picture(id),w=base.width,h=base.height,pad=192;
 const cv=document.createElement('canvas');cv.width=w+pad*2;cv.height=h;
 const c=cv.getContext('2d');
 if(cutout){
  c.drawImage(fringe(id,null).canvas,0,0);c.save();c.translate(pad,0);c.globalCompositeOperation='destination-out';
  const p=new Path2D();cutout.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();c.fill(p);c.restore();
 }else{
  const bc=base.getContext('2d');
  const edgeTop=x=>{const d=bc.getImageData(x,0,8,h).data;let run=0;for(let y=Math.floor(h*.35);y<h;y++){let a=0;for(let n=0;n<8;n++)a+=d[(y*8+n)*4+3];run=a>248*8?run+1:0;if(run===8)return y-7;}return h;};
  const left=edgeTop(0),right=edgeTop(w-8);
  c.drawImage(base,pad,0);
  c.save();c.translate(pad,0);c.scale(-1,1);c.drawImage(base,0,left,96,h-left,0,left,pad,h-left);c.restore();
  c.save();c.translate(pad+w,0);c.scale(-1,1);c.drawImage(base,w-96,right,96,h-right,-pad,right,pad,h-right);c.restore();
  const pixels=c.getImageData(0,0,cv.width,cv.height),data=pixels.data,smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const starts=new Float32Array(cv.width),ends=new Float32Array(cv.width);
  for(let x=0;x<cv.width;x++){const phase=(x-pad)/w;starts[x]=h-180+22*Math.sin(phase*9)+14*Math.sin(phase*4+1);ends[x]=h-5-22*Math.abs(Math.sin(phase*7+2));}
  for(let y=0;y<cv.height;y++){
   const lp=pad*(.82+.14*Math.sin(y/170)),rp=pad*(.84+.12*Math.sin(y/190+1));
   for(let x=0;x<cv.width;x++){
    const i=(y*cv.width+x)*4+3;if(!data[i])continue;
    const side=x<pad?smooth((x-pad+lp)/lp)*smooth((y-left+1)/Math.max(1,(pad-x)*.45)):x>pad+w?smooth((pad+w+rp-x)/rp)*smooth((y-right+1)/Math.max(1,(x-pad-w)*.45)):1;
    data[i]*=side*smooth((ends[x]-y)/(ends[x]-starts[x]));
   }
  }
  c.putImageData(pixels,0,0);
 }
 const result={canvas:cv,pad};fringeBuilds++;
 if(fringes.size>=2){const oldest=fringes.keys().next().value;fringes.get(oldest).canvas.width=1;fringes.delete(oldest);}
 fringes.set(key,result);return result;
}
function drawNear(c,v,cutout,exterior=false){
 const f=fringe(v.image,cutout),q=v.transform,cv=f.canvas,x=q.x-f.pad*q.scale,y=q.y,w=cv.width*q.scale,h=cv.height*q.scale;
 c.save();if(exterior){c.beginPath();c.rect(x,y,w,h);c.rect(q.x,q.y,v.source.width*q.scale,v.source.height*q.scale);c.clip('evenodd');}
 c.drawImage(cv,x,y,w,h);c.restore();
}
// Reserve vertical cover so the approved ridges stay in the middle of the
// screen, including tall viewports. Camera zoom never scales this screen layer.
function backdropFrame(scene,w,h,b,iw=1672,ih=941){const base=E.act1BackdropFrame(scene,w,h,b,iw,ih),s=Math.max(base.w/iw,h*1.48/ih),dw=iw*s,dh=ih*s,my=h*E.ACT1_FAR.marginY,y=Math.max(h-dh+my,Math.min(-my,h*.43-dh*.60));return{x:(w-dw)*.5+base.offsetX,y:y+base.offsetY,w:dw,h:dh,offsetX:base.offsetX,offsetY:base.offsetY};}
function background(scene,c,w,h,b){const raw=G.HonroVisualStyle.raw(c);if(!P.ready('quietFar')){raw.fillStyle='#62696e';raw.fillRect(0,0,w,h);return;}const far=picture('quietFar'),q=backdropFrame(scene,w,h,b,far.width,far.height),paint=cc=>cc.drawImage(far,q.x,q.y,q.w,q.h),key=['quiet-far',P.appearanceKey(),w,h,q.x,q.y,q.w,q.h].join(':');if(!scene._screenRaster(raw,key,w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:2,backgroundAnimatedPrimitives:0,animatedPrimitives:0};}
G.HonroQuietLayeredArt={ready,near,drawNear,background,backdropFrame,cacheStats:()=>({pictures:pictures.size,filterPasses:filters,farCanvases:pictures.has('quietFar')?1:0,fringePictures:fringes.size,fringeBuilds,fringeBytes:[...fringes.values()].reduce((n,f)=>n+f.canvas.width*f.canvas.height*4,0)})};
})(globalThis);
