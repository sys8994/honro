import {jucheonBoost} from './combatPassives';
import type {Battle,Unit,Projectile,Skill,Vec,Profile} from './types';
import type {Engine,Collision,Prediction} from './engine';
import {dragFor} from './physics';
import {SKILLS} from './data';
import {clamp,rad,STEP,terrainRectIntersects} from './math';
import {passiveRank,baseSkill,sanitizeLoadout,applyHero,criticalStats,stakeDuration} from './progression';

export const SKILL_REVISION=1;
export const ICE_GOURD_FUSE=3.2;
export const iceGourdFuse=(power:number)=>ICE_GOURD_FUSE+3.2*clamp(power,0,1);
export const newSkill=(p:Pick<Projectile,'skill'>)=>!!SKILLS[p.skill]?.redesigned;
const rank=(p:Projectile)=>p.skillRank||1;
const at=(u:Unit)=>({x:u.x,y:u.y-u.h*.5});
const enemy=(p:Pick<Projectile,'side'>,u:Unit)=>!u.dead&&u.side!==p.side&&u.side!==2;
const lerpRank=(a:number,b:number,r:number)=>a+(b-a)*(r-1)/7;
export function mainBranch(u:Pick<Unit,'ranks'>,cls='archer'){
 const sums:Record<string,number>={};for(const [id,r] of Object.entries(u.ranks)){const s=SKILLS[id];if(s?.cls===cls&&s.branch&&!s.passive)sums[s.branch]=(sums[s.branch]||0)+r;}
 const entries=Object.entries(sums).sort((a,b)=>b[1]-a[1]);return entries.length&&entries[0][1]>0&&entries[0][1]>(entries[1]?.[1]||0)?entries[0][0]:null;
}
/** Retained for old callers; no single-tree specialization remains. */
export function specialty(u:Unit,s:Skill){return 0;}
export function trajectoryMultiplier(p:Projectile,u:Unit,hit:Vec){
 const s=SKILLS[p.skill];if(!s?.redesigned||s.cls!=='archer'||p.secondary)return 1;
 const extra=.025*(passiveRank(u,'AP04')+specialty(u,s));
 if(s.branch==='distance')return 1+((s.id==='A99'?.60:.40)+extra+(p.preparedRank?lerpRank(.08,.22,p.preparedRank):0))*clamp(Math.abs(hit.x-(p.launchX??p.x))/1800,0,1);
 if(s.branch==='drop')return 1+((s.id==='A15'?.55:s.id==='A13'?.35:.45)+extra)*clamp(Math.max(0,hit.y-(p.apexY??p.launchY??p.y))/900,0,1);
 if(s.branch==='speed')return 1+((s.id==='A08'?.35:.45)+extra)*clamp((Math.hypot(p.vx,p.vy)-500)/650,0,1);
 return 1;
}
export function critProfile(p:Projectile,u:Unit){
 const r=rank(p),id=p.skill,base=criticalStats(u.cls,u.level,u.ranks);
 return {chance:Math.min(.80,(u.critChance??base.critChance)+(id==='A14'?lerpRank(.18,.39,r):id==='A99'?lerpRank(.25,.39,r):0)+(p.preparedRank?lerpRank(.06,.20,p.preparedRank):0)),
  multiplier:Math.min(3.5,(u.critMultiplier??base.critMultiplier)+(id==='A14'?lerpRank(.20,.55,r):id==='A99'?lerpRank(.50,.85,r):0))};
}
export function redrawDamage(e:Engine,p:Projectile,u:Unit,target:Unit,amount:number,point:Vec,direct:boolean,critical=false){
 if(!newSkill(p))return amount;
 if(u.cls==='archer'&&direct){
  amount*=trajectoryMultiplier(p,u,point);
  if(p.skill==='A09'&&p.turned)amount*=1+lerpRank(.30,.65,rank(p));
  if(p.preparedRank)amount/=Math.max(.3,1-clamp(target.armor,0,.7))*Math.max(.3,1-clamp(target.armor-lerpRank(.04,.15,p.preparedRank),0,.7));
  if(p.skill==='A99'&&critical&&Math.abs(point.x-(p.launchX??point.x))>=1200){
   if(target.boss)amount*=1+.25*(1-target.hp/target.maxHp);
   else if(target.hp-amount*(1-target.armor)<=target.maxHp*lerpRank(.12,.22,rank(p)))amount=Math.max(amount,(target.hp+target.shield+1)/Math.max(.3,1-target.armor));
  }
 }
 const key=`redesign:${p.shot}:${p.skill}:${target.id}`;
 if(p.skill==='A15'&&p.child){const n=e.b.shotDamage[key]||0;e.b.shotDamage[key]=n+1;amount*=([1,.70,.50,.35][n]||0);}
 if(p.secondary){
  const limit=p.skill==='A08'?(p.rootDamage||p.damage)*.65:p.skill==='M13'?3:2;
  const used=e.b.shotDamage[key]||0;
  if(p.skill==='A08'){amount=Math.max(0,Math.min(amount,limit-used));e.b.shotDamage[key]=used+amount;}
  else {if(used>=limit)return 0;e.b.shotDamage[key]=used+1;}
 }
 return amount;
}
export function recordRedesignDamage(e:Engine,p:Projectile|undefined,src:Unit,target:Unit,actual:number){
 if(e.b.cast?.shot===p?.shot&&e.b.cast?.owner===src.id&&enemy({side:src.side},target))e.b.cast.enemyDamage+=actual;
 if(!p||!newSkill(p)||p.skill!=='A06'||!enemy(p,target))return;
 const r=rank(p);for(const [field,max,fraction,cap] of [['hp','maxHp',lerpRank(.05,.12,r),.15],['focus','maxFocus',lerpRank(.03,.07,r),.18]] as const){
  const key=`recover:${p.shot}:${field}`,used=e.b.shotDamage[key]||0,n=Math.min(actual*fraction,src[max]*cap-used,src[max]-src[field]);
  src[field]+=Math.max(0,n);e.b.shotDamage[key]=used+Math.max(0,n);
 }
 e.emit('fx',{name:'inkLine',x:p.x,y:p.y,x2:src.x,y2:src.y-src.h*.5,color:'#bfc9c6',size:1});
}
export function migrateEnemySkills(u:Unit){
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
 for(const cls of ['archer','mage','knight'] as const)sanitizeLoadout(p,cls);
 return p;
}
export function initRedesignCast(e:Engine,s:Skill,u:Unit,actualKiSpent=e.manaCost(s,u)){
 if(!s.redesigned)return;
 e.b.cast={owner:u.id,skill:s.id,shot:e.b.shot,cost:actualKiSpent,enemyDamage:0};
 if(u.prepared&&u.prepared.expires<e.b.round)delete u.prepared;
 const roots=e.b.projectiles.filter(p=>p.owner===u.id&&p.shot===e.b.shot);
 for(const p of roots){if(s.id==='M02')p.fuseAt=iceGourdFuse(u.lastPower);p.apexY=p.y;p.rootDamage=p.damage;if(s.branch==='distance'&&s.id!=='A10'&&u.prepared)p.preparedRank=u.prepared.rank;}
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
  if(r&&cast.enemyDamage===0&&['gourd','wave'].includes(s.branch||'')){u.focus=Math.min(u.maxFocus,u.focus+cast.cost*lerpRank(.18,.46,r));e.fx('text',u.x,u.y-u.h-14,'#becbc6',14,'회기');}
 }
 if(b.mode!=='practice'&&reviewed&&cast?.owner===u.id&&SKILLS[cast.skill]?.cls==='archer'&&cast.skill!=='A10'&&passiveRank(u,'AP03')&&!u.dead){
  u.retreat=true;u.moveLeft=u.maxMove*(.08+.04*passiveRank(u,'AP03'));b.phase='aim';b.cast=undefined;b.resolveAge=0;e.message('이탈보 · 이동/점프만 가능 · 대기로 종료');e.emit('change');e.emit('save');return true;
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
 const g:SkillGeometry={kind,x,y,radius:kind==='arc'?150:kind==='ring'?180+720*power:220+(r-1)*10,thickness:(kind==='arc'?30+2*(r-1):kind==='ring'?34+16*(r-1)/7:20+2*(r-1))*boost,angle,span:rad(52+6*(r-1))};
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
const geometryBoost=(u:Unit,s:Skill,boost=jucheonBoost(u,s))=>(1+passiveRank(u,'MP01')*.02)*(1+Math.min(.05,boost/3));
function emitGeometry(e:Engine,g:SkillGeometry){
 // Serialize the exact hit shape as one event; renderer does no independent geometry reconstruction.
 e.emit('fx',{name:'skillGeometry',x:g.x,y:g.y,color:'#ced4cd',text:JSON.stringify(g),size:g.radius});
}
function strikeGeometry(e:Engine,p:Projectile,g:SkillGeometry,directTarget?:Unit){
 emitGeometry(e,g);
 e.emit('sound',{name:'qiWave'});
 for(const u of e.b.units.filter(u=>enemy(p,u))){const h=geometryHits(g,u);let amount=p.damage*Math.max(h.count,u.id===directTarget?.id?1:0);
  if(g.kind==='triangle'&&!h.count&&h.interior)amount=p.damage*16/38;
  if(g.kind==='ring')amount*=Math.max(.28,220/Math.max(220,g.radius));
  if(g.kind==='bagua'&&h.center)amount+=p.damage*62/34;
  if(amount)e.hurt(u,amount,p.owner,false,p,at(u));
 }
}
function reflect(p:Projectile,h:Collision,restitution=.84){const dot=p.vx*h.n.x+p.vy*h.n.y;p.vx=(p.vx-2*dot*h.n.x)*restitution;p.vy=(p.vy-2*dot*h.n.y)*restitution;p.x=h.x+h.n.x*(p.radius+1);p.y=h.y+h.n.y*(p.radius+1);p.bounces++;}
function spawnChild(e:Engine,p:Projectile,mode:string,vx:number,vy:number,damage:number,blast=0){
 const q:Projectile={...p,id:e.b.nextId++,mode,vx,vy,prevVy:vy,damage,blast,age:0,child:true,secondary:true,apex:true,hit:[],trail:[],bounces:0,pierces:0,fuseAt:undefined,phaseMode:undefined,gravityScale:1,drag:.025,radius:3,maxAge:.5};e.b.projectiles.push(q);return q;
}
function gourdBurst(e:Engine,p:Projectile){
 const u=e.unit(p.owner)!;const s=SKILLS[p.skill],r=rank(p),secondary=(1+passiveRank(u,'MP01')*.03)*(1+(p.effectBoost||0)*.5);
 if(p.mode==='gourdSky'){
  p.mode='skyWait';p.targetPoint={x:p.x,y:p.y};p.vx=p.vy=0;p.age=0;p.fuseAt=undefined;e.emit('fx',{name:'inkLine',x:p.x,y:p.y-220,x2:p.x,y2:p.y,color:'#a8bbc6',size:1});return;
 }
 e.blast(p.x,p.y,p.blast,p.damage,p.owner,false,p);
 if(p.mode==='gourdFire'||p.mode==='gourdIce'){
  const ice=p.mode==='gourdIce',count=5+r;
  for(let i=0;i<count;i++){const a=(i+.5)*Math.PI*2/count+(e.random()-.5)*.35;const q=spawnChild(e,p,ice?'frostChip':'fireChip',Math.cos(a)*330,Math.sin(a)*330,p.damage*(ice?.16:.18)*secondary,10);q.maxAge=.48;}
  if(ice)for(const t of e.b.units.filter(t=>enemy(p,t)&&Math.hypot(t.x-p.x,t.y-t.h*.5-p.y)<p.blast+t.r))t.slowed={factor:lerpRank(.20,.35,r),expires:e.b.round+1};
 }
 if(p.mode==='gourdThunder')for(const t of e.b.units.filter(t=>enemy(p,t)&&Math.hypot(t.x-p.x,t.y-t.h*.5-p.y)<=260+10*(r-1))){
  e.emit('fx',{name:'lightningBolt',x:p.x,y:p.y,x2:t.x,y2:t.y-t.h*.5,color:'#a8cfff',size:2.8});e.hurt(t,p.damage*.45*secondary,p.owner,false,{...p,secondary:false},p);
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
 const b=e.b;b.stakes??=[];const floor=h.n.y<-.3?h.y:e.surface(p.x,p.y-3,b.height)?.y;if(floor===undefined){e.remove(p);return;}
 const all=b.stakes;if(p.skill==='M09'){const gates=all.filter(s=>s.skill==='M09'&&s.side===p.side);if(!gates.length){const u=e.unit(p.owner)!;const home=e.surface(u.x,u.y-8,u.y+80);if(home)b.stakes.push({id:b.nextId++,skill:p.skill,owner:p.owner,side:p.side,x:u.x,y:home.y,rank:rank(p),damage:0,shot:p.shot,effectBoost:p.effectBoost,expires:b.round+stakeDuration(p.skill,rank(p))});}else if(gates.length>=2)b.stakes=all.filter(s=>s.id!==gates[0].id);}
 b.stakes.push({id:b.nextId++,skill:p.skill,owner:p.owner,side:p.side,x:p.x,y:floor,rank:rank(p),damage:p.damage,shot:p.shot,effectBoost:p.effectBoost,expires:b.round+stakeDuration(p.skill,rank(p))});
 e.fx('spark',p.x,floor,'#a89b7f',15);e.remove(p);
}

/** Hook only redesigned impacts; collision detection and integration remain in Engine. */
export function redesignImpact(e:Engine,p:Projectile,h:Collision){
 if(!newSkill(p))return false;
 const s=SKILLS[p.skill],u=e.unit(p.owner)!,r=rank(p);p.x=h.x;p.y=h.y;
 if(p.secondary){if(h.unit&&enemy(p,h.unit)){e.hurt(h.unit,p.damage,p.owner,false,p,h);if(p.mode==='frostChip')h.unit.slowed={factor:lerpRank(.20,.35,r),expires:e.b.round+1};}e.remove(p);return true;}
 if(p.mode==='waveArc'){
  strikeGeometry(e,p,skillGeometry(s,r,h.x,h.y,Math.atan2(p.vy,p.vx),u.lastPower,undefined,undefined,geometryBoost(u,s,p.effectBoost)),h.unit);e.remove(p);return true;
 }
 if(p.mode==='qiPulse'){
  e.blast(p.x,p.y,p.blast,p.damage,p.owner,false,p);e.emit('sound',{name:'qiWave'});e.remove(p);return true;
 }
 if(s.branch==='stake'){if(h.terrain)placeStake(e,p,h);return true;}
 if(s.branch==='gourd'){
  if(p.mode==='gourdIce'){reflect(p,h,h.unit?.72:.64);e.fx('ring',p.x,p.y,'#b5c9cb',14);e.emit('sound',{name:'ceramic'});return true;}
  gourdBurst(e,p);return true;
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
  if(p.mode==='push'){e.impulse(target,Math.sign(p.vx)*280,-130);target.shove={owner:p.owner,damage:(before-target.hp)*.18,remaining:Math.round(lerpRank(2,5,r)),hit:[target.id],life:1.5};}
  if(p.mode==='pierce'&&p.pierces<[1,1,2,2,3,3,4,5][r-1]){p.pierces++;p.damage*=.88;return true;}
  if(p.mode==='return'&&p.hit.length<=1)return true;
  if(p.mode==='chainArrow'&&(p.chain||0)<Math.round(lerpRank(1,5,r))){
   const next=e.b.units.filter(t=>enemy(p,t)&&!p.hit.includes(t.id)&&Math.hypot(t.x-p.x,t.y-t.h*.5-p.y)<=260).sort((a,b)=>Math.hypot(a.x-p.x,a.y-a.h*.5-p.y)-Math.hypot(b.x-p.x,b.y-b.h*.5-p.y))[0];
   if(next){const dx=next.x-p.x,dy=next.y-next.h*.5-p.y,d=Math.hypot(dx,dy);p.vx=dx/d*900;p.vy=dy/d*900;p.damage*=.72;p.chain=(p.chain||0)+1;return true;}
  }
 }
 if(h.terrain){e.damageTerrain(h.terrain,p.damage*s.terrain,0,p.owner);
  e.emit('sound',{name:'arrowhit'});
  if(p.mode==='pierce'&&h.terrain.mat==='wood'&&h.terrain.w<=90&&p.pierces<[1,1,2,2,3,3,4,5][r-1]){p.pierces++;p.damage*=.88;p.x+=Math.sign(p.vx)*(h.terrain.w+8);return true;}
 }
 if(p.mode==='breakArrow'){
  for(const t of e.b.units.filter(t=>!t.dead&&t.id!==h.unit?.id&&Math.hypot(t.x-p.x,t.y-t.h*.5-p.y)<70+t.r)){e.hurt(t,p.damage*.55,p.owner,false,p,h);e.impulse(t,Math.sign(t.x-p.x)*230,-110);}
  if(h.unit)e.impulse(h.unit,Math.sign(p.vx)*280,-120);e.fx('spark',p.x,p.y,'#aca799',30);
 }
 if(p.mode==='ironFlower'){p.mode='ironEmitter';p.age=0;p.emissions=0;p.vx=p.vy=0;p.x+=h.n.x*9;p.y+=h.n.y*9;return true;}
 e.fx('spark',p.x,p.y,p.color,18);e.remove(p);return true;
}

export function splitSeven(e:Engine,p:Projectile){
 const targets=e.b.units.filter(u=>enemy(p,u)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
 for(let i=0;i<7;i++){const target=targets.length?targets[i%targets.length]:undefined,q=spawnChild(e,p,'seekChild',(i-3)*70+p.vx*.2,250,p.damage);q.secondary=false;q.maxAge=8;q.targetId=target?.id;q.apexY=p.apexY??p.y;}
 e.emit('sound',{name:'split'});e.remove(p);
}
export function redesignStep(e:Engine,p:Projectile,dt:number){
 if(!newSkill(p))return false;
 const s=SKILLS[p.skill],u=e.unit(p.owner)!,r=rank(p);p.apexY=Math.min(p.apexY??p.y,p.y);
 if(p.maxAge&&p.age>=p.maxAge){e.remove(p);return true;}
 if(p.mode==='gourdIce'&&p.age>=(p.fuseAt??iceGourdFuse(u.lastPower))){gourdBurst(e,p);return true;}
 if(p.mode==='skyWait'){
  if(p.age>=.35){const target=p.targetPoint!,start={x:target.x,y:Math.min(-170,target.y-600)},hit=e.collision(start,target,3,p.owner,[],false);const end=hit||target;
   e.emit('fx',{name:'lightningBolt',x:start.x,y:start.y,x2:end.x,y2:end.y,color:'#a8cfff',size:5});e.blast(end.x,end.y,p.blast,p.damage,p.owner,false,p);e.remove(p);
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
    const secondary=(1+passiveRank(u,'MP01')*.03)*(1+(p.effectBoost||0)*.5);
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
 if(p.mode==='return'&&p.returning){
  p.returnAge=(p.returnAge||0)+dt;
  const a=Math.atan2(p.vy,p.vx),dest=Math.atan2((u.y-u.h*.5)-p.y,u.x-p.x),delta=Math.atan2(Math.sin(dest-a),Math.cos(dest-a)),next=a+clamp(delta,-2.5*dt,2.5*dt),speed=Math.max(400,Math.hypot(p.vx,p.vy));
  p.vx=Math.cos(next)*speed;p.vy=Math.sin(next)*speed;p.gravityScale=.12;
  if(p.returnAge>5||Math.hypot(p.x-u.x,p.y-u.y+u.h*.5)<25){e.remove(p);return true;}
 }
 return false;
}

export function gateCandidate(e:Engine,u=e.active){
 if(!u||u.dead||u.side!==0||u.retreat)return undefined;const gates=(e.b.stakes||[]).filter(s=>s.skill==='M09'&&s.side===u.side&&(s.expires===undefined||s.expires>e.b.round));if(gates.length!==2)return undefined;
 return gates.find(s=>Math.hypot(u.x-s.x,u.y-s.y)<=55&&Math.abs(u.y-s.y)<50);
}
export function useGate(e:Engine,u=e.active){
 const from=gateCandidate(e,u);if(!from||!u||!e.canAct())return false;
 const token=`${e.b.round}:${e.b.teamEnds[0]}`;if(u.gateTurn===token)return false;
 const to=e.b.stakes!.find(s=>s.skill==='M09'&&s.side===u.side&&s.id!==from.id)!;
 // Feet stand on the exact-x support, as in walking and scripted placement.
 // A body's lower corners overlap a slope; that contact is not an arrival wall.
 const spot=[0,-24,24,-48,48,-72,72,-96,96].map(offset=>{const x=clamp(to.x+offset,25,e.b.width-25),floor=e.surface(x,to.y-80,to.y+100);return floor?{x,y:floor.y,support:floor.t}:null;}).find(v=>v&&!e.b.terrain.some(t=>!t.broken&&!t.oneWay&&t!==v.support&&terrainRectIntersects(t,v.x-u.r,v.y-u.h,u.r*2,u.h-2,.1))&&!e.b.units.some(t=>!t.dead&&t.id!==u.id&&Math.abs(t.x-v.x)<t.r+u.r&&Math.abs(t.y-v.y)<u.h));
 if(!spot){e.message('도착 진목 주변에 설 자리가 없습니다.');return false;}
 const {x,y}=spot;u.x=x;u.y=y;u.vx=u.vy=0;u.airborne=false;u.jumping=false;delete u.moveTarget;u.gateTurn=token;
 const r=to.rank,caster=e.unit(to.owner),boost=caster?(1+passiveRank(caster,'MP01')*.02)*(1+(to.effectBoost||0)):1;
 if(r>=2)u.focus=Math.min(u.maxFocus,u.focus+u.maxFocus*(r===2?.08:.10)*boost);
 if(r>=4)u.hp=Math.min(u.maxHp,u.hp+u.maxHp*(r===4?.06:.08)*boost);
 if(r>=6)u.moveLeft=Math.min(u.maxMove,u.moveLeft+u.maxMove*(r===6?.16:.24)*boost);
 if(r===8)u.arrivalGuard=e.b.teamEnds[1]+1;
 e.fx('ring',x,y,'#bbc4b5',28);e.emit('change');e.emit('save');return true;
}
export function tickRedesign(e:Engine,dt:number){
 const b=e.b;
 for(const u of b.units){
  if(u.prepared&&u.prepared.expires<b.round)delete u.prepared;
  if(u.arrivalGuard!==undefined&&u.arrivalGuard<=b.teamEnds[1])delete u.arrivalGuard;
  if(u.slowed&&u.slowed.expires<b.round)delete u.slowed;
  const shove=u.shove;if(!shove)continue;shove.life-=dt;
  if(shove.life<=0||u.dead||Math.abs(u.vx)<20){delete u.shove;continue;}
  for(const v of b.units.filter(v=>!v.dead&&v.side===u.side&&v.id!==u.id&&!shove.hit.includes(v.id))){
   if(Math.abs(v.x-u.x)>v.r+u.r||Math.abs(v.y-u.y)>(u.h+v.h)*.5)continue;
   shove.hit.push(v.id);e.hurt(v,shove.damage,shove.owner);e.impulse(v,u.vx*.70,-80);
   if(shove.remaining>1)v.shove={...shove,remaining:shove.remaining-1,damage:shove.damage*.70,hit:[...shove.hit],life:1};delete u.shove;break;
  }
 }
 for(const z of [...(b.stakes||[])]){
  // Old saves acquire a finite lifetime without consuming their remaining use.
  z.expires??=b.round+stakeDuration(z.skill,z.rank);
  if(z.expires!==undefined&&b.round>=z.expires){b.stakes=b.stakes!.filter(s=>s.id!==z.id);continue;}
  if(z.skill==='M09')continue;
  const caster=e.unit(z.owner);if(!caster)continue;const boost=(1+passiveRank(caster,'MP01')*.02)*(1+(z.effectBoost||0)),trigger=45*Math.min(1.25,boost);
  const nearby=b.units.filter(u=>!u.dead&&(z.skill==='M10'?u.side===z.side||((u as any).honroAlly&&z.side===0):enemy(z,u))&&Math.min(Math.hypot(u.x-z.x,u.y-z.y),Math.hypot(u.x-z.x,u.y-u.h*.5-z.y))<trigger+u.r);
  const p={owner:z.owner,side:z.side,skill:z.skill,skillRank:z.rank,shot:z.shot,x:z.x,y:z.y,damage:z.damage,hit:[],id:z.id,vx:0,vy:0,prevVy:0,age:0,radius:3,blast:95,wind:0,mode:'stake',color:'#b9c4b1',bounces:0,pierces:0,apex:true,phase:0,body:false,returnX:z.x,returnY:z.y,trail:[],child:false,rolled:0} as Projectile;
  const available=z.skill==='M10'?nearby.filter(u=>z.usedRounds?.[u.id]!==b.round):nearby;
  if(!z.active&&available.length&&(z.skill==='M10'||z.lastTriggerRound!==b.round)){
   z.lastTriggerRound=b.round;const t=available[0];
   if(z.skill==='M10'){z.usedRounds??={};for(const ally of available){z.usedRounds[ally.id]=b.round;ally.hp=Math.min(ally.maxHp,ally.hp+ally.maxHp*(.06+.01*z.rank)*boost);ally.focus=Math.min(ally.maxFocus,ally.focus+ally.maxFocus*(.07+.01*z.rank)*boost);ally.moveLeft=Math.min(ally.maxMove,ally.moveLeft+ally.maxMove*(.12+.03*z.rank)*boost);e.fx('ring',ally.x,ally.y,'#bfcbb6',35);}}
   if(z.skill==='M07')e.blast(z.x,z.y-20,95,z.damage,z.owner,false,p);
   if(z.skill==='M08'){
    e.hurt(t,z.damage,z.owner,false,p,z);
    for(const v of b.units.filter(v=>enemy(z,v)&&Math.hypot(v.x-z.x,v.y-v.h*.5-z.y)<(260+15*(z.rank-1))*boost)){
     if(v.fixed){v.breaks=Math.max(v.breaks,1);continue;}
     const dx=z.x-v.x,dy=z.y-v.y,d=Math.max(1,Math.hypot(dx,dy)),length=Math.min(d,(130+15*(z.rank-1))*boost);
     // Physical impulse uses integrateBody's swept body/feet collisions on subsequent ticks.
     e.impulse(v,dx/d*Math.min(480,length*2.4),-Math.min(180,length));
    }
   }
   if(z.skill==='M99'){z.active=true;z.inside=[];z.crossed={};z.budgetTurns={};for(const v of b.units.filter(v=>enemy(z,v)&&Math.hypot(v.x-z.x,v.y-z.y)<220)){e.hurt(v,z.damage,z.owner,false,p,z);z.inside.push(v.id);}}
  }
  if(z.active){
   for(const u of b.units.filter(u=>enemy(z,u))){const d=Math.hypot(u.x-z.x,u.y-z.y),token=`${b.round}:${b.teamEnds[u.side]}`,was=z.inside!.includes(u.id);
    if(d<=220){u.slowed={factor:Math.min(.55,.45*boost),expires:b.round};if(!was)z.inside!.push(u.id);z.budgetTurns??={};if(z.budgetTurns[u.id]!==token){z.budgetTurns[u.id]=token;u.moveLeft*=1-Math.min(.45,.35*boost);}}
    else if(was){if(z.crossed![u.id]!==token){z.crossed![u.id]=token;e.hurt(u,z.damage*22/35,z.owner,false,p,z);}
     if(!u.boss&&!u.fixed){e.impulse(u,(z.x-u.x)*2,-60);u.moveLeft=0;}else u.breaks=Math.max(1,u.breaks);
    }
   }
  }
 }
 if(e.active?.retreat&&e.active.moveLeft<=.5&&!e.settleBusy())e.finishAction(true);
}

export interface SkillPrediction extends Prediction {time:number;geometry?:SkillGeometry;contacts:Vec[];secondaryRadius?:number;paths?:Vec[][];}
/** Replay the actual arrow step on an isolated battle: apex, curved return, LOS,
 * piercing, chains and split children cannot diverge into a second physics loop. */
function arrowPrediction(e:Engine,u:Unit,s:Skill,angle:number,power:number,representative=false,ignoreUnits=false):SkillPrediction{
 const b=structuredClone(e.b),Sim=e.constructor as new(b:Battle)=>Engine,sim=new Sim(b),actor=sim.unit(u.id)!;
 const collision=sim.collision.bind(sim);let contact:Collision|null=null,capture=true;
 sim.collision=(a,z,r,owner,ignored,units=true,...rest)=>{const h=collision(a,z,r,owner,ignored,ignoreUnits?false:units,...rest);if(capture&&h?.unit&&!contact)contact=h;return h;};
 b.active=actor.id;b.side=0;b.phase='aim';b.mode='practice';b.projectiles=[];b.volley=undefined;
 actor.loadout=[s.id];actor.focus=actor.maxFocus=10000;actor.cooldowns={};actor.acted=false;actor.dead=false;actor.retreat=false;
 // The guide represents this volley; later repeated volleys have the same launch path.
 actor.ranks.AP01=0;
 sim.grounded=()=>true;sim.canAct=()=>true;sim.fire(s.id,angle,power);
 let roots=[...b.projectiles];const primary=roots[Math.floor(roots.length/2)];
 if(representative&&primary){roots=[primary];b.projectiles=roots;if(s.id==='A04'){Object.assign(primary,e.origin(u,angle),e.velocity(u,s,angle,power));primary.prevVy=primary.vy;}}
 const paths=new Map<number,Vec[]>();
 let tracked=primary;
 let time=0,apex:Vec|undefined;const origin=e.origin(u,angle);
 for(const p of roots)paths.set(p.id,[{x:p.x,y:p.y}]);
 for(let i=0;i<1440&&b.projectiles.length;i++){
  for(const p of [...b.projectiles]){if(!b.projectiles.includes(p))continue;const wasApex=p.apex,wasSplit=representative&&p===tracked&&p.mode==='seekRain',nextId=b.nextId;capture=!representative||p===tracked;sim.stepProjectile(p,STEP);
   if(p===primary&&!wasApex&&p.apex)apex={x:p.x,y:p.apexY??p.y};
   if(!p.secondary&&(!representative||p===tracked)){const key=representative?primary.id:p.id,list=paths.get(key)||[];if(i%3===0||!b.projectiles.includes(p))list.push({x:p.x,y:p.y});paths.set(key,list);}
   // Keep all seven in the replay so their collisions and kills affect homing exactly as in combat.
   // Only the middle child's samples extend the visible parent path.
   if(wasSplit&&!b.projectiles.includes(p)){const children=b.projectiles.filter(q=>q.id>=nextId&&q.mode==='seekChild');if(children.length===7){tracked=children[3];contact=null;}}
  }time=(i+1)*STEP;
  // Later sibling impacts cannot change the representative path that has already ended.
  if(representative&&tracked&&!b.projectiles.includes(tracked))break;
 }
 const points=primary?paths.get(primary.id)||[origin]:[origin],last=points.at(-1)||origin;
 return {...last,unit:(contact as Collision|null)?.unit?.id,points,paths:[...paths.values()],time,contacts:[],apex,closest:99999};
}
/** Preview uses the same integrator, collision routine, restitution and geometry as the live shot. */
export function redesignPrediction(e:Engine,u:Unit,s:Skill,angle:number,power:number,representative=false,ignoreUnits=false):SkillPrediction|null{
 if(!s.redesigned)return null;
 if(s.cls==='archer')return arrowPrediction(e,u,s,angle,power,representative,ignoreUnits);
 if(s.cls!=='mage')return null;
 const r=u.ranks[s.id]||1,origin=e.origin(u,angle),v=e.velocity(u,s,angle,power),points:Vec[]=[origin],contacts:Vec[]=[];
 const p={...origin,...v,wind:s.wind,gravityScale:s.gravity??1,drag:dragFor(s),skill:s.id,mode:s.mode,radius:6,bounces:0} as Projectile;
 let age=0,time=0,closest=99999,apex:Vec|undefined,contact:Collision|null=null;const arc=s.mode==='waveArc',ring=s.mode==='waveRing',bagua=s.mode==='waveBagua',ice=s.mode==='gourdIce';
 if(ring){const center=at(u);return {...center,points:[],time:0,closest,contacts,geometry:skillGeometry(s,r,center.x,center.y,-rad(angle),power,undefined,undefined,geometryBoost(u,s))};}
 for(let i=0;i<Math.ceil((ice?iceGourdFuse(power):8)/STEP);i++){
  age+=STEP;time=age;if(ice&&age>=iceGourdFuse(power))break;
  const m=e.advanceProjectile(p,STEP);if(p.vy<0&&m.vy>=0)apex={x:p.x,y:p.y};p.vx=m.vx;p.vy=m.vy;time=age;
  const h=e.collision(p,m,6,u.id,[],!ignoreUnits&&!s.mode.startsWith('stake')&&!['waveTriangle','waveBagua'].includes(s.mode));if(h)contact=h;
  if(h){p.x=h.x;p.y=h.y;
   if(ice||s.mode==='waveBounce'||s.mode==='waveTriangle'){
    if(!ice&&!h.terrain)break;contacts.push({x:h.x,y:h.y});reflect(p,h,ice?(h.unit?.72:.64):.84);
    if(s.mode==='waveTriangle'&&contacts.length>=2)break;
    if(!ice&&p.bounces>Math.round(lerpRank(2,7,r)))break;
   }else break;
  }else{p.x=m.x;p.y=m.y;}
  if(i%3===0)points.push({x:p.x,y:p.y});if(p.y>e.b.height+100||p.x<0||p.x>e.b.width||p.y< -1700)break;
 }
 points.push({x:p.x,y:p.y});
 const geometry=arc||bagua||s.mode==='waveTriangle'?skillGeometry(s,r,p.x,p.y,arc?Math.atan2(p.vy,p.vx):-rad(angle),power,contacts,origin,geometryBoost(u,s)):undefined;
 return {x:p.x,y:p.y,unit:contact?.unit?.id,terrain:contact?.terrain?.id,points,time,closest,contacts,apex,geometry,secondaryRadius:s.branch==='gourd'?(s.id==='M04'?260+10*(r-1):s.id==='M13'?240:s.id==='M05'?190:180):s.branch==='stake'?45*geometryBoost(u,s):undefined};
}
