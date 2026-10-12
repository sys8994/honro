/** Shared authored SP coefficients. Runtime, tooltips and the marginal audit read these values. */
export const HERO_ARMOR_CAP = .70;
export const SP_BALANCE_REVISION = 1;
export const passiveRankValue=(rank:number)=>Math.max(0,Math.min(8,Math.floor(rank)));
/** SP02 keeps its strong first three ranks; later ranks retain half their growth. */
export function durabilityPower(rank:number){const r=passiveRankValue(rank);return Math.min(r,3)+Math.max(0,r-3)*.5;}
export function passiveTuning(rank:number){
 const r=passiveRankValue(rank);
 return {
  gourdSecondary:.09*r, geometry:.06*r,
  manaRegenFlat:.5*r, manaRegenMax:.005*r,
  volleyFirst:.42+.02*Math.min(4,Math.max(0,r-1))+.045*Math.max(0,r-5),
  retreat:r?.12+.06*(r-1):0,
  jucheonExtraEffect:.02*Math.max(0,r-1),
  trapDamage:r?.265+.080*(r-1):0,
  missRefund:r?.18+.08*(r-1):0,
  ward:r?.025+.020*r:0, wardCap:.25,
  criticalChance:.04*r, criticalMultiplier:.08*r,
  trajectory:.085*r,
  swordCharge:.060*r, swordReach:.018*r, rushDamage:.060*r, bladeGeometry:.040*r,
  harmonyRecovery:r?.05+.0125*r:0, harmonyDiscount:r?.23+.02*r:0,
  harmonyDamage:r?.10+.05*r:0, harmonyGuard:r?.08+.02*r:0,
  markedSummonDamage:.07*r, markedPriority:r?170+35*r:0,
  soulShare:.06*Math.min(4,r)+.045*Math.max(0,r-4), soulShareCap:r?.04+.02*r:0, soulShareThreshold:0,
  expiryRecovery:r?.058+.05*(r-1):0, expiryDiscount:r?.035+.055*(r-1):0,
  lastStandHp:r?.08+.08*(r-1):0, lastStandGuard:r?.18+.035*(r-1):0,
  remnantDamage:r?.14+.16*(r-1):0,
 };
}
