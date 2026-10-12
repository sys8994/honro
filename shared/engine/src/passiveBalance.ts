/** Shared authored SP coefficients. Runtime, tooltips and the marginal audit read these values. */
export const HERO_ARMOR_CAP = .70;
export const passiveRankValue=(rank:number)=>Math.max(0,Math.min(8,Math.floor(rank)));
/** SP02 keeps its strong first three ranks; later ranks retain half their growth. */
export function durabilityPower(rank:number){const r=passiveRankValue(rank);return Math.min(r,3)+Math.max(0,r-3)*.5;}
export function passiveTuning(rank:number){
 const r=passiveRankValue(rank);
 return {
  gourdSecondary:.09*r, geometry:.06*r,
  missRefund:r?.18+.08*(r-1):0,
  ward:r?.025+.020*r:0, wardCap:.25,
  criticalChance:.04*r, criticalMultiplier:.08*r,
  trajectory:.085*r,
  swordCharge:.060*r, swordReach:.018*r, rushDamage:.060*r, bladeGeometry:.040*r,
  harmonyRecovery:r?.05+.0125*r:0, harmonyDiscount:r?.23+.02*r:0,
  harmonyDamage:r?.10+.05*r:0, harmonyGuard:r?.08+.02*r:0,
  markedSummonDamage:.07*r, markedPriority:r?170+35*r:0,
  soulShare:.04*r, soulShareCap:.12,
  remnantDamage:r?.12+.05*r:0,
 };
}
