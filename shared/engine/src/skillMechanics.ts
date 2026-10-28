import {gearHas,gearBody,gearAddFrost,gearFinish,gearState} from './equipmentCombat';
import {equipmentParam,equipmentPrimary} from './equipment';
import {keeperEchoVelocity} from './keeperRitual';
import {cheonroeVisualSeed} from './lightningGeometry';
import {gateSource} from './gateTravel';
import {migrateBeastSkills} from './beastMelee';
import {validTerrainContactPose} from './locomotion';
import {waveReflectionPlan,WAVE_REFLECTION_DECAY,waveReflectionVelocities} from './waveReflection';
export {waveReflectionPlan,WAVE_REFLECTION_DECAY,waveReflectionVelocities} from './waveReflection';
import {passiveTuning} from './passiveBalance';
import {healed} from './contribution';
import {triggerOffensiveStake,stakeRanges} from './totemBehavior';
import {waveArcDimensions,MAGE_AREA_SCALE} from './mageGeometry';
import {jucheonBoost} from './combatPassives';
import type {Battle,Unit,Projectile,Skill,Vec,Profile} from './types';
import type {Engine,Collision,Prediction} from './engine';
import {dragFor} from './physics';
import {SKILLS} from './data';
import {clamp,rad,STEP,terrainRectIntersects,topAt} from './math';
import {passiveRank,baseSkill,sanitizeLoadout,applyHero,criticalStats,stakeDuration} from './progression';

export const SKILL_REVISION=1;
export const ICE_GOURD_FUSE=3.2;
export const iceGourdFuse=(power:number)=>ICE_GOURD_FUSE+3.2*clamp(power,0,1);
export const newSkill=(p:Pick<Projectile,'skill'>)=>!!SKILLS[p.skill]?.redesigned;
const rank=(p:Projectile)=>p.skillRank||1;
const at=(u:Unit)=>({x:u.x,y:u.y-u.h*.5});
const enemy=(p:Pick<Projectile,'side'>,u:Unit)=>!u.dead&&!u.eaterCapturedBy&&u.side!==p.side&&u.side!==2;
const lerpRank=(a:number,b:number,r:number)=>a+(b-a)*(r-1)/7;
export function mainBranch(u:Pick<Unit,'ranks'>,cls='archer'){
 const sums:Record<string,number>={};for(const [id,r] of Object.entries(u.ranks)){const s=SKILLS[id];if(s?.cls===cls&&s.branch&&!s.passive)sums[s.branch]=(sums[s.branch]||0)+r;}
 const entries=Object.entries(sums).sort((a,b)=>b[1]-a[1]);return entries.length&&entries[0][1]>0&&entries[0][1]>(entries[1]?.[1]||0)?entries[0][0]:null;
}
/** Retained for old callers; no single-tree specialization remains. */
export function specialty(u:Unit,s:Skill){return 0;}
export function trajectoryMultiplier(p:Projectile,u:Unit,hit:Vec){
 const s=SKILLS[p.skill];if(!s?.redesigned||s.cls!=='archer'||p.secondary)return 1;
 const extra=passiveTuning(passiveRank(u,'AP04')).trajectory;
 if(s.branch==='distance')return 1+((s.id==='A99'?.60:.40)+extra+(p.preparedRank?lerpRank(.08,.22,p.preparedRank):0))*clamp(Math.abs(hit.x-(p.launchX??p.x))/1800,0,1);
 if(p.equipment?.dropBonus!==undefined&&s.id==='A11')return p.equipment.dropBonus;
 if(s.branch==='drop')return 1+((s.id==='A15'?.55:s.id==='A13'?.35:.45)+extra)*clamp(Math.max(0,hit.y-(p.apexY??p.launchY??p.y))*(p.trajectoryDropScale||1)/900,0,1);
 if(s.branch==='speed')return 1+((s.id==='A08'?.35:.45)+extra)*clamp((Math.hypot(p.vx,p.vy)*(p.trajectorySpeedScale||1)-500)/650,0,1);
 return 1;
}
export function redesignConditionBonuses(p:Projectile,u:Unit,hit:Vec,direct:boolean){
 if(!newSkill(p)||u.cls!=='archer'||!direct)return [];
 return [trajectoryMultiplier(p,u,hit)-1,...(p.skill==='A09'&&p.turned?[lerpRank(.30,.65,rank(p))]:[])];
}
export function critProfile(p:Projectile,u:Unit,actor:Unit|undefined=u){
 const r=rank(p),id=p.skill,base=criticalStats(u.cls,u.level,u.ranks);
 return {chance:Math.min(.80,(u.critChance??base.critChance)+(id==='A14'?lerpRank(.18,.39,r):id==='A99'?lerpRank(.25,.39,r):0)+(p.preparedRank?lerpRank(.06,.20,p.preparedRank):0)),
  multiplier:Math.max(1,Math.min(3.5,(u.critMultiplier??base.critMultiplier)+(id==='A14'?lerpRank(.20,.55,r):id==='A99'?lerpRank(.50,.85,r):0)))};
}
export function redrawDamage(e:Engine,p:Projectile,u:Unit,target:Unit,amount:number,point:Vec,direct:boolean,critical=false){
 if(!newSkill(p))return amount;
 if(u.cls==='archer'&&direct){
  if(p.preparedRank)amount/=Math.max(.3,1-clamp(target.armor,0,.7))*Math.max(.3,1-clamp(target.armor-lerpRank(.04,.15,p.preparedRank),0,.7));
  if(p.skill==='A99'&&critical&&Math.abs(point.x-(p.launchX??point.x))>=1200){
   if(target.boss)amount*=1+.25*(1-target.hp/target.maxHp);
   else if(target.hp-amount*(1-target.armor)<=target.maxHp*lerpRank(.12,.22,rank(p)))amount=Math.max(amount,(target.hp+target.shield+1)/Math.max(.3,1-target.armor));
  }
 }
 const key=`redesign:${p.shot}:${p.skill}:${target.id}`;
 if(p.skill==='A15'&&p.child){const n=e.b.shotDamage[key]||0;e.b.shotDamage[key]=n+1;amount*=([1,.70,.50,.35][n]||0);}
 if(p.secondary){
  const limit=p.skill==='A08'?(p.rootDamage||p.damage)*.65*(p.damageRoll??1):p.skill==='M13'?3:2;
  const used=e.b.shotDamage[key]||0;
  if(p.skill==='A08'){amount=Math.max(0,Math.min(amount,limit-used));e.b.shotDamage[key]=used+amount;}
  else {if(used>=limit)return 0;e.b.shotDamage[key]=used+1;}
 }
 return amount;
}
export function recordRedesignDamage(e:Engine,p:Projectile|undefined,src:Unit,target:Unit,actual:number){
 if(e.b.cast?.shot===p?.shot&&e.b.cast?.owner===src.id&&enemy({side:src.side},target))e.b.cast.enemyDamage+=actual;
 if(!p||!newSkill(p)||p.skill!=='A06'||!enemy(p,target)||src.dead||src.hp<=0)return;
 const r=rank(p);for(const [field,max,fraction,cap] of [['hp','maxHp',lerpRank(.05,.12,r),.15],['focus','maxFocus',lerpRank(.03,.07,r),.18]] as const){
  const boosted=field==='focus'&&gearBody(p)&&gearHas(p,'se_recover')&&p.equipment!.lowFocus;
  const key=`recover:${p.shot}:${field}`,used=e.b.shotDamage[key]||0,n=Math.min(actual*fraction*(boosted?2:1),src[max]*(boosted?.25:cap)-used,src[max]-src[field]);
  src[field]+=Math.max(0,n);e.b.shotDamage[key]=used+Math.max(0,n);
 }
 e.emit('fx',{name:'inkLine',x:p.x,y:p.y,x2:src.x,y2:src.y-src.h*.5,color:'#bfc9c6',size:1});
}
export function migrateEnemySkills(u:Unit){
 migrateBeastSkills(u);
 if(u.side===0&&!u.summoned)return;
 u.loadout=u.loadout.map(id=>SKILLS['L'+id]?.enemyOnly?'L'+id:id);
 for(const id of Object.keys(u.ranks))if(SKILLS['L'+id]?.enemyOnly){u.ranks['L'+id]=u.ranks[id];delete u.ranks[id];}
}
/** Per-roster marker makes profile and unfinished battle independently idempotent. */
export function migrateSkills(p:Profile & {honroBattle?:Battle}){
 const rosters=[p.heroes,p.saved?.heroes,p.honroBattle?.heroes];
 for(const heroes of rosters)for(const cls of ['archer','mage'] as const){const h=heroes?.[cls];if(h&&h.skillRevision!==SKILL_REVISION){h.ranks={[baseSkill(cls)]:1};h.skillRevision=SKILL_REVISION;}}
 for(const b of [p.saved,p.honroBattle])if(b&&b.skillRevision!==SKILL_REVISION){
  for(const u of b.units){if(u.side===0&&!u.summoned&&(u.cls==='archer'||u.cls==='mage')){u.ranks={...b.heroes[u.cls].ranks};u.loadout=[baseSkill(u.cls)];u.cooldowns={};}else migrateEnemySkills(u);}
  // Keep in-flight old casts on historical definitions until their normal resolution.
  for(const q of [...b.projectiles,...(b.volley?[b.volley.template]:[])])if(SKILLS['L'+q.skill])q.skill='L'+q.skill;
  b.skillRevision=SKILL_REVISION;
 }
 for(const heroes of rosters){const h=heroes?.knight;if(h&&h.martialRevision!==1){h.ranks={S00:1};h.martialRevision=1;}}
 for(const b of [p.saved,p.honroBattle])if(b&&b.martialRevision!==1){
  for(const u of b.units){if(u.side===0&&!u.summoned&&u.cls==='knight'){u.ranks={...b.heroes.knight.ranks};u.loadout=['S00'];u.cooldowns={};const hp=u.hp,focus=u.focus;applyHero(u,b.heroes.knight);u.hp=Math.min(hp,u.maxHp);u.focus=Math.min(focus,u.maxFocus);delete u.meleeFollow;delete u.meleeAction;}else migrateEnemySkills(u);}
  for(const q of [...b.projectiles,...(b.volley?[b.volley.template]:[])])if(/^S\d\d$/.test(q.skill)&&SKILLS['L'+q.skill])q.skill='L'+q.skill;
  b.martialRevision=1;
 }
 for(const heroes of rosters){const h=heroes?.occultist;if(h&&h.occultRevision!==1){
  const ranks:Record<string,number>={O01:1};for(const id of ['O02','O03','O04','O05','O06','O07'])if(h.ranks[id]>0)ranks[id]=h.ranks[id];
  h.ranks=ranks;h.occultRevision=1;
 }}
 for(const b of [p.saved,p.honroBattle])if(b&&b.occultRevision!==1){
  for(const u of b.units){if(u.side===0&&!u.summoned&&u.cls==='occultist'){
   u.ranks={...b.heroes.occultist.ranks};u.loadout=['O01',...u.loadout.filter(id=>['O02','O03','O04','O05','O06','O07'].includes(id))].slice(0,4);u.cooldowns={};u.spiritSight=true;
  }else migrateEnemySkills(u);}
  for(const q of [...b.projectiles,...(b.volley?[b.volley.template]:[])])if(['O08','O09','O10','O13','O14','O15','O99'].includes(q.skill))q.skill='L'+q.skill;
  b.occultRevision=1;
 }
 for(const cls of ['archer','mage','knight','occultist'] as const)sanitizeLoadout(p,cls);
 return p;
}
export function initRedesignCast(e:Engine,s:Skill,u:Unit,actualKiSpent=e.manaCost(s,u)){
 if(!s.redesigned)return;
 e.b.cast={owner:u.id,skill:s.id,shot:e.b.shot,cost:actualKiSpent,enemyDamage:0};
 if(u.prepared&&u.prepared.expires<e.b.round)delete u.prepared;
 const roots=e.b.projectiles.filter(p=>p.owner===u.id&&p.shot===e.b.shot);
 for(const p of roots){if(s.mode==='waveBounce')p.reflectionVersion=1;if(s.id==='M02')p.fuseAt=iceGourdFuse(u.lastPower);p.apexY=p.y;p.rootDamage=p.damage;if(s.branch==='distance'&&s.id!=='A10'&&u.prepared)p.preparedRank=u.prepared.rank;}
 if(s.branch==='distance'&&s.id!=='A10')delete u.prepared;
 if(s.mode==='prepare'){e.b.projectiles=e.b.projectiles.filter(p=>!roots.includes(p));u.prepared={rank:u.ranks[s.id]||1,expires:e.b.round+2};e.fx('ring',u.x,u.y-u.h*.6,'#c8cebf',22);}
 if(['waveRing','waveBagua'].includes(s.mode))for(const p of roots){
  const plan=redesignPrediction(e,u,s,u.angle,u.lastPower)!;p.targetPoint={x:plan.x,y:plan.y};p.plannedTime=plan.time;p.phaseMode='all';
  if(s.mode==='waveRing'){p.x=u.x;p.y=u.y-u.h*.5;p.targetPoint={x:p.x,y:p.y};p.blast=180+720*u.lastPower;p.vx=p.vy=0;}
 }
}
export function finishRedesign(e:Engine,reviewed:boolean){
 const b=e.b,u=e.active;if(!u)return false;
 if(u.retreat){delete u.retreat;return false;}
 const cast=b.cast;
 if(cast&&cast.owner===u.id&&!cast.refunded){
  cast.refunded=true;const s=SKILLS[cast.skill],r=passiveRank(u,'MP03');
  if(r&&cast.enemyDamage===0&&['gourd','wave'].includes(s.branch||'')){u.focus=Math.min(u.maxFocus,u.focus+cast.cost*passiveTuning(r).missRefund);e.fx('text',u.x,u.y-u.h-14,'#becbc6',14,'회기');}
 }
 if(b.mode!=='practice'&&reviewed&&cast?.owner===u.id&&SKILLS[cast.skill]?.cls==='archer'&&cast.skill!=='A10'&&passiveRank(u,'AP03')&&!u.dead){
  u.retreat=true;u.moveLeft=u.maxMove*passiveTuning(passiveRank(u,'AP03')).retreat;b.phase='aim';b.cast=undefined;b.resolveAge=0;e.message('이탈보 · 이동/점프만 가능 · 대기로 종료');e.emit('change');e.emit('save');return true;
 }
 return false;
}
export function turnArrow(e:Engine,point?:Vec){
 const p=e.b.projectiles.find(q=>q.skill==='A09'&&q.owner===e.b.active&&!q.turned&&!q.followup);if(!p||e.b.phase!=='flight')return false;
 const u=e.unit(p.owner)!,a=Math.atan2(p.vy,p.vx),desired=point?Math.atan2(point.y-p.y,point.x-p.x):-rad(u.angle),d=Math.atan2(Math.sin(desired-a),Math.cos(desired-a)),max=rad(lerpRank(45,80,rank(p))),next=a+clamp(d,-max,max),speed=Math.hypot(p.vx,p.vy)*.92;
 p.vx=Math.cos(next)*speed;p.vy=Math.sin(next)*speed;p.turned=true;e.fx('ring',p.x,p.y,'#d0d5cc',22);return true;
}
/** Read-only continuation from the arrow's current state, with the same one-time steering. */
export function turnPrediction(e:Engine,point?:Vec){
 const live=e.b.projectiles.find(p=>p.skill==='A09'&&p.owner===e.b.active&&!p.turned&&!p.followup);
 if(!live||e.b.phase!=='flight')return null;
 const b=structuredClone(e.b),Sim=e.constructor as new(b:Battle)=>Engine,sim=new Sim(b);
 const p=b.projectiles.find(p=>p.id===live.id)!;b.projectiles=[p];b.volley=undefined;
 if(!turnArrow(sim,point))return null;
 const points:Vec[]=[{x:p.x,y:p.y}];
 for(let i=0;i<1440&&b.projectiles.includes(p);i++){sim.stepProjectile(p,STEP);if(i%3===0||!b.projectiles.includes(p))points.push({x:p.x,y:p.y});}
 return {points,x:p.x,y:p.y};
}

export type SkillGeometry={kind:'arc'|'ring'|'triangle'|'bagua';x:number;y:number;radius:number;thickness:number;angle:number;span:number;points?:Vec[];impact?:Vec};
export function baguaVertices(g:Pick<SkillGeometry,'x'|'y'|'radius'|'angle'>):Vec[]{
 return Array.from({length:8},(_,i)=>({x:g.x+Math.cos(g.angle+i*Math.PI/4)*g.radius,y:g.y+Math.sin(g.angle+i*Math.PI/4)*g.radius}));
}
export function skillGeometry(s:Skill,r:number,x:number,y:number,angle:number,power=.5,contacts?:Vec[],origin?:Vec,boost=1):SkillGeometry{
 const kind=s.mode==='waveArc'?'arc':s.mode==='waveRing'?'ring':s.mode==='waveTriangle'?'triangle':'bagua';
 const arc=waveArcDimensions(r);
 const g:SkillGeometry={kind,x,y,radius:kind==='arc'?arc.radius:kind==='ring'?180+720*power:220+(r-1)*10,thickness:(kind==='arc'?arc.thickness:(kind==='ring'?34+16*(r-1)/7:20+2*(r-1))*MAGE_AREA_SCALE)*boost,angle,span:rad(arc.span)};
 // The impact lies ON the crescent. Its tangent is perpendicular to incoming velocity.
 if(kind==='arc'){g.impact={x,y};g.x-=Math.cos(angle)*g.radius;g.y-=Math.sin(angle)*g.radius;}
 if(kind==='triangle')g.points=[origin!,...(contacts||[])];
 if(kind==='bagua')g.points=baguaVertices(g);
 return g;
}
/** Paths shared by both preview and animated ink; the octagon is also the hit boundary. */
export function geometryPaths(g:SkillGeometry):Vec[][]{
 const arc=(radius:number,start:number,span:number)=>{const n=Math.max(16,Math.min(128,Math.ceil(radius*Math.abs(span)/12)));return Array.from({length:n+1},(_,i)=>({x:g.x+Math.cos(start+span*i/n)*radius,y:g.y+Math.sin(start+span*i/n)*radius}));};
 if(g.kind==='arc')return [arc(g.radius,g.angle-g.span/2,g.span)];
 if(g.kind==='ring')return [arc(g.radius,0,Math.PI*2)];
 if(g.kind==='triangle'){const ps=g.points||[];return ps.length===3?[[...ps,ps[0]]]:[];}
 const vs=baguaVertices(g);return [[...vs,vs[0]],...vs.map(p=>[{x:g.x,y:g.y},p]),arc(70,0,Math.PI*2)];
}
export function lineDistance(p:Vec,a:Vec,b:Vec){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
export function geometryHits(g:SkillGeometry,u:Pick<Unit,'x'|'y'|'h'|'r'>){
 const p={x:u.x,y:u.y-u.h*.5},d=Math.hypot(p.x-g.x,p.y-g.y),width=g.thickness*.5+u.r;
 if(g.kind==='ring')return {count:Math.abs(d-g.radius)<=width?1:0,interior:false,center:false};
 if(g.kind==='arc'){const a=Math.atan2(p.y-g.y,p.x-g.x),da=Math.abs(Math.atan2(Math.sin(a-g.angle),Math.cos(a-g.angle)));return {count:Math.abs(d-g.radius)<=width&&da<=g.span*.5+Math.asin(Math.min(1,u.r/Math.max(1,d)))?1:0,interior:false,center:false};}
 if(g.kind==='triangle'){
  const ps=g.points||[];if(ps.length!==3)return{count:0,interior:false,center:false};
  const cross=(a:Vec,b:Vec,c:Vec)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),cs=ps.map((a,i)=>cross(a,ps[(i+1)%3],p));
  return {count:Math.min(2,ps.filter((a,i)=>lineDistance(p,a,ps[(i+1)%3])<=width).length),interior:Math.abs(cross(ps[0],ps[1],ps[2]))>3000&&(cs.every(v=>v>=0)||cs.every(v=>v<=0)),center:false};
 }
 const vs=baguaVertices(g);let count=vs.some((v,i)=>lineDistance(p,v,vs[(i+1)%8])<=width)?1:0;for(const v of vs)if(lineDistance(p,g,v)<=width)count++;
 return {count:Math.min(3,count),center:d<=70+u.r,interior:false};
}
export const geometryBoost=(u:Unit,s:Skill,boost=jucheonBoost(u,s))=>(1+passiveTuning(passiveRank(u,'MP01')).geometry)*(1+Math.min(.05,boost/3));
function emitGeometry(e:Engine,g:SkillGeometry){
 // Serialize the exact hit shape as one event; renderer does no independent geometry reconstruction.
 e.emit('fx',{name:'skillGeometry',x:g.x,y:g.y,color:'#ced4cd',text:JSON.stringify(g),size:g.radius});
}
function strikeGeometry(e:Engine,p:Projectile,g:SkillGeometry,directTarget?:Unit,covered=false){
 emitGeometry(e,g);
 e.emit('sound',{name:'qiWave'});
 for(const u of e.b.units.filter(u=>!u.dead&&u.id!==p.owner)){if(covered&&e.projectileCollision(g.impact||g,at(u),1,p.owner,[],false))continue;const h=geometryHits(g,u);let amount=p.damage*Math.max(h.count,u.id===directTarget?.id?1:0);
  if(g.kind==='triangle'&&!h.count&&h.interior)amount=p.damage*16/38;
  if(g.kind==='ring')amount*=Math.max(.28,220/Math.max(220,g.radius));
  if(g.kind==='bagua'&&h.center)amount+=p.damage*62/34;
  if(amount)e.hurt(u,amount,p.owner,false,p,at(u));
 }
}
function reflect(p:Projectile,h:Collision,restitution=.84){const dot=p.vx*h.n.x+p.vy*h.n.y;p.vx=(p.vx-2*dot*h.n.x)*restitution;p.vy=(p.vy-2*dot*h.n.y)*restitution;p.x=h.x+h.n.x*(p.radius+1);p.y=h.y+h.n.y*(p.radius+1);p.bounces++;}
function spawnChild(e:Engine,p:Projectile,mode:string,vx:number,vy:number,damage:number,blast=0){
 const q:Projectile={...p,equipment:p.equipment?structuredClone(p.equipment):undefined,id:e.b.nextId++,mode,vx,vy,prevVy:vy,damage,blast,age:0,child:true,autonomous:true,secondary:true,apex:true,hit:[],trail:[],bounces:0,pierces:0,fuseAt:undefined,phaseMode:undefined,gravityScale:1,drag:.025,radius:3,maxAge:.5};e.b.projectiles.push(q);return q;
}
function skyStrikePoint(e:Engine,point:Vec,owner:string):Vec{
 const start={x:point.x,y:Math.min(-170,point.y-600)};
 const hit=e.projectileCollision(start,point,3,owner,[],false);
 return hit?{x:hit.x,y:hit.y}:point;
}
function gourdBurst(e:Engine,p:Projectile){
 const u=e.unit(p.owner)!;const s=SKILLS[p.skill],r=rank(p),secondary=(1+passiveTuning(passiveRank(u,'MP01')).gourdSecondary)*(1+(p.effectBoost||0)*.5);
 if(p.mode==='gourdSky'){
  if(gearHas(p,'da_sky')&&gearBody(p)){const eligible=[...e.blastUnitTargets(p.x,p.y,p.blast,p.owner,false,p)].filter(({unit:t})=>e.guidanceTarget(u,t)).sort((a,b)=>a.distance-b.distance||a.unit.id.localeCompare(b.unit.id));p.equipment!.focusTarget=eligible[0]?.unit.id;}
  p.mode='skyWait';p.targetPoint={x:p.x,y:p.y};p.vx=p.vy=0;p.age=0;p.fuseAt=undefined;e.emit('fx',{name:'inkLine',x:p.x,y:p.y-220,x2:p.x,y2:p.y,color:'#a8bbc6',size:1});e.emit('sound',{name:'ceramic'});return;
 }
 e.blast(p.x,p.y,p.blast,p.damage,p.owner,false,p);
 if(p.mode==='gourdFire'||p.mode==='gourdIce'){
  const ice=p.mode==='gourdIce',frost=ice&&gearHas(p,'da_heal')&&gearBody(p),count=5+r;if(frost)gearAddFrost(e,p);
  for(let i=0;i<count;i++){const a=(i+.5)*Math.PI*2/count+(e.random()-.5)*.35;const q=spawnChild(e,p,ice?'frostChip':'fireChip',Math.cos(a)*330,Math.sin(a)*330,p.damage*(ice?.16:.18)*secondary*(frost?.75:1),10);q.maxAge=.48;}
  if(ice)for(const t of e.b.units.filter(t=>enemy(p,t)&&e.attackAllows(t,p.owner,p)&&Math.hypot(t.x-p.x,t.y-t.h*.5-p.y)<p.blast+t.r))t.slowed={factor:lerpRank(.20,.35,r),expires:e.b.round+1};
 }
 if(p.mode==='gourdThunder')for(const t of e.b.units.filter(t=>!t.dead&&e.attackAllows(t,p.owner,{...p,autonomous:true})&&Math.hypot(t.x-p.x,t.y-t.h*.5-p.y)<=260+10*(r-1))){
  e.emit('fx',{name:'lightningBolt',x:p.x,y:p.y,x2:t.x,y2:t.y-t.h*.5,color:'#a8cfff',size:2.8});e.hurt(t,p.damage*.45*secondary,p.owner,false,{...p,secondary:false,autonomous:true},p);
 }
 if(p.mode==='gourdBurst'){p.mode='microEmitter';p.age=0;p.vx=p.vy=0;p.emissions=0;p.fuseAt=undefined;return;}
 e.remove(p);
}
export function iceGourdReady(e:Engine){return e.b.phase==='flight'&&e.b.projectiles.some(p=>p.owner===e.b.active&&p.mode==='gourdIce'&&!p.secondary);}
export function detonateIceGourd(e:Engine){
 if(!iceGourdReady(e))return false;
 for(const p of [...e.b.projectiles])if(p.owner===e.b.active&&p.mode==='gourdIce'&&!p.secondary)gourdBurst(e,p);
 e.emit('change');e.emit('save');return true;
}
function placeStake(e:Engine,p:Projectile,h:Collision){
 const b=e.b;b.stakes??=[];const support=h.terrain?.oneWay&&h.n.y<0?h.terrain:undefined,x=support?clamp(p.x,support.x,support.x+support.w):p.x;
 const floor=support?topAt(support,x,h.y):h.n.y<-.3?h.y:e.surface(p.x,p.y-3,b.height)?.y;if(floor===undefined){e.remove(p);return;}
 const all=b.stakes;if(p.skill==='M09'){const gates=all.filter(s=>s.skill==='M09'&&s.side===p.side);if(!gates.length){const u=e.unit(p.owner)!;const home=e.surface(u.x,u.y-8,u.y+80);if(home)b.stakes.push({attackSide:p.attackSide,damageRoll:p.damageRoll,id:b.nextId++,skill:p.skill,owner:p.owner,side:p.side,x:u.x,y:home.y,rank:rank(p),damage:0,shot:p.shot,effectBoost:p.effectBoost,expires:b.round+stakeDuration(p.skill,rank(p))});}else if(gates.length>=2)b.stakes=all.filter(s=>s.id!==gates[0].id);}
 b.stakes.push({attackSide:p.attackSide,damageRoll:p.damageRoll,id:b.nextId++,skill:p.skill,owner:p.owner,side:p.side,x,y:floor,rank:rank(p),damage:p.damage,shot:p.shot,effectBoost:p.effectBoost,expires:b.round+stakeDuration(p.skill,rank(p))});
 e.fx('spark',x,floor,'#a89b7f',15);e.remove(p);
 if(!e.skillSound('plant',p.owner,p.skill,p.shot))e.emit('sound',{name:'ceramic'});
}

/** One shared enemy-only hop for body and first ground contacts. */
function chainArrowHop(e:Engine,p:Projectile,r:number){
 if((p.chain||0)>=Math.round(lerpRank(1,5,r)))return false;
 const next=e.b.units.filter(t=>e.guidanceTarget(e.unit(p.owner),t)&&!p.hit.includes(t.id)&&Math.hypot(t.x-p.x,t.y-t.h*.5-p.y)<=260&&!e.projectileCollision(p,{x:t.x,y:t.y-t.h*.5},1,p.owner,[],false)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-a.h*.5-p.y)-Math.hypot(b.x-p.x,b.y-b.h*.5-p.y))[0];
 if(!next)return false;const dx=next.x-p.x,dy=next.y-next.h*.5-p.y,d=Math.max(.001,Math.hypot(dx,dy));p.vx=dx/d*900;p.vy=dy/d*900;p.damage*=.72;p.chain=(p.chain||0)+1;p.autonomous=true;return true;
}
/** Hook only redesigned impacts; collision detection and integration remain in Engine. */
export function redesignImpact(e:Engine,p:Projectile,h:Collision){
 if(!newSkill(p))return false;
 const s=SKILLS[p.skill],u=e.unit(p.owner)!,r=rank(p);p.x=h.x;p.y=h.y;
 if(p.secondary){if(h.unit){e.hurt(h.unit,p.damage,p.owner,false,p,h);if(p.mode==='frostChip'&&enemy(p,h.unit))h.unit.slowed={factor:lerpRank(.20,.35,r),expires:e.b.round+1};}e.remove(p);return true;}
 if(p.mode==='waveArc'){
  const reversed=!!h.terrain&&gearHas(p,'da_arc')&&gearBody(p),g=skillGeometry(s,r,h.x+(reversed?h.n.x*2:0),h.y+(reversed?h.n.y*2:0),Math.atan2(p.vy,p.vx)+(reversed?Math.PI:0),u.lastPower,undefined,undefined,geometryBoost(u,s,p.effectBoost));if(reversed){g.span*=1.2;g.x=g.impact!.x;g.y=g.impact!.y;}
  strikeGeometry(e,p,g,h.unit,reversed);e.remove(p);return true;
 }
 if(p.mode==='qiPulse'){
  e.blast(p.x,p.y,p.blast,p.damage,p.owner,false,p);e.emit('sound',{name:'qiWave'});e.remove(p);return true;
 }
 if(s.branch==='stake'){if(h.terrain)placeStake(e,p,h);return true;}
 if(s.branch==='gourd'){
  if(p.mode==='gourdIce'){reflect(p,h,h.unit?.72:.64);e.fx('ring',p.x,p.y,'#b5c9cb',14);e.emit('sound',{name:'ceramic'});return true;}
  gourdBurst(e,p);return true;
 }
 if(p.mode==='waveBounce'&&p.reflectionVersion===1){
  if(h.terrain){
   const focused=gearHas(p,'da_stake')&&!p.secondary&&!p.echoSource,count=focused?(p.bounces<waveReflectionPlan(r).length+2?1:0):waveReflectionPlan(r)[p.bounces];
   if(!count){e.remove(p);return true;}
   const velocities=waveReflectionVelocities(p,h.n,count);
   // Retain launch age, credit, shot and owner: descendants share the original
   // 12-second lifetime and never reset their generation on a terrain corner.
   p.contacts=[...(p.contacts||[]),{x:h.x,y:h.y}];p.bounces++;
   p.damage*=focused?.90:WAVE_REFLECTION_DECAY;p.x=h.x+h.n.x*(p.radius+1);p.y=h.y+h.n.y*(p.radius+1);
   p.child=true;p.autonomous=true;p.trail=[{x:p.x,y:p.y}];
   for(const [i,v] of velocities.entries()){
    const q=i===0?p:{...p,id:e.b.nextId++,hit:[...p.hit],contacts:[...p.contacts],trail:[{x:p.x,y:p.y}]};
    Object.assign(q,v,{prevVy:v.vy});if(i)e.b.projectiles.push(q);
   }
   e.fx('inkImpact',h.x,h.y,'#dce3da',30);e.emit('sound',{name:'qiRebound'});
  }else if(h.unit){e.hurt(h.unit,p.damage,p.owner,false,p,h);e.remove(p);}
  return true;
 }
 if(p.mode==='waveBounce'||p.mode==='waveTriangle'){
  if(h.terrain){p.contacts??=[];p.contacts.push({x:h.x,y:h.y});reflect(p,h);
   e.fx('inkImpact',h.x,h.y,'#dce3da',30);
   e.emit('sound',{name:'qiRebound'});
   if(p.mode==='waveTriangle'&&p.contacts.length>=2){strikeGeometry(e,p,skillGeometry(s,r,p.x,p.y,0,.5,p.contacts,{x:p.launchX!,y:p.launchY!},geometryBoost(u,s,p.effectBoost)));e.remove(p);}
   else if(p.bounces>Math.round(lerpRank(2,7,r)))e.remove(p);
  }else if(h.unit){e.hurt(h.unit,p.damage*(1+Math.min(.48,p.bounces*.08)),p.owner,false,p,h);e.remove(p);}return true;
 }
 if(s.cls!=='archer')return false;
 if(h.unit){
  const target=h.unit,prior=p.outboundHits?.includes(target.id),factor=p.returning?.7*(prior?1.2:1):1;
  const before=target.hp;e.hurt(target,p.damage*factor,p.owner,true,p,h);p.hit.push(target.id);
  if(p.mode==='push'){if(gearHas(p,'se_push')&&gearBody(p)&&!p.equipment!.pushMarked&&enemy(p,target)){p.equipment!.pushMarked=true;gearState(target).wallSlow={owner:p.owner,until:e.b.round+1};}e.impulse(target,Math.sign(p.vx)*280,-130,p);target.shove={attackSide:e.attackSide(p.owner,p),friendlyFireApplied:e.friendlyFireMultiplier(target,p.owner,p)<1,autonomous:e.autonomousAttack(p.owner,p),owner:p.owner,damage:(before-target.hp)*.18,remaining:Math.round(lerpRank(2,5,r)),hit:[target.id],life:1.5};}
  if(p.mode==='pierce'&&p.pierces<[1,1,2,2,3,3,4,5][r-1]){p.pierces++;p.damage*=.88;return true;}
  if(p.mode==='pierce')gearFinish(e,p,target.id);
  if(p.mode==='return'&&p.hit.length<=1)return true;
  if(p.mode==='chainArrow'&&chainArrowHop(e,p,r))return true;
 }
 if(h.terrain){
  if(p.skill==='A11'&&gearHas(p,'se_drop')&&gearBody(p)&&!p.equipment!.bounced&&h.n.y<-.35&&p.vy>0){const a=p.equipment!;a.dropBonus=trajectoryMultiplier(p,u,h);a.bounced=true;a.travelX=h.x;a.travelY=h.y+h.n.y*(p.radius+1);a.travelMax=600;p.x=a.travelX;p.y=a.travelY;p.vx=Math.sign(p.vx||u.facing)*Math.max(400,Math.abs(p.vx));p.vy=0;p.prevVy=0;p.gravityScale=0;p.damage*=.65;p.bounces++;e.fx('spark',p.x,p.y,p.color,24);return true;}
  e.damageTerrain(h.terrain,p.damage*s.terrain,0,p.owner,p);
  e.emit('sound',{name:'arrowhit'});
  if(p.mode==='chainArrow'&&!p.chain){p.x+=h.n.x*(p.radius+2);p.y+=h.n.y*(p.radius+2);if(chainArrowHop(e,p,r))return true;}
  if(p.mode==='pierce'&&h.terrain.mat==='wood'&&h.terrain.w<=90&&p.pierces<[1,1,2,2,3,3,4,5][r-1]){p.pierces++;p.damage*=.88;p.x+=Math.sign(p.vx)*(h.terrain.w+8);return true;}
 }
 if(h.terrain&&p.mode==='pierce'&&p.pierces>=[1,1,2,2,3,3,4,5][r-1])gearFinish(e,p);
 if(p.mode==='breakArrow'){
  for(const t of e.b.units.filter(t=>!t.dead&&e.attackAllows(t,p.owner,p)&&t.id!==h.unit?.id&&Math.hypot(t.x-p.x,t.y-t.h*.5-p.y)<70+t.r)){e.hurt(t,p.damage*.55,p.owner,false,p,h);e.impulse(t,Math.sign(t.x-p.x)*230,-110,p);}
  if(h.unit)e.impulse(h.unit,Math.sign(p.vx)*280,-120,p);e.fx('spark',p.x,p.y,'#aca799',30);
 }
 if(p.mode==='ironFlower'){p.mode='ironEmitter';p.age=0;p.emissions=0;p.vx=p.vy=0;p.x+=h.n.x*9;p.y+=h.n.y*9;return true;}
 e.fx('spark',p.x,p.y,p.color,18);e.remove(p);return true;
}

export function splitSeven(e:Engine,p:Projectile){
 const targets=e.b.units.filter(u=>e.guidanceTarget(e.unit(p.owner),u)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
 for(let i=0;i<7;i++){const target=targets.length?targets[i%targets.length]:undefined,q=spawnChild(e,p,'seekChild',(i-3)*70+p.vx*.2,250,p.damage);q.secondary=false;q.maxAge=8;q.targetId=target?.id;q.apexY=p.apexY??p.y;}
 e.emit('sound',{name:'split'});e.remove(p);
}
export function redesignStep(e:Engine,p:Projectile,dt:number){
 if(!newSkill(p))return false;
 const s=SKILLS[p.skill],u=e.unit(p.owner)!,r=rank(p);p.apexY=Math.min(p.apexY??p.y,p.y);
 if(p.maxAge&&p.age>=p.maxAge){e.remove(p);return true;}
 if(p.mode==='gourdIce'&&p.age>=(p.fuseAt??iceGourdFuse(u.lastPower))){gourdBurst(e,p);return true;}
 if(p.mode==='skyWait'){
  if(p.age>=.35){const target=p.targetPoint!,end=skyStrikePoint(e,target,p.owner);
   // Keep the original strike center, eligibility and falloff. Snapshot before
   // any hurt/impulse can move, kill or remove a target; visual rays never attack.
   const targets=[...e.blastUnitTargets(end.x,end.y,p.blast,p.owner,false,p)].map(row=>({...row,equipmentScale:gearHas(p,'da_sky')&&gearBody(p)?(row.unit.id===p.equipment!.focusTarget?1.8:.6):1}));
   for(const {unit:t,head:fallbackHead} of targets){
    if(!enemy(p,t)||t.hp<=0)continue;
    const head:Vec=(globalThis as any).HonroMonsterVisual?.headPoint(t)??fallbackHead;
    const sky={x:head.x,y:Math.min(-170,head.y-600)};
    // Clip the visual to the underside of overhead terrain. The original
    // central column still decides damage; do not add per-enemy ceiling gates.
    const ceiling=e.collision(head,sky,3,p.owner,[],false);
    e.emit('fx',{name:'lightningBolt',x:head.x,y:ceiling?.y??sky.y,x2:head.x,y2:head.y,color:'#a8cfff',size:3.5,lightningSeed:cheonroeVisualSeed(p.id,t.id)});
   }
   e.blast(end.x,end.y,p.blast,p.damage,p.owner,false,p,0,undefined,targets);e.remove(p);
  }return true;
 }
 if(p.mode==='microWait'){
  if(p.age>=(p.fuseAt??.08)){e.blast(p.x,p.y,55,p.damage,p.owner,false,p);e.remove(p);}return true;
 }
 if(p.mode==='ironEmitter'||p.mode==='microEmitter'){
  const iron=p.mode==='ironEmitter',count=iron?8+2*(r-1):6+r,duration=iron?1.5:1;
  while((p.emissions||0)<count&&(p.emissions||0)*duration/count<=p.age){
   p.emissions=(p.emissions||0)+1;const a=e.random()*Math.PI*2;
   if(iron){const q=spawnChild(e,p,'ironChip',Math.cos(a)*560,Math.sin(a)*560,p.damage*.20);q.maxAge=.60;}
   else {const radius=Math.sqrt(e.random())*240,x=p.x+Math.cos(a)*radius,seedY=p.y+Math.sin(a)*radius;
    const y=seedY;
    const secondary=(1+passiveTuning(passiveRank(u,'MP01')).gourdSecondary)*(1+(p.effectBoost||0)*.5);
    const q=spawnChild(e,p,'microWait',0,0,p.damage*14/48*secondary,55);q.x=x;q.y=y;q.maxAge=undefined;q.fuseAt=.04+e.random()*.16;}
  }
  if(p.age>=duration)e.remove(p);return true;
 }
 // Old in-flight saves may still carry the arc's former phase-through plan.
 if(p.mode==='waveArc')p.phaseMode=undefined;
 if(['waveRing','waveBagua'].includes(p.mode)){
  if(p.mode==='waveRing'||p.age>=(p.plannedTime||.5)){
   const t=p.targetPoint!,g=skillGeometry(s,r,t.x,t.y,-rad(u.angle),u.lastPower,undefined,undefined,geometryBoost(u,s,p.effectBoost));
   strikeGeometry(e,p,g);e.remove(p);return true;
  }
 }
 if(p.mode==='return'&&p.returning&&!e.inWaterfall(p)){
  p.returnAge=(p.returnAge||0)+dt;
  const a=Math.atan2(p.vy,p.vx),dest=Math.atan2((u.y-u.h*.5)-p.y,u.x-p.x),delta=Math.atan2(Math.sin(dest-a),Math.cos(dest-a)),next=a+clamp(delta,-2.5*dt,2.5*dt),speed=Math.max(400,Math.hypot(p.vx,p.vy));
  p.vx=Math.cos(next)*speed;p.vy=Math.sin(next)*speed;p.gravityScale=.12;
  if(p.returnAge>5||Math.hypot(p.x-u.x,p.y-u.y+u.h*.5)<25){e.remove(p);return true;}
 }
 return false;
}

export function gateCandidate(e:Engine,u=e.active){
 return gateSource(e,u);
}
export function useGate(e:Engine,u=e.active){
 const plan=e.gateResolution(u);if(!plan.ok||!plan.spot||!plan.to||!u){e.message(plan.reason);return false;}
 const {to,spot}=plan,token=`${e.b.round}:${e.b.teamEnds[0]}`;
 e.skillSound('gate-depart',u.id,'M09',e.b.round);
 const {x,y}=spot,fromPoint={x:u.x,y:u.y};u.x=x;u.y=y;u.vx=u.vy=0;u.airborne=false;u.jumping=false;delete u.moveTarget;u.gateTurn=token;
 const r=to.rank,caster=e.unit(to.owner),boost=caster?(1+passiveTuning(passiveRank(caster,'MP01')).geometry)*(1+(to.effectBoost||0)):1;
 if(r>=2)u.focus=Math.min(u.maxFocus,u.focus+u.maxFocus*(r===2?.08:.10)*boost);
 const hpBefore=u.hp;if(r>=4)u.hp=Math.min(u.maxHp,u.hp+u.maxHp*(r===4?.06:.08)*boost);
 healed(e.b,u,to.owner,hpBefore,'M09');(globalThis as any).HonroObjectiveContributions?.movement(e.b,u,to.owner,fromPoint,{x,y});
 if(r>=6)u.moveLeft=Math.min(u.maxMove,u.moveLeft+u.maxMove*(r===6?.16:.24)*boost);
 if(r===8){u.arrivalGuard=e.b.teamEnds[1]+1;(u as any).honroArrivalGuardOwner=to.owner;}
 e.skillSound('gate-arrive',u.id,'M09',e.b.round);e.fx('ring',x,y,'#bbc4b5',28);e.emit('change');e.emit('save');return true;
}
export function tickRedesign(e:Engine,dt:number){
 const b=e.b;
 for(const u of b.units){
  if(u.eaterCapturedBy)continue;
  if(u.prepared&&u.prepared.expires<b.round)delete u.prepared;
  if(u.arrivalGuard!==undefined&&u.arrivalGuard<=b.teamEnds[1])delete u.arrivalGuard;
  if(u.slowed&&u.slowed.expires<b.round)delete u.slowed;
  const shove=u.shove;if(!shove)continue;shove.life-=dt;
  if(shove.life<=0||u.dead||Math.abs(u.vx)<20){delete u.shove;continue;}
  for(const v of b.units.filter(v=>!v.dead&&e.attackAllows(v,shove.owner,shove)&&v.side===u.side&&v.id!==u.id&&!shove.hit.includes(v.id))){
   if(Math.abs(v.x-u.x)>v.r+u.r||Math.abs(v.y-u.y)>(u.h+v.h)*.5)continue;
   shove.hit.push(v.id);e.hurt(v,shove.damage,shove.owner,false,undefined,undefined,'normal','A05',shove);e.impulse(v,u.vx*.70,-80);
   if(shove.remaining>1)v.shove={...shove,remaining:shove.remaining-1,damage:shove.damage*.70,hit:[...shove.hit],life:1};delete u.shove;break;
  }
 }
 for(const z of [...(b.stakes||[])]){
  // Old saves acquire a finite lifetime without consuming their remaining use.
  z.expires??=b.round+stakeDuration(z.skill,z.rank);
  if(z.expires!==undefined&&b.round>=z.expires){b.stakes=b.stakes!.filter(s=>s.id!==z.id);continue;}
  if(z.skill==='M09')continue;
  const caster=e.unit(z.owner);if(!caster)continue;const boost=(1+passiveTuning(passiveRank(caster,'MP01')).geometry)*(1+(z.effectBoost||0)),trigger=stakeRanges(e,z).trigger;
  const nearby=b.units.filter(u=>!u.dead&&!u.eaterCapturedBy&&(z.skill==='M10'?u.side===z.side||((u as any).honroAlly&&z.side===0):enemy(z,u))&&Math.min(Math.hypot(u.x-z.x,u.y-z.y),Math.hypot(u.x-z.x,u.y-u.h*.5-z.y))<trigger+u.r);
  const p={attackSide:z.attackSide,damageRoll:z.damageRoll,owner:z.owner,side:z.side,skill:z.skill,skillRank:z.rank,shot:z.shot,x:z.x,y:z.y,damage:z.damage,hit:[],id:z.id,vx:0,vy:0,prevVy:0,age:0,radius:3,blast:95,wind:0,mode:'stake',color:'#b9c4b1',bounces:0,pierces:0,apex:true,phase:0,body:false,returnX:z.x,returnY:z.y,trail:[],child:false,rolled:0} as Projectile;
  if(z.skill==='M07'||z.skill==='M08'){triggerOffensiveStake(e,z,nearby,p,boost);continue;}
  const available=z.skill==='M10'?nearby.filter(u=>z.usedRounds?.[u.id]!==b.round):nearby;
  if(!z.active&&available.length&&(z.skill==='M10'||z.lastTriggerRound!==b.round)){
   z.lastTriggerRound=b.round;const t=available[0];
   if(z.skill==='M10'){e.skillSound('heal',z.owner,z.skill,z.shot,`${z.id}:${b.round}`);z.usedRounds??={};for(const ally of available){z.usedRounds[ally.id]=b.round;const hpBefore=ally.hp;ally.hp=Math.min(ally.maxHp,ally.hp+ally.maxHp*(.06+.01*z.rank)*boost*(z.equipmentHealScale||1));healed(b,ally,z.owner,hpBefore,z.skill);ally.focus=Math.min(ally.maxFocus,ally.focus+ally.maxFocus*(.07+.01*z.rank)*boost);ally.moveLeft=Math.min(ally.maxMove,ally.moveLeft+ally.maxMove*(.12+.03*z.rank)*boost);e.fx('ring',ally.x,ally.y,'#bfcbb6',35);}}
   if(z.skill==='M99'){e.skillSound('trigger',z.owner,z.skill,z.shot,`${z.id}:${b.round}`);z.active=true;z.inside=[];z.crossed={};z.budgetTurns={};for(const v of b.units.filter(v=>enemy(z,v)&&Math.hypot(v.x-z.x,v.y-z.y)<220)){e.hurt(v,z.damage,z.owner,false,p,z);z.inside.push(v.id);}}
  }
  if(z.active){
   for(const u of b.units.filter(u=>enemy(z,u))){const d=Math.hypot(u.x-z.x,u.y-z.y),token=`${b.round}:${b.teamEnds[u.side]}`,was=z.inside!.includes(u.id);
    if(d<=220){u.slowed={factor:Math.min(.55,.45*boost),expires:b.round};if(!was)z.inside!.push(u.id);z.budgetTurns??={};if(z.budgetTurns[u.id]!==token){z.budgetTurns[u.id]=token;u.moveLeft*=1-Math.min(.45,.35*boost);}}
    else if(was){
     // Leaving is an event: repeated upward impulses would keep this unit airborne forever.
     z.inside!.splice(z.inside!.indexOf(u.id),1);if(z.crossed![u.id]!==token){z.crossed![u.id]=token;e.skillSound('trigger',z.owner,z.skill,z.shot,`${z.id}:${token}`);e.hurt(u,z.damage*22/35,z.owner,false,p,z);}
     if(!u.boss&&!u.fixed){e.impulse(u,(z.x-u.x)*2,-60);u.moveLeft=0;}else u.breaks=Math.max(1,u.breaks);
    }
   }
  }
 }
 if(e.active?.retreat&&e.active.moveLeft<=.5&&!e.settleBusy())e.finishAction(true);
}

export interface SkillPrediction extends Prediction {time:number;geometry?:SkillGeometry;contacts:Vec[];secondaryRadius?:number;secondaryPoint?:Vec;triggerRadius?:number;paths?:Vec[][];}
/** Replay the actual arrow step on an isolated battle: apex, curved return, LOS,
 * piercing, chains and split children cannot diverge into a second physics loop. */
function arrowPrediction(e:Engine,u:Unit,s:Skill,angle:number,power:number,representative=false,ignoreUnits=false):SkillPrediction{
 const b=structuredClone(e.b),Sim=e.constructor as new(b:Battle)=>Engine,sim=new Sim(b),actor=sim.unit(u.id)!;
 const wave=s.mode==='waveBounce',waveContacts:Vec[]=[],impact=sim.impact.bind(sim);
 if(wave)sim.impact=(p,h)=>{if(p.bounces>=1&&!gearHas(p,'da_stake')){p.x=h.x;p.y=h.y;sim.remove(p);}else{if(h.terrain)waveContacts.push({x:h.x,y:h.y});impact(p,h);}};
 const collision=sim.collision.bind(sim);let contact:Collision|null=null,stepContact:Collision|null=null,terminalContact:Collision|null=null,capture=true;
 sim.collision=(a,z,r,owner,ignored,units=true,...rest)=>{const h=collision(a,z,r,owner,ignored,ignoreUnits?false:units,...rest);if(capture&&h){stepContact=h;if(h.unit&&!contact)contact=h;}return h;};
 b.active=actor.id;b.side=0;b.phase='aim';if(!(b as any).keeperRitual?.zone)b.mode='practice';b.projectiles=[];b.volley=undefined;
 actor.loadout=[s.id];actor.focus=actor.maxFocus=10000;actor.cooldowns={};actor.acted=false;actor.dead=false;actor.retreat=false;
 // The guide represents this volley; later repeated volleys have the same launch path.
 actor.ranks.AP01=0;
 sim.grounded=()=>true;sim.canAct=()=>true;sim.fire(s.id,angle,power);
 let roots=[...b.projectiles];const primary=roots[Math.floor(roots.length/2)];
 if(representative&&primary){roots=[primary];b.projectiles=roots;if(s.id==='A04'){Object.assign(primary,e.projectileOrigin(u,s,angle),e.velocity(u,s,angle,power));primary.prevVy=primary.vy;}}
 const paths=new Map<number,Vec[]>();
 let tracked=primary;
 let time=0,apex:Vec|undefined;const origin=e.projectileOrigin(u,s,angle);
 for(const p of roots)paths.set(p.id,[{x:p.x,y:p.y}]);
 for(let i=0;i<1440&&b.projectiles.length;i++){
  for(const p of [...b.projectiles]){if(!b.projectiles.includes(p))continue;const wasApex=p.apex,wasSplit=representative&&p===tracked&&p.mode==='seekRain',nextId=b.nextId;capture=!representative||p===tracked;stepContact=null;sim.stepProjectile(p,STEP);
   if(p===tracked&&!b.projectiles.includes(p))terminalContact=stepContact;
   if(p===primary&&!wasApex&&p.apex)apex={x:p.x,y:p.apexY??p.y};
   if(!p.secondary&&(!representative||p===tracked)){const key=representative?primary.id:p.id,list=paths.get(key)||[...(p.trail.slice(0,1))];if(i%3===0||!b.projectiles.includes(p))list.push({x:p.x,y:p.y});paths.set(key,list);}
   // Keep all seven in the replay so their collisions and kills affect homing exactly as in combat.
   // Only the middle child's samples extend the visible parent path.
   if(wasSplit&&!b.projectiles.includes(p)){const children=b.projectiles.filter(q=>q.id>=nextId&&q.mode==='seekChild');if(children.length===7){tracked=children[3];contact=null;terminalContact=null;}}
  }time=(i+1)*STEP;
  // Later sibling impacts cannot change the representative path that has already ended.
  if(representative&&tracked&&!b.projectiles.includes(tracked))break;
 }
 const points=primary?paths.get(primary.id)||[origin]:[origin],last=points.at(-1)||origin;
 return {...last,unit:(contact as Collision|null)?.unit?.id,terrain:(terminalContact as Collision|null)?.terrain?.id,points,paths:[...paths.values()],time,contacts:waveContacts,apex,closest:99999};
}
/** Preview uses the same integrator, collision routine, restitution and geometry as the live shot. */
export function redesignPrediction(e:Engine,u:Unit,s:Skill,angle:number,power:number,representative=false,ignoreUnits=false):SkillPrediction|null{
 if(!s.redesigned)return null;
 if(s.mode==='waveBounce')return arrowPrediction(e,u,s,angle,power,false,ignoreUnits);
 if(s.cls==='archer')return arrowPrediction(e,u,s,angle,power,representative,ignoreUnits);
 if(s.cls!=='mage')return null;
 const r=u.ranks[s.id]||1,origin=e.projectileOrigin(u,s,angle),v=e.velocity(u,s,angle,power),points:Vec[]=[origin],contacts:Vec[]=[];
 const p={...origin,...v,wind:s.wind,gravityScale:s.gravity??1,drag:dragFor(s),skill:s.id,mode:s.mode,owner:u.id,side:u.side,radius:6,bounces:0} as Projectile;
 let age=0,time=0,closest=99999,apex:Vec|undefined,contact:Collision|null=null,terrainAtEnd=false;const arc=s.mode==='waveArc',ring=s.mode==='waveRing',bagua=s.mode==='waveBagua',ice=s.mode==='gourdIce';
 if(ring){const center=at(u);return {...center,points:[],time:0,closest,contacts,geometry:skillGeometry(s,r,center.x,center.y,-rad(angle),power,undefined,undefined,geometryBoost(u,s))};}
 for(let i=0;i<Math.ceil((ice?iceGourdFuse(power):8)/STEP);i++){
  age+=STEP;time=age;if(ice&&age>=iceGourdFuse(power))break;
  const m=e.advanceProjectile(p,STEP);if(p.vy<0&&m.vy>=0)apex={x:p.x,y:p.y};p.vx=m.vx;p.vy=m.vy;time=age;
  const h=e.projectileCollision(p,m,6,p.owner,[],!ignoreUnits&&!s.mode.startsWith('stake')&&!['waveTriangle','waveBagua'].includes(s.mode),[],true,p);if(h)contact=h;
  if(h){p.x=h.x;p.y=h.y;
   if(h.keeperRitual==='echo'&&!(p as any).keeperReturned){const q=(e.b as any).keeperRitual,velocity=keeperEchoVelocity({x:p.vx,y:p.vy},q.zone.direction);p.vx=velocity.x;p.vy=velocity.y;p.x=h.x+q.zone.direction*(p.radius+12);p.owner=q.owner;p.side=e.unit(q.owner)!.side;(p as any).keeperReturned=true;points.push({x:p.x,y:p.y});continue;}
   if(ice||s.mode==='waveBounce'||s.mode==='waveTriangle'){
    if(!ice&&!h.terrain)break;contacts.push({x:h.x,y:h.y});reflect(p,h,ice?(h.unit?.72:.64):.84);
    if(s.mode==='waveTriangle'&&contacts.length>=2){terrainAtEnd=!!h.terrain;break;}
    if(!ice&&p.bounces>Math.round(lerpRank(2,7,r))){terrainAtEnd=!!h.terrain;break;}
   }else{terrainAtEnd=!!h.terrain;break;}
  }else{p.x=m.x;p.y=m.y;}
  if(i%3===0)points.push({x:p.x,y:p.y});if(p.y>e.b.height+100||p.x<0||p.x>e.b.width||p.y< -1700)break;
 }
 points.push({x:p.x,y:p.y});
 const reverse=arc&&terrainAtEnd&&!!u.equipmentIds?.includes('itm_da_08'),geometry=arc||bagua||s.mode==='waveTriangle'?skillGeometry(s,r,p.x+(reverse?(contact?.n.x||0)*2:0),p.y+(reverse?(contact?.n.y||0)*2:0),arc?Math.atan2(p.vy,p.vx)+(reverse?Math.PI:0):-rad(angle),power,contacts,origin,geometryBoost(u,s)):undefined;if(reverse&&geometry){geometry.span*=1.2;geometry.x=geometry.impact!.x;geometry.y=geometry.impact!.y;}
 const secondaryPoint=s.id==='M05'?skyStrikePoint(e,{x:p.x,y:p.y},u.id):s.id==='M07'?{x:p.x,y:p.y-20}:undefined;
 const ranges=s.branch==='stake'?stakeRanges(e,{id:0,skill:s.id,owner:u.id,side:u.side,x:p.x,y:p.y,rank:r,damage:0,shot:0,effectBoost:jucheonBoost(u,s)}):undefined;
 return {x:p.x,y:p.y,unit:contact?.unit?.id,terrain:contact?.terrain?.id,terrainAtEnd,points,time,closest,contacts,apex,geometry,secondaryPoint,triggerRadius:ranges&&s.id!=='M09'?ranges.trigger:undefined,secondaryRadius:s.branch==='gourd'?(s.id==='M04'?260+10*(r-1):s.id==='M13'?240:e.effective(s,u).radius):ranges?.effect};
}
