/** Hero locomotion audit only. The boss runtime's exact swept rectangle is
 * unchanged. Keep its original blockers as diagnostics, then distinguish the
 * engine's exposed foot contour from actual head/torso intrusion. */
export function heroClearance(g,e,u,{lastGrounded=null}={}){
 const raw=g.HonroStage8Bier.terrainBlockers(e,u);if(!raw.length)return{raw,blocked:[],contacts:[]};
 const C=g.HONRO_CORE,grounded=e.grounded(u),valid=grounded&&C.validTerrainContactPose(e.b.terrain,u);
 // The live walkable contour can rise across a visual half-width by r*1.35.
 // The only additional allowance is locomotion's existing 2.5-unit seam.
 // This is a lower-body contact envelope, never a ceiling/wall exemption.
 const footBand=u.r*1.35+2.5,upper={...u,y:u.y-footBand,h:u.h-footBand};
 const upperBlocked=new Set(g.HonroStage8Bier.terrainBlockers(e,upper).map(t=>t.id));
 const contacts=[],blocked=[];
 for(const item of raw){
  const t=e.b.terrain.find(t=>t.id===item.id);let exposed=false;
  if(t){const ps=C.poly(t);for(let i=0;i<ps.length;i++){
   const a=ps[i],z=ps[(i+1)%ps.length];if(z.x-a.x<=1e-7)continue;
   const lo=Math.max(a.x,u.x-u.r),hi=Math.min(z.x,u.x+u.r);if(lo>hi)continue;
   for(const x of[lo,(lo+hi)/2,hi]){const y=a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);if(y>=u.y-footBand&&y<=u.y+.25&&!e.b.terrain.some(v=>v!==t&&!v.broken&&!v.oneWay&&C.terrainContains(v,x,y-.05)))exposed=true;}
  }}
  const landing=!grounded&&(u.vy||0)>=0;
  const leaving=!grounded&&(u.vy||0)<0&&lastGrounded?.support===item.id&&lastGrounded.y-u.y>=0&&lastGrounded.y-u.y<=footBand&&Math.abs(lastGrounded.x-u.x)<=u.r*2;
  if(!upperBlocked.has(item.id)&&exposed&&(valid||landing||leaving))contacts.push({...item,footBand,kind:valid?'supported-exposed-contour':leaving?'ascending-foot-transition':'descending-foot-transition'});
  else blocked.push(item);
 }
 return{raw,blocked,contacts,grounded,validContact:valid,footBand};
}
