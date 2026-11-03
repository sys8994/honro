/** Two fresh-only pilots; not a general enemy-status framework. */
import type {Engine} from './engine';
import type {Battle,Unit,Projectile,Vec} from './types';
import {SKILLS} from './data';
import {equipmentActor} from './equipment';
import {segmentTerrain} from './math';
import {damageNearest,damageContact} from './wreckDamage';
export type MonsterPose='idle'|'prepare'|'attack'|'recover';
export interface CoreCapsule {a:Vec;b:Vec;r:number;}
export type GrowthGeometry=Record<1|2|3,Record<MonsterPose,CoreCapsule[]>>;
export interface MonsterGrowth {stage:1|2|3;lastHitRound:number;lastDecayRound:number;lastActionsByHero:Record<string,number>;}
export interface MonsterA2Warning {
 version:1;kind:'growthStrike'|'mark';serial:number;target:string;origin:Vec;createdTeamEnd:number;seen:boolean;offered:boolean;responded:boolean;
 allyId?:string;stageAtPrepare?:1|2|3;direction?:number;reach?:number;area?:{x:number;y:number;w:number;h:number};
}
const live=(u?:Unit)=>!!u&&!u.dead&&u.hp>0&&!u.eaterCapturedBy;
const hero=(u?:Unit)=>live(u)&&equipmentActor(u)&&!u!.honroObjectiveTarget;
export function monsterA2Eligible(b:Battle,u?:Unit){return b.honroMonsterCombatRevision===2&&live(u)&&u!.side===1&&!u!.enthrall&&(u!.honroMonsterA2Kind==='seer'||u!.honroMonsterA2Kind==='growth'&&!!u!.honroMonsterGrowthGeometry);}
export function monsterPose(u:Unit):MonsterPose{return u.monsterA2Animation?.pose||(u.monsterA2Warning?.kind==='growthStrike'?'prepare':(u.monsterA2Cooldown||0)>0&&!u.monsterA2Warning?'recover':'idle');}
function capsulePolygon(a:Vec,b:Vec,r:number){const angle=Math.atan2(b.y-a.y,b.x-a.x),points:Vec[]=[];for(let i=0;i<=6;i++){const q=angle+Math.PI/2+Math.PI*i/6;points.push({x:a.x+Math.cos(q)*r,y:a.y+Math.sin(q)*r});}for(let i=0;i<=6;i++){const q=angle-Math.PI/2+Math.PI*i/6;points.push({x:b.x+Math.cos(q)*r,y:b.y+Math.sin(q)*r});}return points;}
const geometryCache=new WeakMap<Unit,{key:string;table:GrowthGeometry;shape:ReturnType<typeof makeMonsterShape>}>();
function makeMonsterShape(u:Unit){
 const stage=u.monsterGrowth?.stage||1,pose=monsterPose(u),scale=u.h/128,facing=u.facing||1;
 const capsules=u.honroMonsterGrowthGeometry![stage][pose].map(c=>({a:{x:u.x+c.a.x*scale*facing,y:u.y+c.a.y*scale},b:{x:u.x+c.b.x*scale*facing,y:u.y+c.b.y*scale},r:c.r*scale}));
 const polygons=capsules.map(c=>capsulePolygon(c.a,c.b,c.r)),core=capsules[Math.max(0,capsules.length-2)];
 const points=polygons.flat(),bounds={left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
 return {version:1 as const,unitId:u.id,projectileHullReplacement:true as const,polygons,capsules,stage,pose,bounds,aim:{x:(core.a.x+core.b.x)/2,y:(core.a.y+core.b.y)/2}};
}
export function monsterDamageGeometry(b:Battle,u:Unit){
 if(b.honroMonsterCombatRevision!==2||!live(u)||u.honroMonsterA2Kind!=='growth'||!u.honroMonsterGrowthGeometry)return null;
 const key=[u.x,u.y,u.h,u.facing,u.monsterGrowth?.stage||1,monsterPose(u)].join('|'),cached=geometryCache.get(u);
 if(cached?.key===key&&cached.table===u.honroMonsterGrowthGeometry)return cached.shape;
 const shape=makeMonsterShape(u);geometryCache.set(u,{key,table:u.honroMonsterGrowthGeometry!,shape});return shape;
}
export function monsterDamageCritical(b:Battle,u:Unit,at:Vec){const shape=monsterDamageGeometry(b,u);if(!shape)return undefined;return damageNearest([shape.polygons[shape.polygons.length-1]],at).distance<3;}
export function beginMonsterHeroCast(e:Engine,u:Unit){if(e.b.honroMonsterCombatRevision!==2||!hero(u)||e.b.side!==0||e.b.active!==u.id||u.acted)return;u.monsterHeroActionToken??=e.b.nextId++;u.monsterHeroActionShots??=[];u.monsterHeroActionShots.push(e.b.shot+1);}
export function observeMonsterA2Warning(e:Engine,ownerId:string,serial:number){const w=e.unit(ownerId)?.monsterA2Warning;if(!w||w.serial!==serial)return false;w.seen=true;offerMonsterA2Response(e);return true;}
export function offerMonsterA2Response(e:Engine){const target=e.active;if(!e.canAct()||!hero(target)||target!.meleeFollow==='ready'||target!.stunnedRound===e.b.round)return;for(const u of e.b.units){const w=u.monsterA2Warning;if(w?.seen&&w.target===target!.id)w.offered=true;}}
export function monsterA2ActionCompleted(e:Engine,u?:Unit){
 if(!u||u.acted)return;
 if(hero(u)&&e.b.side===0&&u.stunnedRound!==e.b.round&&u.meleeFollow!=='ready'){
  for(const owner of e.b.units){const w=owner.monsterA2Warning;if(w?.seen&&w.offered&&w.target===u.id)w.responded=true;}
  delete u.monsterHeroActionToken;delete u.monsterHeroActionShots;
 }
 if(u.side===1&&!u.monsterA2Warning&&(u.monsterA2Cooldown||0)>0)u.monsterA2Cooldown!--;
}
function clearLine(b:Battle,a:Vec,z:Vec){return !b.terrain.some(t=>!t.broken&&!!segmentTerrain(a,z,t));}
const center=(u:Unit)=>({x:u.x,y:u.y-u.h*.5});
function validTarget(e:Engine,u:Unit,t?:Unit){return hero(t)&&!t!.enemySoftBind&&!(t!.stun||0)&&t!.stunnedRound!==e.b.round&&Math.hypot(t!.x-u.x,t!.y-u.y)<=1000&&clearLine(e.b,center(u),center(t!));}
function cancelWarning(e:Engine,u:Unit){if(!u.monsterA2Warning)return;delete u.monsterA2Warning;u.monsterA2Recovery=true;u.intent='예고 끊김 · 회복';}
export function monsterA2Damage(e:Engine,t:Unit,ownerId:string,direct:boolean,p:Projectile|undefined,hpLoss:number,shieldLoss:number,normal:boolean){
 const source=e.unit(ownerId);
 if(normal&&direct&&hpLoss+shieldLoss>0&&hero(source))for(const seer of e.b.units){const w=seer.monsterA2Warning;if(w?.kind==='mark'&&(seer===t||w.allyId===t.id))cancelWarning(e,seer);}
 if(!normal||hpLoss<=0||!monsterA2Eligible(e.b,t)||t.honroMonsterA2Kind!=='growth'||!hero(source)||!p||p.child&&p.echoUsed||p.attackSide!==0||p.side!==0||p.owner!==source!.id)return;
 const token=p.monsterHeroActionToken||(source!.monsterHeroActionShots?.includes(p.shot)?source!.monsterHeroActionToken:undefined);if(!token)return;
 const g=t.monsterGrowth??={stage:1,lastHitRound:0,lastDecayRound:e.b.round,lastActionsByHero:{}};
 g.lastHitRound=e.b.round;if((g.lastActionsByHero[source!.id]||0)>=token)return;g.lastActionsByHero[source!.id]=token;
 g.stage=Math.min(3,g.stage+1) as 1|2|3;e.fx('text',t.x,t.y-t.h-16,'#c7bec9',14,`그늘 ${g.stage}단계`);e.emit('change');
}
export function decayMonsterGrowth(e:Engine){for(const u of e.b.units){const g=u.monsterGrowth;if(!monsterA2Eligible(e.b,u)||!g||g.lastDecayRound>=e.b.round)continue;if(g.lastHitRound<e.b.round-1)g.stage=Math.max(1,g.stage-1) as 1|2|3;g.lastDecayRound=e.b.round;}}
/** Called after ordinary paid navigation; returns true only if it owns this action. */
export function beginMonsterA2Action(e:Engine,u:Unit,target:Unit){
 if(!monsterA2Eligible(e.b,u))return false;
 if(u.monsterA2Warning){u.intent='연결 유지';e.finishAction();return true;}
 if(u.monsterA2Cooldown){if(u.honroMonsterA2Kind==='growth'){u.intent='그늘 회복';e.finishAction();return true;}return false;}
 if(!validTarget(e,u,target)){if(u.honroMonsterA2Kind==='growth'){u.intent='접근 · 경계';e.finishAction();return true;}return false;}
 const b=e.b,base={version:1 as const,serial:b.nextId++,target:target.id,origin:{x:u.x,y:u.y},createdTeamEnd:b.teamEnds[0],seen:false,offered:false,responded:false};
 if(u.honroMonsterA2Kind==='seer'){
  const ally=e.unit(u.honroMonsterMarkAlly||'');
  if(!live(ally)||ally!.side!==1||ally!.enthrall||ally!.loadout.length!==1||ally!.loadout[0]!=='LA01'||Math.hypot(ally!.x-u.x,ally!.y-u.y)>650||!clearLine(b,center(u),center(ally!))||!validTarget(e,ally!,target))return false;
  u.monsterA2Warning={...base,kind:'mark',allyId:ally!.id};u.monsterA2Cooldown=1;u.intent='점복 · 표적 연결';
 }else{
  const stage=u.monsterGrowth?.stage||1,reach=[0,95,135,175][stage],direction=target.x>=u.x?1:-1;
  if(Math.abs(target.x-u.x)>reach+target.r||Math.abs(target.y-u.y)>40){u.intent='접근 · 경계';e.finishAction();return true;}
  const height=[0,72.396,104.210,127.614][stage]*u.h/128;
  u.monsterA2Warning={...base,kind:'growthStrike',stageAtPrepare:stage,direction,reach,area:{x:direction>0?u.x:u.x-reach,y:u.y-height,w:reach,h:height}};
  u.monsterA2Cooldown=2;u.facing=direction;u.intent='그늘팔 · 준비';
 }
 e.message(`${u.name} · ${u.intent}`);e.finishAction();return true;
}
export function resolveMonsterA2Action(e:Engine,u:Unit){
 if(!monsterA2Eligible(e.b,u))return false;
 if(u.monsterA2Recovery){delete u.monsterA2Recovery;e.finishAction();return true;}
 const w=u.monsterA2Warning;if(w?.kind!=='growthStrike')return false;
 delete u.monsterA2Warning;const t=e.unit(w.target),area=w.area!;
 if(!w.seen||!w.responded||e.b.teamEnds[0]<=w.createdTeamEnd||!validTarget(e,u,t)||Math.hypot(u.x-w.origin.x,u.y-w.origin.y)>2){e.finishAction();return true;}
 const sk=SKILLS.HED01;if(!sk||!e.fire(sk.id,w.direction!>0?0:180,.5,true)){e.finishAction();return true;}
 const ps=e.b.projectiles.filter(p=>p.owner===u.id&&p.shot===e.b.shot),p=ps[0];for(const q of ps)e.remove(q);
 u.monsterA2Animation={pose:'attack',left:.32};
 if(p&&t){const at=center(t);if(at.x>=area.x-t.r&&at.x<=area.x+area.w+t.r&&at.y>=area.y&&at.y<=area.y+area.h)e.hurt(t,p.damage,u.id,true,p,at);}
 e.emit('change');return true;
}
export function markedMonsterTarget(e:Engine,ally:Unit){
 if(e.b.honroMonsterCombatRevision!==2||!live(ally)||ally.side!==1||ally.enthrall)return undefined;
 for(const seer of e.b.units){const w=seer.monsterA2Warning;if(w?.kind!=='mark'||w.allyId!==ally.id||!w.seen||!w.responded||!monsterA2Eligible(e.b,seer)||e.b.teamEnds[0]<=w.createdTeamEnd)continue;
  const t=e.unit(w.target);if(validTarget(e,ally,t)&&Math.hypot(seer.x-w.origin.x,seer.y-w.origin.y)<=2&&clearLine(e.b,center(seer),center(ally)))return t;
  cancelWarning(e,seer);
 }return undefined;
}
export function monsterMarkProof(e:Engine,ally:Unit){const target=markedMonsterTarget(e,ally);if(!target)return undefined;for(const seer of e.b.units){const w=seer.monsterA2Warning;if(w?.kind==='mark'&&w.allyId===ally.id&&w.target===target.id&&w.responded)return {ownerId:seer.id,serial:w.serial,target:target.id};}return undefined;}
export function consumeMonsterMark(e:Engine,ally:Unit,targetId:string){for(const seer of e.b.units){const w=seer.monsterA2Warning;if(w?.kind==='mark'&&w.allyId===ally.id&&w.target===targetId&&w.responded){delete seer.monsterA2Warning;seer.intent='점복 · 연결 끝';}}}
export function tickMonsterA2(e:Engine,dt:number){
 const b=e.b;if(b.honroMonsterCombatRevision!==2)return;
 for(const u of b.units){
  if(u.monsterA2Animation){u.monsterA2Animation.left-=dt;if(u.monsterA2Animation.left<=0)delete u.monsterA2Animation;}
  const w=u.monsterA2Warning;if(!w)continue;
  const ally=w.allyId?e.unit(w.allyId):undefined;
  if(!monsterA2Eligible(b,u)||!hero(e.unit(w.target))||w.kind==='mark'&&(!live(ally)||ally!.side!==1||ally!.enthrall)||['won','lost'].includes(b.phase)){delete u.monsterA2Warning;continue;}
  if(b.teamEnds[0]>w.createdTeamEnd&&!w.responded||b.teamEnds[0]>w.createdTeamEnd+1)cancelWarning(e,u);
 }offerMonsterA2Response(e);
}
export function clearMonsterA2(b:Battle){for(const u of b.units){delete u.monsterA2Warning;delete u.monsterA2Recovery;delete u.monsterA2Animation;delete u.monsterHeroActionToken;delete u.monsterHeroActionShots;}}
export function validateMonsterA2(b:Battle){
 const n=(v:unknown,min=0,max=1e9)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max,id=(v:unknown)=>typeof v==='string'&&v.length>0&&v.length<=150;
 const point=(v:any)=>v&&n(v.x,-20000,20000)&&n(v.y,-20000,20000),poses:MonsterPose[]=['idle','prepare','attack','recover'];let repaired=false;
 if(b.honroMonsterCombatRevision!==2){delete b.honroMonsterCombatRevision;clearMonsterA2(b);return;}
 for(const u of b.units){
  const shape=u.honroMonsterGrowthGeometry;
  if(shape&&![1,2,3].every(stage=>poses.every(pose=>{const cs=shape[stage as 1|2|3]?.[pose];return Array.isArray(cs)&&cs.length>0&&cs.length<=8&&cs.every(c=>point(c.a)&&point(c.b)&&n(c.r,.2,25)&&[c.a,c.b].every(p=>n(p.x,-100,100)&&n(p.y,-150,0)));}))){delete u.honroMonsterGrowthGeometry;delete u.monsterGrowth;repaired=true;}
  const g=u.monsterGrowth;if(g&&(![1,2,3].includes(g.stage)||!n(g.lastHitRound)||!n(g.lastDecayRound)||!g.lastActionsByHero||typeof g.lastActionsByHero!=='object'||Array.isArray(g.lastActionsByHero)||Object.keys(g.lastActionsByHero).length>4||Object.entries(g.lastActionsByHero).some(([key,v])=>!id(key)||!n(v)))){delete u.monsterGrowth;repaired=true;}
  const proof=u.aiAim?.monsterMark;if(proof&&(!id(proof.ownerId)||!id(proof.target)||!Number.isSafeInteger(proof.serial)||!n(proof.serial))){delete u.aiAim;repaired=true;}
  const w=u.monsterA2Warning;if(w&&!(w.version===1&&['growthStrike','mark'].includes(w.kind)&&Number.isSafeInteger(w.serial)&&n(w.serial)&&id(w.target)&&point(w.origin)&&n(w.createdTeamEnd)&&[w.seen,w.offered,w.responded].every(v=>typeof v==='boolean')&&(!w.responded||w.offered)&&(!w.offered||w.seen)&&(w.kind==='mark'?id(w.allyId):[1,2,3].includes(w.stageAtPrepare!)&&[-1,1].includes(w.direction!)&&n(w.reach,1,200)&&w.area&&point(w.area)&&n(w.area.w,1,200)&&n(w.area.h,1,300)))){delete u.monsterA2Warning;repaired=true;}
  if(u.monsterA2Recovery!==undefined&&typeof u.monsterA2Recovery!=='boolean'){delete u.monsterA2Recovery;repaired=true;}
  if(u.monsterA2Cooldown!==undefined&&(!Number.isInteger(u.monsterA2Cooldown)||!n(u.monsterA2Cooldown,0,2))){delete u.monsterA2Cooldown;repaired=true;}
  if(u.monsterHeroActionToken!==undefined&&(!Number.isSafeInteger(u.monsterHeroActionToken)||!n(u.monsterHeroActionToken))){delete u.monsterHeroActionToken;delete u.monsterHeroActionShots;repaired=true;}
  if(u.monsterHeroActionShots!==undefined&&(!Array.isArray(u.monsterHeroActionShots)||u.monsterHeroActionShots.length>20||u.monsterHeroActionShots.some(v=>!Number.isSafeInteger(v)||!n(v)))){delete u.monsterHeroActionShots;repaired=true;}
  if(u.monsterA2Animation&&(!poses.includes(u.monsterA2Animation.pose)||!n(u.monsterA2Animation.left,0,1))){delete u.monsterA2Animation;repaired=true;}
 }
 if(repaired)b.events=[...b.events,'손상된 새 몬스터 효과만 취소했다. 전투 기록은 유지된다.'].slice(-30);
}
