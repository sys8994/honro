/** Authored dimensions shared by hit detection, prediction, tooltips and stake guides. */
export const MAGE_AREA_SCALE=1.12;
const rankStep=(rank:number)=>Math.max(0,Math.min(7,rank-1));
export function waveArcDimensions(rank:number){const k=rankStep(rank);return {radius:150+5*k,span:60+8*k,thickness:(30+2*k)*MAGE_AREA_SCALE};}
export function shatterStakeDimensions(rank:number){const k=rankStep(rank);return {trigger:45+25*k/7,effect:95+30*k/7};}
