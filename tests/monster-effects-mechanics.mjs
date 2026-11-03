/** Explicit isolated fixtures; real engine actions/damage/physics, not normal campaign proof. */
import assert from 'node:assert/strict';
import {monsterCore,arena,plain,solid,turn,warning,attack,hit} from './monster-effects-helpers.mjs';
const {C,E}=await monsterCore();let cases=0;const failures=[];
function check(name,fn){try{fn();cases++;console.log('PASS',name);}catch(error){failures.push({name,error});console.error('FAIL',name,error.message);}}
check('legacy battle and unallowlisted caster never opt in during construction',()=>{
 const q=arena(C,'HSH02',{revision:false});assert.equal(q.b.honroMonsterEffectsRevision,undefined);assert(!E.prepareEnemyEffect(q.e,q.caster,'HSH02',q.hero,35,.5));
 const r=arena(C);delete r.caster.honroMonsterEffectSkill;assert(!E.prepareEnemyEffect(r.e,r.caster,'HSH02',r.hero,35,.5));
});
check('unseen, unoffered, other actor, and interrupted bonus actions cannot satisfy target response',()=>{
 for(const kind of ['unseen','other-actor','bonus','stunned']){
  const q=arena(C),c=warning(E,q),hp=q.hero.hp;turn(q,kind==='other-actor'?q.friend:q.hero);
  if(kind==='bonus')q.hero.meleeFollow='ready';if(kind==='stunned')q.hero.stunnedRound=q.b.round;
  if(kind!=='unseen')q.e.observeEnemyEffectWarning(q.caster.id,c.serial);
  E.enemyEffectActionCompleted(q.e,q.e.active);assert(!c.responded,kind+' not response');
  q.b.teamEnds[0]++;turn(q,q.caster);E.resolveEnemyEffect(q.e,q.caster);assert.equal(q.hero.hp,hp);assert(!q.caster.enemyEffectCast);
 }
});
check('time/camera-neutral repeated acknowledgement does not activate; normal wait resolves once',()=>{
 const q=arena(C),c=warning(E,q),hp=q.hero.hp;turn(q,q.hero);
 for(let i=0;i<120;i++){q.e.observeEnemyEffectWarning(q.caster.id,c.serial);E.tickEnemyEffects(q.e,C.STEP);}
 assert(c.offered&&!c.responded);assert.equal(q.hero.hp,hp);
 q.e.wait();q.e.finishAction(true);assert(c.responded);const shield=q.hero.shield;q.b.teamEnds[0]++;turn(q,q.caster);E.resolveEnemyEffect(q.e,q.caster);assert(q.hero.shield<shield,'defend absorbs resolved attack');const after=q.hero.hp;assert(!E.resolveEnemyEffect(q.e,q.caster));assert.equal(q.hero.hp,after);
});
check('shield absorbs HP damage without control; multihit cannot refresh control or reapply after release',()=>{
 const shield=arena(C);shield.hero.shield=10000;attack(E,shield);assert(!shield.hero.enemySoftBind);assert.equal(shield.hero.hp,10000);
 const q=arena(C),p=attack(E,q),bind=plain(q.hero.enemySoftBind);assert(bind);hit(q,p);assert.deepEqual(plain(q.hero.enemySoftBind),bind);
 E.releaseEnemySoftBind(q.hero);q.hero.enemyControlGrace=0;hit(q,p);assert(!q.hero.enemySoftBind,'same attack remains deduplicated after release');
});
check('softbind reduces next action movement only and releases with one-action immunity',()=>{
 const q=arena(C);attack(E,q);assert(q.hero.enemySoftBind);assert.equal(q.hero.bound,0,'legacy global bound untouched');
 turn(q,q.hero);q.hero.moveLeft=q.hero.maxMove;E.enemyEffectMovementBudget(q.hero);assert.equal(q.hero.moveLeft,q.hero.maxMove*.55);
 assert(q.e.jump(),'ordinary jump remains possible');q.hero.jumping=false;q.hero.vy=0;
 q.e.wait();q.e.finishAction(true);assert(!q.hero.enemySoftBind);assert.equal(q.hero.enemyControlGrace,1);
 turn(q,q.hero);E.enemyEffectActionCompleted(q.e,q.hero);assert.equal(q.hero.enemyControlGrace,0);
});
check('caster death/capture/team change and explicit cleanse release only enemy softbind',()=>{
 for(const patch of [{dead:true,hp:0},{eaterCapturedBy:'captor'},{side:0}]){const q=arena(C);attack(E,q);q.hero.bound=2;Object.assign(q.caster,patch);E.tickEnemyEffects(q.e,C.STEP);assert(!q.hero.enemySoftBind);assert.equal(q.hero.bound,2);}
 const q=arena(C);attack(E,q);turn(q,q.hero);q.b.items.cleanse=1;assert(q.e.item('cleanse'));assert(!q.hero.enemySoftBind);q.e.finishAction(true);assert(q.hero.enemyControlGrace>=1);
});
check('gust is progressive and stops at full-body walls, ledges, and another actor',()=>{
 for(const kind of ['open','wall','ledge','body']){const q=arena(C,'HWD02'),x=q.hero.x;
  if(kind==='wall')q.b.terrain.push(solid('wall',x+q.hero.r+16,300,1,500));
  if(kind==='ledge')q.b.terrain[0].w=x+40;
  if(kind==='body'){q.friend.x=x+q.hero.r+q.friend.r+16;}
  attack(E,q);assert.equal(q.hero.x,x,'impact does not teleport');assert(q.hero.enemyPush);E.tickEnemyEffects(q.e,C.STEP);assert(q.hero.x>x&&q.hero.x<x+80,'partial first step');
  for(let i=0;i<120;i++)E.tickEnemyEffects(q.e,C.STEP);
  assert(!q.hero.enemyPush);assert.equal(q.hero.y,800);assert(q.hero.x<=x+80.000001);if(kind==='open')assert(Math.abs(q.hero.x-x-80)<1e-6);else assert(q.hero.x<x+25,kind+' stops before obstacle');
 }
});
check('fixed target circle can be dodged, does not track or damage quest terrain',()=>{
 const q=arena(C),c=warning(E,q),hp=q.hero.hp,terrain=plain(q.b.terrain);turn(q,q.hero);q.e.observeEnemyEffectWarning(q.caster.id,c.serial);
 q.e.move(1,.5);assert(q.hero.x>c.impact.x+c.radius+q.hero.r,'normal movement exits announced circle');q.e.wait();q.e.finishAction(true);q.b.teamEnds[0]++;turn(q,q.caster);E.resolveEnemyEffect(q.e,q.caster);assert.equal(q.hero.hp,hp);assert(!q.hero.enemySoftBind);assert.deepEqual(plain(q.b.terrain),terrain);
});
check('effects and provenance survive engine serialization without actor/turn duplication',()=>{
 const q=arena(C);attack(E,q);const saved=plain(q.b),loaded=new C.Engine(plain(saved));assert.deepEqual(plain(loaded.b.units),saved.units);assert.equal(loaded.b.round,saved.round);assert.deepEqual(plain(loaded.b.teamEnds),saved.teamEnds);assert.equal(loaded.b.nextId,saved.nextId);
 const r=arena(C),c=warning(E,r);turn(r,r.hero);r.e.observeEnemyEffectWarning(r.caster.id,c.serial);const resume=new C.Engine(plain(r.b));assert.deepEqual(plain(resume.unit(r.caster.id).enemyEffectCast),plain(c));
});
assert.equal(failures.length,0,failures.map(f=>f.name+': '+f.error.message).join('\n'));
console.log(`PASS monster effects: ${cases} focused production-engine fixture groups`);
