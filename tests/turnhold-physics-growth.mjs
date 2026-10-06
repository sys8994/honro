import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;

// A defense turn can be emptied without making the remaining wait idle.
{
 const {app,e,b}=battlefield(g,4);b.honroEvents=[];b.round=4;b.side=0;b.phase='transition';
 for(const foe of e.alive(1)){foe.hp=0;foe.dead=true;}
 assert.equal(e.alive(1).length,0);
 g.HonroMission.tick(app,0);
 const fresh=e.alive(1);
 assert(fresh.length>=4,'low-population defense turn should gain a wave');
 const sites=b.honroMarkers.filter(m=>m.type==='hauntHabitat');
 assert(fresh.every(u=>sites.some(m=>Math.abs(u.x-m.x)<300)),'wave must emerge by an authored habitat');
 const count=b.units.length;g.HonroMission.tick(app,0);assert.equal(b.units.length,count,'no duplicate wave in one round');
 for(const foe of fresh){foe.dead=true;foe.hp=0;}
 b.round++;g.HonroMission.tick(app,0);
 assert(e.alive(1).length>0,'an emptied later defense round should gain another wave');
}

// Every post-objective hold must replenish a cleared battlefield from authored habitat sites.
for(const stageId of [3,5,7,8,9]){
 const {app,e,b,st}=battlefield(g,stageId),hs=b.honroState;
 b.honroEvents=[];b.round=Math.max(5,g.HonroObjectives.state(b,st).minimumRound);b.side=0;b.phase='transition';b.projectiles=[];
 if(stageId===3)hs.ledger=true;
 if(stageId===5||stageId===8)for(const seal of b.terrain.filter(t=>t.honroSeal))seal.broken=true;
 if(stageId===7)hs.rescuedCount=3;
 if(stageId===8){const boss=b.units.find(u=>u.id==='boss');boss.dead=true;boss.hp=0;}
 if(stageId===9)hs.receivers=2;
 for(const foe of e.alive(1)){foe.dead=true;foe.hp=0;}
 hs.objectiveReadyRound=b.round;
 const state=g.HonroObjectives.state(b,st);assert(state.objectiveReady&&!state.complete,`stage ${stageId} was not in its hold`);
 g.HonroMission.tick(app,0);
 const fresh=e.alive(1),sites=b.honroMarkers.filter(m=>m.type==='hauntHabitat');
 assert(fresh.length>0,`stage ${stageId} did not replenish an emptied hold`);
 assert(fresh.every(u=>sites.some(site=>site.id===u.honroSpawnSource&&Math.abs(u.x-site.x)<=300)),`stage ${stageId} spawned away from its habitat`);
 const authored=g.HONRO_PROJECT.stages[stageId-1];
 for(const site of sites){const prop=authored.elements.find(element=>element.id===site.id.replace('habitat-','habitat-prop-'));assert(prop&&['reed','dead_pine'].includes(prop.assetId)&&prop.x===site.x&&prop.y===site.y,`stage ${stageId} habitat has no matching scenery`);}
}

// A party spread across both habitats must not make the remaining defense turns empty.
for(const stageId of [3,4,5,7,8,9]){
 const {app,e,b,st}=battlefield(g,stageId),hs=b.honroState,sites=b.honroMarkers.filter(m=>m.type==='hauntHabitat'),heroes=e.heroesAlive();
 b.honroEvents=[];b.round=stageId===4?4:Math.max(5,g.HonroObjectives.state(b,st).minimumRound);b.side=0;b.phase='transition';
 if(stageId===3)hs.ledger=true;
 if(stageId===5||stageId===8)for(const seal of b.terrain.filter(t=>t.honroSeal))seal.broken=true;
 if(stageId===7)hs.rescuedCount=3;
 if(stageId===8){const boss=b.units.find(u=>u.id==='boss');boss.dead=true;boss.hp=0;}
 if(stageId===9)hs.receivers=2;
 for(const foe of e.alive(1)){foe.dead=true;foe.hp=0;}
 hs.objectiveReadyRound=b.round;
 heroes.forEach((u,i)=>Object.assign(u,{x:sites[i%sites.length].x,y:sites[i%sites.length].y,vx:0,vy:0}));
 g.HonroMission.tick(app,0);
 assert(e.alive(1).length>0,`stage ${stageId} occupied habitat sites left a defense turn empty`);
 assert(e.alive(1).every(foe=>heroes.every(hero=>Math.hypot(foe.x-hero.x,foe.y-hero.y)>100)),`stage ${stageId} habitat wave appeared at a hero's feet`);
}

// Authored platforms must allow a jump through their undersides, including in saved maps.
for(const [stageId,terrainId] of [[5,'hidden-ledge'],[6,'bridge-mid'],[7,'tier-mid']]){
 const {e,b}=battlefield(g,stageId),t=b.terrain.find(t=>t.id===terrainId),u=e.active;
 assert(t?.oneWay,`${terrainId} must be a one-way platform`);
 b.terrain=[t];b.units=[u];b.sceneVersion++;
 const top=C.topAt(t,t.x+t.w*.5);
 Object.assign(u,{x:t.x+t.w*.5,y:top+u.h+85,vx:0,vy:-900,jumping:true,airborne:true,hp:u.maxHp,fallApexY:undefined});
 let above=false;for(let i=0;i<85;i++){e.integrateBody(u,1/120);if(u.y<top){above=true;break;}}
 assert(above,`${terrainId} blocked ascent from below`);assert.equal(u.hp,u.maxHp,`${terrainId} caused a head impact`);
}

// Old XP is mapped by level and fractional progress, then points can buy stats or skills.
{
 const profile=C.defaults(),oldLevel=12,oldProgress=.43;
 profile.revision=12;
 for(const cls of C.CLASS_IDS)profile.heroes[cls].xp=C.oldXpAtLevel12(oldLevel)+Math.floor(C.oldXpToNext12(oldLevel)*oldProgress);
 const migrated=C.validate(profile);
 for(const cls of C.CLASS_IDS){const hero=migrated.heroes[cls];assert.equal(C.levelOf(hero),oldLevel);assert(Math.abs(C.xpFraction(hero)-oldProgress)<.003);const before=C.pointsLeft(hero,cls),stats=C.heroStats(hero,cls);assert(C.investStat(hero,cls));assert.equal(C.pointsLeft(hero,cls),before-1);const raised=C.heroStats(hero,cls);for(const key of ['hp','mp','attack','armor','critChance','critMultiplier','move'])assert(raised[key]>stats[key],`${cls}.${key} did not grow`);}
 for(const key of C.STAT_KEYS){const gains=C.CLASS_IDS.map(cls=>C.STAT_GAINS[cls][key]);assert(Math.max(...gains)<=Math.min(...gains)*2+1e-9,`${key} class spread exceeds 2x`);}
 assert(C.STAT_GAINS.archer.attack>C.STAT_GAINS.knight.attack&&C.STAT_GAINS.archer.critChance>C.STAT_GAINS.knight.critChance);
 assert(C.STAT_GAINS.knight.hp>C.STAT_GAINS.archer.hp&&C.STAT_GAINS.knight.armor>C.STAT_GAINS.archer.armor&&C.STAT_GAINS.knight.move>C.STAT_GAINS.archer.move);
 const former=C.freshHero('archer');former.xp=C.xpAtLevel(12);delete former.statTraining;former.statRanks={hp:2,attack:1};assert.equal(C.statTrainingRank(C.validate({...C.defaults(),heroes:{...C.defaults().heroes,archer:former}}).heroes.archer),3);
 assert.equal(C.validate(migrated).revision,13);
 assert.equal(C.MAX_LEVEL,30);
 const finaleReward=g.HonroProgression.budget(10).end;
 assert(finaleReward<C.xpAtLevel(g.HonroProgression.plan(10).exitLevel),'stage rewards must not rise with the 1.5× requirement');
}

// Sodan's basic and spear follow hold time; echoes retain AI calibration.
{
 const {e}=battlefield(g,9),u=C.makeUnit('occultist',0,500,500,{id:'sodan-probe'});
 for(const id of ['O01','O04']){
  const s=C.SKILLS[id],root=Math.hypot(...Object.values(e.velocity(u,s,30,.45)));
  const echo=Math.hypot(...Object.values(e.velocity({...u,summoned:true},s,30,.45)));
  assert(Math.abs(root-480*e.chargeDuration(u,s)*.45)<1e-6);assert(Math.abs(echo-(270+535*.45)*e.effective(s,u).speed)<1e-6);
 }
}
console.log('PASS hold reinforcement, platform ascent, XP/stat migration and Sodan projectile speeds');
