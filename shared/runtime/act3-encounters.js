(function(G){'use strict';
const populationCap=G.HonroEncounters.populationCap;
G.HonroEncounters.populationCap=function(b){const cap=b.honroAct3EncounterPopulationCap;return !b.honroCustom&&b.honroAct3EncounterBudget?.version===1&&Number.isInteger(cap)&&cap>0?cap:populationCap(b);};
// Only the fresh authored revision opts in. Never retune or repopulate a live save.
function initialize(b){
 if(b.honroCustom||b.honroStage<21||b.honroStage>30||b.honroAct3EncounterRevision!==1)return;
 const st=G.HONRO_CONTENT.stages[b.honroStage-1];
 for(const u of b.units)tune(b,u,st);
 preserveInitialBudget(b,st);
}
function preserveInitialBudget(b,st){
 const spec=b.honroAct3EncounterBudget;
 if(spec?.version!==1||b.honroAct3EncounterBudgetApplied)return;
 const units=b.units.filter(u=>u.side===1&&u.honroAct3Encounter===1&&!u.honroObjectiveTarget),rows=Object.entries(spec.roster||{});
 if(!units.length||!rows.length||rows.some(([key,n])=>!Number.isInteger(n)||n<1||!G.HonroWorld.archetypes[key.replace(/\*$/,'')]))return;
 let targetHp=0,targetAttack=0,targetWeight=0;
 // Run the same archetype/skill migration, explicit elite and difficulty tuning
 // as the old roster. These temporary references never enter the battlefield.
 for(const[key,n]of rows){const elite=key.endsWith('*'),kind=key.replace(/\*$/,''),u=G.HonroWorld.createEnemy(b,st,0,kind,0,0,true);Object.assign(u,{side:1,honroAct3Encounter:1,honroAct3Elite:elite});tune(b,u,st);targetHp+=u.maxHp*n;targetAttack+=u.attack*n;targetWeight+=u.honroXpWeight*n;}
 const hpTotal=units.reduce((n,u)=>n+u.combatBaseHp,0),attackTotal=units.reduce((n,u)=>n+u.attack,0),weightTotal=units.reduce((n,u)=>n+u.honroXpWeight,0),d=G.HONRO_CORE.DIFFICULTIES[b.difficulty]||G.HONRO_CORE.DIFFICULTIES.normal;
 if(!(hpTotal>0&&attackTotal>0&&weightTotal>0))return;
 // Largest remainders preserve the exact integer HP sum at every difficulty.
 const allocations=units.map((u,i)=>{const exact=targetHp*u.combatBaseHp/hpTotal;return{u,i,hp:Math.floor(exact),fraction:exact-Math.floor(exact)};}),remaining=targetHp-allocations.reduce((n,a)=>n+a.hp,0);
 for(const a of [...allocations].sort((a,z)=>z.fraction-a.fraction||a.i-z.i).slice(0,remaining))a.hp++;
 for(const{u,hp}of allocations){u.hp=u.maxHp=hp;u.combatBaseHp=hp/d.hp;u.combatBaseAttack*=targetAttack/attackTotal;u.attack=u.combatBaseAttack*d.damage;u.honroXpWeight*=targetWeight/weightTotal;}
 b.honroAct3EncounterBudgetApplied={version:1,hp:targetHp,attack:targetAttack,xpWeight:targetWeight,initial:units.length};
}
function tune(b,u,st=G.HONRO_CONTENT.stages[b.honroStage-1]){if(u.side!==1||u.honroAct3Encounter!==1||u.honroAct3EncounterTuned)return;
  // Legacy index%11 promotion is not the authored roster. Resolve the explicit
  // guard/archer role first, then apply one difficulty-independent elite scale.
  u.elite=false;u.armor=.04;G.HonroProgression.tuneEnemy(st,u,u.honroVariant||u.honroType);
  if(u.honroAct3Elite){u.elite=true;u.name='정예 '+u.name;u.combatBaseHp*=1.55;u.combatBaseAttack*=1.15;u.honroXpWeight*=1.6;u.armor=.12;}
  const d=G.HONRO_CORE.DIFFICULTIES[b.difficulty]||G.HONRO_CORE.DIFFICULTIES.normal;
  u.hp=u.maxHp=Math.round(u.combatBaseHp*d.hp);u.attack=u.combatBaseAttack*d.damage;u.honroAct3EncounterTuned=true;
}
G.HonroAct3Encounters={initialize,tune};
})(globalThis);
