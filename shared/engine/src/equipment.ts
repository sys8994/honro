import type {ClassId,Unit,Skill,Projectile,ExistenceVector} from './types';
import {EQUIPMENT_ITEMS,EQUIPMENT_EFFECTS,EQUIPMENT_EVENTS,EQUIPMENT_CHOICES,EQUIPMENT_DEFINITION_REVISION} from './equipmentData';
export {EQUIPMENT_ITEMS,EQUIPMENT_EFFECTS,EQUIPMENT_EVENTS,EQUIPMENT_CHOICES,EQUIPMENT_DEFINITION_REVISION};
export const EQUIPMENT_MAP=Object.fromEntries(EQUIPMENT_ITEMS.map(i=>[i.itemId,i]));
export const EQUIPMENT_EFFECT_MAP=Object.fromEntries(EQUIPMENT_EFFECTS.map(e=>[e.effectId,e]));
export function validateEquipmentIds(value:unknown,cls:ClassId):string[]{
 if(!Array.isArray(value)||value.length>2||value.some(id=>typeof id!=='string'||!EQUIPMENT_MAP[id]))throw Error('Unknown equipment snapshot');
 const slots=new Set<string>();
 for(const id of value){const item=EQUIPMENT_MAP[id];if(slots.has(item.slot)||item.characterClass&&item.characterClass!==cls)throw Error('Equipment slot/class mismatch');slots.add(item.slot);}
 return [...value];
}
export function equipmentActor(u:Unit|undefined|null){const v=u as Unit&{honroAlly?:boolean;honroCivilian?:boolean};return !!v&&v.side===0&&!v.summoned&&!v.enthrall&&!v.honroAlly&&!v.honroCivilian;}
export function equipmentOptions(ids:readonly string[]=[],cls:ClassId){
 const sums:Record<string,number>={},slots=new Set<string>();
 for(const id of ids){const item=EQUIPMENT_MAP[id];if(!item||slots.has(item.slot)||item.characterClass&&item.characterClass!==cls)continue;slots.add(item.slot);for(const o of item.basicOptions)sums[o.key]=(sums[o.key]||0)+o.value;}
 return sums;
}
export function equipmentEffect(u:Unit|undefined|null,id:string){
 if(!equipmentActor(u))return undefined;
 const item=(u!.equipmentIds||[]).map(key=>EQUIPMENT_MAP[key]).find(i=>i&&(!i.characterClass||i.characterClass===u!.cls)&&i.effectId===id);
 return item?EQUIPMENT_EFFECT_MAP[id]:undefined;
}
export function equipmentParam(u:Unit|undefined|null,id:string,key:string,fallback:number){const value=(equipmentEffect(u,id)?.params as Record<string,number>|undefined)?.[key];return typeof value==='number'?value:fallback;}
export function equipmentStats<T extends {hp:number;mp:number;attack:number;move:number;armor:number;critChance:number;critMultiplier:number;regen:number}>(base:T,ids:readonly string[],cls:ClassId):T{
 const b=equipmentOptions(ids,cls);
 return {...base,hp:Math.round(base.hp*(1+(b.hp||0)/100)),mp:Math.round(base.mp*(1+(b.mp||0)/100)),attack:base.attack*(1+(b.attack||0)/100),move:Math.round(base.move*(1+(b.move||0)/100)),armor:Math.min(.7,base.armor+(b.armor||0)/100),critChance:Math.min(.75,base.critChance+(b.crit||0)/100),critMultiplier:Math.min(3.5,base.critMultiplier+(b.critMult||0)),regen:base.regen+(b.regen||0)};
}
export function equipmentManaCost(u:Unit,s:Pick<Skill,'id'>,native:number){
 if(!native||!equipmentActor(u))return native;
 let discount=(equipmentOptions(u.equipmentIds,u.cls).cost||0)/100,surcharge=0;
 if(EQUIPMENT_EFFECT_MAP.hw_blade.targetSkills.includes(s.id))discount+=equipmentParam(u,'hw_blade','manaDiscount',0);
 if(native>=40)discount+=equipmentParam(u,'co_costly','manaDiscount',0);
 if(u.maxFocus>0&&u.focus/u.maxFocus<=.25)discount+=equipmentParam(u,'co_low_mp','manaDiscount',0);
 if(s.id==='O16')surcharge=equipmentParam(u,'so_converge','manaSurcharge',0);
 return native*(1-Math.min(.30,Math.max(0,discount)))*(1+surcharge);
}
export function equipmentCast(u:Unit,id:string){
 let damage=1,radius=1;
 if(equipmentActor(u))for(const key of ['da_sky','da_arc','hw_blade','so_basic','so_converge']){const effect=equipmentEffect(u,key);if(!effect?.targetSkills.includes(id))continue;const p=effect.params as unknown as Record<string,number>;damage*=p.damageScale||1;radius*=p.radiusScale||1;}
 return {damage,radius};
}
export function equipmentPrimary(u:Unit|undefined,origin:Partial<Projectile>|undefined,source='normal'){
 return equipmentActor(u)&&source==='normal'&&!origin?.autonomous&&!origin?.child&&!origin?.secondary&&!(origin as any)?.keeperReturned;
}
export function equipmentSoulVector(u:Unit,attack:ExistenceVector):ExistenceVector{
 const fraction=equipmentParam(u,'co_soul','soulConversion',0);return fraction?{form:attack.form*(1-fraction),qi:attack.qi*(1-fraction),soul:attack.soul+(attack.form+attack.qi)*fraction}:{...attack};
}
export function equipmentDamageRoll(u:Unit|undefined,spread:number,sample:number){
 if(!u||!equipmentActor(u)||!spread)return 1+sample*spread;
 if(equipmentEffect(u,'co_wild'))return 1.03+sample*.25;
 return 1+sample*spread*(equipmentEffect(u,'co_stable')?.5:1);
}
