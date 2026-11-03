/** A1 opt-in enemy controls. Legacy battles/hero skills never enter this contract. */
import type {Engine} from './engine';
import type {Battle,Unit,Projectile,Vec} from './types';
import {SKILLS} from './data';
import {segmentTerrain,terrainRectIntersects} from './math';
import {sweepBodyTerrain,terrainSurface} from './locomotion';
export type EnemyEffectSkill='HSH02'|'HWD02';
export interface EnemyEffectCast {
 version:1;serial:number;skill:EnemyEffectSkill;target:string;origin:Vec;angle:number;power:number;impact:Vec;radius:number;direction:number;
 createdTeamEnd:number;seen:boolean;offered:boolean;responded:boolean;wind:number;sceneVersion:number;offeredIds:string[];respondedIds:string[];
}
export interface EnemyEffectAttack {id:string;sourceId:string;target:string;skill:EnemyEffectSkill;direction:number;}
export interface EnemySoftBind {sourceId:string;attackId:string;remainingActions:1;factor:number;appliedRound:number;started:boolean;withheld:number;}
export interface EnemyPush {sourceId:string;attackId:string;remaining:number;direction:number;}
const skillOK=(s:unknown):s is EnemyEffectSkill=>s==='HSH02'||s==='HWD02';
const live=(u?:Unit)=>!!u&&!u.dead&&u.hp>0&&!u.eaterCapturedBy;
const hero=(u?:Unit)=>live(u)&&u!.side===0&&!u!.summoned&&!u!.enthrall;
export function enemyEffectEligible(b:Battle,u:Unit,skill:string){return b.honroMonsterEffectsRevision===1&&u.side===1&&live(u)&&skillOK(skill)&&u.honroMonsterEffectSkill===skill;}
export function releaseEnemySoftBind(u:Unit,grace=1){const bind=u.enemySoftBind;if(!bind)return;if(!u.acted&&bind.started)u.moveLeft=Math.min(u.maxMove*(u.bound>0?.45:1),u.moveLeft+bind.withheld);delete u.enemySoftBind;u.enemyControlGrace=Math.max(u.enemyControlGrace||0,grace);}
export function clearEnemyEffects(b:Battle){for(const u of b.units){delete u.enemyEffectCast;delete u.enemyEffectRecovery;delete u.enemyEffectCooldown;delete u.enemySoftBind;delete u.enemyPush;delete u.enemyControlGrace;}}
export function observeEnemyEffectWarning(e:Engine,ownerId:string,serial:number){const c=e.unit(ownerId)?.enemyEffectCast;if(!c||c.serial!==serial)return false;c.seen=true;offerEnemyEffectResponses(e);return true;}
export function offerEnemyEffectResponses(e:Engine){if(!e.canAct())return;const u=e.active!;if(!hero(u)||u.stunnedRound===e.b.round||u.meleeFollow==='ready')return;for(const owner of e.b.units){const c=owner.enemyEffectCast;if(c?.seen){if(!c.offeredIds.includes(u.id))c.offeredIds.push(u.id);if(c.target===u.id)c.offered=true;}}}
export function enemyEffectActionCompleted(e:Engine,u?:Unit){
 if(u&&u.side===1&&!u.acted&&!u.enemyEffectCast&&(u.enemyEffectCooldown||0)>0)u.enemyEffectCooldown!--;
 if(!u||u.acted||!hero(u)||e.b.side!==0||u.stunnedRound===e.b.round||u.meleeFollow==='ready')return;
 for(const owner of e.b.units){const c=owner.enemyEffectCast;if(c?.seen&&c.offeredIds.includes(u.id)){if(!c.respondedIds.includes(u.id))c.respondedIds.push(u.id);if(c.target===u.id)c.responded=true;}}
 if(u.enemySoftBind)releaseEnemySoftBind(u);else if(u.enemyControlGrace)u.enemyControlGrace--;
}
export function prepareEnemyEffect(e:Engine,u:Unit,skill:string,target:Unit,angle:number,power:number){
 if(!enemyEffectEligible(e.b,u,skill)||!hero(target))return false;
 const b=e.b,hit={x:target.x,y:target.y-target.h*.45};
 if(!effectLineClear(e,u,hit))return false;
 u.enemyEffectCast={version:1,serial:b.nextId++,skill:skill as EnemyEffectSkill,target:target.id,origin:{x:u.x,y:u.y},angle,power,impact:{x:hit.x,y:hit.y},radius:e.effective(SKILLS[skill],u).radius,direction:target.x>=u.x?1:-1,createdTeamEnd:b.teamEnds[0],seen:false,offered:false,responded:false,wind:b.wind,sceneVersion:b.sceneVersion,offeredIds:[],respondedIds:[]};
 u.enemyEffectCooldown=2;
 u.intent=SKILLS[skill].name+' · 예고';e.message(`${u.name} · ${u.intent}`);e.finishAction();return true;
}
/** This ground burst is blocked by every intact terrain polygon, including
 * one-way platforms: their projectile pass-through rule does not permit this
 * effect to jump floors. Both endpoints are body centers, never feet. */
function effectSegmentClear(b:Battle,from:Vec,to:Vec){
 return !b.terrain.some(t=>!t.broken&&!!segmentTerrain(from,to,t,0));
}
function effectLineClear(e:Engine,u:Unit,to:Vec){
 const from={x:u.x,y:u.y-u.h*.45};
 return Math.hypot(to.x-from.x,to.y-from.y)<=1050&&Math.abs(to.y-from.y)<=450&&effectSegmentClear(e.b,from,to);
}
/** Only an already-budgeted enemy action may release a prepared attack. */
export function resolveEnemyEffect(e:Engine,u:Unit){
 const c=u.enemyEffectCast;if(!c)return false;const b=e.b,target=e.unit(c.target);
 delete u.enemyEffectCast;
 if(!enemyEffectEligible(b,u,c.skill)||!hero(target)||!c.seen||!c.offered||!c.responded||b.teamEnds[0]<=c.createdTeamEnd||Math.hypot(u.x-c.origin.x,u.y-c.origin.y)>2||!effectLineClear(e,u,c.impact)){
  u.intent='예고 취소';e.finishAction();return true;
 }
 // Use the ordinary cast for cost, damage roll, attribution and action ownership,
 // then resolve the opt-in fixed footprint, not a wind-dependent projectile.
 if(!e.fire(c.skill,c.angle,c.power,true)){e.finishAction();return true;}
 const projectiles=b.projectiles.filter(p=>p.owner===u.id&&p.shot===b.shot),p=projectiles[0];
 for(const shot of projectiles)e.remove(shot);
 if(!p)return true;
 p.x=c.impact.x;p.y=c.impact.y;
 e.fx('ring',p.x,p.y,p.color,c.radius);e.fx('burst',p.x,p.y,p.color,c.radius);
 e.emit('sound',{name:'hit'});
 for(const v of b.units){
  if(!enemyEffectEligible(b,u,c.skill))break;
  if(!hero(v)||v.stunnedRound===b.round||!c.respondedIds.includes(v.id)||!effectLineClear(e,u,{x:v.x,y:v.y-v.h*.45})||!effectSegmentClear(b,c.impact,{x:v.x,y:v.y-v.h*.45}))continue;
  const d=Math.hypot(v.x-p.x,v.y-v.h*.45-p.y);if(d>=c.radius+v.r)continue;
  // All splash victims had a response; the named target alone receives control.
  p.enemyEffectAttack={id:`${b.session||'battle'}:${c.serial}`,sourceId:u.id,target:c.target,skill:c.skill,direction:c.direction};
  e.hurt(v,p.damage*(.42+.58*(1-Math.min(1,d/Math.max(1,c.radius)))),u.id,false,p,c.impact);
 }
 return true;
}
/** A real direct hostile hit interrupts preparation once, never a DoT/HP poll. */
export function interruptEnemyEffect(e:Engine,u:Unit,sourceId:string,direct:boolean,p:Projectile|undefined,loss:number){
 const c=u.enemyEffectCast,source=e.unit(sourceId);
 if(!c||!direct||loss<=0||!source||e.allegiance(source)!==0||!enemyEffectEligible(e.b,u,c.skill))return;
 u.enemyEffectRecovery={attackId:`${sourceId}:${p?.shot??e.b.shot}:${p?.skill||'direct'}`,serial:c.serial};
 delete u.enemyEffectCast;u.intent='예고 끊김 · 회복';e.message(`${u.name} · 예고가 끊겼다.`);e.emit('change');
}
export function enemyEffectDamage(e:Engine,u:Unit,p:Projectile|undefined,hpLoss:number){
 const a=p?.enemyEffectAttack;if(!a||hpLoss<=0||!hero(u)||u.id!==a.target||p!.owner!==a.sourceId||p!.skill!==a.skill||p!.side!==1||p!.attackSide!==1)return;
 const source=e.unit(a.sourceId);if(!source||!enemyEffectEligible(e.b,source,a.skill))return;
 if(u.enemyEffectHits?.includes(a.id))return;
 u.enemyEffectHits=[...(u.enemyEffectHits||[]),a.id].slice(-64);
 if(a.skill==='HSH02'){
  if(u.enemySoftBind||(u.enemyControlGrace||0)>0)return;
  u.enemySoftBind={sourceId:source.id,attackId:a.id,remainingActions:1,factor:.55,appliedRound:e.b.round,started:false,withheld:0};
  if(!u.acted)enemyEffectMovementBudget(u);
  e.fx('text',u.x,u.y-u.h-15,'#d0b2d1',14,'매듭 · 다음 행동 이동 55%');
 }else if(!u.fixed&&!u.summonFloating&&!u.airborne&&!u.jumping){
  u.enemyPush={sourceId:source.id,attackId:a.id,remaining:80,direction:a.direction};u.vx=u.vy=0;delete u.moveTarget;
 }
}
export function enemyEffectMovementBudget(u:Unit){const bind=u.enemySoftBind;if(bind&&!u.acted){const cap=Math.min(u.moveLeft,u.maxMove*bind.factor);bind.withheld=u.moveLeft-cap;u.moveLeft=cap;bind.started=true;}}
export function tickEnemyEffects(e:Engine,dt:number){
 const b=e.b;if(b.honroMonsterEffectsRevision!==1||['won','lost'].includes(b.phase)){clearEnemyEffects(b);return;}
 for(const u of b.units){
  if(!live(u)||u.side!==1)delete u.enemyEffectRecovery;
  const c=u.enemyEffectCast;if(c){
   if(!enemyEffectEligible(b,u,c.skill)||!hero(e.unit(c.target)))delete u.enemyEffectCast;
   else if(b.teamEnds[0]>c.createdTeamEnd&&!c.responded){delete u.enemyEffectCast;u.enemyEffectRecovery={attackId:'response-window-expired',serial:c.serial};}
  }
  const bind=u.enemySoftBind;if(bind){const source=e.unit(bind.sourceId);if(!hero(u)||!source||!enemyEffectEligible(b,source,'HSH02'))releaseEnemySoftBind(u);}
  const push=u.enemyPush;if(!push)continue;const source=e.unit(push.sourceId);
  if(!hero(u)||!source||!enemyEffectEligible(b,source,'HWD02')||u.fixed||u.airborne||u.jumping){delete u.enemyPush;continue;}
  // Ground-following swept translation, capped at actual wall/body/ledge contact.
  let budget=Math.min(push.remaining,360*Math.max(0,dt));
  while(budget>1e-6){const dx=Math.min(4,budget)*push.direction,nx=u.x+dx;
   const support=terrainSurface(b.terrain,nx,u.y-6,u.y+6);
   const water=b.waters.some(w=>nx+u.r>w.x&&nx-u.r<w.x+w.w&&support&&support.y>=w.y-5&&support.y<w.y+w.depth+20);
   const left=terrainSurface(b.terrain,nx-u.r,u.y-6,u.y+6),right=terrainSurface(b.terrain,nx+u.r,u.y-6,u.y+6);
   if(nx<25||nx>b.width-25||!support||!left||!right||water){delete u.enemyPush;break;}
   const to={x:nx,y:support.y},blocked=sweepBodyTerrain(b.terrain,u,{x:u.x,y:u.y},to);
   const body=b.units.some(v=>v!==u&&live(v)&&!v.summonFloating&&Math.abs(v.x-nx)<u.r+v.r&&to.y>v.y-v.h+2&&to.y-u.h<v.y-2);
   const fullBody=b.terrain.some(t=>!t.broken&&!t.oneWay&&terrainRectIntersects(t,nx-u.r,to.y-u.h,2*u.r,u.h-.1,0));
   if(blocked||body||fullBody){delete u.enemyPush;break;}
   const distance=Math.hypot(dx,to.y-u.y);u.x=nx;u.y=to.y;u.vx=u.vy=0;budget-=distance;push.remaining=Math.max(0,push.remaining-distance);
  }
  if(push.remaining<=1e-6)delete u.enemyPush;
 }
 offerEnemyEffectResponses(e);
}
/** Cancel corrupt optional effects without throwing away the player's battle/progress. */
export function validateEnemyEffects(b:Battle){
 const n=(x:unknown,min=0,max=1e9)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
 const id=(s:unknown)=>typeof s==='string'&&s.length>0&&s.length<=150;
 const vec=(v:any)=>v&&n(v.x,-200,b.width+200)&&n(v.y,-1800,b.height+200);
 if(b.honroMonsterEffectsRevision!==1){delete b.honroMonsterEffectsRevision;clearEnemyEffects(b);for(const p of b.projectiles){delete p.enemyEffectAttack;delete p.enemyEffectWind;}return;}
 let repaired=false;
 for(const u of b.units){
  if(u.enemyEffectCooldown!==undefined&&(!Number.isInteger(u.enemyEffectCooldown)||!n(u.enemyEffectCooldown,0,2))){delete u.enemyEffectCooldown;repaired=true;}
  const recovery=u.enemyEffectRecovery;if(recovery&&(!id(recovery.attackId)||!Number.isSafeInteger(recovery.serial)||!n(recovery.serial))){delete u.enemyEffectRecovery;repaired=true;}
  if(u.honroMonsterEffectSkill!==undefined&&!skillOK(u.honroMonsterEffectSkill)){delete u.honroMonsterEffectSkill;repaired=true;}
  const c=u.enemyEffectCast;if(c&&!(c.version===1&&Number.isSafeInteger(c.serial)&&n(c.serial)&&skillOK(c.skill)&&u.honroMonsterEffectSkill===c.skill&&id(c.target)&&vec(c.origin)&&vec(c.impact)&&n(c.angle,-180,360)&&n(c.power,0,1)&&n(c.radius,0,300)&&[-1,1].includes(c.direction)&&n(c.createdTeamEnd)&&n(c.wind,-1000,1000)&&n(c.sceneVersion)&&Array.isArray(c.offeredIds)&&c.offeredIds.length<=80&&c.offeredIds.every(id)&&Array.isArray(c.respondedIds)&&c.respondedIds.length<=80&&c.respondedIds.every(v=>id(v)&&c.offeredIds.includes(v))&&[c.seen,c.offered,c.responded].every(x=>typeof x==='boolean')&&(!c.responded||c.offered)&&(!c.offered||c.seen))){delete u.enemyEffectCast;repaired=true;}
  const s=u.enemySoftBind;if(s&&!(id(s.sourceId)&&id(s.attackId)&&s.remainingActions===1&&s.factor===.55&&n(s.appliedRound)&&typeof s.started==='boolean'&&n(s.withheld,0,10000))){delete u.enemySoftBind;repaired=true;}
  const p=u.enemyPush;if(p&&!(id(p.sourceId)&&id(p.attackId)&&n(p.remaining,0,80)&&[-1,1].includes(p.direction))){delete u.enemyPush;repaired=true;}
  if(u.enemyControlGrace!==undefined&&(!Number.isInteger(u.enemyControlGrace)||!n(u.enemyControlGrace,0,2))){delete u.enemyControlGrace;repaired=true;}
  if(u.enemyEffectHits!==undefined&&(!Array.isArray(u.enemyEffectHits)||u.enemyEffectHits.length>64||!u.enemyEffectHits.every(id))){delete u.enemyEffectHits;repaired=true;}
 }
 for(const p of b.projectiles){const a=p.enemyEffectAttack;if(a&&!(id(a.id)&&id(a.sourceId)&&id(a.target)&&skillOK(a.skill)&&[-1,1].includes(a.direction))){delete p.enemyEffectAttack;delete p.enemyEffectWind;repaired=true;}}
 if(repaired)b.events=[...b.events,'손상된 몬스터 특수 효과만 취소했다. 전투 기록은 유지된다.'].slice(-30);
}
