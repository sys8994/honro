import type {Battle,Unit,Projectile,ExistenceVector} from './types';
import {existenceMultiplier} from './existence';
// Optional runtime adapter: core/practice/preview consumers have no XP policy.
const policy=()=> (globalThis as any).HonroProgression;
export const ownerRegistered=(b:Battle,u:Unit)=>policy()?.registerOwner(b,u);
export const healed=(b:Battle,u:Unit,owner:string,before:number)=>policy()?.recordHeal(b,u,owner,Math.max(0,u.hp-before));
export const shielded=(b:Battle,u:Unit,owner:string,before:number)=>policy()?.shieldAdded(b,u,owner,before);
export const settled=(e:any)=>policy()?.flushContribution(e);
export const controlled=(b:Battle,u:Unit,owner:string,token:string)=>policy()?.recordControl(b,u,owner,token);
export function projectileCredit(b:Battle,p:Projectile,u:Unit){ownerRegistered(b,u);const q=p as any,v=u as any;q.honroContributionOwner=u.summonOwner||u.enthrall?.owner||u.id;if(u.curseAttack){q.honroWeakOwner=v.honroWeakOwner||u.curseOwner;q.honroWeakFactor=u.curseAttack;}}
interface Receipt {hp:number;shield:number;final:number;beforeDefense:number;assists:Record<string,number>;protections:Record<string,number>;enemy?:Unit;owner:string;}
export function beginHit(b:Battle,u:Unit,raw:Unit|undefined,src:Unit|undefined,p:Projectile|undefined,attack:ExistenceVector|undefined,origin:string,uncapped:number,final:number,defense:number,armor:number,armorWithoutSupport:number,limit:number,normal:boolean):Receipt{
 const v=u as any,q=p as any,r=raw as any,protections:Record<string,number>={},assists:Record<string,number>={},hp=u.hp,shield=u.shield,owner=q?.honroContributionOwner||raw?.summonOwner||raw?.enthrall?.owner||raw?.id||origin;
 const rounded=(n:number)=>Math.max(0,Math.round(Math.min(limit,n)));
 if(normal&&u.side===1&&src?.side===0){
  const actualExistence=attack?existenceMultiplier(attack,u,raw||src):1,without={...u,manifested:v.honroManifestOwner?false:u.manifested} as Unit;
  const provider=(raw as any)?.honroSoulAffinityOwner,withoutSrc=provider?{...(raw||src),soulAffinityBonus:0}:raw||src;
  const basicExistence=attack?existenceMultiplier(attack,without,withoutSrc):1;
  const armorRatio=v.honroArmorOwner?(1-Math.min(.7,Math.max(0,armorWithoutSupport)*(p?.skill==='S02'?.65:1)))/Math.max(.01,1-Math.min(.7,Math.max(0,armor)*(p?.skill==='S02'?.65:1))):1;
  const base=rounded(uncapped*armorRatio*basicExistence/Math.max(.01,actualExistence));
  const benefit=Math.max(0,Math.min(hp,Math.max(0,final-shield))-Math.min(hp,Math.max(0,base-shield)));
  const weights:Record<string,number>={};
  const add=(id:string|undefined,n:number)=>{if(id&&n>0)weights[id]=(weights[id]||0)+n;};
  add(v.honroArmorOwner,Math.max(0,1-armorRatio));
  add(v.honroManifestOwner,u.manifested?(u.formDamageTakenBonus||0)*(attack?.form||0):0);
  add(provider,Math.max(0,(raw?.soulAffinityBonus||0)*(attack?.soul||0)));
  const sum=Object.values(weights).reduce((a,n)=>a+n,0);for(const[id,n]of Object.entries(weights))assists[id]=benefit*n/Math.max(.001,sum);
 }
 let beforeDefense=final;
 if(normal&&raw?.side===1&&u.side!==1){
  const weak=q?.honroWeakFactor??raw.curseAttack??0,weakOwner=q?.honroWeakOwner||r.honroWeakOwner||raw.curseOwner;
  const screen=q?.honroScreenProtection||{},screenSum=Object.values(screen as Record<string,number>).reduce((a,n)=>a+n,0),screenRatio=1+screenSum;
  const currentExistence=attack?existenceMultiplier(attack,u,raw):1,unwardedExistence=attack?existenceMultiplier(attack,{...u,soulDefenseBonus:0},raw):1,soulRatio=unwardedExistence/Math.max(.01,currentExistence);
  beforeDefense=rounded(uncapped/Math.max(.01,defense)/Math.max(.01,1-weak)*screenRatio*soulRatio);
  const add=(id:string|undefined,n:number)=>{if(id&&n>0)protections[id]=(protections[id]||0)+n;};
  add(u.id,Math.max(0,final/Math.max(.01,1-Math.min(.7,Math.max(0,armor)))-final));
  if(u.martialGuard&&u.martialGuard.round>=b.round)add(u.id,final/Math.max(.01,1-u.martialGuard.reduction)-final);
  if(u.arrivalGuard!==undefined)add(v.honroArrivalGuardOwner||u.id,final/.9-final);
  add(v.honroSoulDefenseOwner,Math.max(0,final*(soulRatio-1)));
  add(weakOwner,final/Math.max(.01,1-weak)-final);
  for(const[id,n]of Object.entries(screen as Record<string,number>))add(id,final*n);
  // Approximate raw-layer weights only divide the exact finite HP prevention.
 }
 return {hp,shield,final,beforeDefense,assists,protections,enemy:raw?.side===1?raw:undefined,owner};
}
export function endHit(b:Battle,u:Unit,receipt:Receipt){const P=policy();if(!P?.isContributionBattle(b))return;
 const actual=Math.max(0,receipt.hp-u.hp),benefit=Object.values(receipt.assists).reduce((a,n)=>a+n,0),scale=benefit>actual?actual/benefit:1;
 for(const id of Object.keys(receipt.assists))receipt.assists[id]*=scale;
 P.recordDamage(b,u,receipt.owner,actual,receipt.assists);
 const absorbed=Math.max(0,receipt.shield-u.shield),shields=P.shieldConsumed(b,u,receipt.shield,absorbed),raw={...receipt.protections};for(const[id,n]of Object.entries(shields as Record<string,number>))raw[id]=(raw[id]||0)+n;
 const threat=Math.min(receipt.hp,receipt.beforeDefense),prevented=Math.max(0,threat-actual);if(prevented>0&&!Object.values(raw).some(n=>n>0)&&u.side===0&&!u.summoned)raw[u.id]=prevented;const sum=Object.values(raw).reduce((a,n)=>a+n,0),protections:Record<string,number>={};
 for(const[id,n]of Object.entries(raw))protections[id]=sum?prevented*n/sum:0;
 P.recordThreat(b,receipt.enemy,u,receipt.hp,actual,protections);
}
/** Verified hostile missile removal is a small utility contribution, not
 * an assertion about hypothetical HP damage. It shares the finite support cap. */
export function intercepted(e:any,p:Projectile,provider:string){
 const P=policy(),enemy=e.unit(p.owner);if(!P?.isContributionBattle(e.b)||p.side!==1||p.body||p.damage<=0||!enemy||enemy.side!==1)return;
 P.recordBlock(e.b,enemy,provider,`${p.owner}:${p.shot}`,p.damage);
}
