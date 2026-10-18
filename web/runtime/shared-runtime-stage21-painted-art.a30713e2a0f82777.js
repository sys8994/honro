(function(G){'use strict';
// Stage21's approved hybrid painting. Only presentation is derived here: no
// authored terrain, battle snapshot, actor or mission state is written.
const S=G.HonroScene.prototype,manifest=G.HONRO_STAGE21_PAINTED||{},images={},patterns=new WeakMap(),woodPatterns=new WeakMap(),sprites=new WeakMap(),materialPaths=new WeakMap();
let generation=0,rockCards,skyCanvas;
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
 let path=materialPaths.get(paths);if(!path){path=new Path2D();for(const d of paths)path.addPath(new Path2D(d));materialPaths.set(paths,path);}c.clip(path);
 if(wood){c.fillStyle=woodPattern(c);c.fill(path);c.fillStyle='#b39b6b22';c.fill(path);}
 else if(l.asset.id==='eup21:office-plinth')officePlinth(c,path);
 else paintRock(c,path);
 c.restore();return true;
}
function smallProp(c,l){
 const shapes=manifest.smallProps?.[l.asset?.id];if(!shapes||!ready('architecture')||!ready('timber'))return false;
 c.save();c.translate(l.x||0,l.y||0);c.rotate(l.rotation||0);c.scale(l.scale??1,l.scale??1);c.translate(-(l.asset.anchor?.x||0),-(l.asset.anchor?.y||0));
 const mix=G.HonroEnvironment.mixColor,jars=l.asset.id.endsWith('jars');
 for(const sh of shapes){const path=new Path2D(sh.d),[x,y,w,h]=sh.bounds,base=mix(sh.fill,'#6f533a',.35),g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,mix(base,'#d0b38a',.30));g.addColorStop(.36,base);g.addColorStop(.78,mix(base,'#231d19',.43));g.addColorStop(1,'#29251f');c.fillStyle=g;c.fill(path);
  c.save();c.clip(path);c.globalAlpha=.25;if(jars&&h>12)c.drawImage(images.architecture,376,713,57,55,x,y,w,h);else {c.fillStyle=woodPattern(c);c.fillRect(x,y,w,h);}c.restore();c.strokeStyle='#211f1ac0';c.lineWidth=1.1;c.stroke(path);
 }
 c.restore();return true;
}
function officePlinth(c,path){
 const q=manifest.officePlinth;paintRock(c,path);
 // A shallow masonry cap sits on the local bedrock. Avoid stacked image
 // strips: the lower face shares the ground's continuous material field.
 c.save();c.globalAlpha=.48;c.drawImage(images.architecture,1087,757,293,65,5176,2140,395,88);c.restore();
 const face=c.createLinearGradient(5185,2140,5570,2420);face.addColorStop(0,'#72705a12');face.addColorStop(.5,'#24322d44');face.addColorStop(1,'#15241f99');c.fillStyle=face;c.fill(path);
 const capFade=c.createLinearGradient(0,2160,0,2240);capFade.addColorStop(0,'#26302b00');capFade.addColorStop(1,'#26302b99');c.fillStyle=capFade;c.fillRect(5180,2160,390,80);
 c.fillStyle='#14221f99';c.fill(new Path2D(q.side));
 const under=c.createLinearGradient(0,2132,0,2212);under.addColorStop(0,'#071317d9');under.addColorStop(1,'#07131700');c.fillStyle=under;c.fillRect(5180,2132,390,80);
 const returnShade=c.createLinearGradient(5500,0,5572,0);returnShade.addColorStop(0,'#101b1900');returnShade.addColorStop(1,'#0c181bd9');c.fillStyle=returnShade;c.fillRect(5500,2140,75,400);const leftShade=c.createLinearGradient(5190,0,5227,0);leftShade.addColorStop(0,'#14211ed9');leftShade.addColorStop(1,'#14211e00');c.fillStyle=leftShade;c.fillRect(5190,2160,37,300);
 c.beginPath();q.foot.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle='#091718c9';c.lineWidth=25;c.lineJoin='round';c.stroke();
 c.beginPath();c.moveTo(5188,2131);c.lineTo(5551,2131);c.strokeStyle='#a29c81';c.lineWidth=2;c.stroke();
}
function woodPattern(c){let p=woodPatterns.get(c);if(!p){p=c.createPattern(images.timber,'repeat');p.setTransform(new DOMMatrix([1.5,0,0,1.5,0,0]));woodPatterns.set(c,p);}return p;}
function background(c,w,h,b,view){
 if(!active(b)||!ready(manifest.sky))return false;
 if(!skyCanvas){const img=images[manifest.sky],cv=skyCanvas=document.createElement('canvas');cv.width=2048;cv.height=1024;const cc=cv.getContext('2d'),wash=cc.createLinearGradient(0,0,0,1024);wash.addColorStop(0,'#14212e');wash.addColorStop(.7,'#1b2a35');wash.addColorStop(1,'#15232c');cc.fillStyle=wash;cc.fillRect(0,0,2048,1024);cc.filter='saturate(.6) brightness(.8)';cc.drawImage(img,0,70,2048,683);cc.filter='none';const topFade=cc.createLinearGradient(0,70,0,140);topFade.addColorStop(0,'#15232fff');topFade.addColorStop(1,'#15232f00');cc.fillStyle=topFade;cc.fillRect(0,70,2048,70);const veil=cc.createLinearGradient(0,70,0,810);veil.addColorStop(0,'#24334120');veil.addColorStop(.65,'#24334145');veil.addColorStop(1,'#192935ff');cc.fillStyle=veil;cc.fillRect(0,70,2048,754);}
 const img=skyCanvas,q=G.HonroEnvironment.act1BackdropFrame(view,w,h,b,img.width,img.height);
 (G.HonroVisualStyle?.raw(c)||c).drawImage(img,q.x,q.y,q.w,q.h);return true;
}
function rockPattern(c){
 let p=patterns.get(c);if(p)return p;
 const img=images[manifest.rock],size=manifest.rockTileSize||[2048,1024];
 // Used only by narrow step faces, never by broad ground or retaining walls.
 p=c.createPattern(img,'repeat');p.setTransform(new DOMMatrix([size[0]/img.naturalWidth,0,0,size[1]/img.naturalHeight,0,2220]));patterns.set(c,p);return p;
}
const random=n=>{const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);};
function prepareRockCards(){if(rockCards)return rockCards;const img=images[manifest.rock];rockCards=[];
 for(let i=0;i<3;i++){const cv=document.createElement('canvas');cv.width=1024;cv.height=704;const c=cv.getContext('2d'),x=i===1?190:0,y=i===2?155:0;c.drawImage(img,x,y,img.naturalWidth-x-(i===2?130:0),img.naturalHeight-y,0,0,1024,704);c.globalCompositeOperation='destination-in';const a=c.createLinearGradient(0,0,1024,0);a.addColorStop(0,'#0000');a.addColorStop(.17,'#000');a.addColorStop(.83,'#000');a.addColorStop(1,'#0000');c.fillStyle=a;c.fillRect(0,0,1024,704);const z=c.createLinearGradient(0,0,0,704);z.addColorStop(0,'#0000');z.addColorStop(.18,'#000');z.addColorStop(.82,'#000');z.addColorStop(1,'#0000');c.fillStyle=z;c.fillRect(0,0,1024,704);rockCards.push(cv);}
 return rockCards;
}
function paintRock(c,path){
 c.fillStyle='#343a36';c.fill(path);const cards=prepareRockCards(),m=c.getTransform(),left=-m.e/m.a,top=-m.f/m.d,right=(c.canvas.width-m.e)/m.a,bottom=(c.canvas.height-m.f)/m.d;
 // Seeded, overlapping world cards have no bilateral mirror axis. Every tile
 // visits the same cards in the same order, independent of camera and zoom.
 for(let iy=Math.floor((top-2220)/780)-2;iy<=Math.floor((bottom-2220)/780)+1;iy++)for(let ix=Math.floor(left/1050)-2;ix<=Math.floor(right/1050)+1;ix++){
  const seed=ix*137+iy*971,x=ix*1050+(random(seed)-.5)*380,y=2220+iy*780+(random(seed+1)-.5)*270,w=1850+random(seed+2)*450,h=1200+random(seed+3)*310;c.save();c.translate(x+w/2,y+h/2);c.rotate((random(seed+4)-.5)*.19);c.globalAlpha=.67+random(seed+5)*.26;c.drawImage(cards[Math.floor(random(seed+6)*3)],-w/2,-h/2,w,h);c.restore();
 }
 const depth=c.createLinearGradient(0,2520,0,4050);depth.addColorStop(0,'#0f1b2100');depth.addColorStop(.45,'#101e2866');depth.addColorStop(1,'#101d26f5');c.fillStyle=depth;c.fill(path);
}
function terrain(c,t,b){
 if(!active(b)||!ready(manifest.rock))return false;
 if(manifest.roofTerrainIds?.includes(t.id)){
  return true; // The painting already describes the roof edge.
 }
 if(t.oneWay&&t.id.startsWith('eup21-')){const path=new Path2D();G.HONRO_CORE.poly(t).forEach((p,i)=>i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));path.closePath();c.fillStyle=t.mat==='wood'&&ready('timber')?woodPattern(c):rockPattern(c);c.fill(path);return true;}
 if(t.id!=='a3-foundation')return false;
 const vertices=G.HONRO_CORE.poly(t),path=new Path2D();vertices.forEach((p,i)=>i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));path.closePath();
 c.save();c.clip(path);paintRock(c,path);
 // One world-height field continues through the play boundary and far below
 // it. Real polygon clipping remains the only silhouette of the land mass.
 const shade=c.createLinearGradient(0,2350,0,4700);shade.addColorStop(0,'#0b151b00');shade.addColorStop(.28,'#111b2440');shade.addColorStop(.65,'#101b24cc');shade.addColorStop(1,'#101923');c.fillStyle=shade;c.fill(path);
 c.restore();
 return true;
}
const oldKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return oldKey.call(this,b,w)+(active(b)?':painted21:'+manifest.revision+':'+generation:'');};
const oldLandmark=S.landmark;S.landmark=function(c,l){
 if(active(this.battle)){
  if(l.asset?.id==='eup21:foundations'&&ready(manifest.rock))return;
  if(l.kind==='canonical-element'&&(smallProp(c,l)||materialElement(c,l)||element(c,l)))return;
 }
 return oldLandmark.call(this,c,l);
};
const oldTerrain=S.terrain;S.terrain=function(c,t){if(!terrain(c,t,this.battle))return oldTerrain.call(this,c,t);};
G.HonroStage21Painted={active,ready,background,images,manifest,appearanceKey:()=>manifest.revision+':'+generation};
G.HonroPaintedPresentation.register({id:'stage21',active,naturalEdges:true,cachedWorld:true});
})(globalThis);

