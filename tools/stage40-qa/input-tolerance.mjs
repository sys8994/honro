import {evaluateLegalCast} from './legal-cast.mjs';
/** QA-controller current-state sensitivity screen, not player-visible certainty.
 * Uses only current observed battle, skill physics and a bounded input envelope.
 * Sampling cannot prove safety for every intermediate angle/charge or future turn. */
export function evaluateInputTolerance(C,b,actorId,id,angle,power,nominal){
 const offsets=[[0,-.10],[0,-.03],[0,-.01],[0,0],[0,.01],[0,.03],[0,.10],[-1,0],[1,0]],samples=[];
 for(const [da,dp] of offsets){const test=da===0&&dp===0&&nominal?nominal:evaluateLegalCast(C,b,actorId,id,Math.max(-85,Math.min(265,angle+da)),Math.max(0,Math.min(1,power+dp)));
  samples.push({angleOffset:da,powerOffset:dp,safe:test.safe===true,damage:test.enemyDamage||0,friendlyDamage:test.friendlyDamage||0});
  if(!test.safe||!(test.enemyDamage>0))return{safeUseful:false,minimumDamage:0,samples,scope:'bounded current-state samples; not a player-visible guide or universal guarantee'};
 }
 return{safeUseful:true,minimumDamage:Math.min(...samples.map(s=>s.damage)),samples,scope:'bounded current-state samples; not a player-visible guide or universal guarantee'};
}
