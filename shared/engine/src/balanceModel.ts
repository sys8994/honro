import type { Skill, ClassId } from './types';
import { SKILLS } from './data';
import { clamp } from './math';

/**
 * ARCFALL combat balance model.
 *
 * It deliberately does NOT try to make skills identical.  It converts their
 * damage, reach, area, control, reliability and resource cost into one common
 * budget so that a spectacular utility skill "pays" for that utility instead
 * of also receiving top-tier raw damage for free.
 *
 * Runtime damage is normalized with a deliberately narrow multiplier.  This
 * keeps the authored identity/feel intact while preventing a low-tier skill or
 * an ultimate from becoming a clear mathematical trap.
 */
export interface SkillScoreBreakdown {
  tier:number;
  target:number;
  damage:number;
  area:number;
  reach:number;
  utility:number;
  reliability:number;
  aimControl:number;
  terrain:number;
  manaPenalty:number;
  total:number;
  factor:number;
  normalized:number;
}

const ACTIVE_ROWS:Record<ClassId,string[][]>={
 mage:[['M01','M02','M06','M13','M05'],['M03','M09','M08','M14','M11'],['M04','M07','M10','M15','M12']],
 archer:[['A01','A02','A07','A14','A10'],['A05','A06','A09','A13','A08'],['A03','A04','A11','A12','A15']],
 knight:[['S01','S03','S04','S13','S02'],['S06','S05','S07','S08','S15'],['S09','S10','S11','S14','S12']],
 occultist:[['O01','O02','O03','O04','O05'],['O06','O07','O08','O09','O10'],['O11','O12','O13','O14','O15']]
};

const TIER_TARGET=[92,108,126,146,168];
const ULTIMATE_TARGET=330;

/** Representative number of useful hits, not the theoretical maximum. */
const EXPECTED_HITS:Record<string,number>={
 cluster:2.0,rain:2.0,triple:1.65,twinCrescent:1.55,seekRain:1.8,
 emberOrb:2.0,frostOrb:2.0,stormOrb:2.0,phaseWraith:1.25,wraithReturn:1.65,spiritLance:1.15,arcaneJudgment:3.8,starHunt:3.5,
 charge:1.65,cataclysmCharge:2.35,spin:1.45,
 curseDot:2.6,curseChain:1.65,nightParade:4.0,
 summonStalker:2.2,summonLantern:2.1,summonCharger:2.0,summonWarden:1.55,summonHost:3.2,
 reverseGhost:1.8
};


/**
 * How much of a multishot pattern is actually under the player's control.
 * A radial/orb emitter may create dozens of particles, but most are coverage,
 * not aimed hits.  The balance model therefore prices only the statistically
 * useful contacts instead of rewarding theoretical projectile count.
 */
const AIM_CONTROL:Record<string,number>={
 emberOrb:.78,   // downward travelling cone; partially steerable with altitude/wind
 frostOrb:.65,   // radial shards: broad coverage, low intentional hit probability
 stormOrb:.70    // vertical lanes: useful zone denial, individual bolts semi-random
};

const UTILITY:Record<string,number>={
 bounce:12,frost:30,lightning:25,marker:22,cluster:20,delay:42,gravity:72,wall:72,firetrail:38,shatter:62,resonate:68,
 pierce:18,ricochet:16,triple:16,push:34,bind:48,break:56,sticky:68,pull:54,mark:78,rain:24,return:24,homing:30,windArrow:16,seekRain:46,
 leap:18,slam:24,spin:22,dash:28,quake:56,guard:58,lift:52,grapple:78,crescent:14,groundwave:22,shieldthrow:40,recall:64,charge:50,twinCrescent:22,vault:68,
 spiritBolt:12,phaseWraith:29,reverseGhost:24,spiritLance:24,wraithReturn:28,
 curseWeak:46,curseBetray:72,curseDot:52,curseBind:64,curseChain:62,
 summonStalker:48,summonLantern:58,summonCharger:62,summonWarden:92,summonHost:82,
 arcaneJudgment:44,starHunt:42,cataclysmCharge:48,nightParade:54
};

const RELIABILITY:Record<string,number>={
 arrow:8,windArrow:12,homing:13,spiritBolt:13,spiritLance:17,phaseWraith:19,
 marker:4,rain:-2,cluster:-2,return:-2,reverseGhost:2,wraithReturn:7,
 summonLantern:8,curseBetray:6
};

export function skillTier(id:string){
 const s=SKILLS[id]; if(!s)return 0; if(s.ultimate)return 6;
 if(s.legacyId)id=s.legacyId;
 const branches=ACTIVE_ROWS[s.cls];
 for(const branch of branches){const i=branch.indexOf(id);if(i>=0)return i+1;}
 return 1;
}
export function targetSkillScore(skill:Skill){return skill.ultimate?ULTIMATE_TARGET:TIER_TARGET[clamp(skillTier(skill.id)-1,0,4)];}
export function aimControl(skill:Skill){return AIM_CONTROL[skill.mode]??1;}
export function expectedHits(skill:Skill){return (EXPECTED_HITS[skill.mode]??1)*aimControl(skill);}

function rawComponents(skill:Skill,damageOverride=skill.damage){
 const hits=expectedHits(skill),control=aimControl(skill);
 // Damage is intentionally close to one point per expected raw damage.
 const damage=damageOverride*hits;
 // Large radii have diminishing value: doubling a radius does not double the useful targets.
 const area=skill.radius>0?Math.min(34,Math.sqrt(skill.radius)*2.15):0;
 const gravityFreedom=Math.max(0,1-(skill.gravity??1));
 const phase=skill.phase==='all'?18:skill.phase==='terrain'?12:0;
 const reach=Math.min(26,Math.max(0,(skill.speed-0.75)*28)+(1-Math.min(1,skill.wind))*5+gravityFreedom*9+phase);
 const utility=UTILITY[skill.mode]??0;
 const reliability=RELIABILITY[skill.mode]??0;
 const terrain=Math.min(12,Math.max(0,(skill.terrain-1)*3));
 // High mana is a meaningful balancing cost, but it should not be counted twice.
 const manaPenalty=Math.max(0,skill.cost-18)*.30+(skill.cooldown||0)*5;
 return {damage,area,reach,utility,reliability,aimControl:control,terrain,manaPenalty};
}
export function scoreSkill(skill:Skill,damageOverride=skill.damage){
 const c=rawComponents(skill,damageOverride);return c.damage+c.area+c.reach+c.utility+c.reliability+c.terrain-c.manaPenalty;
}
export function skillBalanceFactor(skill:Skill){
 if(skill.passive||skill.redesigned)return 1;
 if(skill.legacyId)skill={...skill,id:skill.legacyId};
 const target=targetSkillScore(skill),base=scoreSkill(skill);
 const hits=expectedHits(skill);
 const c=rawComponents(skill);
 const nonDamage=c.area+c.reach+c.utility+c.reliability+c.terrain-c.manaPenalty;
 const desired=Math.max(skill.damage*.45,(target-nonDamage)/Math.max(.55,hits));
 // Narrow correction: the authored skill remains recognizable.
 const factor=clamp(desired/Math.max(1,skill.damage),.38,3.20);
 // Score is a guardrail, not a homogenizer: only raw damage is normalized; trajectory, area and utility remain authored.
 return 1+(factor-1)*.95;
}
export function skillScoreBreakdown(skill:Skill):SkillScoreBreakdown{
 const target=targetSkillScore(skill),factor=skillBalanceFactor(skill),c=rawComponents(skill),normalized=scoreSkill(skill,skill.damage*factor);
 return {tier:skillTier(skill.id),target,...c,total:scoreSkill(skill),factor,normalized};
}

export interface CharacterScoreInput{hp:number;mp:number;attack:number;armor:number;move:number;speed:number;regen:number;}
export function characterScore(v:CharacterScoreInput){
 // Survivability and action economy use equivalent, readable budgets at a representative midgame level.
 const ehp=v.hp/Math.max(.2,1-v.armor);
 return ehp*.055+v.mp*.20+v.attack*24+v.move*.020+v.speed*.055+v.regen*.7;
}
export function characterBalanceScore(cls:ClassId,v:CharacterScoreInput){
 const chassis=characterScore(v);
 // Range/position risk is deliberately separated from raw HP/armor. Knight pays the largest exposure tax; archer receives the largest reach credit.
 const role={mage:1.03,archer:1.08,knight:.885,occultist:.93} as Record<ClassId,number>;
 return chassis*role[cls];
}
export function classRoleTarget(cls:ClassId){return 260;}
export function balanceRows(){return Object.values(SKILLS).filter(s=>!s.passive).map(s=>({id:s.id,cls:s.cls,name:s.name,...skillScoreBreakdown(s)}));}
