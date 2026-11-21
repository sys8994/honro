(function(G){'use strict';
// Readability belongs to the collision silhouette, not the decoration's art.
// Build exposed paths once per sceneVersion and rasterize them with world tiles.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap();
const STYLE=G.HonroVisualStyle?.STYLE.terrain||Object.freeze({edgeInk:'#101d23d9',topLight:'#c7d0bd',woodLight:'#c8b994',edgePixels:1.5,topInkPixels:2.6,topLightPixels:1.2});
const cross=(ax,ay,bx,by)=>ax*by-ay*bx;
function inside(x,y,ps){let yes=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],z=ps[j];if((a.y>y)!==(z.y>y)&&x<(z.x-a.x)*(y-a.y)/(z.y-a.y)+a.x)yes=!yes;}return yes;}
function cutAt(a,z,p,q,cuts){const dx=z.x-a.x,dy=z.y-a.y,ex=q.x-p.x,ey=q.y-p.y,den=cross(dx,dy,ex,ey),len2=dx*dx+dy*dy;
 if(Math.abs(den)>1e-8){const t=cross(p.x-a.x,p.y-a.y,ex,ey)/den,u=cross(p.x-a.x,p.y-a.y,dx,dy)/den;if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);}
 else if(Math.abs(cross(p.x-a.x,p.y-a.y,dx,dy))<1e-6)for(const v of [p,q]){const t=((v.x-a.x)*dx+(v.y-a.y)*dy)/len2;if(t>0&&t<1)cuts.push(t);}
}
function prepare(b){const ts=G.HonroTerrainDomain?.render(b)||b.terrain||[],prior=cache.get(b);if(prior?.source===ts&&prior.version===b.sceneVersion)return prior;
 // The waterfall is rendered by its flowing sheet, not a rock-edge outline.
 const omittedClosures=b.honroStage===3?new Set((b.honroLandmarks||[]).flatMap(l=>l.asset?.params?.omitTerrainClosureIds||[])):null;
 const solids=ts.filter(t=>!t.broken&&!(G.HonroStage5Waterfall?.active(b)&&t.id==='waterfall-veil')).map(t=>({t,ps:C.poly(t)})),groups=[];
 for(const {t,ps}of solids){
  // Some legacy sprite hitboxes deliberately enclose empty air. Outlining
  // those would create a floating wireframe, so retain their authored rim.
  // New roofs explicitly promise a single sampled art/collision silhouette.
  if(t.honroElementCollision){const asset=b.honroLandmarks?.find(l=>l.id===t.honroElementId)?.asset;if(asset?.params?.rearOnly||asset?.params?.collisionSource!=='sampled-drawn-roof')continue;}
  const edge=new Path2D(),top=new Path2D(),segments=[];let area=0;for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];area+=cross(a.x,a.y,z.x,z.y);}const sign=area>=0?1:-1;
  for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length],dx=z.x-a.x,dy=z.y-a.y,len=Math.hypot(dx,dy);if(len<.01)continue;
   const nx=sign*dy/len,ny=-sign*dx/len,walkable=ny<0&&Math.abs(dy)<=Math.abs(dx)*1.35;if(t.oneWay&&!walkable)continue;if(!walkable&&omittedClosures?.has(t.id))continue;
   // Stage 7's authored path and collateral side edges remain; do not ink the artificial far-down polygon closure.
   if(!walkable&&ny>0&&b.honroStage===7&&b.honroCanonical===true&&b.honroCustom===false&&
      b.honroMapOrigin==='campaign'&&b.honroAuthoredId==='stage-7'&&
      t.id==='root-floor'&&t.honroAct1SitePainted===true&&t.route===true&&
      a.y===5069.18&&z.y===5069.18&&Math.min(a.x,z.x)===-1200&&Math.max(a.x,z.x)===5732.24)continue;
   const left=Math.min(a.x,z.x),right=Math.max(a.x,z.x),low=Math.min(a.y,z.y),high=Math.max(a.y,z.y),peers=solids.filter(o=>o.t!==t&&!o.t.oneWay&&o.t.x<=right+1&&o.t.x+o.t.w>=left-1&&o.t.y<=high+1&&o.t.y+o.t.h>=low-1),cuts=[0,1];
   for(const o of peers)for(let j=0;j<o.ps.length;j++)cutAt(a,z,o.ps[j],o.ps[(j+1)%o.ps.length],cuts);cuts.sort((a,z)=>a-z);
   for(let k=1;k<cuts.length;k++){const start=cuts[k-1],end=cuts[k];if((end-start)*len<.05)continue;const mid=(start+end)/2;if(peers.some(o=>inside(a.x+dx*mid+nx*.6,a.y+dy*mid+ny*.6,o.ps)))continue;
    const p={x:a.x+dx*start,y:a.y+dy*start},q={x:a.x+dx*end,y:a.y+dy*end};edge.moveTo(p.x,p.y);edge.lineTo(q.x,q.y);const walkRim=walkable&&(G.HonroStage11LandscapeArt?.walkRim?.(t,b,p,q)??true);if(walkRim){top.moveTo(p.x,p.y);top.lineTo(q.x,q.y);}segments.push({a:p,z:q,walkable});
   }
  }
  if(segments.length)groups.push({id:t.id,wood:t.mat==='wood',edge,top,segments,bounds:{left:t.x,top:t.y,right:t.x+t.w,bottom:t.y+t.h}});
 }
 const q={source:ts,version:b.sceneVersion,groups,builds:(prior?.builds||0)+1};cache.set(b,q);return q;
}
// Keep the native combined stroke on destination pixels outside the authored
// closure. Segment-list changes otherwise move compound-stroke AA far away.
const edgeScratch=new WeakMap();
function signedEdge(scene,c,stock,patch){
 const m=c.getTransform(),{a,b,cc,d,e,f}= {a:m.a,b:m.b,cc:m.c,d:m.d,e:m.e,f:m.f};
 if(![a,b,cc,d,e,f,c.lineWidth].every(Number.isFinite)||b!==0||cc!==0||a<=0||d!==a||
    c.lineCap!=='butt'||c.globalAlpha!==1||c.globalCompositeOperation!=='source-over'||
    c.shadowBlur!==0||c.shadowOffsetX!==0||c.shadowOffsetY!==0||
    (c.filter&&c.filter!=='none')||c.getLineDash().length)return false;
 const {segment:g,filtered}=patch,base=c.canvas;
 const px=a*g.a.x+e,y0=d*g.a.y+f,y1=d*g.z.y+f,hw=a*c.lineWidth/2;
 // This vertical butt-capped path has stroke coverage only in pixels whose
 // unit cells intersect this exact box. Never extend to the full width of a tile.
 const L=Math.max(0,Math.floor(px-hw)),T=Math.max(0,Math.floor(y0)),
       R=Math.min(base.width,Math.ceil(px+hw)),B=Math.min(base.height,Math.ceil(y1));
 const ww=R-L,hh=B-T;
 if(ww<=0||hh<=0)return false;
 const tile=scene._staticCacheBuild&&base.width===516&&base.height===516;
 if(typeof scene._makeLayerCanvas!=='function')return false;
 if(!tile){
  // Use the scratch solely as a narrow underpaint snapshot, never as a
  // separate raster destination for this compound stroke.
  if(ww>16||hh>4096)return false;
  const sw=16,sh=2**Math.ceil(Math.log2(hh));
  let snapshot=edgeScratch.get(scene);
  if(!snapshot||snapshot.width!==sw||snapshot.height<sh){snapshot=scene._makeLayerCanvas(sw,sh);edgeScratch.set(scene,snapshot);}
  const snap=snapshot.getContext('2d',{alpha:true});if(!snap)return false;
  snap.clearRect(0,0,ww,hh);snap.drawImage(base,L,T,ww,hh,0,0,ww,hh);
  c.stroke(stock);
  const clip=new Path2D();clip.rect(L,T,ww,hh);
  c.save();try{
   c.setTransform(1,0,0,1,0,0);c.clip(clip);
   c.globalCompositeOperation='copy';c.drawImage(snapshot,0,0,ww,hh,L,T,ww,hh);
   c.globalCompositeOperation='source-over';c.setTransform(a,b,cc,d,e,f);
   c.stroke(filtered);
  }finally{c.restore();}
  return true;
 }
 const ox=0,oy=0,sw=516,sh=516;
 let s=edgeScratch.get(scene);if(!s||s.width!==sw||s.height!==sh){s=scene._makeLayerCanvas(sw,sh);edgeScratch.set(scene,s);}
 const sc=s.getContext('2d',{alpha:true});if(!sc)return false;
 // Snapshot the exact pre-edge underpaint in the signed cells. The rest of the
 // scratch need not contain the material: a source-over stroke is pixel-local.
 const lx=L-ox,ly=T-oy;
 sc.save();try{
  sc.setTransform(1,0,0,1,0,0);sc.clearRect(lx,ly,ww,hh);
  sc.drawImage(base,L,T,ww,hh,lx,ly,ww,hh);
  sc.setTransform(a,b,cc,d,e-ox,f-oy);
  sc.lineCap=c.lineCap;sc.lineJoin=c.lineJoin;sc.miterLimit=c.miterLimit;
  sc.lineWidth=c.lineWidth;sc.strokeStyle=c.strokeStyle;
  sc.stroke(filtered);
 }finally{sc.restore();}
 c.stroke(stock);
 // The unchanged stock path ran unclipped. Replace only integer backing cells
 // at 1:1, before either original top stroke. No outside clip, blur or resample.
 c.save();try{
  c.setTransform(1,0,0,1,0,0);c.clearRect(L,T,ww,hh);
  c.drawImage(s,lx,ly,ww,hh,L,T,ww,hh);
 }finally{c.restore();}
 return true;
}
S.terrainReadability=function(c,b,view,localEdges){const q=prepare(b),raster=this._staticCacheBuild?this._worldRasterScale(b,this.canvas.clientWidth):this.scale,unit=1/Math.max(.05,raster);
 c.save();c.lineJoin='round';c.lineCap='butt';for(const group of q.groups){const authoredTerrain=b.terrain?.find(t=>t.id===group.id);if(authoredTerrain&&G.HonroAct4PilotArt?.movingDeckCovered?.(authoredTerrain,b))continue;if(authoredTerrain&&b.honroMap?.nativeArt?.authoredWalkRim===true&&G.HonroAct4PilotArt?.covered(authoredTerrain,b))continue;if(G.HonroStage5PositioningArt?.omitReadability(group,b)||G.HonroStage2LayeredRoadArt?.omitReadability(group,b)||G.HonroStage18BellArt?.omitReadability(group,b)||G.HonroStage30FerryArt?.omitReadability(group,b)||G.HonroStage12QuarryArt?.omitReadability(group,b)||G.HonroStage23EscortArt?.omitReadability(group,b)||G.HonroStage8BierArt?.omitReadability(group,b))continue;const box=group.bounds;if(view&&(box.right<view.left-8*unit||box.left>view.right+8*unit||box.bottom<view.top-8*unit||box.top>view.bottom+8*unit))continue;
  c.strokeStyle=STYLE.edgeInk;c.lineWidth=STYLE.edgePixels*unit;const patch=localEdges?.get(group);if(!patch||!signedEdge(this,c,group.edge,patch))c.stroke(group.edge);
  c.lineWidth=STYLE.topInkPixels*unit;c.stroke(group.top);
  c.strokeStyle=group.wood?STYLE.woodLight:STYLE.topLight;c.lineWidth=STYLE.topLightPixels*unit;c.stroke(group.top);
 }c.restore();this.terrainReadabilityStats={builds:q.builds,groups:q.groups.length};
};
G.HonroTerrainReadability={STYLE,prepare};
})(globalThis);
