(function(G){'use strict';
// Shared approved far cache and independent, transparent near caches. Geometry
// never clips a ground texture. No grain, detail synthesis or new animation.
const P=G.HonroPaintedPilots,E=G.HonroEnvironment,pictures=new Map();let filters=0;
function ready(near){P.request(['quietFar',near]);return P.ready('quietFar')&&P.ready(near);}
function picture(id){if(pictures.has(id))return pictures.get(id);const im=P.images[id],cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const c=cv.getContext('2d');c.filter='brightness('+(id==='quietFar'?.68:.62)+')';filters++;c.drawImage(im,0,0);c.filter='none';pictures.set(id,cv);return cv;}
function near(id,cutout){const base=picture(id);if(!cutout)return base;const key=id+':broken-bough';if(pictures.has(key))return pictures.get(key);const cv=document.createElement('canvas');cv.width=base.width;cv.height=base.height;const c=cv.getContext('2d');c.drawImage(base,0,0);c.globalCompositeOperation='destination-out';const p=new Path2D();cutout.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();c.fill(p);pictures.set(key,cv);return cv;}
function background(scene,c,w,h,b){const raw=G.HonroVisualStyle.raw(c);if(!P.ready('quietFar')){raw.fillStyle='#62696e';raw.fillRect(0,0,w,h);return;}const far=picture('quietFar'),q=E.act1BackdropFrame(scene,w,h,b,far.width,far.height),paint=cc=>cc.drawImage(far,q.x,q.y,q.w,q.h),key=['quiet-far',P.appearanceKey(),w,h,q.x,q.y,q.w,q.h].join(':');if(!scene._screenRaster(raw,key,w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:2,backgroundAnimatedPrimitives:0,animatedPrimitives:0};}
function frame(scene,w,h,b,art){scene.scale=Math.max(w/(art.right-art.left),h/(art.bottom-art.top),scene.scale);const hw=w/(2*scene.scale),hh=h/(2*scene.scale);scene.x=Math.max(art.left+hw,Math.min(art.right-hw,scene.x));scene.y=Math.max(art.top+hh,Math.min(art.bottom-hh,scene.y));}
G.HonroQuietLayeredArt={ready,near,background,frame,cacheStats:()=>({pictures:pictures.size,filterPasses:filters,farCanvases:pictures.has('quietFar')?1:0})};
})(globalThis);

