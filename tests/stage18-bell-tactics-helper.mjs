/** Isolated supported combat poses, not a normal-entry playthrough. The only
 * battle setup writes are initial hero poses and the initial friendly turn.
 * Engine.fire/tick/move resolve all projectiles, bodies, damage and resources. */
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {campaignEntryReadiness} from './stage18-bell-fullplay-helper.mjs';
export const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,stage=g.HONRO_PROJECT.stages[17];
export const readiness=campaignEntryReadiness(g),entryXp=readiness.xp;
export const sourceIds=stage.units.filter(u=>u.team==='enemy').map(u=>u.id);
const copy=x=>structuredClone(x);
function train(h,id){if(h.ranks[id])return;const n=C.TALENT_MAP[id];assert(n,id+' is a trainable talent');if(n.prereq)train(h,n.prereq);assert(C.train(h,id),id+': '+C.trainReason(h,id));}
export function fixture(cls,support,x,{poses=[],silenced=false}={}){
 const p=C.defaults();p.settings.difficulty='normal';p.recruited=Object.keys(readiness.heroes).filter(c=>readiness.heroes[c].xp>0);p.party=[...p.recruited];p.heroes=copy(readiness.heroes);p.cleared=copy(readiness.cleared);p.honroGrowth=copy(readiness.ledger);
 for(const name of p.recruited){const h=p.heroes[name];for(const t of [...C.TALENTS].reverse().filter(t=>t.cls===name))while(h.ranks[t.id])assert(C.untrain(h,t.id));while(C.statTrainingRank(h))assert(C.investStat(h,name,-1));}
 for(const id of ['M04','M11','O04','O08','S01'])train(p.heroes[C.SKILLS[id].cls],id);
 p.loadouts={archer:['A01'],mage:['M01','M04','M11'],knight:['S00','S01'],occultist:['O01','O04','O08']};
 for(const name of p.recruited){const h=p.heroes[name];C.sanitizeLoadout(p,name);assert.equal(h.xp,46235);assert.equal(C.levelOf(h),14);assert.equal(C.pointsEarned(h),29);assert(C.pointsSpent(h,name)<=29);assert(Object.values(h.ranks).every(n=>n===1));assert(p.loadouts[name].length<=4);assert(p.loadouts[name].every(id=>h.ranks[id]===1));}
 const {b,e,events,app}=battlefield(g,18,{profile:p});g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);
 if(silenced){const a=g.HonroAct2.memory(b);a.silenced=true;a.done['clear-wards']=a.done.silence=true;}
 const hero=e.heroesAlive().find(u=>u.cls===cls),initialPoses=[];
 for(const pose of [{cls,support,x},...poses]){const u=e.heroesAlive().find(v=>v.cls===pose.cls),t=b.terrain.find(t=>t.id===pose.support);assert(t,'Authored support '+pose.support);const y=C.topAt(t,pose.x);assert(Number.isFinite(y));Object.assign(u,{x:pose.x,y,vx:0,vy:0,acted:false});initialPoses.push({id:u.id,support:pose.support,x:pose.x,y});}
 b.active=hero.id;b.side=0;b.phase='aim';
 for(const pose of initialPoses){const u=e.unit(pose.id);assert(C.validTerrainContactPose(b.terrain,u),'Body-clear support '+JSON.stringify(pose));assert(e.grounded(u));const overlap=b.units.filter(v=>v.id!==u.id&&!v.dead&&Math.abs(v.x-u.x)<v.r+u.r&&v.y>u.y-u.h&&v.y-v.h<u.y);assert.equal(overlap.length,0,'Support overlaps '+overlap.map(v=>v.id).join(','));}
 assert.deepEqual(e.alive(1).map(u=>u.id),sourceIds);assert.equal(e.alive(1).length,stage.units.filter(u=>u.team==='enemy').length);assert.equal(b.enemyLimit,3);
 return{b,e,hero,events,support,profile:p,app,initialPoses};
}
export function fire(q,skill,aim){
 assert(aim,'A live attack needs an aim');assert(q.hero.loadout.includes(skill),'Only a selected, legally equipped skill may fire');
 const before=Object.fromEntries(q.b.units.map(u=>[u.id,u.hp])),contacts=[],hits=[],crossings=[],damageEvents=[],impact=q.e.impact.bind(q.e),hurt=q.e.hurt.bind(q.e),terrainBefore=JSON.stringify(q.b.terrain),rosterBefore=q.b.units.map(u=>u.id),focus=q.hero.focus,from={x:q.hero.x,y:q.hero.y,support:q.support};
 const preview=q.e.predict(q.hero,C.SKILLS[skill],aim.angle,aim.power,undefined,false),prediction={unit:preview.unit??null,terrain:preview.terrain??null,x:preview.x,y:preview.y,contacts:preview.contacts?.length??0};
 q.e.impact=function(p,h){if(h.terrain)contacts.push({id:h.terrain.id,x:h.x,y:h.y,reflectCount:p.bounces});if(h.unit)hits.push({id:h.unit.id,reflectCount:p.bounces});return impact(p,h);};
 q.e.hurt=function(u,...args){const hp=u.hp,result=hurt(u,...args);if(u.hp<hp)damageEvents.push({target:u.id,owner:args[1],amount:hp-u.hp,remaining:u.hp});return result;};
 assert(q.e.fire(skill,aim.angle,aim.power),skill+' launches through Engine.fire');let frames=0;
 while((q.b.projectiles.length||q.hero.meleeAction)&&frames<1800){
  const segments=q.b.projectiles.map(p=>({p,x:p.x,y:p.y}));q.e.tick(C.STEP);frames++;
  if(C.SKILLS[skill].phase==='terrain')for(const a of segments){const p=a.p,h=q.e.projectileCollision(a,{x:p.x,y:p.y},p.radius,p.owner,[],false,[],true);if(h?.terrain&&!crossings.some(c=>c.id===h.terrain.id))crossings.push({id:h.terrain.id,x:h.x,y:h.y});}
 }
 assert.equal(q.b.projectiles.length,0,'Projectile resolves within production lifetime');assert(!q.hero.meleeAction);if(!q.allowTargetDamage)assert.equal(JSON.stringify(q.b.terrain),terrainBefore,'No terrain rewrite');assert.deepEqual(q.b.units.map(u=>u.id),rosterBefore,'No roster rewrite');q.e.impact=impact;q.e.hurt=hurt;
 const damage=Object.fromEntries(q.b.units.filter(u=>before[u.id]>u.hp).map(u=>[u.id,before[u.id]-u.hp]));
 return{skill,aim,prediction,from,to:{x:q.hero.x,y:q.hero.y},damage,damageEvents,contacts,hits,crossings,frames,focusSpent:focus-q.hero.focus,reflectCount:Math.max(0,...hits.map(h=>h.reflectCount),...contacts.map(h=>h.reflectCount))};
}
export function aimAt(q,skill,targetId,{bounce=false}={}){
 const target=q.e.unit(targetId),s=C.SKILLS[skill],accepts=p=>p.unit===targetId&&(!bounce||p.contacts?.length);
 for(const a of q.e.shotSeeds(q.hero,s,target))if(accepts(q.e.predict(q.hero,s,a.angle,a.power,target,false)))return a;
 for(const power of [.2,.35,.5,.65,.8,1])for(let angle=-85;angle<=265;angle+=2)if(accepts(q.e.predict(q.hero,s,angle,power,target,false)))return{angle,power};
 return null;
}
