(function(G){'use strict';
const C=G.HONRO_CORE,clamp=C.clamp;
function intersects(b,u,x=u.x,y=u.y,{padding=6,support=null}={}){
  const left=x-u.r-padding,right=x+u.r+padding,head=y-u.h-padding,feet=y+padding;
  if(left<0||right>b.width||head<12||feet>b.height)return true;
  // Do not classify mere foot contact with the support as penetration.
  return b.terrain.some(t=>!t.broken&&t!==support&&!t.oneWay&&C.terrainRectIntersects(t,left,head,right-left,Math.max(1,feet-head-padding-1),.12));
}
function separated(b,u,x,y,padding=18){return b.units.every(v=>v===u||v.dead||v.hp<=0||Math.abs(v.x-x)>=v.r+u.r+padding||y<=v.y-v.h-padding||y-u.h>=v.y+padding);}
function place(b,u,{x=u.x,y=u.y,flying=!!u.fixed,maxDistance=1600,clearance=18,accept=null}={}){
  const valid=(px,py,support=null)=>!intersects(b,u,px,py,{support,padding:flying?10:2})&&separated(b,u,px,py,clearance)&&(!accept||accept(px,py));
  if(flying){if(valid(x,y))return{x,y};for(let radius=64;radius<=maxDistance;radius+=64){const steps=Math.max(12,Math.ceil(2*Math.PI*radius/72));for(let i=0;i<steps;i++){const a=-Math.PI/2+i*2*Math.PI/steps,px=x+Math.cos(a)*radius,py=y+Math.sin(a)*radius;if(valid(px,py))return{x:px,y:py};}}}
  else{
    const candidates=[];
    for(let dx=0;dx<=maxDistance;dx+=32)for(const side of dx?[1,-1]:[1]){const px=x+dx*side;
      for(const t of b.terrain){if(t.broken||t.honroSeal||t.honroBlocker||px<t.x+u.r*.25||px>t.x+t.w-u.r*.25)continue;
        for(const face of C.terrainSurfaces(t,px)){if(Math.abs(face.slope)>1.35)continue;const py=face.y;if(Math.hypot(px-x,(py-y)*.75)>maxDistance||!valid(px,py,t))continue;candidates.push({x:px,y:py,score:Math.hypot(px-x,(py-y)*.75)});}
      }
    }
    candidates.sort((a,b)=>a.score-b.score);if(candidates.length)return{x:candidates[0].x,y:candidates[0].y};
  }
  return null;
}
G.HonroTerrain={topAt:C.topAt,intersects,place};
})(globalThis);
