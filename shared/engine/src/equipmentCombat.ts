import type {Battle,Unit,Skill,Projectile,Terrain,Vec} from './types';
import type {EquipmentAttack,EquipmentUnitState,DamageOrigin} from './damageVariance';
import type {Engine,Collision,Prediction} from './engine';
import {equipmentActor,equipmentEffect,equipmentSkillModifier,EQUIPMENT_MAP} from './equipment';
import {attackForSkill} from './existence';
import {terrainRectIntersects,clamp,STEP} from './math';
import {validTerrainContactPose} from './locomotion';
export const gearState=(u:Unit):EquipmentUnitState=>u.equipmentState??=( {version:1} );
export const gearCycle=(b:Battle)=>b.round;
export function gearHas(p:DamageOrigin|undefined,id:string){return !!p?.equipment?.items.some(key=>EQUIPMENT_MAP[key]?.effectId===id);}
export function gearCapture(u:Unit,s:Skill,damage:number,grounded:boolean,cycle:number):EquipmentAttack|undefined{
 if(!equipmentActor(u))return;
 const air=!grounded||u.jumping||u.airborne,jumped=u.equipmentState?.jumpCycle===cycle,a=attackForSkill(s),vector=equipmentEffect(u,'co_soul')?(jumped?{form:a.form*.5,qi:a.qi*.5,soul:a.soul+(a.form+a.qi)*.5}:{form:a.form*.7,qi:a.qi+a.form*.3,soul:a.soul}):undefined;
 return{version:1,items:[...(u.equipmentIds||[])],airborne:air,jumped,lowFocus:u.maxFocus>0&&u.focus/u.maxFocus<=.4,rootDamage:damage,skillDamage:1+equipmentSkillModifier(u,s.id).damage,vector};
}
export function gearBody(p:Partial<Projectile>|undefined){return !!p&&!!p.skill&&typeof p.vx==='number'&&typeof p.vy==='number'&&!p.secondary&&!p.autonomous&&!p.followup&&!p.echoSource&&!(p.child&&p.mode!=='crescent')&&p.mode!=='stake'&&!(p as any).keeperReturned;}
export function gearLoan(u:Unit,cost:number){const missing=Math.max(0,cost-u.focus);return equipmentEffect(u,'co_costly')&&!u.equipmentState?.loanUsed&&cost>0&&missing>0&&missing<=u.maxFocus*.2+1e-8?missing:0;}
export function gearCanPay(u:Unit,cost:number){return u.focus>=cost||gearLoan(u,cost)>0;}
export function gearPay(u:Unit,cost:number){const loan=gearLoan(u,cost);if(loan){u.focus+=loan;const st=gearState(u);st.loanUsed=true;st.regenHalf=true;}u.focus=Math.max(0,u.focus-cost);}
export function gearTurn(u:Unit){const st=u.equipmentState;if(!st)return;delete st.jumpCycle; if(st.movePenalty){u.moveLeft*=.9;delete st.movePenalty;} }
export function gearRegen(u:Unit,regen:number){if(!u.equipmentState?.regenHalf)return regen;delete u.equipmentState.regenHalf;return regen*.5;}
export function gearEnemyBody(e:Engine,u:Unit,owner:string,p?:Partial<Projectile>){const src=e.unit(owner);return equipmentActor(u)&&!!src&&e.allegiance(src)===1&&!src.summoned&&!src.enthrall&&gearBody(p);}
/** Only an actual paid normal hit can consume protection. No preview mutates it. */
export function gearGuard(e:Engine,u:Unit,owner:string,p:Partial<Projectile>|undefined,hpDamage:number){
 if(!gearEnemyBody(e,u,owner,p))return hpDamage;
 if(!equipmentEffect(u,'co_low_mp')&&!equipmentEffect(u,'co_noncrit'))return hpDamage;
 const st=gearState(u);delete st.guardImpact;
 if(!equipmentEffect(u,'co_low_mp')||hpDamage<=0)return hpDamage;
 const cycle=gearCycle(e.b),cost=u.maxFocus*.05;if(st.guardCycle===cycle||u.focus+1e-8<cost)return hpDamage;
 u.focus-=cost;st.guardCycle=cycle;st.guardImpact={owner,shot:p?.shot??e.b.shot,scale:.25};e.fx('ring',u.x,u.y-u.h*.5,'#b9c9c3',30);return hpDamage*.85;
}
export function gearImpulse(e:Engine,u:Unit,vx:number,vy:number,p?:Partial<Projectile>){
 if(!gearEnemyBody(e,u,p?.owner||'',p))return{vx,vy};
 const st=gearState(u),cycle=gearCycle(e.b);
 if(equipmentEffect(u,'co_noncrit')&&st.anchorCycle!==cycle&&e.grounded(u)&&!u.jumping&&!u.airborne&&(Math.abs(vx)+Math.abs(vy)>0)){st.anchorCycle=cycle;st.movePenalty=true;st.guardImpact={owner:p!.owner!,shot:p?.shot??e.b.shot,scale:0};e.fx('spark',u.x,u.y-4,'#c6b898',24);return{vx:0,vy:0};}
 const receipt=st.guardImpact;if(receipt&&receipt.owner===p?.owner&&receipt.shot===(p?.shot??e.b.shot))return{vx:vx*receipt.scale,vy:vy*receipt.scale};
 return{vx,vy};
}
export function gearAlly(e:Engine,u:Unit,owner:Unit,p:Partial<Projectile>){
 if(u.dead||owner.dead||!gearBody(p)||!equipmentActor(owner)||!equipmentActor(u)||u.id===owner.id||e.allegiance(u)!==e.allegiance(owner))return false;
 if(gearHas(p,'co_cursed')&&u.hp<u.maxHp&&owner.hp>owner.maxHp*.2&&gearState(owner).healCycle!==gearCycle(e.b)){
  const amount=Math.min(u.maxHp*.15,u.maxHp-u.hp,(owner.hp-owner.maxHp*.2)*3);if(amount<=0)return false;
  owner.hp-=amount/3;u.hp+=amount;gearState(owner).healCycle=gearCycle(e.b);
  // System heal drains eligible wounds without minting healing contribution/XP.
  (globalThis as any).HonroProgression?.recordHeal(e.b,u,'',amount);
  (globalThis as any).HonroClearReport?.heal(e.b,u,owner.id,amount,p.skill);e.fx('ring',u.x,u.y-u.h*.5,'#b6c79f',34);e.fx('text',u.x,u.y-u.h-12,'#c5d5b0',14,'+'+Math.round(amount));return true;
 }
 return false;
}
export function gearDanger(e:Engine,u:Unit,x:number,y:number){
 if((u as any).honroAct4Recovering)return true;
 if(e.b.waters.some(w=>w.frozen<=0&&x+u.r>=w.x&&x-u.r<=w.x+w.w&&y>=w.y-4&&(w.kind==='lava'||w.depth>u.h*.4)))return true;
 const b=e.b as any,policies=b.honroAct4Design?.waterPolicies||[],live=b.honroAct4PreviewState?.tide?.surface;
 return policies.some((z:any)=>['recover','lethal'].includes(z.kind)&&x+u.r>z.x1&&x-u.r<z.x2&&y>Math.min(z.surface,Number.isFinite(live)?live:z.surface)-10);
}
/** A ground path is verified before it is animated; no endpoint teleport. */
export function gearGroundPath(e:Engine,u:Unit,dx:number){
 if(!Number.isFinite(dx)||Math.abs(dx)<2||!validTerrainContactPose(e.b.terrain,u))return [];
 const points:Vec[]=[{x:u.x,y:u.y}],steps=Math.ceil(Math.abs(dx)/6);let last=points[0];
 for(let n=1;n<=steps;n++){
  const x=u.x+dx*n/steps,floor=e.surface(x,last.y-8,last.y+10);if(!floor||Math.abs(floor.y-last.y)>10)return [];
  const pose={...u,x,y:floor.y};
  if(!validTerrainContactPose(e.b.terrain,pose)||e.b.units.some(t=>!t.dead&&!t.eaterCapturedBy&&t.id!==u.id&&Math.abs(t.x-x)<t.r+u.r&&Math.abs(t.y-floor.y)<Math.min(t.h,u.h)))return [];
  if(gearDanger(e,u,x,floor.y))return [];
  const wall=e.sweepBody(u,last,{x,y:floor.y});if(wall&&wall.n.y>=-.01)return [];
  points.push(last={x,y:floor.y});
 }
 return points;
}
export function gearMove(e:Engine,u:Unit,dx:number){const points=gearGroundPath(e,u,dx);if(points.length<2)return false;gearState(u).motion={points,cursor:0};u.vx=u.vy=0;delete u.moveTarget; e.emit('fx',{name:'inkLine',x:u.x,y:u.y-u.h*.5,x2:points.at(-1)!.x,y2:points.at(-1)!.y-u.h*.5,color:'#c5c2a8',size:1.8});return true;}
export function gearStepMove(e:Engine,u:Unit,dt:number){const st=u.equipmentState,m=st?.motion;if(!m)return false;if(u.dead){delete st!.motion;return false;}
 m.cursor=Math.min(m.points.length-1,m.cursor+dt*150);const at=m.points[Math.floor(m.cursor)];
 const pose={...u,x:at.x,y:at.y},wall=e.sweepBody(u,{x:u.x,y:u.y},at);
 if(wall&&wall.n.y>=-.01||gearDanger(e,u,at.x,at.y)||!validTerrainContactPose(e.b.terrain,pose)){delete st!.motion;return true;}
 u.x=at.x;u.y=at.y;u.vx=u.vy=0;u.airborne=u.jumping=false;u.moving=.1;
 if(m.cursor>=m.points.length-1)delete st!.motion;return true;
}
export function gearFrostSlow(e:Engine,u:Unit){if(u.side!==1||u.dead)return 0;for(const z of e.b.zones){if(!z.equipmentFrost||z.expires<e.b.round||!e.attackAllows(u,z.owner,z)||Math.hypot(u.x-z.x,u.y-u.h*.5-z.y)>z.radius+u.r)continue;if(!e.projectileCollision({x:z.x,y:z.y-3},{x:u.x,y:u.y-u.h*.5},1,z.owner,[],false))return .35;}return 0;}
export function gearAddFrost(e:Engine,p:Projectile){if(!gearHas(p,'da_heal')||!gearBody(p)||p.skill!=='M02')return;e.b.zones=e.b.zones.filter(z=>!z.equipmentFrost||z.owner!==p.owner);e.b.zones.push({id:e.b.nextId++,kind:'frost',equipmentFrost:true,x:p.x,y:p.y,radius:160,owner:p.owner,side:p.side,attackSide:p.attackSide,damage:0,expires:e.b.round});e.fx('ring',p.x,p.y,'#b1c9c7',160);}
export function gearWallContact(e:Engine,u:Unit,n:Vec){const st=u.equipmentState;if(!st?.wallSlow||Math.abs(n.x)<.65||n.y<-.35)return;if(st.wallSlow.until>=e.b.round&&!u.boss&&!u.honroMidboss&&!u.fixed){u.slowed={factor:Math.max(.35,u.slowed?.factor||0),expires:Math.max(e.b.round+1,u.slowed?.expires||0)};e.fx('text',u.x,u.y-u.h-12,'#c7c6a9',13,'벽에 걸림');}delete st.wallSlow;}
export function gearEarthMove(e:Engine,u:Unit,before:Vec){const anchor=u.earthbind?.equipmentPull;if(!anchor||anchor.used||u.earthbind!.until<e.b.round||Math.hypot(u.x-before.x,u.y-before.y)<.5)return;anchor.used=true;if(u.boss||u.honroMidboss||u.fixed)return;gearMove(e,u,clamp(anchor.x-u.x,-140,140));}
/** U26 reserved: current terrain tags do not identify all ordinary wood safely. */
export function gearPreservesWood(_e:Engine,_t:Terrain,_owner:string,_p?:Partial<Projectile>){return false;}
export function gearSpreadWeak(e:Engine,dead:Unit){
 const mark=dead.equipmentState?.weak;if(!mark||mark.used||mark.spread||mark.expires<e.b.round)return;
 mark.used=true;const owner=e.unit(mark.owner);if(!owner||owner.dead)return;
 const targets=e.b.units.filter(t=>!t.dead&&t.id!==dead.id&&t.side===1&&!t.boss&&!t.honroMidboss&&!t.honroObjectiveTarget&&!t.enthrall&&e.attackAllows(t,owner.id)&&Math.hypot(t.x-dead.x,t.y-dead.y)<=450).sort((a,b)=>Math.hypot(a.x-dead.x,a.y-dead.y)-Math.hypot(b.x-dead.x,b.y-dead.y)||a.id.localeCompare(b.id));
 const t=targets.find(t=>!e.projectileCollision({x:dead.x,y:dead.y-dead.h*.5},{x:t.x,y:t.y-t.h*.5},1,owner.id,[],false));if(!t)return;
 const turns=Math.max(1,Math.min(2,mark.expires-e.b.round+1));if(!(t.curseAttack||0))(t as any).honroWeakOwner=owner.id;if(!(t.curseArmor||0))(t as any).honroArmorOwner=owner.id;t.curseTurns=Math.max(t.curseTurns||0,turns);t.curseOwner=owner.id;t.curseAttack=Math.max(t.curseAttack||0,dead.curseAttack||0);t.curseArmor=Math.max(t.curseArmor||0,dead.curseArmor||0);gearState(t).weak={owner:owner.id,expires:e.b.round+turns-1,spread:true,used:true};e.fx('ring',t.x,t.y-t.h*.5,'#b9b9a0',40);
}
export function gearTravelSpent(p:Projectile){const a=p.equipment;return a?.travelMax!==undefined&&(a.travelled||0)>=a.travelMax;}

/** Secondary finish uses cover and keeps the cast's damage sample, never its primary on-hit effects. */
export function gearFinish(e:Engine,p:Projectile,exclude?:string){
 if(!gearHas(p,'se_pierce')||!gearBody(p)||p.equipment!.finishUsed)return;
 p.equipment!.finishUsed=true;const x=p.x,y=p.y,attack={...p,secondary:true,child:true,autonomous:true,directId:undefined};
 const targets=[...e.blastUnitTargets(x,y,120,p.owner,false,attack)].filter(({unit:t})=>t.id!==exclude&&!e.projectileCollision({x,y},{x:t.x,y:t.y-t.h*.5},1,p.owner,[],false));
 e.blast(x,y,120,p.equipment!.rootDamage*.45,p.owner,false,attack,0,undefined,targets);
}

export function gearReturn(e:Engine,p:Projectile,h:Collision){
 if(p.equipment?.returning){if(h.unit)e.hurt(h.unit,p.damage,p.owner,false,p,h);e.remove(p);return true;}
 if(p.skill!=='O01'||!h.terrain||!gearHas(p,'so_basic')||!gearBody(p))return false;
 const x=p.x+h.n.x*(p.radius+2),y=p.y+h.n.y*(p.radius+2),targets=[...e.blastUnitTargets(p.x,p.y,p.blast,p.owner,false,p)],hit=targets.map(t=>t.unit.id);
 e.blast(p.x,p.y,p.blast,p.damage,p.owner,false,p,0,undefined,targets);
 const dx=(p.launchX??p.returnX)-x,dy=(p.launchY??p.returnY)-y,n=Math.hypot(dx,dy)||1,gear=structuredClone(p.equipment!);
 gear.returning=true;gear.travelX=x;gear.travelY=y;gear.travelMax=Math.min(600,p.flightRange?.distance===undefined?600:Math.max(0,p.flightRange.distance-Math.hypot(p.x-p.flightRange.x,p.y-p.flightRange.y)));
 const q:Projectile={...p,equipment:gear,id:e.b.nextId++,mode:'arrow',x,y,vx:dx/n*850,vy:dy/n*850,prevVy:dy/n*850,damage:p.equipment!.rootDamage*.5,blast:0,radius:3,secondary:true,child:true,autonomous:true,hit,trail:[{x,y}],gravityScale:0,wind:0,drag:0,fuseAt:undefined,directId:undefined};e.remove(p);e.b.projectiles.push(q);return true;
}

export function gearLandingRetreat(e:Engine,u:Unit){const st=u.equipmentState;if(st?.landingRetreat===undefined)return;if(u.dead){delete st.landingRetreat;return;}if(!validTerrainContactPose(e.b.terrain,u))return;const dx=st.landingRetreat;delete st.landingRetreat;gearMove(e,u,dx);}

export function gearPass(e:Engine,u:Unit,p:Projectile){
 const owner=e.unit(p.owner);if(!gearHas(p,'co_friendly')||!gearBody(p)||!equipmentActor(u)||!equipmentActor(owner)||u.id===owner!.id||e.allegiance(u)!==e.allegiance(owner!))return false;
 const roots=[...e.b.projectiles,...(e.b.volley?[e.b.volley.template]:[])].filter(q=>q.owner===p.owner&&q.shot===p.shot&&q.equipment),chosen=p.equipment!.passedAlly||roots.find(q=>q.equipment!.passedAlly)?.equipment!.passedAlly;
 if(chosen&&chosen!==u.id)return false;
 for(const q of roots)q.equipment!.passedAlly=u.id;p.equipment!.passedAlly=u.id;if(!p.hit.includes(u.id))p.hit.push(u.id);return true;
}
