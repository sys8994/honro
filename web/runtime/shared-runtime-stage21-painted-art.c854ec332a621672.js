(function(G){'use strict';
// Stage21's approved hybrid painting. Only presentation is derived here: no
// authored terrain, battle snapshot, actor or mission state is written.
const S=G.HonroScene.prototype,manifest=G.HONRO_STAGE21_PAINTED||{},images={},patterns=new WeakMap(),woodPatterns=new WeakMap(),sprites=new WeakMap(),materialPaths=new WeakMap();
let generation=0,rockCanvas;
const ready=id=>!!(images[id]?.complete&&images[id].naturalWidth);
const active=b=>b?.honroStage===21&&(b.honroLandmarks||[]).some(l=>l.asset?.id?.startsWith('eup21:'));
if(typeof Image!=='undefined')for(const [id,src]of Object.entries(manifest.images||{})){
 const img=images[id]=new Image();img.decoding='async';
 img.onload=()=>{generation++;};img.src=src;
}
function imagePart(c,part){if(!ready(part.image))return false;const img=images[part.image],s=part.source||[0,0,img.naturalWidth,img.naturalHeight];
 if(part.roof&&part.sourceTop){
  const [sx,sy,sw,sh]=s,[x,y,w,h]=part.target,top=part.roof;
  const at=(xx,contour=top)=>{for(let i=1;i<contour.length;i++){const a=contour[i-1],z=contour[i];if(xx<=z[0])return a[1]+(z[1]-a[1])*Math.max(0,(xx-a[0])/(z[0]-a[0]));}return contour.at(-1)[1];};
  // A cached tile samples this small strip mesh only when its scale changes.
  // Both the visible painted roof and the retained one-way line use the exact
  // same authored contour; facade feet remain pinned to the original ground.
  const n=part.sourceTop.length,eave=part.sourceEave??sh;
  for(let i=0;i<n;i++){const u=i/n,xx=x+w*u,yy=at(xx+w/n/2),sourceY=Math.min(eave-1,Math.max(0,part.sourceTop[i]-1)),bottom=part.bottom?at(xx+w/n/2,part.bottom):part.eaveTarget??y+h;c.drawImage(img,sx+sw*u,sy+sourceY,sw/n,eave-sourceY,xx,yy,w/n,bottom-yy);}
  if(part.sourceEave)c.drawImage(img,sx,sy+eave,sw,sh-eave,x,part.eaveTarget,w,y+h-part.eaveTarget);
 }else c.drawImage(img,...s,...part.target);return true;
}
function element(c,l){
 const spec=manifest.elements?.[l.asset?.id];if(!spec||!spec.parts.every(p=>ready(p.image)))return false;
 let sprite=sprites.get(spec);
 if(!sprite){
  const left=Math.min(...spec.parts.map(p=>p.target[0])),top=Math.min(...spec.parts.map(p=>Math.min(p.target[1],...(p.roof||[]).map(v=>v[1])))),right=Math.max(...spec.parts.map(p=>p.target[0]+p.target[2])),bottom=Math.max(...spec.parts.map(p=>p.target[1]+p.target[3]));
  const cv=document.createElement('canvas'),scale=Math.min(2,1536/Math.max(right-left,bottom-top));cv.width=Math.ceil((right-left)*scale);cv.height=Math.ceil((bottom-top)*scale);const cc=cv.getContext('2d');cc.setTransform(scale,0,0,scale,-left*scale,-top*scale);
  if(spec.cutout){const clip=new Path2D();clip.rect(left-1,top-1,right-left+2,bottom-top+2);clip.addPath(new Path2D(spec.cutout));cc.clip(clip,'evenodd');}
  for(const part of spec.parts)imagePart(cc,part);sprite={canvas:cv,left,top,width:right-left,height:bottom-top};sprites.set(spec,sprite);
 }
 c.save();c.translate(l.x||0,l.y||0);c.rotate(l.rotation||0);c.scale(l.scale??1,l.scale??1);c.translate(-(l.asset.anchor?.x||0),-(l.asset.anchor?.y||0));
 c.drawImage(sprite.canvas,sprite.left,sprite.top,sprite.width,sprite.height);c.restore();return true;
}
function materialElement(c,l){
 const wood=manifest.joinery?.[l.asset?.id],paths=wood||manifest.materialElements?.[l.asset?.id];if(!paths||!ready(wood?'timber':manifest.rock))return false;
 c.save();c.translate(l.x||0,l.y||0);c.rotate(l.rotation||0);c.scale(l.scale??1,l.scale??1);c.translate(-(l.asset.anchor?.x||0),-(l.asset.anchor?.y||0));
 let path=materialPaths.get(paths);if(!path){path=new Path2D();for(const d of paths)path.addPath(new Path2D(d));materialPaths.set(paths,path);}c.clip(path);c.fillStyle=wood?woodPattern(c):rockPattern(c);c.fill(path);c.fillStyle=wood?'#b39b6b22':'#15212633';c.fill(path);c.restore();return true;
}
function woodPattern(c){let p=woodPatterns.get(c);if(!p){p=c.createPattern(images.timber,'repeat');p.setTransform(new DOMMatrix([1.5,0,0,1.5,0,0]));woodPatterns.set(c,p);}return p;}
function background(c,w,h,b,view){
 if(!active(b)||!ready(manifest.sky))return false;
 const img=images[manifest.sky],q=G.HonroEnvironment.act1BackdropFrame(view,w,h,b,img.naturalWidth,img.naturalHeight);
 (G.HonroVisualStyle?.raw(c)||c).drawImage(img,q.x,q.y,q.w,q.h);return true;
}
function rockPattern(c){
 let p=patterns.get(c);if(p)return p;
 const img=images[manifest.rock],size=manifest.rockTileSize||[2048,1024];
 // Mirrored neighbours share exact border pixels. This is prepared once per
 // context, and follows world coordinates across terrain-domain tile gutters.
 if(!rockCanvas){const cv=rockCanvas=document.createElement('canvas');cv.width=img.naturalWidth*2;cv.height=img.naturalHeight*2;const cc=cv.getContext('2d');
  for(let y=0;y<2;y++)for(let x=0;x<2;x++){cc.save();cc.translate(x?cv.width:0,y?cv.height:0);cc.scale(x?-1:1,y?-1:1);cc.drawImage(img,0,0);cc.restore();}}
 p=c.createPattern(rockCanvas,'repeat');p.setTransform(new DOMMatrix([size[0]/img.naturalWidth,0,0,size[1]/img.naturalHeight,0,2220]));patterns.set(c,p);return p;
}
function terrain(c,t,b){
 if(!active(b)||!ready(manifest.rock))return false;
 if(manifest.roofTerrainIds?.includes(t.id)){
  const v=G.HONRO_CORE.poly(t);c.beginPath();v.slice(0,v.length/2).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle='#b0a38a88';c.lineWidth=1.2;c.stroke();return true;
 }
 if(t.oneWay&&t.id.startsWith('eup21-')){const path=new Path2D();G.HONRO_CORE.poly(t).forEach((p,i)=>i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));path.closePath();c.fillStyle=t.mat==='wood'&&ready('timber')?woodPattern(c):rockPattern(c);c.fill(path);return true;}
 if(t.id!=='a3-foundation')return false;
 const vertices=G.HONRO_CORE.poly(t),path=new Path2D();vertices.forEach((p,i)=>i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));path.closePath();
 c.save();c.fillStyle='#343735';c.fill(path);c.clip(path);c.fillStyle=rockPattern(c);c.fill(path);
 // One world-height field continues through the play boundary and far below
 // it. Real polygon clipping remains the only silhouette of the land mass.
 const shade=c.createLinearGradient(0,2350,0,4700);shade.addColorStop(0,'#0b151b00');shade.addColorStop(.28,'#111b2440');shade.addColorStop(.65,'#101b24cc');shade.addColorStop(1,'#101923');c.fillStyle=shade;c.fill(path);
 c.restore();
 c.save();c.lineJoin='round';for(let i=1;i<vertices.length;i++){const a=vertices[i-1],z=vertices[i],dx=z.x-a.x;if(dx<=0||Math.abs((z.y-a.y)/dx)>1.35)continue;c.beginPath();c.moveTo(a.x,a.y+3);c.lineTo(z.x,z.y+3);c.strokeStyle='#11191d';c.lineWidth=8;c.stroke();c.beginPath();c.moveTo(a.x,a.y);c.lineTo(z.x,z.y);c.strokeStyle='#aaa18a';c.lineWidth=2;c.stroke();}c.restore();return true;
}
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':painted21:'+manifest.revision+':'+generation:'');};
const oldLandmark=S.landmark;S.landmark=function(c,l){
 if(active(this.battle)){
  if(l.asset?.id==='eup21:foundations'&&ready(manifest.rock))return;
  if(l.kind==='canonical-element'&&(materialElement(c,l)||element(c,l)))return;
 }
 return oldLandmark.call(this,c,l);
};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
G.HonroStage21Painted={active,ready,background,images,manifest,appearanceKey:()=>manifest.revision+':'+generation};
})(globalThis);

