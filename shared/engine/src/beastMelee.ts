/** Ground beasts use ordinary paid locomotion and one latched contact, never a projectile. */
import type {Engine} from './engine';
import type {Unit,Skill,Projectile} from './types';
import {clamp} from './math';
const IDS:Record<string,string>={hound:'HBM01',boar:'HBM02',stag:'HBM03'};
export function beastKind(u:Unit){const k=u.honroVariant||u.honroType||'';return u.side===1&&!u.boss&&!u.honroMidboss&&!(u as any).honroFinalBoss&&!u.summoned&&IDS[k]&&u.loadout.some(id=>id===IDS[k]||id==='HBR01'||id==='HBR02')?k:undefined;}
export function beastReach(u:Unit){return beastKind(u)==='stag'?34:beastKind(u)==='boar'?28:24;}
export function migrateBeastSkills(u:Unit){
 const k=beastKind(u);if(!k||!u.loadout.some(id=>id==='HBR01'||id==='HBR02'))return;
 const rank=Math.max(1,...u.loadout.map(id=>u.ranks[id]||1));
 u.loadout=[IDS[k]];u.ranks[IDS[k]]=rank;delete u.ranks.HBR01;delete u.ranks.HBR02;
}
export function beastLaneClear(e:Engine,u:Unit,t:Unit){
 const a={x:u.x,y:u.y-u.h*.55},z={x:clamp(a.x,t.x-t.r,t.x+t.r),y:clamp(a.y,t.y-t.h+4,t.y-4)};
 return !e.collision(a,z,1,u.id,[],false);
}
export function beastContact(e:Engine,u:Unit,t:Unit){
 if(t.dead||t.hp<=0||t.eaterCapturedBy||Math.abs(t.y-u.y)>45||!e.grounded(u))return false;
 const facing=u.facing||1,dx=(t.x-u.x)*facing;
 if(dx<0||dx>u.r+t.r+beastReach(u))return false;
 // The whole line starts at the torso, so a muzzle protruding through a wall cannot hit.
 return beastLaneClear(e,u,t);
}
export function startBeastCast(e:Engine,u:Unit,s:Skill,damage:number,t?:Unit,damageRoll?:number){
 const k=beastKind(u);if(!k||s.id!==IDS[k])return false;
 if(!t)return false;
 u.beastAction={attackSide:e.allegiance(u),damageRoll,skill:s.id,target:t.id,elapsed:0,damage,shot:e.b.shot,facing:u.facing,travel:0,struck:false};
 u.intent=s.name+' · 준비';e.message(`${u.name} · ${s.name}`);e.emit('change');e.emit('save');return true;
}
export function tickBeasts(e:Engine,dt:number){
 for(const u of e.b.units){const a=u.beastAction;if(!a)continue;
  if(u.dead||u.hp<=0||u.eaterCapturedBy||!beastKind(u)||e.b.phase!=='flight'||e.b.active!==u.id){delete u.beastAction;continue;}
  a.elapsed+=dt;u.facing=a.facing;
  const t=e.unit(a.target),active=a.elapsed>=.42&&a.elapsed<.64;
  if(active){
   u.intent=a.skill==='HBM01'?'깨물기':a.skill==='HBM02'?'돌진':'뿔 받기';
   if(t&&!a.struck&&e.grounded(u)){
    const cap=beastKind(u)==='boar'?72:24,remaining=Math.min(cap-a.travel,Math.max(0,(t.x-u.x)*a.facing-u.r-t.r));
    const before=u.x,speed=u.walkSpeed;
    u.walkSpeed=Math.max(speed,beastKind(u)==='boar'?380:240);
    // walkTerrain sweeps walls, respects flight reservations, supports and the existing budget.
    if(remaining>0&&u.moveLeft>0)e.walk(u,a.facing,Math.min(dt,remaining/u.walkSpeed),true);
    u.walkSpeed=speed;a.travel+=Math.abs(u.x-before);
    if(beastContact(e,u,t)&&e.attackAllows(t,u.id)){
     a.struck=true;
     const p={attackSide:a.attackSide,damageRoll:a.damageRoll,skill:a.skill,owner:u.id,side:u.side,shot:a.shot,skillRank:u.ranks[a.skill]||1,vx:a.facing,vy:0,launchX:u.x,launchY:u.y,damage:a.damage} as Projectile;
     e.hurt(t,a.damage,u.id,true,p,{x:u.x,y:u.y-u.h*.55});
     e.fx('spark',u.x+a.facing*u.r,u.y-u.h*.55,'#c3b995',18);e.emit('sound',{name:'impact'});
    }
   }
  }else if(a.elapsed>=.64){u.intent='자세 회복';u.moving=0;}
  if(a.elapsed>=1.06){delete u.beastAction;u.anim=0;u.moving=0;}
 }
}
