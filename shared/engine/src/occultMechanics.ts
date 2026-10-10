import type {Engine} from './engine';
import type {Projectile,Skill,Unit,Vec} from './types';
import {clamp,segRect} from './math';
import {ECHO_POWER} from './occultData';

export const SOUL_SKILLS=new Set(['O01','O02','O03','O04','O05','O16']);
export const CHARM_SKILLS=new Set(['O06','O07','O08','O09','O10']);
export const SUMMON_SKILLS=new Set(['O11','O12','O13','O14','O15']);
export function spiritVisibleTo(viewer:Unit,target:Unit){return !target.spiritHidden||!!viewer.spiritSight||!!target.revealSpiritToParty;}

/** All origins aim at a world point frozen when Sodan casts, not at the same angle. */
export function echoAim(e:Engine,origin:Unit,s:Skill,point:Vec,preferredPower:number){
 const ghost={...origin,ranks:{...origin.ranks,[s.id]:origin.ranks[s.id]||1}};
 const proxy={...origin,x:point.x,y:point.y,h:0,r:2};
 const seeds=e.shotSeeds(ghost,s,proxy,1);
 if(seeds.length)return seeds.sort((a,b)=>Math.abs(a.power-preferredPower)-Math.abs(b.power-preferredPower))[0];
 const dx=point.x-origin.x,dy=point.y-(origin.y-origin.h*.63);
 let angle=Math.atan2(-dy,dx)*180/Math.PI;if(angle< -90)angle+=360;
 return {angle:clamp(angle,-85,265),power:clamp(preferredPower,.08,1)};
}

export function beginOccultCast(e:Engine,u:Unit,s:Skill,roots:Projectile[]){
 if(u.side!==0||u.summoned||!s.id.startsWith('O')||s.enemyOnly)return;
 const soul=SOUL_SKILLS.has(s.id),summon=SUMMON_SKILLS.has(s.id);
 const empowered=(u.soulRemnants||0)>=3;
 if(empowered){u.soulRemnants=0;e.fx('spark',u.x,u.y-u.h*.6,'#d8cfaa',34);}
 if(summon)u.nextSummonDiscount=0;
 for(const p of roots){p.soulBoost=empowered;if(empowered&&soul)p.damage*=1+.12+.02*(u.ranks.OP05||0);}
 if(!soul)return;
 const prediction=e.predict(u,s,u.angle,u.lastPower,undefined,true);
 const point={x:prediction.x,y:prediction.y};
 for(const p of roots){p.targetPoint={...point};if(prediction.unit)p.targetId=prediction.unit;}
 const echoes=e.b.units.filter(v=>!v.dead&&v.summonKind==='echo'&&v.summonOwner===u.id&&(v.summonExpires??0)>=e.b.round);
 for(const [i,echo] of echoes.entries()){
  const rank=clamp(echo.summonRank||1,1,8),aim=echoAim(e,echo,s,point,u.lastPower),o=e.origin(echo,aim.angle),v=e.velocity(echo,s,aim.angle,aim.power);
  for(const root of roots){const copy:Projectile={...root,id:e.b.nextId++,x:o.x,y:o.y,vx:v.vx,vy:v.vy,prevVy:v.vy,launchX:o.x,launchY:o.y,returnX:echo.x,returnY:echo.y,damage:root.damage*ECHO_POWER[rank-1],age:0,hit:[...root.hit,echo.id],trail:[o],child:false,echoUsed:true,echoSource:echo.id,echoDelay:.075*(i+1),targetPoint:{...point},targetId:prediction.unit,shot:root.shot};e.b.projectiles.push(copy);}
 }
}

export function convergenceCurve(start:Vec,goal:Vec,seed:number,index:number,count:number):NonNullable<Projectile['curve']>{
 const angle=index*Math.PI*2/count+seed*.23,reach=225+(index%4)*27;
 // Souls fan out around the medium without burrowing under the ground at her feet.
 const vertical=Math.sin(angle)*reach;
 const spread={x:start.x+Math.cos(angle)*reach,y:start.y+vertical*(vertical>0?.1:.78)};
 const bend=((index%2)*2-1)*(95+(index%3)*26);
 const control={x:(spread.x+goal.x)*.55-Math.sin(angle)*bend,y:Math.min(start.y+28,(spread.y+goal.y)*.55+Math.cos(angle)*bend)};
 return {start,spread,control,goal,duration:1.26+(index%3)*.08,delay:index*.07,outwardRatio:.4};
}
export function convergencePoint(c:NonNullable<Projectile['curve']>,age:number):Vec{
 const t=clamp((age-(c.delay||0))/c.duration,0,1);
 // Curves already in an old save keep their original single cubic trajectory.
 if(c.outwardRatio===undefined){const v=1-t;return{x:v*v*v*c.start.x+3*v*v*t*c.spread.x+3*v*t*t*c.control.x+t*t*t*c.goal.x,y:v*v*v*c.start.y+3*v*v*t*c.spread.y+3*v*t*t*c.control.y+t*t*t*c.goal.y};}
 if(t<c.outwardRatio){const phase=t/c.outwardRatio,ease=phase*phase*(3-2*phase);return{x:c.start.x+(c.spread.x-c.start.x)*ease,y:c.start.y+(c.spread.y-c.start.y)*ease};}
 const phase=(t-c.outwardRatio)/(1-c.outwardRatio),ease=phase*phase*(3-2*phase),v=1-ease;
 return{x:v*v*c.spread.x+2*v*ease*c.control.x+ease*ease*c.goal.x,y:v*v*c.spread.y+2*v*ease*c.control.y+ease*ease*c.goal.y};
}
/** The representative alone is predicted. Curve parameters are fixed once on impact. */
export function convergeAt(e:Engine,p:Projectile){
 const goal={x:p.x,y:p.y},start={x:p.returnX,y:p.returnY-48},rank=clamp(p.skillRank||1,1,8),count=10+Math.floor(rank/2);
 for(let i=0;i<count;i++){
  const c:Projectile={...p,id:e.b.nextId++,mode:'convergeSpirit',x:start.x,y:start.y,vx:0,vy:0,prevVy:0,age:0,radius:6,damage:p.damage*.22,blast:38,phaseMode:'all',gravityScale:0,wind:0,hit:[],trail:[start],child:true,echoUsed:true,color:'#bea9cf',curve:convergenceCurve(start,goal,p.id,i,count)};
  e.b.projectiles.push(c);
 }
 e.fx('ring',goal.x,goal.y,'#bec4ae',55);e.remove(p);
 e.emit('sound',{name:'spiritSummon'});
}
export function stepConvergingSpirit(e:Engine,p:Projectile,dt:number){
 const c=p.curve;if(!c){e.remove(p);return;}
 if(p.age<(c.delay||0))return;
 const t=clamp((p.age-(c.delay||0))/c.duration,0,1),next=convergencePoint(c,p.age);
 const old={x:p.x,y:p.y};p.vx=(next.x-old.x)/Math.max(dt,.001);p.vy=(next.y-old.y)/Math.max(dt,.001);p.x=next.x;p.y=next.y;
 for(const u of e.b.units)if(!u.dead&&u.id!==p.owner&&u.id!==p.echoSource&&!p.hit.includes(u.id)){
  const h=segRect(old,next,u.x-u.r,u.y-u.h,u.r*2,u.h,p.radius);
  if(h){p.hit.push(u.id);e.hurt(u,p.damage,p.owner,true,p,next);}
 }
 if(p.age===dt||Math.floor(p.age*20)!==Math.floor((p.age-dt)*20)){p.trail.push(next);if(p.trail.length>14)p.trail.shift();}
 if(t>=1){for(const u of e.b.units)if(!u.dead&&Math.hypot(u.x-c.goal.x,u.y-u.h*.5-c.goal.y)<p.blast+u.r)e.hurt(u,p.damage*.55,p.owner,false,p,c.goal);e.remove(p);}
}
