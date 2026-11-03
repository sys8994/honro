import type {Vec} from './types';
/** Exact sector contacts against the same cached core polygons used by projectiles.
 * No locomotion dimensions, expanded legacy hurtbox, or runtime-engine dependency. */
export function monsterSectorContains(polygons:Vec[][],origin:Vec,range:number,angle:number,span:number,clear:(p:Vec)=>boolean){
 const accepts=(p:Vec)=>{const dx=p.x-origin.x,dy=p.y-origin.y,d=Math.hypot(dx,dy),delta=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle)));return d<=range+1e-6&&(d<1e-6||delta<=span/2+1e-6)&&clear(p);};
 for(const ps of polygons){
  let inside=false;
  for(let i=0,j=ps.length-1;i<ps.length;j=i++){
   const a=ps[j],b=ps[i],dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy;
   if((a.y>origin.y)!==(b.y>origin.y)&&origin.x<(b.x-a.x)*(origin.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
   if(accepts(a))return true;
   const k=Math.max(0,Math.min(1,((origin.x-a.x)*dx+(origin.y-a.y)*dy)/(n||1)));
   if(accepts({x:a.x+dx*k,y:a.y+dy*k}))return true;
   const ox=a.x-origin.x,oy=a.y-origin.y,B=2*(ox*dx+oy*dy),D=B*B-4*n*(ox*ox+oy*oy-range*range);
   if(n&&D>=0)for(const t of [(-B-Math.sqrt(D))/(2*n),(-B+Math.sqrt(D))/(2*n)])if(t>=0&&t<=1&&accepts({x:a.x+dx*t,y:a.y+dy*t}))return true;
   for(const theta of [angle-span/2,angle,angle+span/2]){
    const rx=Math.cos(theta)*range,ry=Math.sin(theta)*range,den=rx*dy-ry*dx;
    if(Math.abs(den)<1e-9)continue;
    const t=(ox*dy-oy*dx)/den,s=(ox*ry-oy*rx)/den;
    if(t>=0&&t<=1&&s>=0&&s<=1&&accepts({x:origin.x+rx*t,y:origin.y+ry*t}))return true;
   }
  }
  if(inside&&clear(origin))return true;
 }
 return false;
}
