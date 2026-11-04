/** Test-controller targeting policy only. Read-only current observations, no future outcome search. */
export function escortRelevant(V,b,hero,foe){
 const root=V.mem(b),goal=V.current(b),npc=b.units.find(u=>u.id==='act3-carrier');
 if(!root.carrierStarted||goal?.kind!=='escort'||!npc)return true;
 // A nearby body may obstruct the selected hero even when the porter is free.
 // This is a conservative proximity rule, not proof of every collision/line of fire.
 const bodyNear=Math.abs(foe.y-hero.y)<160&&Math.hypot(foe.x-hero.x,foe.y-hero.y)<hero.r+foe.r+100;
 if(root.carrierGoals?.['dock-exit'])return bodyNear||V.near(foe,V.marker(b,'dock-exit'),500);
 const close=b.honroReviewed23PacingCandidate?.id==='escort-close-130'&&b.honroReviewed23PacingCandidate.version===1;
 if(bodyNear||V.near(foe,npc,close?130:300))return true;
 if(close)return false;
 const points=b.honroMarkers.filter(p=>p.id.startsWith('route:'+goal.id+':')).sort((a,z)=>Number(a.id.split(':').at(-1))-Number(z.id.split(':').at(-1)));
 const index=root.escortWaypoints?.[goal.id+':act3-carrier']||0,p=points[index]||V.marker(b,goal.id);
 return !!p&&V.near(foe,p,300);
}
