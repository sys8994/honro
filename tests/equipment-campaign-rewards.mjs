import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';

const g=await runtime({legacyMaps:false,productionStory:true});
const {HONRO_CORE:C,HonroEquipment:E,HonroProfileStore:P}=g;
const plain=x=>JSON.parse(JSON.stringify(x));
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
let count=0;
function test(label,fn){fn();count++;console.log('PASS',label);}
function app(profile=P.fresh()){
 return {profile,normalProfile:profile,screen:'rest',profileStore:{locked:false,save(){return !this.fail;}},notify(){}};
}
function arena(cls,items,revision=true){
 const p=C.defaults(),skill=C.baseSkill(cls);
 p.heroes[cls].equipmentIds=items;
 const b=C.createBattle(1,p,'practice',{party:[cls],wind:0}),u=b.units.find(v=>v.side===0);
 Object.assign(b,{width:2400,height:1400,terrain:[{id:'floor',x:0,y:900,w:2400,h:500,mat:'rock',hp:99999,maxHp:99999}],fields:[],drafts:[],waters:[],
  practiceCombat:true,active:u.id,side:0,phase:'aim'});
 if(revision)b.honroEquipmentRewardRevision=2;
 Object.assign(u,{x:400,y:900,vx:0,vy:0,attack:1,hp:900,maxHp:1200,focus:900,maxFocus:900,moveLeft:800,maxMove:800,loadout:[skill],
  armor:0,critChance:0,acted:false,airborne:false,jumping:false,equipmentIds:items});
 const foe=C.makeUnit('archer',1,980,900,{id:'foe',hp:1000,maxHp:1000});
 b.units=[u,foe];
 const e=new C.Engine(b);e.checkEnd=()=>false;
 return {e,b,u,foe,skill};
}
test('only released Act5 campaign clears open both rewards; legacy choices and optional proofs intact',()=>{
 g.HONRO_ACT5_RELEASE=true;
 try{
  const a=app(),eq=a.profile.equipment;
  assert(E.grant(a.profile,'eq_da_t2_choice'));
  assert(E.choose(a,'eq_da_t2_choice','itm_da_04'));
  a.profile.cleared={15:{visits:1},43:{visits:1},48:{visits:0},54:{visits:1}};
  const old=plain(a.profile);
  const fixed=P.migrate(JSON.stringify(old));
  assert(fixed.equipment.ownedItemIds.includes('itm_co_16'));
  assert(!fixed.equipment.rewardLedger.eq_da_t4_choice);
  assert(!fixed.equipment.rewardLedger.eq_co_07);
  assert(!fixed.equipment.rewardLedger.eq_co_t4_choice);
  const b=app(fixed);
  b.profile.cleared[48]={visits:1};
  assert(E.observe(b));
  assert.equal(b.profile.equipment.rewardLedger.eq_da_t4_choice.state,'pending');
  assert.equal(b.profile.equipment.rewardLedger.eq_da_t2_choice.selectedItemId,'itm_da_04');
  assert(!b.profile.equipment.ownedItemIds.includes('itm_da_07')&&!b.profile.equipment.ownedItemIds.includes('itm_da_08'));
  b.profileStore.fail=true;assert(!E.choose(b,'eq_da_t4_choice','itm_da_08'));
  b.profileStore.fail=false;assert(E.choose(b,'eq_da_t4_choice','itm_da_08'));
  assert(!E.choose(b,'eq_da_t4_choice','itm_da_07'));
  const earned=plain(b.profile.equipment);
  assert.deepEqual(plain(P.migrate(JSON.stringify(b.profile)).equipment),earned);
  assert(!E.observe(b));
  g.HONRO_ACT5_RELEASE=false;
  assert.deepEqual(plain(P.migrate(JSON.stringify(b.profile)).equipment),earned);
  assert(!P.migrate(JSON.stringify(old)).equipment.rewardLedger.eq_co_16);
 }finally{g.HONRO_ACT5_RELEASE=false;}
});
test('saved eligible receipt recovers from a failed payout transaction without choosing gear',()=>{
 g.HONRO_ACT5_RELEASE=true;
 try{
  const a=app();
  a.profile.cleared={43:{visits:1},48:{visits:1}};
  a.engine={b:{mode:'campaign',honroStage:48,units:[]}};
  a.done=true;
  assert(E.capture(a,{won:true}));
  a.profileStore.fail=true;assert(!E.observe(a,{won:true}));
  assert(!a.profile.equipment.ownedItemIds.includes('itm_co_16'));
  const v=app(P.migrate(JSON.stringify(a.profile)));
  assert(v.profile.equipment.ownedItemIds.includes('itm_co_16'));
  assert.equal(v.profile.equipment.rewardLedger.eq_da_t4_choice.state,'pending');
  assert.equal(v.profile.equipment.rewardLedger.eq_da_t4_choice.selectedItemId,null);
  assert(!v.profile.heroes.mage.equipmentIds);
 }finally{g.HONRO_ACT5_RELEASE=false;}
});
test('first voluntary jump costs 15% less, then consumes native movement; recorded old battle stays native',()=>{
 for(const current of [false,true]){
  const {e,u}=arena('knight',['itm_hw_04'],current),native=75;
  near(e.jumpCost(u),current?native*.85:native);
  const before=u.moveLeft;
  assert(e.jump());
  near(before-u.moveLeft,current?native*.85:native);
  near(e.jumpCost(u),native);
 }
});
test('reserve lowers one actual paid cast after defending and obeys the 30% cap',()=>{
 const {e,b,u}=arena('mage',['itm_da_03']),s=C.SKILLS.M03;
 u.loadout=[s.id];
 const cost=e.manaCost(s,u,.5);
 e.defendEquipment(u);assert(u.equipmentState.reserveReady);
 assert(e.manaCost(s,u,.5)<cost);
 const stated=e.manaCost(s,u,.5),focus=u.focus;
 assert(e.fire(s.id,45,.5));
 near(focus-u.focus,stated);
 assert(!u.equipmentState.reserveReady);
 near(e.manaCost(s,u,.5),cost);
 assert(C.equipmentManaCost(u,s,100,.8)===70);
 assert.equal(b.shots,1);
});
test('defend gives wounded adjacent ally cover, preserves stronger shield and cannot cross a wall',()=>{
 const {e,b,u}=arena('mage',['itm_da_04']);
 const ally=C.makeUnit('archer',0,595,900,{id:'ally',hp:140,maxHp:250});
 b.units.push(ally);
 b.terrain.push({id:'wall',x:480,y:400,w:30,h:500,mat:'rock',hp:99999,maxHp:99999});
 e.defendEquipment(u);assert(!ally.shield);
 b.terrain.pop();b.sceneVersion++;
 e.defendEquipment(u);assert.equal(ally.shield,13);
 ally.shield=40;e.defendEquipment(u);assert.equal(ally.shield,40);
});
test('brace shortens one hostile body impulse and never stacks with another mitigation on that hit',()=>{
 const {e,u,foe}=arena('knight',['itm_hw_03']);
 e.defendEquipment(u);
 const p={owner:foe.id,skill:'A01',shot:2,vx:40,vy:1};
 assert.deepEqual(plain(C.gearImpulse(e,u,120,30,p)),{vx:72,vy:18});
 assert.deepEqual(plain(C.gearImpulse(e,u,120,30,p)),{vx:120,vy:30});
});
test('grounded soul converts form and qi without minting damage; jumping or an old save uses original vector',()=>{
 for(const current of [false,true]){
  const {e,b,u}=arena('occultist',['itm_so_03'],current);
  assert(e.fire('O01',0,.45));
  const gear=b.projectiles[0].equipment,base=C.attackForSkill(C.SKILLS.O01);
  if(current){near(gear.vector.form,base.form*.5);near(gear.vector.qi,base.qi*.5);near(gear.vector.soul,.92);}
  else assert(!gear.vector);
  assert(!C.gearCapture(u,C.SKILLS.O01,100,false,b.round,current).vector);
 }
});
test('landing grants a small non-stacking shield through actual jump integration',()=>{
 const {e,b,u}=arena('occultist',['itm_so_04']);
 assert(e.jump());
 for(let n=0;n<240&&u.jumping;n++)e.stepUnits(C.STEP);
 assert(!u.jumping);assert.equal(u.shield,48);
 assert.equal(u.equipmentState.landingShieldCycle,b.round);
 assert(e.jump());
 for(let n=0;n<240&&u.jumping;n++)e.stepUnits(C.STEP);
 assert.equal(u.shield,48);
});
test('a real launched basic arrow can apply high-ground slow only once and leaves native legacy snapshots alone',()=>{
 for(const current of [false,true]){
  const {e,b,u,foe}=arena('archer',['itm_se_05'],current);
  b.terrain.push({id:'ledge',x:100,y:600,w:540,h:30,oneWay:true,mat:'rock',hp:99999,maxHp:99999});
  u.y=600;
  assert(e.fire('A01',0,.7));
  const p=b.projectiles[0];
  e.hurt(foe,15,u.id,true,p,foe);
  if(current){near(foe.slowed.factor,.18);assert.equal(foe.slowed.expires,b.round+1);}
  else assert(!foe.slowed);
  delete foe.slowed;e.hurt(foe,15,u.id,true,p,foe);
  assert(!foe.slowed);
 }
});
console.log(count+' campaign equipment checks passed');
