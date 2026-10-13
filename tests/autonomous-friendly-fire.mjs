import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
function arena(id){
 const s=C.SKILLS[id],b=C.createBattle(1,C.defaults(),'practice',{party:[s.cls],wind:0});
 const u=b.units[0];Object.assign(b,{width:4000,height:2000,terrain:[{id:'floor',x:0,y:1500,w:4000,h:500,mat:'rock',hp:99999,maxHp:99999}],waters:[],fields:[],drafts:[],units:[u],wind:0,practiceCombat:false});
 Object.assign(u,{x:200,y:1500,loadout:[id],ranks:{[id]:8},focus:9999,maxFocus:9999,attack:1,armor:0,hp:9999,maxHp:9999,acted:false});
 const e=new C.Engine(b);e.random=()=>.99;e.checkEnd=()=>false;
 const add=(side,x,extra={})=>{const t=C.makeUnit('knight',side,x,1500,{id:'target-'+b.units.length,armor:0,shield:0,hp:99999,maxHp:99999,fixed:true,...extra});b.units.push(t);return t;};
 const fire=()=>{assert(e.fire(id,0,.7),id);return b.projectiles[0];};return {b,u,e,add,fire};
}
const hit=(a,p,t)=>a.e.impact(p,{x:t.x,y:t.y-t.h*.5,t:0,n:{x:-1,y:0},unit:t});

const state=t=>JSON.stringify([t.hp,t.shield,t.bound,t.breaks,t.mark,t.vx,t.vy,t.x,t.y,t.slowed,t.curseOwner,t.earthbind,t.carriedBy]);
// A real automatic projectile traverses allies in front, behind, overlapping and neutral NPCs.
for(const flags of [{side:0},{side:2,honroAlly:true,honroProtected:true},{side:1,honroAlly:true},{side:2}])for(const family of ['summon','echo','volley','fragment','child']){
 const a=arena('A01'),front=a.add(flags.side,450,flags),overlap=a.add(flags.side,850,flags),back=a.add(flags.side,1100,flags),enemy=a.add(1,850),p=a.fire();
 Object.assign(p,{x:300,y:enemy.y-enemy.h*.5,vx:1500,vy:0,gravityScale:0,wind:0,blast:120,damage:40});
 if(family==='summon'){const ghost=a.e.spawnSummon(a.u,'lantern',300,1500);p.owner=ghost.id;}
 if(family==='echo')p.echoSource='saved-echo';if(family==='volley')p.followup=true;if(family==='fragment')p.secondary=true;if(family==='child')p.child=true;
 const before=[front,overlap,back,a.u].map(state);
 for(let n=0;n<90&&a.b.projectiles.includes(p);n++)a.e.stepProjectile(p,C.STEP);
 assert.deepEqual([front,overlap,back,a.u].map(state),before,`${family} ${JSON.stringify(flags)} protected state`);
 assert(enemy.hp<enemy.maxHp,`${family} enemy remains hit`);
}
console.log('PASS 20 live legacy-provenance collision cases and untouched protected state');
// Primary roots retain damage; explicit automatic continuation blocks hurt, status and impulse together.
for(const id of ['A01','A05','A06','A07','A08','M01','M02','M03','M04','M06','O01','O08','O10','S09','S10','S11','S12']){
 const a=arena(id),ally=a.add(0,800),p=a.fire();if(!p)continue;
 p.autonomous=true;const before=state(ally);hit(a,p,ally);assert.equal(state(ally),before,id+' direct impact safety');
}
for(const flags of [{side:0},{side:2,honroAlly:true},{side:2}]){
 const a=arena('M06'),ally=a.add(flags.side,800,{...flags,fixed:false}),enemy=a.add(1,800),p=a.fire();p.autonomous=true;p.x=800;p.y=1460;
 const before=state(ally),self=state(a.u);a.e.blast(800,1460,800,100,a.u.id,false,p);
 assert.equal(state(ally),before);assert.equal(state(a.u),self);assert(enemy.hp<enemy.maxHp);
 const floor=a.b.terrain[0];Object.assign(floor,{hp:20,maxHp:20,mat:'barrel'});a.e.blast(800,1490,100,100,a.u.id,false,p);assert.equal(floor.hp,20);assert(!floor.broken);
 a.e.damageTerrain(floor,100,0,a.u.id,p);assert(!floor.broken,'no chain explosion or support collapse');
 a.e.createZone(p,'frost');a.e.applyZones(ally);assert.equal(state(ally),before,'inherited zone causes no damage or bind');
}
console.log('PASS impact status, blast impulse, caster, neutral/ally, terrain cascade and zone safety');
// Actual combo target order, aerial sector and interrupted Continue use the same live engine.
for(const airborne of [false,true])for(const resume of [false,true]){
 const a=arena('S07'),ally=a.add(2,260,{honroAlly:true}),masquerade=a.add(1,270,{honroAlly:true}),first=a.add(1,300,{hp:1,maxHp:1}),second=a.add(1,320);
 if(airborne)for(const t of [ally,masquerade,first,second]){t.y-=45;t.airborne=true;}
 assert(a.e.fire('S07',airborne?25:0,.7));const protectedBefore=[ally,masquerade,a.u].map(state);
 a.e.tick(.08);
 let e=a.e,b=a.b;if(resume){b=JSON.parse(JSON.stringify(a.b));e=new C.Engine(b);e.random=()=>.99;e.checkEnd=()=>false;}
 for(let n=0;n<180&&e.unit(a.u.id).meleeAction;n++)e.tick(C.STEP);
 assert(e.unit(first.id).dead,'combo first foe killed');assert(e.unit(second.id).hp<second.maxHp,'combo retargets after kill');
 assert.equal(state(e.unit(ally.id)),protectedBefore[0]);assert.equal(state(e.unit(masquerade.id)),protectedBefore[1]);assert(!e.unit(a.u.id).meleeAction,'combo completes');
}
console.log('PASS grounded/aerial combo ordering, allies, new and legacy JSON Continue');
// Save a flying automatic ray, remove only the new marker to exercise old structural flags.
for(const legacy of [false,true]){
 const a=arena('O12'),ally=a.add(0,650),enemy=a.add(1,1100),ghost=a.e.spawnSummon(a.u,'lantern',400,1500);a.e.launchSummonBolt(ghost,enemy);
 const b=JSON.parse(JSON.stringify(a.b));if(legacy)delete b.projectiles[0].autonomous;
 const e=new C.Engine(b);e.random=()=>.99;for(let n=0;n<200&&b.projectiles.length;n++)for(const p of [...b.projectiles])e.stepProjectile(p,C.STEP);
 assert.equal(e.unit(ally.id).hp,ally.maxHp);assert(e.unit(enemy.id).hp<enemy.maxHp);assert.equal(b.projectiles.length,0);
 assert.equal(e.creditUnit(e.unit(ghost.id)).id,a.u.id,'credit owner preserved');
}
console.log('PASS saved summon rays, legacy marker absence, enemy damage and summon credit owner');
// Orbit blades are automatic even though their shared centre is manually aimed.
for(const legacy of [false,true]){
 const a=arena('S12'),ally=a.add(0,650),npc=a.add(2,650,{honroAlly:true}),enemy=a.add(1,650),p=a.fire();
 Object.assign(p,{x:500,y:enemy.y-enemy.h*.5,vx:600,vy:0,gravityScale:0,wind:0});
 const b=legacy?JSON.parse(JSON.stringify(a.b)):a.b,e=legacy?new C.Engine(b):a.e;e.random=()=>.99;
 for(let n=0;n<100&&b.projectiles.length;n++)for(const q of [...b.projectiles])e.stepProjectile(q,C.STEP);
 assert.equal(e.unit(ally.id).hp,ally.maxHp);assert.equal(e.unit(npc.id).hp,npc.maxHp);assert(e.unit(enemy.id).hp<enemy.maxHp,'orbit still damages foe');
}
// Enemy damage magnitude and source credit stay exactly the same with provenance added.
for(const id of ['A01','A05','M01','M03','O01','S09']){
 const outcomes=[];
 for(const autonomous of [false,true]){const a=arena(id),foe=a.add(1,800,{xpBudget:100});const p=a.fire();p.autonomous=autonomous;hit(a,p,foe);outcomes.push([foe.maxHp-foe.hp,JSON.stringify(foe.damageBy),foe.xpGranted]);}
 assert.deepEqual(outcomes[0],outcomes[1],id+' enemy damage and XP contribution preserved');
}
// Reflections and terrain collisions still happen; only autonomous terrain HP damage is blocked.
for(const automatic of [false,true]){
 const a=arena('M11'),p=a.fire(),wall={id:'wood-wall',x:600,y:1250,w:35,h:250,mat:'wood',hp:200,maxHp:200};a.b.terrain.push(wall);a.b.sceneVersion++;
 Object.assign(p,{x:580,y:1400,vx:1000,vy:0,autonomous:automatic});
 a.e.impact(p,{x:600,y:1400,t:.5,n:{x:-1,y:0},terrain:wall});
 assert(p.bounces>0,'ricochet preserved');assert(p.vx<0,'reflection direction preserved');
 if(automatic)assert.equal(wall.hp,200);
}
for(const kind of ['stalker','lantern','charger']){
 const a=arena('O12'),ally=a.add(1,420,{honroAlly:true}),enemy=a.add(1,550),ghost=a.e.spawnSummon(a.u,kind,400,1500);ghost.summonExpires=99;
 const before=state(ally);assert.equal(a.e.runSummonTurn(),1);
 for(let n=0;n<1000&&a.b.summonTurn;n++)a.e.tick(C.STEP);
 assert.equal(state(ally),before,kind+' allied actor excluded from automatic target/impulse');assert(enemy.hp<enemy.maxHp,kind+' attacks foe');assert(!a.b.summonTurn,kind+' turn finishes');
}
console.log('PASS orbit blades, exact enemy damage/XP, ricochet and complete summon turns');
// Automatic delayed explosions persist eligibility without changing their original damage calculation.
for(const autonomous of [false,true]){
 const a=arena('M01'),ally=a.add(0,800,{fixed:false}),foe=a.add(1,800),p=a.fire();Object.assign(p,{autonomous,x:800,y:1460,blast:100,damage:50});
 a.e.createZone(p,'delay');const z=a.b.zones[0],b=JSON.parse(JSON.stringify(a.b)),e=new C.Engine(b);e.random=()=>.99;b.teamEnds[z.triggerSide]=z.triggerCount;e.triggerDelays(z.triggerSide);
 assert.equal(e.unit(ally.id).hp===ally.maxHp,autonomous);assert(e.unit(foe.id).hp<foe.maxHp);assert.equal(b.zones.length,0);
}
// Continuous automatic effects recheck allegiance after control changes and Continue.
{
 const a=arena('O01'),target=a.add(1,800);a.e.applyCurse(target,a.u,'dot',40,1,0,false,{autonomous:true});
 target.honroAlly=true;target.earthbind={owner:a.u.id,damage:40,until:99,autonomous:true};const b=JSON.parse(JSON.stringify(a.b)),e=new C.Engine(b),t=e.unit(target.id),hp=t.hp;e.tickCurses();assert.equal(t.hp,hp);assert(!t.slowed);
}
// Counter stance waits for an actual opponent instead of spending itself on a side-1 ally.
{
 const a=arena('S08'),ally=a.add(1,270,{honroAlly:true}),enemy=a.add(1,300);assert(a.e.fire('S08',0,.7));a.b.side=1;a.b.phase='flight';const hp=ally.hp;a.e.tick(.1);assert.equal(ally.hp,hp);assert(enemy.hp<enemy.maxHp);assert.equal(a.u.martialGuard.counter,false);
}
// An enemy-owned automatic attack still harms the opposing player coalition.
{
 const a=arena('M01'),enemy=a.add(1,800),p=a.fire();Object.assign(p,{owner:enemy.id,side:1,autonomous:true});const hp=a.u.hp;a.e.blast(a.u.x,a.u.y-a.u.h*.5,100,50,enemy.id,false,p);assert(a.u.hp<hp);
}
console.log('PASS delayed Continue, automatic DOT allegiance changes, counter ordering and opposing enemy attacks');
