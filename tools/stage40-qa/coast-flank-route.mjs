/** QA movement policy: one forward flank using only present visible geometry.
 * Never force all roles to attack; a useful current-facing shot takes priority. */
export function coastFlankGoal(u,{support,foes,heroes,surface,topAt,terrains}){
 if(u.cls==='knight'||support!=='approved40-coast-west'||u.moveLeft<350)return null;
 const target=foes.filter(v=>!v.dead&&v.hp>0&&surface(v)===support&&v.x>=u.x).sort((a,z)=>a.x-z.x)[0];if(!target)return null;
 const terrain=terrains.find(t=>t.id===support);if(!terrain)return null;
 const base=target.x+280;
 for(const x of [base,base+160,base+320]){
  const y=topAt(terrain,x);if(!Number.isFinite(y)||Math.hypot(x-u.x,y-u.y)>u.moveLeft-100)continue;
  if(heroes.some(v=>v.id!==u.id&&!v.dead&&v.hp>0&&Math.hypot(v.x-x,v.y-y)<(u.r||24)+(v.r||24)+70))continue;
  return{x,y,target:target.id,kind:'observed-coast-flank'};
 }
 return null;
}
