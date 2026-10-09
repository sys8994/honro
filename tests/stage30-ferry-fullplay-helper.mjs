/** Optional Stage30 input policy. The production routes define every waypoint;
 * this module never edits actors, resources, collision, objectives or phases. */
export function highRetreatAnchors(stage){
 const quay=stage.design.ferry.routes.find(r=>r.id==='quay-cape').anchors;
 const cape=stage.design.ferry.routes.find(r=>r.id==='cape-old-road').anchors;
 const junction=quay.findIndex(p=>p.surfaceId==='sf-granite-cape');
 const east=cape.findIndex(p=>p.jumpTo?.support==='sf-cape-bank-link');
 if(junction<0||east<0)throw Error('Missing authored D→C→E high-route junction');
 // Turn east at C's actual shared junction rather than walking to the western
 // end of the cape and retracing the same flat surface.
 return [...quay.slice(0,junction+1),...cape.slice(east)];
}

export function followHighRetreat(g,b,e,u,{points,state,nav,tick,ready,record}){
 const C=g.HONRO_CORE,distance=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y);
 for(let limit=0;limit<points.length+2&&ready()&&u.moveLeft>8;limit++){
  const p=points[state.index];if(!p)return true;
  const reached=()=>Math.abs(u.x-p.x)<(p.jumpTo?8:22)&&Math.abs(u.y-p.y)<55&&e.grounded(u)&&(!p.jumpTo||nav.surface(u)===p.surfaceId);
  if(!reached()){
   const from={x:u.x,y:u.y};let still=0,recoveries=0;
   // Reconnect after an actual fall/knockback through the shared navigator;
   // generated links still have to survive normal collision and landing.
   if(e.grounded(u)&&u.y-p.y>350)nav.advance(u,{id:'high-reconnect-'+state.index,...p});
   else for(let n=0;n<1600&&ready()&&u.moveLeft>8&&!reached();n++){
    const old={x:u.x,y:u.y};if(Math.abs(u.x-p.x)>5)e.move(Math.sign(p.x-u.x)*(Math.abs(p.x-u.x)<22?.35:1),C.STEP);
    if(e.grounded(u)&&(still>12||Math.abs(u.x-p.x)<24&&u.y-p.y>80)&&recoveries<3&&e.jump(u)){recoveries++;still=0;record({op:'recovery-jump',hero:u.cls,x:u.x,y:u.y,goal:p,reason:'normal recovery on authored high retreat'});}
    tick();still=distance(old,u)<.02?still+1:0;if(still>100)break;
   }
   for(let n=0;n<300&&ready()&&!e.grounded(u);n++)tick();
   if(distance(from,u)>1)record({op:'move',hero:u.cls,from,to:{x:u.x,y:u.y},support:nav.surface(u),goal:{id:'high-retreat-anchor-'+state.index,...p}});
   if(!ready()||!reached()){record({op:'high-route-pending',hero:u.cls,index:state.index,position:{x:u.x,y:u.y},support:nav.surface(u),goal:p,moveLeft:u.moveLeft});return false;}
  }
  const z=p.jumpTo||p.dropTo;
  if(z){
   const jump=!!p.jumpTo,from={x:u.x,y:u.y},departureSupport=nav.surface(u);if(jump&&(u.moveLeft<e.jumpCost(u)+Math.abs(z.x-u.x)+65||!e.jump(u)))return false;
   record({op:jump?'jump':'drop',hero:u.cls,from,support:departureSupport,to:{kind:jump?'jump':'drop',...z},reason:'sequential authored high retreat input'});
   let departed=jump||z.stepOffX===undefined;
   for(let n=0;n<(jump?240:600)&&ready();n++){
    const x=departed?z.x:z.stepOffX;if(Math.abs(u.x-x)>3)e.move(Math.sign(x-u.x)*(z.speed||(jump?.35:.8)),C.STEP);tick();
    if(!departed&&Math.abs(u.x-z.stepOffX)<8&&u.y>from.y+8)departed=true;
    if(n>30&&e.grounded(u)&&(!jump?nav.surface(u)===z.support&&Math.abs(u.x-z.x)<22:true))break;
   }
   const matched=nav.surface(u)===z.support;record({op:matched?'land':'nav-replan',hero:u.cls,x:u.x,y:u.y,support:nav.surface(u),expected:z.support,matched,reason:matched?'authored high edge crossed by normal input':'authored high edge failed; no placement fallback'});nav.clear(u.id);if(!matched)return false;
  }
  record({op:'high-route-anchor',hero:u.cls,index:state.index,position:{x:u.x,y:u.y},support:nav.surface(u),goal:p});state.index++;
 }
 return state.index>=points.length;
}
