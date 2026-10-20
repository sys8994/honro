(function(G){'use strict';
// Reuse the existing approved distance paintings, independently of the vector
// terrain. Only obsolete Stage18 rear cards are replaced; foreground and
// collision surfaces keep their existing vector renderers.
const S=G.HonroScene.prototype,E=G.HonroEnvironment,cache=new Map(),MAX=3;
const keyFor=n=>n===1||n===7||n===10?'forestFar':n>=2&&n<=9?'valleyFar':n===18?'bellRear':n===21?'townSky':n===27?'depotRear':null;
function request(key){
 if(cache.has(key)){const item=cache.get(key);cache.delete(key);cache.set(key,item);return item;}
 const src=key==='townSky'?G.HONRO_STAGE21_PAINTED?.images.sky:G.HONRO_PAINTED_PILOTS?.images[key];
 if(!src||typeof Image==='undefined')return null;
 while(cache.size>=MAX){const first=cache.keys().next().value,old=cache.get(first);if(old.canvas)old.canvas.width=1;old.image.onload=null;cache.delete(first);}
 const item={image:new Image(),canvas:null};cache.set(key,item);item.image.decoding='async';
 item.image.onload=()=>{
  if(cache.get(key)!==item)return;
  const image=item.image,cv=document.createElement('canvas'),c=cv.getContext('2d');
  cv.width=Math.min(2048,image.naturalWidth);cv.height=Math.round(cv.width*image.naturalHeight/image.naturalWidth);
  c.filter=key==='bellRear'||key==='depotRear'?'saturate(.55) contrast(.65) brightness(.66)':'saturate(.50) contrast(.76) brightness(.80)';
  c.drawImage(image,0,0,cv.width,cv.height);c.filter='none';
  c.fillStyle=key==='bellRear'||key==='depotRear'?'#152a3b44':'#263c4524';c.fillRect(0,0,cv.width,cv.height);
  item.canvas=cv;
 };
 item.image.src=src;return item;
}
const previous=S.background;
// These two inert rear cards were also replaced by the earlier painted
// provider. Keep corbels, the actual bell, lamps and every collision surface.
const landmark=S.landmark;
S.landmark=function(c,l){
 if(this.battle?.honroStage===18&&request('bellRear')?.canvas&&['sb-art-rear-cavern','sb-art-rear-rock-roots'].includes(l.id))return;
 return landmark.call(this,c,l);
};
const worldKey=S._worldCacheKey;
S._worldCacheKey=function(b,w){return worldKey.call(this,b,w)+(b.honroStage===18?':rear-image:'+!!request('bellRear')?.canvas:'');};
S.background=function(c,w,h,b){
 const key=!b?.honroCustom&&keyFor(b?.honroStage),item=key&&request(key);
 if(!item?.canvas)return previous.call(this,c,w,h,b);
 const image=item.canvas,frame=E.act1BackdropFrame(this,w,h,b,image.width,image.height),raw=G.HonroVisualStyle.raw(c);
 const paint=cc=>cc.drawImage(image,frame.x,frame.y,frame.w,frame.h);
 if(!this._screenRaster(raw,['authored-far',key,w,h,frame.x,frame.y,frame.w,frame.h].join(':'),w,h,paint,'_screenBackgroundCache',false))paint(raw);
 this.environmentStats={groups:1,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};
};
G.HonroAuthoredFarArt={keyFor,ready:n=>!!request(keyFor(n))?.canvas,stats:()=>({entries:cache.size,maxEntries:MAX,canvasBytes:[...cache.values()].reduce((n,v)=>n+(v.canvas?v.canvas.width*v.canvas.height*4:0),0)})};
})(globalThis);
