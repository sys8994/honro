/** Combined production VM regression, not browser QA or App Continue coverage.
 * Only the comparison VM changes the new damage scalar back to identity. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {runtimeParts} from '../shared/build.mjs';
import {battlefield} from '../game/tests/helpers.mjs';
const plain=value=>JSON.parse(JSON.stringify(value));
const sum=value=>Object.values(value).reduce((a,b)=>a+b,0);
const near=(a,b,message)=>assert(Math.abs(a-b)<1e-7,`${message}: ${a} vs ${b}`);
const sources=await runtimeParts({vector:false,render:false});
let replacements=0;
function context(baseline){
 const g=vm.createContext({console,performance,structuredClone});
 for(let source of sources){
  if(baseline)source=source.replace(/exports\.PLAYER_MAGE_DAMAGE_MULTIPLIER = 1\.20;/g,text=>{replacements++;return text.replace('1.20','1');});
  vm.runInContext(source,g);
 }
 return g;
}
function arena(g){
 const C=g.HONRO_CORE,P=g.HonroProgression,{b}=battlefield(g,16);
 b.units=b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall);
 Object.assign(b,{width:4000,height:2000,terrain:[{id:'floor',x:0,y:1500,w:4000,h:500,mat:'rock',hp:99999,maxHp:99999}],waters:[],fields:[],drafts:[],zones:[],enemyLimit:1,wind:0,rng:123456,phase:'aim',side:0});
 for(const [i,u]of b.units.entries())Object.assign(u,{x:3500+i*70,y:1500,vx:0,vy:0,acted:false,airborne:false,jumping:false});
 const mage=b.units.find(u=>u.cls==='mage');
 Object.assign(mage,{ranks:{M01:1,M08:8},loadout:['M08'],attack:1,focus:1000,maxFocus:1000,critChance:0});
 b.active=mage.id;
 const target=C.makeUnit('archer',1,1100,1500,{id:'combined-lured',hp:200,maxHp:200,armor:0,shield:0,awake:false,aggroUntil:0,loadout:[]});
 const controlled=C.makeUnit('archer',1,1600,1500,{id:'combined-controlled',hp:200,maxHp:200,armor:0,shield:0,awake:false,aggroUntil:0,loadout:[]});
 b.units.push(target,controlled);P.contributionState(b).enemies={};
 const e=engine(g,b),hits=observe(e,target.id);
 assert(e.fire('M08',0,.3),'new M08 cast succeeds');
 const launch=b.projectiles[0].damage;
 e.impact(b.projectiles[0],{x:1000,y:1500,n:{x:0,y:-1},terrain:b.terrain[0],t:0});
 b.projectiles=[];b.resolveAge=0;
 assert.equal(target.hp,200,'placement does not damage before enemy turn');
 assert.equal(target.x,1100,'placement does not teleport');
 return {g,C,P,b,e,target,controlled,mage,hits,launch};
}
function engine(g,b){const e=new g.HONRO_CORE.Engine(b);e.checkEnd=()=>false;return e;}
function observe(e,id){const hits=[],hurt=e.hurt.bind(e);e.hurt=(u,amount,...args)=>{const hp=u.hp;hurt(u,amount,...args);if(u.id===id&&u.hp<hp)hits.push({raw:amount,hp:hp-u.hp});};return hits;}
function finishTurn(C,e){const round=e.b.round;let ticks=0;while(e.b.round===round&&ticks++<2400)e.tick(C.STEP);assert(ticks<2400,'actual enemy turn terminates');return ticks;}
function repeatTicks(g,e,count=120){for(let i=0;i<count;i++)e.tick(g.HONRO_CORE.STEP);}
function finiteLedger(s){
 for(const row of Object.values(s.enemies)){
  assert(Number.isFinite(row.progress)&&row.progress>=0&&row.progress<=row.hp);
  assert(sum(row.damage)<=100*row.weight+1e-7,'damage evidence cannot exceed original enemy budget');
  assert(Object.keys(row.controls).length<=2,'CC evidence is finite');
  for(const n of [...Object.values(row.damage),...Object.values(row.support)])assert(Number.isFinite(n)&&n>=0);
 }
 assert(s.spent+s.forfeited<=s.total);for(const n of Object.values(s.paid))assert(Number.isFinite(n)&&n>=0);
}
function rewards(g,e,targetId,controlledId){
 const C=g.HONRO_CORE,P=g.HonroProgression,b=e.b,target=e.unit(targetId),cc=e.unit(controlledId),mage=b.units.find(u=>u.cls==='mage'),owner=b.units.find(u=>u.cls==='occultist'),archer=b.units.find(u=>u.cls==='archer');
 // Stun earns credit only by cancelling a real enemy-turn attack opportunity.
 Object.assign(mage,{x:1400,acted:true});Object.assign(cc,{x:1250,awake:true,aggroUntil:99,stun:1,honroStunOwner:mage.id});
 target.awake=false;target.aggroUntil=0;b.side=0;b.phase='aim';e.switchTeam();
 let s=P.contributionState(b);
 assert.equal(s.enemies[cc.id].support.mage,15);
 assert.equal(Object.keys(s.enemies[cc.id].controls).length,1);
 // Capture overlaps that CC band and must not create a second reward for it.
 const prison=e.spawnSummon(owner,'eater',1100,1500,1,8);
 assert.equal(target.eaterCapturedBy,prison.id);assert.equal(cc.eaterCapturedBy,prison.id);
 assert.equal(s.enemies[target.id].support.occultist,15);
 assert.equal(s.enemies[cc.id].support.mage,15);assert.equal(s.enemies[cc.id].support.occultist,undefined);
 assert(!s.enemies[prison.id],'prison is not an independent XP enemy');
 b.side=0;b.phase='aim';b.active=archer.id;
 const captured=plain(s),captureState=plain(b);
 repeatTicks(g,e);assert.deepEqual(plain(P.contributionState(b)),captured,'idle ticks cannot duplicate capture/CC evidence');
 const resumed=engine(g,plain(captureState));
 repeatTicks(g,resumed);assert.deepEqual(plain(P.contributionState(resumed.b)),captured,'JSON resume cannot capture or credit again');
 for(const current of [e,resumed]){
  const state=current.b,container=current.unit(prison.id),source=current.unit(archer.id),kills=state.kills;
  current.hurt(container,99999,source.id,false,undefined,undefined,'salheun');
  assert(current.unit(targetId).dead&&current.unit(controlledId).dead,'real prison transfer kills original enemies');
  assert.equal(state.kills,kills+2);P.flushContribution(current);
  const ledger=P.contributionState(state);finiteLedger(ledger);
  assert(Object.values(ledger.enemies).every(row=>row.defeated&&row.settled));
  assert(!ledger.enemies[prison.id]);assert(ledger.spent>0);
  assert.equal(ledger.rewardBalance,1);
  assert(ledger.actors.every(cls=>ledger.paid[cls]>0),'current party-share policy pays each companion from genuine evidence');
  const paid=plain(ledger),heroes=plain(state.heroes);
  repeatTicks(g,current);P.flushContribution(current);current.hurt(container,99999,source.id,false,undefined,undefined,'salheun');
  assert.deepEqual(plain(P.contributionState(state)),paid,'repeat transfer/ticks/flush cannot repay kills');
  assert.deepEqual(plain(state.heroes),heroes);
  const paidResume=engine(g,plain(state));P.flushContribution(paidResume);repeatTicks(g,paidResume);
  assert.deepEqual(plain(P.contributionState(paidResume.b)),paid,'paid JSON resume does not repay');
  assert.deepEqual(plain(paidResume.b.heroes),heroes);
 }
 assert.deepEqual(plain(P.contributionState(e.b)),plain(P.contributionState(resumed.b)));
 assert.deepEqual(plain(e.b.heroes),plain(resumed.b.heroes));
 return plain(P.contributionState(e.b));
}
const results=[];
for(const baseline of [true,false]){
 const g=context(baseline),a=arena(g),{C,b,e,target}=a;
 b.phase='aim';b.side=0;for(const u of b.units.filter(u=>u.side===0))u.acted=true;e.switchTeam();
 assert.equal(b.queue.length,0,'unawakened lure must not gain an attack slot');
 let ticks=0;while(!target.aiMove&&ticks++<120)e.tick(C.STEP);
 assert(target.aiMove?.lureStakeId!==undefined,'production enemy tick creates the lure path');
 e.tick(C.STEP);assert(target.x<1100,'production tick actually moves target');
 assert.equal(target.hp,200,'save occurs while moving, before contact');
 const restored=engine(g,plain(b)),restoredHits=observe(restored,target.id);
 finishTurn(C,e);finishTurn(C,restored);
 assert.equal(a.hits.length,1,'contact damages once during actual turn');assert.equal(restoredHits.length,1);
 near(target.x,restored.unit(target.id).x,'mid-pull JSON resume keeps movement');
 assert.equal(target.hp,restored.unit(target.id).hp);assert.equal(target.lastAct,0,'lure is not an attack');
 assert.equal(b.stakes[0].usedRounds[target.id],1);
 assert.deepEqual(plain(a.P.contributionState(b)),plain(a.P.contributionState(restored.b)));
 assert.deepEqual(a.hits,restoredHits,'resume neither rescales nor duplicates damage');
 const stakeDamage=b.stakes[0].damage;near(a.hits[0].raw,stakeDamage,'contact inherits saved stake damage once');
 const ledger=rewards(g,e,target.id,a.controlled.id);
 results.push({launch:a.launch,stakeDamage,hit:a.hits[0],ledger});
 console.log(`PASS ${baseline?'identity baseline':'production 1.20'}: actual lure movement, mid-pull JSON, CC/capture, finite repeat-safe XP`);
}
assert.equal(replacements,1,'identity baseline modifies exactly one new scalar');
near(results[1].launch,results[0].launch*1.2,'new M08 launch ×1.2');
near(results[1].stakeDamage,results[0].stakeDamage*1.2,'saved stake ×1.2');
near(results[1].hit.raw,results[0].hit.raw*1.2,'actual contact ×1.2, never ×1.44');
assert(Math.abs(results[1].hit.hp-results[0].hit.hp*1.2)<=1.2,'integer HP rounding only');
console.log('PASS combined lure, Damheo damage and contribution reward regression');
