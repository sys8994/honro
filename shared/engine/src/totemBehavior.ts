/** Offensive stakes activate only during the opposing team's turn. Their saved
 * per-target ledgers prevent both repeated contact and splash re-hits. */
import type {Engine} from './engine';
import type {Battle,Unit,Projectile} from './types';
import {passiveRank} from './progression';
import {clamp} from './math';
import {SKILLS} from './data';
type Stake=NonNullable<Battle['stakes']>[number];
const hostile=(z:Stake,u:Unit)=>!u.dead&&u.side!==z.side&&u.side!==2;
export function stakeBoost(e:Engine,z:Stake){const caster=e.unit(z.owner);return caster?(1+passiveRank(caster,'MP01')*.02)*(1+(z.effectBoost||0)):1;}
export function stakeContact(z:Stake,u:Unit,boost:number){return Math.min(Math.hypot(u.x-z.x,u.y-z.y),Math.hypot(u.x-z.x,u.y-u.h*.5-z.y))<45*Math.min(1.25,boost)+u.r;}
export function lureStakeFor(e:Engine,u:Unit){
 if(u.dead||u.boss||u.side!==1||e.b.side!==u.side||u.fixed&&!['bat','crow','lantern'].includes((u as any).honroType))return undefined;
 return (e.b.stakes||[]).filter(z=>z.skill==='M08'&&hostile(z,u)&&e.unit(z.owner)&&(z.expires===undefined||z.expires>e.b.round)&&Math.hypot(u.x-z.x,u.y-u.h*.5-z.y)<(260+15*(z.rank-1))*stakeBoost(e,z)).sort((a,b)=>Math.hypot(u.x-a.x,u.y-a.y)-Math.hypot(u.x-b.x,u.y-b.y)||a.id-b.id)[0];
}
export function triggerOffensiveStake(e:Engine,z:Stake,nearby:Unit[],p:Projectile,boost:number){
 const b=e.b;if(b.side===z.side||b.side===2||!['enemy','aim','flight','review'].includes(b.phase))return;
 z.usedRounds??={};
 // Each stake is an independent cast; each enemy can take its damage once per round.
 const fresh=nearby.filter(u=>z.usedRounds![u.id]!==b.round);if(!fresh.length)return;
 z.lastTriggerRound=b.round;
 if(z.skill==='M07'){
  const x=z.x,y=z.y-20,radius=95;
  e.fx('burst',x,y,p.color,radius);e.fx('ring',x,y,p.color,radius);e.emit('sound',{name:'hit',value:radius});
  for(const u of b.units){
   if(u.dead||z.usedRounds[u.id]===b.round)continue;
   const d=Math.hypot(u.x-x,u.y-u.h*.45-y);if(d>=radius+u.r)continue;
   z.usedRounds[u.id]=b.round;e.hurt(u,z.damage*(.42+.58*(1-clamp(d/radius,0,1))),z.owner,false,p,{x,y});
   if(!u.dead&&z.damage>15)e.impulse(u,Math.sign(u.x-x||1)*(1-d/(radius+u.r))*95,-45);
  }
  for(const u of fresh)z.usedRounds[u.id]=b.round;
  for(const t of [...b.terrain]){if(t.broken||t.hp>=9999)continue;const d=Math.hypot(x-clamp(x,t.x,t.x+t.w),y-clamp(y,Math.min(t.y,t.y+(t.slope||0)),t.y+t.h));if(d<radius)e.damageTerrain(t,z.damage*(SKILLS[z.skill]?.terrain||1)*(.5+.5*(1-d/radius)),0,z.owner);}
 }else{
  for(const u of fresh){z.usedRounds[u.id]=b.round;e.hurt(u,z.damage,z.owner,false,p,z);if(!u.boss){u.moveLeft=0;delete u.aiMove;delete u.moveTarget;u.moving=0;}e.fx('ring',u.x,u.y,p.color,45);}
 }
}
