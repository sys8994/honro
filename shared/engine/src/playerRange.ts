import type {Skill,Unit,Projectile} from './types';
import {clamp} from './math';

/** New casts only. Reference: no wind, level ground, h92, tune .5, rank1,
 * no passives, full charge. Speed is calibrated with the production STEP loop.
 * NPC/legacy definitions and already flying saved projectiles are not retuned. */
export const PLAYER_RANGE_REVISION=1;
export const PLAYER_LANTERN_RANGE={reach:1100,distance:1200,seconds:1.2};
export interface PlayerRangeTuning {target:number;speed:number;seconds?:number;distance?:number;}
export const PLAYER_RANGE_TUNING:Record<string,PlayerRangeTuning>={
 A01:{target:2600,speed:1.15943759},A14:{target:3400,speed:1.31006761},A02:{target:3100,speed:1.27616689},A06:{target:2900,speed:1.23053678},A99:{target:3500,speed:1.36370249},
 A11:{target:2500,speed:1.27781405},A09:{target:2700,speed:1.18337535},A13:{target:2600,speed:1.15943759},A12:{target:2400,speed:1.48464479},A15:{target:2500,speed:1.39300131,distance:2700},
 A05:{target:2700,speed:1.18392772},A04:{target:2800,speed:1.20772292},A07:{target:3000,speed:1.25323992},A03:{target:2800,speed:1.20772292},A08:{target:2700,speed:1.18392772},
 M01:{target:2000,speed:1.06642931},M06:{target:1800,speed:1.00263686},M02:{target:2000,speed:1.06642931},M04:{target:2100,speed:1.09698410},M13:{target:1600,speed:0.93648691},M05:{target:1800,speed:1.00299365},
 M03:{target:1800,speed:1.00263686},M11:{target:2200,speed:1.12661279},M12:{target:2100,speed:1.09698410},M15:{target:1900,speed:1.03525433},
 M07:{target:1800,speed:1.00299365},M10:{target:1600,speed:0.93648691},M08:{target:1700,speed:0.97000000},M09:{target:1500,speed:0.90248850},M99:{target:1700,speed:0.97000000},
 O01:{target:1800,speed:.95,seconds:2.4,distance:1800},O02:{target:2000,speed:1.13252003,distance:2000},O03:{target:2200,speed:0.84000000,distance:2300},
 O04:{target:2500,speed:1.17,seconds:2.7,distance:2500},O05:{target:2300,speed:.94,seconds:3.2,distance:2300},O16:{target:2400,speed:1.42000000,distance:2400},
 O06:{target:1800,speed:0.99389249},O07:{target:1900,speed:1.02511707},O08:{target:2000,speed:1.05563907},O09:{target:2000,speed:1.05563907},O10:{target:2100,speed:1.08551082},
 O11:{target:1800,speed:0.99389249},O12:{target:1500,speed:1.64833510,distance:1500},O13:{target:1700,speed:0.96190509},O14:{target:1800,speed:0.75914295},O15:{target:1600,speed:1.41021229,distance:1600},
 S01:{target:900,speed:0.68765964},S06:{target:900,speed:0.68765964},S04:{target:900,speed:0.68765964},S13:{target:900,speed:0.68765964},S15:{target:1200,speed:0.80160025},
 S09:{target:1400,speed:0.84982515},S10:{target:1400,speed:0.84982515},S11:{target:1400,speed:0.84982515},S14:{target:1400,speed:0.84982515},S12:{target:1400,speed:0.84982515}
};
export function playerRangeApplies(u:Unit,s:Skill){return u.side===0&&!u.summoned&&!u.enthrall&&!(u as any).honroAlly&&!(u as any).honroCivilian&&!s.enemyOnly&&!!PLAYER_RANGE_TUNING[s.id];}
export function playerRangeSpeed(u:Unit,s:Skill,original:number){
 if(!playerRangeApplies(u,s))return original;
 let speed=PLAYER_RANGE_TUNING[s.id].speed;
 // Preserve the choice without letting the historical 1.26-.14*tune square
 // into another class-wide range multiplier on redesigned player arrows.
 if(s.cls==='archer')speed*=1+(.5-clamp(u.tune,0,1))*.04;
 // Linear reach growth, rather than the square of the old speed multipliers.
 if(s.martial&&s.branch==='rush')speed*=Math.sqrt(1+.025*clamp(u.ranks.SP03||0,0,8));
 if(s.martial&&s.branch==='blade')speed*=Math.sqrt(1+.015*clamp(u.ranks.SP01||0,0,8));
 return speed;
}
export function initializePlayerRange(p:Projectile,u:Unit,s:Skill){
 if(!playerRangeApplies(u,s))return;
 const t=PLAYER_RANGE_TUNING[s.id];
 p.rangeRevision=PLAYER_RANGE_REVISION;
 if(t.seconds||t.distance||s.martial&&s.branch==='rush'){
  p.flightRange={x:u.x,y:u.y-u.h*.63,distance:t.distance,seconds:t.seconds,rush:s.martial&&s.branch==='rush'?1500:undefined};p.flightAge=0;
 }
 if(s.cls==='archer'){
  const old=s.speed*(1.26-u.tune*.14),ratio=old/playerRangeSpeed(u,s,old);
  p.trajectorySpeedScale=ratio;p.trajectoryDropScale=ratio*ratio;
 }
}
export function flightRangeSpent(p:Projectile){const r=p.flightRange;return !!r&&((r.seconds!==undefined&&(p.flightAge||0)>=r.seconds)||(r.distance!==undefined&&Math.hypot(p.x-r.x,p.y-r.y)>=r.distance));}
/** Stop propulsion at the horizontal budget; keep gravity and real body landing. */
export function boundRushMotion(p:{x:number;flightRange?:Projectile['flightRange']},m:{x:number;y:number;vx:number;vy:number}){
 const r=p.flightRange;if(!r?.rush)return m;
 const x=clamp(m.x,r.x-r.rush,r.x+r.rush);return x===m.x?m:{...m,x,vx:0};
}
