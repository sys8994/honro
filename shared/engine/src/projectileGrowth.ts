import type {Skill} from './types';
import {clamp} from './math';
/** Rank is captured at cast time. More particles buy coverage, not N times free damage. */
const GROWTH:Record<string,{base:number;step:number;spread:number;compensation:number}>={
 triple:{base:3,step:1,spread:3.5,compensation:.62},
 cluster:{base:7,step:1,spread:42,compensation:.65},
 rain:{base:7,step:1,spread:62,compensation:.64},
 seekRain:{base:3,step:1,spread:23,compensation:.67},
 emberOrb:{base:16,step:2,spread:0,compensation:.65},
 frostOrb:{base:32,step:4,spread:0,compensation:.66},
 stormOrb:{base:12,step:1,spread:0,compensation:.66}
};
export function multishotProfile(skill:Skill,rank:number){
 const r=clamp(Math.floor(rank||1),1,8),g=GROWTH[skill.mode];if(!g)return null;
 const count=g.base+g.step*(r-1),halfAngle=g.spread*Math.sqrt(count/g.base),damageScale=Math.pow(g.base/count,g.compensation);
 return {rank:r,count,base:g.base,halfAngle,damageScale,growth:g.step,waves:['emberOrb','frostOrb','stormOrb'].includes(skill.mode)?8:1};
}
export function volleyAngles(skill:Skill,rank:number,angle:number){const m=multishotProfile(skill,rank);if(!m||skill.mode!=='triple')return[angle];return Array.from({length:m.count},(_,i)=>angle-m.halfAngle+2*m.halfAngle*i/(m.count-1));}
export function waveCount(skill:Skill,rank:number,wave:number){const p=multishotProfile(skill,rank);if(!p)return 0;return Math.floor(p.count*(wave+1)/p.waves)-Math.floor(p.count*wave/p.waves);}
