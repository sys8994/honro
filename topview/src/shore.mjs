// The visual shore and the solid bank are compiled from one Tiled curve.
// Bridge deck polygons are cut out of the solid bank before it reaches here.
import {direction,sweepDisc} from './space.mjs';

function bounds(points){
  return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),
    top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
}
function overlaps(b,l,t,r,z){return b.left<=r&&b.right>=l&&b.top<=z&&b.bottom>=t;}
function inRing(p,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
function sweepSegment(a,z,s,r){
  const dx=z.x-a.x,dy=z.y-a.y,velocity=dx*s.nx+dy*s.ny;
  let first=sweepDisc(a,z,s.a,r),cap=sweepDisc(a,z,s.b,r);
  if(cap&&(!first||cap.t<first.t))first=cap;
  if(Math.abs(velocity)>1e-8){
    const sign=velocity<0?1:-1,dist=(a.x-s.a.x)*s.nx+(a.y-s.a.y)*s.ny;
    if(dist*sign>=-.00001){
      const time=Math.max(0,(sign*r-dist)/velocity);
      if(time<=1&&(!first||time<first.t)){
        const x=a.x+time*dx,y=a.y+time*dy,along=(x-s.a.x)*s.ux+(y-s.a.y)*s.uy;
        if(along>=0&&along<=s.length)first={x,y,t:time,n:{x:sign*s.nx,y:sign*s.ny}};
      }
    }
  }
  return first;
}
export function makeShore(polygons,map){
  const convert=([x,y])=>({x:x*map.cell/map.tileWidth,y:y*map.cell/map.tileHeight});
  const shapes=polygons.map(r=>{const rings=r.map(row=>row.map(convert));return {rings,...bounds(rings[0])};});
  const extent=bounds(shapes.flatMap(s=>s.rings[0])),buckets=new Map(),step=map.cell;
  const key=(x,y)=>x+','+y;
  for(const shape of shapes)for(const ring of shape.rings)for(let i=0;i<ring.length;i++){
    const a=ring[i],b=ring[(i+1)%ring.length],length=Math.hypot(b.x-a.x,b.y-a.y);if(length<1e-6)continue;
    const u=direction(b.x-a.x,b.y-a.y),seg={a,b,length,ux:u.x,uy:u.y,nx:-u.y,ny:u.x,...bounds([a,b])};
    for(let y=Math.floor(seg.top/step);y<=Math.floor(seg.bottom/step);y++)for(let x=Math.floor(seg.left/step);x<=Math.floor(seg.right/step);x++){
      const id=key(x,y);if(!buckets.has(id))buckets.set(id,[]);buckets.get(id).push(seg);
    }
  }
  function nearby(a,z,r){
    const l=Math.min(a.x,z.x)-r,t=Math.min(a.y,z.y)-r,right=Math.max(a.x,z.x)+r,b=Math.max(a.y,z.y)+r,res=new Set();
    for(let y=Math.floor(t/step);y<=Math.floor(b/step);y++)for(let x=Math.floor(l/step);x<=Math.floor(right/step);x++)
      for(const s of buckets.get(key(x,y))||[])if(overlaps(s,l,t,right,b))res.add(s);
    return res;
  }
  return {
    contains(p,r){
      if(!overlaps(extent,p.x-r,p.y-r,p.x+r,p.y+r))return false;
      if(shapes.some(s=>overlaps(s,p.x,p.y,p.x,p.y)&&inRing(p,s.rings[0])&&!s.rings.slice(1).some(h=>inRing(p,h))))return true;
      for(const s of nearby(p,p,r)){
        const t=Math.max(0,Math.min(s.length,(p.x-s.a.x)*s.ux+(p.y-s.a.y)*s.uy));
        if(Math.hypot(p.x-s.a.x-s.ux*t,p.y-s.a.y-s.uy*t)<r-.0001)return true;
      }
      return false;
    },
    first(a,z,r){
      if(!overlaps(extent,Math.min(a.x,z.x)-r,Math.min(a.y,z.y)-r,Math.max(a.x,z.x)+r,Math.max(a.y,z.y)+r))return null;
      let best=null;for(const s of nearby(a,z,r)){const h=sweepSegment(a,z,s,r);if(h&&(!best||h.t<best.t))best=h;}return best;}
  };
}
