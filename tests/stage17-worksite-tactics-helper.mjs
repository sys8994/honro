/** Isolated tactical support poses. All geometry, campaign opponents, physics,
 * stats and damage resolution remain production data. This is not a playthrough. */
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
export const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,stage=g.HONRO_PROJECT.stages[16];
export const entryXp=g.HonroProgression.legacyCampaignAnchor(16);
assert.equal(entryXp,41755,'Stage17 baseline is the actual legacy-campaign completion anchor');
export const sourceIds=stage.units.filter(u=>u.team==='enemy').map(u=>u.id);
const train=(h,id)=>{if(h.ranks[id])return;const n=C.TALENT_MAP[id];if(n.prereq)train(h,n.prereq);assert(C.train(h,id),'Legal rank-one training: '+id);};
export function fixture(cls,support,x,{extraSkills=[]}={}){
 const p=C.defaults();p.settings.difficulty='normal';p.recruited=['archer','mage','knight','occultist'];
 for(const name of p.recruited)p.heroes[name].xp=entryXp;
 for(const id of ['M11','M04'])train(p.heroes.mage,id);train(p.heroes.occultist,'O04');train(p.heroes.knight,'S01');for(const id of extraSkills)train(p.heroes[C.SKILLS[id].cls],id);
 for(const name of p.recruited){const h=p.heroes[name];assert.equal(C.levelOf(h),13);assert(C.pointsSpent(h,name)<=C.pointsEarned(h),'Training stays within actual entry budget: '+name);assert(Object.values(h.ranks).every(rank=>rank===1),'No skill exceeds legal rank one');}
 p.loadouts.archer=['A01'];p.loadouts.mage=['M01','M11','M04'];p.loadouts.knight=['S00','S01'];p.loadouts.occultist=['O01','O04',...extraSkills];
 const {b,e,events,app}=battlefield(g,17,{profile:p}),hero=e.heroesAlive().find(u=>u.cls===cls),t=b.terrain.find(t=>t.id===support);
 assert(t,'Authored support '+support);const y=C.topAt(t,x);assert(Number.isFinite(y));
 Object.assign(hero,{x,y,vx:0,vy:0,acted:false});b.active=hero.id;b.side=0;b.phase='aim';e.checkEnd=()=>false;
 const overlap=b.units.filter(u=>u.id!==hero.id&&!u.dead&&Math.abs(u.x-hero.x)<u.r+hero.r&&u.y>hero.y-hero.h&&u.y-u.h<hero.y);assert.equal(overlap.length,0,'Firing pose must not overlap an authored body: '+overlap.map(u=>u.id).join(','));
 assert(C.validTerrainContactPose(b.terrain,hero),cls+' exposed firing support '+support+' at '+x);assert(e.grounded(hero),'Firing support must be grounded');assert.deepEqual(e.alive(1).map(u=>u.id),sourceIds);
 return{b,e,hero,events,support,profile:p,app};
}
export function fire(q,skill,aim){
 const before=Object.fromEntries(q.b.units.map(u=>[u.id,u.hp])),hits=[],contacts=[],crossings=[],impact=q.e.impact.bind(q.e),terrainBefore=JSON.stringify(q.b.terrain),rosterBefore=q.b.units.map(u=>u.id),focus=q.hero.focus,from={x:q.hero.x,y:q.hero.y,support:q.support};
 const preview=q.e.predict(q.hero,C.SKILLS[skill],aim.angle,aim.power,undefined,false),prediction={unit:preview.unit??null,terrain:preview.terrain??null,x:preview.x,y:preview.y,contacts:preview.contacts?.length??0};
 q.e.impact=function(p,h){if(h.terrain)contacts.push({id:h.terrain.id,x:h.x,y:h.y,bounces:p.bounces});if(h.unit)hits.push({id:h.unit.id,bounces:p.bounces});return impact(p,h);};
 assert(q.e.fire(skill,aim.angle,aim.power),skill+' launches through Engine.fire');
 for(let frame=0;frame<1800&&(q.b.projectiles.length||q.hero.meleeAction);frame++){
  C.tickWarrior(q.e,C.STEP);
  for(const p of [...q.b.projectiles])if(q.b.projectiles.includes(p)){const a={x:p.x,y:p.y};q.e.stepProjectile(p,C.STEP);if(C.SKILLS[skill].phase==='terrain'){const h=q.e.projectileCollision(a,{x:p.x,y:p.y},p.radius,p.owner,[],false,[],true);if(h?.terrain&&!crossings.some(c=>c.id===h.terrain.id))crossings.push({id:h.terrain.id,x:h.x,y:h.y});}}
 }
 assert.equal(q.b.projectiles.length,0,'Projectile resolves within production lifetime');assert(!q.hero.meleeAction,'Melee action resolves');assert.equal(JSON.stringify(q.b.terrain),terrainBefore,'Terrain unchanged');assert.deepEqual(q.b.units.map(u=>u.id),rosterBefore,'Roster unchanged');
 const damage=Object.fromEntries(q.b.units.filter(u=>before[u.id]>u.hp).map(u=>[u.id,before[u.id]-u.hp]));
 q.e.impact=impact;
 return{skill,aim,prediction,from,to:{x:q.hero.x,y:q.hero.y},damage,contacts,hits,crossings,focusSpent:focus-q.hero.focus};
}
export function aimAt(q,skill,targetId,{bounce=false}={}){
 const target=q.e.unit(targetId),s=C.SKILLS[skill];
 const accepts=p=>p.unit===targetId&&(!bounce||p.contacts?.length);
 for(const a of q.e.shotSeeds(q.hero,s,target))if(accepts(q.e.predict(q.hero,s,a.angle,a.power,target,false)))return a;
 for(const power of [.2,.35,.5,.65,.8,1])for(let angle=-85;angle<=265;angle+=2){const p=q.e.predict(q.hero,s,angle,power,target,false);if(accepts(p))return{angle,power};}
 return null;
}
