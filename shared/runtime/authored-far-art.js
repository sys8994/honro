(function(G){'use strict';
// Distance-only provider. Terrain, camera, placements and battle data are owned
// by the unchanged vector renderers. Paintings are demand decoded, never tiled.
const S=G.HonroScene.prototype,E=G.HonroEnvironment,manifest=G.HONRO_AUTHORED_FAR,cache=new Map(),MAX=3;
const keyFor=n=>manifest?.stages[n]?.key||null;
function request(key){
 if(cache.has(key)){const item=cache.get(key);cache.delete(key);cache.set(key,item);return item;}
 const src=manifest?.images[key];if(!src||typeof Image==='undefined')return null;
 while(cache.size>=MAX){const first=cache.keys().next().value,old=cache.get(first);if(old.canvas)old.canvas.width=1;if(old.image){old.image.onload=null;old.image.onerror=null;old.image.src='';}cache.delete(first);}
 const item={image:new Image(),canvas:null,error:false};cache.set(key,item);item.image.decoding='async';
 item.image.onerror=()=>{item.error=true;};
 item.image.onload=()=>{
  if(cache.get(key)!==item)return;
  const image=item.image,cv=document.createElement('canvas'),c=cv.getContext('2d');
  cv.width=Math.min(2048,image.naturalWidth);cv.height=Math.round(cv.width*image.naturalHeight/image.naturalWidth);
  const dark=['bellRear','depotRear'].includes(key),interior=key.endsWith('-interior');
  c.filter=dark?'saturate(.55) contrast(.65) brightness(.66)':interior?'saturate(.42) contrast(.58) brightness(.68)':'saturate(.50) contrast(.76) brightness(.80)';
  c.drawImage(image,0,0,cv.width,cv.height);c.filter='none';c.fillStyle=dark||interior?'#152a3b44':'#263c4524';c.fillRect(0,0,cv.width,cv.height);
  item.canvas=cv;image.onload=null;image.onerror=null;item.image=null;
 };
 item.image.src=src;return item;
}
function layers(scene,w,h,b){
 const spec=manifest?.stages[b?.honroStage];if(!spec)return [];
 const out=[{key:spec.key,alpha:1}];
 if(spec.enclosed){
  // Existing ceilings delimit the enclosed portion; never change their shape.
  const roofs=b.terrain.filter(t=>t.honroCeiling&&!t.broken);
  if(roofs.length){const left=Math.min(...roofs.map(t=>t.x)),right=Math.max(...roofs.map(t=>t.x+t.w));out.push({key:spec.enclosed,left:(left-scene.x)*scene.scale+w/2,right:(right-scene.x)*scene.scale+w/2,fade:Math.max(1,500*scene.scale)});}
 }
 return out.map(l=>{const canvas=request(l.key)?.canvas;return{...l,canvas,frame:canvas&&E.act1BackdropFrame(scene,w,h,b,canvas.width,canvas.height)};});
}
const previous=S.background,landmark=S.landmark;
S.landmark=function(c,l){
 if(this.battle?.honroStage===18&&request('bellRear')?.canvas&&['sb-art-rear-cavern','sb-art-rear-rock-roots'].includes(l.id))return;
 return landmark.call(this,c,l);
};
const worldKey=S._worldCacheKey;
S._worldCacheKey=function(b,w){return worldKey.call(this,b,w)+(b.honroStage===18?':rear-image:'+!!request('bellRear')?.canvas:'');};
S.background=function(c,w,h,b){
 if(b?.honroCustom)return previous.call(this,c,w,h,b);
 const ls=layers(this,w,h,b);if(!ls.length||ls.some(l=>!l.canvas))return previous.call(this,c,w,h,b);
 const raw=G.HonroVisualStyle.raw(c),paint=cc=>{
  for(const l of ls){const f=l.frame;cc.save();
   if(l.left!==undefined){
    // Soft transition strips use only image opacity, no repeating textures or
    // opaque gradient filler. At full enclosure the image is fully opaque.
    const count=24,step=l.fade/count;
    cc.beginPath();cc.rect(l.left+l.fade,0,Math.max(0,l.right-l.left-2*l.fade),h);cc.clip();cc.drawImage(l.canvas,f.x,f.y,f.w,f.h);cc.restore();
    for(let i=0;i<count;i++){cc.save();cc.globalAlpha=(i+.5)/count;cc.beginPath();cc.rect(l.left+i*step,0,step+.5,h);cc.rect(l.right-(i+1)*step,0,step+.5,h);cc.clip();cc.drawImage(l.canvas,f.x,f.y,f.w,f.h);cc.restore();}continue;
   }
   cc.drawImage(l.canvas,f.x,f.y,f.w,f.h);cc.restore();
  }
 };
 const signature=ls.map(l=>[l.key,l.frame.x,l.frame.y,l.frame.w,l.frame.h,l.left,l.right,l.fade].join(',')).join('|');
 if(!this._screenRaster(raw,['authored-far',w,h,signature].join(':'),w,h,paint,'_screenBackgroundCache',false))paint(raw);
 // These stages previously drew authored room rocks, hanging clues and lights
 // in background(). Keep that pass, omitting only its old sky/flat cave base.
 if([11,13,14,15,16,17,19,20].includes(b.honroStage))G.HonroAct2SpatialArt.background(c,b,this,w,h,true);
 this.environmentStats={...this.environmentStats,groups:this.environmentStats?.groups||0,cachedPaths:this.environmentStats?.cachedPaths||0,visibleAssets:ls.length,backgroundAnimatedPrimitives:0,authoredFar:ls.map(l=>l.key)};
 if([11,13,14,15,16,17,19,20,22,24,25,26,28,29].includes(b.honroStage))G.HonroEnvironmentRenderer.customSpatialScenery(this,c,w,h,b);
};
G.HonroAuthoredFarArt={keyFor,manifest,ready:n=>{const s=manifest?.stages[n];return !!s&&[s.key,s.enclosed].filter(Boolean).every(k=>!!request(k)?.canvas);},frames:(scene,w,h,b)=>layers(scene,w,h,b).map(({canvas,...l})=>l),stats:()=>({entries:cache.size,maxEntries:MAX,keys:[...cache.keys()],errors:[...cache.entries()].filter(([,v])=>v.error).map(([k])=>k),canvasBytes:[...cache.values()].reduce((n,v)=>n+(v.canvas?v.canvas.width*v.canvas.height*4:0),0)})};
})(globalThis);
