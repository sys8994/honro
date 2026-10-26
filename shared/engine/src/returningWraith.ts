import {flightRangeSpent} from './playerRange';
import type {Engine} from './engine';
import type {Battle,Projectile,Vec} from './types';
import {segRect} from './math';
export function initializeReturningWraith(p:Projectile){
 p.wraithVersion=1;p.wraithState='outbound';p.wraithPath=[{x:p.x,y:p.y}];p.wraithMarked=[];p.wraithCursor=0;p.wraithPause=0;p.fuseAt=undefined;
}
/** O05 alone may spend a long time falling from a high platform. Bounds are
 * world bounds, never camera/upper-sky bounds; malformed/zero-gravity shots
 * still have a finite observation budget. Shared with outbound prediction. */
export const WRAITH_OUTBOUND_SECONDS=60;
export function returningWraithOutboundEnded(b:Pick<Battle,'width'|'height'>,p:Pick<Projectile,'x'|'y'|'age'>){
 return ![p.x,p.y,p.age].every(Number.isFinite)||p.age>=WRAITH_OUTBOUND_SECONDS||p.x< -170||p.x>b.width+170||p.y>b.height+110;
}
function append(p:Projectile,point:Vec,force=false){const path=p.wraithPath!,last=path[path.length-1];if(!force&&Math.hypot(point.x-last.x,point.y-last.y)<20)return;
 // Keep launch/contact endpoints and a bounded, progressively coarser sample
 // of the same traversed curve. A full history buffer never deletes a shot.
 if(path.length>=255){const compact=path.filter((_,i)=>i===0||i===path.length-1||i%2===0);path.splice(0,path.length,...compact);}
 path.push({x:point.x,y:point.y});
}
function returnDeadline(p:Projectile){const path=p.wraithPath!;let distance=0;for(let i=1;i<path.length;i++)distance+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);return p.age+.32+distance/1100+1;}

function trail(p:Projectile){p.trail.push({x:p.x,y:p.y});if(p.trail.length>32)p.trail.shift();}
/** A versioned, per-shot bounded path. Old in-flight saves retain their old motion. */
export function stepReturningWraith(e:Engine,p:Projectile,dt:number){
 if(p.wraithVersion!==1)return false;
 const path=p.wraithPath!,owner=e.unit(p.owner);
 if(!owner||![p.x,p.y,p.vx,p.vy,p.age].every(Number.isFinite)||p.age>120||(p.wraithState!=='outbound'&&p.maxAge!==undefined&&p.age>p.maxAge)){e.remove(p);return true;}
 if(p.wraithState==='manifest'){
  p.wraithPause=(p.wraithPause||0)+dt;if(p.wraithPause>=.32){p.wraithState='return';p.wraithCursor=path.length-2;p.hit=[];p.autonomous=true;}return true;
 }
 if(p.wraithState==='outbound'){
  const a={x:p.x,y:p.y},motion=e.advanceProjectile(p,dt),hit=e.projectileCollision(a,motion,p.radius,p.owner,[],false),end=hit||motion;
  for(const u of e.b.units){if(!e.guidanceTarget(owner,u)||p.hit.includes(u.id))continue;const h=segRect(a,end,u.x-u.r,u.y-u.h,u.r*2,u.h,p.radius+2);if(!h)continue;
   const at={x:a.x+(end.x-a.x)*h.t,y:a.y+(end.y-a.y)*h.t};e.hurt(u,p.damage*.28,p.owner,true,{...p,autonomous:true},at);p.hit.push(u.id);p.wraithMarked!.push(u.id);e.fx('rune',at.x,at.y,p.color,20);
  }
  Object.assign(p,{x:end.x,y:end.y,vx:motion.vx,vy:motion.vy});append(p,end);trail(p);
  if(hit||flightRangeSpent(p)){
   if(!hit&&!p.wraithAirBurst){p.wraithAirBurst=true;e.blast(p.x,p.y,p.blast,p.damage*.38,p.owner,false,{...p,wraithBurst:true,autonomous:true});}
   if(hit){p.x+=hit.n.x*(p.radius+2);p.y+=hit.n.y*(p.radius+2);}
   append(p,p,true);p.wraithState='manifest';p.wraithPause=0;p.vx=p.vy=0;e.fx('rune',p.x,p.y,p.color,58);e.emit('sound',{name:'spiritSummon'});p.maxAge=returnDeadline(p);}
  else if(returningWraithOutboundEnded(e.b,p))e.remove(p);
  return true;
 }
 let remaining=1100*dt;
 while(remaining>0&&p.wraithCursor!>=0){
  const a={x:p.x,y:p.y},to=path[p.wraithCursor!],distance=Math.hypot(to.x-a.x,to.y-a.y),ratio=distance>0?Math.min(1,remaining/distance):1,end={x:a.x+(to.x-a.x)*ratio,y:a.y+(to.y-a.y)*ratio};
  const first=e.b.units.filter(u=>e.guidanceTarget(owner,u)).map(u=>({u,h:segRect(a,end,u.x-u.r,u.y-u.h,u.r*2,u.h,p.radius+2)})).filter(v=>v.h).sort((a,b)=>a.h!.t-b.h!.t)[0];
  if(first){p.x=a.x+(end.x-a.x)*first.h!.t;p.y=a.y+(end.y-a.y)*first.h!.t;p.wraithBurst=true;p.directId=first.u.id;e.blast(p.x,p.y,p.blast,p.damage*(p.wraithAirBurst?.57:.95),p.owner,false,p);e.remove(p);return true;}
  p.vx=distance?(to.x-a.x)/distance*1100:0;p.vy=distance?(to.y-a.y)/distance*1100:0;p.x=end.x;p.y=end.y;remaining-=distance*ratio;if(ratio>=1)p.wraithCursor!--;else break;
 }
 trail(p);if(p.wraithCursor!<0)e.remove(p);return true;
}
