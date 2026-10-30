/** Public current-preview safety, not damage search or future-combat simulation. */
import {previewAim} from './policy.mjs';
const pointSegment=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);};
export function reviewTrajectory(prediction,actor,target,visibleAllies,skill){
 const points=[...(prediction.points||[]),{x:prediction.x,y:prediction.y}].filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
 if(!points.length)return {safe:false,reason:'no-public-trajectory'};
 const allies=visibleAllies.filter(a=>a.id!==actor.id&&!a.dead&&a.hp>0),contact=allies.find(a=>a.id===prediction.unit);
 if(contact)return {safe:false,reason:'visible-ally-contact',ally:contact.id};
 // Conservative capsule clearance: a publicly seen body in the drawn path is
 // not permission to fire. This may decline harmless pass-through skills too.
 for(const ally of allies){const radius=(ally.r||20)+6,top=ally.y-(ally.h||80)+(ally.r||20),bottom=ally.y-(ally.r||20),samples=Math.max(1,Math.ceil(Math.abs(bottom-top)/radius));
  for(let n=0;n<=samples;n++){const center={x:ally.x,y:top+(bottom-top)*n/samples};for(let i=1;i<points.length;i++)if(pointSegment(center,points[i-1],points[i])<radius)return {safe:false,reason:'visible-ally-path',ally:ally.id};}
  const splash=Math.max(0,skill.radius||0);if(splash>0&&Math.hypot(prediction.x-ally.x,prediction.y-(ally.y-(ally.h||80)/2))<splash+(ally.r||20))return {safe:false,reason:'visible-ally-near-impact',ally:ally.id};
 }
 // The caster is excluded from its muzzle/path, not from a projectile's
 // impact area. Martial/body movement is not a self-explosion forecast.
 const ownRadius=Math.max(0,skill.radius||0);
 if(!skill.martial&&skill.mode!=='melee'&&ownRadius>0&&Math.hypot(prediction.x-actor.x,prediction.y-(actor.y-(actor.h||80)*.45))<ownRadius+(actor.r||20))return {safe:false,reason:'caster-near-impact',ally:actor.id};
 const center={x:target.x,y:target.y-(target.h||80)/2},closest=Math.min(...points.map(p=>Math.hypot(p.x-center.x,p.y-center.y))),allowance=Math.max(target.r||20,Math.min(100,skill.radius||0))+25;
 if(closest>allowance)return {safe:false,reason:prediction.terrain?'terrain-short-of-target':'preview-away-from-target',closest,allowance};
 return {safe:true,reason:'public-trajectory-clear',closest,allowance};
}
export function chooseObservedShot(e,u,skills,ids,target,visibleAllies,random){
 const draws=[random(),random()],reviews=[];
 for(const id of ids.slice(0,4)){
  const skill=skills[id];let index=0;const aim=previewAim(e,u,skill,target,()=>draws[index++]);
  const prediction=e.predict(u,skill,u.facing>=0?aim.angle:180-aim.angle,aim.power);
  const review=reviewTrajectory(prediction,u,target,visibleAllies,skill);
  const visibleIds=new Set([u.id,target.id,...visibleAllies.map(a=>a.id)]),endpoint=p=>({...p,unit:visibleIds.has(p.unit)?p.unit:null});
  const evidence={skill:id,baseAngle:aim.baseAngle,basePower:aim.basePower,baseDistance:aim.previewDistance,baseEndpoint:endpoint(aim.baseEndpoint),angle:aim.angle,power:aim.power,angleError:aim.angle-aim.baseAngle,powerError:aim.power-aim.basePower,endpoint:endpoint({x:prediction.x,y:prediction.y,unit:prediction.unit,terrain:prediction.terrain}),review};
  reviews.push(evidence);
  if(review.safe)return {skill:id,angle:aim.angle,power:aim.power,reviews,selectedTrajectory:prediction.points||[],draws};
 }
 return {skill:null,reviews,draws};
}
export function observedReposition(u,target,visibleAllies){
 const direction=Math.sign(target.x-u.x)||u.facing||1;
 const blockers=visibleAllies.filter(a=>a.id!==u.id&&!a.dead&&a.hp>0&&Math.sign(a.x-u.x)===direction&&Math.abs(a.x-u.x)<220).sort((a,b)=>Math.abs(a.x-u.x)-Math.abs(b.x-u.x));
 const x=blockers[0]?blockers[0].x+direction*((blockers[0].r||20)+(u.r||20)+35):u.x+direction*180;
 return {x,y:u.y,kind:'reposition',reason:blockers.length?'step-past-visible-ally':'approach-obstructed-shot'};
}
export class SafetyProgress{
 constructor(){this.records=new Map();}
 decline(u,round){const old=this.records.get(u.id);if(old?.round===round)return old.turns>=3;const progress=old?Math.hypot(u.x-old.x,u.y-old.y):Infinity;const record={round,x:u.x,y:u.y,turns:progress>=60?1:(old?.turns||0)+1};this.records.set(u.id,record);return record.turns>=3;}
 acceptedAction(id){this.records.delete(id);}
 state(id){return this.records.get(id)||null;}
}
export function unsafeAction(u,target,visibleAllies){return target&&u.moveLeft>80?{kind:'move',goal:observedReposition(u,target,visibleAllies)}:{kind:'defend',reason:target?'unsafe-shot-insufficient-movement':'target-no-longer-visible'};}
export function repositionArrival(move,u,intent){return intent.kind==='arrived'&&move?.from&&Math.hypot(u.x-move.from.x,u.y-move.from.y)>=25?'review-shot':'defend';}
