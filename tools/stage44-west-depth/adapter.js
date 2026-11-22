/** Scratch candidate. Not installed in project or published. */
const TILE=512, GUTTER=2, DIM=516, PERSIST=8, O='act5:stage44:west-buttress-r9';
const SCALE=3.130755064456722, cap=PERSIST*DIM*DIM*4;
const allowed=({left,top,right,bottom})=>left>=-5280&&right<=-306&&top>=2495&&bottom<=8971;
function prepareR9(G){
 const states=new WeakMap();
 const is44=b=>b?.honroStage===44&&b.honroCanonical===true&&b.honroCustom===false&&
   b.honroMapOrigin==='campaign'&&b.honroAuthoredId==='stage-44';
 function release(scene,q){if(!q)return; for(const cv of q.tiles.values())scene._releaseRasterCanvas(cv); if(q.spare)scene._releaseRasterCanvas(q.spare);}
 function underlay(scene,c,b,w,h){
  let q=states.get(scene);
  if(!is44(b)){release(scene,q);states.delete(scene);return [];}
  const l=b.honroLandmarks?.find(v=>v.id==='a5-near'&&v.asset?.id==='act5:near:44'&&v.x===0&&v.y===0&&v.rotation===0&&v.scale===SCALE);
  const a=l?.asset?.rootWestDepthR9;
  if(!a||a.id!==O||a.collision?.length!==0||!a.bounds||a.anchor?.x!==0||a.anchor?.y!==0){release(scene,q);states.delete(scene);return [];}
  const bds=a.bounds;
  const signed={left:bds.x*SCALE,top:bds.y*SCALE,right:(bds.x+bds.w)*SCALE,bottom:(bds.y+bds.h)*SCALE};
  if(!allowed(signed))return [];
  const v=G.HonroBounds.viewport(scene,w,h),rs=scene._worldRasterScale(b,w),s=TILE/rs;
  const m=c.getTransform();if(m.b!==0||m.c!==0||m.a<=0||m.d<=0)return [];
  const key=scene._worldCacheKey(b,w);
  if(q?.key!==key||q?.b!==b||q?.a!==a){
   release(scene,q);q={b,a,key,tiles:new Map(),spare:null};states.set(scene,q);
  }
  const minX=Math.max(v.left,signed.left), minY=Math.max(v.top,signed.top),maxX=Math.min(v.right,signed.right),maxY=Math.min(v.bottom,signed.bottom);
  if(minX>=maxX||minY>=maxY)return [];
  const view=[];
  for(let j=Math.floor(minY/s);j<=Math.ceil(maxY/s)-1;j++)
   for(let i=Math.floor(minX/s);i<=Math.ceil(maxX/s)-1;i++)view.push([i,j,i+':'+j]);
  const need=new Set(view.slice(0,PERSIST).map(k=>k[2]));
  for(const [id,cv] of q.tiles)if(!need.has(id)){q.tiles.delete(id);scene._releaseRasterCanvas(cv);}
  function raster(cv,i,j){
   const ctx=cv.getContext('2d',{alpha:true});
   ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,DIM,DIM);
   ctx.setTransform(rs,0,0,rs,GUTTER-i*TILE,GUTTER-j*TILE);
   ctx.save();
   try{
    ctx.scale(SCALE,SCALE);
    const V=G.HonroVisualStyle,C=V?V.context(ctx,V.depth(l,l.asset)):ctx;
    G.HonroVectorArt.draw(C,a,{x:0,y:0,scale:1});
   }finally{ctx.restore();}
  }
  for(let k=0;k<view.length;k++){
   const [i,j,id]=view[k];let cv=q.tiles.get(id);
   if(!cv){
    if(k<PERSIST){cv=scene._makeLayerCanvas(DIM,DIM);q.tiles.set(id,cv);}
    else {q.spare??=scene._makeLayerCanvas(DIM,DIM);cv=q.spare;}
    raster(cv,i,j);
   }
   const left=i*s,top=j*s;
   const a0=Math.round(left*m.a+m.e),a1=Math.round((left+s)*m.a+m.e);
   const b0=Math.round(top*m.d+m.f),b1=Math.round((top+s)*m.d+m.f);
   c.save();try{
    c.beginPath();c.rect((a0-m.e)/m.a,(b0-m.f)/m.d,(a1-a0)/m.a,(b1-b0)/m.d);c.clip();
    c.drawImage(cv,0,0,DIM,DIM,left-GUTTER/rs,top-GUTTER/rs,DIM/rs,DIM/rs);
   }finally{c.restore();}
  }
  return view.map(r=>r[2]);
 }
 function wrap(stock){return function(c,b,w,h){underlay(this,c,b,w,h);return stock.call(this,c,b,w,h);};}
 return {underlay,wrap};
}
// hard caps verified in separate observer.
