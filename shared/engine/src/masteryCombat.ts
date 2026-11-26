import type { Engine } from './engine';
import type { Unit, Projectile, Vec } from './types';
import { MASTERY_COLORS, MASTERY_RULES } from './masteryData';
import { SKILLS } from './data';

export function mastered(e: Engine, actor: Unit | undefined, id: string) {
 return !!actor&&actor.side===0&&!actor.summoned&&!actor.enthrall&&
  !(actor as any).honroAlly&&!(actor as any).honroCivilian&&!e.masterySuppressed&&
  SKILLS[id]?.cls===actor.cls&&e.b.heroes[actor.cls]?.masteries?.includes(id)===true;
}
export function masteryEffect(e: Engine, id: string, at: Vec, size=48, end?:Vec) {
 const rule=MASTERY_RULES[id],skill=SKILLS[id];if(!rule||!skill)return;
 e.emit('fx',{name:'mastery:'+rule[0],x:at.x,y:at.y,x2:end?.x,y2:end?.y,color:MASTERY_COLORS[skill.cls],size,text:id});
}
export const center=(u:Unit):Vec=>({x:u.x,y:u.y-u.h*.5});
export function masteryOnce(e:Engine, id:string, token:string) {
 const key='mastery:'+id+':'+token;const seen=e.b.shotDamage??={};
 if(seen[key])return false;seen[key]=1;return true;
}
export function masteryEcho(e:Engine,p:Projectile,id:string,origin:Vec,range:number,fraction:number,excluded:string[],limit=1) {
 const owner=e.unit(p.owner);
 if(!owner||!e.b.units.includes(owner))return;
 const candidates=e.b.units.filter(t=>!excluded.includes(t.id)&&e.guidanceTarget(owner,t)&&
   Math.hypot(t.x-origin.x,t.y-t.h*.5-origin.y)<=range+t.r&&
   !e.projectileCollision(origin,center(t),1,owner.id,[],false));
 candidates.sort((a,b)=>Math.hypot(a.x-origin.x,a.y-a.h*.5-origin.y)-Math.hypot(b.x-origin.x,b.y-b.h*.5-origin.y));
 for(const t of candidates.slice(0,limit)){
  masteryEffect(e,id,origin,range,center(t));
  const echo={...p,mastery:false,masteryEcho:true,secondary:false,autonomous:true};
  e.hurt(t,p.damage*fraction,p.owner,false,echo,origin);
 }
}

export function masteryHit(e:Engine,actor:Unit|undefined,target:Unit,amount:number,id:string,direct:boolean,critical:boolean,p?:Projectile,point?:Vec){
 if(!actor||p?.masteryEcho||actor.id===target.id||actor.side===target.side)return amount;
 const impact=point??center(target),travel=Math.abs(impact.x-(p?.launchX??actor.x));
 let bonus=0;
 if(p?.mastery&&!p.followup){
  switch(id){
   case 'A01': if(direct&&(p.masteryPower??0)>=.98)bonus=.5;break;
   case 'A14': if(critical&&travel>=1800)bonus=target.shield>0?1:.5;break;
   case 'A99': if(critical&&travel>=1200)bonus=.9;break;
   case 'A11': if(direct&&impact.y-(p.apexY??impact.y)>=450)bonus=.6;break;
   case 'A09': if(direct&&p.turned)bonus=.7;break;
   case 'A13': if(direct&&p.masteryReacquired)bonus=.7;break;
   case 'A12': if(direct&&p.returning)bonus=.8;break;
   case 'A04': if(direct&&p.masteryEdge)bonus=.6;break;
   case 'M01': if(direct)bonus=.4;break;
   case 'S01': if(direct&&Math.abs(target.x-p.x)<80){bonus=.8;actor.martialGuard={round:e.b.round,reduction:.3};}break;
   case 'S04': if(direct&&p.dived&&p.y-(p.apexY??p.y)>=280)bonus=.8;break;
   case 'S09': if(direct)bonus=.7;break;
   case 'S11': if(direct&&p.hit.some(other=>other!==target.id))bonus=.8;break;
   case 'O03': if(masteryOnce(e,'O03',target.id))bonus=.6;break;
   case 'O04': if(direct&&p.masteryCrossed)bonus=1;break;
   case 'O05': if(p.wraithBurst&&p.wraithMarked?.includes(target.id))bonus=.8;break;
  }
 }
 if(bonus)masteryEffect(e,id,impact,Math.min(140,Math.max(35,p?.blast||50)),p?.trail?.at(-3));
 if(p?.echoSource&&mastered(e,actor,'O15')){
  const prior=target.masterySoulHit;
  if(prior?.shot===p.shot&&Math.abs((p.launchX??p.x)-prior.x)>90&&masteryOnce(e,'O15',actor.id)){bonus+=.8;masteryEffect(e,'O15',impact,48,{x:p.launchX??p.x,y:p.launchY??p.y});}
 }else if(p&&id.startsWith('O')&&mastered(e,actor,'O15'))target.masterySoulHit={shot:p.shot,x:p.launchX??actor.x};
 if(p&&id.startsWith('A')){
  if(!p.followup&&direct&&mastered(e,actor,'AP04')&&((id==='A14'||id==='A99'||id==='A02'||id==='A06')?travel>=1440:
      SKILLS[id]?.branch==='drop'?impact.y-(p.apexY??impact.y)>=720:
      SKILLS[id]?.branch==='speed'&&Math.hypot(p.vx,p.vy)>=1020)){
   bonus+=.5;masteryEffect(e,'AP04',impact,46,center(actor));
  }
  if(direct&&!p.followup&&critical&&mastered(e,actor,'AP02')&&masteryOnce(e,'AP02',actor.id)){
   target.masteryExposure={id:'AP02',owner:actor.id,until:e.b.round,gain:.4};
   masteryEffect(e,'AP02',impact,42);
  }
  if(!p.followup&&direct&&mastered(e,actor,'AP01'))(target.masteryArrowHits??={})[actor.id]=p.shot;
  if(p.followup&&direct&&mastered(e,actor,'AP01')&&target.masteryArrowHits?.[actor.id]!==p.shot&&masteryOnce(e,'AP01',target.id)){
   bonus+=1;masteryEffect(e,'AP01',impact,44,center(actor));
  }
 }
 const exposure=target.masteryExposure;
 const source=p?e.unit(p.owner):actor;
 if(direct&&source&&!source.summoned&&!source.enthrall&&exposure&&exposure.owner!==actor.id&&actor.side===0&&exposure.until>=e.b.round){
  bonus+=exposure.gain;delete target.masteryExposure;masteryEffect(e,exposure.id,impact,44,center(actor));
 }
 if(direct&&mastered(e,actor,'MP03')&&actor.masteryRefund&&SKILLS[id]?.cls==='mage'){
  bonus+=.4;delete actor.masteryRefund;masteryEffect(e,'MP03',impact,42,center(actor));
 }
 return amount*(1+bonus);
}
