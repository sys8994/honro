/** Independent quantitative audit. Scenario probabilities are sensitivity inputs,
 * never measured hit rates, live damage modifiers, or an automatic balance pass. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdir,writeFile} from 'node:fs/promises';
import {buildCore} from '../game/engine/build.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE;
const plain=x=>JSON.parse(JSON.stringify(x)),plans=[[1],[2],[2,1],[2,2],[2,2,1],[2,2,2],[2,2,2],[2,2,3]],caps=[1,2,2,4,4,8,8,12];
const scenarios=[
 {id:'open-low-rebound',hit:[.55,.08,.04,.02],surface:.30},
 {id:'mixed-rebound',hit:[.55,.22,.16,.12],surface:.65},
 {id:'corridor-rebound',hit:[.55,.40,.32,.24],surface:.90},
];
// A unit impact terminates that branch. Only surviving branches which reach a
// surface can split; summing every generation's full maximum would double count.
function expected(plan,decay,s,generation=0){const q=s.hit[generation];return q+(generation<plan.length?(1-q)*s.surface*plan[generation]*decay*expected(plan,decay,s,generation+1):0);}
function envelope(plan,decay,generation=0){return generation<plan.length?Math.max(1,plan[generation]*decay*envelope(plan,decay,generation+1)):1;}
const reference=[],reflection=[],eater=[],activeMarginals=[];
for(const cls of ['mage','occultist'])for(const level of [7,15,30]){
 const h=C.freshHero(cls);h.xp=C.xpAtLevel(level);const trained=plain(h);assert(C.investStat(trained,cls));
 for(const s of C.SP_SCENARIOS){const before=C.spBuildAxes(h,cls,s),after=C.spBuildAxes(trained,cls,s);reference.push({cls,level,scenario:s.id,before,after,...plain(C.spMarginal(before,after,s.weights[cls]))});}
}
for(let rank=1;rank<=8;rank++){
 const plan=plain(C.waveReflectionPlan(rank));assert.deepEqual(plan,plans[rank-1]);assert.equal(plan.reduce((n,c)=>n*c,1),caps[rank-1]);assert.equal(C.WAVE_REFLECTION_DECAY,.82);
 const damage=C.SKILLS.M11.damage*C.skillBalanceFactor(C.SKILLS.M11)*C.skillDamageFactor(rank),mp=C.SKILLS.M11.cost*C.MANA_COST_MULTIPLIER*C.skillManaFactor(rank);
 assert.equal(C.skillBalanceFactor(C.SKILLS.M11),1);assert.equal(C.SKILLS.M11.damage,46);
 for(const s of scenarios){const contacts=expected(plan,C.WAVE_REFLECTION_DECAY,s),row={rank,scenario:s.id,initialProjectiles:1,maxFrontier:caps[rank-1],baseDamageAtAttack1:damage,mp,expectedDamageAtAttack1:damage*contacts,expectedDamagePerMp:damage*contacts/mp,maxDamageAtAttack1:damage*envelope(plan,C.WAVE_REFLECTION_DECAY),finalGenerationDamageAtAttack1:damage*caps[rank-1]*C.WAVE_REFLECTION_DECAY**plan.length};reflection.push(row);
  if(rank>1){const before=reflection.find(x=>x.rank===rank-1&&x.scenario===s.id);assert(row.expectedDamageAtAttack1>before.expectedDamageAtAttack1,'Every invested rank increases modeled damage including SP7');assert(row.mp<before.mp);const axesBefore={offense:1,survival:1,sustain:1,mobility:1},axesAfter={offense:.75+.25*row.expectedDamageAtAttack1/before.expectedDamageAtAttack1,survival:1,sustain:1/(.75+.25*row.mp/before.mp),mobility:1};activeMarginals.push({skill:'M11',rank,scenario:s.id,activeCastShare:.25,...plain(C.spMarginal(axesBefore,axesAfter,C.SP_SCENARIOS[0].weights.mage))});}
 }
}
for(const level of [7,15,30])for(let rank=1;rank<=8;rank++){
 const b=C.createBattle(1,C.defaults(),'practice',{party:['occultist'],wind:0}),owner=b.units.find(u=>u.side===0);b.units=[owner];b.terrain=[{id:'floor',x:0,y:1500,w:3000,h:500,mat:'rock',hp:99999,maxHp:99999}];b.width=3000;b.height=2000;Object.assign(owner,{level,x:400,y:1500,ranks:{O14:rank}});const e=new C.Engine(b),prison=e.spawnSummon(owner,'eater',1000,1500,1,rank);
 assert.equal(prison.maxHp,Math.round(205*(1+.07*(rank-1))*(.78+level*.027)),'Independent HP formula');assert.equal(prison.side,1);assert.equal(prison.summonExpires-b.round+1,[2,2,2,3,3,3,4,4][rank-1]);
 for(const count of [0,1,3,6])for(const alliedHpPerRound of [0,100,250]){
  let hp=prison.maxHp,transferred=0,deniedEnemyActions=0;
  for(let round=0;round<prison.summonExpires-b.round+1;round++){const loss=Math.min(hp,alliedHpPerRound);hp-=loss;transferred+=loss*count;if(hp>0)deniedEnemyActions+=count;else break;}
  // Same remaining HP is copied to EACH captured target. No invented global
  // shared-damage cap. Targets here survive every hit, so this is a damage bound.
  assert(transferred<=prison.maxHp*count);assert(deniedEnemyActions<=count*4);
  eater.push({level,rank,capturedTargets:count,alliedHpPerRound,hpCapPerTarget:prison.maxHp,radius:200+15*rank,turns:prison.summonExpires-b.round+1,mp:e.manaCost(C.SKILLS.O14,owner),totalTransferred:transferred,paidAlliedDamage:prison.maxHp-hp,netCopiedDamage:transferred-(prison.maxHp-hp),deniedEnemyActions,setupActions:1});
 }
}
const rank6=reflection.find(r=>r.rank===6&&r.scenario==='mixed-rebound'),rank7=reflection.find(r=>r.rank===7&&r.scenario==='mixed-rebound');assert.equal(rank7.maxFrontier,rank6.maxFrontier);assert(rank7.expectedDamagePerMp>rank6.expectedDamagePerMp);
const at=(rank,count,rate)=>eater.find(r=>r.level===15&&r.rank===rank&&r.capturedTargets===count&&r.alliedHpPerRound===rate);
assert.equal(at(1,3,100).hpCapPerTarget,243);assert.equal(at(8,3,100).hpCapPerTarget,362);assert.equal(at(8,3,250).totalTransferred,1086);assert.equal(at(8,3,250).netCopiedDamage,724);assert.equal(at(8,0,250).totalTransferred,0);
const eaterMarginals=eater.filter(r=>r.rank>1).map(after=>{const before=eater.find(b=>b.level===after.level&&b.rank===after.rank-1&&b.capturedTargets===after.capturedTargets&&b.alliedHpPerRound===after.alliedHpPerRound);return {level:after.level,rank:after.rank,capturedTargets:after.capturedTargets,alliedHpPerRound:after.alliedHpPerRound,extraTransferredDamage:after.totalTransferred-before.totalTransferred,extraDeniedEnemyActions:after.deniedEnemyActions-before.deniedEnemyActions,extraAlliedDamageInvestment:after.paidAlliedDamage-before.paidAlliedDamage,mpSaved:before.mp-after.mp,radiusGain:after.radius-before.radius};});
const report={scope:'Conditional analytical sensitivity, not measured combat balance or browser play',legacy:{M11:plain(C.skillScoreBreakdown(C.SKILLS.M11)),O14:plain(C.skillScoreBreakdown(C.SKILLS.O14))},assumptions:{reflection:scenarios,initialProjectiles:1,unitHitTerminatesBranch:true,probabilitiesAreMeasured:false,trainingLevels:[7,15,30],activeCastShare:.25,activeMix:'25% of initially equal-damage/equal-cost casts use M11; both offense and cost budget are mixed with unchanged other casts',eater:'All targets survive; allies act before enemy each round; 0/100/250 actual prison HP loss per round; no credit for damage and control after prison destruction; no passive empowerment; no automatic acquisition-to-rank-1 marginal'},reference,reflection,eater,eaterMarginals,activeMarginals};
await mkdir('_local/reports/two-skill-balance',{recursive:true});await writeFile('_local/reports/two-skill-balance/quantitative-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('PASS reflection SP1–8 topology, .82 decay, conditional contacts and SP7 gain; eater 3 levels × 8 ranks × 4 target counts × 3 allied-damage schedules; live training reference');
console.log(JSON.stringify({reflection,activeMarginals,level15Eater:eater.filter(r=>r.level===15&&[1,8].includes(r.rank)&&r.capturedTargets===3),training:reference.filter(r=>r.level===15).map(({cls,scenario,utility})=>({cls,scenario,utility}))},null,2));
