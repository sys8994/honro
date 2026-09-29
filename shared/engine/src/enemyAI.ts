/** Bounded tactical movement. Every candidate is tested with the same locomotion/contact code
 * as a real unit. Planning cannot damage, teleport, change RNG, or mutate the live roster. */
import type {Engine} from './engine';
import type {Unit,Skill,Vec,AIMovePlan} from './types';
import {SKILLS} from './data';
import {clamp,topAt,STEP,AIM_MIN,AIM_MAX} from './math';
const HEAVY=new Set(['guard','leaper']);
interface Stance extends Vec {cost:number;path:{x:number;y:number;jump:boolean;jumpX?:number}[];score:number;}
export function finishPlanning<T>(steps:Generator<void,T,unknown>):T{let next=steps.next();while(!next.done)next=steps.next();return next.value;}

export const FLY_MOVE_BUDGET=280;
export function flyingEnemy(u:Unit){return u.side===1&&u.fixed&&['bat','crow','lantern'].includes((u as any).honroType);}
/** Full body clearance, including slopes and thin ceilings. Used by both planning and motion. */
export function flightClear(e:Engine,u:Unit,p:Vec){
 const pad=8,left=p.x-u.r-pad,right=p.x+u.r+pad,head=p.y-u.h-pad,feet=p.y+pad;
 if(left<0||right>e.b.width||head<12||feet>e.b.height)return false;
 if(e.b.terrain.some(t=>!t.broken&&right>t.x&&left<t.x+t.w&&feet>Math.min(topAt(t,Math.max(left,t.x)),topAt(t,Math.min(right,t.x+t.w)))&&head<t.y+t.h))return false;
 return e.b.units.every(v=>v.id===u.id||v.dead||Math.abs(v.x-p.x)>=u.r+v.r+10||feet<=v.y-v.h-4||head>=v.y+4);
}
function flightLeg(e:Engine,u:Unit,to:Vec){
 const d=Math.hypot(to.x-u.x,to.y-u.y),steps=Math.ceil(d/6);
 for(let i=1;i<=steps;i++)if(!flightClear(e,u,{x:u.x+(to.x-u.x)*i/steps,y:u.y+(to.y-u.y)*i/steps}))return false;
 return true;
}
function* planFlight(e:Engine,u:Unit,target:Unit):Generator<void,AIMovePlan|undefined,unknown>{
 const budget=Math.min(FLY_MOVE_BUDGET,u.moveLeft);if(budget<24)return;
 const poses:Stance[]=[],start={x:u.x,y:u.y};
 for(const distance of [budget*.5,budget])for(let i=0;i<12;i++){
  const angle=i*Math.PI/6,p={x:u.x+Math.cos(angle)*distance,y:u.y+Math.sin(angle)*distance};
  if(flightLeg(e,u,p))poses.push({...p,cost:distance,path:[{...p,jump:false}],score:positionScore(e,u,target,p)-distance*.015});yield;
 }
 if(!poses.length)return;
 const stay=positionScore(e,u,target,start)+(yield* shotOpportunity(e,u,target,start));
 const top=poses.sort((a,b)=>b.score-a.score).slice(0,5);
 for(const p of top)p.score+=yield* shotOpportunity(e,u,target,p);
 const best=top.sort((a,b)=>b.score-a.score)[0];if(best.score<stay+3)return;
 return {round:e.b.round,targetId:target.id,path:best.path,index:0,elapsed:0,stalled:0,lastX:u.x,lastY:u.y,jumping:false,intent:'공중 사선 확보'};
}
function advanceFlight(e:Engine,u:Unit,dt:number){
 const p=u.aiMove!;p.elapsed+=dt;
 const stop=()=>{delete u.aiMove;u.vx=u.vy=0;u.moving=0;e.b.turnAge=0;};
 const next=p.path[p.index];if(!next||p.round!==e.b.round||p.elapsed>3||u.dead||u.moveLeft<=0){stop();return;}
 const dx=next.x-u.x,dy=next.y-u.y,d=Math.hypot(dx,dy);
 if(d<1){stop();return;}
 let left=Math.min(d,180*dt,u.moveLeft);
 while(left>1e-6){const step=Math.min(4,left),at={x:u.x+dx/d*step,y:u.y+dy/d*step};
  if(!flightClear(e,u,at)){stop();return;}
  u.x=at.x;u.y=at.y;u.moveLeft=Math.max(0,u.moveLeft-step);left-=step;
 }
 u.moving=.12;if(Math.abs(dx)>1)u.facing=Math.sign(dx);u.vx=u.vy=0;
 if(Math.hypot(next.x-u.x,next.y-u.y)<1||u.moveLeft<=0)stop();
}

/** First-impact estimate, using live blast falloff, armor, shields and HONRO coalition immunity.
 * Delayed effects/secondary fragments are deliberately not counted as guaranteed damage. */
export function shotImpactValue(e:Engine,u:Unit,skill:Skill,hit:{x:number;y:number;unit?:string},allowedTargetId?:string){
 const eff=e.effective(skill,u),radius=Math.max(1,eff.radius);let enemyDamage=0,friendlyDamage=0;
 for(const v of e.b.units){
  if(v.dead)continue;
  const friendly=v.id!==allowedTargetId&&(u.side===1?v.side===1:v.side!==1);
  const opponent=v.id===allowedTargetId||(u.side===1?(v.side===0||(v.side===2&&((v as any).honroAlly||v.id==='objective'))):v.side===1);
  if(!friendly&&!opponent)continue;
  if(friendly&&(u as any).honroAlly&&(v.side===0||v.side===2))continue;
  const d=Math.hypot(hit.x-v.x,hit.y-(v.y-v.h*.45)),direct=hit.unit===v.id;
  if(!direct&&d>=radius+v.r)continue;
  const factor=direct?1:.42+.58*(1-clamp(d/radius,0,1));
  const raw=eff.damage*factor*(1-clamp(v.armor,0,.7)),loss=Math.min(v.hp+v.shield,Math.max(0,raw));
  if(opponent)enemyDamage+=loss;
  else friendlyDamage+=loss*(raw>=v.hp+v.shield?1.8:1);
 }
 return {enemyDamage,friendlyDamage,net:enemyDamage-friendlyDamage*1.15};
}

export function targetFor(e:Engine,u:Unit):Unit|undefined{
 const b=e.b;
 const scriptedId=(u as any).honroTargetId, scriptedUntil=(u as any).honroTargetUntil||0;
 if(scriptedId&&scriptedUntil>=b.round){const scripted=e.unit(scriptedId);if(scripted&&!scripted.dead&&scripted.hp>0)return scripted;}
 const cursed=e.alive(u.side).filter(v=>v.id!==u.id&&(v.betrayalUntil||0)>=b.round&&Math.hypot(v.x-u.x,v.y-u.y)<1450).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y))[0];
 if(cursed)return cursed;
 if(['escort','defend'].includes(e.stage.objective)&&b.mode==='campaign'&&b.round%2===0){
  const obj=e.unit('objective');if(obj&&!obj.dead&&Math.hypot(obj.x-u.x,obj.y-u.y)<1100)return obj;
 }
 const friendlyTargets=(b as any).honroStage?e.b.units.filter(v=>!v.dead&&v.hp>0&&(v.side===0||(v.side===2&&(v as any).honroAlly)||v.id==='objective')):e.alive(0);
 return friendlyTargets.sort((a,c)=>{
  const priority=(v:Unit)=>{
   const distance=Math.hypot(v.x-u.x,(v.y-u.y)*.82);
   const classBias=v.id==='objective'?-245:(v as any).honroAlly?-220:v.cls==='knight'?-265:v.cls==='archer'?-70:0;
   const wounded=(v.hp/v.maxHp)*110;
   return distance+classBias+wounded;
  };
  return priority(a)-priority(c);
 })[0];
}
function preferredRange(u:Unit):[number,number]{
 const kind=(u as any).honroType;
 if(kind==='beast'||kind==='mourner')return [80,250];
 if(kind==='warden')return [150,390];
 if(kind==='ghost')return [420,760];
 if(kind==='shade')return [500,860];
 if(kind==='lantern')return [620,980];
 if(kind==='crow')return [700,1100];
 if(kind==='human')return [430,760];
 if(u.role==='leaper'||u.boss===5)return [130,300];
 if(u.role==='guard')return [170,350];
 if(u.role==='healer'||u.role==='ward')return [390,590];
 if(u.cls==='archer')return [340,570];
 return [240,470];
}
/** Hazard strength is deliberately finite so unavoidable terrain never freezes a turn. */
export function dangerAt(e:Engine,u:Unit,p:Vec){
 let danger=0;
 for(const w of e.b.waters)if(w.kind==='lava'&&p.x>w.x&&p.x<w.x+w.w&&p.y>=w.y-12&&p.y<w.y+w.depth+20)danger+=300;
 for(const z of e.b.zones){if(z.attached)continue;const d=Math.hypot(p.x-z.x,p.y-z.y),reach=z.radius+35;if(d<reach)danger+=(z.kind==='fire'||z.kind==='bomb'||z.kind==='delay'?115:55)*(1-d/(reach+40));}
 for(const t of e.b.terrain)if(!t.broken&&t.mat==='barrel'&&Math.hypot(p.x-(t.x+t.w/2),p.y-t.y)<125)danger+=22;
 return danger;
}
function positionScore(e:Engine,u:Unit,target:Unit,p:Vec){
 const [lo0,hi]=preferredRange(u),lo=lo0+(u.hp/u.maxHp<.32&&!HEAVY.has(u.role)?140:0);
 const distance=Math.hypot(p.x-target.x,(p.y-target.y)*.72);
 let score=-Math.max(0,lo-distance)*.29-Math.max(0,distance-hi)*.36-dangerAt(e,u,p);
 // Distinct firing positions reduce splash risk; clustering to get shields is handled below.
 for(const f of e.alive(1))if(f.id!==u.id){const d=Math.hypot(p.x-f.x,p.y-f.y);if(d<165)score-=(165-d)*.18;}
 score+=clamp((target.y-p.y)*.045,-22,22);
 score-=Math.max(0,p.y-target.y-85)*(HEAVY.has(u.role)?.19:.14);
 if(u.role==='healer'){
  const hurt=e.alive(1).filter(v=>v.id!==u.id&&v.hp<v.maxHp*.82).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  if(hurt)score-=Math.max(0,Math.hypot(p.x-hurt.x,p.y-hurt.y)-610)*.30;
 }
 if(u.role==='ward')score+=e.alive(1).filter(v=>v.id!==u.id&&Math.hypot(p.x-v.x,p.y-v.y)<620).length*5;
 return score;
}
/** Read-only travel probe. At most one normal jump on this leg, with swept body collisions. */
export function traceTravel(e:Engine,u:Unit,from:Vec,to:Vec,budget:number){return finishPlanning(traceTravelSteps(e,u,from,to,budget));}
function* traceTravelSteps(e:Engine,u:Unit,from:Vec,to:Vec,budget:number):Generator<void,{cost:number;jump:boolean;jumpX?:number}|null,unknown>{
 const dx=to.x-from.x,dy=to.y-from.y;
 if(Math.abs(dx)>Math.min(650,budget)||dy< -230||dy>300||Math.hypot(dx,dy)<5)return null;
 const ghost:Unit={...u,x:from.x,y:from.y,vx:0,vy:0,moveLeft:budget,airborne:false,jumping:false,aiMove:undefined,moveTarget:undefined};
 let jumpX:number|undefined;const initialDanger=dangerAt(e,u,from);
 let jumpUsed=false,firstJump=dy< -34,stall=0;
 const startJump=()=>{const cost=e.jumpCost(ghost);if(jumpUsed||ghost.moveLeft<cost||!e.grounded(ghost))return false;jumpX=ghost.x;ghost.jumping=true;ghost.vy=-660;ghost.moveLeft-=cost;jumpUsed=true;return true;};
 if(firstJump&&!startJump())return null;
 // Route budgets bound the iteration count; the integrator uses the same fixed STEP (1/120 s) as live play.
 for(let tick=0;tick<240;tick++){
  if(tick%8===0)yield;
  if(Math.abs(ghost.x-to.x)<8&&Math.abs(ghost.y-to.y)<8&&e.grounded(ghost))return {cost:budget-ghost.moveLeft,jump:jumpUsed,...(jumpUsed?{jumpX}: {})};
  const oldX=ghost.x,oldY=ghost.y,dir=Math.abs(to.x-ghost.x)<5?0:Math.sign(to.x-ghost.x);
  if(dir&&!e.walk(ghost,dir,STEP)&&!ghost.jumping){if(!startJump())return null;firstJump=true;}
  if(!e.integrateBody(ghost,STEP,true))return null;
  if(ghost.y>Math.max(from.y,to.y)+110||(dangerAt(e,u,ghost)>=250&&dangerAt(e,u,ghost)>initialDanger+1))return null;
  if(ghost.moveLeft<=0&&(!ghost.jumping||Math.abs(ghost.x-to.x)>10))return null;
  if(Math.hypot(ghost.x-oldX,ghost.y-oldY)<.01)stall++;else stall=0;
  if(stall>18)return null;
 }
 return null;
}
function candidates(e:Engine,u:Unit,target:Unit):Vec[]{
 const found:Vec[]=[];
 const add=(x:number,y:number)=>{
  if(x<30||x>e.b.width-30||Math.abs(x-u.x)>u.moveLeft||y<u.y-420||y>u.y+260)return;
  if(Math.hypot(x-u.x,y-u.y)<22||found.some(p=>Math.abs(p.x-x)<23&&Math.abs(p.y-y)<18))return;
  const foot=e.surface(x,y-3,y+4);if(!foot)return;
  // A standing body must fit, not merely its feet. One-way platforms may be overhead.
  if(e.b.terrain.some(t=>!t.broken&&!t.oneWay&&t.id!==foot.t.id&&x>t.x-4&&x<t.x+t.w+4&&y-8>topAt(t,clamp(x,t.x,t.x+t.w))&&y-u.h<t.y+t.h))return;
  found.push({x,y});
 };
 const offsets=[-500,-340,-210,-90,90,210,340,500];
 for(const dx of offsets){const x=u.x+Math.sign(dx)*Math.min(Math.abs(dx),u.moveLeft-5),g=e.surface(x,u.y-190,u.y+190);if(g)add(x,g.y);}
 for(const t of e.b.terrain){
  if(t.broken||t.w<52||['barrel','support','device'].includes(t.mat)||t.x>u.x+u.moveLeft||t.x+t.w<u.x-u.moveLeft)continue;
  for(const x of [clamp(u.x,t.x+27,t.x+t.w-27),clamp(target.x,t.x+27,t.x+t.w-27),t.x+32,t.x+t.w-32,t.x+t.w*.5])add(x,topAt(t,x));
 }
 for(const p of e.b.routePoints||[])add(p.x,p.y);
 return found.sort((a,c)=>{
  // Keep a mix of strategically good destinations and close stepping stones.
  const value=(p:Vec)=>positionScore(e,u,target,p)-Math.hypot(p.x-u.x,p.y-u.y)*.015;
  return value(c)-value(a);
 }).slice(0,30);
}
function* shotOpportunity(e:Engine,u:Unit,target:Unit,p:Vec):Generator<void,number,unknown>{
 if(Math.hypot(p.x-target.x,p.y-target.y)>1900)return -90;
 const ghost:Unit={...u,x:p.x,y:p.y,vx:0,vy:0};
 const skills=u.loadout.map(id=>SKILLS[id]).filter(s=>s&&!s.passive&&e.manaCost(s,u)<=u.focus).slice(0,2);
 let best=-90;
 for(const s of skills){const right=target.x>=p.x,blast=e.effective(s,ghost).radius;
  if(!e.npcShotInReach(ghost,s))continue;
  for(const aim of e.shotSeeds(ghost,s,target)){
   const hit=e.predict(ghost,s,aim.angle,aim.power,target,false),value=shotImpactValue(e,ghost,s,hit);
   yield;if(value.enemyDamage>0&&value.net>2)return 35+clamp(value.net,-120,60);
  }
  // This is a position heuristic, not the final aim search. Sample three arcs;
  // the selected position is aimed precisely only once, after movement.
  for(const elev of (target.y>p.y+80?[-35,35,78]:[18,50,82]))for(const power of [1]){
   const angle=right?elev:180-elev,hit=e.predict(ghost,s,angle,power,target,false);
   const d=Math.hypot(hit.x-target.x,hit.y-(target.y-target.h*.5));
   let score=-Math.min(90,Math.min(d,hit.closest+100)*.18);
   if(hit.unit===target.id)score=35;
   else if(blast>0&&d<blast)score=25;
   const value=shotImpactValue(e,ghost,s,hit);
   score+=clamp(value.net,-120,60);
   best=Math.max(best,score);yield;if(value.enemyDamage>0&&value.net>2)return best;
  }
 }
 return best;
}
export function planEnemyMove(e:Engine,u:Unit,target:Unit){return finishPlanning(planEnemyMoveSteps(e,u,target));}
export function* planEnemyMoveSteps(e:Engine,u:Unit,target:Unit):Generator<void,AIMovePlan|undefined,unknown>{
 if(flyingEnemy(u))return yield* planFlight(e,u,target);
 if(u.fixed||u.dead||u.moveLeft<35||!e.grounded(u))return;
 const budget=Math.min(u.moveLeft,610),start={x:u.x,y:u.y},poses=candidates(e,u,target);
 const reachable:Stance[]=[];
 for(const p of poses){const leg=yield* traceTravelSteps(e,u,start,p,budget);if(leg)reachable.push({...p,cost:leg.cost,path:[{...p,jump:leg.jump,...(leg.jumpX!==undefined?{jumpX:leg.jumpX}:{})}],score:positionScore(e,u,target,p)-leg.cost*.025});yield;
  // Candidates already have tactical priority. Three reachable alternatives are
  // enough to start walking; blocked routes still try the remaining candidates.
  if(reachable.length>=3||reachable.some(r=>r.score>positionScore(e,u,target,start)+45))break;
 }
 // A second step supports stairs/vertical shafts without an unbounded navigation search.
 const bridges=[...reachable].sort((a,c)=>a.cost-c.cost).slice(0,2);
 const directBest=Math.max(-Infinity,...reachable.map(p=>p.score));
 for(const p of poses.filter(p=>p.y<u.y-40&&positionScore(e,u,target,p)>directBest+4).slice(0,3)){
  if(reachable.some(r=>Math.abs(r.x-p.x)<10&&Math.abs(r.y-p.y)<10))continue;
  for(const via of bridges){if(via.cost>budget-85)continue;const leg=yield* traceTravelSteps(e,u,via,p,budget-via.cost);yield;if(!leg)continue;
   reachable.push({...p,cost:via.cost+leg.cost,path:[...via.path,{...p,jump:leg.jump,...(leg.jumpX!==undefined?{jumpX:leg.jumpX}:{})}],score:positionScore(e,u,target,p)-(via.cost+leg.cost)*.025});break;
  }
 }
 if(!reachable.length)return;
 const stayScore=positionScore(e,u,target,start)+(yield* shotOpportunity(e,u,target,start));
 const top=reachable.sort((a,c)=>c.score-a.score).slice(0,4);
 for(const r of top)r.score+=yield* shotOpportunity(e,u,target,r);
 const best=top.sort((a,c)=>c.score-a.score)[0];
 const currentDistance=Math.hypot(u.x-target.x,(u.y-target.y)*.72), forceAdvance=currentDistance>preferredRange(u)[1]+90;
 if(!forceAdvance&&best.score<stayScore+4)return;
 const before=Math.hypot(u.x-target.x,u.y-target.y),after=Math.hypot(best.x-target.x,best.y-target.y);
 const intent=dangerAt(e,u,start)>30?'위험 회피':best.y<u.y-45?'고지 확보':u.role==='healer'?'지원 위치로':after>before+35?'거리 확보':after<before-35?'전진':'사선 확보';
 return {round:e.b.round,targetId:target.id,path:best.path,index:0,elapsed:0,stalled:0,lastX:u.x,lastY:u.y,jumping:false,intent};
}
/** Executes the plan, never teleports to it. Unexpected changes cancel safely into re-aiming. */
export function advanceEnemyMove(e:Engine,u:Unit,dt:number){
 if(flyingEnemy(u)){if(u.aiMove)advanceFlight(e,u,dt);return;}
 const plan=u.aiMove;if(!plan)return;
 const stop=()=>{delete u.aiMove;delete u.moveTarget;e.b.turnAge=0;};
 plan.elapsed+=dt;
 if(plan.round!==e.b.round||plan.elapsed>7||u.dead||u.fixed){stop();return;}
 const next=plan.path[plan.index];if(!next){stop();return;}
 if(Math.abs(u.x-next.x)<9&&Math.abs(u.y-next.y)<14&&e.grounded(u)){
  plan.index++;plan.jumping=false;plan.stalled=0;if(plan.index>=plan.path.length)stop();return;
 }
 if(u.moveLeft<=0){stop();return;}
 if(next.jump&&!plan.jumping&&e.grounded(u)&&(next.jumpX===undefined||Math.abs(u.x-next.jumpX)<10)){if(!e.jump(u)){stop();return;}plan.jumping=true;}
 const moved=Math.hypot(u.x-plan.lastX,u.y-plan.lastY);plan.stalled=moved<.1?plan.stalled+dt:0;plan.lastX=u.x;plan.lastY=u.y;
 const dir=Math.abs(next.x-u.x)<5?0:Math.sign(next.x-u.x);
 if(dir&&!e.walk(u,dir,dt)&&!u.jumping){if(next.jump&&!plan.jumping&&e.jump(u))plan.jumping=true;else{stop();return;}}
 if(plan.stalled>.55&&!u.jumping)stop();
}
export function friendlyFireRisk(e:Engine,u:Unit,skill:Skill,angle:number,power:number,allowedTargetId?:string){
 const hit=e.predict(u,skill,angle,power,undefined,false),blast=e.effective(skill,u).radius;let risk=0;
 if(hit.unit){const unit=e.unit(hit.unit);if(unit?.side===u.side&&unit.id!==allowedTargetId)risk+=3;}
 for(const f of e.alive(u.side)){if(f.id===u.id||f.id===allowedTargetId)continue;const d=Math.hypot(hit.x-f.x,hit.y-(f.y-f.h*.5));if(d<Math.max(28,blast+f.r))risk+=blast>0?2:1;}
 // Direct allies between shooter and impact are especially dangerous even for tiny projectiles.
 const dx=hit.x-u.x,dy=hit.y-(u.y-u.h*.55),len2=dx*dx+dy*dy||1;
 for(const f of e.alive(u.side)){if(f.id===u.id||f.id===allowedTargetId)continue;const fx=f.x-u.x,fy=(f.y-f.h*.5)-(u.y-u.h*.55),t=clamp((fx*dx+fy*dy)/len2,0,1);if(t<=.04||t>=.96)continue;const d=Math.hypot(u.x+dx*t-f.x,(u.y-u.h*.55)+dy*t-(f.y-f.h*.5));if(d<f.r+16)risk+=2;}
 return risk;
}

export function shotViable(e:Engine,u:Unit,skill:Skill,target:Unit,angle:number,power:number,allowedTargetId?:string){
 const hit=e.predict(u,skill,angle,power,undefined,false),eff=e.effective(skill,u),allow=Math.max(85,eff.radius+target.r+55);
 const miss=Math.hypot(hit.x-target.x,hit.y-(target.y-target.h*.5));
 const value=shotImpactValue(e,u,skill,hit,allowedTargetId),allyRisk=value.friendlyDamage;
 if(value.enemyDamage>0&&value.net>Math.max(2,value.enemyDamage*.05))return {ok:true,reason:'',hit,miss,risk:allyRisk,...value};
 // A projectile stopped by terrain far away from the target is not a valid attack.
 if(hit.terrain&&miss>allow)return {ok:false,reason:'blocked',hit,miss,risk:allyRisk};
 // Direct/non-AoE shots must have a genuinely useful predicted endpoint.
 if(eff.radius<40&&miss>Math.max(115,target.r+70))return {ok:false,reason:'range',hit,miss,risk:allyRisk};
 if(allyRisk>0)return {ok:false,reason:'friendly',hit,miss,risk:allyRisk,...value};
 return {ok:false,reason:'range',hit,miss,risk:allyRisk,...value};
}

export function chooseEnemyShot(e:Engine,u:Unit,target:Unit,skills:Skill[]){return finishPlanning(chooseEnemyShotSteps(e,u,target,skills));}
export function* chooseEnemyShotSteps(e:Engine,u:Unit,target:Unit,skills:Skill[]):Generator<void,{skill:Skill;aim:{angle:number;power:number;score:number}},unknown>{
 // Scripted bosses retain telegraphed cadence, mobile enemies compare affordable attacks.
 if(u.boss===6||u.boss===5){const id=u.boss===6?(e.b.round%3===0?'M06':'M07'):(e.b.round%2===0?'S06':'S01'),skill=skills.find(s=>s.id===id)||skills[0];return {skill,aim:yield* e.searchShot(u,skill,target)};}
 let best:{skill:Skill;aim:{angle:number;power:number;score:number};value:number}|undefined;
 const crowd=e.alive(target.side).filter(v=>Math.hypot(v.x-target.x,v.y-target.y)<180).length;
 const ordered=skills.slice(0,3).sort((a,b)=>crowd>1?Number(b.radius>30)-Number(a.radius>30):0);
 for(const skill of ordered){
  const aim=yield* e.searchShot(u,skill,target);
  const outcome=shotViable(e,u,skill,target,aim.angle,aim.power);
  let value=aim.score+(skill.radius>30?(crowd-1)*13:0)-e.manaCost(skill,u)*.13+(outcome.ok?150:-150);
  if(aim.score>100)value+=Math.min(30,skill.damage*.18);
  if((skill.mode==='push'||skill.mode==='pull'||skill.mode==='bind')&&Math.abs(target.y-u.y)>70)value+=10;
  if(!best||value>best.value)best={skill,aim,value};
  if(outcome.ok)return {skill,aim};
 }
 return best!;
}
