import type {Vec} from './types';
/** Authored SP contract. Extra SP7 value comes from ordinary damage/mana growth. */
const PLANS:readonly (readonly number[])[]=[[1],[2],[2,1],[2,2],[2,2,1],[2,2,2],[2,2,2],[2,2,3]];
export const WAVE_REFLECTION_DECAY=.82;
export function waveReflectionPlan(rank:number):readonly number[]{return PLANS[Math.max(0,Math.min(7,Math.floor(rank||1)-1))];}
/** Symmetric around specular reflection; narrow at grazing angles so no child
 * points back into the same face and consumes generations without travelling. */
export function waveReflectionVelocities(p:{vx:number;vy:number},n:Vec,count:number){
 const dot=p.vx*n.x+p.vy*n.y,vx=(p.vx-2*dot*n.x)*.84,vy=(p.vy-2*dot*n.y)*.84;
 const speed=Math.hypot(vx,vy),angle=Math.atan2(vy,vx),out=Math.max(0,(vx*n.x+vy*n.y)/(speed||1));
 const delta=Math.min(Math.PI/20,Math.asin(Math.min(1,out))*.7);
 return (count===3?[-delta,0,delta]:count===2?[-delta,delta]:[0]).map(d=>({vx:Math.cos(angle+d)*speed,vy:Math.sin(angle+d)*speed}));
}
