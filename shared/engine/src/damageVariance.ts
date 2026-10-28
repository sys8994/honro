import {equipmentDamageRoll} from './equipment';
import type {Battle,Skill,Side,Unit} from './types';

/** Explicit cast policy, including non-damaging skills. No character-wide tuning. */
export const DAMAGE_SPREAD:Readonly<Record<string,number>>={
 A01:.05,A02:.05,A03:.10,A04:.10,A05:.10,A06:.05,A07:.10,A08:.10,
 A09:.05,A10:0,A11:.10,A12:.10,A13:.10,A14:.05,A15:.10,A99:.05,
 M01:.10,M02:.15,M03:.10,M04:.15,M05:.15,M06:.15,M07:.10,M08:.10,
 M09:0,M10:0,M11:.10,M12:.10,M13:.15,M14:.10,M15:.10,M99:.10,
 S00:.05,S01:.10,S02:.05,S03:.10,S04:.15,S05:.10,S06:.10,S07:.10,
 S08:.05,S09:.05,S10:.10,S11:.05,S12:.10,S13:.10,S14:.15,S15:.10,
 O01:.10,O02:.15,O03:.15,O04:.05,O05:.15,O06:.10,O07:.10,O08:.10,
 O09:.10,O10:.15,O11:.10,O12:.10,O13:0,O14:0,O15:0,O16:.15
};
export const DAMAGE_BUFFER_SIZE=1024;
export interface DamageSequence {version:1;seed:number;index:number;}
/** Optional snapshot for new casts. Legacy projectiles keep their stored behavior. */
export interface EquipmentAttack {version:1;items:string[];airborne:boolean;jumped?:boolean;lowFocus:boolean;rootDamage:number;skillDamage:number;vector?:{form:number;qi:number;soul:number};bounced?:boolean;dropBonus?:number;finishUsed?:boolean;passedAlly?:string;pushMarked?:boolean;focusTarget?:string;travelX?:number;travelY?:number;travelMax?:number;returning?:boolean;groundLeft?:number;}
export interface EquipmentUnitState {version:1;jumpCycle?:number;healCycle?:number;guardCycle?:number;anchorCycle?:number;counterCycle?:number;loanUsed?:boolean;regenHalf?:boolean;movePenalty?:boolean;landingRetreat?:number;echoUsed?:boolean;guardImpact?:{owner:string;shot:number;scale:number};wallSlow?:{owner:string;until:number};weak?:{owner:string;expires:number;spread:boolean;used:boolean};motion?:{points:{x:number;y:number}[];cursor:number;};}
export interface DamageOrigin {equipment?:EquipmentAttack;damageRoll?:number;attackSide?:Side;friendlyFireApplied?:boolean;}
const buffers=new WeakMap<DamageSequence,{chunk:number;values:Float64Array}>();
function hash(n:number){n=Math.imul(n^(n>>>16),0x21f0aaad);n=Math.imul(n^(n>>>15),0x735a2d97);return(n^(n>>>15))>>>0;}
/** Reconstruct only the current chunk. Saves contain 3 scalars, never the buffer.
 * Antithetic pairs make every full chunk's mean exactly zero; shuffle hides pairs.
 * Each new chunk is keyed by its absolute number, rather than repeating a ring. */
function buffer(state:DamageSequence){
 const chunk=Math.floor(state.index/DAMAGE_BUFFER_SIZE),cached=buffers.get(state);if(cached?.chunk===chunk)return cached.values;
 let seed=hash(state.seed^hash(chunk>>>0)^hash(Math.floor(chunk/4294967296)))||0x9e3779b9;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
 const values=new Float64Array(DAMAGE_BUFFER_SIZE);
 for(let i=0;i<DAMAGE_BUFFER_SIZE;i+=2){const value=random()*2-1;values[i]=value;values[i+1]=-value;}
 for(let i=values.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
 buffers.set(state,{chunk,values});return values;
}
export function initializeDamageSequence(b:Battle){
 // Isolated compatibility boundary: old attacks have no damageRoll and remain 1.
 // Never infer/re-roll an existing projectile, volley, status, guard or summon.
 b.damageSequence??={version:1,seed:hash(b.seed^0xd4a6e001),index:0};buffer(b.damageSequence);
 return b.damageSequence;
}
export function damageSpread(s:Pick<Skill,'id'|'enemyOnly'|'passive'>){return s.passive?0:s.enemyOnly ? .10 : DAMAGE_SPREAD[s.id]??0;}
export function rollDamage(b:Battle,s:Pick<Skill,'id'|'enemyOnly'|'passive'>,u?:Unit){
 const spread=damageSpread(s);if(!spread)return 1;
 const state=initializeDamageSequence(b),value=buffer(state)[state.index%DAMAGE_BUFFER_SIZE];state.index++;
 return equipmentDamageRoll(u,spread,value);
}
