/** Isolated scheduled actions through the production engine. Browser checks separately exercise campaigns. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {buildCore} from '../game/engine/build.mjs';
import {arena,turn,solid,plain} from './monster-effects-helpers.mjs';

const g=vm.createContext({console,performance,structuredClone});
vm.runInContext(await buildCore()+"\nglobalThis.P=load('monsterPatterns');",g);
vm.runInContext(await readFile('shared/runtime/world.js','utf8'),g);
const {HONRO_CORE:C,P}=g;
const setup=(kind)=>{
 const q=arena(C,'HSH02',{revision:false});
 q.b.honroMonsterReworkRevision=1;q.b.items={focus:2,heal:3,cleanse:1,ward:1};
 Object.assign(q.caster,{honroMonsterPattern:kind,loadout:['HSH01']});
 Object.assign(q.hero,{loadout:['A01','A02'],honroLastCombatSkill:'A02'});
 return q;
};
function begin(q){
 turn(q,q.caster);
 assert(P.prepareMonsterPattern(q.e,q.caster,q.hero),'prepare '+q.caster.honroMonsterPattern);
 const w=q.caster.honroMonsterWindup;
 assert.equal(w.target,q.hero.id);
 return w;
}
function respond(q,w,{seen=true,actor=q.hero,move=0,advance=true}={}){
 turn(q,actor);
 if(seen)q.e.observeMonsterPattern(q.caster.id,w.serial);
 if(move)assert(q.e.move(Math.sign(move),Math.abs(move)));
 q.e.wait();q.e.finishAction(true);actor.shield=0;
 if(advance)q.b.teamEnds[0]=w.teamEnd+1;
}
function resolve(q){
 turn(q,q.caster);
 assert(P.monsterTurn(q.e,q.caster));
 assert(!q.caster.honroMonsterWindup);
}
let count=0;
function test(label,fn){fn();count++;console.log('PASS',label);}
test('old games ignore new monster metadata and unseen or other hero cannot grant a response',()=>{
 const old=setup('geuseundae');delete old.b.honroMonsterReworkRevision;
 assert(!P.prepareMonsterPattern(old.e,old.caster,old.hero));
 for(const how of ['unseen','other','no-turn']){
  const q=setup('geuseundae'),w=begin(q),hp=q.hero.hp;
  respond(q,w,{seen:how!=='unseen',actor:how==='other'?q.friend:q.hero,advance:how!=='no-turn'});
  resolve(q);
  assert.equal(q.hero.hp,hp);
 }
});
test('fixed attack can be hit, evaded or interrupted without retargeting',()=>{
 for(const how of ['hit','dodge','interrupt']){
  const q=setup('geuseundae'),w=begin(q),p=plain(w.impact),hp=q.hero.hp;
  if(how==='dodge')q.hero.x+=228;
  if(how==='interrupt')q.e.hurt(q.caster,25,q.hero.id,true,undefined,q.hero);
  respond(q,w);
  assert.deepEqual(plain(w.impact),p);
  if(how==='interrupt')assert(!q.caster.honroMonsterWindup);
  else resolve(q);
  assert.equal(q.hero.hp<hp,how==='hit',how);
 }
});
test('save preserves exact footprint and applied response; corrupt cast cancels alone',()=>{
 const q=setup('dueoksini'),w=begin(q);respond(q,w);
 const save=plain(q.b),reload=new C.Engine(save),owner=reload.unit('caster');
 assert.deepEqual(plain(owner.honroMonsterWindup),plain(w));
 assert.deepEqual(plain(owner.honroMonsterWindup.answered),['hero']);
 save.units.find(u=>u.id==='caster').honroMonsterWindup.impact.x=Infinity;
 const repaired=new C.Engine(save);
 assert(!repaired.unit('caster').honroMonsterWindup);
 assert.equal(repaired.unit('hero').hp,q.hero.hp);
});
test('Eoduksini grows once per projectile action, never heals, shrinks only after an unharmed round',()=>{
 const q=setup('eoduksini'),caster=q.caster;
 q.b.shot=12;
 const apply=()=>q.e.hurt(caster,30,q.hero.id,true,undefined,q.hero);
 apply();apply();
 assert.equal(caster.honroMonsterGrowth,2);
 assert(caster.hp<caster.maxHp);
 q.b.shot++;apply();
 assert.equal(caster.honroMonsterGrowth,3);
 q.b.side=1;q.b.teamEnds[0]=1;P.monsterRound(q.e);
 assert.equal(caster.honroMonsterGrowth,3);
 q.b.teamEnds[0]=2;P.monsterRound(q.e);
 assert.equal(caster.honroMonsterGrowth,2);
 q.e.hurt(caster,30,q.hero.id,true,undefined,q.hero,'environment');
 assert.equal(caster.honroMonsterGrowth,2);
});
test('attached guest spirit reduces one movement budget, direct fire and cleansing both release',()=>{
 for(const method of ['hit','cleanse','action']){
  const q=setup('gaekgwi'),w=begin(q);
  respond(q,w);resolve(q);
  assert.equal(q.caster.honroMonsterState.attachedTo,q.hero.id);
  turn(q,q.hero);q.hero.moveLeft=q.hero.maxMove;P.monsterMovementBudget(q.e,q.hero);
  assert.equal(q.hero.moveLeft,q.hero.maxMove*.68);
  if(method==='hit')q.e.hurt(q.caster,30,q.friend.id,true,undefined,q.friend);
  else if(method==='cleanse')assert(q.e.item('cleanse'));
  else P.monsterActionCompleted(q.e,q.hero);
  assert(!q.hero.honroMonsterCondition);
  assert(!q.caster.honroMonsterState.attachedTo);
 }
});
test('knot jumps at most once to a clear same-floor neighbor without touching an ally NPC',()=>{
 const q=setup('sonmalmyeong'),w=begin(q);
 respond(q,w);resolve(q);
 assert.equal(q.hero.honroMonsterCondition?.kind,'knot');
 q.friend.x=q.hero.x+140;
 const hp=q.friend.hp;
 q.b.side=1;P.monsterRound(q.e);
 assert(!q.hero.honroMonsterCondition);
 assert(q.friend.hp<hp);
 const after=q.friend.hp;P.monsterRound(q.e);assert.equal(q.friend.hp,after);
});
test('seal blocks only the last affordable alternate and cleansing returns it',()=>{
 const basic=setup('geuseunsae');basic.hero.honroLastCombatSkill='A01';
 assert(!P.prepareMonsterPattern(basic.e,basic.caster,basic.hero));
 const q=setup('geuseunsae'),w=begin(q);respond(q,w);resolve(q);
 turn(q,q.hero);
 assert(q.e.skillAllowed(C.SKILLS.A01,q.hero));
 assert(!q.e.skillAllowed(C.SKILLS.A02,q.hero));
 assert(!q.e.fire('A02',45,.6));
 assert(q.e.item('cleanse'));
 assert(q.e.skillAllowed(C.SKILLS.A02,q.hero));
});
test('theft and stage settlement return one temporary item, with no repeat refund',()=>{
 const q=setup('yagwanggwi'),w=begin(q);
 respond(q,w);resolve(q);
 assert.equal(q.b.items.focus,1);
 assert(q.caster.honroMonsterState.lifted);
 const clone=new C.Engine(plain(q.b));
 assert.equal(clone.b.items.focus,1);
 clone.finishMonsterPatterns();clone.finishMonsterPatterns();
 assert.equal(clone.b.items.focus,2);
 const sieve=q.caster.honroMonsterState.lifted.sieve;
 Object.assign(q.hero,sieve);P.tickMonsterPatterns(q.e);
 assert.equal(q.b.items.focus,2);
 assert(!q.caster.honroMonsterState.lifted);
});
test('water pull stops before crossing wet ground and requires a real safe water region',()=>{
 const dry=setup('mulgwishin');
 assert(!P.prepareMonsterPattern(dry.e,dry.caster,dry.hero));
 const q=setup('mulgwishin');
 q.b.waters=[{x:300,y:780,w:294,depth:120,frozen:0,kind:'water'}];
 const w=begin(q);respond(q,w);resolve(q);
 assert(q.hero.x<650);
 assert(q.hero.x-q.hero.r>=594);
});
test('merging reuses a living group, preserves total health and releases without reproducing units',()=>{
 const q=setup('dokkaebibul');
 q.caster.honroMonsterGroup='fire';
 const fire=C.makeUnit('knight',1,520,800,{id:'flame',hp:950,maxHp:1000,loadout:['HSH01'],honroMonsterGroup:'fire',honroMonsterPattern:'dokkaebibul'});
 q.b.units.push(fire);
 const w=begin(q),hp=fire.hp+q.caster.hp;
 respond(q,w);resolve(q);
 assert.equal(q.caster.hp,hp);assert.equal(fire.honroMonsterState.mergedInto,q.caster.id);assert.equal(q.b.units.length,4);
 q.e.hurt(fire,20,q.hero.id,true,undefined,q.hero);
 assert(q.caster.hp<hp);const after=q.caster.hp;
 q.e.finishMonsterPatterns();assert(!fire.honroMonsterState.mergedInto);
 assert(Math.abs(fire.hp+q.caster.hp-after)<1e-8);
});
test('omen selects one live linked attacker and becomes invalid when target moves away',()=>{
 const q=setup('muyeo');
 const ally=C.makeUnit('knight',1,480,800,{id:'shooter',hp:500,maxHp:500,loadout:['HSH01']});
 q.b.units.push(ally);
 const w=begin(q);respond(q,w);resolve(q);
 assert.equal(P.monsterPriorityTarget(q.e,ally)?.id,q.hero.id);
 q.hero.x+=400;
 assert(!P.monsterPriorityTarget(q.e,ally));
});
test('broad warning attacks do not travel through a newly interposed wall',()=>{
 const q=setup('naruWarden'),w=begin(q),hp=q.hero.hp;
 q.b.terrain.push(solid('wall',570,300,65,500));
 respond(q,w);resolve(q);assert.equal(q.hero.hp,hp);
});
test('bier repair costs a scheduled cast, starts only on settlement and has a finite repair budget',()=>{
 const q=setup('bierRepair');
 const boss=C.makeUnit('knight',1,500,800,{id:'bier',hp:600,maxHp:1000,boss:1});
 q.b.units.push(boss);
 q.b.honroState={stage8Bier:{completedOnce:0,status:'moving'}};
 assert(!P.prepareMonsterPattern(q.e,q.caster,q.hero));
 q.b.honroState.stage8Bier={completedOnce:1,status:'settled'};
 for(let i=0;i<2;i++){
  if(q.caster.honroMonsterState)q.caster.honroMonsterState.cooldown=0;
  const w=begin(q);
  respond(q,w);resolve(q);
 }
 assert.equal(boss.hp,670);
 q.caster.honroMonsterState.cooldown=0;
 assert(!P.prepareMonsterPattern(q.e,q.caster,q.hero));
});
console.log(count+' monster mechanics checks passed');
