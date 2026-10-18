(function(G){'use strict';
// Stage21's approved hybrid painting. Only presentation is derived here: no
// authored terrain, battle snapshot, actor or mission state is written.
const S=G.HonroScene.prototype,manifest=G.HONRO_STAGE21_PAINTED||{},images={},patterns=new WeakMap();
let generation=0,rockCanvas;
const ready=id=>!!(images[id]?.complete&&images[id].naturalWidth);
const active=b=>b?.honroStage===21&&(b.honroLandmarks||[]).some(l=>l.asset?.id?.startsWith('eup21:'));
if(typeof Image!=='undefined')for(const [id,src]of Object.entries(manifest.images||{})){
 const img=images[id]=new Image();img.decoding='async';
 img.onload=()=>{generation++;};img.src=src;
}
function imagePart(c,part){if(!ready(part.image))return false;const img=images[part.image],s=part.source||[0,0,img.naturalWidth,img.naturalHeight];c.drawImage(img,...s,...part.target);return true;}
function element(c,l){
 const spec=manifest.elements?.[l.asset?.id];if(!spec||!spec.parts.every(p=>ready(p.image)))return false;
 c.save();c.translate(l.x||0,l.y||0);c.rotate(l.rotation||0);c.scale(l.scale??1,l.scale??1);c.translate(-(l.asset.anchor?.x||0),-(l.asset.anchor?.y||0));
 for(const part of spec.parts)imagePart(c,part);c.restore();return true;
}
function background(c,w,h,b,view){
 if(!active(b)||!ready(manifest.sky))return false;
 const img=images[manifest.sky],q=G.HonroEnvironment.act1BackdropFrame(view,w,h,b,img.naturalWidth,img.naturalHeight);
 c.drawImage(img,q.x,q.y,q.w,q.h);return true;
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
 if(!active(b)||t.id!=='a3-foundation'||!ready(manifest.rock))return false;
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
  if(l.kind==='canonical-element'&&element(c,l))return;
 }
 return oldLandmark.call(this,c,l);
};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
G.HonroStage21Painted={active,ready,background,images,manifest,appearanceKey:()=>manifest.revision+':'+generation};
})(globalThis);
