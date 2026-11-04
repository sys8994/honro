/** Read-only test-controller proposal; execution remains ordinary App jump/move. */
import {friendlyMuzzleObstruction} from './independent-planning.mjs';
export function hopApproach(C,e,u,target){
 if(!u||!target||target.dead||target.hp<=0||!e.grounded(u)||u.airborne||u.jumping)return null;
 const dx=target.x-u.x,dy=target.y-u.y;if(Math.abs(dx)>190||Math.abs(dy)>160)return null;
 const upper=dy<=-80,obstruction=upper?null:friendlyMuzzleObstruction(C,e,u,target);
 if(!upper&&!obstruction)return null;
 const direction=Math.sign(dx)||1,clearance=u.r+target.r+40,travel=Math.min(280,Math.abs(dx)+clearance),cost=e.jumpCost(u);
 if(u.moveLeft<cost+travel+50)return null;
 return {kind:upper?'near-upper-platform':'near-friendly-obstruction',target:target.id,direction,targetX:u.x+direction*travel,requestedHorizontalTravel:travel,jumpCost:cost,obstruction,
  scope:'One ordinary jump, bounded horizontal input, wait for actual landing and re-aim. Not a predicted successful route or shot.'};
}
