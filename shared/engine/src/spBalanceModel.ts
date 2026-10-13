import {SKILLS} from './data';
import {skillScoreBreakdown} from './balanceModel';
import type {ClassId,HeroProgress} from './types';
import {heroStats,passiveRank,rankPower,volleyCount,volleyDamage,knockbackResistance,TALENT_MAP} from './progression';
import {passiveTuning,HERO_ARMOR_CAP} from './passiveBalance';
import {JUCHEON_THRESHOLD,JUCHEON_DISCOUNT,JUCHEON_EFFECT,SALHEUN_TURNS,SALHEUN_RATIO} from './warriorData';

/** Audit only. These scenarios NEVER multiply live damage or grant/refund SP. */
export interface SpAxes {offense:number;survival:number;sustain:number;mobility:number;}
export interface SpScenario {
 id:string; turns:number; castCost:number;
 /** Actual useful contacts, conditional uptime and risk. All fractions are [0,1]. */
 followupHit:number; trajectory:number; missRate:number; secondaryShare:number; geometryHit:number;
 wardUse:number; incomingHpPerTurn:number; sameTarget:number; chargedMelee:number; bladeHit:number;
 harmony:number; lethalRisk:number; retreatUse:number; jumpUse:number;
 summonShare:number; markUptime:number; summonAvailable:number; largeHitShare:number; hitHpFraction:number;
 trapReentry:number; naturalExpiry:number; empoweredCast:number; soulShare:number;
 weights:Record<ClassId,SpAxes>;
}
const weights:Record<ClassId,SpAxes>={
 mage:{offense:.40,survival:.20,sustain:.30,mobility:.10},
 archer:{offense:.55,survival:.20,sustain:.10,mobility:.15},
 knight:{offense:.35,survival:.40,sustain:.10,mobility:.15},
 occultist:{offense:.40,survival:.25,sustain:.25,mobility:.10},
};
/** Four shared build roles, selected by mechanic, not fitted separately to each skill. */
export const SP_ROLES:Record<string,SpAxes>={
 striker:{offense:.60,survival:.20,sustain:.10,mobility:.10},
 protector:{offense:.15,survival:.65,sustain:.10,mobility:.10},
 channeler:{offense:.15,survival:.15,sustain:.60,mobility:.10},
 skirmisher:{offense:.15,survival:.15,sustain:.10,mobility:.60},
};
export const SP_PASSIVE_ROLES:Record<string,string>={
 MP01:'striker',MP02:'channeler',MP03:'channeler',MP04:'protector',MP05:'channeler',
 AP01:'striker',AP02:'striker',AP03:'skirmisher',AP04:'striker',AP05:'striker',
 SP01:'striker',SP02:'protector',SP03:'skirmisher',SP04:'channeler',SP05:'protector',
 OP01:'striker',OP02:'striker',OP03:'protector',OP04:'channeler',OP05:'striker',
};
export const SP_SCENARIOS:SpScenario[]=[
 {id:'mixed-8-turn',turns:8,castCost:32,followupHit:.55,trajectory:.65,missRate:.25,secondaryShare:.30,geometryHit:.22,wardUse:.65,incomingHpPerTurn:.40,sameTarget:.60,chargedMelee:.70,bladeHit:.45,harmony:.25,lethalRisk:.20,retreatUse:.65,jumpUse:.20,summonShare:.45,markUptime:.65,summonAvailable:.65,largeHitShare:.45,hitHpFraction:.25,trapReentry:.35,naturalExpiry:.50,empoweredCast:.18,soulShare:.60,weights},
 {id:'specialist-12-turn',turns:12,castCost:38,followupHit:.80,trajectory:1,missRate:.40,secondaryShare:.55,geometryHit:.40,wardUse:.90,incomingHpPerTurn:.30,sameTarget:.90,chargedMelee:1,bladeHit:.80,harmony:1/3,lethalRisk:.45,retreatUse:.90,jumpUse:.40,summonShare:.65,markUptime:.90,summonAvailable:.90,largeHitShare:.70,hitHpFraction:.25,trapReentry:.65,naturalExpiry:.85,empoweredCast:.33,soulShare:.85,weights},
 {id:'short-low-uptime',turns:3,castCost:24,followupHit:.25,trajectory:.20,missRate:.10,secondaryShare:.10,geometryHit:.08,wardUse:.30,incomingHpPerTurn:.35,sameTarget:.15,chargedMelee:.30,bladeHit:.15,harmony:.08,lethalRisk:.05,retreatUse:.25,jumpUse:.05,summonShare:.15,markUptime:.20,summonAvailable:.25,largeHitShare:.15,hitHpFraction:.50,trapReentry:.10,naturalExpiry:0,empoweredCast:.03,soulShare:.30,weights},
];
export interface SpAuditStats {hp:number;mp:number;attack:number;armor:number;critChance:number;critMultiplier:number;move:number;regen:number;}
export type SpTuning=ReturnType<typeof passiveTuning>;
export interface SpAuditHooks {
 stats?:(h:HeroProgress,cls:ClassId)=>SpAuditStats;
 tuning?:(rank:number)=>SpTuning;
 salheunRatio?:number[];
}
/** EHP, useful expected damage, available paid actions and movement opportunity are kept separate. */
export function spBuildAxes(h:HeroProgress,cls:ClassId,s:SpScenario=SP_SCENARIOS[0],hooks:SpAuditHooks={}):SpAxes {
 const stats=(hooks.stats||heroStats)(h,cls),tune=hooks.tuning||passiveTuning;
 const r=(id:string)=>passiveRank({side:0,ranks:h.ranks},id),t=(id:string)=>tune(r(id));
 let offense=stats.attack*(1+Math.min(.80,stats.critChance)*(Math.min(3.5,stats.critMultiplier)-1));
 let survival=stats.hp/(1-Math.min(HERO_ARMOR_CAP,stats.armor));
 let budget=stats.mp+stats.regen*s.turns,cost=s.castCost,mobility=stats.move;
 if(cls==='mage'){
  offense*=1+s.secondaryShare*t('MP01').gourdSecondary+s.geometryHit*t('MP01').geometry;
  cost*=1-s.missRate*.85*t('MP03').missRefund; // Stakes cannot trigger a miss refund.
  survival*=1+Math.min(.25,t('MP04').ward)*s.wardUse/s.incomingHpPerTurn;
  const rank=r('MP05');if(rank){
   const paid=Math.ceil(JUCHEON_THRESHOLD[rank-1]/s.castCost),cycle=paid+1;
   // A short encounter cannot claim a complete cycle it has not reached.
   const casts=s.turns>=cycle?1/cycle:0;
   cost*=1-casts*JUCHEON_DISCOUNT[rank-1];offense*=1+casts*(JUCHEON_EFFECT[rank-1]+t('MP05').jucheonExtraEffect);
  }
 }
 if(cls==='archer'){
  let follow=0;for(let n=1;n<volleyCount(r('AP01'));n++)follow+=t('AP01').volleyFirst*Math.pow(.66,n-1);
  offense*=1+s.followupHit*follow;
  offense*=1+(.40+t('AP04').trajectory)*s.trajectory;
  const rank=r('AP05');if(rank){let history=0;for(let age=1;age<=Math.min(s.turns-1,SALHEUN_TURNS[rank-1]);age++)history+=Math.pow(.55,age-1)*Math.pow(s.sameTarget,age);offense*=1+(hooks.salheunRatio||SALHEUN_RATIO)[rank-1]*history;}
  if(r('AP03'))mobility*=1+s.retreatUse*t('AP03').retreat;
 }
 if(cls==='knight'){
  // Three mutually exclusive cast families are averaged, never added as three full attacks.
  const sword=(.88+(.47+t('SP01').swordCharge)*s.chargedMelee)/(.88+.47*s.chargedMelee);
  const rush=1+t('SP01').rushDamage,blade=1+s.bladeHit*t('SP01').bladeGeometry;
  offense*=(sword+rush+blade)/3;
  mobility*=1+.20*t('SP01').swordReach;
  mobility*=1+s.jumpUse*((75/Math.max(25,75-5*r('SP03'))-1)+((1+.02*r('SP03'))**2-1)*.25);
  mobility*=1+.15*knockbackResistance(r('SP02'));
  offense*=1+s.harmony*t('SP04').harmonyDamage;
  survival/=1-s.harmony*t('SP04').harmonyGuard;
  budget+=stats.mp*s.turns*s.harmony*t('SP04').harmonyRecovery;
  cost*=1-s.harmony*t('SP04').harmonyDiscount;
  if(r('SP05'))survival*=1+s.lethalRisk*(.20+t('SP05').lastStandHp/(1-t('SP05').lastStandGuard));
 }
 if(cls==='occultist'){
  const trap=r('OP01');if(trap){const duration=1+Math.floor(trap/3),reentry=1-(1-s.trapReentry)**duration;offense*=1+s.missRate*reentry*t('OP01').trapDamage;}
  offense*=1+s.summonShare*s.markUptime*t('OP02').markedSummonDamage;
  mobility*=1+s.summonShare*s.markUptime*t('OP02').markedPriority/1800;
  survival/=1-s.summonAvailable*(t('OP03').soulShareThreshold?s.largeHitShare:1)*Math.min(t('OP03').soulShare,t('OP03').soulShareCap/s.hitHpFraction);
  if(r('OP04')){const expiries=s.turns/5*s.naturalExpiry;budget+=stats.mp*expiries*t('OP04').expiryRecovery;budget+=s.castCost*expiries*t('OP04').expiryDiscount;}
  offense*=1+s.soulShare*s.empoweredCast*t('OP05').remnantDamage;
 }
 return {offense,survival,sustain:budget/Math.max(1,cost),mobility};
}
/** Weighted geometric response, not a sum of damage% and HP%. Role weights are explicit assumptions. */
export function spMarginal(before:SpAxes,after:SpAxes,weights:SpAxes){
 const ratio={} as SpAxes;let logUtility=0;
 for(const axis of ['offense','survival','sustain','mobility'] as const){ratio[axis]=after[axis]/before[axis]-1;logUtility+=weights[axis]*Math.log(after[axis]/before[axis]);}
 return {axes:ratio,utility:Math.expm1(logUtility)};
}
/** New active-skill audit metadata, separated from frozen legacy runtime damage calibration. */
export const SP_ACTIVE_AUDIT={
 legacyRuntimeModel:'balanceModel.ts: retained for legacy skills and the 16 current Sodan actives',
 redesignedDamageFactor:1,
 sodanUnmodeledModes:['curseManifest','curseEnthrall','curseEarth','summonEater','summonEcho','spiritConverge'],
 note:'Do not treat legacy scoreSkill as a full contemporary ranking. Summon actions, control and O16 capstone are not fully priced there.',
};

/** Coverage, not a substitute numerical damage normalizer. Missing utility must not masquerade as zero. */
export function currentActiveSpAudit(){
 const mechanics:Record<string,string>={
  curseManifest:'area existence/reveal change; inspect MANIFEST_TURNS',
  curseEnthrall:'converted actor actions and power; inspect ENTHRALL_ACTIONS/POWER',
  curseEarth:'timed binding damage plus on-death anchored spirit',
  summonEater:'one-time enemy capture; 2–4 round denial and per-target ally-damage copying capped by remaining prison HP; inspect tests/two-skill-balance-contracts.mjs',
  waveBounce:'terrain-conditioned branching contacts with generation decay; inspect tests/two-skill-balance-contracts.mjs',
  summonEcho:'extra owner-cast echoes; inspect ECHO_LIMIT/POWER/TURNS',
  spiritConverge:'capstone convergence contacts; 10 + floor(rank/2) spirits',
 };
 return Object.values(SKILLS).filter(s=>!s.passive&&!s.enemyOnly&&!s.ultimate).map(s=>({
  id:s.id,authoredTier:s.basic?0:(TALENT_MAP[s.id]?.row??0)+1,
  runtimeFactor:skillScoreBreakdown(s).factor,legacy:skillScoreBreakdown(s),
  coverage:s.redesigned?'authored-redesign':mechanics[s.mode]?'missing-legacy-utility':'legacy-estimate',
  unpricedMechanic:mechanics[s.mode]||null,
 }));
}
