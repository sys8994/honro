import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,R=g.HonroAct1Roster,plain=x=>JSON.parse(JSON.stringify(x));
const originalApply=R.applyDefense,originalBattle=R.applyBattleDefense;
const strip=u=>{const v=plain(u);if(v.honroAct1DefenseRevision===1){delete v.existenceDefense;delete v.honroAct1DefenseRevision;}return v;};
const rows=[];
function sample(q){return q.e.heroesAlive().map(hero=>{
 const sid={archer:'A01',mage:'M01',knight:'S00'}[hero.cls],s=C.SKILLS[sid],hits=[];
 for(const target of q.b.units.filter(u=>u.side===1)){
  const b=plain(q.b),attacker=b.units.find(u=>u.id===hero.id),foe=b.units.find(u=>u.id===target.id);
  attacker.critChance=0;attacker.ranks[sid]=1;attacker.x=foe.x-900;attacker.y=foe.y;
  b.active=attacker.id;b.phase='aim';b.side=0;b.shot=1;b.units=[attacker,foe];
  const e=new C.Engine(b);e.checkEnd=()=>false;e.random=()=>.99;
  const damage=e.effective(s,attacker).damage,p={skill:sid,owner:attacker.id,side:0,shot:1,skillRank:1,damage,x:foe.x,y:foe.y-foe.h*.5,launchX:attacker.x,launchY:attacker.y-foe.h*.5,apexY:attacker.y-foe.h*.5,vx:800,vy:0,mode:s.mode,hit:[],existenceAttack:s.existenceAttack};
  const hp=foe.hp;e.hurt(foe,damage,attacker.id,true,p,{x:foe.x,y:foe.y-foe.h*.5});const dealt=hp-foe.hp;
  assert(dealt>0);hits.push({id:foe.id,kind:foe.honroVariant||foe.honroType,elite:!!foe.elite,boss:!!(foe.boss||foe.honroMidboss||foe.honroFinalBoss),hp,damage:dealt,multiplier:C.existenceMultiplier(s.existenceAttack,foe,attacker),hitsToKill:Math.ceil(hp/dealt)});
 }
 return {class:hero.cls,skill:sid,weightedEffectiveness:hits.reduce((n,h)=>n+h.hp*h.multiplier,0)/hits.reduce((n,h)=>n+h.hp,0),hitWorkload:hits.reduce((n,h)=>n+h.hitsToKill,0),hits};
});}
for(let stage=1;stage<=30;stage++){
 R.applyDefense=u=>u;R.applyBattleDefense=b=>b;const before=battlefield(g,stage);
 R.applyDefense=originalApply;R.applyBattleDefense=originalBattle;const after=battlefield(g,stage);
 assert.deepEqual(plain(after.b.units.map(strip)),plain(before.b.units),'Only default spirit sensitivity changes, stage '+stage);
 assert.deepEqual(plain(after.b.honroEvents),plain(before.b.honroEvents));
 if(stage>10){assert.deepEqual(plain(after.b.units),plain(before.b.units));continue;}
 const roster={};for(const u of after.b.units.filter(u=>u.side===1)){const k=u.honroVariant||u.honroType;roster[k]??={count:0,elites:0,bosses:0};roster[k].count++;roster[k].elites+=!!u.elite;roster[k].bosses+=!!(u.boss||u.honroMidboss||u.honroFinalBoss);}
 rows.push({stage,roster,party:after.e.heroesAlive().map(u=>u.cls),waves:plain(after.b.honroEvents.filter(e=>e.action?.type==='spawn')),before:sample(before),after:sample(after)});
 for(const kind of Object.keys(R.defenseProfiles)){
  // Shared factory serves ordinary/elite finite reinforcement and habitat spawns.
  const u=g.HonroWorld.createEnemy(after.b,after.st,1000,kind,10,1000,true);
  assert.deepEqual(plain(C.defenseForUnit(u)),plain(R.defenseProfiles[kind]));
  assert(u.honroAct1DefenseRevision===1);assert.equal(u.elite,stage!==1);
 }
}
const b={mode:'campaign',honroStage:8,honroCustom:false};
for(const kind of Object.keys(R.defenseProfiles)){
 const u={side:1,honroVariant:kind,hp:47,existenceShift:{form:.08},manifested:true,formDamageTakenBonus:.12};
 R.applyDefense(b,u);assert.equal(C.effectiveDefenseForUnit(u).form,R.defenseProfiles[kind].form+.08+.12);
 const saved=plain(u);R.applyDefense(b,u);assert.deepEqual(plain(u),saved,'Idempotent saved profile');
 for(const extra of [{side:0},{side:2},{boss:1},{honroMidboss:true},{honroFinalBoss:true},{summonKind:'lantern'},{existenceDefense:{form:.11,qi:.22,soul:.33}}]){const v={side:1,honroVariant:kind,...extra},old=plain(v);R.applyDefense(b,v);assert.deepEqual(v,old);}
 for(const extra of [{mode:'practice'},{honroCustom:true},{honroStage:0},{honroStage:11},{honroStage:30},{honroStage:undefined}]){const v={side:1,honroVariant:kind};R.applyDefense({...b,...extra},v);assert(!v.existenceDefense);}
 for(const id of ['A01','M01','S00','S09','O01']){const a=C.ATTACK_EXISTENCE[id],old=C.existenceMultiplier(a,{side:1,honroVariant:kind}),next=C.existenceMultiplier(a,{side:1,honroVariant:kind,existenceDefense:R.defenseProfiles[kind]});assert(next>=old);assert(next<=1.5);if(id==='M01')assert(next-old<.045);if(id==='O01')assert.equal(next,old);}
}
// Game/Stage View/Playtest share createBattle, not a separate balance path.
const st=g.HONRO_PROJECT.stages[7],p=g.HonroMaps.profileFor(st);
const game=g.HonroMaps.createBattle(st,g.HONRO_PROJECT,p,{origin:'campaign'}),workshop=g.HonroMaps.createBattle(st,g.HONRO_PROJECT,p,{origin:'workshop'});
assert.deepEqual(plain(game.units.map(u=>C.defenseForUnit(u))),plain(workshop.units.map(u=>C.defenseForUnit(u))));
const custom=plain(st);custom.metadata.campaign=false;const cb=g.HonroMaps.createBattle(custom,g.HONRO_PROJECT,p,{origin:'workshop'});assert(!cb.units.some(u=>u.honroAct1DefenseRevision));
for(const row of rows){const a=row.before[0],z=row.after[0];assert(z.hitWorkload<=a.hitWorkload);console.log(`Stage ${row.stage}: Seolo hit workload ${a.hitWorkload}->${z.hitWorkload}, HP-weighted effectiveness ${a.weightedEffectiveness.toFixed(4)}->${z.weightedEffectiveness.toFixed(4)}`);}
await mkdir('_local/reports/act1-defense',{recursive:true});await writeFile('_local/reports/act1-defense/workload.json',JSON.stringify({scope:'Stage-entry, rank 1, no crit, fixed standing body hit. Repeated-hit workload and HP-weighted effectiveness, NOT full combat or elapsed TTK.',rows},null,2)+'\n');
console.log('PASS: stage-scoped profiles, 30-stage budget preservation, factory waves/elites, bosses, explicit overrides, modifiers, Game/Workshop and weighted damage');
