/** Read-only controller scope. It changes intended inputs, never game state. */
const live=u=>u.side===1&&!u.honroObjectiveTarget&&!u.dead&&u.hp>0&&!u.honroSubdued&&!u.eaterCapturedBy&&u.summonKind!=='eater';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function onSegment(u,a,z){const dx=z.x-a.x,dy=z.y-a.y,n=dx*dx+dy*dy;if(!n)return false;const t=((u.x-a.x)*dx+(u.y-a.y)*dy)/n;return t>=0&&t<=1&&Math.hypot(u.x-a.x-t*dx,u.y-a.y-t*dy)<=180;}
export function stage14GoalScope(g,b,goal,{marker,actor,route}={}){
 if(goal?.id==='bridge'){
  const mandatory=g.HonroAct2.interactionThreats(b,marker),path=(route?.links||[]).filter(l=>!l.mode),approach=b.units.filter(u=>live(u)&&path.some(l=>onSegment(u,l.from,l.point)));
  return{kind:'bridge-local-and-authored-approach',mandatoryIds:mandatory.map(u=>u.id),approachIds:approach.map(u=>u.id),ids:new Set([...mandatory,...approach].map(u=>u.id)),actor:actor?.id};
 }
 if(goal?.kind==='hold'){
  const final=g.HonroAct2.steps(b).find(s=>s.id==='clear-village'),protect=final?g.HonroAct2.enemiesFor(b,final):[],contest=b.units.filter(u=>live(u)&&distance(u,marker)<goal.contestRadius);
  return{kind:'hold-protected-local-and-contest',mandatoryIds:contest.map(u=>u.id),approachIds:protect.map(u=>u.id),ids:new Set([...protect,...contest].map(u=>u.id))};
 }
 if(goal?.kind==='pacing-secure'){
  const foes=g.HonroAct2.enemiesFor(b,goal);return{kind:'actual-final-local-threats',mandatoryIds:foes.map(u=>u.id),approachIds:[],ids:new Set(foes.map(u=>u.id))};
 }
 return null;
}
