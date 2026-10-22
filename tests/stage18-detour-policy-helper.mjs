/** Test-only fallback: a finite prefix on the existing graph may start away
 * from the target. Each endpoint is attempted once; two stationary failures
 * or six detour attempts disable this fallback for that hero/goal. */
export function createStage18DetourPolicy(){
 const states=new Map(),dist=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),key=p=>`${p.surfaceId}:${p.x.toFixed(1)}:${p.y.toFixed(1)}`;
 return{propose(g,b,e,nav,u,point,enemy,goal){
  if(!point||u.moveLeft<160||u.hp<u.maxHp*.35||goal?.kind==='hold'&&dist(u,point)<goal.radius||enemy&&dist(u,point)<(point.approachRange||150))return null;
  const id=u.id+':'+goal?.id+':'+point.id;let s=states.get(id);if(!s){s={attempts:0,stationary:0,used:new Set()};states.set(id,s);}if(s.attempts>=6||s.stationary>=2)return null;
  const route=nav.inspectRoute(u,point,enemy);if(!route)return null;let length=0,best=null;const limit=Math.min(u.moveLeft-e.jumpCost(u),u.maxMove*.75);
  for(let i=0;i<route.links.length;i++){const link=route.links[i];length+=dist(link.from,link.point)+(link.mode?.kind==='jump'?e.jumpCost(u):0);if(length>limit)break;const p=link.point;if(length<100||dist(u,p)<80||s.used.has(key(p))||!g.HONRO_CORE.validTerrainContactPose(b.terrain,{...u,x:p.x,y:p.y}))continue;const separate=b.units.every(v=>v===u||v.dead||v.hp<=0||v.honroObjectiveTarget||Math.abs(v.x-p.x)>=v.r+u.r+18||p.y<=v.y-v.h-18||p.y-u.h>=v.y+18);if(separate)best={route,endIndex:i,point:{...p,id:'detour-'+point.id},pathLength:length,euclideanProgress:dist(u,point)-dist(p,point),from:{x:u.x,y:u.y},stateId:id};}
  if(best){s.attempts++;s.used.add(key(best.point));}return best;
 },feedback(u,p){const s=states.get(p.stateId);if(!s)throw Error('Unissued detour');if(dist(u,p.from)<40)s.stationary++;else s.stationary=0;},snapshot(){return[...states].map(([id,s])=>({id,attempts:s.attempts,stationary:s.stationary,used:[...s.used]}));}};
}
