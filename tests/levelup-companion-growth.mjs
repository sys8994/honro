/** Focused grant/recruitment regressions; controlled state, not campaign fullplay. */
import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,P=g.HonroProgression,X=g.HonroContributionXP,copy=x=>JSON.parse(JSON.stringify(x));
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS',name);};
function arena({policy=4,level=1,dead=false}={}){
 const heroes=C.freshRoster();for(const cls of C.CLASS_IDS)heroes[cls].xp=C.xpAtLevel(level);
 const u=C.makeUnit('archer',0,300,600,{id:'archer',loadout:['A01']});C.applyHero(u,heroes.archer,true);Object.assign(u,{hp:dead?0:20,focus:3,dead,moveLeft:4});
 const state={combat:{},cleared:false},limit={start:0,end:20000,total:20000,combat:8000};
 if(policy===4)state.contribution=X.create(20000,8000,['archer']);
 const b={mode:'campaign',honroStage:1,heroes,units:[u],honroState:{},honroGrowth:{limit,weight:2,ledger:{version:4,stages:{1:state}}},round:1,width:5000,honroMarkers:[]};
 const events=[],e={b,emit(type,value){events.push({type,...value});}};
 if(state.contribution)P.registerOwner(b,u);
 return {b,u,e,events,s:state.contribution};
}
function enemy(q,id='test',weight=1){const row=X.enemy(q.s,id,100,weight);X.damage(q.s,id,100,100,{archer:100});row.defeated=true;return row;}
const ups=q=>q.events.filter(e=>e.type==='level');
check('new contribution combat batch restores full new maxima once for many levels/enemies',()=>{
 const q=arena();enemy(q,'a');enemy(q,'b');const prior={phase:q.b.phase,acted:q.u.acted};P.flushContribution(q.e);
 assert.equal(q.u.hp,q.u.maxHp);assert.equal(q.u.focus,q.u.maxFocus);assert.equal(q.u.moveLeft,q.u.maxMove);assert(q.u.level>3);assert.equal(ups(q).length,1);assert.equal(ups(q)[0].previousLevel,1);assert.equal(ups(q)[0].value,q.u.level);assert.equal(q.u.acted,prior.acted);assert.equal(q.b.phase,prior.phase);
 q.u.hp-=5;q.u.focus-=2;const stable=copy(q.b);P.flushContribution(q.e);assert.deepEqual(copy(q.b),stable);assert.equal(ups(q).length,1);
});
check('level recovery consumes enemy wounds as system healing without support XP',()=>{
 const q=arena(),r=enemy(q);q.b.honroGrowth.weight=1;
 r.wounds[q.u.id]=[{hp:q.u.maxHp-q.u.hp,unit:1}];const before=copy(r.support);P.flushContribution(q.e);
 assert.deepEqual(copy(r.support),before);assert.equal(r.wounds[q.u.id].reduce((n,w)=>n+w.hp,0),0);
});
for(const policy of [3,4])for(const dead of [false,true])check(`policy ${policy} clear applies actual level event, dead=${dead}, repeat safe`,()=>{
 const q=arena({policy,dead});if(policy===4)enemy(q);P.complete(q.b,q.e);assert(q.u.level>1);
 assert.equal(q.u.hp,dead?0:q.u.maxHp);assert.equal(q.u.focus,dead?3:q.u.maxFocus);assert.equal(q.u.dead,dead);assert.equal(ups(q).length,dead?0:1);
 q.u.focus=1;if(!dead)q.u.hp=7;const before=copy(q.b);P.complete(q.b,q.e);assert.deepEqual(copy(q.b),before);
});
check('legacy combat and core fallback use the same full-recovery level event',()=>{
 for(const core of [false,true]){const q=arena({policy:3});if(core)delete q.b.honroGrowth;
 if(core)C.Engine.prototype.award.call(q.e,q.u,2000);else P.awardCombat(q.e,q.u,2000);
 assert.equal(q.u.hp,q.u.maxHp);assert.equal(q.u.focus,q.u.maxFocus);assert.equal(ups(q).length,1);
 }
});
check('dead core fallback never heals or emits a celebration',()=>{const q=arena({dead:true});delete q.b.honroGrowth;C.Engine.prototype.award.call(q.e,q.u,2000);assert.equal(q.u.hp,0);assert.equal(q.u.focus,3);assert.equal(ups(q).length,0);});
check('no level increase/capped grants cannot refill resources or repeat celebration',()=>{
 const q=arena({level:30});enemy(q);P.flushContribution(q.e);assert.equal(q.u.hp,20);assert.equal(q.u.focus,3);assert.equal(ups(q).length,0);assert.equal(C.applyLevelUp(q.u,q.b.heroes.archer,29),null);
 const a=arena();delete a.b.honroGrowth;C.Engine.prototype.award.call(a.e,a.u,1);assert.equal(a.u.hp,20);assert.equal(ups(a).length,0);
});
check('join average uses existing regular members, ignores NPC/summons/unrecruited placeholders',()=>{
 const p=g.HonroProfileStore.fresh();p.heroes.archer.xp=C.xpAtLevel(2)+10;p.heroes.knight.xp=C.xpAtLevel(30);
 P.recruit(p,g.HONRO_CONTENT.stages[1]);assert.equal(C.levelOf(p.heroes.mage),2);assert.equal(p.heroes.mage.xp,C.xpAtLevel(2));
 p.heroes.archer.xp=C.xpAtLevel(5);p.heroes.mage.xp=C.xpAtLevel(2);p.cleared[5]={rounds:1};
 P.recruitAtEntry(p,6);assert.equal(C.levelOf(p.heroes.knight),30,'previously grown unrecruited hero is preserved');
 const fresh=g.HonroProfileStore.fresh();fresh.recruited=['archer','mage'];fresh.cleared[5]={rounds:1};fresh.heroes.archer.xp=C.xpAtLevel(5);fresh.heroes.mage.xp=C.xpAtLevel(2);P.recruitAtEntry(fresh,6);assert.equal(C.levelOf(fresh.heroes.knight),3);
 fresh.heroes.archer.xp=C.xpAtLevel(9);fresh.heroes.mage.xp=C.xpAtLevel(3);fresh.heroes.knight.xp=C.xpAtLevel(3);fresh.cleared[10]={rounds:1};g.HonroAct2.recruit(fresh);assert.equal(C.levelOf(fresh.heroes.occultist),5);
 for(const cls of fresh.recruited){const h=fresh.heroes[cls];assert(C.pointsSpent(h,cls)<=C.pointsEarned(h));for(const[id,rank]of Object.entries(h.ranks)){const n=C.TALENT_MAP[id];if(!n)continue;assert(rank<=n.maxRank);assert(C.levelOf(h)>=C.requiredRankLevel(n,rank));assert(!n.prereq||h.ranks[n.prereq]>0);}for(const id of fresh.loadouts[cls].filter(Boolean))assert(C.knownSkills(h,cls).includes(id));}
 assert.doesNotThrow(()=>C.validate({...copy(fresh),cleared:{}}),'initial XP/rank/SP/loadout must pass production save validation');
});
check('repeat recruit and profile reload never apply historical floor or erase SP/skills',()=>{
 const p=g.HonroProfileStore.fresh();p.heroes.archer.xp=C.xpAtLevel(1);P.recruit(p,g.HONRO_CONTENT.stages[1]);assert.equal(C.levelOf(p.heroes.mage),1);
 const before=copy(p.heroes.mage);p.heroes.archer.xp=C.xpAtLevel(20);for(let i=0;i<3;i++){P.recruit(p,g.HONRO_CONTENT.stages[1]);P.repairRecruits(p);}assert.deepEqual(copy(p.heroes.mage),before);
 const loaded=g.HonroProfileStore.migrate(JSON.stringify(p));assert.deepEqual(copy(loaded.heroes.mage),before);
 const grown=copy(p.heroes.archer);P.recruit(p,{id:1,recruit:'archer'});assert.deepEqual(copy(p.heroes.archer),grown);
});
check('stage budgets and NPC authored levels stay on their original anchor',()=>{
 assert.equal(P.legacyCampaignAnchor(20),61569);assert.deepEqual(copy(P.budget(21)),{start:61569,end:68522,total:6953,combat:2781});assert.equal(P.joinLevel(g.HONRO_CONTENT.stages[1]),3);assert.equal(P.joinLevel(g.HONRO_CONTENT.stages[4]),6);
 const totals=[180,270,462,731,1066,1461,3117,4168,3559,4200,2931,3076,3367,3673,3827,4310,4480,4817,5170,5347,6953,7226,7887,8157,9584,10156,10588,11478,12016,12477];assert.deepEqual(copy(g.HONRO_CONTENT.stages.map(st=>P.budget(st.id).total)),totals);
});
console.log(`${checks} focused growth checks passed`);
