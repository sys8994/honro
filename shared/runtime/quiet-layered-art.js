(function(G){'use strict';
// Shared approved far cache and independent, transparent near caches. Geometry
// never clips a ground texture. No grain, detail synthesis or new animation.
const P=G.HonroPaintedPilots,E=G.HonroEnvironment,pictures=new Map();let filters=0;
const fringes=new Map(),legacySections=new WeakMap(),MAX_FRINGES=8;let fringeBuilds=0,fringeLimit=2;
let sectionLayer=null,sectionLayerBuilds=0;
function trimFringes(limit){while(fringes.size>limit){const oldest=fringes.keys().next().value;fringes.get(oldest).canvas.width=1;fringes.delete(oldest);}}
function ready(near){P.request(['quietFar',near]);return P.ready('quietFar')&&P.ready(near);}
// Old snapshots still describe one image. New maps explicitly author each
// independent image, source-space contact profile and non-colliding margin.
function sections(v){
 if(Array.isArray(v?.sections))return v.sections;
 if(!v?.image)return[];
 if(!legacySections.has(v))legacySections.set(v,[{id:'legacy',image:v.image,tone:v.tone,source:v.source,transform:v.transform,contacts:[],exterior:{mode:'fringe',collision:false,...v.fringe},damageMasks:v.brokenBoughMask?[{terrainId:'pine-branch-east',sourcePoints:v.brokenBoughMask}]:[]}]);
 return legacySections.get(v);
}
function readySections(v){const list=sections(v),ids=[...new Set(['quietFar',...list.map(s=>s.image)])];fringeLimit=Math.min(MAX_FRINGES,Math.max(2,list.length*2));trimFringes(fringeLimit);P.request(ids);return ids.every(id=>P.ready(id));}
function picture(id,tone){const source=tone==='source'||id==='stage1BalancedNear',key=source?id+':source':id;if(pictures.has(key))return pictures.get(key);const im=P.images[id],cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const c=cv.getContext('2d');if(!source){c.filter='brightness('+(id==='quietFar'?.68:.62)+')';filters++;}c.drawImage(im,0,0);c.filter='none';pictures.set(key,cv);return cv;}
function near(id,cutout){const base=picture(id);if(!cutout)return base;const key=id+':broken-bough';if(pictures.has(key))return pictures.get(key);const cv=document.createElement('canvas');cv.width=base.width;cv.height=base.height;const c=cv.getContext('2d');c.drawImage(base,0,0);c.globalCompositeOperation='destination-out';const p=new Path2D();cutout.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();c.fill(p);pictures.set(key,cv);return cv;}
// A finite, non-colliding margin uses the existing edge's broad forms once.
// Only deep foreground fades; the authored walk surfaces remain opaque. Build
// alpha once in source space, never filter or synthesize texture while panning.
function fringe(id,cutout,options={}){
 const cuts=cutout?.length?(typeof cutout[0][0]==='number'?[cutout]:cutout):[],key=JSON.stringify([id,options,cuts]);
 if(fringes.has(key)){const hit=fringes.get(key);fringes.delete(key);fringes.set(key,hit);return hit;}
 const base=picture(id,options.tone),w=base.width,h=base.height,pad=options.mode==='none'?0:Math.max(0,Math.round(options.padding??192)),edges=options.mode==='none'?{left:false,right:false,bottom:false}:options.edges||{};
 const cv=document.createElement('canvas');cv.width=w+pad*2;cv.height=h;
 const c=cv.getContext('2d');
 if(cuts.length){
  c.drawImage(fringe(id,null,options).canvas,0,0);c.save();c.translate(pad,0);c.globalCompositeOperation='destination-out';
  for(const cut of cuts){const p=new Path2D();cut.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();c.fill(p);}c.restore();
 }else{
  const bc=base.getContext('2d');
  const edgeTop=x=>{const d=bc.getImageData(x,0,8,h).data;let run=0;for(let y=Math.floor(h*.35);y<h;y++){let a=0;for(let n=0;n<8;n++)a+=d[(y*8+n)*4+3];run=a>248*8?run+1:0;if(run===8)return y-7;}return h;};
  const left=edgeTop(0),right=edgeTop(w-8);
  c.drawImage(base,pad,0);
  if(pad&&edges.left!==false){c.save();c.translate(pad,0);c.scale(-1,1);c.drawImage(base,0,left,96,h-left,0,left,pad,h-left);c.restore();}
  if(pad&&edges.right!==false){c.save();c.translate(pad+w,0);c.scale(-1,1);c.drawImage(base,w-96,right,96,h-right,-pad,right,pad,h-right);c.restore();}
  const pixels=c.getImageData(0,0,cv.width,cv.height),data=pixels.data,smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const starts=new Float32Array(cv.width),ends=new Float32Array(cv.width),join=new Float32Array(cv.width),fade=options.joinFade;
  for(let x=0;x<cv.width;x++){const u=x-pad,phase=u/w,v=options.bottomVariation;starts[x]=(options.bottomStart??h-180)+(v??22)*Math.sin(phase*9)+(v===undefined?14:v*.6)*Math.sin(phase*4+1);ends[x]=(options.bottomEnd??h-5)-(v??22)*Math.abs(Math.sin(phase*7+2));join[x]=(fade?.left?smooth((u-fade.left[0])/(fade.left[1]-fade.left[0])):1)*(fade?.right?1-smooth((u-fade.right[0])/(fade.right[1]-fade.right[0])):1);}
  for(let y=0;y<cv.height;y++){
   const lp=pad*(.82+.14*Math.sin(y/170)),rp=pad*(.84+.12*Math.sin(y/190+1));
   for(let x=0;x<cv.width;x++){
    const i=(y*cv.width+x)*4+3;if(!data[i])continue;
    const side=x<pad?smooth((x-pad+lp)/lp)*smooth((y-left+1)/Math.max(1,(pad-x)*.45)):x>pad+w?smooth((pad+w+rp-x)/rp)*smooth((y-right+1)/Math.max(1,(x-pad-w)*.45)):1;
    data[i]*=side*(edges.bottom===false?1:smooth((ends[x]-y)/(ends[x]-starts[x])))*join[x];
   }
  }
  c.putImageData(pixels,0,0);
 }
 const result={canvas:cv,pad};fringeBuilds++;
 trimFringes(fringeLimit-1);
 fringes.set(key,result);return result;
}
function drawNear(c,v,cutout,exterior=false){
 if(exterior&&v.exterior?.mode==='none')return;
 const options=v.tone||v.joinFade?{...(v.exterior||v.fringe),tone:v.tone,joinFade:v.joinFade}:v.exterior||v.fringe,f=fringe(v.image,cutout,options),q=v.transform,cv=f.canvas,x=q.x-f.pad*q.scale,y=q.y,w=cv.width*q.scale,h=cv.height*q.scale;
 c.save();if(exterior){c.beginPath();c.rect(x,y,w,h);c.rect(q.x,q.y,v.source.width*q.scale,v.source.height*q.scale);c.clip('evenodd');}
 c.drawImage(cv,x,y,w,h);c.restore();
}
function drawSections(c,v,b,exterior=false){
 const broken=new Set((b?.terrain||[]).filter(t=>t.broken).map(t=>t.id));
 const m=c.getTransform(),list=sections(v).filter(s=>{if(exterior&&(s.exterior?.mode==='none'||s.exterior?.edges?.left===false&&s.exterior?.edges?.right===false))return false;const q=s.transform,p=s.exterior?.padding??192;return(q.x+(s.source.width+p)*q.scale)*m.a+m.e>=0&&(q.x-p*q.scale)*m.a+m.e<=c.canvas.width&&(q.y+s.source.height*q.scale)*m.d+m.f>=0&&q.y*m.d+m.f<=c.canvas.height;});
 const paint=target=>{for(const section of list){
  const cuts=(section.damageMasks||[]).filter(m=>broken.has(m.terrainId)).map(m=>m.sourcePoints);
  drawNear(target,section,cuts,exterior);
 }};
 if(exterior||!list.some(s=>s.joinFade)){paint(c);return;}
 // Complementary alpha weights add in an isolated transparent layer. Ordinary
 // source-over would leave .75 alpha at a .5/.5 join and reveal the far layer.
 // Reuse one <=1024px scratch tile; the existing static world cache owns output.
 if(!list.length)return;sectionLayer??=document.createElement('canvas');
 const width=Math.min(1024,c.canvas.width),height=Math.min(1024,c.canvas.height);
 if(sectionLayer.width!==width)sectionLayer.width=width;if(sectionLayer.height!==height)sectionLayer.height=height;
 const cc=sectionLayer.getContext('2d');
 for(let y=0;y<c.canvas.height;y+=height)for(let x=0;x<c.canvas.width;x+=width){
  cc.setTransform(1,0,0,1,0,0);cc.clearRect(0,0,width,height);cc.setTransform(m.a,m.b,m.c,m.d,m.e-x,m.f-y);cc.globalAlpha=1;cc.globalCompositeOperation='lighter';paint(cc);sectionLayerBuilds++;
  const w=Math.min(width,c.canvas.width-x),h=Math.min(height,c.canvas.height-y);c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(sectionLayer,0,0,w,h,x,y,w,h);c.restore();
 }
}
// Reserve vertical cover so the approved ridges stay in the middle of the
// screen, including tall viewports. Camera zoom never scales this screen layer.
function backdropFrame(scene,w,h,b,iw=1672,ih=941){const base=E.act1BackdropFrame(scene,w,h,b,iw,ih),s=Math.max(base.w/iw,h*1.48/ih),dw=iw*s,dh=ih*s,my=h*E.ACT1_FAR.marginY,y=Math.max(h-dh+my,Math.min(-my,h*.43-dh*.60));return{x:(w-dw)*.5+base.offsetX,y:y+base.offsetY,w:dw,h:dh,offsetX:base.offsetX,offsetY:base.offsetY};}
function background(scene,c,w,h,b){const raw=G.HonroVisualStyle.raw(c);if(!P.ready('quietFar')){raw.fillStyle='#62696e';raw.fillRect(0,0,w,h);return;}const far=picture('quietFar'),q=backdropFrame(scene,w,h,b,far.width,far.height),paint=cc=>cc.drawImage(far,q.x,q.y,q.w,q.h),key=['quiet-far',P.appearanceKey(),w,h,q.x,q.y,q.w,q.h].join(':');if(!scene._screenRaster(raw,key,w,h,paint,'_screenBackgroundCache',false))paint(raw);scene.environmentStats={groups:1,visibleAssets:2,backgroundAnimatedPrimitives:0,animatedPrimitives:0};}
G.HonroQuietLayeredArt={ready,readySections,sections,near,drawNear,drawSections,background,backdropFrame,cacheStats:()=>({pictures:pictures.size,filterPasses:filters,farCanvases:pictures.has('quietFar')?1:0,fringePictures:fringes.size,fringeLimit,fringeBuilds,fringeBytes:[...fringes.values()].reduce((n,f)=>n+f.canvas.width*f.canvas.height*4,0),sectionLayerBuilds,sectionLayerBytes:sectionLayer?sectionLayer.width*sectionLayer.height*4:0})};
})(globalThis);
