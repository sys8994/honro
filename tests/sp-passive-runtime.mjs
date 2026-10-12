import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildCore} from '../game/engine/build.mjs';
import {legacySpHooks} from './lib/sp-balance-baseline.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);g.HONRO_DEBUG_DAMAGE=true;const C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x));
function arena(cls='occultist'){
 const p=C.defaults();p.heroes[cls].xp=C.xpAtLevel(20);const b=C.createBattle(1,p,'practice',{party:[cls],wind:0});b.practiceCombat=false;b.units=b.units.slice(0,1);b.waters=[];b.fields=[];
 const u=b.units[0];Object.assign(u,{x:500,y:800,hp:1000,maxHp:1000,armor:0,shield:0,focus:0,maxFocus:500,attack:1,dead:false,critChance:0,critMultiplier:1,ranks:{[C.baseSkill(cls)]:1}});
 const foe=C.makeUnit('archer',1,650,800,{id:'test-foe',hp:10000,maxHp:10000,armor:0,attack:1,combatBaseAttack:1,shield:0,awake:true,loadout:['LA01']});b.units.push(foe);const e=new C.Engine(b);e.random=()=>.99;return {p,b,u,foe,e};
}
// Every rank's authored growth is exposed by at least one real tooltip row.
for(const t of C.TALENTS.filter(t=>t.passive))for(let r=1;r<=8;r++)assert.notEqual(JSON.stringify(C.skillEffectRows(t.id,r)),JSON.stringify(C.skillEffectRows(t.id,r-1)),`${t.id} rank ${r} is a display-only plateau`);
// Base stats and late volley share the exact runtime coefficient contract.
for(let r=1;r<=8;r++){
 assert.equal(C.volleyDamage(r),.42+.02*Math.min(4,r-1)+.045*Math.max(0,r-5));
 const h={...C.freshHero('mage'),xp:C.xpAtLevel(20),ranks:{M01:1,MP02:r},statTraining:10},s=C.heroStats(h,'mage');
 assert.equal(s.regen,14+Math.floor(19*.6)+r*.5+s.mp*.005*r);
 const a=arena('mage');C.applyHero(a.u,h,false);a.u.focus=0;a.b.phase='aim';a.b.active=a.u.id;a.b.side=0;a.e.wait();assert(a.u.focus>0,'empty MP must still regenerate');
}
// Rank seven and eight split different amounts, including hits below the old 14%-HP threshold.
for(let r=1;r<=8;r++){
 const a=arena();a.u.ranks.OP03=r;const ghost=a.e.spawnSummon(a.u,'stalker',a.u.x+30,a.u.y);Object.assign(ghost,{hp:1000,maxHp:1000,armor:0,shield:0});
 a.e.hurt(a.u,100,a.foe.id);const share=Math.round(100*(.06*Math.min(4,r)+.045*Math.max(0,r-4)));assert.equal(a.u.hp,1000-(100-share));assert.equal(ghost.hp,1000-share);
 const b=arena();b.u.ranks.OP03=r;const weak=b.e.spawnSummon(b.u,'stalker',b.u.x+30,b.u.y);Object.assign(weak,{hp:7,maxHp:1000,armor:0,shield:0});b.e.hurt(b.u,1000,b.foe.id);assert(weak.dead||weak.hp===0);assert.equal(b.u.hp,7,'cannot share more than the summon has');
 const c=arena();c.u.ranks.OP03=r;c.u.shield=100;const safe=c.e.spawnSummon(c.u,'stalker',c.u.x+30,c.u.y),hp=safe.hp;c.e.hurt(c.u,100,c.foe.id);assert.equal(safe.hp,hp,'absorbed damage must not hurt the summon');
}
// A mark needs the same owner and must still be live. Ordinary owner spells get no summon bonus.
for(let r=1;r<=8;r++){
 const a=arena();a.u.ranks.OP02=r;const spirit=a.e.spawnSummon(a.u,'stalker',a.u.x+30,a.u.y);
 const hit=(owner,live=true,own=true)=>{a.foe.hp=10000;a.foe.curseOwner=own?a.u.id:'other';a.foe.curseTurns=live?2:0;a.e.hurt(a.foe,100,owner);return 10000-a.foe.hp;};
 const base=hit(spirit.id,false);const amplified=hit(spirit.id),trace=g.HONRO_DAMAGE_TRACE.at(-1);assert.equal(trace.conditionMultiplier,1+.07*r);assert.equal(amplified,Math.round(trace.skillDamage*trace.conditionMultiplier*trace.existenceMultiplier*trace.defenseMultiplier));assert.equal(hit(spirit.id,true,false),base);assert.equal(hit(a.u.id),hit(a.u.id,false));
}
// AP05 rank eight has real extra steady-state damage, not merely a tooltip duration.
{
 const losses=[];for(const rank of [7,8]){const a=arena('archer');a.u.ranks.AP05=rank;for(let turn=1;turn<=6;turn++){a.u.arrowTurn=turn;const before=a.foe.hp,p={id:turn,skill:'A01',shot:turn,owner:a.u.id,side:0,damage:100,rootDamage:100,skillRank:1,vx:500,vy:0,x:a.foe.x,y:a.foe.y,hit:[]};a.e.hurt(a.foe,100,a.u.id,true,p,{x:a.foe.x,y:a.foe.y-a.foe.h*.5});if(turn===6)losses.push(before-a.foe.hp);}}
 assert.deepEqual(losses,[144,152]);
}
// Each of SP01's exclusive cast families reads the shared rank coefficient.
for(let rank=1;rank<=8;rank++){
 const a=arena('knight'),rush0=a.e.effective(C.SKILLS.S01,a.u),blade0=a.e.effective(C.SKILLS.S09,a.u);a.u.ranks.SP01=rank;
 assert(Math.abs(C.meleeFactor(a.u,1)-(1.35+.06*rank))<1e-10);
 assert(Math.abs(a.e.effective(C.SKILLS.S01,a.u).damage/rush0.damage-(1+.06*rank))<1e-10);
 assert(Math.abs(a.e.effective(C.SKILLS.S09,a.u).speed/blade0.speed-(1+.04*rank))<1e-10);
 const arrow=arena('archer');arrow.u.ranks.AP04=rank;assert(Math.abs(C.trajectoryMultiplier({skill:'A14',launchX:0,x:0,y:0,vx:1000,vy:0},arrow.u,{x:1800,y:0})-(1.4+.085*rank))<1e-10);
}
// Last stand is still one use; later recovery and guard are effective and serializable.
for(let r=1;r<=8;r++){
 const a=arena('knight');a.u.ranks.SP05=r;a.e.hurt(a.u,2000,a.foe.id);assert(a.u.lastStandUsed&&!a.u.dead);assert.equal(a.u.hp,Math.round(a.u.maxHp*(.08+.08*(r-1))));assert.equal(a.u.martialGuard.reduction,.18+.035*(r-1));
 a.e.hurt(a.u,10000,a.foe.id);assert(a.u.dead&&a.u.hp===0);
}
// Natural expiry refunds do not run on dead/replaced spirits; the next discount is consumed once.
for(let r=1;r<=8;r++){
 const a=arena();a.u.ranks.OP04=r;const spirit=a.e.spawnSummon(a.u,'stalker',600,800);spirit.summonExpires=a.b.round-1;a.e.expireSummon(spirit);assert.equal(a.u.focus,500*(.058+.05*(r-1)));assert.equal(a.u.nextSummonDiscount,.035+.055*(r-1));const focus=a.u.focus;assert.equal(a.e.expireSummon(spirit),false);assert.equal(a.u.focus,focus);
}
// Saved allocation is never reset. Only derived hero stats change once; current resource fractions survive.
{
 const p=C.defaults(),old=legacySpHooks(C);for(const cls of C.CLASS_IDS){p.heroes[cls].xp=C.xpAtLevel(20);p.heroes[cls].statTraining=20;p.heroes[cls].ranks[C.TALENTS.find(t=>t.cls===cls&&t.passive).id]=8;}
 const b=C.createBattle(1,p,'campaign',{party:C.CLASS_IDS,wind:0});delete b.spBalanceRevision;const allocations=JSON.stringify(b.heroes);
 for(const [i,u] of b.units.filter(u=>u.side===0).entries()){const s=old.stats(b.heroes[u.cls],u.cls);Object.assign(u,{maxHp:s.hp,hp:i===3?0:Math.floor(s.hp*.6),maxFocus:s.mp,focus:s.mp*.3,maxMove:s.move,moveLeft:s.move*.4,attack:s.attack,armor:s.armor,critChance:s.critChance,critMultiplier:s.critMultiplier,regen:s.regen,dead:i===3,acted:true,bound:2});}
 const e=new C.Engine(b),owner=b.units.find(u=>u.cls==='occultist'&&u.side===0);const spirit=e.spawnSummon(owner,'stalker',owner.x+30,owner.y),ghost=plain(spirit),enemies=plain(b.units.filter(u=>u.side===1)),projectiles=plain(b.projectiles);
 const fractions=b.units.filter(u=>u.side===0&&!u.summoned).map(u=>[u.id,u.hp/u.maxHp,u.focus/u.maxFocus,u.moveLeft/u.maxMove]);
 C.applySpBalanceMigration(b);assert.equal(JSON.stringify(b.heroes),allocations);assert.deepEqual(plain(spirit),ghost);assert.deepEqual(plain(b.units.filter(u=>u.side===1)),enemies);assert.deepEqual(plain(b.projectiles),projectiles);
 for(const [id,hp,mp,movement] of fractions){const u=b.units.find(u=>u.id===id),s=C.heroStats(b.heroes[u.cls],u.cls);assert.equal(u.maxHp,s.hp);assert.equal(u.armor,s.armor);assert(Math.abs(u.hp/u.maxHp-hp)<1/u.maxHp+.000001);assert(Math.abs(u.focus/u.maxFocus-mp)<1e-10);assert(Math.abs(u.moveLeft/u.maxMove-movement)<1e-10);assert.equal(u.acted,true);assert.equal(u.bound,2);}
 const once=JSON.stringify(b);C.applySpBalanceMigration(b);assert.equal(JSON.stringify(b),once);p.saved=b;const loaded=C.validate(plain(p));assert.deepEqual(plain(loaded.heroes),plain(p.heroes));assert.equal(loaded.saved.spBalanceRevision,1);
}
// Actual and displayed defense caps match; no high-level investment displays unusable 75% defense.
for(const cls of C.CLASS_IDS){const h={...C.freshHero(cls),xp:C.xpAtLevel(30),statTraining:52,ranks:{[C.baseSkill(cls)]:1,...(cls==='knight'?{SP02:8}:{})}};assert(C.heroStats(h,cls).armor<=.70);}
const activeAudit=C.currentActiveSpAudit();assert.equal(activeAudit.length,64);const o16=activeAudit.find(r=>r.id==='O16');assert.equal(o16.authoredTier,5);assert.equal(o16.coverage,'missing-legacy-utility');assert.equal(o16.legacy.tier,1);assert(activeAudit.filter(r=>r.coverage==='authored-redesign').every(r=>r.runtimeFactor===1));
console.log('PASS SP runtime coefficients, conditional limits, every rank, shared-save migration and resource preservation');
