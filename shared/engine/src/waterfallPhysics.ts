import type {Battle,Terrain} from './types';
import {poly,segmentTerrain} from './math';
import {advanceLinear} from './physics';
export type Flight={x:number;y:number;vx:number;vy:number};
/** Only the authored new campaign encounter opts in. Its current polygon is also the art source. */
export function waterfallSheet(b:Battle):Terrain|undefined{
 const q=b as any;
 if(q.honroStage!==5||q.honroStage5WaterfallRevision!==1||q.honroCustom)return;
 return b.terrain.find(t=>t.id==='waterfall-veil'&&!t.broken);
}
export function insideWater(t:Terrain|undefined,p:{x:number;y:number}){
 if(!t||p.x<t.x||p.x>t.x+t.w||p.y<t.y||p.y>t.y+t.h)return false;
 // A fluid needs parity only, not the generic body's per-edge closest-distance calculation.
 const v=t.vertices||poly(t);let inside=false;
 for(let i=0,j=v.length-1;i<v.length;j=i++){
  const a=v[j],b=v[i];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
/** Exact dvx/dt = -32 vx - .05 |vx| vx. Quadratic drag bounds even extreme entry speeds.
 * Vertical entrainment accelerates toward downward flow, with ordinary gravity retained.
 * No collision, reflection, damage, fuse, phase or lifetime policy lives here. */
function wet(p:Flight,dt:number){
 const k=32,c=.05,dec=Math.exp(-k*dt),den=1+c*Math.abs(p.vx)/k*(-Math.expm1(-k*dt));
 const y=advanceLinear(0,p.y,0,p.vy,0,320+3*300,3,dt);
 return{x:p.x+Math.sign(p.vx)*Math.log(den)/c,y:y.y,vx:p.vx*dec/den,vy:y.vy};
}
export function advanceWaterfall(p:Flight,dt:number,t:Terrain,air:(p:Flight,dt:number)=>Flight){
 const dry=air(p,dt);
 if(!insideWater(t,p)&&!segmentTerrain(p,dry,t,0))return {...dry,waterEntered:false,waterEntryPoint:undefined as {x:number;y:number}|undefined};
 let q={...p},left=dt,waterEntered=false,waterEntryPoint:{x:number;y:number}|undefined;
 // Geometry crossings use short swept segments; homogeneous wet motion is analytical.
 // Cost is bounded by elapsed simulation time, never by projectile speed.
 while(left>1e-9){
  const h=Math.min(left,1/240);left-=h;
  if(insideWater(t,q)){
   waterEntered=true;waterEntryPoint??={x:q.x,y:q.y};const z=wet(q,h);
   if(insideWater(t,z)){q=z;continue;}
   const exit=segmentTerrain(z,q,t,0),part=exit?Math.max(0,Math.min(1,1-exit.t)):1;
   const at=wet(q,h*part);q=air(at,h*(1-part));
  }else{
   const z=air(q,h),entry=segmentTerrain(q,z,t,0);
   if(!entry){q=z;continue;}
   const part=Math.max(0,Math.min(1,entry.t)),at=air(q,h*part);
   waterEntered=true;waterEntryPoint??={x:at.x,y:at.y};q=wet(at,h*(1-part));
  }
 }
 return {...q,waterEntered,waterEntryPoint};
}
