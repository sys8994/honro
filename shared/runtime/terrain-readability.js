(function(G){'use strict';
// Readability belongs to the collision silhouette, not the decoration's art.
// Build exposed paths once per sceneVersion and rasterize them with world tiles.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap();
const STYLE=Object.freeze({backgroundDesaturation:.14,edgeInk:'#101d23d9',topLight:'#c7d0bd',woodLight:'#c8b994',edgePixels:1.5,topInkPixels:2.2,topLightPixels:.9});
const cross=(ax,ay,bx,by)=>ax*by-ay*bx;
function inside(x,y,ps){let yes=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],z=ps[j];if((a.y>y)!==(z.y>y)&&x<(z.x-a.x)*(y-a.y)/(z.y-a.y)+a.x)yes=!yes;}return yes;}
function cutAt(a,z,p,q,cuts){const dx=z.x-a.x,dy=z.y-a.y,ex=q.x-p.x,ey=q.y-p.y,den=cross(dx,dy,ex,ey),len2=dx*dx+dy*dy;
 if(Math.abs(den)>1e-8){const t=cross(p.x-a.x,p.y-a.y,ex,ey)/den,u=cross(p.x-a.x,p.y-a.y,dx,dy)/den;if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);}
 else if(Math.abs(cross(p.x-a.x,p.y-a.y,dx,dy))<1e-6)for(const v of [p,q]){const t=((v.x-a.x)*dx+(v.y-a.y)*dy)/len2;if(t>0&&t<1)cuts.push(t);}
}
function prepare(b){const ts=G.HonroTerrainDomain?.render(b)||b.terrain||[],prior=cache.get(b);if(prior?.source===ts&&prior.version===b.sceneVersion)return prior;
 const solids=ts.filter(t=>!t.broken).map(t=>({t,ps:C.poly(t)})),groups=[];
 for(const {t,ps}of solids){
  // Some legacy sprite hitboxes deliberately enclose empty air. Outlining
  // those would create a floating wireframe, so retain their authored rim.
  // New roofs explicitly promise a single sampled art/collision silhouette.
  if(t.honroElementCollision){const asset=b.honroLandmarks?.find(l=>l.id===t.honroElementId)?.asset;if(asset?.params?.rearOnly||asset?.params?.collisionSource!=='sampled-drawn-roof')continue;}
  const edge=new Path2D(),top=new Path2D(),segments=[];let area=0;for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];area+=cross(a.x,a.y,z.x,z.y);}const sign=area>=0?1:-1;
  for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length],dx=z.x-a.x,dy=z.y-a.y,len=Math.hypot(dx,dy);if(len<.01)continue;
   const nx=sign*dy/len,ny=-sign*dx/len,walkable=ny<0&&Math.abs(dy)<Math.abs(dx)*1.36;if(t.oneWay&&!walkable)continue;
   const left=Math.min(a.x,z.x),right=Math.max(a.x,z.x),low=Math.min(a.y,z.y),high=Math.max(a.y,z.y),peers=solids.filter(o=>o.t!==t&&!o.t.oneWay&&o.t.x<=right+1&&o.t.x+o.t.w>=left-1&&o.t.y<=high+1&&o.t.y+o.t.h>=low-1),cuts=[0,1];
   for(const o of peers)for(let j=0;j<o.ps.length;j++)cutAt(a,z,o.ps[j],o.ps[(j+1)%o.ps.length],cuts);cuts.sort((a,z)=>a-z);
   for(let k=1;k<cuts.length;k++){const start=cuts[k-1],end=cuts[k];if((end-start)*len<.05)continue;const mid=(start+end)/2;if(peers.some(o=>inside(a.x+dx*mid+nx*.6,a.y+dy*mid+ny*.6,o.ps)))continue;
    const p={x:a.x+dx*start,y:a.y+dy*start},q={x:a.x+dx*end,y:a.y+dy*end};edge.moveTo(p.x,p.y);edge.lineTo(q.x,q.y);if(walkable){top.moveTo(p.x,p.y);top.lineTo(q.x,q.y);}segments.push({a:p,z:q,walkable});
   }
  }
  if(segments.length)groups.push({id:t.id,wood:t.mat==='wood',edge,top,segments,bounds:{left:t.x,top:t.y,right:t.x+t.w,bottom:t.y+t.h}});
 }
 const q={source:ts,version:b.sceneVersion,groups,builds:(prior?.builds||0)+1};cache.set(b,q);return q;
}
S.backgroundReadability=function(c,w,h){c.save();c.globalCompositeOperation='saturation';c.globalAlpha*=STYLE.backgroundDesaturation;c.fillStyle='#808080';c.fillRect(0,0,w,h);c.restore();};
S.terrainReadability=function(c,b,view){const q=prepare(b),raster=this._staticCacheBuild?this._worldRasterScale(b,this.canvas.clientWidth):this.scale,unit=1/Math.max(.05,raster);
 c.save();c.lineJoin='round';c.lineCap='butt';for(const group of q.groups){const box=group.bounds;if(view&&(box.right<view.left-8*unit||box.left>view.right+8*unit||box.bottom<view.top-8*unit||box.top>view.bottom+8*unit))continue;
  c.strokeStyle=STYLE.edgeInk;c.lineWidth=STYLE.edgePixels*unit;c.stroke(group.edge);
  c.lineWidth=STYLE.topInkPixels*unit;c.stroke(group.top);
  c.strokeStyle=group.wood?STYLE.woodLight:STYLE.topLight;c.lineWidth=STYLE.topLightPixels*unit;c.stroke(group.top);
 }c.restore();this.terrainReadabilityStats={builds:q.builds,groups:q.groups.length};
};
G.HonroTerrainReadability={STYLE,prepare};
})(globalThis);
