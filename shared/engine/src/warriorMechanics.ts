import type {Engine,Collision,Prediction} from './engine';
import type {Unit,Skill,Projectile,Vec,Battle} from './types';
import {SKILLS} from './data';
import {passiveRank} from './progression';
import {clamp,rad,STEP,segRect,terrainRectIntersects} from './math';
import {COMBO_HITS,ORBIT_BLADES} from './warriorData';

const at=(u:Unit)=>({x:u.x,y:u.y-u.h*.5});
const foe=(u:Unit,t:Unit)=>!t.dead&&t.side!==u.side&&t.side!==2;
export const meleeSkill=(s:Skill)=>!!s.martial&&s.branch==='sword';
export function warriorAllowed(u:Unit,s:Skill){return u.meleeFollow!=='ready'||meleeSkill(s);}
export function meleeRange(u:Unit,s:Skill,power:number){return s.radius*(1+(['counterStance','lifeSlash'].includes(s.mode)?0:power)*(.23+.006*passiveRank(u,'SP01')));}
export function meleeFactor(u:Unit,power:number){return .88+(.47+.012*passiveRank(u,'SP01'))*power;}
export function meleeSpan(u:Unit,s:Skill,power=0){const base=s.mode==='meleeWide'?48:s.mode==='counterStance'?40:s.mode==='meleeCombo'?22:25;return rad(base+Math.max(0,(u.ranks[s.id]||1)-1)*1.5+clamp(power,0,1)*10+passiveRank(u,'SP01')*.5);}
export function meleeContains(e:Engine,u:Unit,t:Unit,range:number,angle=-rad(u.angle),span=meleeSpan(u,SKILLS.S00)){
 const a=at(u),v=at(t),dx=v.x-a.x,dy=v.y-a.y,dist=Math.hypot(dx,dy),delta=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle)));
 if(dist>range+t.r||dist>t.r&&delta>span/2+Math.asin(Math.min(1,t.r/Math.max(1,dist))))return false;
 return !e.collision(a,v,1,u.id,[],false);
}
function stroke(e:Engine,u:Unit,range:number,facing=u.facing,color='#dbe2dd',variant=0,angle?:number,span?:number){
 const c=at(u);e.emit('fx',{name:'swordCut',x:c.x,y:c.y,x2:facing,y2:variant,color,size:range,text:angle===undefined?undefined:JSON.stringify({angle,span})});u.anim=.55;
 e.emit('sound',{name:'sword'});e.fx('spark',u.x+facing*25,u.y,'#958e76',12);
}
function strike(e:Engine,u:Unit,t:Unit,damage:number,s:Skill,shot:number){
 // A short-lived damage descriptor is not a projectile in the battlefield.
 const p={skill:s.id,owner:u.id,side:u.side,shot,damage,skillRank:u.ranks[s.id]||1,launchX:u.x,launchY:u.y,vx:u.facing,vy:0} as Projectile;
 e.hurt(t,damage,u.id,true,p,at(u));
}
export function startWarriorCast(e:Engine,s:Skill,u:Unit){
 if(!s.martial||s.passive)return;
 const roots=e.b.projectiles.filter(p=>p.shot===e.b.shot&&p.owner===u.id),p=roots[0];
 if(u.meleeFollow==='ready')u.meleeFollow='spent';
 if(meleeSkill(s)||s.mode==='bladeScreen'){
  e.b.projectiles=e.b.projectiles.filter(p=>!roots.includes(p));
  const power=u.lastPower,damage=p.damage*(s.mode==='lifeSlash'?1:meleeFactor(u,power));
  if(s.mode==='counterStance'){u.martialGuard={round:e.b.round,reduction:.20+.10*((u.ranks[s.id]||1)-1)/7,counter:true,rank:u.ranks[s.id]||1,angle:-rad(u.angle),span:meleeSpan(u,s,power)};stroke(e,u,45);return;}
  if(s.mode==='bladeScreen'){u.bladeScreen={round:e.b.round,rank:u.ranks[s.id]||1,hits:0,facing:u.facing};stroke(e,u,110);return;}
  const lifeCost=s.mode==='lifeSlash'?Math.floor(u.hp*.5):0;
  if(lifeCost)u.hp-=lifeCost;
  u.meleeAction={skill:s.id,elapsed:0,index:0,damage:damage+(lifeCost*(.65+.25*((u.ranks[s.id]||1)-1)/7)),range:meleeRange(u,s,s.mode==='lifeSlash'?0:power),power,shot:e.b.shot,lifeCost,angle:-rad(u.angle),span:meleeSpan(u,s,power)};
  if(power<.30&&s.mode!=='lifeSlash')u.martialGuard={round:e.b.round,reduction:.12*(1-power/.30)};
  return;
 }
 if(s.branch==='rush'){
  p.body=true;p.radius=u.r;Object.assign(p,e.origin(u,u.angle,true));p.returnX=u.x;p.returnY=u.y;
  p.launchX=p.x;p.launchY=p.y;p.apexY=p.y;p.trail=[{x:p.x,y:p.y}];u.airborne=true;u.vx=u.vy=0;
 }
 if(s.branch==='blade'){
  const stored=u.bladeStored||0;if(stored){p.damage*=1+stored;p.vx*=1+stored*.22;p.vy*=1+stored*.22;p.sizeBoost=(p.sizeBoost||1)*(1+stored*.3);u.bladeStored=0;}
  p.radius=9*(p.sizeBoost||1);
  if(s.mode==='bladeOrbit'){
   const seed=Math.floor(e.random()*0xffffffff);let state=seed;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
   p.orbit={seed,blades:Array.from({length:ORBIT_BLADES[(u.ranks[s.id]||1)-1]},(_,i)=>({radius:45+random()*60,omega:(1.7+random()*2.5)*(i%2?-1:1),phase:random()*Math.PI*2,mod:.04+random()*.10,hits:{},lastHits:{}}))};
  }
 }
}
export function tickWarrior(e:Engine,dt:number){
 for(const u of e.b.units){
  u.salheunFlash=Math.max(0,(u.salheunFlash||0)-dt);
  if(u.dead){delete u.meleeAction;delete u.bladeScreen;delete u.martialGuard;continue;}
  if(u.martialGuard&&u.martialGuard.round<e.b.round)delete u.martialGuard;
  if(u.bladeScreen&&u.bladeScreen.round<e.b.round)delete u.bladeScreen;
  const a=u.meleeAction;
  if(a){
   a.elapsed+=dt;const s=SKILLS[a.skill],count=s.mode==='meleeCombo'?COMBO_HITS[(u.ranks[s.id]||1)-1]:s.mode==='meleeTurn'?2:1,delay=s.mode==='lifeSlash'?.20:.075,interval=s.mode==='meleeCombo'?.10:.19;
   while(a.index<count&&a.elapsed>=delay+a.index*interval){
    const turn=s.mode==='meleeTurn'&&a.index===1,angle=(a.angle??-rad(u.angle))+(turn?Math.PI:0),span=a.span??meleeSpan(u,s,a.power),facing=Math.cos(angle)<0?-1:1;
    const targets=e.b.units.filter(t=>foe(u,t)&&meleeContains(e,u,t,a.range,angle,span));
    if(s.mode==='meleeCombo'){
     const current=targets.find(t=>t.id===a.target)||targets.sort((x,y)=>Math.hypot(x.x-u.x,x.y-u.y)-Math.hypot(y.x-u.x,y.y-u.y))[0];
     if(current){a.target=current.id;strike(e,u,current,a.damage,s,a.shot);}
    }else for(const t of targets)strike(e,u,t,a.damage,s,a.shot);
    stroke(e,u,a.range,facing,s.mode==='lifeSlash'?'#d8c4bd':'#dbe2dd',s.mode==='lifeSlash'?2:a.index%2,angle,span);a.index++;
   }
   if(a.index>=count&&a.elapsed>delay+(count-1)*interval+.17)delete u.meleeAction;
  }
  const guard=u.martialGuard;
  if(guard?.counter&&e.b.side!==u.side){const range=SKILLS.S08.radius,span=guard.span??meleeSpan(u,SKILLS.S08),t=e.b.units.find(t=>foe(u,t)&&meleeContains(e,u,t,range,guard.angle??-rad(u.angle),span));if(t){guard.counter=false;strike(e,u,t,52*u.attack*(1.10+.20*((guard.rank||1)-1)/7),SKILLS.S08,e.b.shot);stroke(e,u,range,u.facing,'#dbe2dd',0,guard.angle??-rad(u.angle),span);}}
 }
}
export function manualDive(e:Engine){
 const p=e.b.projectiles.find(p=>p.owner===e.b.active&&p.mode==='warriorDive'&&!p.dived);if(e.b.phase!=='flight'||!p)return false;
 p.dived=true;p.vx*=.18;p.vy=Math.max(650,p.vy);p.gravityScale=3.5;e.emit('sound',{name:'sword'});return true;
}
export function orbitPoint(p:Projectile,blade:NonNullable<Projectile['orbit']>['blades'][number],time=p.age):Vec{
 const angle=blade.phase+blade.omega*time,r=blade.radius*(1+blade.mod*Math.sin(time*2.7+blade.phase));return{x:p.x+Math.cos(angle)*r,y:p.y+Math.sin(angle)*r*.72};
}
/** Native support/solid tests; pull never crosses a wall or leaves an actor over a pit. */
export function pullToFront(e:Engine,u:Unit,t:Unit){
 if(t.dead||t.fixed)return false;
 const desired=clamp(u.x+u.facing*(u.r+t.r+40),25,e.b.width-25),start={x:t.x,y:t.y},steps=Math.max(1,Math.ceil(Math.abs(desired-t.x)/8));let last={...start};
 for(let i=1;i<=steps;i++){
  const x=start.x+(desired-start.x)*i/steps,floor=e.surface(x,last.y-65,last.y+85);
  if(!floor||floor.y>e.b.height||e.b.terrain.some(v=>!v.broken&&!v.oneWay&&terrainRectIntersects(v,x-t.r,floor.y-t.h,t.r*2,t.h-2,.1)))break;
  if(e.b.units.some(v=>!v.dead&&v.id!==t.id&&Math.abs(v.x-x)<v.r+t.r&&Math.abs(v.y-floor.y)<Math.min(v.h,t.h)))break;
  last={x,y:floor.y};
 }
 t.x=last.x;t.y=last.y;t.vx=t.vy=0;t.airborne=t.jumping=false;delete t.moveTarget;
 e.emit('fx',{name:'inkLine',x:start.x,y:start.y-t.h*.5,x2:t.x,y2:t.y-t.h*.5,color:'#b8cbc9',size:1.2});return Math.hypot(t.x-start.x,t.y-start.y)>1;
}
function bladeHit(e:Engine,p:Projectile,t:Unit){
 const u=e.unit(p.owner)!;
 if(p.mode==='bladePull'){
  if(foe(u,t))e.hurt(t,p.damage,p.owner,true,p,p);
  pullToFront(e,u,t);
  if(foe(u,t)&&meleeContains(e,u,t,SKILLS.S00.radius)){strike(e,u,t,52*u.attack*.85,SKILLS.S00,p.shot);stroke(e,u,SKILLS.S00.radius);}
 }else if(foe(u,t))e.hurt(t,p.damage,p.owner,true,p,p);
}
function land(e:Engine,p:Projectile,h?:Collision){
 const u=e.unit(p.owner)!;u.airborne=false;u.jumping=false;u.vx=u.vy=0;
 let x=clamp(p.x+(h?.n.x||0)*(u.r+3),25,e.b.width-25),y=p.y+u.h*.5;
 const sf=e.surface(x,p.y-u.h*.6,p.y+u.h+100);if(sf)y=sf.y;
 for(const dx of [0,-24,24,-48,48,-72,72,-96,96]){const qx=clamp(x+dx,25,e.b.width-25),floor=e.surface(qx,y-75,y+100);if(floor&&!e.b.terrain.some(t=>!t.broken&&!t.oneWay&&terrainRectIntersects(t,qx-u.r,floor.y-u.h,2*u.r,u.h-2,.1))){x=qx;y=floor.y;break;}}
 u.x=x;u.y=y;u.landing=.24;
 const s=SKILLS[p.skill];
 if(p.mode==='warriorDive'){
  const factor=p.dived?1.35+Math.min(.30,Math.max(0,p.y-(p.apexY||p.y))/1800):.75,radius=p.dived?p.blast:80;
  for(const t of e.b.units.filter(t=>foe(u,t))){const d=Math.hypot(t.x-p.x,t.y-t.h*.45-p.y);if(d<radius+t.r)e.hurt(t,p.damage*factor*(1-.65*clamp(d/radius,0,1)),p.owner,true,p,p);}
  stroke(e,u,radius,u.facing,'#d2d7cb',3);e.emit('sound',{name:'hit'});
 }else if(p.mode==='warriorLeap'){
  const t=h?.unit&&foe(u,h.unit)?h.unit:e.b.units.filter(t=>foe(u,t)&&Math.hypot(t.x-p.x,t.y-t.h*.5-p.y)<p.blast+t.r).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  if(t)e.hurt(t,p.damage,p.owner,true,p,p);stroke(e,u,95);
 }
 if(s.id==='S13')u.meleeFollow='landing';
 e.remove(p);
}
export function stepWarrior(e:Engine,p:Projectile,dt:number){
 if(!SKILLS[p.skill]?.martial)return false;
 const u=e.unit(p.owner);if(!u||u.dead){if(u)u.airborne=false;e.remove(p);return true;}
 const a={x:p.x,y:p.y},motion=e.advanceProjectile(p,dt);p.vx=motion.vx;p.vy=motion.vy;p.apexY=Math.min(p.apexY??p.y,motion.y);
 const rush=SKILLS[p.skill].branch==='rush';
 const wall=e.collision(a,motion,p.radius,p.owner,[],false);
 const end=wall||motion;
 e.passFields(p,a,end);if(!e.b.projectiles.includes(p))return true;
 if(p.orbit){
  for(const blade of p.orbit.blades){const before=orbitPoint({...p,...a},blade,Math.max(0,p.age-dt)),after=orbitPoint({...p,x:end.x,y:end.y},blade),block=e.collision(before,after,5,p.owner,[],false),stop=block||after;
   for(const t of e.b.units.filter(t=>foe(u,t))){if((blade.hits[t.id]||0)>=2||p.age-(blade.lastHits[t.id]??-10)<.28)continue;if(segRect(before,stop,t.x-t.r,t.y-t.h,t.r*2,t.h,8)){blade.hits[t.id]=(blade.hits[t.id]||0)+1;blade.lastHits[t.id]=p.age;e.hurt(t,p.damage,p.owner,true,p,stop);}}
  }
 }else {
  const targets=e.b.units.filter(t=>!t.dead&&t.id!==u.id&&!p.hit.includes(t.id)&&(p.mode==='bladePull'||foe(u,t))).map(t=>({t,h:segRect(a,end,t.x-t.r,t.y-t.h,t.r*2,t.h,rush?35:p.radius)})).filter(v=>v.h).sort((a,b)=>a.h!.t-b.h!.t);
  for(const {t,h} of targets){p.hit.push(t.id);
   if(rush){if(p.mode==='warriorDive')continue;if(p.mode==='warriorLeap'){p.x=a.x+(end.x-a.x)*h!.t;p.y=a.y+(end.y-a.y)*h!.t;land(e,p,{...h!,x:p.x,y:p.y,unit:t});return true;}
    e.hurt(t,p.damage,p.owner,true,p,end);stroke(e,{...u,x:end.x,y:end.y+u.h*.5},70);
    if(p.mode==='warriorDrive'&&!t.fixed&&!t.airborne&&!t.jumping&&e.surface(t.x,t.y-5,t.y+5))e.impulse(t,Math.sign(p.vx||u.facing)*300,0);
   }else {bladeHit(e,p,t);if(p.mode!=='bladePierce'){e.remove(p);return true;}}
  }
 }
 p.x=end.x;p.y=end.y;
 if(rush){u.x=p.x;u.y=p.y+u.h*.5;u.facing=p.vx>=0?1:-1;}
 if(wall){if(rush)land(e,p,wall);else {e.fx('spark',p.x,p.y,'#b5c6c3',18);e.remove(p);}return true;}
 p.trail.push({x:p.x,y:p.y});if(p.trail.length>(rush?26:18))p.trail.shift();
 if(p.age>10||p.y>e.b.height+80||p.x< -150||p.x>e.b.width+150||p.y< -1700){if(rush){u.airborne=false;e.recover(u);}e.remove(p);}
 return true;
}
export function finishWarrior(e:Engine){
 const u=e.active;if(!u)return false;
 if(u.meleeFollow==='landing'&&!u.dead){u.meleeFollow='ready';u.acted=false;u.moveLeft=0;e.b.phase='aim';e.b.cast=undefined;e.message('파진연격 · 평참 또는 검술 한 번');e.emit('change');e.emit('save');return true;}
 if(u.meleeFollow==='spent')delete u.meleeFollow;
 return false;
}
export function bladeScreenPass(e:Engine,p:Projectile,a:Vec,b:Vec){
 if(p.body||p.damage<=0)return;
 for(const u of e.b.units){const s=u.bladeScreen;if(u.dead||!s||s.round<e.b.round||p.side===u.side||s.hits>=3+Math.floor(s.rank/2))continue;
  const key=`screen:${u.id}:${s.round}`;p.fieldHits??=[];if(p.fieldHits.includes(key))continue;
  const c=at(u),dx=b.x-a.x,dy=b.y-a.y,A=dx*dx+dy*dy,B=2*((a.x-c.x)*dx+(a.y-c.y)*dy),R=175+p.radius,C=(a.x-c.x)**2+(a.y-c.y)**2-R*R,D=B*B-4*A*C;
  if(A<1e-8||D<0||C<0)continue;
  const ts=[(-B-Math.sqrt(D))/(2*A),(-B+Math.sqrt(D))/(2*A)];
  if(!ts.some(t=>t>=0&&t<=1&&(a.x+dx*t-c.x)*s.facing>=0))continue;
  p.fieldHits.push(key);s.hits++;const saved=p.damage*(.50+.20*(s.rank-1)/7);p.damage-=saved;
  u.bladeStored=Math.min(.35+.10*(s.rank-1)/7,(u.bladeStored||0)+saved/Math.max(1,u.attack*180));
  e.emit('fx',{name:'swordCut',x:c.x,y:c.y,x2:s.facing,y2:1,color:'#becdc9',size:175});e.emit('sound',{name:'sword'});
  if(p.damage<5)e.remove(p);
 }
}
export function warriorPrediction(e:Engine,u:Unit,s:Skill,angle:number,power:number):Prediction|null{
 if(!s.martial)return null;
 if(meleeSkill(s)||s.mode==='bladeScreen')return{points:[],...at(u),closest:0};
 // Actual continuation on isolated state keeps rush, walls and single orbit centre exact.
 const b=structuredClone(e.b),Sim=e.constructor as new(b:Battle)=>Engine,sim=new Sim(b),actor=sim.unit(u.id)!;
 Object.assign(b,{active:u.id,phase:'aim',side:0,projectiles:[],volley:undefined});Object.assign(actor,{loadout:[s.id],focus:10000,maxFocus:10000,cooldowns:{},acted:false,airborne:false,meleeFollow:undefined});sim.grounded=()=>true;sim.canAct=()=>true;sim.fire(s.id,angle,power);
 const p=b.projectiles[0],points:Vec[]=[];if(!p)return{points,...at(u),closest:99999};
 for(let i=0;i<1440&&b.projectiles.includes(p);i++){sim.stepProjectile(p,STEP);if(i%3===0||!b.projectiles.includes(p))points.push({x:p.x,y:p.y});}
 return{points,x:p.x,y:p.y,closest:99999};
}
