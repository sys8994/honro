/** QA policy only: existing dock/stair positions independently demonstrated in
 * actual saved-profile browser play. Uses living current actors, never rounds. */
export function splitDockRoleGoal(u,{support,foes,heroes,surface}){
 const dock=foes.filter(v=>!v.dead&&v.hp>0&&['approved40-dock','approved40-dock-stair'].includes(surface(v)));
 if(!dock.length)return null;
 if(u.cls==='archer'){
  if(support==='approved40-dock')return{x:1900,jumpLanding:'approved40-dock-stair',kind:'split-overwatch-connection'};
  if(support==='approved40-dock-stair')return{x:2120,kind:'split-overwatch-fire',hold:true};
 }
 if(support!=='approved40-dock')return null;
 if(u.cls==='mage')return{x:2152,kind:'split-front-fire',hold:true};
 if(u.cls==='occultist'){
  const frontNeedsSupport=heroes.some(v=>v.id!==u.id&&!v.dead&&v.hp>0&&v.hp<v.maxHp*.65&&v.x>1400&&Math.hypot(v.x-u.x,v.y-u.y)>600);
  const rear=dock.some(v=>v.x<1400);
  return{x:frontNeedsSupport||!rear?1630:1050,kind:frontNeedsSupport?'split-support-rejoin':rear?'split-rear-fire':'split-forward-support',hold:true};
 }
 return null;
}
