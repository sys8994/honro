/** Stage23-only test helper. Never changes the live battle or shared Stage17 helper. */
import assert from 'node:assert/strict';
// Predeclared before outcome testing, not selected for a favorable result.
// These are independent estimation streams, NOT mean damage or live future rolls.
export const ESTIMATE_RANDOM=Object.freeze({rng:0x13579bdf,damageSeed:0x2468ace0,damageIndex:0});
export function estimateSnapshot(b){
 const copy=JSON.parse(JSON.stringify(b));
 copy.rng=ESTIMATE_RANDOM.rng;
 copy.damageSequence={version:1,seed:ESTIMATE_RANDOM.damageSeed,index:ESTIMATE_RANDOM.damageIndex};
 return copy;
}
export function detachedIndependentPlanner(C,b){
 const before=JSON.stringify(b),copy=estimateSnapshot(b);
 // Normalize BEFORE construction: Engine initializes/caches damage sequences.
 const engine=new C.Engine(copy,()=>{},true);
 const check=()=>assert.equal(JSON.stringify(b),before,'Independent planning mutated its input battle');check();
 return {engine,unit:id=>engine.unit(id),check,estimateRandom:ESTIMATE_RANDOM};
}
function segmentBox(a,z,r){
 let lo=0,hi=1;
 for(const axis of ['x','y']){
  const d=z[axis]-a[axis],min=axis==='x'?r.left:r.top,max=axis==='x'?r.right:r.bottom;
  if(Math.abs(d)<1e-9){if(a[axis]<min||a[axis]>max)return false;continue;}
  let x=(min-a[axis])/d,y=(max-a[axis])/d;if(x>y)[x,y]=[y,x];lo=Math.max(lo,x);hi=Math.min(hi,y);if(lo>hi)return false;
 }
 return hi>=0&&lo<=1;
}
export function friendlyMuzzleObstruction(C,e,u,target){
 if(!u||!target||u.cls==='knight'||target.dead||target.hp<=0||u.moveLeft<20||!e.grounded(u))return null;
 const dx=target.x-u.x,dy=target.y-u.y;
 // Limit this extra action to the already-selected, nearby road threat.
 if(!dx||Math.abs(dx)>190||Math.abs(dy)>=220)return null;
 const end={x:target.x,y:target.y-target.h*.5};
 const angle=Math.atan2(u.y-u.h*.63-end.y,dx)*180/Math.PI;
 const skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s&&s.damage>0&&!s.passive&&!s.martial&&e.skillAllowed(s,u)&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus);
 for(const skill of skills){
  const origin=e.projectileOrigin(u,skill,angle),radius=u.cls==='archer'?3:6;
  for(const ally of e.b.units){
   if(ally.id===u.id||ally.dead||ally.hp<=0||ally.eaterCapturedBy||ally.side===1)continue;
   const box={left:ally.x-ally.r-radius,right:ally.x+ally.r+radius,top:ally.y-ally.h-radius,bottom:ally.y+radius};
   const inside=origin.x>=box.left&&origin.x<=box.right&&origin.y>=box.top&&origin.y<=box.bottom;
   if(!inside&&!segmentBox(origin,end,box))continue;
   return {kind:inside?'muzzle-overlap':'straight-friendly-obstruction',ally:ally.id,skill:skill.id,target:target.id,direction:Math.sign(dx),distance:20,angle,origin,end,box,
    scope:'Trigger only. A straight-line obstruction is not a proof that every curved shot is blocked. Re-plan after ordinary movement.'};
  }
 }
 return null;
}
