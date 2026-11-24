(function(G){'use strict';
// Continue the *painted* boundary, not collision boxes. Empty shaft gaps stay
// transparent. This cache is bounded to one stage and contains no game state.
const S=G.HonroScene.prototype,draw=S.landmark,bounds=S._landmarkPaintBounds,stage42Parts=new WeakMap(),stage44Parts=new WeakMap(),stage45Parts=new WeakMap(),stage47Parts=new WeakMap(),stage46Parts=new WeakMap(),stage48Parts=new WeakMap(),stage49Parts=new WeakMap();
// Stage45's stacked opaque faces must meet the depth mask as one image.
// Per-face antialiased clipping repeatedly accumulates coverage into a pale rim.
// Temporary surfaces are capped at1024² and released, never retained per world.
// One pair of bounded scratch surfaces serves every BODY pass of one landmark draw (a Stage46
// tile makes four passes) and is released when that landmark finishes, success or failure.
// Allocating and releasing a pair per pass was most of an empty Stage46 tile's 9 ms.
function releaseScratch(scene){const q=scene._act5Scratch;if(!q)return;scene._act5Scratch=null;scene._releaseRasterCanvas(q.cv);scene._releaseRasterCanvas(q.mask);}
function scratch(scene,w,h){
 const q=scene._act5Scratch;if(q&&q.w===w&&q.h===h)return q;
 if(q)releaseScratch(scene);
 const cv=scene._makeLayerCanvas(w,h),mask=scene._makeLayerCanvas(w,h);
 return scene._act5Scratch={w,h,cv,mask,raw:cv.getContext('2d'),mc:mask.getContext('2d'),busy:false};
}
// Mask bounds (absolute M/L/C/Z clip data only): a pass whose mask misses the target is skipped.
const maskBounds=new WeakMap();
function maskPath(strings){const d=strings.join(' '),p=new Path2D(d);
 // Absolute commands only (relative ones other than z leave the pass unculled). Arcs add
 // their radii around both ends, which is conservative.
 if(!/[a-yA-Y]/.test(d.replace(/[MLCA]/g,''))){const tok=d.match(/[MLCAZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi)||[];
  let l=Infinity,t=Infinity,r=-Infinity,b=-Infinity,cmd='',i=0,px=0,py=0;const add=(x,y,ex=0,ey=0)=>{l=Math.min(l,x-ex);r=Math.max(r,x+ex);t=Math.min(t,y-ey);b=Math.max(b,y+ey);};
  const num=()=>+tok[i++];
  while(i<tok.length){if(/[MLCAZz]/.test(tok[i])){cmd=tok[i++];continue;}
   if(cmd==='M'||cmd==='L'){px=num();py=num();add(px,py);}
   else if(cmd==='C'){for(let k=0;k<3;k++){const x=num(),y=num();add(x,y);px=x;py=y;}}
   else if(cmd==='A'){const rx=Math.abs(num()),ry=Math.abs(num());num();num();num();const x=num(),y=num();const e=Math.max(rx,ry);add(px,py,e,e);add(x,y,e,e);px=x;py=y;}
   else{l=NaN;break;}}
  if([l,t,r,b].every(Number.isFinite))maskBounds.set(p,{l,t,r,b});}
 return p;}
function maskMisses(c,asset,mask,w,h){const q=maskBounds.get(mask);if(!q||typeof DOMMatrix==='undefined'||G.HonroAct5EdgeArt?.noCull)return false;
 let M=c.getTransform().translate(-(asset.anchor?.x||0),-(asset.anchor?.y||0));const rt=asset.vector?.root?.transform;if(rt)M=M.multiply(new DOMMatrix(rt));
 const P=[[q.l,q.t],[q.r,q.t],[q.l,q.b],[q.r,q.b]].map(([x,y])=>M.transformPoint({x,y}));const pad=2;
 return P.every(p=>p.x<-pad)||P.every(p=>p.x>w+pad)||P.every(p=>p.y<-pad)||P.every(p=>p.y>h+pad);}
function stage45Body(scene,c,asset,mask){
 const w=c.canvas.width,h=c.canvas.height;if(!w||!h)return;
 if(maskMisses(c,asset,mask,w,h))return;
 const pool=scratch(scene,Math.min(1024,w),Math.min(1024,h));if(pool.busy)return stage45BodyFresh(scene,c,asset,mask);pool.busy=true;
 const m=c.getTransform(),cv=pool.cv,raw=pool.raw,V=G.HonroVisualStyle,paint=V?.contextLike(c,raw)||raw,maskCanvas=pool.mask,mc=pool.mc;
 try{
  raw.save();mc.save();try{
  for(let y=0;y<h;y+=1024)for(let x=0;x<w;x+=1024){
   const tw=Math.min(1024,w-x),th=Math.min(1024,h-y);
   raw.setTransform(1,0,0,1,0,0);raw.globalAlpha=1;raw.globalCompositeOperation='source-over';raw.clearRect(0,0,cv.width,cv.height);
   raw.setTransform(m.a,m.b,m.c,m.d,m.e-x,m.f-y);
   for(const part of asset.paintParts||[asset])G.HonroVectorArt.draw(paint,part,{x:0,y:0,scale:1});
   mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,maskCanvas.width,maskCanvas.height);
   mc.setTransform(m.a,m.b,m.c,m.d,m.e-x,m.f-y);mc.translate(-(asset.anchor?.x||0),-(asset.anchor?.y||0));
   mc.transform(...(asset.vector.root.transform||[1,0,0,1,0,0]));mc.fillStyle='#ffffff';mc.fill(mask);
   raw.save();raw.setTransform(1,0,0,1,0,0);raw.globalAlpha=1;raw.globalCompositeOperation='destination-in';raw.drawImage(maskCanvas,0,0);raw.restore();
   c.save();try{c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0,tw,th,x,y,tw,th);}finally{c.restore();}
  }
  }finally{raw.restore();mc.restore();}
 }finally{pool.busy=false;}
}
function stage45BodyFresh(scene,c,asset,mask){
 const w=c.canvas.width,h=c.canvas.height;if(!w||!h)return;
 const m=c.getTransform(),cv=scene._makeLayerCanvas(Math.min(1024,w),Math.min(1024,h)),raw=cv.getContext('2d'),V=G.HonroVisualStyle,paint=V?.contextLike(c,raw)||raw;
 let maskCanvas;
 try{
  maskCanvas=scene._makeLayerCanvas(cv.width,cv.height);const mc=maskCanvas.getContext('2d');
  for(let y=0;y<h;y+=1024)for(let x=0;x<w;x+=1024){
   const tw=Math.min(1024,w-x),th=Math.min(1024,h-y);
   raw.setTransform(1,0,0,1,0,0);raw.globalAlpha=1;raw.globalCompositeOperation='source-over';raw.clearRect(0,0,cv.width,cv.height);
   raw.setTransform(m.a,m.b,m.c,m.d,m.e-x,m.f-y);
   for(const part of asset.paintParts||[asset])G.HonroVectorArt.draw(paint,part,{x:0,y:0,scale:1});
   // Rasterize coverage in source-over first. Native Canvas may incorrectly
   // clear a whole tile for destination-in fill of a large transformed Path2D.
   mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,maskCanvas.width,maskCanvas.height);
   mc.setTransform(m.a,m.b,m.c,m.d,m.e-x,m.f-y);mc.translate(-(asset.anchor?.x||0),-(asset.anchor?.y||0));
   mc.transform(...(asset.vector.root.transform||[1,0,0,1,0,0]));mc.fillStyle='#ffffff';mc.fill(mask);
   raw.save();raw.setTransform(1,0,0,1,0,0);raw.globalAlpha=1;raw.globalCompositeOperation='destination-in';raw.drawImage(maskCanvas,0,0);raw.restore();
   // The caller's clip, opacity, blend mode and filter apply once at composition.
   c.save();try{c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0,tw,th,x,y,tw,th);}finally{c.restore();}
  }
 }finally{if(maskCanvas)scene._releaseRasterCanvas(maskCanvas);scene._releaseRasterCanvas(cv);}
}
// Only Stage43 contact: its opaque color stack is composed before coverage clips.
// Cache geometry/Path2D, not viewport-sized bitmaps. Existing domain tile caches
// retain the result; direct exterior draws use/release one bounded scratch tile.
const stage43ContactParts=new WeakMap();
function contact43Parts(asset){
 if(stage43ContactParts.has(asset))return stage43ContactParts.get(asset);
 const clips=[],identity=[1,0,0,1,0,0],multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
 let safe=true;
 const copy=(node,matrix,shared)=>{
  const matrixHere=node.transform?multiply(matrix,node.transform):matrix,q={...node};
  if(node.clipPath){
   // A clip on one branch cannot become an intersection over every sibling.
   if(!shared||node.pixelSnapClip){safe=false;return node;}
   const ds=asset.vector.clips?.[node.clipPath];if(!ds){safe=false;return node;}
   clips.push({path:new Path2D(ds.join(' ')),matrix:matrixHere});delete q.clipPath;
  }
  if(node.children)q.children=node.children.map(child=>copy(child,matrixHere,shared&&node.children.length===1));
  if(node.tag==='use')safe=false;
  return q;
 };
 const root=copy(asset.vector.root,identity,true),result=safe?{asset:{...asset,vector:{...asset.vector,root}},clips}:null;
 stage43ContactParts.set(asset,result);return result;
}
function contact43(scene,c,asset){
 const prepared=contact43Parts(asset);if(!prepared){G.HonroVectorArt.draw(c,asset,{x:0,y:0,scale:1});return;}
 const m=c.getTransform(),a=asset.anchor||{},b=asset.bounds,ax=a.x||0,ay=a.y||0;
 const points=[[b.x-ax,b.y-ay],[b.x+b.w-ax,b.y-ay],[b.x-ax,b.y+b.h-ay],[b.x+b.w-ax,b.y+b.h-ay]].map(([x,y])=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);
 const left=Math.max(0,Math.floor(Math.min(...points.map(p=>p[0])))-1),top=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1])))-1),
  right=Math.min(c.canvas.width,Math.ceil(Math.max(...points.map(p=>p[0])))+1),bottom=Math.min(c.canvas.height,Math.ceil(Math.max(...points.map(p=>p[1])))+1);
 if(right<=left||bottom<=top)return;
 // Keep device-tile origins stable; ordinary desktop/mobile surfaces fit once.
 const cap=2048,x0=Math.floor(left/cap)*cap,y0=Math.floor(top/cap)*cap,x1=Math.min(c.canvas.width,Math.ceil(right/cap)*cap),y1=Math.min(c.canvas.height,Math.ceil(bottom/cap)*cap);
 const cv=scene._makeLayerCanvas(Math.min(cap,x1-x0),Math.min(cap,y1-y0)),raw=cv.getContext('2d'),paint=G.HonroVisualStyle?.contextLike(c,raw)||raw;
 try{
  for(let y=y0;y<y1;y+=cap)for(let x=x0;x<x1;x+=cap){
   const w=Math.min(cap,x1-x),h=Math.min(cap,y1-y);
   raw.setTransform(1,0,0,1,0,0);raw.globalAlpha=1;raw.globalCompositeOperation='source-over';raw.clearRect(0,0,cv.width,cv.height);
   // Exact current device scale/phase, including domain-raster scale and viewport.
   raw.setTransform(m.a,m.b,m.c,m.d,m.e-x,m.f-y);G.HonroVectorArt.draw(paint,prepared.asset,{x:0,y:0,scale:1});
   c.save();try{
    c.translate(-ax,-ay);const base=c.getTransform();
    for(const clip of prepared.clips){c.transform(...clip.matrix);c.clip(clip.path);c.setTransform(base.a,base.b,base.c,base.d,base.e,base.f);}
    // Existing caller clip/style/alpha still apply once to this finished image.
    c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0,w,h,x,y,w,h);
   }finally{c.restore();}
  }
 }finally{scene._releaseRasterCanvas(cv);}
}
// Stage41 only: paint each complete stack, then apply its unchanged outer
// coverage once. Geometry is cached; bounded scratch canvases never are.
const stage41Masks=new WeakMap();
function campMasks(asset){
 let masks=stage41Masks.get(asset);if(masks)return masks;
 const p=(d,rule='nonzero')=>[new Path2D(d),rule];
 masks={
  main:[p('M-10000 -10000H10000V10000H-10000Z M0 0H300V560L190 650Q200 720 300 750V827H0Z','evenodd'),p('M0 0H1902V350H1796V428H1838V438Q1841 456 1820 466Q1790 476 1790 488Q1794 505 1820 514V530H1902V827H0Z')],
  overlay:[p('M300 428H1838V438H300ZM300 514H1902V529H300ZM0 545Q35 546 70 548L130 555L220 562L280 566L300 557V565L280 574L220 570L130 563L70 556Q35 550 0 545Z')],
  west:[p('M-1400 -500H300V560L190 650Q200 720 300 750V1200H-1400Z')],
  east:[p('M1796 350H4000V4400H1902V827L1893 770L1902 710L1887 655L1902 600L1885 557L1902 530H1820V514Q1794 505 1790 488Q1790 476 1820 466Q1841 456 1838 438V428H1796Z')],
  deep:[p('M-1400 1000Q-600 1010 300 1000Q900 800 1700 780Q1850 760 2020 645Q2900 655 4010 650V3500H-1400Z')]
 };
 stage41Masks.set(asset,masks);return masks;
}
function campPost(scene,c,masks,paint,{placement=null,styled=false}={}){
 const w=c.canvas.width,h=c.canvas.height;if(!w||!h)return;
 const m=c.getTransform();let cv,maskCanvas;
 try{
  cv=scene._makeLayerCanvas(Math.min(1024,w),Math.min(1024,h));
  maskCanvas=scene._makeLayerCanvas(cv.width,cv.height);
  const raw=cv.getContext('2d'),mc=maskCanvas.getContext('2d'),V=G.HonroVisualStyle;
  // Source uses the original landmark wrapper (including its style handling).
  // Camp paint already has V.context, so transfer only that style to scratch.
  const ink=styled&&V?V.contextLike(c,raw):raw;
  for(let y=0;y<h;y+=1024)for(let x=0;x<w;x+=1024){
   raw.setTransform(1,0,0,1,0,0);raw.globalAlpha=1;raw.globalCompositeOperation='source-over';raw.clearRect(0,0,cv.width,cv.height);
   raw.setTransform(m.a,m.b,m.c,m.d,m.e-x,m.f-y);paint(ink);
   mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,maskCanvas.width,maskCanvas.height);
   mc.setTransform(m.a,m.b,m.c,m.d,m.e-x,m.f-y);
   if(placement){mc.translate(placement.x,placement.y);mc.scale(placement.scale??1,placement.scale??1);}
   mc.save();try{
    for(let i=0;i<masks.length-1;i++)mc.clip(...masks[i]);
    mc.fillStyle='#fff';mc.fill(...masks[masks.length-1]);
   }finally{mc.restore();}
   // Raster coverage first avoids Native Canvas destination-in fill quirks.
   raw.save();try{raw.setTransform(1,0,0,1,0,0);raw.globalAlpha=1;raw.globalCompositeOperation='destination-in';raw.drawImage(maskCanvas,0,0);}finally{raw.restore();}
   // Caller transform, clip, opacity, filter and blend remain unchanged.
   const tw=Math.min(1024,w-x),th=Math.min(1024,h-y);
   c.save();try{c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0,tw,th,x,y,tw,th);}finally{c.restore();}
  }
 }finally{try{if(maskCanvas)scene._releaseRasterCanvas(maskCanvas);}finally{if(cv)scene._releaseRasterCanvas(cv);}}
}
// Optional native-precomputed intersections replace nested intrinsic/outer masks.
// Each source branch is immutable; its original landmark wrapper still paints it.
const campCoveredSource=new WeakMap();
function campSourceCoverage(asset){
 if(!asset.campSourceCoverage)return null;
 let prepared=campCoveredSource.get(asset);if(prepared)return prepared;
 const root=asset.vector.root,coverage=asset.campSourceCoverage;
 if(root.clipPath||root.children?.length!==2)throw Error('Unexpected stage41 source branches');
 for(const phase of ['main','overlay'])if(!Array.isArray(coverage[phase])||coverage[phase].length!==2)throw Error('Invalid stage41 source coverage');
 prepared=root.children.map((branch,index)=>{
  const key=index===0?'a':'b';let found=0;
  const copy=(node,shared)=>{
   const q={...node};
   if(node.clipPath===key){if(!shared||found++)throw Error('Unexpected stage41 native source clip');delete q.clipPath;}
   if(node.children)q.children=node.children.map(child=>copy(child,shared&&node.children.length===1));
   return q;
  };
  const node=copy(branch,true);if(found!==1)throw Error('Missing stage41 native source clip');
  const masks={};for(const phase of ['main','overlay']){
   const paths=coverage[phase][index];if(!Array.isArray(paths)||paths.some(d=>typeof d!=='string'))throw Error('Invalid stage41 native coverage paths');
   masks[phase]=[[new Path2D(paths.join(' ')),'nonzero']];
  }
  return{asset:{...asset,vector:{...asset.vector,root:{...root,children:[node]}}},masks};
 });campCoveredSource.set(asset,prepared);return prepared;
}
function campPaintSource(scene,c,l,phase){
 const prepared=campSourceCoverage(l.asset);
 if(!prepared){campPost(scene,c,campMasks(l.asset)[phase],ink=>draw.call(scene,ink,l),{placement:l});return;}
 for(const part of prepared)campPost(scene,c,part.masks[phase],ink=>draw.call(scene,ink,{...l,asset:part.asset}),{placement:l});
}
// Complementary ownership group. Source a/b retain source-over;
// only disjoint source/west/fill ownership is summed premultiplied.
function campOwnershipGroup(scene,c,l){
 const w=c.canvas.width,h=c.canvas.height;if(!w||!h)return;
 const m=c.getTransform(),masks=campMasks(l.asset),V=G.HonroVisualStyle;let cv;
 try{
  cv=scene._makeLayerCanvas(Math.min(1024,w),Math.min(1024,h));const raw=cv.getContext('2d');
  for(let y=0;y<h;y+=1024)for(let x=0;x<w;x+=1024){
   raw.setTransform(1,0,0,1,0,0);raw.globalAlpha=1;raw.globalCompositeOperation='source-over';raw.clearRect(0,0,cv.width,cv.height);
   raw.setTransform(m.a,m.b,m.c,m.d,m.e-x,m.f-y);
   campPaintSource(scene,raw,l,'main');
   raw.globalCompositeOperation='lighter';
   const ink=V?V.context(raw,V.classify(l,scene.battle,l.asset)==='gameplay'?'gameplay':V.depth(l,l.asset)):raw;
   ink.save();try{
    ink.translate(l.x,l.y);ink.scale(l.scale??1,l.scale??1);
    ink.fillStyle='#3a3029';ink.fillRect(300,l.asset.vector.viewBox[3],l.asset.vector.viewBox[2]-300,2400-l.asset.vector.viewBox[3]);
    campPost(scene,ink,masks.west,paint=>G.HonroVectorArt.draw(paint,l.asset.campExterior.west,{x:-1300,y:-100,scale:1.1}),{styled:true});
   }finally{ink.restore();}
   const tw=Math.min(1024,w-x),th=Math.min(1024,h-y);
   c.save();try{c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0,tw,th,x,y,tw,th);}finally{c.restore();}
  }
 }finally{if(cv)scene._releaseRasterCanvas(cv);}
}
function camp(scene,c,l){
 const V=G.HonroVisualStyle;if(V)c=V.context(c,V.classify(l,scene.battle,l.asset)==='gameplay'?'gameplay':V.depth(l,l.asset));
 c.save();try{c.translate(l.x,l.y);c.scale(l.scale??1,l.scale??1);campPost(scene,c,campMasks(l.asset).east,ink=>G.HonroVectorArt.draw(ink,l.asset.campExterior.east,{x:1700,y:-25,scale:2.4}),{styled:true});campPost(scene,c,campMasks(l.asset).deep,ink=>G.HonroVectorArt.draw(ink,l.asset.campExterior.deep,{x:-1400,y:600,scale:3.05}),{styled:true});}finally{c.restore();}
}
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
 try{return act5Landmark.call(this,c,l);}finally{releaseScratch(this);}
};
function act5Landmark(c,l){
 // Keep the withdrawn Stage44 underside in the active registry and in saves.
 // Only its original canonical scenery placement is invisible, including after Continue.
 if(l.id==='a5-under'&&l.asset?.id==='act5:under:44'&&l.x===160&&l.y===586&&l.scale===3.2&&(l.rotation??0)===0){
  const b=this.battle;
  if(b?.mode==='campaign'&&b.honroStage===44&&b.honroCanonical===true&&b.honroCustom===false&&
     b.honroMapOrigin==='campaign'&&b.honroAuthoredId==='stage-44')return;
 }
 if(l.asset?.id==='act5:near:48'&&l.asset.continuousBody&&!l.rotation){
 const a=l.asset,z=l.scale??1,V=G.HonroVisualStyle,cc=V?V.context(c,V.classify(l,this.battle,a)==='gameplay'?'gameplay':V.depth(l,a)):c;
 let parts=stage48Parts.get(a);if(!parts){
  const unmask=part=>{const copy=node=>{const q={...node};if(q.clipPath==='native-source-alpha')delete q.clipPath;if(q.children)q.children=q.children.map(copy);return q;};return{...part,vector:{...part.vector,root:{tag:'g',children:[copy(part.vector.root)]}}};};
  parts=[['body',unmask(a.continuousBody)],['joint',unmask(a.jointBody)],['source',a]].map(([key,asset])=>({asset,mask:new Path2D(a.compositionMasks[key].join(' '))}));stage48Parts.set(a,parts);
 }
 cc.save();try{cc.translate(l.x,l.y);cc.scale(z,z);for(const p of parts)stage45Body(this,cc,p.asset,p.mask);}finally{cc.restore();}return;
 }

 if(l.asset?.id==='act5:near:46'&&l.asset.shaftExterior&&!l.rotation){
  const a=l.asset,z=l.scale??1,V=G.HonroVisualStyle,cc=V?V.context(c,V.classify(l,this.battle,a)==='gameplay'?'gameplay':V.depth(l,a)):c;
  let keep=stage46Parts.get(a);if(!keep){const body=a.shaftExterior,parts=[body,...(a.shaftExteriorParts||[])].map(part=>{const root={...part.vector.root};delete root.clipPath;return{...part,vector:{...part.vector,root}};});
   const tree=a.shaftTree,treeRoot=tree?{...tree.vector.root}:null;if(treeRoot)delete treeRoot.clipPath;keep={tree:tree?{...tree,vector:{...tree.vector,root:treeRoot}}:null,treeMask:tree?maskPath(tree.vector.clips['native-source-alpha']):null,body:{...parts[0],paintParts:parts},bodyMask:maskPath(body.vector.clips['native-source-alpha']),originals:['a','b'].map((key,i)=>{const root={...a.vector.root.children[i]};delete root.clipPath;return{asset:{...a,vector:{...a.vector,symbols:{},root}},mask:maskPath(a.shaftProtected[key])};}),interior:{...a,vector:{...a.vector,root:{tag:'g',children:a.vector.root.children.slice(2)}}}};stage46Parts.set(a,keep);}
  cc.save();try{cc.translate(l.x,l.y);cc.scale(z,z);stage45Body(this,cc,keep.body,keep.bodyMask);if(keep.tree)stage45Body(this,cc,keep.tree,keep.treeMask);for(const original of keep.originals)stage45Body(this,cc,original.asset,original.mask);G.HonroVectorArt.draw(cc,keep.interior,{x:0,y:0,scale:1});}finally{cc.restore();}return;
 }


 if(l.asset?.id==='act5:near:43'&&l.asset.nativeContinuity&&!l.rotation){
  // Stage43 candidate: native BODY behind the untouched source, then local joins.
  // No rectangular foreground band, source clipping rewrite, or sampled edge cache.
  const a=l.asset,parts=a.nativeContinuity,z=l.scale??1,V=G.HonroVisualStyle,
   cc=V?V.context(c,V.classify(l,this.battle,a)==='gameplay'?'gameplay':V.depth(l,a)):c;
  const paint=art=>{if(!art)return;cc.save();try{cc.translate(l.x,l.y);cc.scale(z,z);G.HonroVectorArt.draw(cc,art,{x:0,y:0,scale:1});}finally{cc.restore();}};
  paint(parts.deep);draw.call(this,c,l);paint(parts.west);if(parts.contact){cc.save();try{cc.translate(l.x,l.y);cc.scale(z,z);contact43(this,cc,parts.contact);}finally{cc.restore();}}return;
 }

 if(['act5:near:49','act5:near:50'].includes(l.asset?.id)&&l.asset.shaftExterior&&!l.rotation){
  const a=l.asset,z=l.scale??1,V=G.HonroVisualStyle,cc=V?V.context(c,V.classify(l,this.battle,a)==='gameplay'?'gameplay':V.depth(l,a)):c;
  let parts=stage49Parts.get(a);if(!parts){const body=a.shaftExterior,root={...body.vector.root};delete root.clipPath;parts={body:{...body,vector:{...body.vector,root}},mask:new Path2D(body.vector.clips['native-source-alpha'].join(' ')),sourceMask:new Path2D(a.sourcePreserved.join(' '))};stage49Parts.set(a,parts);}
  cc.save();try{cc.translate(l.x,l.y);cc.scale(z,z);stage45Body(this,cc,parts.body,parts.mask);stage45Body(this,cc,a,parts.sourceMask);}finally{cc.restore();}return;
 }
 if(l.asset?.id==='act5:near:47'&&l.asset.shaftExterior&&!l.rotation){
  const a=l.asset,z=l.scale??1,V=G.HonroVisualStyle,cc=V?V.context(c,V.classify(l,this.battle,a)==='gameplay'?'gameplay':V.depth(l,a)):c;
  cc.save();cc.translate(l.x,l.y);cc.scale(z,z);
  let props=stage47Parts.get(a);if(!props){const part=i=>({...a,vector:{...a.vector,root:{tag:'g',children:[a.vector.root.children[i]]}}});props={doors:part(0),stairs:part(3)};stage47Parts.set(a,props);}
  G.HonroVectorArt.draw(cc,props.doors,{x:0,y:0,scale:1});G.HonroVectorArt.draw(cc,a.shaftExterior,{x:0,y:0,scale:1});G.HonroVectorArt.draw(cc,props.stairs,{x:0,y:0,scale:1});cc.restore();return;
 }

 if(l.asset?.id==='act5:near:45'&&l.asset.continuousBody&&!l.rotation){
  const a=l.asset,z=l.scale??1,V=G.HonroVisualStyle,cc=V?V.context(c,V.classify(l,this.battle,a)==='gameplay'?'gameplay':V.depth(l,a)):c;
  let props=stage45Parts.get(a);if(!props){const part=(index,clip,key)=>({...a,vector:{...a.vector,clips:{...a.vector.clips,[key]:clip},root:{tag:'g',children:[a.vector.root.children[index]]}}});const native=(asset,clip)=>({...asset,vector:{...asset.vector,clips:{...asset.vector.clips,'native-source-alpha':clip}}});
   const dark=n=>({...n,...(/^#[0-9a-f]{6}$/i.test(n.fill||'')?{fill:'#'+[1,3,5].map(i=>Math.round(parseInt(n.fill.slice(i,i+2),16)*.64).toString(16).padStart(2,'0')).join('')}:{}),...(n.children?{children:n.children.map(dark)}:{})});
   const back=native(a.continuousBody,a.continuousBody.vector.clips['native-source-alpha']);back.params={...back.params,semanticLayer:'BACK',nonplayEnvironment:true,silhouetteUnderpaint:false};back.vector={...back.vector,root:dark(back.vector.root)};
   props={main:part(1,a.preservedClips.props,'props-a'),wall:part(0,a.preservedClips.wall,'body-a'),shrub:part(1,a.preservedClips.shrub,'props-a'),back,deepMask:new Path2D(a.depthClips.deep.join(' '))};stage45Parts.set(a,props);}
  cc.save();try{cc.translate(l.x,l.y);cc.scale(z,z);G.HonroVectorArt.draw(V?V.context(cc,'L3'):cc,props.back,{x:0,y:0,scale:1});stage45Body(this,cc,a.continuousBody,props.deepMask);G.HonroVectorArt.draw(cc,props.wall,{x:0,y:0,scale:1});G.HonroVectorArt.draw(cc,props.main,{x:0,y:0,scale:1});G.HonroVectorArt.draw(cc,props.shrub,{x:-64.36,y:-112.2,scale:1});}finally{cc.restore();}return;
 }

 if(l.asset?.id==='act5:near:44'&&l.asset.rootExterior&&!l.rotation){
  const V=G.HonroVisualStyle,cc=V?V.context(c,V.classify(l,this.battle,l.asset)==='gameplay'?'gameplay':V.depth(l,l.asset)):c,z=l.scale??1;
  cc.save();cc.translate(l.x,l.y);cc.scale(z,z);G.HonroVectorArt.draw(cc,l.asset.rootExterior,{x:0,y:0,scale:1});cc.restore();
  cc.save();cc.translate(l.x,l.y);cc.scale(z,z);let upper=stage44Parts.get(l.asset);if(!upper){upper={...l.asset,vector:{...l.asset.vector,clips:{...l.asset.vector.clips,a:l.asset.rootUpperClip}}};stage44Parts.set(l.asset,upper);}G.HonroVectorArt.draw(cc,upper,{x:0,y:0,scale:1});if(l.asset.upperCanopy)G.HonroVectorArt.draw(cc,l.asset.upperCanopy,{x:0,y:0,scale:1});cc.restore();return;
 }

 if(l.asset?.id==='act5:near:42'&&l.asset.edgeWall&&!l.rotation){
  const a=l.asset,z=l.scale??1;
  const V=G.HonroVisualStyle,cc=V?V.context(c,V.classify(l,this.battle,a)==='gameplay'?'gameplay':V.depth(l,a)):c;
  draw.call(this,c,l);
  cc.save();cc.translate(l.x,l.y);cc.scale(z,z);
  // BODY already owns its source-contact and exterior-alpha clips.
  // A redundant concave outer clip produced a flat fill outside the cliff.
  cc.save();
  G.HonroVectorArt.draw(cc,a.edgeWall,{x:0,y:0,scale:1});cc.restore();
  cc.save();cc.clip(new Path2D('M0 0H2022V700H0Z'));G.HonroVectorArt.draw(cc,a.edgeSurface,{x:0,y:0,scale:1});cc.restore();
  let parts=stage42Parts.get(a);
  if(!parts){const props={...a,vector:{...a.vector,root:{tag:'g',children:[a.vector.root.children[1]]}}};
   parts={props,withoutCutShrub:new Path2D('M-10000 -10000H10000V10000H-10000Z '+a.edgeSurface.params.croppedEdgeShrub),wholeShrub:new Path2D(a.edgeSurface.params.wholeShrub)};stage42Parts.set(a,parts);}
  cc.save();cc.clip(parts.withoutCutShrub,'evenodd');G.HonroVectorArt.draw(cc,parts.props,{x:0,y:0,scale:1});cc.restore();
  cc.save();cc.translate(-533,6.7);cc.clip(parts.wholeShrub);G.HonroVectorArt.draw(cc,parts.props,{x:0,y:0,scale:1});cc.restore();
  cc.restore();return;
 }
 if(l.asset?.id==='act5:near:41'&&l.asset.campExterior&&!l.rotation){
 campOwnershipGroup(this,c,l);camp(this,c,l);campPaintSource(this,c,l,'overlay');return;}


 if(!active(l)||l.rotation)return draw.call(this,c,l);
 const q=prepare(this,l),scale=l.scale??1;
 draw.call(this,c,l);
 c.save();c.translate(l.x,l.y);c.scale(scale,scale);c.drawImage(q.canvas,-q.pad,0,q.w,q.h);c.restore();
};
S._landmarkPaintBounds=function(l){const q=bounds.call(this,l);if(!q||!active(l)||l.rotation)return q;if(l.asset?.id==='act5:near:46'&&l.asset.shaftExterior){const s=l.scale??1,a=l.asset.shaftExterior.bounds;return{left:Math.min(q.left,l.x+a.x*s),right:Math.max(q.right,l.x+(a.x+a.w)*s),top:Math.min(q.top,l.y+a.y*s),bottom:Math.max(q.bottom,l.y+(a.y+a.h)*s)};}if(l.asset?.id==='act5:near:43'&&l.asset.nativeContinuity){const z=l.scale??1,all=Object.values(l.asset.nativeContinuity).filter(a=>a?.bounds);return{left:Math.min(q.left,...all.map(a=>l.x+(a.bounds.x-(a.anchor?.x||0))*z)),right:Math.max(q.right,...all.map(a=>l.x+(a.bounds.x+a.bounds.w-(a.anchor?.x||0))*z)),top:Math.min(q.top,...all.map(a=>l.y+(a.bounds.y-(a.anchor?.y||0))*z)),bottom:Math.max(q.bottom,...all.map(a=>l.y+(a.bounds.y+a.bounds.h-(a.anchor?.y||0))*z))};}if(['act5:near:47','act5:near:49','act5:near:50'].includes(l.asset?.id)&&l.asset.shaftExterior){const s=l.scale??1,a=l.asset.shaftExterior.bounds;return{left:Math.min(q.left,l.x+a.x*s),right:Math.max(q.right,l.x+(a.x+a.w)*s),top:Math.min(q.top,l.y+a.y*s),bottom:Math.max(q.bottom,l.y+(a.y+a.h)*s)};}if(['act5:near:45','act5:near:48'].includes(l.asset?.id)&&l.asset.continuousBody){const s=l.scale??1,all=[l.asset.continuousBody.bounds];return{left:Math.min(q.left,...all.map(a=>l.x+a.x*s)),right:Math.max(q.right,...all.map(a=>l.x+(a.x+a.w)*s)),top:Math.min(q.top,...all.map(a=>l.y+a.y*s)),bottom:Math.max(q.bottom,...all.map(a=>l.y+(a.y+a.h)*s))};}if(l.asset?.id==='act5:near:44'&&l.asset.rootExterior){const s=l.scale??1;return{left:q.left-400*s,right:q.right+400*s,top:q.top-(l.asset.upperCanopy?710*s:0),bottom:q.bottom+300*s};}if(l.asset?.id==='act5:near:42'){const s=l.scale??1,a=l.asset.edgeWall.bounds;return{left:Math.min(q.left-900*s,l.x+(a.x-(l.asset.edgeWall.anchor?.x||0))*s),right:Math.max(q.right+900*s,l.x+(a.x+a.w-(l.asset.edgeWall.anchor?.x||0))*s),top:Math.min(q.top,l.y+(a.y-(l.asset.edgeWall.anchor?.y||0))*s),bottom:Math.max(q.bottom+468*s,l.y+(a.y+a.h-(l.asset.edgeWall.anchor?.y||0))*s)};}if(l.asset?.id==='act5:near:41'&&l.asset.campExterior){const s=l.scale??1;return{left:l.x-2500*s,right:l.x+(l.asset.vector.viewBox[2]+2500)*s,top:q.top,bottom:l.y+3500*s};}const p=Math.min(l.asset.vector.viewBox[2]*.28,420)*(l.scale??1);return{left:q.left-p,right:q.right+p,top:q.top,bottom:q.bottom+p};};
// Artwork-only continuation beyond the tile-domain paint rectangle. Physics bounds unchanged.
const domainPaint=S._drawTerrainDomainTiles;
S._drawTerrainDomainTiles=function(c,b,w,h){
 domainPaint.call(this,c,b,w,h);if(![41,42,43,44,45,46,47,48,49,50].includes(b.honroStage))return;
 const v=G.HonroBounds.viewport(this,w,h),d=b.honroTerrainBounds,size=512/this._worldRasterScale(b,w);
 const left=Math.floor(d.left/size)*size,top=Math.floor(d.top/size)*size,right=(Math.floor(d.right/size)+1)*size,bottom=(Math.floor(d.bottom/size)+1)*size;
 if(v.left>=left&&v.right<=right&&v.top>=top&&v.bottom<=bottom)return;
 c.save();c.beginPath();c.rect(v.left-1,v.top-1,v.right-v.left+2,v.bottom-v.top+2);// Stage43 exterior coverage must share the domain tiles' rounded device edge.
 if([43,48,49,50].includes(b.honroStage)){const m=c.getTransform();if(m.b===0&&m.c===0&&m.a!==0&&m.d!==0){const sx=Math.round(left*m.a+m.e),sy=Math.round(top*m.d+m.f),ex=Math.round(right*m.a+m.e),ey=Math.round(bottom*m.d+m.f);c.rect((sx-m.e)/m.a,(sy-m.f)/m.d,(ex-sx)/m.a,(ey-sy)/m.d);}else c.rect(left,top,right-left,bottom-top);}else c.rect(left,top,right-left,bottom-top);c.clip('evenodd');
 for(const l of G.HonroTerrainDomain.materialLandmarks(b))if(l.asset?.id==='act5:near:'+b.honroStage)this.landmark(c,l);
 c.restore();
};
// Act 5 tile pacing (2026-11-24). Its near art costs 10-30 ms per 512 px tile (Stage46 17 ms
// even on empty tiles), so a camera move that uncovered a row built 3-6 tiles in one frame
// (Stage46 vertical pans: frames up to 200 ms). Build at most two tiles per frame; a missing
// tile shows a whole-domain low-resolution copy of the same painting for those few frames.
// Mobile keeps a few more tiles so the visible set no longer thrashes the 12-tile cache.
const act5Paced=b=>b?.honroStage>=41&&b.honroStage<=50&&!!b.honroTerrainBounds;
S._domainTileBudget=function(b,w){return act5Paced(b)?(w<900?1:2):Infinity;};
S._domainTileLimit=function(b,w){return act5Paced(b)?(w<900?20:32):undefined;};
S._domainTileFallback=function(c,b,w,left,top,size){
 if(!act5Paced(b))return false;
 const key=(b.session||b.honroStage)+':'+(b.sceneVersion||0)+':'+b.width+'x'+b.height;let f=this._act5TileFallback;
 // The stand-in is painted after entry, off the first frames; until then tiles build at once.
 if(f?.key!==key){
  if(f?.canvas){f.canvas.width=1;f.canvas.height=1;}
  this._act5TileFallback={key,pending:true};
  buildFallback(this,b,key);
  return false;
 }
 if(f.pending)return false;
 if(f.canvas.width<2)return false;
 c.save();c.beginPath();c.rect(left,top,size,size);c.clip();
 c.drawImage(f.canvas,(left-f.d.left)*f.rs,(top-f.d.top)*f.rs,size*f.rs,size*f.rs,left,top,size,size);c.restore();
 this._cacheStats.act5Deferred=(this._cacheStats.act5Deferred||0)+1;return true;
};
// Painted in horizontal bands, one per idle slice, so building it never makes one long task.
function idle(run){if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:1500});else setTimeout(run,120);}
function buildFallback(scene,b,key){
 const d=b.honroTerrainBounds,W=d.right-d.left,H=d.bottom-d.top,rs=Math.min(.2,Math.sqrt(2400000/(W*H)));
 const cv=scene._makeLayerCanvas(W*rs,H*rs),cc=cv.getContext('2d',{alpha:true}),bands=Math.max(1,Math.ceil(cv.height/320));let band=0;
 const step=()=>{const f=scene._act5TileFallback;if(f?.key!==key||scene.battle!==b){cv.width=1;cv.height=1;return;}
  const top=d.top+H*band/bands,bottom=d.top+H*(band+1)/bands;
  cc.setTransform(rs,0,0,rs,-d.left*rs,-d.top*rs);cc.save();cc.beginPath();cc.rect(d.left,top,W,bottom-top);cc.clip();
  const old=scene._staticCacheBuild;scene._staticCacheBuild=true;
  try{const view={left:d.left,right:d.right,top,bottom},landmarks=G.HonroTerrainDomain.materialLandmarks(b).filter(l=>scene._landmarkVisible(l,view));
   scene._landmarkLayer(cc,landmarks,'back');scene._landmarkLayer(cc,landmarks,'structural-back');
   for(const t of G.HonroTerrainDomain.render(b)){const r=scene._terrainPaintBounds(t);if(!t.broken&&r.bottom>=top&&r.top<=bottom)scene.terrain(cc,t);}
   for(const layer of ['mid','prop','front'])scene._landmarkLayer(cc,landmarks,layer);
  }catch{scene._act5TileFallback={key,canvas:{width:1},pending:false};cv.width=1;return;}finally{scene._staticCacheBuild=old;cc.restore();}
  if(++band<bands)return idle(step);
  scene._act5TileFallback={key,canvas:cv,rs,d};scene._cacheStats.act5Fallbacks=(scene._cacheStats.act5Fallbacks||0)+1;};
 idle(step);
}
const readability=S.terrainReadability;
S.terrainReadability=function(c,b,view){
 if(![41,42,43,44,45,46,47,48,49,50].includes(b.honroStage))return readability.call(this,c,b,view);
 const q=G.HonroTerrainReadability.prepare(b),saved=[],removed=[],keptWalkable=[];
 for(const group of q.groups){const edge=new Path2D();saved.push([group,group.edge]);for(const v of group.segments){const p=v.a,z=v.z,close=!v.walkable&&((b.honroStage===44&&b.honroCanonical===true&&b.honroCustom===false&&b.honroMapOrigin==='campaign'&&b.honroAuthoredId==='stage-44'&&group.id==='a5-root-floor'&&p.x===6700.39&&z.x===6700.39&&p.y===1733.2&&z.y===2269&&b.terrain?.some(t=>t.id===group.id&&!t.broken&&t.oneWay===false&&t.honroAct5Painted===true))||(b.honroStage===41&&b.honroCanonical===true&&b.honroCustom===false&&b.honroMapOrigin==='campaign'&&b.honroAuthoredId==='stage-41'&&group.id==='a5-lower-road'&&p.x===250&&z.x===250&&p.y===2785&&z.y===2343.75&&b.terrain?.some(t=>t.id===group.id&&!t.broken&&t.oneWay===false&&t.honroAct5Painted===true))||(b.honroStage===46&&['a5-left-cliff','a5-right-cliff'].includes(group.id))||(Math.abs(p.x-z.x)<.01&&(Math.abs(p.x)<.01||Math.abs(p.x-b.width)<.01))||(Math.abs(p.y-z.y)<.01&&p.y>=b.height-360));if(close)removed.push({id:group.id,...v});if(v.walkable)keptWalkable.push(v);if(!close)for(const [inkA,inkZ] of G.HonroTerrainReadability.paintPieces(b,group.id,p,z)){edge.moveTo(inkA.x,inkA.y);edge.lineTo(inkZ.x,inkZ.y);}}group.edge=edge;}
 G.HonroEdgeClosureQA={removed,keptWalkableCount:keptWalkable.length,walkableRemoved:removed.filter(v=>v.walkable).length};try{return readability.call(this,c,b,view);}finally{for(const [g,e]of saved)g.edge=e;}
};
// Stage44 east ramp: a5-root-floor climbs (5358.98,2012.11)->(5744.14,1819.53)->(6109.38,1812.89)->(6700.39,1733.2)
// across the root mass, but the near art has no path face there, so the walk guide floated.
// Lay the lower floor's own top face (highlight, body, shadow lip) under that guide only.
// Closed outlines (world units) drawn as smooth curves through edge midpoints.
const s44Smooth=ps=>{const p=new Path2D(),n=ps.length,mid=(a,z)=>[(a[0]+z[0])/2,(a[1]+z[1])/2];p.moveTo(...mid(ps[n-1],ps[0]));for(let i=0;i<n;i++){const a=ps[i],z=ps[(i+1)%n];p.quadraticCurveTo(a[0],a[1],...mid(a,z));}p.closePath();return p;};
// Top runs 4-6 under the guide; the strand thickens over the climb, thins on the flat, and ends round.
const S44_OUTLINES=[
 ['#47392f',[[5290,2030],[5359,2020],[5560,1922],[5744,1826],[6109,1819],[6420,1782],[6700,1740],[6752,1748],[6766,1778],[6720,1806],[6560,1826],[6380,1852],[6180,1880],[6000,1896],[5840,1910],[5720,1952],[5600,2010],[5470,2072],[5360,2092],[5290,2078]]],
 ['#674f3d',[[5296,2024],[5359,2017],[5560,1918],[5744,1824],[6109,1817],[6420,1779],[6700,1738],[6744,1744],[6752,1766],[6716,1786],[6560,1806],[6380,1830],[6180,1856],[6000,1872],[5840,1884],[5730,1922],[5610,1982],[5480,2044],[5370,2066],[5306,2056]]],
 ['#8b6a4f',[[5310,2020],[5359,2016],[5560,1917],[5744,1823],[6109,1816],[6420,1778],[6700,1737],[6732,1742],[6720,1758],[6560,1778],[6380,1800],[6180,1828],[6000,1842],[5850,1850],[5740,1876],[5620,1938],[5490,2002],[5380,2038],[5320,2034]]],
 ['#b59770',[[5340,2017],[5400,1996],[5560,1917],[5744,1823],[5900,1820],[6109,1816],[6300,1794],[6200,1806],[6040,1828],[5900,1832],[5760,1840],[5640,1890],[5500,1962],[5380,2014]]],
 ['#938e5d',[[5600,1898],[5700,1846],[5744,1823],[5860,1821],[5960,1820],[5900,1830],[5780,1834],[5690,1862],[5620,1900]]],
 ['#938e5d',[[6300,1793],[6420,1778],[6560,1758],[6620,1752],[6520,1768],[6400,1786],[6320,1798]]]
];
let s44Face=null;
const s44Paths=()=>s44Face||(s44Face=S44_OUTLINES.map(([ink,ps])=>[ink,s44Smooth(ps)]));
const s44Ramp=(b,l)=>b?.mode==='campaign'&&b.honroStage===44&&b.honroCanonical===true&&b.honroCustom===false&&b.honroMapOrigin==='campaign'&&
 b.honroAuthoredId==='stage-44'&&b.width===6800&&l.id==='a5-near'&&l.asset?.id==='act5:near:44'&&!l.rotation&&l.x===0&&l.y===0&&
 (G.HonroTerrainDomain?.render(b)||b.terrain||[]).some(t=>t.id==='a5-root-floor'&&!t.broken&&G.HONRO_CORE.poly(t).some(p=>p.x===5744.14&&p.y===1819.53)&&G.HONRO_CORE.poly(t).some(p=>p.x===6700.39&&p.y===1733.2));
const s44Landmark=S.landmark;S.landmark=function(c,l){
 const out=s44Landmark.call(this,c,l),b=this.battle;
 if(s44Ramp(b,l)){const V=G.HonroVisualStyle,a=l.asset,cc=V?V.context(c,V.classify(l,b,a)==='gameplay'?'gameplay':V.depth(l,a)):c;
  cc.save();try{for(const [ink,p] of s44Paths()){cc.fillStyle=ink;cc.fill(p);}}finally{cc.restore();}}
 return out;
};
// Stage44 root plate underside (user request 2026-11-24). The plate is the crown of a root mound:
// the Gwirim root body (act5:under:44, the same signed provider kept in saves) is drawn behind the
// plate, clipped to a mound whose flanks spread down and out, then sinks into shadow with depth.
// The withdrawn a5-under placement itself stays hidden; collision, saves and map revision are unchanged.
// Top edge stays behind the plate (its bottom is y2230-3000, west end x-1000) and below the provider's own top (y2050-2210).
// East of x7250 the plate thins into a rising root arm above that top, so the mound leaves the arm free there.
const S44_MOUND_TOP=[[-980,2170],[-700,2150],[-300,2300],[0,2380],[500,2450],[6000,2450],[6400,2350],[6800,2240],[7000,2232],[7200,2236]];
const S44_MOUND_EAST=[[7260,2250],[7520,2560],[7900,3060],[8380,3720],[8960,4520],[9620,5500],[10220,6600],[10660,7900],[10880,9600]];
const S44_MOUND_WEST=[[-1020,2240],[-1300,2760],[-1720,3380],[-2240,4080],[-2780,4880],[-3240,5800],[-3620,7200],[-3900,9600]];
const S44_MOUND_BOX={left:-3980,right:10960,top:2140,bottom:9650};
// Rounded lumps along each flank (outward bulge), like the plate's own lower edge.
const s44Flank=(ps,out)=>{const r=[ps[0]];for(let i=1;i<ps.length;i++){const a=ps[i-1],z=ps[i],dx=z[0]-a[0],dy=z[1]-a[1],L=Math.hypot(dx,dy),n=Math.max(1,Math.round(L/260));
 for(let k=1;k<=n;k++){const t0=(k-1)/n,t1=k/n,tm=(t0+t1)/2,bulge=(k%2?70:42)*out;r.push([a[0]+dx*tm-dy/L*bulge,a[1]+dy*tm+dx/L*bulge,a[0]+dx*t1,a[1]+dy*t1]);}}return r;};
let s44MoundPath=null;
const s44Mound=()=>{if(s44MoundPath)return s44MoundPath;const p=new Path2D();p.moveTo(...S44_MOUND_TOP[0]);for(const q of S44_MOUND_TOP.slice(1))p.lineTo(...q);
 for(const q of s44Flank(S44_MOUND_EAST,-1))q.length===4?p.quadraticCurveTo(...q):p.lineTo(...q);
 p.lineTo(10880,9640);p.lineTo(-3900,9640);
 for(const q of s44Flank([...S44_MOUND_WEST].reverse(),-1))q.length===4?p.quadraticCurveTo(...q):p.lineTo(...q);
 p.closePath();return s44MoundPath=p;};
const s44Plate=(b,l)=>b?.mode==='campaign'&&b.honroStage===44&&b.honroCanonical===true&&b.honroCustom===false&&b.honroMapOrigin==='campaign'&&
 b.honroAuthoredId==='stage-44'&&b.width===6800&&l?.id==='a5-near'&&l.asset?.id==='act5:near:44'&&l.asset.rootExterior&&!l.rotation&&l.x===0&&l.y===0;
const s44UnderAsset=b=>(b.honroLandmarks||[]).find(x=>x.id==='a5-under'&&x.asset?.id==='act5:under:44'&&x.asset.vector)?.asset||
 (G.HONRO_PROJECT?.library||[]).find(a=>a.id==='act5:under:44'&&a.vector)||null;
const s44UnderLandmark=S.landmark;S.landmark=function(c,l){
 const b=this.battle;
 if(c&&s44Plate(b,l)){const a=s44UnderAsset(b);if(a){const V=G.HonroVisualStyle,cc=V?V.context(c,'L2'):c,mound=s44Mound();
  cc.save();try{cc.clip(mound);cc.save();cc.translate(160,586);cc.scale(3.2,3.2);G.HonroVectorArt.draw(cc,a,{x:0,y:0,scale:1});cc.restore();
   const g=cc.createLinearGradient(0,2300,0,8200);g.addColorStop(0,'rgba(18,14,12,.38)');g.addColorStop(.28,'rgba(16,13,12,.62)');g.addColorStop(.6,'rgba(14,12,12,.84)');g.addColorStop(1,'rgba(12,11,12,.94)');
   cc.fillStyle=g;cc.fill(mound);}finally{cc.restore();}}}
 return s44UnderLandmark.call(this,c,l);
};
const s44UnderBounds=S._landmarkPaintBounds;S._landmarkPaintBounds=function(l){const q=s44UnderBounds.call(this,l);if(!q||!s44Plate(this.battle,l))return q;
 return{left:Math.min(q.left,S44_MOUND_BOX.left),right:Math.max(q.right,S44_MOUND_BOX.right),top:Math.min(q.top,S44_MOUND_BOX.top),bottom:Math.max(q.bottom,S44_MOUND_BOX.bottom)};};
// Stage44 (user request 2026-11-24): no terrain outline or walk-rim ink; the painted root plate reads on its own.
const s44Readability=S.terrainReadability;S.terrainReadability=function(c,b,view){
 if(b?.mode==='campaign'&&b.honroStage===44&&b.honroCanonical===true&&b.honroCustom===false&&b.honroMapOrigin==='campaign'&&b.honroAuthoredId==='stage-44'){this.terrainReadabilityStats={builds:0,groups:0,omitted:'stage44'};return;}
 return s44Readability.call(this,c,b,view);
};
G.HonroAct5EdgeArt={version:3};
})(globalThis);
