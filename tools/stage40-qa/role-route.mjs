/** Current visible encounter roles; no round-scripted kills or future state. */
export function finaleRoleGoal(u,{support,foes,surface}){
 const rear=foes.filter(v=>v.id.startsWith('final40-dock-left-'));
 const dock=foes.filter(v=>/final40-(dock-(left|right|stair)|departure-upper)-/.test(v.id));
 const role=['knight','occultist'].includes(u.cls)?'rear':u.cls==='archer'?'overwatch':'dock-front';
 if(support==='approved40-dock-stair'&&dock.length){
  if(role==='overwatch')return{x:2120,kind:'separate-overwatch-lane',hold:true};
  return{x:1800,kind:'rear-role-descend'};
 }
 if(support==='approved40-dock'&&dock.length&&role==='dock-front')return{x:2050,kind:'separate-dock-front-lane',hold:true};
 if(support==='approved40-dock'&&rear.length){
  if(role==='rear'){const targets=rear.toSorted((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x)),t=targets[0],spacing=u.cls==='knight'?130:360;return{x:t.x+(t.x>=u.x?-spacing:spacing),target:t.id,kind:'rear-flank-clear'};}
  return{x:u.cls==='archer'?2000:2200,kind:'recover-overwatch-lane',hold:true};
 }
 // Only after both flanks are resolved should everyone descend toward the boss.
 if(support==='approved40-dock'&&dock.length&&role==='overwatch')return{x:2000,kind:'hold-lower-approach',hold:true};
 return null;
}
