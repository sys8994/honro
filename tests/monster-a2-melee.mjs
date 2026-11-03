/** Isolated actual S00 casts, not a campaign/browser completion claim. */
import assert from 'node:assert/strict';
import {monsterCore,arena,solid} from './monster-effects-helpers.mjs';
const {C}=await monsterCore();let casts=0;
function fixture(stage,pose,facing){
 const q=arena(C),{b,caster:t}=q;
 const u=C.makeUnit('knight',0,650,800,{id:'swordsman',hp:10000,maxHp:10000,armor:0,loadout:['S00'],ranks:{S00:1},focus:999,maxFocus:999});
 b.units=[u,t];b.active=u.id;b.honroMonsterCombatRevision=2;
 Object.assign(t,{x:850,h:128,facing,honroMonsterA2Kind:'growth',honroMonsterGrowthGeometry:C.MONSTER_GROWTH_GEOMETRY,monsterGrowth:{stage,lastHitRound:0,lastDecayRound:0,lastActionsByHero:{}},monsterA2Animation:{pose,left:10}});
 return {...q,hero:u};
}
function cast(q,point,fromRight=false,cover=false){
 const {b,e,hero:u,caster:t}=q;u.x=point.x+(fromRight?85:-85);u.y=point.y+u.h/2;u.angle=fromRight?180:0;
 b.terrain.push(solid('hero-platform',u.x-28,u.y,56,12));
 if(cover)b.terrain.push(solid('cover',(u.x+point.x)/2,point.y-15,4,30));
 const hp=t.hp;assert(e.fire('S00',u.angle,.5),'real S00 accepted');
 for(let i=0;i<28;i++)e.tick(C.STEP);
 casts++;return hp-t.hp;
}
for(const stage of [1,2,3])for(const pose of ['idle','prepare','attack','recover'])for(const facing of [-1,1]){
 for(const part of ['head','trunk']){
  const q=fixture(stage,pose,facing),caps=q.e.monsterDamageShape(q.caster).capsules,c=caps[part==='head'?caps.length-1:Math.floor(caps.length/2)],point={x:(c.a.x+c.b.x)/2,y:(c.a.y+c.b.y)/2};
  assert(cast(q,point,facing<0)>0,`${stage}/${pose}/${facing}/${part} visible core hit`);
 }
}
for(const pose of ['idle','prepare','attack','recover'])for(const facing of [-1,1]){
 const q=fixture(1,pose,facing),point={x:q.caster.x,y:q.caster.y-q.caster.h+8};
 assert.equal(cast(q,point,facing<0),0,`${pose}/${facing} empty legacy box misses`);
 const legacy=fixture(1,pose,facing);delete legacy.b.honroMonsterCombatRevision;
 assert(cast(legacy,point,facing<0)>0,'same legacy box retains prior sword tolerance');
}
const covered=fixture(1,'idle',1),cap=covered.e.monsterDamageShape(covered.caster).capsules.at(-1);
assert.equal(cast(covered,{x:cap.a.x,y:cap.a.y},false,true),0,'solid cover blocks core contact');
console.log(`PASS A2 canonical melee: ${casts} real S00 casts, all stages/poses/facings; legacy and cover controls`);
