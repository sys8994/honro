/** Read-only proposal on the existing navigator graph. Safe means supported,
 * body-clear and actor-separated, not guaranteed immunity from enemy fire. */
export function stage17ProgressPoint(g,b,e,nav,u,point,enemy,goal){
 if(!point||u.moveLeft<160||u.hp<u.maxHp*.35)return null;
 const distance=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y);
 if(goal?.kind==='hold'&&distance(u,point)<goal.radius)return null;
 const route=nav.inspectRoute(u,point,enemy);if(!route)return null;
 const originalDistance=distance(u,point),limit=Math.min(u.moveLeft-e.jumpCost(u),u.maxMove*.75);let length=0;const choices=[];
 for(const link of route.links){length+=distance(link.from,link.point)+(link.mode?.kind==='jump'?e.jumpCost(u):0);if(length>limit)break;
  const p=link.point;if(distance(u,p)<80||originalDistance-distance(p,point)<80||!g.HONRO_CORE.validTerrainContactPose(b.terrain,{...u,x:p.x,y:p.y}))continue;
  const separate=b.units.every(v=>v===u||v.dead||v.hp<=0||v.honroObjectiveTarget||Math.abs(v.x-p.x)>=v.r+u.r+18||p.y<=v.y-v.h-18||p.y-u.h>=v.y+18);
  if(separate)choices.push({...p,id:'forward-'+point.id,progress:originalDistance-distance(p,point),pathLength:length});
 }
 choices.sort((a,z)=>z.progress-a.progress||a.pathLength-z.pathLength);return choices[0]||null;
}
