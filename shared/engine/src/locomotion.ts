import type {Terrain,Unit} from './types';
import {clamp,topAt,terrainSurfaces,terrainSlopeAt,terrainRectIntersects,AIM_MIN,AIM_MAX} from './math';

/** Only sub-pixel/editor seams may be bridged. This never bridges real ledges. */
export const SEAM_GAP=2.5;
export function terrainSurface(terrain:Terrain[],x:number,min:number,max:number):{t:Terrain;y:number}|null{
  let best:{t:Terrain;y:number}|null=null;
  for(const t of terrain){
    if(t.broken||x<t.x-1e-7||x>t.x+t.w+1e-7)continue;
    for(const h of terrainSurfaces(t,clamp(x,t.x,t.x+t.w))){
      if(Math.abs(h.slope)>1.35)continue;
      const y=h.y;
      if(y<min||y>max)continue;
      // A surface buried inside another solid is not a floor. A roof with empty air below remains valid.
      if(terrain.some(o=>o!==t&&!o.broken&&!o.oneWay&&terrainRectIntersects(o,x-.2,y+.25,.4,3,.01)))continue;
      if(y>=min&&y<=max){
        const local=max-min<=420,ref=(min+max)*.5,score=local?Math.abs(y-ref):y,bestScore=best?(local?Math.abs(best.y-ref):best.y):Infinity;
        if(!best||score<bestScore-1e-7||Math.abs(score-bestScore)<1e-7&&y<best.y)best={t,y};
      }
    }
  }
  if(best)return best;
  const left=terrain.filter(t=>!t.broken&&t.x+t.w<x&&x-(t.x+t.w)<=SEAM_GAP),right=terrain.filter(t=>!t.broken&&t.x>x&&t.x-x<=SEAM_GAP);
  for(const a of left)for(const b of right){
    const start=a.x+a.w,gap=b.x-start,ay=topAt(a,start),by=topAt(b,b.x);
    if(gap>SEAM_GAP||Math.abs(by-ay)>3||Math.abs(terrainSlopeAt(a,start,ay))>1.35||Math.abs(terrainSlopeAt(b,b.x,by))>1.35)continue;
    const y=ay+(by-ay)*(x-start)/gap;if(y<min||y>max||best&&best.y<=y)continue;
    const t={...a,vertices:undefined,id:`seam:${a.id}:${b.id}`,x:start,y:ay,w:gap,slope:by-ay,h:Math.max(a.y+a.h,b.y+b.h)-ay};best={t,y};
  }
  return best;
}

/** Stable foot contact, bounded substeps, exact-x support, and body wall tests. */
export function walkTerrain(e:any,u:Unit,direction:number,dt:number,requireSupport=false):boolean{
  if(u.dead||!direction||dt<=0)return false;
  const facing=Math.sign(direction);let changed=false;
  if(facing!==u.facing){u.angle=clamp(180-u.angle,AIM_MIN,AIM_MAX);u.facing=facing;changed=true;}
  if(u.moveLeft<=0||u.airborne)return changed;
  let remaining=Math.min(u.walkSpeed*dt*clamp(Math.abs(direction),0,1),u.moveLeft/(u.bound>0?1.6:1));
  // Do not choose a surface from behind/ahead of nx: on a steep slope that y
  // differs enough for the next physics step to consider the feet unsupported.
  while(remaining>1e-5){
    const current=e.surface(u.x,u.y-4,u.y+5),grounded=!!current&&!u.jumping&&Math.abs(u.vy)<3;
    const slope=grounded?Math.abs(terrainSlopeAt(current.t,u.x,current.y)):0;
    const dx=Math.min(4,remaining)/Math.hypot(1,slope<=1.35?slope:0)*facing;
    const nx=clamp(u.x+dx,25,e.b.width-25);if(Math.abs(nx-u.x)<1e-6)break;
    let support=grounded?e.surface(nx,u.y-28,u.y+28):null;
    if(support&&Math.abs(terrainSlopeAt(support.t,nx,support.y))>1.35)support=null;
    if(requireSupport&&!support)break;
    const ny=support?support.y:u.y;
    // At an embedded rock seam the old support can end just below the adjacent
    // solid. Head/torso probes miss this foot-only entry; stop for a jump instead.
    if(!support&&e.b.terrain.some((t:Terrain)=>!t.broken&&!t.oneWay&&terrainRectIntersects(t,nx-.1,ny-.1,.2,.08,.001)))break;
    // A steep face rejected as a walkable slope is still solid. Previously
    // null support meant horizontal movement INTO that face, then falling inside.
    const skip=e.b.terrain.filter((t:Terrain)=>t.oneWay||t===current?.t||t===support?.t).map((t:Terrain)=>t.id);
    let blocked=false;
    for(const offset of [u.h*.5,u.h-7,5]){
      const h=e.collision({x:u.x,y:u.y-offset},{x:nx,y:ny-offset},offset===5?2:Math.min(6,Math.max(2,u.r-2)),u.id,[],false,skip);
      if(h?.terrain&&Math.abs(h.n.x)>.65&&h.n.y>-.35){blocked=true;break;}
    }
    if(blocked)break;
    const travel=Math.hypot(nx-u.x,ny-u.y),cost=travel*(u.bound>0?1.6:1);
    if(cost>u.moveLeft+1e-5)break;
    u.x=nx;u.y=ny;u.moveLeft=Math.max(0,u.moveLeft-cost);u.moving=.12;u.walkPhase=(u.walkPhase||0)+travel*.038;
    remaining-=travel;changed=true;
  }
  return changed;
}
