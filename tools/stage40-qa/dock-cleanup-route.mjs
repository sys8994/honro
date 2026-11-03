/** Current observed living foes only: leave the boss deck once no enemy remains
 * there. This is a controller route, not a new stage objective or terrain rule. */
export function dockCleanupGoal(u,{support,foes,surface}){
 if(!foes.length||!foes.every(v=>['approved40-dock','approved40-dock-stair'].includes(surface(v))))return null;
 if(support==='a4-return-deck')return{x:2350,deckJoin:true,kind:'dock-cleanup-deck-join'};
 if(support==='approved40-departure-stair')return{x:1460,jumpLanding:'approved40-dock',kind:'dock-cleanup-land-on-dock'};
 if(support==='approved40-dock'){
  const target=[...foes].sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x))[0];
  const spacing={archer:320,mage:380,occultist:440,knight:145}[u.cls]||320;
  return{x:target.x+(target.x>=u.x?-spacing:spacing),target:target.id,kind:'dock-cleanup-same-level'};
 }
 return null;
}
